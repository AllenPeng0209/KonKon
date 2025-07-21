/**
 * 高级重复事件系统
 * 支持复杂重复模式和异常处理
 */

// 重复事件规则引擎
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // 间隔，如每2天、每3周
  byWeekDay?: number[]; // 周几重复 (0=Sunday, 1=Monday, etc.)
  byMonthDay?: number[]; // 月份中的第几天
  byMonth?: number[]; // 第几个月
  until?: Date; // 结束日期
  count?: number; // 重复次数
}

export interface RecurrenceInstance {
  start: Date;
  end: Date;
  title?: string;
  description?: string;
  location?: string;
  color?: string;
  exceptionType?: 'cancelled' | 'modified' | 'moved';
  modifiedEventId?: string;
}

export interface RecurrenceException {
  date: Date;
  type: 'cancelled' | 'modified' | 'moved';
  modifiedEventId?: string;
}

// 将重复选项转换为 RRULE 字符串
export const generateRecurrenceRule = (rule: RecurrenceRule): string => {
  let rrule = `FREQ=${rule.frequency.toUpperCase()}`;
  
  if (rule.interval > 1) {
    rrule += `;INTERVAL=${rule.interval}`;
  }
  
  if (rule.byWeekDay && rule.byWeekDay.length > 0) {
    const weekDays = rule.byWeekDay.map(day => {
      const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      return days[day];
    }).join(',');
    rrule += `;BYDAY=${weekDays}`;
  }
  
  if (rule.byMonthDay && rule.byMonthDay.length > 0) {
    rrule += `;BYMONTHDAY=${rule.byMonthDay.join(',')}`;
  }
  
  if (rule.byMonth && rule.byMonth.length > 0) {
    rrule += `;BYMONTH=${rule.byMonth.join(',')}`;
  }
  
  if (rule.until) {
    const utcDate = rule.until.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    rrule += `;UNTIL=${utcDate}`;
  }
  
  if (rule.count && rule.count > 0) {
    rrule += `;COUNT=${rule.count}`;
  }
  
  return rrule;
};

// 解析 RRULE 字符串为重复规则对象
export const parseRecurrenceRule = (rrule: string): RecurrenceRule | null => {
  if (!rrule) return null;
  
  try {
    const rule: Partial<RecurrenceRule> = {};
    const parts = rrule.split(';');
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      
      switch (key) {
        case 'FREQ':
          rule.frequency = value.toLowerCase() as RecurrenceRule['frequency'];
          break;
        case 'INTERVAL':
          rule.interval = parseInt(value);
          break;
        case 'BYDAY':
          const dayMap: { [key: string]: number } = {
            SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6
          };
          rule.byWeekDay = value.split(',').map(d => dayMap[d]).filter(d => d !== undefined);
          break;
        case 'BYMONTHDAY':
          rule.byMonthDay = value.split(',').map(d => parseInt(d));
          break;
        case 'BYMONTH':
          rule.byMonth = value.split(',').map(m => parseInt(m));
          break;
        case 'UNTIL':
          // 解析 UTC 格式的日期
          const year = parseInt(value.substring(0, 4));
          const month = parseInt(value.substring(4, 6)) - 1;
          const day = parseInt(value.substring(6, 8));
          rule.until = new Date(year, month, day);
          break;
        case 'COUNT':
          rule.count = parseInt(value);
          break;
      }
    }
    
    // 设置默认值
    if (!rule.interval) rule.interval = 1;
    if (!rule.frequency) return null;
    
    return rule as RecurrenceRule;
  } catch (error) {
    console.error('解析重复规则失败:', error);
    return null;
  }
};

// 生成重复事件实例
export const generateRecurrenceInstances = (
  startDate: Date,
  endDate: Date,
  rule: RecurrenceRule,
  exceptions: RecurrenceException[] = [],
  maxDate: Date,
  maxCount = 365
): RecurrenceInstance[] => {
  const instances: RecurrenceInstance[] = [];
  const duration = endDate.getTime() - startDate.getTime();
  
  let currentDate = new Date(startDate);
  let count = 0;
  
  while (count < maxCount && currentDate <= maxDate) {
    // 检查是否有异常
    const exceptionForDate = exceptions.find(ex => 
      ex.date.toDateString() === currentDate.toDateString()
    );
    
    if (!exceptionForDate || exceptionForDate.type !== 'cancelled') {
      const instanceEnd = new Date(currentDate.getTime() + duration);
      
      instances.push({
        start: new Date(currentDate),
        end: instanceEnd,
        exceptionType: exceptionForDate?.type,
        modifiedEventId: exceptionForDate?.modifiedEventId,
      });
    }
    
    // 如果达到指定次数，停止
    if (rule.count && instances.length >= rule.count) {
      break;
    }
    
    // 如果达到结束日期，停止
    if (rule.until && currentDate >= rule.until) {
      break;
    }
    
    // 计算下一次出现的日期
    currentDate = getNextOccurrence(currentDate, rule);
    count++;
  }
  
  return instances;
};

// 计算下一次重复的日期
const getNextOccurrence = (currentDate: Date, rule: RecurrenceRule): Date => {
  const nextDate = new Date(currentDate);
  
  switch (rule.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + rule.interval);
      break;
      
    case 'weekly':
      if (rule.byWeekDay && rule.byWeekDay.length > 0) {
        // 找到下一个指定的星期几
        const currentWeekDay = nextDate.getDay();
        let found = false;
        
        // 先检查本周是否还有指定的日期
        for (const targetDay of rule.byWeekDay.sort()) {
          if (targetDay > currentWeekDay) {
            nextDate.setDate(nextDate.getDate() + (targetDay - currentWeekDay));
            found = true;
            break;
          }
        }
        
        // 如果本周没有了，跳到下周的第一个指定日期
        if (!found) {
          const firstTargetDay = Math.min(...rule.byWeekDay);
          const daysUntilNextWeek = 7 - currentWeekDay + firstTargetDay;
          nextDate.setDate(nextDate.getDate() + daysUntilNextWeek + (rule.interval - 1) * 7);
        }
      } else {
        nextDate.setDate(nextDate.getDate() + rule.interval * 7);
      }
      break;
      
    case 'monthly':
      if (rule.byMonthDay && rule.byMonthDay.length > 0) {
        // 按月份中的日期重复
        const currentMonthDay = nextDate.getDate();
        let found = false;
        
        for (const targetDay of rule.byMonthDay.sort()) {
          if (targetDay > currentMonthDay) {
            nextDate.setDate(targetDay);
            found = true;
            break;
          }
        }
        
        if (!found) {
          nextDate.setMonth(nextDate.getMonth() + rule.interval);
          nextDate.setDate(Math.min(...rule.byMonthDay));
        }
      } else {
        nextDate.setMonth(nextDate.getMonth() + rule.interval);
      }
      break;
      
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + rule.interval);
      break;
  }
  
  return nextDate;
};

// 验证重复规则
export const validateRecurrenceRule = (rule: RecurrenceRule): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!rule.frequency) {
    errors.push('频率不能为空');
  }
  
  if (!rule.interval || rule.interval < 1) {
    errors.push('间隔必须大于0');
  }
  
  if (rule.byWeekDay && rule.byWeekDay.some(day => day < 0 || day > 6)) {
    errors.push('星期几必须在0-6之间');
  }
  
  if (rule.byMonthDay && rule.byMonthDay.some(day => day < 1 || day > 31)) {
    errors.push('月份中的日期必须在1-31之间');
  }
  
  if (rule.byMonth && rule.byMonth.some(month => month < 1 || month > 12)) {
    errors.push('月份必须在1-12之间');
  }
  
  if (rule.count && rule.count < 1) {
    errors.push('重复次数必须大于0');
  }
  
  if (rule.until && rule.until < new Date()) {
    errors.push('结束日期不能是过去的日期');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};