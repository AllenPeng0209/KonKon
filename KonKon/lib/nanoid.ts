// 使用更可靠的ID生成方法
export const nanoid = (): string => {
  // 結合時間戳和隨機數，確保唯一性
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const extraRandom = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${extraRandom}`;
};

// 備用方法：如果需要更短的ID
export const shortId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}; 