import React, { useState, useEffect } from 'react';
import type { ArtistProfile } from '../types';

interface ArtistCardProps {
  artist: ArtistProfile;
  onShowWorks: (address: string, alias: string) => void;
}

const PALETTE = [
  'bg-slate-800', 'bg-gray-800', 'bg-zinc-800', 'bg-neutral-800', 
  'bg-stone-800', 'bg-red-800', 'bg-orange-800', 'bg-amber-800', 
  'bg-yellow-800', 'bg-lime-800', 'bg-green-800', 'bg-emerald-800', 
  'bg-teal-800', 'bg-cyan-800', 'bg-sky-800', 'bg-blue-800', 
  'bg-indigo-800', 'bg-violet-800', 'bg-purple-800', 'bg-fuchsia-800', 
  'bg-pink-800', 'bg-rose-800'
];

// Simple hashing function to get a deterministic color from the palette
const getDeterministicColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % PALETTE.length);
  return PALETTE[index];
};


const PlaceholderPfp = ({ colorClass }: { colorClass: string }) => (
    <div className={`w-full h-full ${colorClass} flex items-center justify-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    </div>
);

const ImageLoader = () => (
    <div className="w-full h-full bg-dark-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-dashed border-gray-600 rounded-full animate-spin"></div>
    </div>
);

const ObjktIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => <svg viewBox="0 0 24 24" fill="currentColor" className={['w-5 h-5', className].filter(Boolean).join(' ')} {...props}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 12m-5 0a5 5 0 1010 0 5 5 0 10-10 0"/></svg>;
const TwitterIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => <svg viewBox="0 0 24 24" fill="currentColor" className={['w-5 h-5', className].filter(Boolean).join(' ')} {...props}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>;
const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => <svg viewBox="0 0 24 24" fill="currentColor" className={['w-5 h-5', className].filter(Boolean).join(' ')} {...props}><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4.5-5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>;

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onShowWorks }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [copied, setCopied] = useState(false);

    // Reset state when the artist changes
    useEffect(() => {
        setImageLoaded(false);
        setHasError(false);
    }, [artist.address, artist.pfpUrl]);

    const placeholderColor = getDeterministicColor(artist.address);

    const handleShowWorksClick = () => {
        onShowWorks(artist.address, artist.alias);
    };
    
    const handleCopyAddress = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the modal
        navigator.clipboard.writeText(artist.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shortAddress = `${artist.address.slice(0, 6)}...${artist.address.slice(-4)}`;

  return (
    <div 
        onClick={handleShowWorksClick}
        title={`View works by ${artist.alias}`}
        className="group relative aspect-square bg-dark-secondary rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-accent transition-all duration-300 shadow-lg hover:shadow-accent/20 transform hover:-translate-y-1"
    >
        {/* Background Image & Placeholders */}
        <div className="absolute inset-0">
            {!imageLoaded && !hasError && <ImageLoader />}
            {hasError && <PlaceholderPfp colorClass={placeholderColor} />}
            <img 
                key={artist.pfpUrl} // Use key to force re-render when URL changes
                src={artist.pfpUrl}
                alt={`${artist.alias}'s profile picture`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                    console.warn(`Failed to load PFP: ${artist.pfpUrl}`);
                    setHasError(true);
                }}
                className={`w-full h-full object-cover absolute top-0 left-0 transition-all duration-500 ease-in-out group-hover:scale-110 ${imageLoaded && !hasError ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
            />
        </div>
        
        {/* Overlay with info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <h3 className="font-bold text-white text-base truncate" title={artist.alias}>
                {artist.alias}
            </h3>
            
            <div className="flex items-center justify-between mt-1">
                 <button
                    onClick={handleCopyAddress}
                    className="text-xs text-gray-400 font-mono hover:text-white transition-colors duration-150"
                    title="Copy address"
                >
                    {copied ? 'Copied!' : shortAddress}
                </button>
                <div className="flex items-center gap-3">
                    <a
                        href={artist.objktUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="View on Objkt.com"
                        className="text-gray-300 hover:text-white transition-colors"
                    >
                        <ObjktIcon />
                    </a>
                    {artist.twitterUrl && (
                        <a
                            href={artist.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="View on Twitter/X"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            <TwitterIcon />
                        </a>
                    )}
                    {artist.instagramUrl && (
                        <a
                            href={artist.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="View on Instagram"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            <InstagramIcon />
                        </a>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ArtistCard;