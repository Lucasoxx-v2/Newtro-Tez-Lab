import React from 'react';
import type { Nft } from '../types';
import NftCard from './NftCard';

interface NftGridProps {
  nfts: Nft[];
  onNftClick: (index: number) => void;
}

const NftGrid: React.FC<NftGridProps> = ({ nfts, onNftClick }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {nfts.map((nft, index) => (
        <NftCard key={nft.id} nft={nft} onClick={() => onNftClick(index)} />
      ))}
    </div>
  );
};

export default NftGrid;
