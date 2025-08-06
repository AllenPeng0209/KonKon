import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { subscriptionService, SubscriptionStatus } from '../lib/subscriptionService';

export interface UseSubscriptionReturn {
  // 狀態
  status: SubscriptionStatus;
  isLoading: boolean;
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  
  // 方法
  startSubscription: (planId: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refresh: () => Promise<void>;
  
  // 實用方法
  hasFeature: (feature: string) => boolean;
  showPremiumPrompt: () => boolean;
}

/**
 * 訂閱管理 Hook
 * 提供訂閱狀態管理和相關功能
 */
export const useSubscription = (): UseSubscriptionReturn => {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isActive: false,
    isTrialActive: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // 初始化訂閱服務
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const initializeSubscription = async () => {
      try {
        // 檢查平台支持
        if (Platform.OS !== 'ios') {
          console.log('⚠️ 非 iOS 平台，跳過訂閱服務初始化');
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        // 初始化服務（添加超時保護）
        const initPromise = subscriptionService.initialize();
        const timeoutPromise = new Promise<void>((resolve) => 
          setTimeout(() => {
            console.log('⏰ 訂閱服務初始化超時，繼續執行');
            resolve();
          }, 15000)
        );

        await Promise.race([initPromise, timeoutPromise]);
        
        if (!isMounted) return;
        
        // 設置狀態監聽器
        unsubscribe = subscriptionService.onStatusChange((newStatus) => {
          if (isMounted) {
            setStatus(newStatus);
            setIsLoading(false);
          }
        });

        // 獲取初始狀態
        const initialStatus = subscriptionService.getSubscriptionStatus();
        if (isMounted) {
          setStatus(initialStatus);
        }
      } catch (error) {
        console.error('訂閱服務初始化失敗:', error);
        // 不拋出錯誤，讓應用繼續運行
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeSubscription();

    // 清理函數
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 開始訂閱
  const startSubscription = useCallback(async (planId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await subscriptionService.startSubscription(planId);
      return result;
    } catch (error) {
      console.error('訂閱失敗:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 取消訂閱
  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await subscriptionService.cancelSubscription();
      return result;
    } catch (error) {
      console.error('取消訂閱失敗:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 恢復購買
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await subscriptionService.restorePurchases();
      return result;
    } catch (error) {
      console.error('恢復購買失敗:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 刷新訂閱狀態
  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await subscriptionService.initialize();
    } catch (error) {
      console.error('刷新訂閱狀態失敗:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 檢查是否有特定功能
  const hasFeature = useCallback((feature: string): boolean => {
    // 如果是高級用戶，則擁有所有功能
    if (subscriptionService.isPremiumUser()) {
      return true;
    }

    // 這裡可以定義免費用戶也能使用的功能
    const freeFeatures = [
      '基本日曆功能',
      '事件創建',
      '家庭共享'
    ];

    return freeFeatures.includes(feature);
  }, [status]);

  // 判斷是否應該顯示高級版提示
  const showPremiumPrompt = useCallback((): boolean => {
    return !subscriptionService.isPremiumUser();
  }, [status]);

  // 計算派生狀態
  const isPremium = subscriptionService.isPremiumUser();
  const isTrialActive = subscriptionService.isInTrialPeriod();
  const trialDaysRemaining = subscriptionService.getTrialDaysRemaining();

  return {
    // 狀態
    status,
    isLoading,
    isPremium,
    isTrialActive,
    trialDaysRemaining,
    
    // 方法
    startSubscription,
    cancelSubscription,
    restorePurchases,
    refresh,
    
    // 實用方法
    hasFeature,
    showPremiumPrompt
  };
};

/**
 * 訂閱功能檢查 Hook
 * 用於檢查特定功能是否可用，如果不可用則顯示升級提示
 */
export const useFeatureAccess = (featureName: string) => {
  const { hasFeature, showPremiumPrompt, isPremium } = useSubscription();
  
  const checkFeatureAccess = useCallback((): boolean => {
    const hasAccess = hasFeature(featureName);
    
    if (!hasAccess && showPremiumPrompt()) {
      // 這裡可以顯示升級提示
      console.log(`功能 "${featureName}" 需要高級版訂閱`);
      return false;
    }
    
    return hasAccess;
  }, [featureName, hasFeature, showPremiumPrompt]);

  return {
    hasAccess: hasFeature(featureName),
    isPremium,
    checkAccess: checkFeatureAccess
  };
};

/**
 * 高級版功能守護 Hook
 * 用於包裝需要高級版的組件或功能
 */
export const usePremiumGuard = () => {
  const { isPremium, showPremiumPrompt } = useSubscription();

  const withPremiumGuard = useCallback(<T extends any[]>(
    action: (...args: T) => void,
    premiumOnlyMessage?: string
  ) => {
    return (...args: T) => {
      if (isPremium) {
        action(...args);
      } else if (showPremiumPrompt()) {
        console.log(premiumOnlyMessage || '此功能需要高級版訂閱');
        // 這裡可以顯示升級對話框或導航到訂閱頁面
      }
    };
  }, [isPremium, showPremiumPrompt]);

  return {
    isPremium,
    withPremiumGuard
  };
}; 