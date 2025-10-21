
import React from 'react';
import { AppState } from '../types';
import { Loader } from './Loader';
import { DownloadIcon } from './icons/DownloadIcon';
import { ImageIcon } from './icons/ImageIcon';

interface ImageViewerProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  aspectRatio: string;
}

const aspectRatioClasses: { [key: string]: string } = {
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
};

export const ImageViewer: React.FC<ImageViewerProps> = ({ appState, setAppState, aspectRatio }) => {
  const { imageSrcs, selectedImageIndex, isLoading, error } = appState;
  const containerClass = aspectRatioClasses[aspectRatio] || 'aspect-video';
  const currentImageSrc = imageSrcs[selectedImageIndex];

  const handleDownload = () => {
    if (!currentImageSrc) return;
    const link = document.createElement('a');
    link.href = currentImageSrc;
    link.download = `gemini-thumbnail-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sticky top-28">
      <div className={`${containerClass} bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300`}>
        {isLoading && <Loader />}
        
        {!isLoading && imageSrcs.length === 0 && (
          <div className="text-center text-gray-500">
            <ImageIcon className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Your thumbnail will appear here</h3>
            <p className="text-sm">Use the controls to generate an image.</p>
          </div>
        )}

        {currentImageSrc && (
          <img src={currentImageSrc} alt="Generated thumbnail" className={`object-contain w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-30' : 'opacity-100'}`} />
        )}
      </div>

      {imageSrcs.length > 1 && !isLoading && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {imageSrcs.map((src, index) => (
            <button
              key={index}
              onClick={() => setAppState(s => ({ ...s, selectedImageIndex: index }))}
              className={`relative aspect-video rounded-md overflow-hidden border-2 transition ${selectedImageIndex === index ? 'border-purple-500 scale-105' : 'border-transparent hover:border-gray-500'}`}
            >
              <img src={src} alt={`Thumbnail variant ${index + 1}`} className="object-cover w-full h-full" />
              {selectedImageIndex === index && <div className="absolute inset-0 bg-black/30"></div>}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {currentImageSrc && !isLoading && (
         <button
          onClick={handleDownload}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
        >
          <DownloadIcon className="w-5 h-5" />
          Download Selected Thumbnail
        </button>
      )}
    </div>
  );
};
