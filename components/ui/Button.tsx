import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`bg-accent text-dark-primary font-semibold py-2 px-4 rounded-md transition-all duration-200 hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-dark-primary disabled:bg-gray-500 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
