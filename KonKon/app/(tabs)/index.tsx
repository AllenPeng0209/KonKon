import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import SmartButton from '@/components/ui/SmartButton';
import AddEventModal from '@/components/AddEventModal';
import EventListModal from '@/components/EventListModal';
import { useEvents } from '@/hooks/useEvents';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('全部');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventListModal, setShowEventListModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  // 事件管理
  const { 
    events, 
    loading: eventsLoading, 
    error: eventsError,
    userFamilyDetails,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate,
    getMonthEvents,
    fetchEvents
  } = useEvents();

  // 过滤选项
  const filterOptions = [
    { label: '全部', icon: '📊', color: '#8E8E93', bgColor: '#F2F2F7' },
    { label: '日曆', icon: '🔔', color: '#FF9500', bgColor: '#FFF3E0' },
    { label: '想法', icon: '💡', color: '#9C27B0', bgColor: '#F3E5F5' },
    { label: '心情', icon: '❤️', color: '#E91E63', bgColor: '#FCE4EC' },
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const navigateToProfile = () => {
    router.push('/profile');
  };

  // 跳转到洞察页面
  const navigateToExplore = () => {
    router.push('/explore');
  };

  // 处理过滤菜单
  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    setShowFilterMenu(false);
  };

  const toggleFilterMenu = () => {
    setShowFilterMenu(!showFilterMenu);
  };

  // 处理手动添加事件
  const handleManualAdd = () => {
    setSelectedDate(new Date());
    setEditingEvent(null); // 清空编辑状态
    setShowAddEventModal(true);
  };

  // 处理事件创建
  const handleCreateEvent = async (eventData: any) => {
    try {
      const result = await createEvent(eventData);
      
      if (result) {
        Alert.alert('成功', '事件创建成功');
        // 重新获取当月事件
        const currentDate = new Date();
        fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
      } else {
        // 显示 eventsError 中的具体错误信息
        const errorMessage = eventsError || '创建事件失败，请检查网络连接和权限';
        Alert.alert('错误', errorMessage);
      }
    } catch (error) {
      console.error('创建事件异常:', error);
      const errorMessage = error instanceof Error ? error.message : '创建事件失败';
      Alert.alert('错误', errorMessage);
    }
  };

  // 处理事件更新
  const handleUpdateEvent = async (eventId: string, eventData: any) => {
    try {
      const result = await updateEvent(eventId, eventData);
      
      if (result) {
        Alert.alert('成功', '事件更新成功');
        // 重新获取当月事件
        const currentDate = new Date();
        fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
      } else {
        // 显示 eventsError 中的具体错误信息
        const errorMessage = eventsError || '更新事件失败，请检查网络连接和权限';
        Alert.alert('错误', errorMessage);
      }
    } catch (error) {
      console.error('更新事件异常:', error);
      const errorMessage = error instanceof Error ? error.message : '更新事件失败';
      Alert.alert('错误', errorMessage);
    }
  };

  // 处理打开编辑事件
  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setShowAddEventModal(true);
  };

  // 处理关闭编辑事件
  const handleCloseEditEvent = () => {
    setEditingEvent(null);
    setShowAddEventModal(false);
  };

  // 处理日期点击
  const handleDatePress = (day: number) => {
    const clickedDate = new Date(year, month - 1, day);
    setSelectedDate(clickedDate);
    
    // 显示该日期的事件
    const dayEvents = getEventsByDate(clickedDate);
    if (dayEvents.length > 0) {
      setShowEventListModal(true);
    } else {
      // 如果没有事件，询问是否要添加新事件
      Alert.alert(
        '这天没有事件',
        '是否要为这天添加新事件？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '添加事件',
            onPress: () => {
              setEditingEvent(null); // 清空编辑状态
              setShowAddEventModal(true);
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  // 获取当前日期信息
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const today = currentDate.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  
  // 获取当前月份的天数
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  // 生成日历数据
  const calendarDays = [];
  // 前面的空白日期
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  // 当月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const renderCalendarDay = (day: number | null, index: number) => {
    const isToday = day === today;
    const isEmpty = day === null;
    
    // 检查该日期是否有事件
    const hasEvents = day ? getEventsByDate(new Date(year, month - 1, day)).length > 0 : false;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          isToday && styles.todayContainer,
          isEmpty && styles.emptyDay,
        ]}
        onPress={() => day && handleDatePress(day)}
        disabled={isEmpty}
      >
        {!isEmpty && (
          <>
            <Text style={[
              styles.calendarDayText,
              isToday && styles.todayText,
            ]}>
              {day}
            </Text>
            {hasEvents && (
              <View style={styles.eventDot} />
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, styles.activeTab]}>记录</Text>
          <TouchableOpacity onPress={navigateToExplore}>
            <Text style={styles.headerTitle}>洞察</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.filterButton} onPress={toggleFilterMenu}>
            <Text style={styles.filterText}>{selectedFilter}</Text>
            <Text style={styles.filterIcon}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} onPress={navigateToProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 日历部分 */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthYear}>{year}年{month}月</Text>
            <Text style={styles.calendarNote}>记录家庭美好时光</Text>
          </View>
          
          {/* 星期标题 */}
          <View style={styles.weekHeader}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          
          {/* 日历网格 */}
          <View style={styles.calendarGrid}>
            {calendarDays.map(renderCalendarDay)}
          </View>
        </View>

        {/* 今天日程 */}
        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayIcon}>📅</Text>
            <Text style={styles.todayTitle}>今天 {month}月{today}日</Text>
          </View>
          
          {/* 显示今天的事件 */}
          {(() => {
            const todayEvents = getEventsByDate(new Date(year, month - 1, today));
            if (todayEvents.length > 0) {
              return (
                <View style={styles.eventsContainer}>
                  <Text style={styles.eventsTitle}>今日事件</Text>
                  {todayEvents.map((event) => (
                    <TouchableOpacity 
                      key={event.id} 
                      style={styles.eventItem}
                      onPress={() => handleEditEvent(event)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.eventColor, { backgroundColor: event.color || '#007AFF' }]} />
                      <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        {event.description && (
                          <Text style={styles.eventDescription}>{event.description}</Text>
                        )}
                        <Text style={styles.eventTime}>
                          {new Date(event.start_ts * 1000).toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          {event.location && ` · ${event.location}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            } else {
              return (
                <View style={styles.aiAssistant}>
                  <View style={styles.aiAvatar}>
                    <Text style={styles.aiEmoji}>🦝</Text>
                  </View>
                  <View style={styles.aiContent}>
                    <Text style={styles.aiGreeting}>今天还没有安排事件</Text>
                    <Text style={styles.aiSuggestion}>点击下方"手动添加"来创建新事件</Text>
                  </View>
                </View>
              );
            }
          })()}
          
          <TouchableOpacity style={styles.autoRecordButton}>
            <Text style={styles.autoRecordText}>智能提醒家庭安排 点我设置 〉</Text>
          </TouchableOpacity>
          
          {/* 快捷功能 */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>👶</Text>
              <Text style={styles.quickActionText}>孩子日程</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>🏠</Text>
              <Text style={styles.quickActionText}>家务安排</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>🎂</Text>
              <Text style={styles.quickActionText}>纪念日提醒</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 底部快速记录按钮 */}
      <SmartButton 
        onPress={() => console.log('Record pressed')}
        onMorePress={() => console.log('More pressed')}
        onManualAddPress={handleManualAdd}
      />

      {/* 过滤菜单 */}
      {showFilterMenu && (
        <View style={styles.filterMenuContainer}>
          <TouchableOpacity 
            style={styles.filterMenuOverlay} 
            onPress={() => setShowFilterMenu(false)}
          />
          <View style={styles.filterMenu}>
            {filterOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterOption,
                  selectedFilter === option.label && styles.selectedFilterOption
                ]}
                onPress={() => handleFilterSelect(option.label)}
              >
                                 <View style={styles.filterOptionContent}>
                   <View style={[styles.filterOptionIconContainer, { backgroundColor: option.bgColor }]}>
                     <Text style={[styles.filterOptionIcon, { color: option.color }]}>
                       {option.icon}
                     </Text>
                   </View>
                   <Text style={[
                     styles.filterOptionText,
                     selectedFilter === option.label && styles.selectedFilterOptionText
                   ]}>
                     {option.label}
                   </Text>
                 </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* 添加事件模态框 */}
      <AddEventModal
        visible={showAddEventModal}
        onClose={handleCloseEditEvent}
        onSave={handleCreateEvent}
        onUpdate={handleUpdateEvent}
        initialDate={selectedDate || new Date()}
        userFamilies={userFamilyDetails}
        editingEvent={editingEvent}
      />
      
      {/* 事件列表模态框 */}
      <EventListModal
        visible={showEventListModal}
        onClose={() => setShowEventListModal(false)}
        events={selectedDate ? getEventsByDate(selectedDate) : []}
        date={selectedDate || new Date()}
        onDeleteEvent={async (eventId: string) => {
          const success = await deleteEvent(eventId);
          if (success) {
            Alert.alert('成功', '事件已删除');
            // 重新获取当月事件
            const currentDate = new Date();
            fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 20,
    color: '#999',
  },
  activeTab: {
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  filterIcon: {
    fontSize: 10,
    color: '#666',
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#e8f4fd',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 14,
    color: '#666',
    width: (screenWidth - 80) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: (screenWidth - 80) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyDay: {
    opacity: 0,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  todayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
  },
  todaySection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  aiAssistant: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  aiAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiEmoji: {
    fontSize: 24,
  },
  aiContent: {
    flex: 1,
  },
  aiGreeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  aiSuggestion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  autoRecordButton: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  autoRecordText: {
    fontSize: 14,
    color: '#007AFF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // 事件相关样式
  eventsContainer: {
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  eventColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  eventTime: {
    fontSize: 12,
    color: '#999',
  },
  
  // 过滤菜单样式
  filterMenuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  filterMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterMenu: {
    position: 'absolute',
    top: 105, // 往下调整更多，避免遮挡按钮
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#f0f8ff',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOptionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterOptionIcon: {
    fontSize: 14,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedFilterOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },

});