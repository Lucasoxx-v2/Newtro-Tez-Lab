import React, { useState, useEffect } from 'react';
import type { Nft } from '../types';

interface NftCardProps {
  nft: Nft;
  onClick: () => void;
}

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const NftCard: React.FC<NftCardProps> = ({ nft, onClick }) => {
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset state when the underlying nft object changes
  useEffect(() => {
    setCurrentGatewayIndex(0);
    setImageLoaded(false);
    setHasError(false);
  }, [nft.id]);

  const imageSources = nft.imageUrl;
  const currentSrc = imageSources ? imageSources[currentGatewayIndex] : null;

  const handleImageError = () => {
    // If there are more gateways to try
    if (imageSources && currentGatewayIndex < imageSources.length - 1) {
      setCurrentGatewayIndex(prevIndex => prevIndex + 1);
    } else {
      // All gateways have failed
      setHasError(true);
      setImageLoaded(false);
    }
  };

  return (
    <div 
      className="group relative aspect-square bg-dark-secondary rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-accent transition-all duration-300 shadow-md hover:shadow-accent/20"
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {!imageLoaded && !hasError && <div className="w-6 h-6 border-2 border-dashed border-gray-600 rounded-full animate-spin"></div>}
        {hasError && <ErrorIcon />}
      </div>
      
      {!hasError && currentSrc && (
         <img
          key={currentSrc}
          src={currentSrc}
          alt={nft.name}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-all duration-300 ease-in-out group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
        />
      )}
      
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300" />
      <div className="absolute bottom-0 left-0 p-2 w-full bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-xs font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">{nft.name}</p>
      </div>
    </div>
  );
};

export default NftCard;
