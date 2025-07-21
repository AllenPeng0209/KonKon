import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { DateData } from 'react-native-calendars';

// 組件導入
import AddMemoryModal from '@/components/album/AddMemoryModal';
import AlbumDetailView from '@/components/album/AlbumDetailView';
import MemoryDetailView from '@/components/album/MemoryDetailView';
import SimpleAlbumView from '@/components/album/SimpleAlbumView';
import SmartAlbumModal from '@/components/album/SmartAlbumModal';
import CalendarViewSelector from '@/components/calendar/CalendarViewSelector';
import ChoreViewSelector from '@/components/chore/ChoreViewSelector';
import { ConfirmationModal, LoadingModal, SuccessModal } from '@/components/common';
import { ActionBar } from '@/components/common/ActionBar';
import { HomeHeader } from '@/components/common/HomeHeader';
import AddEventModal from '@/components/event/AddEventModal';
import EventListModal from '@/components/event/EventListModal';
import FamilyHealthDashboard from '@/components/health/FamilyHealthDashboard';
import MealViewSelector from '@/components/meal/MealViewSelector';
import ShoppingViewSelector from '@/components/shopping/ShoppingViewSelector';

// Hook 導入
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useFeatureSettings } from '@/contexts/FeatureSettingsContext';
import { useChores } from '@/hooks/useChores';
import { useEventManagement } from '@/hooks/useEventManagement';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { useVoiceProcessing } from '@/hooks/useVoiceProcessing';

// 服務和工具導入
import type { SimpleAlbum } from '@/components/album/SimpleAlbumView';
import type { MealRecord } from '@/components/meal/MealViewTypes';
import { t } from '@/lib/i18n';

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const { userFamilies } = useFamily();
  const { featureSettings, resetAllSettings } = useFeatureSettings();

  // 主要狀態
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [currentChoreMonth, setCurrentChoreMonth] = useState(new Date().toISOString().slice(0, 7));

  // 相簿相關狀態
  const [initialMemoryImages, setInitialMemoryImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [showSmartAlbumModal, setShowSmartAlbumModal] = useState(false);
  const [albumCreationData, setAlbumCreationData] = useState<{ albumName: string; theme: string } | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [showMemoryDetail, setShowMemoryDetail] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<SimpleAlbum | null>(null);
  const [showAlbumDetail, setShowAlbumDetail] = useState(false);
  const [albumRefreshTrigger, setAlbumRefreshTrigger] = useState(0);

  // 餐食管理狀態
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);

  // 購物清單模擬數據
  const [shoppingItems, setShoppingItems] = useState([
    { id: '1', name: '牛乳', category: 'dairy', quantity: 2, unit: '本', estimatedPrice: 250, priority: 'high', completed: false, addedBy: 'user1', addedDate: new Date() },
    { id: '2', name: '卵', category: 'dairy', quantity: 1, unit: 'パック', estimatedPrice: 220, priority: 'high', completed: false, addedBy: 'user1', addedDate: new Date() },
  ]);

  const [shoppingStores, setShoppingStores] = useState([
    { id: 's1', name: 'ライフ スーパー', location: '近所', categories: ['produce', 'meat', 'dairy'], currentDeals: [], averagePrices: {}, distance: 0.5, isFrequentlyUsed: true },
  ]);

  const [familyMembers, setFamilyMembers] = useState([
    { id: 'user1', name: 'ママ', avatar: '👩', shoppingPreference: ['produce', 'dairy'], assignedItems: [] },
    { id: 'user2', name: 'パパ', avatar: '👨', shoppingPreference: ['meat', 'snacks'], assignedItems: [] },
  ]);

  const [shoppingBudget, setShoppingBudget] = useState({
    monthly: 50000,
    weekly: 12000,
    spent: 605,
    remaining: 49395,
    categories: { household: 430, pantry: 175 },
  });

  // 使用自定義 Hook
  const imageProcessing = useImageProcessing();
  const voiceProcessing = useVoiceProcessing();
  const eventManagement = useEventManagement();
  const { tasks, isLoading: choresLoading } = useChores();

  // 生成模擬餐食記錄數據
  const generateMockMealRecords = (): MealRecord[] => {
    const today = new Date();
    const records: MealRecord[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayMeals = [
        {
          id: `${dateString}-breakfast`,
          date: dateString,
          mealType: 'breakfast' as const,
          title: ['日式玉子燒定食', '牛奶燕麥粥', '三明治套餐'][Math.floor(Math.random() * 3)],
          calories: 280 + Math.floor(Math.random() * 100),
          tags: ['營養均衡', '快手'],
          time: '08:00',
          emoji: '🌅',
          nutrition: {
            protein: 15 + Math.floor(Math.random() * 10),
            carbs: 35 + Math.floor(Math.random() * 15),
            fat: 8 + Math.floor(Math.random() * 8),
          }
        },
        {
          id: `${dateString}-lunch`,
          date: dateString,
          mealType: 'lunch' as const,
          title: ['親子便當', '簡易炒飯', '健康沙拉'][Math.floor(Math.random() * 3)],
          calories: 450 + Math.floor(Math.random() * 150),
          tags: ['便當友善', '15分鐘'],
          time: '12:30',
          emoji: '☀️',
          nutrition: {
            protein: 25 + Math.floor(Math.random() * 15),
            carbs: 55 + Math.floor(Math.random() * 25),
            fat: 12 + Math.floor(Math.random() * 10),
          }
        },
        {
          id: `${dateString}-dinner`,
          date: dateString,
          mealType: 'dinner' as const,
          title: ['家常炒飯', '蒸蛋湯麵', '番茄義大利麵'][Math.floor(Math.random() * 3)],
          calories: 480 + Math.floor(Math.random() * 120),
          tags: ['剩飯活用', '經濟實惠'],
          time: '18:30',
          emoji: '🌆',
          nutrition: {
            protein: 20 + Math.floor(Math.random() * 15),
            carbs: 60 + Math.floor(Math.random() * 20),
            fat: 15 + Math.floor(Math.random() * 12),
          }
        }
      ];
      
      records.push(...dayMeals);
    }
    
    return records;
  };

  useEffect(() => {
    setMealRecords(generateMockMealRecords());
  }, []);

  // 處理過濾器變更
  const handleFilterChange = (filterValue: string) => {
    setSelectedFilter(filterValue);
  };

  // 處理手動添加
  const handleManualAdd = () => {
    if (selectedFilter === 'familyAlbum') {
      setInitialMemoryImages([]);
      setShowAddMemoryModal(true);
      return;
    }
    
    if (!eventManagement.selectedDate) {
      eventManagement.setSelectedDate(new Date());
    }
    eventManagement.setEditingEvent(null);
    eventManagement.setShowAddEventModal(true);
  };

  // 處理語音操作
  const handleVoicePress = async () => {
    await voiceProcessing.handleVoicePress(eventManagement.handleAIResult);
  };

  // 處理圖片選擇
  const handleImageSelection = async (pickerFunction: 'camera' | 'library') => {
    await imageProcessing.handleImageSelection(
      pickerFunction, 
      eventManagement.handleAIResult, 
      (images) => {
        setInitialMemoryImages(images);
        setShowAddMemoryModal(true);
      },
      selectedFilter
    );
  };

  // 處理拍照和相簿選取
  const handlePhotoPress = async () => {
    await imageProcessing.handlePhotoPress((images) => {
      setInitialMemoryImages(images);
      setShowAddMemoryModal(true);
    });
  };

  const handleAlbumPress = async () => {
    await imageProcessing.handleAlbumPress((images) => {
      setInitialMemoryImages(images);
      setShowAddMemoryModal(true);
    });
  };

  // 處理購物清單操作
  const handleItemToggle = (itemId: string) => {
    setShoppingItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, completed: !item.completed, completedDate: !item.completed ? new Date() : undefined } 
          : item
      )
    );
  };

  const handleItemAdd = (item: any) => {
    const newItem = { ...item, id: Math.random().toString() };
    setShoppingItems(items => [...items, newItem]);
  };

  const handleItemDelete = (itemId: string) => {
    setShoppingItems(items => items.filter(item => item.id !== itemId));
  };

  const handleAssignMember = (itemId: string, memberId: string) => {
    setShoppingItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, assignedTo: memberId } 
          : item
      )
    );
  };

  const handleMealPress = (meal: MealRecord) => {
    // TODO: 導航到食譜詳情頁
    console.log('Meal pressed:', meal);
  };

  // 處理日期點擊
  const handleDatePress = (dateData: DateData) => {
    const clickedDate = new Date(dateData.dateString);
    eventManagement.setSelectedDate(clickedDate);
  };

  // 處理月份變化
  const handleMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString.slice(0, 7));
    const [year, monthNum] = month.dateString.slice(0, 7).split('-').map(Number);
    // 如果有 fetchEvents 函數，這裡可以調用
  };

  // 載入中狀態
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('home.loadingData')}</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  // 渲染不同的功能視圖
  const renderFeatureContent = () => {
    if (selectedFilter === 'familyAlbum') {
      return (
        <SimpleAlbumView 
          onAlbumPress={(album) => {
            setSelectedAlbum(album);
            setShowAlbumDetail(true);
          }}
          onAddAlbum={() => {
            setShowSmartAlbumModal(true);
          }}
          refreshTrigger={albumRefreshTrigger}
        />
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedFilter === 'familyRecipes' && (
          <MealViewSelector
            mealRecords={mealRecords}
            selectedDate={eventManagement.selectedDate || new Date()}
            onMealPress={handleMealPress}
            onDatePress={(date: Date) => eventManagement.setSelectedDate(date)}
            currentView={(() => {
              const selectedStyle = featureSettings.familyRecipes?.settings?.selectedStyle;
              switch (selectedStyle) {
                case '每日記錄': return 'daily_records';
                case '週間概覽': return 'weekly_overview';
                case '營養圖表': return 'nutrition_chart';
                default: return 'daily_records';
              }
            })()}
          />
        )}

        {selectedFilter === 'choreAssignment' && (
          <ChoreViewSelector
            tasks={tasks}
            selectedDate={eventManagement.selectedDate || new Date()}
            currentMonth={currentChoreMonth}
            onDatePress={(date: Date) => eventManagement.setSelectedDate(date)}
            onTaskPress={(task) => console.log('Task clicked:', task)}
            onMonthChange={(month: string) => setCurrentChoreMonth(month)}
            style={(() => {
              const selectedStyle = featureSettings.choreAssignment?.settings?.selectedStyle;
              switch (selectedStyle) {
                case '任務看板': return 'task-board';
                case '日曆網格': return 'calendar-grid';
                case '家庭儀表板': return 'family-dashboard';
                default: return 'task-board';
              }
            })()}
          />
        )}

        {selectedFilter === 'familyActivities' && <FamilyHealthDashboard />}

        {selectedFilter === 'shoppingList' && (
          <ShoppingViewSelector
            shoppingItems={shoppingItems}
            stores={shoppingStores}
            familyMembers={familyMembers}
            budget={shoppingBudget}
            onItemToggle={handleItemToggle}
            onItemAdd={handleItemAdd}
            onItemDelete={handleItemDelete}
            onAssignMember={handleAssignMember}
            style={(() => {
              const selectedStyle = featureSettings.shoppingList?.settings?.selectedStyle;
              switch (selectedStyle) {
                case '智能清单': return 'smart-list';
                case '家庭看板': return 'family-board';
                case '商店优惠': return 'store-deals';
                default: return 'smart-list';
              }
            })()}
          />
        )}

        {selectedFilter === 'familyFinance' && (
          <View style={{ flex: 1 }}>
            {/* 演示模式提醒 */}
            <View style={styles.demoNotice}>
              <Text style={{ fontSize: 24 }}>ℹ️</Text>
              <Text style={styles.demoText}>這是演示模式，創建家庭後可保存真實記帳數據</Text>
            </View>
            
            {/* 快捷操作 */}
            <View style={styles.quickFinanceActions}>
              <TouchableOpacity 
                style={styles.financeActionButton}
                onPress={() => Alert.alert('記帳功能', '記帳功能開發中...')}
              >
                <Text style={styles.financeActionEmoji}>📝</Text>
                <Text style={styles.financeActionText}>記帳</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.financeActionButton, { backgroundColor: '#34C759' }]}
                onPress={() => Alert.alert('語音記帳', '語音記帳功能正在開發中...')}
              >
                <Text style={styles.financeActionEmoji}>🎤</Text>
                <Text style={styles.financeActionText}>語音記帳</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 默認日曆視圖 */}
        {(selectedFilter === 'all' || selectedFilter === 'calendar') && (
          <CalendarViewSelector
            events={eventManagement.events.map(event => ({
              id: event.id,
              title: event.title,
              description: event.description || undefined,
              start_ts: event.start_ts,
              end_ts: event.end_ts || event.start_ts,
              location: event.location || undefined,
              color: event.color || undefined,
              type: event.type || undefined,
              parent_event_id: event.parent_event_id || undefined,
              creator_id: event.creator_id,
              image_urls: event.image_urls // ✅ 添加 image_urls 字段
            }))}
            selectedDate={eventManagement.selectedDate || new Date()}
            currentMonth={currentMonth}
            onDatePress={handleDatePress}
            onEventPress={eventManagement.handleEditEvent}
            onMonthChange={handleMonthChange}
            style="grid-month"
          />
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部標題欄 */}
      <HomeHeader
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
        onResetSettings={resetAllSettings}
      />

      {/* 主要內容區域 */}
      {renderFeatureContent()}

      {/* 底部操作欄 */}
      <ActionBar
        selectedFilter={selectedFilter}
        onTextResult={eventManagement.handleTextResult}
        onVoicePress={handleVoicePress}
        onImageSelection={handleImageSelection}
        onManualAdd={handleManualAdd}
        onPhotoPress={handlePhotoPress}
        onAlbumPress={handleAlbumPress}
        isProcessingImage={imageProcessing.isProcessingImage}
        isProcessingText={eventManagement.isProcessingText}
        loadingText={imageProcessing.loadingText || voiceProcessing.loadingText || eventManagement.loadingText}
        voiceState={voiceProcessing.voiceState}
      />

      {/* 模態框組件 */}
      <AddEventModal
        visible={eventManagement.showAddEventModal}
        onClose={eventManagement.handleCloseEditEvent}
        onSave={eventManagement.handleCreateEvent}
        onUpdate={eventManagement.handleUpdateEvent}
        initialDate={eventManagement.selectedDate || new Date()}
        userFamilies={userFamilies}
        editingEvent={eventManagement.editingEvent}
      />

      <EventListModal
        visible={eventManagement.showEventListModal}
        onClose={() => eventManagement.setShowEventListModal(false)}
        events={[]}
        date={eventManagement.selectedDate || new Date()}
        onDeleteEvent={async (eventId: string) => {
          Alert.alert('刪除成功', '事件已刪除');
        }}
      />

      <AddMemoryModal
        isVisible={showAddMemoryModal}
        onClose={() => {
          setShowAddMemoryModal(false);
          setInitialMemoryImages([]);
        }}
        onSave={() => {
          setShowAddMemoryModal(false);
          setInitialMemoryImages([]);
        }}
        initialImages={initialMemoryImages}
      />

      <SmartAlbumModal
        isVisible={showSmartAlbumModal}
        onClose={() => {
          setShowSmartAlbumModal(false);
          setAlbumCreationData(null);
        }}
        onSave={() => {
          setShowSmartAlbumModal(false);
          setAlbumCreationData(null);
        }}
        albumName={albumCreationData?.albumName || ''}
        theme={albumCreationData?.theme || '日常生活'}
      />

      {selectedAlbum && (
        <AlbumDetailView
          album={selectedAlbum}
          isVisible={showAlbumDetail}
          onClose={() => {
            setShowAlbumDetail(false);
            setSelectedAlbum(null);
          }}
          onDelete={() => {
            setAlbumRefreshTrigger(prev => prev + 1);
            setShowAlbumDetail(false);
            setSelectedAlbum(null);
          }}
        />
      )}

      {selectedMemory && (
        <MemoryDetailView
          memory={selectedMemory}
          isVisible={showMemoryDetail}
          onClose={() => {
            setShowMemoryDetail(false);
            setSelectedMemory(null);
          }}
          onMemoryUpdate={() => {}}
        />
      )}

      <LoadingModal 
        isVisible={imageProcessing.isProcessingImage || eventManagement.isProcessingText} 
        text={imageProcessing.loadingText || eventManagement.loadingText} 
      />

      <ConfirmationModal
        isVisible={eventManagement.isConfirmationModalVisible}
        events={eventManagement.pendingEvent}
        userInput={eventManagement.pendingUserInput}
        summary={eventManagement.pendingSummary}
        onConfirm={eventManagement.handleConfirmCreateEvent}
        onCancel={eventManagement.handleCancelCreateEvent}
      />

      <SuccessModal
        isVisible={eventManagement.showSuccessModal}
        onClose={() => eventManagement.setShowSuccessModal(false)}
        title={eventManagement.successTitle}
        message={eventManagement.successMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  content: {
    flex: 1,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    gap: 8,
  },
  demoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
  },
  quickFinanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    gap: 12,
  },
  financeActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  financeActionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  financeActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 