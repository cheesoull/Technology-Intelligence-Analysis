/**
 * 缓存工具类，用于缓存 API 请求结果
 */

// 缓存键前缀
const CACHE_PREFIX = 'ai_paper_';

// 缓存有效期（毫秒）
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24小时

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * 设置缓存
 * @param key 缓存键
 * @param data 缓存数据
 */
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

/**
 * 获取缓存
 * @param key 缓存键
 * @returns 缓存数据，如果缓存不存在或已过期则返回 null
 */
export const getCache = <T>(key: string): T | null => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheJson = localStorage.getItem(cacheKey);
    
    if (!cacheJson) {
      return null;
    }
    
    const cacheItem: CacheItem<T> = JSON.parse(cacheJson);
    const now = Date.now();
    
    // 检查缓存是否过期
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

/**
 * 清除指定缓存
 * @param key 缓存键
 */
export const clearCache = (key: string): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
};

/**
 * 清除所有缓存
 */
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

/**
 * 生成缓存键
 * @param baseKey 基础键名
 * @param params 参数对象
 * @returns 缓存键
 */
export const generateCacheKey = (baseKey: string, params: Record<string, any>): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return `${baseKey}_${sortedParams}`;
};
