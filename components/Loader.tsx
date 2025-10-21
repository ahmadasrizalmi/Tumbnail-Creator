
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
      <div className="w-16 h-16 border-4 border-t-purple-400 border-gray-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-gray-200">Generating...</p>
      <p className="text-sm text-gray-400">AI is thinking, please wait.</p>
    </div>
  );
};
   