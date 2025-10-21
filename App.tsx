import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { ImageViewer } from './components/ImageViewer';
import { AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    imageSrcs: [],
    selectedImageIndex: 0,
    isLoading: false,
    error: null,
  });
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini-api-key') || '');

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini-api-key', key);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <ControlPanel
          setAppState={setAppState}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          apiKey={apiKey}
          setApiKey={handleApiKeyChange}
        />
        <ImageViewer 
          appState={appState} 
          setAppState={setAppState}
          aspectRatio={aspectRatio} 
        />
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Created by <a href="https://ahmadasri.web.id" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-400 transition">Ahmad Asri Zalmi</a></p>
      </footer>
    </div>
  );
};

export default App;