import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

export const Header: React.FC = () => {
  return (
    <header className="py-4 px-8 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto flex items-center gap-3">
        <SparklesIcon className="w-8 h-8 text-purple-400" />
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
          Thumbnail Creator V.1
        </h1>
      </div>
    </header>
  );
};