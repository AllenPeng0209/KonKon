import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { setLocale as setI18nLocale } from '../lib/i18n';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState(Localization.getLocales()[0].languageCode ?? 'en-US');

  useEffect(() => {
    const loadLocale = async () => {
      const savedLocale = await AsyncStorage.getItem('user-locale');
      if (savedLocale) {
        setLocaleState(savedLocale);
        setI18nLocale(savedLocale);
      }
    };
    loadLocale();
  }, []);

  const setLocale = async (newLocale: string) => {
    setLocaleState(newLocale);
    setI18nLocale(newLocale);
    await AsyncStorage.setItem('user-locale', newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 