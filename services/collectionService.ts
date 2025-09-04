import { fetchTokens as fetchTokensFromTzkt, fetchContractInfoFromTzkt } from './tzktService';
import { fetchCollectionInfo, fetchTokensFromObjkt } from './objktService';
import type { Nft, ContractInfo } from '../types';

/**
 * Fetches collection information with a fallback to TzKT if Objkt fails.
 * This provides robustness by trying the primary data source (Objkt) first for rich
 * metadata, then falling back to the on-chain-focused source (TzKT).
 * @param address The contract address of the collection.
 * @returns A promise that resolves with the collection's information.
 */
export async function fetchInfoWithFallback(address: string): Promise<ContractInfo> {
  try {
    return await fetchCollectionInfo(address);
  } catch (objktError) {
    console.warn(`Could not fetch rich info from Objkt for ${address}, falling back to TzKT.`, objktError);
    return await fetchContractInfoFromTzkt(address);
  }
}

/**
 * Fetches tokens for a collection with a fallback to TzKT if Objkt fails.
 * This ensures that tokens can still be displayed even if the primary Objkt API
 * is unavailable or doesn't list the collection.
 * @param address The contract address of the collection.
 * @returns A promise that resolves with an array of the collection's NFTs.
 */
export async function fetchTokensWithFallback(address: string): Promise<Nft[]> {
  try {
    return await fetchTokensFromObjkt(address);
  } catch (objktError) {
    console.warn(`Objkt token fetch failed for ${address}, falling back to TzKT`, objktError);
    return await fetchTokensFromTzkt(address);
  }
}

/**
 * Fetches all data for a single collection, including its info and tokens,
 * by orchestrating calls with a robust fallback strategy (Objkt -> TzKT).
 * This function simplifies data fetching logic within UI components.
 * @param address The contract address of the collection.
 * @returns A promise that resolves to an object containing the collection's info and its NFTs.
 */
export const fetchCollection = async (address: string): Promise<{ info: ContractInfo; nfts: Nft[] }> => {
  // Run fetches in parallel for better performance.
  const [info, nfts] = await Promise.all([
    fetchInfoWithFallback(address),
    fetchTokensWithFallback(address)
  ]);
  
  return { info, nfts };
};
