/**
 * 高级重复事件系统
 * 支持复杂重复模式和异常处理
 */

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number; // 间隔，默认为1
  byDay?: string[]; // 星期几 ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  byMonthDay?: number[]; // 月份中的第几天 [1-31]
  byMonth?: number[]; // 月份 [1-12]
  count?: number; // 重复次数
  until?: Date; // 结束日期
}

export interface RecurrenceInstance {
  start: Date;
  end: Date;
  isException?: boolean;
  exceptionType?: 'cancelled' | 'modified' | 'moved';
  originalEventId?: string;
  modifiedEventId?: string;
}

export interface RecurrenceException {
  date: Date;
  type: 'cancelled' | 'modified' | 'moved';
  modifiedEventId?: string;
}

/**
 * 解析重复规则字符串
 */
export function parseRecurrenceRule(ruleString: string): RecurrenceRule | null {
  if (!ruleString) return null;

  try {
    // 支持RFC 5545 RRULE格式
    const rule: Partial<RecurrenceRule> = {};
    const parts = ruleString.split(';');

    for (const part of parts) {
      const [key, value] = part.split('=');
      switch (key) {
        case 'FREQ':
          rule.frequency = value as RecurrenceRule['frequency'];
          break;
        case 'INTERVAL':
          rule.interval = parseInt(value, 10);
          break;
        case 'BYDAY':
          rule.byDay = value.split(',');
          break;
        case 'BYMONTHDAY':
          rule.byMonthDay = value.split(',').map(d => parseInt(d, 10));
          break;
        case 'BYMONTH':
          rule.byMonth = value.split(',').map(m => parseInt(m, 10));
          break;
        case 'COUNT':
          rule.count = parseInt(value, 10);
          break;
        case 'UNTIL':
          rule.until = new Date(value);
          break;
      }
    }

    return rule as RecurrenceRule;
  } catch (error) {
    console.error('解析重复规则失败:', error);
    return null;
  }
}

/**
 * 生成重复规则字符串
 */
export function generateRecurrenceRule(rule: RecurrenceRule): string {
  const parts: string[] = [];

  parts.push(`FREQ=${rule.frequency}`);
  
  if (rule.interval && rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`);
  }
  
  if (rule.byDay && rule.byDay.length > 0) {
    parts.push(`BYDAY=${rule.byDay.join(',')}`);
  }
  
  if (rule.byMonthDay && rule.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`);
  }
  
  if (rule.byMonth && rule.byMonth.length > 0) {
    parts.push(`BYMONTH=${rule.byMonth.join(',')}`);
  }
  
  if (rule.count) {
    parts.push(`COUNT=${rule.count}`);
  } else if (rule.until) {
    const untilDate = typeof rule.until === 'string' ? new Date(rule.until) : rule.until;
    if (untilDate instanceof Date && !isNaN(untilDate.getTime())) {
      parts.push(`UNTIL=${untilDate.toISOString().split('T')[0].replace(/-/g, '')}`);
    }
  }

  return parts.join(';');
}

/**
 * 智能解析自然语言重复模式
 */
export function parseNaturalLanguageRecurrence(text: string): RecurrenceRule | null {
  const patterns = [
    // 每天
    { pattern: /每天|daily/i, rule: { frequency: 'DAILY' as const, interval: 1 } },
    { pattern: /每(\d+)天/i, rule: { frequency: 'DAILY' as const }, extract: (match: RegExpMatchArray) => ({ interval: parseInt(match[1], 10) }) },
    
    // 每周
    { pattern: /每周|weekly/i, rule: { frequency: 'WEEKLY' as const, interval: 1 } },
    { pattern: /每(\d+)周/i, rule: { frequency: 'WEEKLY' as const }, extract: (match: RegExpMatchArray) => ({ interval: parseInt(match[1], 10) }) },
    
    // 工作日
    { pattern: /工作日|weekday/i, rule: { frequency: 'WEEKLY' as const, interval: 1, byDay: ['MO', 'TU', 'WE', 'TH', 'FR'] } },
    
    // 周末
    { pattern: /周末|weekend/i, rule: { frequency: 'WEEKLY' as const, interval: 1, byDay: ['SA', 'SU'] } },
    
    // 特定星期几
    { pattern: /每周([一二三四五六日])/i, rule: { frequency: 'WEEKLY' as const, interval: 1 }, extract: (match: RegExpMatchArray) => {
      const dayMap: Record<string, string> = { '一': 'MO', '二': 'TU', '三': 'WE', '四': 'TH', '五': 'FR', '六': 'SA', '日': 'SU' };
      return { byDay: [dayMap[match[1]]] };
    }},
    
    // 每月
    { pattern: /每月|monthly/i, rule: { frequency: 'MONTHLY' as const, interval: 1 } },
    { pattern: /每(\d+)月/i, rule: { frequency: 'MONTHLY' as const }, extract: (match: RegExpMatchArray) => ({ interval: parseInt(match[1], 10) }) },
    
    // 每月特定日期
    { pattern: /每月(\d+)号/i, rule: { frequency: 'MONTHLY' as const, interval: 1 }, extract: (match: RegExpMatchArray) => ({ byMonthDay: [parseInt(match[1], 10)] }) },
    
    // 每年
    { pattern: /每年|yearly/i, rule: { frequency: 'YEARLY' as const, interval: 1 } },
    
    // 双周
    { pattern: /双周|every two weeks/i, rule: { frequency: 'WEEKLY' as const, interval: 2 } },
  ];

  for (const { pattern, rule, extract } of patterns) {
    const match = text.match(pattern);
    if (match) {
      const baseRule = { ...rule };
      if (extract) {
        Object.assign(baseRule, extract(match));
      }
      return baseRule as RecurrenceRule;
    }
  }

  return null;
}

/**
 * 生成重复事件实例
 */
export function generateRecurrenceInstances(
  startDate: Date,
  endDate: Date,
  rule: RecurrenceRule,
  exceptions: RecurrenceException[] = [],
  limitDate?: Date,
  maxInstances: number = 365
): RecurrenceInstance[] {
  const instances: RecurrenceInstance[] = [];
  const eventDuration = endDate.getTime() - startDate.getTime();
  
  let count = 0;
  
  // 设置一个合理的生成结束日期，以避免无限循环
  const absoluteEndDate = new Date(startDate);
  absoluteEndDate.setFullYear(absoluteEndDate.getFullYear() + 2); 
  const finalEndDate = rule.until ? new Date(rule.until) : (limitDate || absoluteEndDate);
  const countLimit = rule.count || maxInstances;

  let cursorDate = new Date(startDate);
  cursorDate.setHours(0, 0, 0, 0); 
  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);

  while (count < countLimit && cursorDate <= finalEndDate) {
    if (matchesRecurrenceRule(cursorDate, rule, startDay)) {
      count++;

      const exception = exceptions.find(ex => {
          const exDate = new Date(ex.date);
          exDate.setHours(0, 0, 0, 0);
          return exDate.getTime() === cursorDate.getTime();
      });

      const instanceStartDate = new Date(cursorDate);
      instanceStartDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
      
      const instanceEndDate = new Date(instanceStartDate.getTime() + eventDuration);

      if (exception) {
          if (exception.type !== 'cancelled') {
              instances.push({
                  start: instanceStartDate,
                  end: instanceEndDate,
                  isException: true,
                  exceptionType: exception.type,
                  modifiedEventId: exception.modifiedEventId,
              });
          }
      } else {
          instances.push({
              start: instanceStartDate,
              end: instanceEndDate,
          });
      }
    }
    
    // 移动到下一天进行检查
    cursorDate.setDate(cursorDate.getDate() + 1);
  }

  return instances;
}

/**
 * 检查日期是否符合重复规则
 */
function matchesRecurrenceRule(date: Date, rule: RecurrenceRule, startDate: Date): boolean {
  // 日期必须在开始日期或之后
  if (date < startDate) {
    return false;
  }
  
  const interval = rule.interval || 1;

  // 检查频率和间隔
  switch (rule.frequency) {
    case 'DAILY':
      const daysDiff = Math.round((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff % interval !== 0) return false;
      break;
    case 'WEEKLY':
      const weeksDiff = Math.floor(Math.round((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / 7);
      if (weeksDiff % interval !== 0) return false;
      break;
    case 'MONTHLY':
      const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
      if (monthsDiff % interval !== 0) return false;
      if (rule.byMonthDay && !rule.byMonthDay.includes(date.getDate())) {
        return false;
      }
      if (!rule.byMonthDay && date.getDate() !== startDate.getDate()) {
        return false;
      }
      break;
    case 'YEARLY':
      const yearsDiff = date.getFullYear() - startDate.getFullYear();
      if (yearsDiff % interval !== 0) return false;
      if (date.getMonth() !== startDate.getMonth() || date.getDate() !== startDate.getDate()) {
          return false;
      }
      break;
  }

  // 检查 byDay（星期几）
  if (rule.byDay && rule.byDay.length > 0) {
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const currentDay = dayMap[date.getDay()];
    if (!rule.byDay.includes(currentDay)) {
      return false;
    }
  }
  
  // 检查 byMonth（月份），仅在频率为 yearly 时有意义
  if (rule.frequency === 'YEARLY' && rule.byMonth && rule.byMonth.length > 0) {
    if (!rule.byMonth.includes(date.getMonth() + 1)) {
      return false;
    }
  }

  return true;
}

/**
 * 获取下一个重复日期
 */
function getNextRecurrenceDate(currentDate: Date, rule: RecurrenceRule): Date {
  const nextDate = new Date(currentDate);
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + (7 * interval));
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
  }

  return nextDate;
}

/**
 * 格式化重复规则描述
 */
export function formatRecurrenceDescription(rule: RecurrenceRule): string {
  if (!rule) return '';

  const { frequency, interval = 1, byDay, byMonthDay, count, until } = rule;
  
  let description = '';
  
  switch (frequency) {
    case 'DAILY':
      description = interval === 1 ? '每天' : `每${interval}天`;
      break;
    case 'WEEKLY':
      if (byDay && byDay.length > 0) {
        const dayNames: Record<string, string> = {
          'MO': '周一', 'TU': '周二', 'WE': '周三', 'TH': '周四', 
          'FR': '周五', 'SA': '周六', 'SU': '周日'
        };
        const days = byDay.map(day => dayNames[day]).join('、');
        description = interval === 1 ? `每周${days}` : `每${interval}周${days}`;
      } else {
        description = interval === 1 ? '每周' : `每${interval}周`;
      }
      break;
    case 'MONTHLY':
      if (byMonthDay && byMonthDay.length > 0) {
        const days = byMonthDay.join('、');
        description = interval === 1 ? `每月${days}号` : `每${interval}月${days}号`;
      } else {
        description = interval === 1 ? '每月' : `每${interval}月`;
      }
      break;
    case 'YEARLY':
      description = interval === 1 ? '每年' : `每${interval}年`;
      break;
  }

  if (count) {
    description += `，共${count}次`;
  } else if (until) {
    description += `，直到${until.toLocaleDateString('zh-CN')}`;
  }

  return description;
}

/**
 * 验证重复规则
 */
export function validateRecurrenceRule(rule: RecurrenceRule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rule.frequency) {
    errors.push('重复频率不能为空');
  }

  if (rule.interval && rule.interval < 1) {
    errors.push('重复间隔必须大于0');
  }

  if (rule.count && rule.count < 1) {
    errors.push('重复次数必须大于0');
  }

  if (rule.until && rule.until < new Date()) {
    errors.push('结束日期不能早于当前日期');
  }

  if (rule.byMonthDay) {
    for (const day of rule.byMonthDay) {
      if (day < 1 || day > 31) {
        errors.push('月份日期必须在1-31之间');
        break;
      }
    }
  }

  if (rule.byMonth) {
    for (const month of rule.byMonth) {
      if (month < 1 || month > 12) {
        errors.push('月份必须在1-12之间');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}