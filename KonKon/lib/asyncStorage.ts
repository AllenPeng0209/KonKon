// AsyncStorage 适配器，用于处理 web 环境兼容性
import { Platform } from 'react-native'

interface AsyncStorageInterface {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
}

// 无操作存储适配器（用于 SSR）
class NoOpStorage implements AsyncStorageInterface {
  async getItem(key: string): Promise<string | null> {
    return null
  }

  async setItem(key: string, value: string): Promise<void> {
    // 无操作
  }

  async removeItem(key: string): Promise<void> {
    // 无操作
  }

  async clear(): Promise<void> {
    // 无操作
  }
}

// Web 环境的 localStorage 适配器
class WebStorage implements AsyncStorageInterface {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }
    try {
      return window.localStorage.getItem(key)
    } catch (e) {
      console.warn('localStorage.getItem error:', e)
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    try {
      window.localStorage.setItem(key, value)
    } catch (e) {
      console.warn('localStorage.setItem error:', e)
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    try {
      window.localStorage.removeItem(key)
    } catch (e) {
      console.warn('localStorage.removeItem error:', e)
    }
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    try {
      window.localStorage.clear()
    } catch (e) {
      console.warn('localStorage.clear error:', e)
    }
  }
}

// 移动端的 AsyncStorage 适配器
class NativeStorage implements AsyncStorageInterface {
  private storage: any

  constructor() {
    try {
      this.storage = require('@react-native-async-storage/async-storage').default
    } catch (e) {
      console.warn('AsyncStorage not available:', e)
      this.storage = null
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.storage) return null
    try {
      return this.storage.getItem(key)
    } catch (e) {
      console.warn('AsyncStorage.getItem error:', e)
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.storage) return
    try {
      return this.storage.setItem(key, value)
    } catch (e) {
      console.warn('AsyncStorage.setItem error:', e)
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.storage) return
    try {
      return this.storage.removeItem(key)
    } catch (e) {
      console.warn('AsyncStorage.removeItem error:', e)
    }
  }

  async clear(): Promise<void> {
    if (!this.storage) return
    try {
      return this.storage.clear()
    } catch (e) {
      console.warn('AsyncStorage.clear error:', e)
    }
  }
}

// 根据平台选择合适的存储实现
const createAsyncStorage = (): AsyncStorageInterface => {
  // 检查是否在服务器端（SSR）
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    return new NoOpStorage()
  }
  
  // 检查是否在 Web 环境
  if (Platform.OS === 'web' || typeof window !== 'undefined') {
    return new WebStorage()
  }
  
  // 默认使用原生存储
  return new NativeStorage()
}

export const asyncStorage = createAsyncStorage()
export default asyncStorage 