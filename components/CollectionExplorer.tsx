import React, { useState, useCallback } from 'react';
import { fetchCollection } from '../services/collectionService';
import type { Nft, ContractInfo } from '../types';
import NftGrid from './NftGrid';
import ModalViewer from './ModalViewer';
import Loader from './Loader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const CollectionExplorer: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [collectionInfo, setCollectionInfo] = useState<ContractInfo | null>(null);
  const [nfts, setNfts] = useState<Nft[] | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedNftIndex, setSelectedNftIndex] = useState<number>(0);

  const handleFetchCollection = useCallback(async (address: string) => {
    if (!address.startsWith('KT1')) {
      setError('Please enter a valid Tezos contract address (starting with KT1).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCollectionInfo(null);
    setNfts(null);

    try {
      const { info, nfts: tokenData } = await fetchCollection(address);
      setCollectionInfo(info);
      setNfts(tokenData);
      if (tokenData.length === 0) {
        setError('No NFTs with displayable images were found for this collection.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = inputValue.trim();
    if (!term) return;
    handleFetchCollection(term);
  };

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
        <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">NFT Explorer</h2>
        <p className="mt-2 text-lg text-gray-400">Paste a Tezos contract ID to discover and showcase a collection.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex items-center gap-2 mb-8">
        <Input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Paste contract address (KT1...)"
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Explore'}
        </Button>
      </form>

      {isLoading && <Loader />}
      {error && <p className="text-center text-red-400 bg-red-900/20 p-3 rounded-md max-w-xl mx-auto">{error}</p>}

      {collectionInfo && nfts && (
        <div className="animate-fade-in">
          <div className="mb-8 p-4 bg-dark-secondary rounded-lg border border-gray-700 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-accent">{collectionInfo.alias}</h3>
            {collectionInfo.description && (
              <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{collectionInfo.description}</p>
            )}
            <div className="mt-3 text-sm text-gray-400 space-y-1">
              <p>
                Created by: {collectionInfo.creator.twitter ? (
                  <a 
                    href={collectionInfo.creator.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-gray-300 hover:text-accent hover:underline"
                  >
                    {collectionInfo.creator.alias || collectionInfo.creator.address}
                  </a>
                ) : (
                  <span className="font-mono text-gray-300">{collectionInfo.creator.alias || collectionInfo.creator.address}</span>
                )}
              </p>
              <p>
                Contract: <a href={`https://tzkt.io/${collectionInfo.address}`} target="_blank" rel="noopener noreferrer" className="font-mono text-gray-300 hover:text-accent hover:underline">{collectionInfo.address}</a>
              </p>
              <p>
                This collection has {nfts.length} artworks.
              </p>
            </div>
          </div>
           {nfts.length > 0 && <NftGrid nfts={nfts} onNftClick={openModal} />}
        </div>
      )}

      {isModalOpen && nfts && (
        <ModalViewer
          nfts={nfts}
          initialIndex={selectedNftIndex}
          onClose={closeModal}
        />
      )}
    </section>
  );
};

export default CollectionExplorer;