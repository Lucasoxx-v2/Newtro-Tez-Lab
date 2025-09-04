
interface CacheItem<T> {
  value: T;
  expiry: number;
}

interface CacheGetResponse<T> {
  value: T | null;
  isStale: boolean;
}

const get = <T>(key: string): CacheGetResponse<T> => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) {
    return { value: null, isStale: true };
  }
  try {
    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = new Date().getTime();
    
    if (now > item.expiry) {
      // It's expired, but we can still return the stale value for SWR
      return { value: item.value, isStale: true };
    }
    // It's valid
    return { value: item.value, isStale: false };
  } catch (error) {
    console.error(`Error reading cache for key "${key}":`, error);
    localStorage.removeItem(key); // Remove corrupted data
    return { value: null, isStale: true };
  }
};

const set = <T>(key: string, value: T, ttlInSeconds: number): void => {
  const now = new Date();
  const item: CacheItem<T> = {
    value: value,
    // Set expiry in milliseconds
    expiry: now.getTime() + ttlInSeconds * 1000,
  };
  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error setting cache for key "${key}":`, error);
  }
};

export const cacheService = {
  get,
  set,
};