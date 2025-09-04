export interface TzKtToken {
  id: number;
  contract: {
    alias: string;
    address: string;
  };
  tokenId: string;
  standard: string;
  metadata: {
    name: string;
    description: string;
    displayUri?: string;
    artifactUri?: string;

    thumbnailUri?: string;
    creators?: string[];
    [key: string]: unknown;
  };
}

export interface Nft {
  id: number;
  tokenId: string;
  name: string;
  imageUrl: string[] | null;
  displayUrl: string[] | null;
  mime: string | null;
  contractAddress: string;
  creator: {
    address: string;
    alias?: string;
  };
}

export interface ContractInfo {
  alias: string;
  address: string;
  description?: string;
  timestamp?: string;
  creator: {
    address: string;
    alias?: string;
    twitter?: string;
  };
}

export interface AccountInfo {
  address: string;
  alias?: string;
  domain?: {
    name: string;
  };
}

export interface ArtistProfile {
  address: string;
  alias: string;
  pfpUrl: string;
  objktUrl: string;
  twitterUrl: string | null;
  instagramUrl: string | null;
}

export interface TutorialVideo {
  id: string;
  title: string;
  category: 'Tezos' | 'EVM' | 'Solana' | 'General';
}

export interface Event {
  id: string;
  title: string;
  date: string;
  summary: string;
  imageUrl: string;
  articleContent: string;
  involvedArtists?: string[];
  artistListContract?: string;
}

export interface CollectionSearchResult {
  address: string;
  name: string;
  description?: string;
  logo?: string[] | null;
}