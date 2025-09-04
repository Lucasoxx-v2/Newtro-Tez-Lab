import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Nft } from '../types';
import { fetchCreationsByArtist } from '../services/objktService';
import { Checkbox } from './ui/Checkbox';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import NftCard from './NftCard';

interface ModalViewerProps {
  initialIndex?: number;
  onClose: () => void;
  artistAddress?: string;
  artistName?: string | null;
  nfts?: Nft[];
}

const PAGE_SIZE = 8;

/**
 * Preloads an NFT's media (image or video) by trying available IPFS gateways.
 * Resolves with the URL of the successfully loaded media source.
 * @param nft The NFT object containing media URLs.
 * @returns A promise that resolves with the successful source URL.
 */
const preloadMedia = (nft: Nft): Promise<string> => {
  return new Promise((resolve, reject) => {
    const sources = [...new Set([...(nft.displayUrl || []), ...(nft.imageUrl || [])])];
    if (sources.length === 0) {
      return reject(new Error(`No media sources found for NFT ${nft.id}.`));
    }

    let currentSourceIndex = 0;
    const isVideo = nft.mime?.startsWith('video/');

    const tryNextSource = () => {
      if (currentSourceIndex >= sources.length) {
        reject(new Error(`All media sources failed to load for NFT ${nft.id}.`));
        return;
      }

      const src = sources[currentSourceIndex];
      const element = isVideo ? document.createElement('video') : new Image();
      
      const cleanup = () => {
        element.removeEventListener('error', onError);
        if (isVideo) {
          (element as HTMLVideoElement).removeEventListener('canplay', onSuccess);
        } else {
          (element as HTMLImageElement).removeEventListener('load', onSuccess);
        }
      };

      const onSuccess = () => {
        cleanup();
        resolve(src);
      };

      const onError = () => {
        cleanup();
        currentSourceIndex++;
        tryNextSource();
      };

      element.addEventListener('error', onError);
      if (isVideo) {
        (element as HTMLVideoElement).addEventListener('canplay', onSuccess);
      } else {
        (element as HTMLImageElement).addEventListener('load', onSuccess);
      }
      
      element.src = src;
    };

    tryNextSource();
  });
};


const CarouselError = () => (
  <div className="flex flex-col items-center justify-center text-center text-gray-400 bg-dark-secondary/50 p-6 rounded-lg">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p className="font-semibold">Artwork Not Available</p>
    <p className="text-sm">The media for this piece could not be loaded.</p>
  </div>
);


const MediaViewer: React.FC<{ nft: Nft }> = ({ nft }) => {
  // Create a combined, unique list of all possible media sources, prioritizing displayUrl
  const allSources = useMemo(() => {
    const combined = [...(nft.displayUrl || []), ...(nft.imageUrl || [])];
    return [...new Set(combined)]; // Remove duplicates
  }, [nft.displayUrl, nft.imageUrl]);

  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // This effect resets the state when the NFT itself changes
  useEffect(() => {
    setCurrentSourceIndex(0);
    setIsLoading(true);
    setHasError(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [nft.id]);

  const advanceToNextSource = useCallback(() => {
    if (currentSourceIndex < allSources.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [currentSourceIndex, allSources.length]);

  const handleSuccess = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsLoading(false);
  };
  
  const handleError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    advanceToNextSource();
  };
  
  const currentSrc = allSources[currentSourceIndex];

  // Effect to handle the loading timeout
  useEffect(() => {
    // Only set a timeout if we are in a loading state and have a valid source to try
    if (isLoading && currentSrc) {
      timeoutRef.current = setTimeout(() => {
        console.warn(`Media timed out: ${currentSrc}. Trying next source.`);
        advanceToNextSource();
      }, 15000); // 15-second timeout

      // Cleanup function to clear the timeout if the component unmounts or the state changes
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [isLoading, currentSrc, advanceToNextSource]);

  if (hasError || allSources.length === 0) return <CarouselError />;
  
  const isVideo = nft.mime?.startsWith('video/');

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {isLoading && <div className="absolute w-12 h-12 border-4 border-dashed border-gray-600 rounded-full animate-spin"></div>}
      
      {currentSrc && (
        isVideo ? (
          <video
            key={currentSrc}
            src={currentSrc}
            autoPlay loop muted playsInline
            onCanPlay={handleSuccess}
            onError={handleError}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        ) : (
          <img
            key={currentSrc}
            src={currentSrc}
            alt={nft.name}
            onLoad={handleSuccess}
            onError={handleError}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        )
      )}
    </div>
  );
};


const ModalViewer: React.FC<ModalViewerProps> = ({ initialIndex = 0, onClose, artistAddress, artistName = null, nfts: propNfts }) => {
  // Data fetching state
  const [nfts, setNfts] = useState<Nft[] | null>(propNfts || null);
  const [isLoading, setIsLoading] = useState(!!artistAddress);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(!!artistAddress);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // UI state
  const [view, setView] = useState<'grid' | 'carousel'>(!!artistAddress ? 'grid' : 'carousel');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [isZoomModeActive, setIsZoomModeActive] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState('center center');
  const [isAutoSlide, setIsAutoSlide] = useState(true); // Default to ON
  const [slideInterval, setSlideInterval] = useState(25); // Default to 25 seconds
  const [isPaused, setIsPaused] = useState(false);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isFading, setIsFading] = useState(false);
  
  const imageRef = useRef<HTMLDivElement>(null);
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  
  // Effect to lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (!artistAddress) return;
    
    setIsLoading(true);
    fetchCreationsByArtist(artistAddress, 0)
      .then(initialNfts => {
        setNfts(initialNfts);
        setOffset(PAGE_SIZE);
        if (initialNfts.length < PAGE_SIZE) setHasMore(false);
      })
      .catch(err => {
        console.error("Failed initial NFT fetch", err);
        setError("Could not load this artist's artworks.");
      })
      .finally(() => setIsLoading(false));
  }, [artistAddress]);

  const fetchMoreNfts = useCallback(async () => {
    if (!hasMore || isLoadingMore || !artistAddress) return;
    
    setIsLoadingMore(true);
    try {
      const newNfts = await fetchCreationsByArtist(artistAddress, offset);
      setNfts(prevNfts => [...(prevNfts || []), ...newNfts]);
      setOffset(prevOffset => prevOffset + PAGE_SIZE);
      if (newNfts.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error("Failed to fetch more NFTs", err);
      setError("Could not load more artworks.");
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [artistAddress, offset, hasMore, isLoadingMore]);

  const currentNft = nfts?.[currentIndex];
  
  const resetZoom = useCallback(() => {
    setScale(1);
    setIsZoomModeActive(false);
  }, []);

  const goToIndex = useCallback((index: number) => {
    if (!nfts || isLoadingNext || isFading) return;
    
    if (index === currentIndex) return;

    if (index < 0) return;

    // Seamless infinite scroll logic
    if (index >= nfts.length) {
        if (hasMore && !isLoadingMore) {
            // Set the desired index and trigger a fetch. The useEffect below will handle navigation.
            targetIndexRef.current = index;
            fetchMoreNfts();
        }
        return;
    }

    setIsLoadingNext(true);
    const targetNft = nfts[index];

    preloadMedia(targetNft)
        .catch(err => {
            console.warn(`Preloading failed for index ${index}, but proceeding anyway.`, err);
        })
        .finally(() => {
            setIsLoadingNext(false);
            setIsFading(true);
            setTimeout(() => {
                setCurrentIndex(index);
                resetZoom();
                setIsFading(false);
            }, 300);
        });
  }, [nfts, hasMore, fetchMoreNfts, currentIndex, isLoadingNext, isFading, resetZoom, isLoadingMore]);
  
  const goToNext = useCallback(() => goToIndex(currentIndex + 1), [currentIndex, goToIndex]);
  const goToPrev = useCallback(() => goToIndex(currentIndex - 1), [currentIndex, goToIndex]);

  // Effect to handle navigation after more NFTs are loaded
  useEffect(() => {
    if (targetIndexRef.current !== null && nfts && targetIndexRef.current < nfts.length) {
      const target = targetIndexRef.current;
      targetIndexRef.current = null; // Clear the ref
      goToIndex(target); // Navigate to the intended index
    }
  }, [nfts, goToIndex]);

  const handleActivity = useCallback(() => {
    setIsUiVisible(true);
    if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
    activityTimeoutRef.current = setTimeout(() => setIsUiVisible(false), 3000);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleActivity();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); if(isAutoSlide) setIsPaused(prev => !prev); }
      if (e.key.toLowerCase() === 'h') { e.preventDefault(); setIsUiVisible(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose, isAutoSlide, handleActivity]);

  const handleGridClick = (index: number) => {
    setCurrentIndex(index);
    setView('carousel');
  };

  useEffect(() => {
    if (view === 'carousel') handleActivity();
    return () => { if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current); };
  }, [handleActivity, view]);
  
  useEffect(() => {
    if (!isAutoSlide || isPaused || view !== 'carousel' || isLoadingNext || isFading || isLoading || !nfts || nfts.length <= 1) {
        return;
    }

    const timeoutId = setTimeout(() => {
        // When auto-sliding at the end, seamlessly load more
        if (currentIndex === nfts.length - 1 && hasMore) {
            goToNext();
        } else {
            // Loop back to the beginning if at the end and no more to load
            goToIndex( (currentIndex + 1) % nfts.length);
        }
    }, slideInterval * 1000);

    return () => clearTimeout(timeoutId);
  }, [isAutoSlide, isPaused, view, isLoadingNext, isFading, isLoading, slideInterval, nfts, goToNext, goToIndex, hasMore, currentIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleActivity();
    if (scale <= 1 || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTransformOrigin(`${x}% ${y}%`);
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isZoomModeActive || !currentNft || currentNft.mime?.startsWith('video/')) return;
    if (view !== 'carousel') return;
    handleActivity();
    e.preventDefault();
    const newScale = scale - e.deltaY * 0.01;
    setScale(Math.min(Math.max(1, newScale), 5));
  };


  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentNft && !currentNft.mime?.startsWith('video/')) {
       if (scale > 1) {
         setScale(1);
         setIsZoomModeActive(false);
       } else {
         setScale(2.5);
         setIsZoomModeActive(true);
         setIsPaused(true); // Automatically pause auto-slide when zooming
       }
    }
  };

  const handleIntervalWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (!isAutoSlide) return;
    e.preventDefault();
    const change = e.deltaY < 0 ? 1 : -1; // scroll up increases, scroll down decreases
    setSlideInterval(prev => Math.max(1, prev + change));
  };

  return (
    <div 
        className={`fixed inset-0 z-50 animate-fade-in bg-black/90 backdrop-blur-md ${!isUiVisible ? 'cursor-none' : ''}`}
        onClick={onClose}
        onMouseMove={handleActivity}
        onWheel={handleWheel}
    >
      <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
        {view === 'grid' && (
           <div className="w-full h-full flex flex-col items-center justify-center p-8">
             <div className="text-center w-full max-w-[80vw]">
              <h3 className="text-2xl font-bold text-white mb-6">{artistName ? `${artistName}'s Artworks` : 'Recent Artworks'}</h3>
              {isLoading && !nfts?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square bg-dark-secondary rounded-lg animate-pulse" />)}
                </div>
              ) : error ? (
                <p className="text-red-400">{error}</p>
              ) : nfts && nfts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {nfts.map((nft, index) => (
                    <NftCard nft={nft} key={nft.id} onClick={() => handleGridClick(index)} />
                  ))}
                </div>
              ) : (
                 <div className="bg-dark-secondary p-8 rounded-lg text-center shadow-lg animate-fade-in">
                  <h3 className="text-xl font-bold text-white mb-4">No Artworks Found</h3>
                  <p className="text-gray-400 mb-6">This artist doesn't have any available creations to display.</p>
                  <Button onClick={onClose}>Close</Button>
                </div>
              )}
            </div>
           </div>
        )}

        {view === 'carousel' && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div 
                ref={imageRef}
                className={`relative w-full h-[85vh] flex items-center justify-center transition-opacity duration-300 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
                onMouseMove={handleMouseMove}
                onDoubleClick={toggleZoom}
                onClick={(e) => e.stopPropagation()}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin,
                  cursor: isZoomModeActive ? 'move' : 'default',
                  transition: 'transform 0.3s ease'
                }}
            >
              {isLoading && !currentNft ? (
                 <div className="w-12 h-12 border-4 border-dashed border-gray-600 rounded-full animate-spin"></div>
              ) : currentNft ? (
                <MediaViewer nft={currentNft} />
              ) : (
                <CarouselError />
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Persistent Info Block: Stays visible even when other UI hides */}
      {view === 'carousel' && currentNft && (
         <div 
          className="absolute bottom-4 right-4 p-2 rounded-md text-white text-right"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
          onClick={(e) => e.stopPropagation()} 
        >
          <a href={`https://objkt.com/asset/${currentNft.contractAddress}/${currentNft.tokenId}`} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium text-lg" onClick={(e) => e.stopPropagation()}>{currentNft.name}</a>
          <p className="text-sm text-gray-300 mt-0.5">{`by ${currentNft.creator.alias || currentNft.creator.address}`}</p>
        </div>
      )}

      {/* Container for UI elements that auto-hide */}
      <div className={`transition-opacity duration-300 ${(isUiVisible && view === 'carousel') || view === 'grid' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-accent z-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          {/* Controls only for carousel view */}
          {view === 'carousel' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); goToPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors backdrop-blur-sm disabled:opacity-20 disabled:cursor-not-allowed" disabled={currentIndex === 0 || isLoadingNext || isFading}><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg></button>
              <button onClick={(e) => { e.stopPropagation(); goToNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors backdrop-blur-sm disabled:opacity-20 disabled:cursor-not-allowed" disabled={(!nfts || (currentIndex === nfts.length - 1 && !hasMore)) || isLoadingNext || isFading || isLoadingMore}><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg></button>
    
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="absolute bottom-4 left-4 p-3 rounded-lg flex items-center flex-wrap gap-4 text-sm bg-black/50 backdrop-blur-sm"
              >
                  <div className="flex items-center gap-2">
                      <Checkbox id="autoslide-check" checked={isAutoSlide} onCheckedChange={(checked) => { setIsAutoSlide(checked as boolean); setIsPaused(false); }}>
                        <span className="text-white">Auto-Slide</span>
                      </Checkbox>
                      <Input
                        type="number"
                        value={slideInterval}
                        min="1"
                        onChange={(e) => setSlideInterval(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                        onWheel={handleIntervalWheel}
                        disabled={!isAutoSlide}
                        className="w-16 p-1 text-center bg-dark-primary/50 border-gray-600"
                        aria-label="Slide interval in seconds"
                      />
                      <span className="text-xs text-gray-400">sec</span>
                  </div>
              </div>
            </>
          )}
      </div>
    </div>
  );
};

export default ModalViewer;