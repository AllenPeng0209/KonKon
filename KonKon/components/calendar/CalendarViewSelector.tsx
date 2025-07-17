import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import AgendaListView from './AgendaListView';
import { CalendarStyleId, CalendarViewProps } from './CalendarViewTypes';
import CardMonthView from './CardMonthView';
import CompactMonthView from './CompactMonthView';
import DayFocusView from './DayFocusView';
import FamilyGridView from './FamilyGridView';
import GridMonthView from './GridMonthView';
import ThreeDayView from './ThreeDayView';
import TimelineView from './TimelineView';
import WeeklyGridView from './WeeklyGridView';

// 暂时用GridMonthView作为其他视图的占位符，稍后会创建完整的组件
const YearOverviewView = GridMonthView;

interface CalendarViewSelectorProps extends CalendarViewProps {
  style?: CalendarStyleId;
}

export default function CalendarViewSelector({
  style,
  ...calendarProps
}: CalendarViewSelectorProps) {
  const [currentStyle, setCurrentStyle] = useState<CalendarStyleId>('grid-month');

  useEffect(() => {
    loadCalendarStyle();
    
    // 监听焦点状态，当从设置页面返回时重新加载样式
    const interval = setInterval(loadCalendarStyle, 1000); // 每秒检查一次
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (style) {
      setCurrentStyle(style);
    }
  }, [style]);

  const loadCalendarStyle = async () => {
    try {
      const savedStyle = await AsyncStorage.getItem('calendar_style');
      if (savedStyle && isValidCalendarStyle(savedStyle)) {
        setCurrentStyle(savedStyle as CalendarStyleId);
      }
    } catch (error) {
      console.error('Error loading calendar style:', error);
    }
  };

  const isValidCalendarStyle = (style: string): boolean => {
    const validStyles: CalendarStyleId[] = [
      'grid-month',
      'weekly-grid',
      'timeline',
      'day-focus',
      'agenda-list',
      'compact-month',
      'three-day',
      'family-grid',
      'card-month',
      'year-overview',
    ];
    return validStyles.includes(style as CalendarStyleId);
  };

  const renderCalendarView = () => {
    switch (currentStyle) {
      case 'grid-month':
        return <GridMonthView {...calendarProps} />;
      case 'weekly-grid':
        return <WeeklyGridView {...calendarProps} />;
      case 'timeline':
        return <TimelineView {...calendarProps} />;
      case 'day-focus':
        return <DayFocusView {...calendarProps} />;
      case 'agenda-list':
        return <AgendaListView {...calendarProps} />;
      case 'compact-month':
        return <CompactMonthView {...calendarProps} />;
      case 'three-day':
        return <ThreeDayView {...calendarProps} />;
      case 'family-grid':
        return <FamilyGridView {...calendarProps} />;
      case 'card-month':
        return <CardMonthView {...calendarProps} />;
      case 'year-overview':
        return <YearOverviewView {...calendarProps} />;
      default:
        return <GridMonthView {...calendarProps} />;
    }
  };

  return renderCalendarView();
} 