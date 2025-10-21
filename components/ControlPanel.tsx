import React, { useState, useRef } from 'react';
import { AppState, GenerationMode } from '../types';
import { generateThumbnailFromText, refineThumbnailFromImage, blobToBase64 } from '../services/geminiService';
import { PROMPT_CATEGORIES } from '../constants';
import { TextIcon } from './icons/TextIcon';
import { ImageIcon } from './icons/ImageIcon';

interface ControlPanelProps {
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  aspectRatio: string;
  setAspectRatio: React.Dispatch<React.SetStateAction<string>>;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const AspectRatioSelector: React.FC<{ aspectRatio: string; setAspectRatio: (ratio: string) => void; isVisible: boolean }> = ({ aspectRatio, setAspectRatio, isVisible }) => {
    if (!isVisible) return null;
    return (
        <div className="mb-4">
          <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
          <select 
            id="aspect-ratio" 
            value={aspectRatio} 
            onChange={(e) => setAspectRatio(e.target.value)} 
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-white"
          >
            <option value="16:9">16:9 (YouTube, Landscape)</option>
            <option value="9:16">9:16 (TikTok, Portrait)</option>
            <option value="1:1">1:1 (Instagram, Square)</option>
            <option value="4:3">4:3 (Traditional, Landscape)</option>
            <option value="3:4">3:4 (Traditional, Portrait)</option>
          </select>
        </div>
    );
};


export const ControlPanel: React.FC<ControlPanelProps> = ({ setAppState, aspectRatio, setAspectRatio, apiKey, setApiKey }) => {
  const [mode, setMode] = useState<GenerationMode>('text');
  const [prompt, setPrompt] = useState<string>('');
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [uploadedImage, setUploadedImage] = useState<{ file: File; base64: string } | null>(null);
  const [styleOption, setStyleOption] = useState<string>('');
  const [styleImage, setStyleImage] = useState<{ file: File; base64: string } | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(PROMPT_CATEGORIES[0]?.category || null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleFileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!apiKey) {
      setAppState(s => ({ ...s, error: 'Please enter your Gemini API Key.' }));
      return;
    }
    if (!prompt) {
      setAppState(s => ({ ...s, error: 'Please enter a prompt.' }));
      return;
    }
    setAppState({ imageSrcs: [], selectedImageIndex: 0, isLoading: true, error: null });
    try {
      const imageSrcs = await generateThumbnailFromText(apiKey, prompt, aspectRatio, numberOfImages);
      setAppState({ imageSrcs, selectedImageIndex: 0, isLoading: false, error: null });
    } catch (e: any) {
      setAppState({ imageSrcs: [], selectedImageIndex: 0, isLoading: false, error: e.message });
    }
  };

  const handleRefine = async () => {
    if (!apiKey) {
      setAppState(s => ({ ...s, error: 'Please enter your Gemini API Key.' }));
      return;
    }
    if (!uploadedImage) {
      setAppState(s => ({ ...s, error: 'Please upload an image.' }));
      return;
    }
    if (!prompt) {
      setAppState(s => ({ ...s, error: 'Please enter a refinement prompt.' }));
      return;
    }
    setAppState(s => ({ ...s, imageSrcs: s.imageSrcs, isLoading: true, error: null }));
    
    let finalPrompt = prompt;
    if (styleOption && !styleImage) {
        finalPrompt += `, in the style of a ${styleOption}`;
    }

    try {
      const imageSrc = await refineThumbnailFromImage(
        apiKey,
        uploadedImage.base64,
        uploadedImage.file.type,
        finalPrompt,
        styleImage?.base64,
        styleImage?.file.type
      );
      setAppState({ imageSrcs: [imageSrc], selectedImageIndex: 0, isLoading: false, error: null });
    } catch (e: any) {
      setAppState(s => ({ ...s, isLoading: false, error: e.message }));
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'base' | 'style') => {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await blobToBase64(file);
      if (type === 'base') {
        setUploadedImage({ file, base64 });
        setAppState(s => ({ ...s, imageSrcs: [base64], selectedImageIndex: 0, error: null }));
      } else {
        setStyleImage({ file, base64 });
        if (styleOption) setStyleOption(''); // Clear preset if custom is uploaded
      }
    }
  };
  
  const handleStyleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStyleOption(e.target.value);
    if (e.target.value && styleImage) {
        setStyleImage(null); // Clear custom image if preset is selected
        if(styleFileInputRef.current) styleFileInputRef.current.value = '';
    }
  }

  const renderTextToThumbnail = () => (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <AspectRatioSelector aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} isVisible={true} />
        <div className="mb-4">
            <label htmlFor="num-of-images" className="block text-sm font-medium text-gray-300 mb-2">Number of Results</label>
            <select
                id="num-of-images"
                value={numberOfImages}
                onChange={(e) => setNumberOfImages(parseInt(e.target.value, 10))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-white"
            >
                <option value="1">1 Image</option>
                <option value="2">2 Images</option>
                <option value="4">4 Images</option>
            </select>
        </div>
      </div>
      <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Describe your thumbnail</label>
      <textarea
        id="prompt"
        rows={5}
        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
        placeholder="e.g., A happy coder in front of a neon screen..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Example Prompts</h3>
        <div className="space-y-2">
            {PROMPT_CATEGORIES.map(({ category, examples }) => (
                <div key={category} className="bg-gray-700/50 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setOpenCategory(openCategory === category ? null : category)}
                        className="w-full flex justify-between items-center p-3 text-left font-semibold text-gray-200 hover:bg-gray-600/50 transition"
                    >
                        <span>{category}</span>
                        <svg className={`w-5 h-5 transition-transform ${openCategory === category ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    {openCategory === category && (
                        <div className="p-3 border-t border-gray-600">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {examples.map((p) => (
                                    <button 
                                      key={p.name} 
                                      onClick={() => setPrompt(p.prompt)} 
                                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-left transition text-gray-300 h-full"
                                      title={p.prompt}
                                    >
                                        <span className="font-bold">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
       <button
        onClick={handleGenerate}
        className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
      >
        Generate
      </button>
    </div>
  );

  const renderImageRefinement = () => (
    <div>
       <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300 mb-2">1. Upload your base image</label>
       <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'base')} className="hidden" id="image-upload"/>
       <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 transition">
        {uploadedImage ? `Selected: ${uploadedImage.file.name}` : 'Click to upload image'}
      </button>
      
      <div className="mt-6">
        <AspectRatioSelector aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} isVisible={false} />
      </div>


      <label htmlFor="style-select" className="block text-sm font-medium text-gray-300 mb-2 mt-6">2. Choose a Style (Optional)</label>
      <div className="grid grid-cols-2 gap-2">
         <select
            id="style-select"
            value={styleOption}
            onChange={handleStyleOptionChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-white"
        >
            <option value="">-- Select a preset style --</option>
            <option value="cartoon">Cartoon</option>
            <option value="oil painting">Oil Painting</option>
            <option value="vaporwave">Vaporwave</option>
            <option value="pixel art">Pixel Art</option>
            <option value="sketch">Sketch</option>
        </select>
        <div>
            <input type="file" accept="image/*" ref={styleFileInputRef} onChange={(e) => handleFileChange(e, 'style')} className="hidden" />
            <button onClick={() => styleFileInputRef.current?.click()} className="w-full text-sm p-2.5 h-full border border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition truncate">
                {styleImage ? `Style: ${styleImage.file.name}` : 'Or Upload Custom'}
            </button>
        </div>
      </div>

      <label htmlFor="refine-prompt" className="block text-sm font-medium text-gray-300 mb-2 mt-6">3. Describe your changes</label>
      <textarea
        id="refine-prompt"
        rows={3}
        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
        placeholder="e.g., Remove the background, add a party hat..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
       <button
        onClick={handleRefine}
        disabled={!uploadedImage}
        className="mt-6 w-full bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Refine Image
      </button>
    </div>
  );

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-2xl backdrop-blur-lg">
      <div className="mb-6 border-b border-gray-700 pb-6">
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">
          Gemini API Key
        </label>
        <input
          type="password"
          id="api-key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-white"
          placeholder="Enter your API key here"
        />
        <p className="text-xs text-gray-500 mt-1">
          Your key is stored in your browser. Get one from{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-400">
            Google AI Studio
          </a>.
        </p>
      </div>

      <div className="flex border-b border-gray-600 mb-6">
        <button onClick={() => setMode('text')} className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition ${mode === 'text' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>
          <TextIcon className="w-5 h-5" />
          Text-to-Thumbnail
        </button>
        <button onClick={() => setMode('image')} className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition ${mode === 'image' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
          <ImageIcon className="w-5 h-5" />
          Image Refinement
        </button>
      </div>
      {mode === 'text' ? renderTextToThumbnail() : renderImageRefinement()}
    </div>
  );
};