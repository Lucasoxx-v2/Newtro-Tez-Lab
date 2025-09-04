import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`bg-dark-secondary border border-gray-600 text-white placeholder-gray-400 text-sm rounded-lg focus:ring-accent focus:border-accent block w-full p-2.5 transition-colors duration-200 ${className}`}
      {...props}
    />
  );
};
