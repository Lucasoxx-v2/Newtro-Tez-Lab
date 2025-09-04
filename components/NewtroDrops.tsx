import React, { useState, useEffect, useCallback } from 'react';
import { fetchInfoWithFallback, fetchTokensWithFallback } from '../services/collectionService';
import type { Nft, ContractInfo } from '../types';
import NftGrid from './NftGrid';
import ModalViewer from './ModalViewer';
import Loader from './Loader';

const CURATED_CONTRACTS = [
  "KT1SnjkFfEjcJDAHXrj8GoLq174ZNjyKbXgG",
  "KT1Muk6E8Ma2nkZJjseFzp172aoCHr9frsjh",
  "KT1C2rNotE5J4Db59CttRVim3JNR8jG5D9Jg",
  "KT1WiA72WSP5pCzVjEqhW2GRhBU3q5yRcHQf",
  "KT1Ro7fyAmAiLmLignzzCeT9Q25UMgh9pWkf",
  "KT1J8M5XSf7neu3efyuQ9aywPXDuChWnMNLX",
  "KT1QAty51CrHwSPQMs1fafHdYGLHK3Z7bsSG",
  "KT1CngY7393gtBsE4Ynk3cGm1Mov55Z2aNo9",
  "KT1VBCWocKcFbQEgtN9ioN5AwyWXGgdwsjDt"
];

const NewtroDrops: React.FC = () => {
  const [menuItems, setMenuItems] = useState<ContractInfo[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  
  const [selectedCollection, setSelectedCollection] = useState<{ info: ContractInfo; nfts: Nft[] } | null>(null);
  const [isCollectionLoading, setIsCollectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedNftIndex, setSelectedNftIndex] = useState<number>(0);

  useEffect(() => {
    const fetchMenuData = async () => {
      setIsMenuLoading(true);
      setError(null);
      try {
        // Use the robust fetcher with fallbacks for each menu item.
        const promises = CURATED_CONTRACTS.map(address => 
          fetchInfoWithFallback(address).catch(e => {
            console.error(`Failed to fetch info for menu item ${address}:`, e);
            return null; // Return null on failure so Promise.all doesn't reject.
          })
        );
        const results = (await Promise.all(promises)).filter(r => r !== null) as ContractInfo[];

        const processedResults = results.map(item => {
          if (item.address === "KT1C2rNotE5J4Db59CttRVim3JNR8jG5D9Jg") {
            return { ...item, alias: "Newtro Arts Fair" };
          }
          if (item.alias.toLowerCase().includes('onboarding') && item.timestamp) {
            const date = new Date(item.timestamp);
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            return { ...item, alias: `Onboarding Drop | ${month} ${year}` };
          }
          return item;
        });

        processedResults.sort((a, b) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        setMenuItems(processedResults);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load curated collections.');
      } finally {
        setIsMenuLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  const handleCollectionSelect = useCallback(async (address: string) => {
    if (isCollectionLoading) return;
    setIsCollectionLoading(true);
    setError(null);
    setSelectedCollection(null);

    try {
      const info = menuItems.find(item => item.address === address);
      if (!info) {
        throw new Error(`Could not find pre-fetched info for ${address}.`);
      }
      
      // Use the robust token fetcher with fallbacks.
      const nfts = await fetchTokensWithFallback(address);

      if (nfts.length === 0) {
        setError('No NFTs with displayable images were found for this collection.');
      }

      setSelectedCollection({ info, nfts });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      console.error(e);
    } finally {
      setIsCollectionLoading(false);
    }
  }, [isCollectionLoading, menuItems]);

  const openModal = (index: number) => {
    setSelectedNftIndex(index);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">Newtro Collective Drops</h2>
        <p className="mt-2 text-lg text-gray-400">Our culture lives forever on the blockchain.</p>
      </div>

      {isMenuLoading ? (
        <Loader />
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {menuItems.map(item => (
            <button
              key={item.address}
              onClick={() => handleCollectionSelect(item.address)}
              disabled={isCollectionLoading}
              className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border-2
                ${selectedCollection?.info.address === item.address
                  ? 'bg-accent text-dark-primary border-accent'
                  : 'bg-dark-secondary text-gray-300 border-gray-700 hover:border-accent hover:text-white disabled:opacity-50'
                }`}
            >
              {item.alias}
            </button>
          ))}
        </div>
      )}

      {isCollectionLoading && <Loader />}
      {error && !isCollectionLoading && <p className="text-center text-red-400 bg-red-900/20 p-3 rounded-md max-w-xl mx-auto">{error}</p>}

      {selectedCollection && !isCollectionLoading && (
        <div className="animate-fade-in">
          <div className="mb-8 p-4 bg-dark-secondary rounded-lg border border-gray-700 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-accent">{selectedCollection.info.alias}</h3>
            {selectedCollection.info.description && (
              <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{selectedCollection.info.description}</p>
            )}
            <div className="mt-3 text-sm text-gray-400 space-y-1">
               <p>
                Created by: <a href="https://objkt.com/profile/newtroarts" target="_blank" rel="noopener noreferrer" className="font-mono text-gray-300 hover:text-accent hover:underline">
                    Newtro Gallery on OBJKT.com
                  </a>
              </p>
              <p>
                Contract: <a href={`https://tzkt.io/${selectedCollection.info.address}`} target="_blank" rel="noopener noreferrer" className="font-mono text-gray-300 hover:text-accent hover:underline">{selectedCollection.info.address}</a>
              </p>
              <p>
                This collection has {selectedCollection.nfts.length} amazing pieces.
              </p>
            </div>
          </div>
          
          {selectedCollection.nfts.length > 0 ? (
            <NftGrid nfts={selectedCollection.nfts} onNftClick={openModal} />
          ) : (
             <p className="text-center text-gray-400">This collection has no displayable NFTs.</p>
          )}
        </div>
      )}

      {isModalOpen && selectedCollection && (
        <ModalViewer
          nfts={selectedCollection.nfts}
          initialIndex={selectedNftIndex}
          onClose={closeModal}
        />
      )}
    </section>
  );
};

export default NewtroDrops;