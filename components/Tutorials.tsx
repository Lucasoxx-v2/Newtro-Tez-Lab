import React, { useState } from 'react';
import type { TutorialVideo } from '../types';
import VideoPlayerModal from './VideoPlayerModal';

const tutorialPlaylist: TutorialVideo[] = [
  { id: 'I7_NW0aFnBA', title: 'Cómo crear tu wallet en Coinbase', category: 'EVM' },
  { id: '-S5LwV1EMQM', title: 'Cómo registrar tu Basename', category: 'EVM' },
  { id: 'hT-Iqaxucjs', title: 'Cómo crear tu wallet Kukai de Tezos', category: 'Tezos' },
  { id: 'PrtIFx-xwOc', title: 'Cómo crear tu wallet Rainbow EVM', category: 'EVM' },
  { id: 'w1UMhZMxghI', title: 'Cómo hacer swap y bridge con Rainbow', category: 'EVM' },
  { id: 'o2mcpSUU9PQ', title: 'Cómo crear un perfil en OBJKT.com', category: 'Tezos' },
  { id: 'ufKk5hQy5wE', title: 'Cómo mintear en OBJKT.com', category: 'Tezos' },
  { id: 'lpGQXro2ykw', title: 'Cómo crear tu wallet Phantom de Solana', category: 'Solana' },
  { id: '5FGvQreFWq0', title: 'Cómo crear tu wallet Temple de Tezos', category: 'Tezos' },
  { id: '_jBs7h_bNMU', title: 'Cómo adquirir un Tezos Domain', category: 'Tezos' },
];

const categoryStyles: Record<TutorialVideo['category'], string> = {
  EVM: 'bg-evm-blue/80 hover:bg-evm-blue/100 border-evm-blue/90',
  Tezos: 'bg-tezos-green/80 hover:bg-tezos-green/100 border-tezos-green/90',
  Solana: 'bg-solana-purple/80 hover:bg-solana-purple/100 border-solana-purple/90',
  General: 'bg-dark-secondary hover:bg-gray-800 border-gray-700',
};

const Tutorials: React.FC = () => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const openVideoPlayer = (videoId: string) => {
    setSelectedVideoId(videoId);
  };

  const closeVideoPlayer = () => {
    setSelectedVideoId(null);
  };

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">Onboarding</h2>
        <p className="mt-2 text-lg text-gray-400">Tutorials and Cryptobasics.</p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {tutorialPlaylist.map((video) => (
          <button
            key={video.id}
            onClick={() => openVideoPlayer(video.id)}
            className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${categoryStyles[video.category]}`}
          >
            <p className="font-medium text-white">{video.title}</p>
          </button>
        ))}
      </div>

      {selectedVideoId && (
        <VideoPlayerModal videoId={selectedVideoId} onClose={closeVideoPlayer} />
      )}
    </section>
  );
};

export default Tutorials;