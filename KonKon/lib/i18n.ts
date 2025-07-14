import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

import en from './translations/en.json';
import ja from './translations/ja.json';
import zhCN from './translations/zh-CN.json';
import zhTW from './translations/zh-TW.json';

const i18n = new I18n({
  en,
  ja,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
});

i18n.defaultLocale = 'en-US';
i18n.locale = Localization.getLocales()[0].languageCode ?? 'en-US';
i18n.enableFallback = true;

type TranslationKeys = 
  | 'home.addEvent'
  | 'home.addExpense'
  | 'home.addMemory'
  | 'home.viewAlbum'
  | 'home.viewEvents'
  | 'home.viewFinance'
  | 'home.confirmationTitle'
  | 'home.confirmationMessage'
  | 'home.confirm'
  | 'home.cancel'
  | 'home.eventDetails'
  | 'home.success'
  | 'home.eventCreatedSuccess'
  | 'home.permissionRequired'
  | 'home.voicePermission'
  | 'home.goToSettings'
  | 'home.startRecording'
  | 'home.stopRecording'
  | 'home.processing'
  | 'home.confirmationTitleSingle'
  | 'home.confirmationTitleMultiple'
  | 'home.multipleEventsCreationSuccessMessage'
  | 'home.eventUpdatedSuccess'
  | 'home.eventDeleteSuccess'
  // Add other keys as needed...
  ;

export const t = (key: TranslationKeys, options?: any) => i18n.t(key, options);

export const setLocale = (locale: string) => {
  i18n.locale = locale;
}; 