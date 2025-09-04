import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTokens } from '../services/tzktService';
import type { Nft } from '../types';
import Loader from './Loader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Switch } from './ui/Switch';

// Add type declarations for the gifenc library loaded from the script tag in index.html
declare global {
  interface Window {
    gifenc?: {
      GIFEncoder: any;
      quantize: any;
      applyPalette: any;
    };
  }
}

const ARCHITYPES_CONTRACT = 'KT1J7jm7weHeTCGyb3q2smVgkbpsftyqHXQx';

const ComposedWord: React.FC<{ nfts: (Nft | string)[] }> = ({ nfts }) => {
    return (
        <div className="flex flex-wrap items-center justify-center gap-2 bg-black/70 p-4 rounded-lg border border-gray-700 min-h-32">
            {nfts.map((item, index) => {
                if (typeof item === 'string') {
                    return <div key={`space-${index}`} className="w-12 h-24"></div>;
                }
                return (
                    <div key={item.id} className="w-24 h-24 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
                        {item.imageUrl && <img src={item.imageUrl[0]} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                );
            })}
        </div>
    );
};

const Architypes: React.FC = () => {
  const [letterMap, setLetterMap] = useState<Record<string, Nft> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [composedNfts, setComposedNfts] = useState<(Nft | string)[] | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'PNG' | 'GIF'>('PNG');
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadArchitypes = async () => {
      try {
        const tokens = await fetchTokens(ARCHITYPES_CONTRACT, 1000);
        
        const backgroundNft = tokens.find(token => token.tokenId === '10');
        if (backgroundNft && backgroundNft.displayUrl) {
          setBackgroundVideoUrl(backgroundNft.displayUrl[0]);
        }

        const map: Record<string, Nft> = {};
        tokens.forEach(token => {
          const char = token.name.trim().toUpperCase();
          if (char.length === 1 && char >= 'A' && char <= 'Z') {
            if (!map[char]) {
              map[char] = token;
            }
          }
        });
        setLetterMap(map);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load Architypes collection.');
      } finally {
        setIsLoading(false);
      }
    };
    loadArchitypes();
  }, []);

  const handleCompose = useCallback(() => {
    if (!letterMap || !inputText) {
      setComposedNfts(null);
      return;
    }
    const characters = inputText.toUpperCase().split('');
    const nfts = characters.map(char => {
        if (char === ' ') return ' ';
        return letterMap[char] || null;
    }).filter(item => item !== null) as (Nft | string)[];
    setComposedNfts(nfts);
  }, [letterMap, inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCompose();
  };
  
  const handleExport = async () => {
    if (!composedNfts || !canvasRef.current || isExporting) return;
    setIsExporting(true);
    setError(null);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setError('Could not get canvas context.');
        setIsExporting(false);
        return;
    }

    try {
      if (exportFormat === 'PNG') {
        await exportAsPng(canvas, ctx, composedNfts, inputText);
      } else {
        if (!window.gifenc) {
          throw new Error("GIF library failed to load. Please check your connection and refresh.");
        }
        await exportAsGif(canvas, ctx, composedNfts, inputText);
      }
    } catch (err) {
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : "An error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-dark-primary rounded-lg p-4 sm:p-6 lg:p-8">
       {backgroundVideoUrl && (
        <>
          <video
            src={backgroundVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-dark-primary/70 z-10"></div>
        </>
      )}

      <div className="relative z-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">ARCHITYPES COMPOSER</h2>
        </div>

        <div className="max-w-3xl mx-auto text-left mb-12 bg-dark-secondary/80 backdrop-blur-sm p-6 rounded-lg border border-gray-700 shadow-lg">
          <h3 className="text-2xl font-bold text-accent mb-3">ARCHITYPES</h3>
          <p className="text-gray-300 leading-relaxed">
            Inspired by the collaborative project from{' '}
            <a 
              href="https://objkt.com/collections/exhibitions/projects/architypes-31554770/exhibition" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-accent hover:underline font-semibold"
            >
              Kristen Ross and Kerim Safa
            </a>
            , this composer allows you to engage with a living alphabet. Each letter is a unique, animated NFT, transforming language into a medium for digital art and value. 'Architypes' explores how meaning is constructed and circulated in our digitally native world, bridging the gap between typography, art, and the blockchain.
          </p>
        </div>

        {isLoading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-red-400 bg-red-900/20 p-3 rounded-md max-w-xl mx-auto">{error}</p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex items-center gap-2 mb-8">
              <Input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a word..."
                className="flex-grow"
              />
              <Button type="submit">Compose</Button>
            </form>
            
            {composedNfts && (
              <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
                <ComposedWord nfts={composedNfts} />
                {composedNfts.length > 0 && (
                  <div className="flex items-center gap-4 bg-dark-secondary/80 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${exportFormat === 'PNG' ? 'text-accent' : 'text-gray-400'}`}>PNG</span>
                      <Switch id="format-switch" checked={exportFormat === 'GIF'} onCheckedChange={(checked) => setExportFormat(checked ? 'GIF' : 'PNG')} />
                      <span className={`font-medium ${exportFormat === 'GIF' ? 'text-accent' : 'text-gray-400'}`}>GIF</span>
                    </div>
                    <Button onClick={handleExport} disabled={isExporting}>
                      {isExporting ? 'Exporting...' : `Export to ${exportFormat}`}
                    </Button>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const preloadImages = (composedNfts: (Nft | string)[]) => {
  return Promise.all(
    composedNfts.map(item => {
      return new Promise<HTMLImageElement | 'space' | 'error'>(resolve => {
        if (typeof item === 'string') return resolve('space');
        if (!item.imageUrl) return resolve('error');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = item.imageUrl[0];
        img.onload = () => resolve(img);
        img.onerror = () => resolve('error');
      });
    })
  );
};

const exportAsPng = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, composedNfts: (Nft | string)[], inputText: string) => {
  const nftSize = 128;
  canvas.width = composedNfts.reduce((acc, item) => acc + (typeof item === 'string' ? nftSize / 2 : nftSize), 0);
  canvas.height = nftSize;
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imageElements = await preloadImages(composedNfts);
  let currentX = 0;
  
  imageElements.forEach(imgEl => {
      if (imgEl instanceof HTMLImageElement) {
          ctx.drawImage(imgEl, currentX, 0, nftSize, nftSize);
          currentX += nftSize;
      } else if (imgEl === 'space') {
          currentX += nftSize / 2;
      } else { // 'error'
          ctx.fillStyle = '#333';
          ctx.fillRect(currentX, 0, nftSize, nftSize);
          currentX += nftSize;
      }
  });

  const dataUrl = canvas.toDataURL('image/png');
  triggerDownload(dataUrl, `architype-${inputText.trim().replace(/\s+/g, '_') || 'composed'}.png`);
};

const exportAsGif = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, composedNfts: (Nft | string)[], inputText: string) => {
    const { GIFEncoder, quantize, applyPalette } = window.gifenc!;
    const nftSize = 128;
    const delay = 400;
    const finalFrameDelay = 2000;
    
    canvas.width = composedNfts.reduce((acc, item) => acc + (typeof item === 'string' ? nftSize / 2 : nftSize), 0);
    canvas.height = nftSize;

    const imageElements = await preloadImages(composedNfts);
    const gif = GIFEncoder();

    for (let i = 1; i <= composedNfts.length; i++) {
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let currentX = 0;
        for (let j = 0; j < i; j++) {
            const imgEl = imageElements[j];
            if (imgEl instanceof HTMLImageElement) {
                ctx.drawImage(imgEl, currentX, 0, nftSize, nftSize);
                currentX += nftSize;
            } else if (imgEl === 'space') {
                currentX += nftSize / 2;
            } else { // 'error'
                ctx.fillStyle = '#333';
                ctx.fillRect(currentX, 0, nftSize, nftSize);
                currentX += nftSize;
            }
        }

        const frameDelay = (i === composedNfts.length) ? finalFrameDelay : delay;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const palette = quantize(data, 256, { format: 'rgba4444' });
        const index = applyPalette(data, palette, { format: 'rgba4444' });
        gif.writeFrame(index, canvas.width, canvas.height, { palette, delay: frameDelay });
    }

    gif.finish();
    const buffer = gif.bytesView();
    const blob = new Blob([buffer], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `architype-${inputText.trim().replace(/\s+/g, '_') || 'composed'}.gif`);
    URL.revokeObjectURL(url);
};


export default Architypes;