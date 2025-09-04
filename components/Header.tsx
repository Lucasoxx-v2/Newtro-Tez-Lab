import React from 'react';
import type { View } from '../App';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavButton: React.FC<{
    view: View;
    currentView: View;
    onClick: (view: View) => void;
    children: React.ReactNode;
}> = ({ view, currentView, onClick, children }) => (
    <button
      onClick={() => onClick(view)}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        currentView === view
          ? 'bg-accent text-dark-primary'
          : 'bg-transparent text-gray-300 hover:bg-dark-secondary hover:text-white'
      }`}
    >
      {children}
    </button>
);


const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  return (
    <header className="bg-dark-secondary/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h1 className="text-xl font-bold text-white">Tez Lab</h1>
          </div>
          <nav className="flex items-center space-x-1 bg-gray-800 p-1 rounded-lg">
            <NavButton view="explorer" currentView={currentView} onClick={setCurrentView}>Explorer</NavButton>
            <NavButton view="newtro" currentView={currentView} onClick={setCurrentView}>Collective Drops</NavButton>
            <NavButton view="artists" currentView={currentView} onClick={setCurrentView}>Newtro Index</NavButton>
            <NavButton view="events" currentView={currentView} onClick={setCurrentView}>Events</NavButton>
            <NavButton view="architypes" currentView={currentView} onClick={setCurrentView}>Experiments</NavButton>
            <NavButton view="tutorials" currentView={currentView} onClick={setCurrentView}>Tutorials</NavButton>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;