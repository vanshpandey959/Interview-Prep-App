import React from 'react';

export const AudioVisualizer = () => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-8 my-2">
      <span className="w-1.5 h-full bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-1.5 h-full bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-1.5 h-full bg-indigo-500 rounded-full animate-bounce"></span>
      <span className="w-1.5 h-full bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-1.5 h-full bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    </div>
  );
};