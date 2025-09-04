import React, { useState, useEffect } from 'react';
import type { ArtistProfile } from '../types';
import { fetchNewtroArtistProfiles } from '../services/objktService';
import { cacheService } from '../services/cachingService';
import ArtistCard from './ArtistCard';
import Loader from './Loader';
import ModalViewer from './ModalViewer';

const ArtistCatalog: React.FC = () => {
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<{ address: string; alias: string } | null>(null);

  useEffect(() => {
    const ARTIST_CACHE_KEY = 'newtroArtistProfiles';
    const CACHE_TTL_SECONDS = 3600; // 1 hour

    const fetchAndCacheArtists = async () => {
      // Don't show the main loader if we are revalidating in the background
      if (artists.length === 0) {
        setIsLoading(true);
      }
      
      try {
        console.log("Fetching fresh artist profiles from API...");
        const profiles = await fetchNewtroArtistProfiles();
        profiles.sort((a, b) => a.alias.localeCompare(b.alias));
        
        setArtists(profiles);
        setError(null); // Clear previous errors on success
        cacheService.set(ARTIST_CACHE_KEY, profiles, CACHE_TTL_SECONDS);
        console.log("Artist profiles cached.");

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while fetching artist profiles.';
        // Only show a prominent error if we have nothing cached to display
        if (artists.length === 0) {
            setError(errorMessage);
        }
        console.error("Failed to revalidate artist profiles:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    // On component mount, check the cache first.
    const cachedData = cacheService.get<ArtistProfile[]>(ARTIST_CACHE_KEY);
    
    if (cachedData.value) {
      console.log(`Loading artist profiles from cache. Is stale: ${cachedData.isStale}`);
      setArtists(cachedData.value);
      setIsLoading(false); // We have data to show instantly, so no main loading state.
      
      if (cachedData.isStale) {
        // Data is stale, revalidate in the background.
        // We wrap it in a timeout to allow the initial render from cache to complete.
        setTimeout(fetchAndCacheArtists, 1);
      }
    } else {
      // No data in cache, do a full fetch with a loading screen.
      fetchAndCacheArtists();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleShowWorks = (artistAddress: string, artistAlias: string) => {
    setSelectedArtist({ address: artistAddress, alias: artistAlias });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArtist(null);
  };

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">INDEX</h2>
        <p className="mt-2 text-lg text-gray-400">Discover the artists behind the Newtro Arts Collective (S.E.E.D. artists included)</p>
      </div>

      {isLoading && <Loader />}
      {error && <p className="text-center text-red-400 bg-red-900/20 p-3 rounded-md max-w-xl mx-auto">{error}</p>}
      
      {!isLoading && !error && artists.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {artists.map(artist => (
            <ArtistCard key={artist.address} artist={artist} onShowWorks={handleShowWorks} />
          ))}
        </div>
      )}

      {!isLoading && !error && artists.length === 0 && (
        <p className="text-center text-gray-400">No artist profiles could be found.</p>
      )}

      {isModalOpen && selectedArtist && (
        <ModalViewer 
          artistAddress={selectedArtist.address}
          artistName={selectedArtist.alias}
          onClose={handleCloseModal}
        />
      )}
    </section>
  );
};

export default ArtistCatalog;