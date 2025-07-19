import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { ChoreTaskService, ChoreTemplateService, ChoreTaskWithDetails, ChoreTemplate } from '@/lib/choreService';
import ChoreViewSelector from '@/components/chore/ChoreViewSelector';
import { ChoreViewStyleId, choreViewConfigs } from '@/components/chore/ChoreViewTypes';
import AddChoreModal from '@/components/chore/AddChoreModal';
import ChoreTaskModal from '@/components/chore/ChoreTaskModal';
import ChoreViewStyleModal from '@/components/chore/ChoreViewStyleModal';

export default function ChoreManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentFamily, familyMembers } = useFamily();
  
  const [tasks, setTasks] = useState<ChoreTaskWithDetails[]>([]);
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [currentViewStyle, setCurrentViewStyle] = useState<ChoreViewStyleId>('task-board');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 模態框狀態
  const [showAddChoreModal, setShowAddChoreModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ChoreTaskWithDetails | null>(null);

  useEffect(() => {
    loadInitialData();
    loadViewStyle();
  }, [currentFamily]);

  useEffect(() => {
    if (currentFamily) {
      loadTasks();
    }
  }, [currentFamily, currentMonth]);

  const loadInitialData = async () => {
    if (!currentFamily) return;
    
    try {
      setIsLoading(true);
      await Promise.all([
        loadTasks(),
        loadTemplates(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('錯誤', '載入數據時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!currentFamily) return;
    
    try {
      const familyTasks = await ChoreTaskService.getByFamily(currentFamily.id);
      setTasks(familyTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const allTemplates = await ChoreTemplateService.getAll();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadViewStyle = async () => {
    try {
      const savedStyle = await AsyncStorage.getItem('chore_view_style');
      if (savedStyle && isValidViewStyle(savedStyle)) {
        setCurrentViewStyle(savedStyle as ChoreViewStyleId);
      }
    } catch (error) {
      console.error('Error loading view style:', error);
    }
  };

  const saveViewStyle = async (style: ChoreViewStyleId) => {
    try {
      await AsyncStorage.setItem('chore_view_style', style);
      setCurrentViewStyle(style);
    } catch (error) {
      console.error('Error saving view style:', error);
    }
  };

  const isValidViewStyle = (style: string): boolean => {
    return choreViewConfigs.some(config => config.id === style);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTaskPress = (task: ChoreTaskWithDetails) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };

  const handleAddChore = () => {
    setShowAddChoreModal(true);
  };

  const handleChoreAdded = () => {
    setShowAddChoreModal(false);
    loadTasks(); // 重新載入任務
  };

  const handleTaskUpdated = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
    loadTasks(); // 重新載入任務
  };

  const handleStyleChange = (style: ChoreViewStyleId) => {
    saveViewStyle(style);
    setShowStyleModal(false);
  };

  const getCurrentStyleConfig = () => {
    return choreViewConfigs.find(config => config.id === currentViewStyle);
  };

  if (!currentFamily) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noFamilyContainer}>
          <Text style={styles.noFamilyTitle}>請先加入或創建家庭</Text>
          <Text style={styles.noFamilySubtitle}>
            家務管理需要在家庭環境中使用
          </Text>
          <TouchableOpacity
            style={styles.createFamilyButton}
            onPress={() => router.push('/create-family')}
          >
            <Text style={styles.createFamilyButtonText}>創建家庭</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部導航欄 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← 返回</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>家務管理</Text>
          <Text style={styles.headerSubtitle}>
            {currentFamily.name}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowStyleModal(true)}
          >
            <Text style={styles.headerButtonText}>視圖</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 當前視圖樣式指示器 */}
      <View style={styles.styleIndicator}>
        <View style={[
          styles.styleIndicatorDot,
          { backgroundColor: getCurrentStyleConfig()?.color || '#3B82F6' }
        ]} />
        <Text style={styles.styleIndicatorText}>
          {getCurrentStyleConfig()?.name || '任務看板'}
        </Text>
        {getCurrentStyleConfig()?.gameified && (
          <View style={styles.gameifiedBadge}>
            <Text style={styles.gameifiedBadgeText}>🎮</Text>
          </View>
        )}
      </View>

      {/* 家務視圖 */}
      <View style={styles.choreViewContainer}>
        <ChoreViewSelector
          tasks={tasks}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          onDatePress={handleDatePress}
          onTaskPress={handleTaskPress}
          onMonthChange={handleMonthChange}
          familyMembers={familyMembers}
          style={currentViewStyle}
        />
      </View>

      {/* 浮動添加按鈕 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddChore}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* 模態框 */}
      <AddChoreModal
        visible={showAddChoreModal}
        onClose={() => setShowAddChoreModal(false)}
        onChoreAdded={handleChoreAdded}
        templates={templates}
        familyMembers={familyMembers}
        currentFamily={currentFamily}
      />

      <ChoreTaskModal
        visible={showTaskModal}
        task={selectedTask}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={handleTaskUpdated}
        familyMembers={familyMembers}
      />

      <ChoreViewStyleModal
        visible={showStyleModal}
        currentStyle={currentViewStyle}
        onStyleSelect={handleStyleChange}
        onClose={() => setShowStyleModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  styleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  styleIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  styleIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  gameifiedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gameifiedBadgeText: {
    fontSize: 10,
  },
  choreViewContainer: {
    flex: 1,
  },
  addButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  noFamilyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noFamilyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  noFamilySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  createFamilyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFamilyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});