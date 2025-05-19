const CACHE_PREFIX = 'ai_paper_';

const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; 

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export const setCache = <T>(key: string, data: T): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('缓存数据失败:', error);
  }
};

export const getCache = <T>(key: string): T | null => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheJson = localStorage.getItem(cacheKey);
    
    if (!cacheJson) {
      return null;
    }
    
    const cacheItem: CacheItem<T> = JSON.parse(cacheJson);
    const now = Date.now();
    
    if (now - cacheItem.timestamp > CACHE_EXPIRATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return cacheItem.data;
  } catch (error) {
    console.error('获取缓存失败:', error);
    return null;
  }
};

export const clearCache = (key: string): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
};

export const clearAllCache = (): void => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('清除所有缓存失败:', error);
  }
};

export const generateCacheKey = (baseKey: string, params: Record<string, any>): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return `${baseKey}_${sortedParams}`;
};
