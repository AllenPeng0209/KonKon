import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/lib/database.types';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Dimensions, 
  FlatList, 
  Image, 
  RefreshControl, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import AddMemoryModal from './AddMemoryModal';

type Memory = Tables<'family_memories'> & {
  user_name?: string;
  user_avatar?: string;
  isLiked?: boolean;
  users?: {
    display_name: string;
    avatar_url: string | null;
  };
  memory_likes?: Array<{ user_id: string }>;
};

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 2;
const itemSpacing = 12;
const itemWidth = (screenWidth - (numColumns + 1) * itemSpacing) / numColumns;

interface MemoryCardProps {
  memory: Memory;
  onPress: (memory: Memory) => void;
  onLike: (memory: Memory) => void;
  onComment: (memory: Memory) => void;
}

const MemoryCard = ({ memory, onPress, onLike, onComment }: MemoryCardProps) => {
  const imageUrls = memory.image_urls as string[] | null;
  const mainImage = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;

  return (
    <TouchableOpacity style={styles.gridCard} onPress={() => onPress(memory)} activeOpacity={0.9}>
      {mainImage && (
        <Image source={{ uri: mainImage }} style={styles.gridImage} resizeMode="cover" />
      )}
      
      {/* 圖片上的覆蓋層信息 */}
      <View style={styles.overlay}>
        {/* 多圖標識 */}
        {imageUrls && imageUrls.length > 1 && (
          <View style={styles.multiImageBadge}>
            <Text style={styles.multiImageText}>📷 {imageUrls.length}</Text>
          </View>
        )}
        
        {/* 底部信息條 */}
        <View style={styles.bottomOverlay}>
          <View style={styles.userInfo}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <Text style={styles.userNameSmall}>{memory.user_name || t('album.familyMember')}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statButton} onPress={() => onLike(memory)}>
              <Text style={[styles.statText, memory.isLiked && styles.liked]}>
                {memory.isLiked ? '❤️' : '🤍'} {memory.likes_count || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statButton} onPress={() => onComment(memory)}>
              <Text style={styles.statText}>💬 {memory.comments_count || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* 故事預覽 */}
      {memory.story && (
        <View style={styles.storyPreview}>
          <Text style={styles.storyText} numberOfLines={2}>{memory.story}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};


interface AlbumViewProps {
  onMemoryPress?: (memory: Memory) => void;
}

const AlbumView = ({ onMemoryPress }: AlbumViewProps) => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchMemories(true);
  }, [user]);

  const fetchMemories = async (isInitial = false) => {
    if (!user || (loadingMore && !isInitial)) return;
    
    const currentPage = isInitial ? 0 : page;
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // 获取用户家庭回忆，包含用户信息和点赞状态
      // 先嘗試簡單查詢，避免新表的關聯問題
      const { data, error } = await supabase
        .from('family_memories')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (error) {
        console.error('Error fetching memories:', error);
        return;
      }

      const memoriesWithUserInfo = (data || []).map(memory => ({
        ...memory,
        user_name: t('album.familyMember'), // 暫時使用預設值
        user_avatar: null,
        isLiked: false, // 暫時設為false，等新表建立後再啟用
        likes_count: memory.likes_count || 0,
        comments_count: memory.comments_count || 0,
      }));

      if (isInitial) {
        setMemories(memoriesWithUserInfo);
        setPage(1);
      } else {
        setMemories(prev => [...prev, ...memoriesWithUserInfo]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(memoriesWithUserInfo.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    fetchMemories(true);
  }, [user]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchMemories(false);
    }
  }, [hasMore, loadingMore, page]);

  const handleMemoryPress = (memory: Memory) => {
    if (onMemoryPress) {
      onMemoryPress(memory);
    }
  };

  const handleLike = async (memory: Memory) => {
    if (!user) return;
    
    // 暫時只更新本地狀態，等數據庫新表建立後再啟用實際API調用
    setMemories(prev => prev.map(m => 
      m.id === memory.id 
        ? { 
            ...m, 
            isLiked: !m.isLiked,
            likes_count: m.isLiked ? Math.max(0, (m.likes_count || 1) - 1) : (m.likes_count || 0) + 1
          }
        : m
    ));
    
    // TODO: 等新表建立後啟用
    // try {
    //   if (memory.isLiked) {
    //     await supabase.from('memory_likes').delete().eq('memory_id', memory.id).eq('user_id', user.id);
    //   } else {
    //     await supabase.from('memory_likes').insert({ memory_id: memory.id, user_id: user.id });
    //   }
    // } catch (error) {
    //   console.error('Error toggling like:', error);
    // }
  };

  const handleComment = (memory: Memory) => {
    // 處理評論點擊，後續實現
    handleMemoryPress(memory);
  };

  const renderMemory = ({ item }: { item: Memory }) => (
    <MemoryCard 
      memory={item} 
      onPress={handleMemoryPress}
      onLike={handleLike}
      onComment={handleComment}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.centered}>
      <Text style={styles.emptyStateIcon}>🖼️</Text>
      <Text style={styles.emptyStateText}>{t('album.emptyStateTitle')}</Text>
      <Text style={styles.emptyStateSubText}>{t('album.emptyStateSubtitle')}</Text>
    </View>
  );

  if (loading && memories.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('album.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={memories}
        renderItem={renderMemory}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        showsVerticalScrollIndicator={false}
      />
      
      <AddMemoryModal 
        isVisible={showAddMemoryModal}
        onClose={() => setShowAddMemoryModal(false)}
        onSave={() => {
          setShowAddMemoryModal(false);
          handleRefresh();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  flatListContent: {
    padding: itemSpacing,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // 網格卡片樣式
  gridCard: {
    width: itemWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: itemSpacing,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: itemWidth * 1.2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  multiImageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  multiImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarEmoji: {
    fontSize: 14,
  },
  userNameSmall: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statButton: {
    flex: 1,
    alignItems: 'center',
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  liked: {
    color: '#FF6B6B',
  },
  storyPreview: {
    padding: 12,
  },
  storyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
});

export default AlbumView;
export type { Memory }; 