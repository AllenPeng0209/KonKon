import { useAuth } from '@/contexts/AuthContext';
import { Tables, FamilyAlbumRow } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AddMemoryModal from './AddMemoryModal';
import SmartAlbumModal from './SmartAlbumModal';

type Memory = Tables<'family_memories'> & {
  user_name?: string;
  user_avatar?: string | null;
  isLiked?: boolean;
};

type FamilyAlbum = FamilyAlbumRow & {
  user_name?: string;
  like_count?: number;
  isLiked?: boolean;
};

interface MemoryCardProps {
  memory: Memory;
  onPress: (memory: Memory) => void;
  size: number;
}

interface AlbumViewProps {
  onMemoryPress?: (memory: Memory) => void;
}

interface StoryCollection {
  id: string;
  title: string;
  coverImage: string;
  memories: Memory[];
}

// 簡約佈局
const { width: screenWidth } = Dimensions.get('window');
const PADDING = 16;
const STORY_HEIGHT = 200;
const numColumns = 3;
const gridGap = 2;
const photoSize = (screenWidth - PADDING * 2 - gridGap * 2) / numColumns;

// 極簡故事集卡片
const StoryCard = ({ story, onPress }: { story: StoryCollection; onPress: () => void }) => (
  <TouchableOpacity 
    style={[styles.storyCard, { width: screenWidth - PADDING * 2 }]} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    {story.coverImage && (
      <Image source={{ uri: story.coverImage }} style={styles.storyCover} />
    )}
    <View style={styles.storyOverlay}>
      <Text style={styles.storyTitle}>{story.title}</Text>
      <Text style={styles.storyCount}>{story.memories.length}</Text>
    </View>
  </TouchableOpacity>
);

// 智能相簿卡片
const AlbumCard = ({ album, onPress }: { album: FamilyAlbum; onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.albumCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {album.cover_image_url && (
      <Image source={{ uri: album.cover_image_url }} style={styles.albumCover} />
    )}
    <View style={styles.albumOverlay}>
      <View style={styles.albumInfo}>
        <Text style={styles.albumName}>{album.name}</Text>
        <Text style={styles.albumTheme}>🎯 {album.theme}</Text>
        <Text style={styles.albumStats}>
          📷 {album.photo_count} 張 • ❤️ {album.like_count || 0}
        </Text>
        <Text style={styles.albumCreator}>由 {album.user_name} 創建</Text>
      </View>
    </View>
    {album.is_smart_generated && (
      <View style={styles.aibadge}>
        <Text style={styles.aiBadgeText}>🤖 AI</Text>
      </View>
    )}
  </TouchableOpacity>
);

// 極簡照片卡片
const PhotoCard = ({ memory, onPress, size }: MemoryCardProps) => {
  const imageUrls = memory.image_urls as string[] | null;
  const mainImage = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;

  if (!mainImage) return null;

  return (
    <TouchableOpacity 
      style={[styles.photoCard, { width: size, height: size }]}
      onPress={() => onPress(memory)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: mainImage }} style={styles.photoImage} />
    </TouchableOpacity>
  );
};

// 照片詳情模態框
const PhotoDetailModal = ({ visible, memory, onClose }: {
  visible: boolean;
  memory: Memory | null;
  onClose: () => void;
}) => {
  if (!memory) return null;

  const imageUrls = memory.image_urls as string[] | null;
  const mainImage = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;
  const createdDate = new Date(memory.created_at);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        
        {mainImage && (
          <Image source={{ uri: mainImage }} style={styles.modalImage} resizeMode="contain" />
        )}
        
        <View style={styles.detailsContainer}>
          <Text style={styles.dateText}>
            {createdDate.toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          
          {memory.story && (
            <Text style={styles.storyText}>{memory.story}</Text>
          )}
          
          {/* 語音記錄區域 - 待實現 */}
          {/* TODO: 添加語音記錄功能 */}
        </View>
      </View>
    </Modal>
  );
};

const AlbumView = ({ onMemoryPress }: AlbumViewProps) => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [familyAlbums, setFamilyAlbums] = useState<FamilyAlbum[]>([]);
  const [storyCollections, setStoryCollections] = useState<StoryCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [showSmartAlbumModal, setShowSmartAlbumModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<FamilyAlbum | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  useEffect(() => {
    fetchMemories(true);
    fetchFamilyAlbums();
  }, [user]);

  useEffect(() => {
    if (memories.length > 0) {
      generateStoryCollections();
    }
  }, [memories]);

  const fetchMemories = async (isInitial = false) => {
    if (!user || (loadingMore && !isInitial)) return;
    
    const currentPage = isInitial ? 0 : page;
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const { data, error } = await supabase
        .from('family_memories')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (error) {
        console.error('Error fetching memories:', error);
        return;
      }

      const memoriesWithInfo: Memory[] = await Promise.all((data || []).map(async memory => {
        const { data: userData } = await supabase
          .from('users')
          .select('display_name, avatar_url')
          .eq('id', memory.user_id)
          .single();

        const { data: likeData } = await supabase
          .from('memory_likes')
          .select('id')
          .eq('memory_id', memory.id)
          .eq('user_id', user.id)
          .maybeSingle();

        return {
          ...memory,
          user_name: userData?.display_name || '家庭成員',
          user_avatar: userData?.avatar_url,
          isLiked: !!likeData,
        };
      }));

      if (isInitial) {
        setMemories(memoriesWithInfo);
        setPage(1);
      } else {
        setMemories(prev => [...prev, ...memoriesWithInfo]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(memoriesWithInfo.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const fetchFamilyAlbums = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('family_albums')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching family albums:', error);
        return;
      }

      const albumsWithInfo: FamilyAlbum[] = await Promise.all((data || []).map(async album => {
        const { data: userData } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', album.user_id)
          .single();

        const { data: likeCount } = await supabase
          .from('album_likes')
          .select('id', { count: 'exact' })
          .eq('album_id', album.id);

        const { data: likeData } = await supabase
          .from('album_likes')
          .select('id')
          .eq('album_id', album.id)
          .eq('user_id', user.id)
          .maybeSingle();

        return {
          ...album,
          user_name: userData?.display_name || '家庭成員',
          like_count: likeCount?.length || 0,
          isLiked: !!likeData,
        };
      }));

      setFamilyAlbums(albumsWithInfo);
    } catch (error) {
      console.error('Error fetching family albums:', error);
    }
  };

  const generateStoryCollections = () => {
    const collections: StoryCollection[] = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentMemories = memories.filter(m => new Date(m.created_at) > oneWeekAgo);
    const monthlyMemories = memories.filter(m => 
      new Date(m.created_at) > oneMonthAgo && new Date(m.created_at) <= oneWeekAgo
    );

    if (recentMemories.length >= 2) {
      const imageUrls = recentMemories[0].image_urls as string[] | null;
      collections.push({
        id: 'recent',
        title: '本週',
        coverImage: (imageUrls && imageUrls[0]) || '',
        memories: recentMemories,
      });
    }

    if (monthlyMemories.length >= 3) {
      const imageUrls = monthlyMemories[0].image_urls as string[] | null;
      collections.push({
        id: 'monthly',
        title: '本月',
        coverImage: (imageUrls && imageUrls[0]) || '',
        memories: monthlyMemories,
      });
    }

    setStoryCollections(collections);
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    fetchMemories(true);
    fetchFamilyAlbums();
  }, [user]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchMemories(false);
    }
  }, [hasMore, loadingMore, page]);

  const handleMemoryPress = (memory: Memory) => {
    if (onMemoryPress) {
      onMemoryPress(memory);
    } else {
      setSelectedMemory(memory);
    }
  };

  const handleAlbumPress = (album: FamilyAlbum) => {
    setSelectedAlbum(album);
  };

  const renderPhoto = ({ item, index }: { item: Memory; index: number }) => (
    <PhotoCard 
      memory={item} 
      onPress={handleMemoryPress}
      size={photoSize}
    />
  );

  const renderStoryCollections = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.storiesContainer}
      contentContainerStyle={styles.storiesContent}
    >
      {storyCollections.map((story) => (
        <StoryCard 
          key={story.id}
          story={story}
          onPress={() => console.log('Open story:', story.title)}
        />
      ))}
    </ScrollView>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* 智能相簿區域 */}
      {familyAlbums.length > 0 && (
        <View style={styles.albumsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🤖 AI 智能相簿</Text>
            <TouchableOpacity onPress={() => setShowSmartAlbumModal(true)}>
              <Text style={styles.addButton}>＋ 創建</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.albumsContent}>
              {familyAlbums.map((album) => (
                <AlbumCard 
                  key={album.id}
                  album={album}
                  onPress={() => handleAlbumPress(album)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      
      {/* 故事集區域 */}
      {storyCollections.length > 0 && (
        <View style={styles.storiesSection}>
          <Text style={styles.sectionTitle}>📖 自動故事集</Text>
          {renderStoryCollections()}
        </View>
      )}
      
      {/* 最近照片標題 */}
      <View style={styles.photosHeader}>
        <Text style={styles.sectionTitle}>📷 最近照片</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>還沒有照片</Text>
    </View>
  );

  if (loading && memories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#999" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={memories}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#999']}
            tintColor="#999"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: gridGap }} />}
      />
      
      <PhotoDetailModal
        visible={!!selectedMemory}
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />
      
      <AddMemoryModal 
        isVisible={showAddMemoryModal}
        onClose={() => setShowAddMemoryModal(false)}
        onSave={() => {
          setShowAddMemoryModal(false);
          handleRefresh();
        }}
      />
      
      <SmartAlbumModal 
        isVisible={showSmartAlbumModal}
        onClose={() => setShowSmartAlbumModal(false)}
        onSave={() => {
          setShowSmartAlbumModal(false);
          handleRefresh();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // 標題欄
  header: {
    paddingTop: 60,
    paddingHorizontal: PADDING,
    paddingBottom: 0,
    backgroundColor: '#ffffff',
  },
  
  // 相簿區域
  albumsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  albumsContent: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: PADDING,
  },
  albumCard: {
    width: 280,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
    position: 'relative',
  },
  albumCover: {
    ...StyleSheet.absoluteFillObject,
  },
  albumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  albumInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  albumName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  albumTheme: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  albumStats: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
  },
  albumCreator: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.7,
  },
  aibadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // 故事集區域
  storiesSection: {
    marginBottom: 20,
  },
  storiesContainer: {
    marginHorizontal: -PADDING,
  },
  storiesContent: {
    paddingHorizontal: PADDING,
    gap: 16,
  },
  
  // 照片標題
  photosHeader: {
    marginBottom: 16,
  },
  storyCard: {
    height: STORY_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
  },
  storyCover: {
    ...StyleSheet.absoluteFillObject,
  },
  storyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  storyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  storyCount: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  
  // 照片網格
  listContent: {
    paddingHorizontal: PADDING,
  },
  photoCard: {
    marginRight: gridGap,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  
  // 照片詳情模態框
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '300',
  },
  modalImage: {
    width: '100%',
    height: '60%',
    marginTop: 80,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  storyText: {
    fontSize: 18,
    color: '#000000',
    lineHeight: 26,
         marginBottom: 20,
   },
   
   // 載入和空狀態
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999999',
  },
});

export default AlbumView;
export type { Memory };
