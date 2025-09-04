import type { TzKtToken, Nft, ContractInfo, AccountInfo } from '../types';

const API_BASE_URL = 'https://api.tzkt.io/v1';
const COLLECTION_TOKEN_LIMIT = 500;

const IPFS_GATEWAYS = [
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

export const normalizeIpfsUrl = (url: string | undefined): string[] | null => {
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

export const fetchContractInfoFromTzkt = async (address: string): Promise<ContractInfo> => {
  const contractResponse = await fetch(`${API_BASE_URL}/contracts/${address}`);
  if (!contractResponse.ok) {
    throw new Error(`Failed to fetch contract info for ${address} from TzKT.`);
  }
  const contractData = await contractResponse.json();
  const creatorAddress = contractData.creator?.address;

  if (!creatorAddress) {
    return {
      address,
      alias: contractData.alias || 'Unnamed Collection',
      creator: {
        address: 'N/A',
      },
    };
  }
  
  const accountResponse = await fetch(`${API_BASE_URL}/accounts/${creatorAddress}`);
  const accountData: AccountInfo = accountResponse.ok ? await accountResponse.json() : {};

  return {
    address,
    alias: contractData.alias || 'Unnamed Collection',
    description: `Description not available via TzKT. Try searching on objkt.com.`,
    creator: {
      address: creatorAddress,
      alias: accountData.alias || accountData.domain?.name,
    },
  };
};


export const fetchTokens = async (contractAddress: string, limit: number = COLLECTION_TOKEN_LIMIT): Promise<Nft[]> => {
  const response = await fetch(`${API_BASE_URL}/tokens?contract=${contractAddress}&limit=${limit}&sort.desc=id`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tokens for contract ${contractAddress}`);
  }
  const data: TzKtToken[] = await response.json();
  
  const validTokens = data.filter(token => token.metadata && token.metadata.name);

  const creatorAddresses = [
    ...new Set(
      validTokens
        .map(token => token.metadata?.creators?.[0])
        .filter((address): address is string => !!address)
    ),
  ];

  const aliasMap = new Map<string, string | undefined>();

  if (creatorAddresses.length > 0) {
    const accountsResponse = await fetch(`${API_BASE_URL}/accounts?address.in=${creatorAddresses.join(',')}&select=address,alias,domain`);
    if (accountsResponse.ok) {
      const accountsData: { address: string; alias?: string; domain?: { name: string } }[] = await accountsResponse.json();
      for (const account of accountsData) {
        aliasMap.set(account.address, account.alias || account.domain?.name);
      }
    }
  }

  const nfts: Nft[] = validTokens.map(token => {
    const creatorAddress = token.metadata?.creators?.[0] || 'N/A';
    return {
      id: token.id,
      tokenId: token.tokenId,
      name: token.metadata.name,
      imageUrl: normalizeIpfsUrl(token.metadata.thumbnailUri || token.metadata.displayUri || token.metadata.artifactUri),
      displayUrl: normalizeIpfsUrl(token.metadata.displayUri || token.metadata.artifactUri),
      mime: null,
      contractAddress: token.contract.address,
      creator: {
        address: creatorAddress,
        alias: aliasMap.get(creatorAddress),
      },
    };
  });

  return nfts.filter(nft => nft.imageUrl && nft.imageUrl.length > 0);
};