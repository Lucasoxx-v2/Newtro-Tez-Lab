import type { ContractInfo, Nft, ArtistProfile, CollectionSearchResult } from '../types';

const GQL_ENDPOINT = 'https://data.objkt.com/v3/graphql';

const IPFS_GATEWAYS = [
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

const normalizeIpfsUrl = (url: string | undefined | null): string[] | null => {
  if (!url) return null;
  if (url.startsWith('ipfs://')) {
    const hash = url.substring(7);
    return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
  }
  if (url.startsWith('http')) {
    return [url];
  }
  return null;
};

const generatePfpUrl = (twitterUrl: string | null, address: string): string => {
  if (twitterUrl) {
    const match = twitterUrl.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
    const username = match ? match[1] : null;
    if (username) {
      return `https://unavatar.io/twitter/${username}`;
    }
  }
  // Fallback to a unique, deterministic blocky avatar based on the Tezos address.
  return `https://unavatar.io/tezos/${address}?fallback=false`;
};


// --- GraphQL Queries for different Objkt API schemas ---

const GET_COLLECTION_QUERY_V2 = `
query GetGalleryCollectionInfoV2($address: String!) {
  collection(where: {address: {_eq: $address}}, limit: 1) {
    name
    description
    timestamp
    creator { address tzdomain alias twitter }
    tokens(limit: 1, order_by: {token_id: asc}) {
      creators { holder { address tzdomain alias twitter } }
    }
  }
}
`;

const GET_TOKENS_QUERY_V2 = `
query GetCollectionTokensV2($address: String!) {
  collection(where: {address: {_eq: $address}}, limit: 1) {
    tokens(limit: 500, order_by: {pk: desc}) {
      pk token_id name display_uri thumbnail_uri
      creators(limit: 1) { holder { address tzdomain alias } }
    }
  }
}
`;

const GET_COLLECTION_QUERY_V1 = `
query GetGalleryCollectionInfoV1($address: String!) {
  fa(where: {contract: {_eq: $address}}, limit: 1) {
    name
    description
    timestamp
    creator { address tzdomain alias twitter }
    tokens(limit: 1, order_by: {token_id: asc}) {
      creators { holder { address tzdomain alias twitter } }
    }
  }
}
`;

const GET_TOKENS_QUERY_V1 = `
query GetCollectionTokensV1($address: String!) {
  fa(where: {contract: {_eq: $address}}, limit: 1) {
    tokens(limit: 500, order_by: {pk: desc}) {
      pk token_id name display_uri thumbnail_uri
      creators(limit: 1) { holder { address tzdomain alias } }
    }
  }
}
`;

const GET_ARTIST_PROFILES_QUERY = `
  query GetArtistProfiles($addresses: [String!]) {
    holder(where: {address: {_in: $addresses}}) {
      address
      tzdomain
      alias
      twitter
      instagram
    }
  }
`;

const GET_CREATIONS_BY_ARTIST_QUERY = `
  query GetCreationsByArtist($address: String!, $offset: Int!) {
    token(
      where: {
        creators: { holder: { address: { _eq: $address } } },
        supply: { _gt: 0 }
      },
      order_by: { pk: desc },
      limit: 8,
      offset: $offset
    ) {
      pk
      token_id
      name
      display_uri
      artifact_uri
      thumbnail_uri
      mime
      fa {
        contract
      }
      creators(limit: 1) {
        holder {
          address
          tzdomain
          alias
        }
      }
    }
  }
`;

const SEARCH_COLLECTIONS_QUERY_V2 = `
query SearchCollectionsV2($search: String!) {
  collection(
    where: {
      _or: [
        { name: { _ilike: $search } },
        { description: { _ilike: $search } }
      ]
    },
    limit: 20,
    order_by: { tokens_aggregate: { count: desc } }
  ) {
    address
    name
    description
    logo
  }
}
`;

const SEARCH_COLLECTIONS_QUERY_V1 = `
query SearchCollectionsV1($search: String!) {
  fa(
    where: {
      _or: [
        { name: { _ilike: $search } },
        { description: { _ilike: $search } }
      ],
      tokens_aggregate: {count: {predicate: {_gt: 0}}}
    },
    limit: 20,
    order_by: { tokens_aggregate: { count: desc } }
  ) {
    contract
    name
    description
    logo
  }
}
`;


// --- TypeScript Interfaces for GraphQL responses ---

interface GqlError { message: string; }
interface GqlCreatorData { address: string; tzdomain: string | null; alias: string | null; twitter: string | null; }
interface GqlCollectionData {
  name: string;
  description: string;
  timestamp: string;
  creator: GqlCreatorData | null;
  tokens: { creators: { holder: GqlCreatorData }[] }[];
}
interface GqlCollectionResponse {
  data?: { collection?: GqlCollectionData[]; fa?: GqlCollectionData[]; };
  errors?: GqlError[];
}
interface GqlTokenData {
  token_id: string; pk: number; name: string; display_uri: string; thumbnail_uri: string;
  creators: { holder: { address: string; tzdomain: string | null; alias: string | null; } }[];
}
interface GqlTokensResponse {
  data?: { collection?: { tokens: GqlTokenData[] }[]; fa?: { tokens: GqlTokenData[] }[]; };
  errors?: GqlError[];
}

interface GqlArtistProfileData {
  address: string;
  tzdomain: string | null;
  alias: string | null;
  twitter: string | null;
  instagram: string | null;
}
interface GqlArtistProfileResponse {
  data?: { holder: GqlArtistProfileData[] };
  errors?: GqlError[];
}

interface GqlArtistCreationData {
  pk: number;
  token_id: string;
  name: string;
  display_uri: string | null;
  artifact_uri: string | null;
  thumbnail_uri: string | null;
  mime: string | null;
  fa: {
    contract: string;
  };
  creators: {
    holder: {
      address: string;
      tzdomain: string | null;
      alias: string | null;
    };
  }[];
}
interface GqlArtistCreationsResponse {
  data?: { token: GqlArtistCreationData[] };
  errors?: GqlError[];
}

interface GqlCollectionSearchDataV2 { address: string; name: string; description: string; logo: string | null; }
interface GqlCollectionSearchDataV1 { contract: string; name: string; description: string; logo: string | null; }
interface GqlCollectionSearchResponse {
    data?: { collection?: GqlCollectionSearchDataV2[], fa?: GqlCollectionSearchDataV1[] };
    errors?: GqlError[];
}


// --- Helper function to execute GraphQL queries ---
async function executeQuery<T>(query: string, variables: Record<string, any>): Promise<T & { errors?: GqlError[] }> {
  const response = await fetch(GQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error('Failed to fetch data from Objkt API (Network error).');
  // Return the full result, including potential errors, to be handled by the caller.
  return response.json();
}

// --- Exported Service Functions ---

export const fetchCollectionInfo = async (address: string): Promise<ContractInfo> => {
  // First, try the primary 'collection' schema.
  let result = await executeQuery<GqlCollectionResponse>(GET_COLLECTION_QUERY_V2, { address });

  // Check for the specific schema error indicating we should try the fallback.
  const isSchemaError = result.errors?.some(e => e.message.includes("not found in type: 'query_root'"));

  if (isSchemaError) {
    console.warn("Objkt schema 'collection' not found, falling back to 'fa'.");
    // If it's a schema error, try the 'fa' schema (V1)
    result = await executeQuery<GqlCollectionResponse>(GET_COLLECTION_QUERY_V1, { address });
  }

  // After potentially trying the fallback, check for any other, non-recoverable errors.
  if (result.errors && result.errors.length > 0) {
    console.error("GraphQL Error after fallback attempt:", result.errors);
    throw new Error(`An error occurred fetching collection data: ${result.errors[0].message}`);
  }

  const collection = result.data?.collection?.[0] || result.data?.fa?.[0];

  if (!collection) {
    throw new Error(`Collection with address ${address} not found on Objkt.`);
  }

  const artist = collection.tokens?.[0]?.creators?.[0]?.holder;
  const gallery = collection.creator;
  const finalCreator = artist || gallery;

  return {
    address: address,
    alias: collection.name || 'Unnamed Collection',
    description: collection.description,
    timestamp: collection.timestamp,
    creator: {
      address: finalCreator?.address || 'N/A',
      alias: finalCreator?.tzdomain || finalCreator?.alias,
      twitter: finalCreator?.twitter,
    }
  };
};

export const fetchTokensFromObjkt = async (contractAddress: string): Promise<Nft[]> => {
  // First, try the primary 'collection' schema.
  let result = await executeQuery<GqlTokensResponse>(GET_TOKENS_QUERY_V2, { address: contractAddress });

  // Check for the specific schema error indicating we should try the fallback.
  const isSchemaError = result.errors?.some(e => e.message.includes("not found in type: 'query_root'"));

  if (isSchemaError) {
    console.warn("Objkt token schema 'collection' not found, falling back to 'fa'.");
    // If it's a schema error, try the 'fa' schema (V1)
    result = await executeQuery<GqlTokensResponse>(GET_TOKENS_QUERY_V1, { address: contractAddress });
  }

  // After potentially trying the fallback, check for any other, non-recoverable errors.
  if (result.errors && result.errors.length > 0) {
    console.error("GraphQL Error after fallback attempt:", result.errors);
    throw new Error(`An error occurred fetching token data: ${result.errors[0].message}`);
  }

  const tokens = result.data?.collection?.[0]?.tokens || result.data?.fa?.[0]?.tokens;

  if (!tokens) {
    console.warn(`No tokens found for ${contractAddress} on Objkt with either schema.`);
    return [];
  }

  return tokens
    .map(token => {
      const creator = token.creators?.[0]?.holder;
      return {
        id: token.pk,
        tokenId: token.token_id,
        name: token.name,
        imageUrl: normalizeIpfsUrl(token.thumbnail_uri || token.display_uri),
        displayUrl: normalizeIpfsUrl(token.display_uri),
        mime: null, // This endpoint doesn't provide mime type
        contractAddress: contractAddress,
        creator: {
          address: creator?.address || 'N/A',
          alias: creator?.tzdomain || creator?.alias
        }
      };
    })
    .filter(nft => nft.imageUrl && nft.imageUrl.length > 0);
};

export const fetchArtistProfiles = async (addresses: string[]): Promise<ArtistProfile[]> => {
  if (addresses.length === 0) return [];

  const result = await executeQuery<GqlArtistProfileResponse>(GET_ARTIST_PROFILES_QUERY, { addresses });

  if (result.errors && result.errors.length > 0) {
    console.error("GraphQL Error:", result.errors);
    throw new Error(`An error occurred fetching artist profiles: ${result.errors[0].message}`);
  }

  if (!result.data || !result.data.holder) return [];

  return result.data.holder.map(profile => ({
    address: profile.address,
    alias: profile.tzdomain || profile.alias || profile.address.slice(0, 8) + '...',
    pfpUrl: generatePfpUrl(profile.twitter, profile.address),
    objktUrl: `https://objkt.com/profile/${profile.tzdomain || profile.address}`,
    twitterUrl: profile.twitter,
    instagramUrl: profile.instagram,
  }));
};

export const fetchCreationsByArtist = async (address: string, offset: number = 0): Promise<Nft[]> => {
  const result = await executeQuery<GqlArtistCreationsResponse>(GET_CREATIONS_BY_ARTIST_QUERY, { address, offset });

  if (result.errors && result.errors.length > 0) {
    console.error("GraphQL Error:", result.errors);
    throw new Error(`An error occurred fetching artist creations: ${result.errors[0].message}`);
  }

  if (!result.data || !result.data.token) return [];

  return result.data.token
    .map(token => {
      const creator = token.creators?.[0]?.holder;
      return {
        id: token.pk,
        tokenId: token.token_id,
        name: token.name,
        // The thumbnail URI is prioritized for the grid view
        imageUrl: normalizeIpfsUrl(token.thumbnail_uri || token.display_uri || token.artifact_uri),
        // The artifact URI is prioritized for the main display in the modal
        displayUrl: normalizeIpfsUrl(token.artifact_uri || token.display_uri || token.thumbnail_uri),
        mime: token.mime,
        contractAddress: token.fa.contract,
        creator: {
          address: creator?.address || 'N/A',
          alias: creator?.tzdomain || creator?.alias
        }
      };
    })
    .filter(nft => nft.imageUrl && nft.imageUrl.length > 0);
};


export const fetchNewtroArtistProfiles = async (): Promise<ArtistProfile[]> => {
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

  const tokenPromises = CURATED_CONTRACTS.map(address =>
    fetchTokensFromObjkt(address).catch(e => {
      console.error(`Could not fetch tokens for ${address} for artist aggregation`, e);
      return [];
    })
  );

  const tokenArrays = await Promise.all(tokenPromises);
  const allTokens = tokenArrays.flat();

  const uniqueAddresses = Array.from(
    new Set(
      allTokens
        .map(nft => nft.creator.address)
        .filter(address => address && address !== 'N/A')
    )
  );

  if (uniqueAddresses.length === 0) {
    return [];
  }

  return fetchArtistProfiles(uniqueAddresses);
};

export const searchCollections = async (searchTerm: string): Promise<CollectionSearchResult[]> => {
  const variables = { search: `%${searchTerm}%` };
  let result = await executeQuery<GqlCollectionSearchResponse>(SEARCH_COLLECTIONS_QUERY_V2, variables);

  const isSchemaError = result.errors?.some(e => e.message.includes("not found in type: 'query_root'"));

  if (isSchemaError) {
    console.warn("Search schema 'collection' failed, falling back to 'fa'.");
    result = await executeQuery<GqlCollectionSearchResponse>(SEARCH_COLLECTIONS_QUERY_V1, variables);
  }

  if (result.errors && result.errors.length > 0) {
    console.error("GraphQL Error after fallback attempt:", result.errors);
    throw new Error(`An error occurred searching collections: ${result.errors[0].message}`);
  }
  
  const v2Results = result.data?.collection?.map(c => ({
    address: c.address,
    name: c.name,
    description: c.description,
    logo: normalizeIpfsUrl(c.logo),
  })) || [];

  const v1Results = result.data?.fa?.map(c => ({
    address: c.contract, // Note the field name difference
    name: c.name,
    description: c.description,
    logo: normalizeIpfsUrl(c.logo),
  })) || [];

  return v2Results.length > 0 ? v2Results : v1Results;
};