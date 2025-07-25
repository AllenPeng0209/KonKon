import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { supabase } from '../../lib/supabase';

// UUID 驗證正則表達式
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 檢查是否為有效的 UUID
const isValidUUID = (id?: string): boolean => {
  return !!(id && UUID_REGEX.test(id));
};

interface EventComment {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  replies?: EventComment[];
}

interface EventCommentsProps {
  eventId: string;
  visible?: boolean;
}

export default function EventComments({ eventId, visible = true }: EventCommentsProps) {
  const { user } = useAuth();
  const { familyMembers } = useFamily();
  const [comments, setComments] = useState<EventComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && eventId && isValidUUID(eventId)) {
      loadComments();
    } else if (visible && eventId && !isValidUUID(eventId)) {
      // 如果不是有效的 UUID（例如臨時ID），設置為空狀態
      setComments([]);
      setLoading(false);
    }
  }, [eventId, visible]);

  const loadComments = async () => {
    // 如果不是有效的 UUID，不進行查詢
    if (!isValidUUID(eventId)) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
            // 獲取所有留言，包括用戶信息
      const { data: commentsData, error } = await supabase
        .from('event_comments')
        .select(`
          id,
          event_id,
          user_id,
          content,
          parent_comment_id,
          created_at,
          updated_at,
          user:users(
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      if (commentsData) {
        // 組織評論結構，將回覆嵌套到父評論下
        const organizedComments = organizeComments(commentsData);
        setComments(organizedComments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeComments = (commentsData: any[]): EventComment[] => {
    const commentMap = new Map<string, EventComment>();
    const rootComments: EventComment[] = [];

    // 先創建所有評論的映射
    commentsData.forEach(comment => {
      const commentObj: EventComment = {
        ...comment,
        replies: []
      };
      commentMap.set(comment.id, commentObj);
    });

    // 然後組織父子關係
    commentsData.forEach(comment => {
      const commentObj = commentMap.get(comment.id)!;
      
      if (comment.parent_comment_id) {
        // 這是一個回覆
        const parentComment = commentMap.get(comment.parent_comment_id);
        if (parentComment) {
          parentComment.replies = parentComment.replies || [];
          parentComment.replies.push(commentObj);
        }
      } else {
        // 這是一個根評論
        rootComments.push(commentObj);
      }
    });

    return rootComments;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || submitting) return;

    // 如果不是有效的 UUID，不能提交評論
    if (!isValidUUID(eventId)) {
      Alert.alert('錯誤', '無法對臨時事件添加評論，請先保存事件');
      return;
    }

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase
        .from('event_comments')
        .insert({
          event_id: eventId,
          user_id: user.id,
          content: newComment.trim(),
          parent_comment_id: replyToComment,
        })
        .select(`
          id,
          event_id,
          user_id,
          content,
          parent_comment_id,
          created_at,
          updated_at,
          user:users(
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        let errorMessage = '發送留言失敗，請稍後再試';
        
        // 根據錯誤類型提供更具體的提示
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          errorMessage = '您沒有權限在此事件下留言。請確認：\n1. 您是該家庭的成員\n2. 此事件已分享給您的家庭';
        } else if (error.code === 'PGRST301' || error.message?.includes('permission')) {
          errorMessage = '您沒有權限在此事件下留言，請確認您是家庭成員';
        } else if (error.code === '23503') {
          errorMessage = '事件不存在或已被刪除';
        }
        
        Alert.alert('錯誤', errorMessage);
        console.error('Error submitting comment:', error);
        return;
      }

      // 成功後重新加載評論
      setNewComment('');
      setReplyToComment(null);
      await loadComments();
      
    } catch (error) {
      Alert.alert('錯誤', '發送留言失敗，請稍後再試');
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '剛剛';
    if (diffInMinutes < 60) return `${diffInMinutes}分鐘前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小時前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return commentDate.toLocaleDateString('zh-TW');
  };

  const renderComment = (comment: EventComment, isReply: boolean = false) => (
    <View key={comment.id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {comment.user.display_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.commentMeta}>
            <Text style={styles.userName}>{comment.user.display_name}</Text>
            <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
          </View>
        </View>
        
        {!isReply && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => setReplyToComment(comment.id)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.replyButtonText}>回覆</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.commentContent}>{comment.content}</Text>
      
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map(reply => renderComment(reply, true))}
        </View>
      )}
    </View>
  );

  if (!visible) return null;

  // 如果不是有效的 UUID，顯示提示信息
  if (!isValidUUID(eventId)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="chatbubbles" size={20} color="#007AFF" />
          <Text style={styles.headerTitle}>留言</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>請先保存事件</Text>
          <Text style={styles.emptySubtext}>保存事件後就可以添加留言了</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={20} color="#007AFF" />
        <Text style={styles.headerTitle}>留言 ({comments.length})</Text>
      </View>

      <ScrollView style={styles.commentsSection} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>載入留言中...</Text>
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>還沒有留言</Text>
            <Text style={styles.emptySubtext}>成為第一個留言的人吧！</Text>
          </View>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </ScrollView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        {replyToComment && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyIndicatorText}>回覆留言中</Text>
            <TouchableOpacity onPress={() => setReplyToComment(null)}>
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder={replyToComment ? "寫下你的回覆..." : "寫下你的留言..."}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || submitting) && styles.sendButtonDisabled
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
          >
            <Ionicons
              name="send"
              size={20}
              color={(!newComment.trim() || submitting) ? '#ccc' : '#007AFF'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  commentsSection: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  commentContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 8,
    backgroundColor: '#f8f9fa',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentMeta: {
    marginLeft: 8,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  repliesContainer: {
    marginTop: 8,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  replyIndicatorText: {
    fontSize: 12,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  sendButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
}); 