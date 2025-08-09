import { t } from './i18n';

/**
 * iOS 權限描述鍵值對應
 */
export const IOSPermissionKeys = {
  NSCameraUsageDescription: 'NSCameraUsageDescription',
  NSPhotoLibraryUsageDescription: 'NSPhotoLibraryUsageDescription',
  NSPhotoLibraryAddUsageDescription: 'NSPhotoLibraryAddUsageDescription',
  NSMicrophoneUsageDescription: 'NSMicrophoneUsageDescription',
  NSLocationWhenInUseUsageDescription: 'NSLocationWhenInUseUsageDescription',
  NSCalendarsUsageDescription: 'NSCalendarsUsageDescription',
  NSRemindersUsageDescription: 'NSRemindersUsageDescription',
  NSUserTrackingUsageDescription: 'NSUserTrackingUsageDescription',
} as const;

/**
 * 獲取本地化的權限描述
 * @param permissionKey iOS 權限鍵
 * @returns 本地化的權限描述文字
 */
export const getLocalizedPermissionDescription = (
  permissionKey: keyof typeof IOSPermissionKeys
): string => {
  return t(IOSPermissionKeys[permissionKey]);
};

/**
 * 獲取所有權限描述的本地化版本
 * @returns 包含所有權限描述的對象
 */
export const getAllLocalizedPermissionDescriptions = () => {
  return {
    NSCameraUsageDescription: t('NSCameraUsageDescription'),
    NSPhotoLibraryUsageDescription: t('NSPhotoLibraryUsageDescription'),
    NSPhotoLibraryAddUsageDescription: t('NSPhotoLibraryAddUsageDescription'),
    NSMicrophoneUsageDescription: t('NSMicrophoneUsageDescription'),
    NSLocationWhenInUseUsageDescription: t('NSLocationWhenInUseUsageDescription'),
    NSCalendarsUsageDescription: t('NSCalendarsUsageDescription'),
    NSRemindersUsageDescription: t('NSRemindersUsageDescription'),
    NSUserTrackingUsageDescription: t('NSUserTrackingUsageDescription'),
  };
};

/**
 * 權限類型枚舉
 */
export enum PermissionType {
  Camera = 'camera',
  PhotoLibrary = 'photoLibrary',
  PhotoLibraryAdd = 'photoLibraryAdd',
  Microphone = 'microphone',
  Location = 'location',
  Calendar = 'calendar',
  Reminders = 'reminders',
  Tracking = 'tracking',
}

/**
 * 根據權限類型獲取對應的本地化描述
 * @param permissionType 權限類型
 * @returns 本地化的權限描述文字
 */
export const getPermissionDescriptionByType = (permissionType: PermissionType): string => {
  const permissionKeyMap: Record<PermissionType, keyof typeof IOSPermissionKeys> = {
    [PermissionType.Camera]: 'NSCameraUsageDescription',
    [PermissionType.PhotoLibrary]: 'NSPhotoLibraryUsageDescription',
    [PermissionType.PhotoLibraryAdd]: 'NSPhotoLibraryAddUsageDescription',
    [PermissionType.Microphone]: 'NSMicrophoneUsageDescription',
    [PermissionType.Location]: 'NSLocationWhenInUseUsageDescription',
    [PermissionType.Calendar]: 'NSCalendarsUsageDescription',
    [PermissionType.Reminders]: 'NSRemindersUsageDescription',
    [PermissionType.Tracking]: 'NSUserTrackingUsageDescription',
  };

  const permissionKey = permissionKeyMap[permissionType];
  return getLocalizedPermissionDescription(permissionKey);
}; 