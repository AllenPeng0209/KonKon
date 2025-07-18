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
      console.log('开始创建系统事件:', eventData);
      
      // 检查 Calendar 模块是否可用
      const isAvailable = await Calendar.isAvailableAsync();
      if (!isAvailable) {
        console.error('Calendar 模块不可用');
        return null;
      }
      
      if (!this.hasPermission) {
        console.log('没有权限，请求权限...');
        await this.requestPermissions();
      }
      
      if (!this.hasPermission) {
        console.log('权限被拒绝，无法创建事件');
        return null;
      }

      const calendarId = await this.getOrCreateKonKonCalendar();
      if (!calendarId) {
        console.log('无法获取或创建日历');
        return null;
      }

      console.log('使用日历ID:', calendarId);
      
      // 验证事件数据
      if (!eventData.title || eventData.title.trim() === '') {
        console.error('事件标题不能为空');
        return null;
      }
      
      if (!eventData.startDate || !eventData.endDate) {
        console.error('开始时间和结束时间不能为空');
        return null;
      }
      
      if (eventData.startDate >= eventData.endDate) {
        console.error('开始时间必须早于结束时间');
        return null;
      }

      const eventToCreate = {
        title: eventData.title,
        notes: eventData.description || '',
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location || '',
        allDay: eventData.allDay || false,
        timeZone: 'default',
      };
      
      console.log('创建事件数据:', eventToCreate);

      const eventId = await Calendar.createEventAsync(calendarId, eventToCreate);
      
      console.log('事件创建成功，ID:', eventId);
      return eventId;
    } catch (error) {
      console.error('创建系统事件失败:', error);
      console.error('错误详情:', JSON.stringify(error, null, 2));
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