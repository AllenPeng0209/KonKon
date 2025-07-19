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

// 语言映射函数
const getDeviceLocale = () => {
  const locales = Localization.getLocales();
  const primaryLocale = locales[0];
  
  // 优先使用完整的区域设置
  if (primaryLocale.languageTag) {
    const languageTag = primaryLocale.languageTag;
    
    // 直接匹配我们支持的语言
    if (languageTag === 'zh-CN' || languageTag === 'zh-Hans-CN') return 'zh-CN';
    if (languageTag === 'zh-TW' || languageTag === 'zh-Hant-TW') return 'zh-TW';
    if (languageTag === 'ja' || languageTag === 'ja-JP') return 'ja';
    if (languageTag === 'en' || languageTag.startsWith('en-')) return 'en';
  }
  
  // 回退到基础语言代码
  const languageCode = primaryLocale.languageCode;
  if (languageCode === 'zh') {
    // 根据地区代码判断简繁体
    if (primaryLocale.regionCode === 'TW' || primaryLocale.regionCode === 'HK') {
      return 'zh-TW';
    }
    return 'zh-CN';
  }
  if (languageCode === 'ja') return 'ja';
  if (languageCode === 'en') return 'en';
  
  // 默认返回英文
  return 'en';
};

i18n.defaultLocale = 'en';
i18n.locale = getDeviceLocale();
i18n.enableFallback = true;

type TranslationKeys =
  | 'home.all'
  | 'home.calendar'
  | 'home.expense'
  | 'home.idea'
  | 'home.mood'
  | 'home.assistant'
  | 'home.chores'
  | 'home.health'
  | 'home.activities'
  | 'home.album'
  | 'home.shopping'
  | 'home.finance'
  | 'home.recipes'
  | 'home.calendarPermissionTitle'
  | 'home.calendarPermissionMessage'
  | 'home.notNow'
  | 'home.grantPermission'
  | 'home.success'
  | 'home.permissionGranted'
  | 'home.processVoiceTitle'
  | 'home.processVoiceMessage'
  | 'home.cancel'
  | 'home.convert'
  | 'home.error'
  | 'home.mustBeLoggedIn'
  | 'home.savingExpenses'
  | 'home.saveSuccess'
  | 'home.saveExpensesSuccess'
  | 'home.saveFailed'
  | 'home.saveExpensesFailed'
  | 'home.processingImage'
  | 'home.processingVoice'
  | 'home.addToCalendar'
  | 'home.addMultipleToCalendar'
  | 'home.multipleEventsFound'
  | 'home.addAsSingleEvent'
  | 'home.addAsMultipleEvents'
  | 'home.confirm'
  | 'home.imageTooLarge'
  | 'home.imageSizeError'
  | 'home.imageProcessingError'
  | 'home.voiceProcessingError'
  | 'home.textProcessingError'
  | 'home.addOneByOne'
  | 'home.addAll'
  | 'home.multipleExpensesFound'
  | 'home.savingEvents'
  | 'home.saveEventsSuccess'
  | 'home.saveEventsFailed'
  | 'home.deleteConfirmation'
  | 'home.deleteEventConfirmation'
  | 'home.deleteRecurringEventTitle'
  | 'home.deleteRecurringEventMessage'
  | 'home.deleteInstance'
  | 'home.deleteAllFuture'
  | 'home.familyCalendar'
  | 'home.recordFamilyTime'
  | 'home.connectedToSystemCalendar'
  | 'home.today'
  | 'home.noEventsToday'
  | 'home.manualAddPrompt'
  | 'home.smartReminder'
  | 'home.longPressToTalk'
  | 'home.photo'
  | 'home.album'
  | 'home.processImageToCalendarTitle'
  | 'home.processImageToCalendarMessage'
  | 'home.processImageToExpenseTitle'
  | 'home.processImageToExpenseMessage'
  | 'home.todayEvents'
  | 'home.add'
  | 'home.manual'
  | 'home.record'
  | 'home.recordingFailed'
  | 'home.micPermissionError'
  | 'home.permissionDenied'
  | 'home.permissionRequired'
  | 'home.camera'
  | 'home.photoLibrary'
  | 'home.imageProcessingFailed'
  | 'home.unknownError'
  | 'home.voiceProcessingFailed'
  | 'home.expenseVoiceProcessingFailed'
  | 'home.textProcessingFailedWithReason'
  | 'home.parsingFailed'
  | 'home.noValidInfo'
  | 'home.userNotLoggedIn'
  | 'home.parsingSuccess'
  | 'home.expenseParsingSuccessMessage'
  | 'home.income'
  | 'home.expenseType'
  | 'home.notes'
  | 'home.confirmSave'
  | 'home.multipleExpensesParsed'
  | 'home.saveAll'
  | 'home.eventParsingSuccessMessage'
  | 'home.location'
  | 'home.create'
  | 'home.multipleEventsParsed'
  | 'home.createAll'
  | 'home.invalidTimeFormat'
  | 'home.timeSequenceError'
  | 'home.recurringEventCreationSuccess'
  | 'home.recurringEventCreationSuccessMessage'
  | 'home.ok'
  | 'home.recurringEventCreationFailed'
  | 'home.recurringRuleError'
  | 'home.recurringRuleFrequencyMissing'
  | 'home.recurringPatternRecognitionFailed'
  | 'home.continue'
  | 'home.eventCreationSuccess'
  | 'home.eventCreationSuccessMessage'
  | 'home.eventCreationFailed'
  | 'home.eventUpdateSuccess'
  | 'home.eventUpdateFailed'
  | 'home.noEventThisDay'
  | 'home.addEventPrompt'
  | 'home.addEvent'
  | 'home.loadingData'
  | 'home.recordTab'
  | 'home.exploreTab'
  | 'home.recentExpenses'
  | 'home.kidsSchedule'
  | 'home.choreSchedule'
  | 'home.anniversaryReminder'
  | 'home.isRecording'
  | 'home.eventDeleted'
  | 'home.confirmationTitleSingle'
  | 'home.confirmationTitleMultiple'
  | 'home.eventCreatedSuccess'
  | 'home.multipleEventsCreationSuccessMessage'
  | 'home.eventUpdatedSuccess'
  | 'home.eventDeleteSuccess'
  | 'home.analyzingText'
  | 'home.expenseSaveNotLoggedIn'
  | 'home.userStateError'
  | 'home.expenseSaveFailed'
  | 'home.expenseSaved'
  | 'languageSelection.title'
  | 'languageSelection.languages.zh-CN'
  | 'languageSelection.languages.zh-TW'
  | 'languageSelection.languages.en-US'
  | 'languageSelection.languages.ja-JP'
  | 'tabs.record'
  | 'tabs.explore'
  | 'explore.loading'
  | 'explore.clear'
  | 'smartButton.parseError'
  | 'home.parseError'
  | 'profile.createOrJoinFamilyTitle'
  | 'profile.createOrJoinFamilyMessage'
  | 'profile.cancel'
  | 'profile.createFamily'
  | 'profile.joinFamily'
  | 'profile.title'
  | 'profile.recordedDays'
  | 'profile.family'
  | 'profile.createOrJoin'
  | 'profile.loading'
  | 'profile.manageFamily'
  | 'profile.familySchedule'
  | 'profile.memberManagement'
  | 'profile.choreAssignment'
  | 'profile.birthdayReminder'
  | 'profile.familyAlbum'
  | 'profile.shoppingList'
  | 'profile.familyBudget'
  | 'profile.emergencyContact'
  | 'profile.settings'
  | 'profile.userAgreement'
  | 'profile.privacyPolicy'
  | 'profile.about'
  | 'familyManagement.title'
  | 'familyManagement.members'
  | 'familyManagement.memberCount'
  | 'familyManagement.inviteCode'
  | 'familyManagement.share'
  | 'familyManagement.remove'
  | 'familyManagement.unknownUser'
  | 'familyManagement.owner'
  | 'familyManagement.inviteMember'
  | 'familyManagement.noFamilyFound'
  | 'familyManagement.createFamily'
  | 'familyManagement.dissolveFamily'
  | 'familyManagement.leaveFamily'
  | 'familyManagement.inviteModalTitle'
  | 'familyManagement.shareInviteCode'
  | 'familyManagement.shareInviteMessage'
  | 'familyManagement.shareInviteTitle'
  | 'familyManagement.shareFailed'
  | 'familyManagement.removeMemberTitle'
  | 'familyManagement.removeMemberMessage'
  | 'familyManagement.cancel'
  | 'familyManagement.success'
  | 'familyManagement.memberRemoved'
  | 'familyManagement.removeMemberFailed'
  | 'familyManagement.leaveFamilyTitle'
  | 'familyManagement.leaveFamilyMessage'
  | 'familyManagement.ok'
  | 'familyManagement.familyLeft'
  | 'familyManagement.leaveFamilyFailed'
  | 'familyManagement.dissolveFamilyTitle'
  | 'familyManagement.dissolveFamilyMessage'
  | 'familyManagement.dissolved'
  | 'familyManagement.familyDissolved'
  | 'familyManagement.dissolveFamilyFailed'
  | 'familyManagement.byInviteCode'
  | 'familyManagement.enterInviteCode'
  | 'familyManagement.joinFamily'
  | 'firstSuggestions.suggestion1'
  | 'firstSuggestions.suggestion2'
  | 'firstSuggestions.suggestion3'
  | 'firstSuggestions.suggestion4'
  | 'firstSuggestions.suggestion5'
  | 'firstSuggestions.suggestion6'
  | 'firstSuggestions.suggestion7'
  ;

export const t = (key: TranslationKeys, options?: any) => i18n.t(key, options);

export const setLocale = (locale: string) => {
  i18n.locale = locale;
};

export { getDeviceLocale };

