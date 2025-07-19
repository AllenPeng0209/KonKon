import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeatureSettings {
  enabled: boolean;
  settings: Record<string, any>;
}

export interface FeatureSettingsState {
  familySchedule: FeatureSettings;
  familyAssistant: FeatureSettings;
  choreAssignment: FeatureSettings;
  familyActivities: FeatureSettings;
  familyAlbum: FeatureSettings;
  shoppingList: FeatureSettings;
  familyFinance: FeatureSettings;
  familyRecipes: FeatureSettings;
}

interface FeatureSettingsContextType {
  featureSettings: FeatureSettingsState;
  updateFeatureSetting: (feature: keyof FeatureSettingsState, enabled: boolean, settings?: Record<string, any>) => Promise<void>;
  resetAllSettings: () => Promise<void>;
  loading: boolean;
}

const defaultFeatureSettings: FeatureSettingsState = {
  familySchedule: { enabled: true, settings: {} },
  familyAssistant: { enabled: false, settings: {} },
  choreAssignment: { enabled: false, settings: {} },
  familyActivities: { enabled: false, settings: {} },
  familyAlbum: { enabled: false, settings: {} },
  shoppingList: { enabled: false, settings: {} },
  familyFinance: { enabled: false, settings: {} },
  familyRecipes: { enabled: false, settings: {} },
};

const FeatureSettingsContext = createContext<FeatureSettingsContextType | undefined>(undefined);

export const useFeatureSettings = () => {
  const context = useContext(FeatureSettingsContext);
  if (context === undefined) {
    throw new Error('useFeatureSettings must be used within a FeatureSettingsProvider');
  }
  return context;
};

export const FeatureSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [featureSettings, setFeatureSettings] = useState<FeatureSettingsState>(defaultFeatureSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatureSettings();
  }, []);

  const loadFeatureSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('featureSettings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // 合併默認設置，確保新的默認值生效
        const mergedSettings = { ...defaultFeatureSettings };
        Object.keys(parsedSettings).forEach(key => {
          if (mergedSettings[key as keyof FeatureSettingsState]) {
            mergedSettings[key as keyof FeatureSettingsState] = {
              ...mergedSettings[key as keyof FeatureSettingsState],
              ...parsedSettings[key]
            };
          }
        });
        setFeatureSettings(mergedSettings);
      } else {
        setFeatureSettings(defaultFeatureSettings);
      }
    } catch (error) {
      console.error('Error loading feature settings:', error);
      setFeatureSettings(defaultFeatureSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateFeatureSetting = async (
    feature: keyof FeatureSettingsState,
    enabled: boolean,
    settings: Record<string, any> = {}
  ) => {
    const newSettings = {
      ...featureSettings,
      [feature]: {
        enabled,
        settings: { ...featureSettings[feature].settings, ...settings }
      }
    };
    
    setFeatureSettings(newSettings);
    
    try {
      await AsyncStorage.setItem('featureSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving feature settings:', error);
    }
  };

  const resetAllSettings = async () => {
    try {
      await AsyncStorage.removeItem('featureSettings');
      setFeatureSettings(defaultFeatureSettings);
      console.log('All feature settings have been reset');
    } catch (error) {
      console.error('Error resetting feature settings:', error);
    }
  };

  return (
    <FeatureSettingsContext.Provider
      value={{
        featureSettings,
        updateFeatureSetting,
        resetAllSettings,
        loading
      }}
    >
      {children}
    </FeatureSettingsContext.Provider>
  );
}; 