import { useColorScheme } from '@/hooks/useColorScheme';
import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  LongPressGestureHandler,
  LongPressGestureHandlerGestureEvent,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 68; // 空間項目高度
const MARGIN_BOTTOM = 8; // 項目間距

// 空間標籤圖標映射
const TAG_ICONS: { [key: string]: string } = {
  family: '🏠',
  personal: '👤', // 修改個人空間圖標為人頭
  couple: '💖',
  work: '💼',
  friend: '👥',
  course: '🎯',
  school: '🏫',
  club: '⭐',
  hobby: '💡',
  meta: '🌌', // 元空間圖標
  other: '👥'
};

const getTagIcon = (tag?: string | null): string => {
  return tag ? TAG_ICONS[tag] || '🏠' : '🏠';
};

interface DrawerProps {
  onClose: () => void;
  translateX: SharedValue<number>;
}

// 元空間對象定義（將移動到組件內部以使用翻譯）

interface Family {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  owner_id: string;
  invite_code: string | null;
  timezone: string | null;
  created_at: string | null;
  updated_at: string | null;
  member_count?: number;
  tag?: string | null;
}

interface DraggableFamilyItemProps {
  family: Family;
  index: number;
  isActive: boolean;
  isMetaSpace?: boolean; // 新增：標識是否為元空間
  isPersonalSpace?: boolean; // 新增：標識是否為個人空間
  familyMembers: any[];
  onSwitchFamily: (familyId: string) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  draggedIndex: SharedValue<number>;
  colorScheme: 'light' | 'dark' | null | undefined;
  totalSpacesCount?: number; // 新增：總空間數量
}

const DraggableFamilyItem: React.FC<DraggableFamilyItemProps> = ({
  family,
  index,
  isActive,
  isMetaSpace = false, // 默認為 false
  isPersonalSpace = false, // 新增：默認為 false
  familyMembers,
  onSwitchFamily,
  onDragEnd,
  draggedIndex,
  colorScheme,
  totalSpacesCount = 0,
}) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState(false);
  const longPressRef = React.useRef<LongPressGestureHandler>(null);
  const panRef = React.useRef<PanGestureHandler>(null);

  const styles = getStyles(colorScheme);

  const resetDragState = useCallback(() => {
    console.log(`[DRAG] resetDragState 被調用 - index: ${index}`);
    translateY.value = 0; // 立即重置，不使用動畫
    draggedIndex.value = -1;
    isDragging.value = false;
    setIsCurrentlyDragging(false);
  }, [draggedIndex, isDragging, translateY, index]);

  // 當空間變為非激活狀態時，重置拖拽狀態
  useEffect(() => {
    if (!isActive && draggedIndex.value === index) {
      resetDragState();
    }
  }, [isActive, index, draggedIndex, resetDragState]);

  const animatedStyle = useAnimatedStyle(() => {
    const isBeingDragged = draggedIndex.value === index && !isMetaSpace && !isPersonalSpace; // 元空間和個人空間不參與拖拽
    const currentScale = isBeingDragged ? withSpring(1.08) : scale.value;
    const currentOpacity = isBeingDragged ? 0.95 : opacity.value;
    
    return {
      transform: [
        { translateY: translateY.value },
        { scale: currentScale },
      ],
      opacity: currentOpacity,
      zIndex: isBeingDragged ? 1000 : 1,
      shadowOpacity: isBeingDragged ? 0.4 : 0,
      shadowOffset: {
        width: 0,
        height: isBeingDragged ? 12 : 0,
      },
      shadowRadius: isBeingDragged ? 20 : 0,
      elevation: isBeingDragged ? 12 : 0,
      borderRadius: 12,
    };
  });

  // 簡化的手勢處理邏輯
  const onLongPress = useCallback(({ nativeEvent }: LongPressGestureHandlerGestureEvent) => {
    if (isMetaSpace || isPersonalSpace) return; // 元空間和個人空間都不能拖拽
    
    if (nativeEvent.state === State.ACTIVE) {
      console.log(`[DRAG] 長按激活 - index: ${index}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      draggedIndex.value = index;
      isDragging.value = true;
      setIsCurrentlyDragging(true);
    }
  }, [draggedIndex, index, isDragging, isMetaSpace, isPersonalSpace]);

  // 連續的手勢事件處理（用於流暢動畫）
  const onPanGestureEvent = useCallback((event: any) => {
    'worklet';
    // 只有在拖拽模式激活時才更新位置
    if (draggedIndex.value === index && !isMetaSpace && !isPersonalSpace) {
      translateY.value = event.translationY;
    }
  }, [draggedIndex, index, translateY, isMetaSpace, isPersonalSpace]);

  // 手勢狀態變化處理（用於邏輯控制）
  const onPanGestureStateChange = useCallback(({ nativeEvent }: PanGestureHandlerGestureEvent) => {
    if (isMetaSpace || isPersonalSpace) return;
    
    if (nativeEvent.state === State.END && draggedIndex.value === index) {
      // 拖動結束 - 全部使用 runOnJS 包裝，在 JS 線程中處理
      runOnJS(() => {
        console.log(`[DRAG] 拖動結束 - translationY: ${nativeEvent.translationY}`);
        
        const dragDistance = nativeEvent.translationY;
        const itemDistance = ITEM_HEIGHT + MARGIN_BOTTOM;
        const steps = Math.round(dragDistance / itemDistance);
        const newIndex = index + steps;
        
        // 限制在有效範圍內（1 到 totalSpacesCount）
        const minIndex = 1; // 不能拖到元空間位置
        const maxIndex = totalSpacesCount; // 用戶空間的最大索引
        const clampedIndex = Math.max(minIndex, Math.min(maxIndex, newIndex));
        
        console.log(`[DRAG] 計算結果 - 從 ${index} 到 ${clampedIndex}`);
        
        // 先重置狀態
        resetDragState();
        
        // 如果位置有變化，延遲執行重新排序，確保動畫狀態完全重置
        if (clampedIndex !== index) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          
          // 延遲觸發重新排序，讓 React 有時間處理狀態重置
          setTimeout(() => {
            console.log(`[DRAG] 延遲觸發重新排序 - 從 ${index} 到 ${clampedIndex}`);
            onDragEnd(index, clampedIndex);
          }, 50);
        }
      })();
    } else if ((nativeEvent.state === State.CANCELLED || nativeEvent.state === State.FAILED) && draggedIndex.value === index) {
      runOnJS(() => {
        console.log(`[DRAG] 拖動取消或失敗`);
        resetDragState();
      })();
    }
  }, [draggedIndex, index, onDragEnd, resetDragState, isMetaSpace, isPersonalSpace, totalSpacesCount]);

  const handlePress = useCallback(() => {
    // 直接切換，不要中間步驟
    if (!isActive) {
      onSwitchFamily(family.id);
    }
  }, [family.id, onSwitchFamily, isActive]);

  return (
            <LongPressGestureHandler
          ref={longPressRef}
          onHandlerStateChange={onLongPress}
          minDurationMs={500}
          simultaneousHandlers={panRef}
          enabled={!isMetaSpace && !isPersonalSpace} // 元空間和個人空間不啟用長按
        >
          <Animated.View>
            <PanGestureHandler
              ref={panRef}
              onGestureEvent={onPanGestureEvent}
              onHandlerStateChange={onPanGestureStateChange}
              simultaneousHandlers={longPressRef}
              enabled={!isMetaSpace && !isPersonalSpace} // 元空間和個人空間不啟用拖拽
            >
          <Animated.View style={[animatedStyle]}>
            <TouchableOpacity
              style={[
                styles.familyItem,
                isActive && styles.activeFamilyItem,
                isMetaSpace && styles.metaSpaceItem, // 元空間特殊樣式
                isPersonalSpace && styles.personalSpaceItem, // 個人空間特殊樣式
              ]}
              onPress={handlePress}
              activeOpacity={0.8}
            >
              <View style={[
                styles.familyIcon, 
                isActive && styles.activeFamilyIcon,
                isMetaSpace && styles.metaSpaceIcon,
                isPersonalSpace && styles.personalSpaceIcon
              ]}>
                <Text style={[
                  styles.familyIconText, 
                  isActive && styles.activeFamilyIconText,
                  isMetaSpace && styles.metaSpaceIconText,
                  isPersonalSpace && styles.personalSpaceIconText
                ]}>
                  {getTagIcon(family.tag) || family.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.familyInfo}>
                <Text style={[
                  styles.familyName, 
                  isActive && styles.activeFamilyName,
                  isMetaSpace && styles.metaSpaceName,
                  isPersonalSpace && styles.personalSpaceName
                ]}>
                  {isPersonalSpace ? t('space.personalSpace') : family.name}
                </Text>
                <Text style={styles.familyMemberCount}>
                  {isMetaSpace 
                    ? t('drawer.allSpaces', { count: totalSpacesCount })
                    : isActive 
                      ? t('drawer.membersCount', { count: familyMembers.length })
                      : t('drawer.totalMembersCount', { count: family.member_count || 1 })
                  }
                </Text>
              </View>
              {isActive && (
                <View style={styles.activeIndicator}>
                  <Ionicons name="radio-button-on" size={22} color={Colors.light.tint} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </LongPressGestureHandler>
  );
};

const Drawer: React.FC<DrawerProps> = ({ onClose, translateX }) => {
  const { user } = useAuth();
  const { userFamilies, activeFamily, switchFamily, familyMembers, reorderFamilies } = useFamily();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [modalVisible, setModalVisible] = useState(false);
  
  const draggedIndex = useSharedValue(-1);

  // 元空間對象定義（使用翻譯）
  const META_SPACE: Family = {
    id: 'meta-space',
    name: t('drawer.metaSpace'),
    description: t('drawer.metaSpaceDescription'),
    avatar_url: null,
    owner_id: '',
    invite_code: null,
    timezone: null,
    created_at: null,
    updated_at: null,
    member_count: 0,
    tag: 'meta'
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleSwitchFamily = async (familyId: string) => {
    if (familyId !== activeFamily?.id) {
      await switchFamily(familyId);
    }
    onClose();
  };

  const handleDragEnd = useCallback((fromVisualIndex: number, toVisualIndex: number) => {
    console.log(`[DRAG] handleDragEnd 被調用 - 從 ${fromVisualIndex} 到 ${toVisualIndex}`);
    
    // 將視覺索引轉換為用戶空間數組索引（減去元空間占用的第0位）
    const fromIndex = fromVisualIndex - 1;
    const toIndex = toVisualIndex - 1;
    
    console.log(`[DRAG] 轉換後的索引 - 從 ${fromIndex} 到 ${toIndex}, 用戶空間數量: ${userFamilies.length}`);
    
    if (fromIndex !== toIndex && fromIndex >= 0 && toIndex >= 0 && 
        fromIndex < userFamilies.length && toIndex < userFamilies.length) {
      console.log(`[DRAG] 開始重新排序`);
      
      const reorderedIds = [...userFamilies];
      const [movedItem] = reorderedIds.splice(fromIndex, 1);
      reorderedIds.splice(toIndex, 0, movedItem);
      
      console.log(`[DRAG] 重新排序完成，新順序:`, reorderedIds.map(f => f.name));
      reorderFamilies(reorderedIds.map(family => family.id));
    } else {
      console.log(`[DRAG] 跳過重新排序 - 條件不滿足`);
    }
  }, [userFamilies, reorderFamilies]);

  const handleCreateFamily = () => {
    setModalVisible(false);
    router.push('/create-family');
    onClose();
  };

  const handleJoinFamily = () => {
    setModalVisible(false);
    router.push('/join-family');
    onClose();
  };

  const navigateToProfile = () => {
    router.push('/profile');
    onClose();
  }

  const styles = getStyles(colorScheme);

  const getAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    return 'https://example.com/default-avatar.png';
  }

  // 檢查當前是否選中元空間
  const isMetaSpaceActive = activeFamily?.id === 'meta-space';

  return (
    <>
      <Animated.View style={[styles.container, animatedStyle]}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity style={styles.profileSection} onPress={navigateToProfile}>
            <Image
              source={{ uri: getAvatarUrl() }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.user_metadata?.display_name || user?.email}</Text>
              <Text style={styles.profileStatus}>{t('drawer.viewProfile')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.profileStatus.color} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <ScrollView 
            style={styles.familyList} 
            showsVerticalScrollIndicator={false}
            scrollEnabled={true} // 暫時保持滾動開啟
          >
            {/* 元空間 - 固定在最上方 */}
            <DraggableFamilyItem
              key="meta-space"
              family={META_SPACE}
              index={0}
              isActive={isMetaSpaceActive}
              isMetaSpace={true}
              familyMembers={familyMembers}
              onSwitchFamily={handleSwitchFamily}
              onDragEnd={handleDragEnd}
              draggedIndex={draggedIndex}
              colorScheme={colorScheme}
              totalSpacesCount={userFamilies.length}
            />
            
            {/* 用戶的其他空間 */}
            {userFamilies.map((family, index) => {
              const isActive = activeFamily?.id === family.id;
              const isPersonalSpace = family.tag === 'personal';
              return (
                <DraggableFamilyItem
                  key={family.id}
                  family={family}
                  index={index + 1} // 調整索引，因為元空間占用了第0位
                  isActive={isActive}
                  isMetaSpace={false}
                  isPersonalSpace={isPersonalSpace}
                  familyMembers={familyMembers}
                  onSwitchFamily={handleSwitchFamily}
                  onDragEnd={handleDragEnd}
                  draggedIndex={draggedIndex}
                  colorScheme={colorScheme}
                  totalSpacesCount={userFamilies.length}
                />
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.addGroupButton} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={24} color={Colors.dark.text} />
              <Text style={styles.addGroupButtonText}>{t('drawer.newSpace')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableOpacity 
          style={styles.centeredView} 
          activeOpacity={1} 
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.modalButton} onPress={handleCreateFamily}>
              <Ionicons name="add-circle-outline" size={22} color={Colors.light.tint} />
              <Text style={styles.modalButtonText}>{t('common.createNewSpace')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleJoinFamily}>
              <Ionicons name="enter-outline" size={22} color={Colors.light.tint} />
              <Text style={styles.modalButtonText}>{t('common.joinSpace')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { marginTop: 10, backgroundColor: '#f0f0f0' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{...styles.modalButtonText, color: '#555', textAlign: 'center', width: '100%', marginLeft: 0}}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: width * 0.8,
      backgroundColor: colors.background,
      paddingTop: 40,
      zIndex: 200,
    },
    safeArea: {
      flex: 1,
    },
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
      backgroundColor: colors.icon,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    profileStatus: {
      fontSize: 14,
      color: colors.icon,
    },
    separator: {
      height: 1,
      backgroundColor: colorScheme === 'dark' ? '#333' : '#eee',
      marginHorizontal: 16,
      marginBottom: 10,
    },
    familyList: {
      flex: 1,
    },
    familyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      marginBottom: MARGIN_BOTTOM,
      height: ITEM_HEIGHT,
      backgroundColor: colors.background,
      borderRadius: 0, // 默认无圆角
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 0, // 默认无阴影
      },
      shadowOpacity: 0, // 默认无阴影
      shadowRadius: 0, // 默认无阴影
      elevation: 0, // 默认无阴影
    },
    activeFamilyItem: {
      backgroundColor: `${Colors.light.tint}1A`,
      marginHorizontal: 16,
      borderRadius: 12, // 激活状态有圆角
    },
    familyIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.tabIconDefault,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    activeFamilyIcon: {
      backgroundColor: Colors.light.tint,
    },
    familyIconText: {
      color: colors.background,
      fontSize: 18,
      fontWeight: 'bold',
    },
    activeFamilyIconText: {
      color: Colors.dark.text,
    },
    familyInfo: {
      flex: 1,
    },
    familyName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    activeFamilyName: {
      color: Colors.light.tint,
    },
    familyMemberCount: {
      fontSize: 13,
      color: colors.icon,
      marginTop: 2,
    },
    activeIndicator: {
      marginLeft: 12,
    },
    footer: {
      paddingHorizontal: 24,
      paddingVertical: 20,
    },
    addGroupButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.light.tint,
      paddingVertical: 12,
      borderRadius: 12,
    },
    addGroupButtonText: {
      color: Colors.dark.text,
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    centeredView: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalView: {
      width: '100%',
      backgroundColor: colors.background,
      borderTopRightRadius: 20,
      borderTopLeftRadius: 20,
      padding: 20,
      paddingBottom: 40,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    modalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      padding: 15,
      borderRadius: 10,
      backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
      marginBottom: 10,
    },
    modalButtonText: {
      marginLeft: 15,
      fontSize: 16,
      color: colors.text,
    },
    // 元空間特殊樣式
    metaSpaceItem: {
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f9fa',
      marginHorizontal: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colorScheme === 'dark' ? '#444' : '#e0e6ed',
      borderStyle: 'dashed',
    },
    metaSpaceIcon: {
      backgroundColor: '#6366f1',
    },
    metaSpaceIconText: {
      color: '#ffffff',
    },
    metaSpaceName: {
      color: '#6366f1',
      fontWeight: '700',
    },
    // 個人空間特殊樣式（與元空間相同）
    personalSpaceItem: {
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f9fa',
      marginHorizontal: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colorScheme === 'dark' ? '#444' : '#e0e6ed',
      borderStyle: 'dashed',
    },
    personalSpaceIcon: {
      backgroundColor: '#6366f1',
    },
    personalSpaceIconText: {
      color: '#ffffff',
    },
    personalSpaceName: {
      color: '#6366f1',
      fontWeight: '700',
    },
  });
}

export default Drawer; 