import React, { useMemo, useState, useEffect } from 'react';
import type { Event } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { fetchTokensFromObjkt } from '../services/objktService';

interface DynamicArtist {
  name: string;
  link: string;
}

const generateId = (text: string) => {
  return text.toLowerCase()
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/[^\w-]+/g, '')   // Remove all non-word chars
    .replace(/--+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')        // Trim - from start of text
    .replace(/-+$/, '');       // Trim - from end of text
};


const EventDetail: React.FC<{ event: Event }> = ({ event }) => {
  const [dynamicArtists, setDynamicArtists] = useState<DynamicArtist[] | null>(null);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  
  const headings = useMemo(() => {
    if (!event.articleContent) return [];
    return event.articleContent
      .split('\n')
      .filter(line => line.startsWith('## ') || line.startsWith('### '))
      .map(line => {
        const level = line.startsWith('### ') ? 3 : 2;
        const text = line.replace(/^[#]+\s/, '').trim();
        return { level, text, id: generateId(text) };
      });
  }, [event.articleContent]);

  useEffect(() => {
    const fetchArtists = async () => {
      if (!event.artistListContract) {
        setDynamicArtists(null);
        return;
      }

      setIsLoadingArtists(true);
      setDynamicArtists(null);
      try {
        const tokens = await fetchTokensFromObjkt(event.artistListContract);
        const creatorMap = new Map<string, { name: string; tokenId: string }>();

        // Get one token per creator to link to
        tokens.forEach(token => {
          const creatorAddress = token.creator.address;
          if (!creatorMap.has(creatorAddress)) {
            creatorMap.set(creatorAddress, {
              name: token.creator.alias || creatorAddress,
              tokenId: token.tokenId,
            });
          }
        });

        const artists = Array.from(creatorMap.values()).map(creator => ({
          name: creator.name,
          link: `https://objkt.com/asset/${event.artistListContract}/${creator.tokenId}`,
        }));
        
        artists.sort((a, b) => a.name.localeCompare(b.name));
        setDynamicArtists(artists);

      } catch (error) {
        console.error("Failed to fetch dynamic artist list:", error);
      } finally {
        setIsLoadingArtists(false);
      }
    };

    fetchArtists();
  }, [event.artistListContract]);

  const staticArtists = event.involvedArtists;
  const hasSidebarContent = headings.length > 0 || !!staticArtists || !!event.artistListContract;

  return (
    <div className="p-6 sm:p-8 bg-dark-primary/50 rounded-lg">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of Contents & Artists (Sticky on large screens) */}
        {hasSidebarContent && (
          <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start">
              <div className="space-y-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">In this article</h4>
                {headings.length > 0 && (
                    <nav>
                      <ul>
                        {headings.map(heading => (
                          <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}>
                            <a 
                              href={`#${heading.id}`} 
                              className="block py-1 text-gray-300 hover:text-accent transition-colors duration-200"
                            >
                              {heading.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                )}
                
                {isLoadingArtists && <div className="mt-4 text-sm text-gray-400">Loading artists...</div>}
                
                {dynamicArtists && dynamicArtists.length > 0 && (
                  <ul className="space-y-1 mt-4 border-t border-gray-700 pt-4">
                    {dynamicArtists.map((artist) => (
                      <li key={artist.name}>
                        <a href={artist.link} target="_blank" rel="noopener noreferrer" className="text-gray-300 text-sm hover:text-accent hover:underline">
                           {artist.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                
                {staticArtists && staticArtists.length > 0 && !dynamicArtists && (
                  <ul className="space-y-1 mt-4 border-t border-gray-700 pt-4">
                    {staticArtists.map((artist, index) => (
                      <li key={index} className="text-gray-300 text-sm">
                        {artist}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
          </aside>
        )}
        
        {/* Article Content */}
        <article className={hasSidebarContent ? "lg:col-span-3" : "lg:col-span-4"}>
           <MarkdownRenderer content={event.articleContent} />
        </article>
      </div>
    </div>
  );
};

export default EventDetail;
