import React, { useState } from 'react';
import Header from './components/Header';
import CollectionExplorer from './components/CollectionExplorer';
import Architypes from './components/Architypes';
import NewtroDrops from './components/NewtroDrops';
import ArtistCatalog from './components/ArtistCatalog';
import Tutorials from './components/Tutorials';
import Events from './components/Events';

export type View = 'explorer' | 'architypes' | 'newtro' | 'artists' | 'tutorials' | 'events';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('explorer');

  return (
    <div className="min-h-screen bg-dark-primary text-gray-200 flex flex-col">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="p-4 sm:p-6 lg:p-8 container mx-auto flex-grow">
        {currentView === 'explorer' && <CollectionExplorer />}
        {currentView === 'newtro' && <NewtroDrops />}
        {currentView === 'artists' && <ArtistCatalog />}
        {currentView === 'events' && <Events />}
        {currentView === 'tutorials' && <Tutorials />}
        {currentView === 'architypes' && <Architypes />}

      </main>
      <footer className="text-center p-4 text-xs text-gray-500 border-t border-gray-800">
        <p>Built with React & Tailwind CSS. Data provided by <a href="https://tzkt.io/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">TzKT API</a> & <a href="https://objkt.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Objkt.com</a>.</p>
      </footer>
    </div>
  );
};

export default App;