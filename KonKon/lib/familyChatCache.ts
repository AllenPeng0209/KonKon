import AsyncStorage from '@react-native-async-storage/async-storage';
import { UIFamilyChatMessage } from './familyChat';

// 緩存配置
const CACHE_CONFIG = {
  maxCachedMessages: 100, // 最多緩存100條消息
  cacheKeyPrefix: 'family_chat_cache_', // 緩存key前綴
  paginationSize: 20, // 每次分頁加載20條消息
  minCacheMessages: 30, // 最少緩存30條消息
};

export interface FamilyChatCache {
  familyId: string;
  messages: UIFamilyChatMessage[];
  lastUpdated: number;
  hasMoreMessages: boolean;
  oldestMessageId?: string;
}

/**
 * 保存家庭聊天緩存
 */
export async function saveFamilyChatCache(familyId: string, messages: UIFamilyChatMessage[], hasMoreMessages: boolean = true): Promise<void> {
  // 特殊處理元空間：元空間是虛擬概念，不需要保存緩存
  if (familyId === 'meta-space') {
    return;
  }

  try {
    const cacheKey = `${CACHE_CONFIG.cacheKeyPrefix}${familyId}`;
    
    // 只緩存最新的消息
    const messagesToCache = messages.slice(-CACHE_CONFIG.maxCachedMessages);
    
    const cache: FamilyChatCache = {
      familyId,
      messages: messagesToCache,
      lastUpdated: Date.now(),
      hasMoreMessages,
      oldestMessageId: messagesToCache.length > 0 ? messagesToCache[0].id : undefined,
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cache));
    console.log(`[ChatCache] 已緩存 ${messagesToCache.length} 條消息 for family ${familyId}`);
  } catch (error) {
    console.error('[ChatCache] 保存緩存失败:', error);
  }
}

/**
 * 讀取家庭聊天緩存
 */
export async function loadFamilyChatCache(familyId: string): Promise<FamilyChatCache | null> {
  // 特殊處理元空間：元空間是虛擬概念，不需要緩存
  if (familyId === 'meta-space') {
    return null;
  }

  try {
    const cacheKey = `${CACHE_CONFIG.cacheKeyPrefix}${familyId}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (!cachedData) {
      console.log(`[ChatCache] 沒有找到緩存 for family ${familyId}`);
      return null;
    }
    
    const cache: FamilyChatCache = JSON.parse(cachedData);
    console.log(`[ChatCache] 加載了 ${cache.messages.length} 條緩存消息 for family ${familyId}`);
    return cache;
  } catch (error) {
    console.error('[ChatCache] 讀取緩存失败:', error);
    return null;
  }
}

/**
 * 添加新消息到緩存（不保存到磁盤，只更新內存）
 */
export function addMessageToCache(cache: FamilyChatCache, newMessage: UIFamilyChatMessage): FamilyChatCache {
  const updatedMessages = [...cache.messages, newMessage];
  
  // 如果消息過多，移除舊消息
  const messagesToKeep = updatedMessages.length > CACHE_CONFIG.maxCachedMessages 
    ? updatedMessages.slice(-CACHE_CONFIG.maxCachedMessages)
    : updatedMessages;
  
  return {
    ...cache,
    messages: messagesToKeep,
    lastUpdated: Date.now(),
    oldestMessageId: messagesToKeep.length > 0 ? messagesToKeep[0].id : undefined,
  };
}

/**
 * 將新的歷史消息合併到緩存中（用於分頁加載）
 */
export function mergeHistoryToCache(cache: FamilyChatCache, olderMessages: UIFamilyChatMessage[], hasMore: boolean): FamilyChatCache {
  // 去重，避免重複消息
  const existingIds = new Set(cache.messages.map(msg => msg.id));
  const newOlderMessages = olderMessages.filter(msg => !existingIds.has(msg.id));
  
  // 將新的歷史消息放在前面，保持時間順序
  const mergedMessages = [...newOlderMessages, ...cache.messages];
  
  // 如果合併後消息過多，保留最新的消息
  const messagesToKeep = mergedMessages.length > CACHE_CONFIG.maxCachedMessages * 1.5
    ? mergedMessages.slice(-CACHE_CONFIG.maxCachedMessages)
    : mergedMessages;
  
  return {
    ...cache,
    messages: messagesToKeep,
    lastUpdated: Date.now(),
    hasMoreMessages: hasMore,
    oldestMessageId: messagesToKeep.length > 0 ? messagesToKeep[0].id : undefined,
  };
}

/**
 * 清除指定家庭的緩存
 */
export async function clearFamilyChatCache(familyId: string): Promise<void> {
  try {
    const cacheKey = `${CACHE_CONFIG.cacheKeyPrefix}${familyId}`;
    await AsyncStorage.removeItem(cacheKey);
    console.log(`[ChatCache] 已清除緩存 for family ${familyId}`);
  } catch (error) {
    console.error('[ChatCache] 清除緩存失败:', error);
  }
}

/**
 * 清除所有聊天緩存
 */
export async function clearAllFamilyChatCaches(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_CONFIG.cacheKeyPrefix));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log(`[ChatCache] 已清除所有緩存，共 ${cacheKeys.length} 個`);
  } catch (error) {
    console.error('[ChatCache] 清除所有緩存失败:', error);
  }
}

/**
 * 檢查緩存是否過期（超過1小時）
 */
export function isCacheExpired(cache: FamilyChatCache): boolean {
  const oneHour = 60 * 60 * 1000;
  return Date.now() - cache.lastUpdated > oneHour;
}

/**
 * 獲取分頁配置
 */
export const getCacheConfig = () => CACHE_CONFIG; 