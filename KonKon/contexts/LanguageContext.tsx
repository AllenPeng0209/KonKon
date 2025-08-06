import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getDeviceLocale, setLocale as setI18nLocale, t } from '../lib/i18n';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (scope: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState(getDeviceLocale());
  const router = useRouter();

  useEffect(() => {
    const loadLocale = async () => {
      const savedLocale = await AsyncStorage.getItem('user-locale');
      if (savedLocale) {
        setLocaleState(savedLocale);
        setI18nLocale(savedLocale);
      } else {
        // 日本市場優先，默認為日語
        setLocaleState('ja');
        setI18nLocale('ja');
      }
    };
    loadLocale();
  }, []);

  const setLocale = async (newLocale: string) => {
    setLocaleState(newLocale);
    setI18nLocale(newLocale);
    await AsyncStorage.setItem('user-locale', newLocale);
    router.replace('/');
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 