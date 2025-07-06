import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export class CalendarService {
  private static instance: CalendarService;
  private hasPermission: boolean = false;
  private defaultCalendarId: string | null = null;

  private constructor() {}

  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  /**
   * 请求日历权限
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('请求日历权限失败:', error);
      return false;
    }
  }

  /**
   * 检查是否有日历权限
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('检查日历权限失败:', error);
      return false;
    }
  }

  /**
   * 获取默认日历
   */
  async getDefaultCalendar(): Promise<Calendar.Calendar | null> {
    try {
      if (!this.hasPermission) {
        await this.requestPermissions();
      }
      
      if (!this.hasPermission) {
        return null;
      }

      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      if (defaultCalendar) {
        this.defaultCalendarId = defaultCalendar.id;
      }
      return defaultCalendar;
    } catch (error) {
      console.error('获取默认日历失败:', error);
      return null;
    }
  }

  /**
   * 创建或获取 KonKon 专用日历
   */
  async getOrCreateKonKonCalendar(): Promise<string | null> {
    try {
      if (!this.hasPermission) {
        await this.requestPermissions();
      }
      
      if (!this.hasPermission) {
        return null;
      }

      // 先查找是否已经有 KonKon 日历
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const existingCalendar = calendars.find(cal => cal.title === 'KonKon 家庭日历');
      
      if (existingCalendar) {
        return existingCalendar.id;
      }

      // 创建新的 KonKon 日历
      const defaultCalendar = await this.getDefaultCalendar();
      if (!defaultCalendar) {
        return null;
      }

      const calendarId = await Calendar.createCalendarAsync({
        title: 'KonKon 家庭日历',
        color: '#3b82f6',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendar.source.id,
        source: defaultCalendar.source,
        name: 'KonKon 家庭日历',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });

      return calendarId;
    } catch (error) {
      console.error('创建 KonKon 日历失败:', error);
      return null;
    }
  }

  /**
   * 创建系统日历事件
   */
  async createSystemEvent(eventData: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    allDay?: boolean;
  }): Promise<string | null> {
    try {
      if (!this.hasPermission) {
        await this.requestPermissions();
      }
      
      if (!this.hasPermission) {
        return null;
      }

      const calendarId = await this.getOrCreateKonKonCalendar();
      if (!calendarId) {
        return null;
      }

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: eventData.title,
        notes: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location,
        allDay: eventData.allDay || false,
        timeZone: 'default',
      });

      return eventId;
    } catch (error) {
      console.error('创建系统事件失败:', error);
      return null;
    }
  }

  /**
   * 更新系统日历事件
   */
  async updateSystemEvent(eventId: string, eventData: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    allDay?: boolean;
  }): Promise<boolean> {
    try {
      if (!this.hasPermission) {
        return false;
      }

      await Calendar.updateEventAsync(eventId, {
        title: eventData.title,
        notes: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location,
        allDay: eventData.allDay,
      });

      return true;
    } catch (error) {
      console.error('更新系统事件失败:', error);
      return false;
    }
  }

  /**
   * 删除系统日历事件
   */
  async deleteSystemEvent(eventId: string): Promise<boolean> {
    try {
      if (!this.hasPermission) {
        return false;
      }

      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      console.error('删除系统事件失败:', error);
      return false;
    }
  }

  /**
   * 获取系统日历事件
   */
  async getSystemEvents(startDate: Date, endDate: Date): Promise<Calendar.Event[]> {
    try {
      if (!this.hasPermission) {
        await this.requestPermissions();
      }
      
      if (!this.hasPermission) {
        return [];
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const events = await Calendar.getEventsAsync(
        calendars.map(cal => cal.id),
        startDate,
        endDate
      );

      return events;
    } catch (error) {
      console.error('获取系统事件失败:', error);
      return [];
    }
  }

  /**
   * 启动系统日历编辑界面
   */
  async launchSystemCalendarEdit(eventData?: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    allDay?: boolean;
  }): Promise<boolean> {
    try {
      if (!this.hasPermission) {
        await this.requestPermissions();
      }
      
      if (!this.hasPermission) {
        return false;
      }

      const result = await Calendar.createEventInCalendarAsync(eventData || {});
      return result.action === Calendar.CalendarDialogResultActions.saved;
    } catch (error) {
      console.error('启动系统日历编辑失败:', error);
      return false;
    }
  }
}

export default CalendarService.getInstance(); 