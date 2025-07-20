import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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

type Comment = Tables<'memory_comments'> & {
  user_name?: string;
  user_avatar?: string | null;
};

interface MemoryDetailViewProps {
  memory: Memory;
  isVisible: boolean;
  onClose: () => void;
  onMemoryUpdate?: (memory: Memory) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MemoryDetailView: React.FC<MemoryDetailViewProps> = ({
  memory,
  isVisible,
  onClose,
  onMemoryUpdate,
}) => {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(memory.isLiked || false);
  const [likesCount, setLikesCount] = useState(memory.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(memory.comments_count || 0);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);

  const imageUrls = (memory.image_urls as string[]) || [];

  useEffect(() => {
    if (isVisible) {
      fetchComments();
    }
  }, [isVisible, memory.id]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('memory_comments')
        .select('*')
        .eq('memory_id', memory.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      // 為每個評論獲取用戶信息
      const commentsWithUserInfo = await Promise.all((data || []).map(async comment => {
        const { data: userData } = await supabase
          .from('users')
          .select('display_name, avatar_url')
          .eq('id', comment.user_id)
          .single();

        return {
          ...comment,
          user_name: userData?.display_name || '家庭成員',
          user_avatar: userData?.avatar_url,
        };
      }));

      setComments(commentsWithUserInfo);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('memory_likes')
          .delete()
          .eq('memory_id', memory.id)
          .eq('user_id', user.id);
        
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('memory_likes')
          .insert({ memory_id: memory.id, user_id: user.id });
        
        setLikesCount(prev => prev + 1);
      }

      setIsLiked(!isLiked);

      // 通知父組件更新
      if (onMemoryUpdate) {
        onMemoryUpdate({
          ...memory,
          isLiked: !isLiked,
          likes_count: isLiked ? likesCount - 1 : likesCount + 1,
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('錯誤', '點讚失敗');
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('memory_comments')
        .insert({
          memory_id: memory.id,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select(`
          *,
          users!memory_comments_user_id_fkey(display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      const newCommentWithUser = {
        ...data,
        user_name: data.users?.display_name || '家庭成員',
        user_avatar: data.users?.avatar_url,
      };

      setComments(prev => [...prev, newCommentWithUser]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
      Keyboard.dismiss();

      // 通知父組件更新
      if (onMemoryUpdate) {
        onMemoryUpdate({
          ...memory,
          comments_count: commentsCount + 1,
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('錯誤', '評論失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePress = () => {
    setImageZoomed(!imageZoomed);
  };

  const renderImage = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.imageContainer}>
      <TouchableOpacity 
        style={styles.imageWrapper} 
        onPress={handleImagePress}
        activeOpacity={1}
      >
        <Image 
          source={{ uri: item }} 
          style={[styles.fullImage, imageZoomed && styles.zoomedImage]} 
          resizeMode={imageZoomed ? "cover" : "contain"} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>👤</Text>
        </View>
        <View style={styles.commentInfo}>
          <Text style={styles.commentUserName}>{item.user_name}</Text>
          <Text style={styles.commentTime}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
    </View>
  );

  const handleImageChange = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const imageIndex = Math.round(contentOffset.x / screenWidth);
    setCurrentImageIndex(imageIndex);
    setImageZoomed(false); // 重置縮放狀態
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* 頂部操作欄 */}
        <SafeAreaView style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} / {imageUrls.length}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </SafeAreaView>

        {/* 圖片展示區域 */}
        <View style={styles.imageSection}>
          <FlatList
            data={imageUrls}
            renderItem={renderImage}
            keyExtractor={(item, index) => `${memory.id}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageChange}
            getItemLayout={(data, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />
        </View>

        {/* 底部信息區域 */}
        <View style={styles.bottomSection}>
          {/* 操作按鈕 */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Text style={[styles.actionText, isLiked && styles.likedText]}>
                {isLiked ? '❤️' : '🤍'} {likesCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => setShowComments(!showComments)}
            >
              <Text style={styles.actionText}>💬 {commentsCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>📤</Text>
            </TouchableOpacity>
          </View>

          {/* 回憶信息 */}
          <ScrollView style={styles.infoSection} showsVerticalScrollIndicator={false}>
            <View style={styles.memoryInfo}>
              <View style={styles.userHeader}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>👤</Text>
                </View>
                <View>
                  <Text style={styles.userName}>{memory.user_name}</Text>
                  <Text style={styles.memoryDate}>
                    {new Date(memory.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              {memory.story && (
                <Text style={styles.storyText}>{memory.story}</Text>
              )}

              {memory.location && (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationText}>📍 {memory.location}</Text>
                </View>
              )}
            </View>

            {/* 評論區域 */}
            {showComments && (
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>評論</Text>
                
                {comments.map(comment => (
                  <View key={comment.id}>
                    {renderComment({ item: comment })}
                  </View>
                ))}

                {/* 添加評論 */}
                <View style={styles.addCommentSection}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="添加評論..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity 
                    style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                    onPress={handleAddComment}
                    disabled={!newComment.trim() || loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <Text style={styles.sendButtonText}>發送</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  imageCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  placeholder: {
    width: 40,
  },
  imageSection: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  zoomedImage: {
    transform: [{ scale: 2 }],
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.5,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  likedText: {
    color: '#FF6B6B',
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  memoryInfo: {
    paddingVertical: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  memoryDate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 12,
  },
  locationInfo: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  commentItem: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: {
    fontSize: 16,
  },
  commentInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginLeft: 40,
  },
  addCommentSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MemoryDetailView;