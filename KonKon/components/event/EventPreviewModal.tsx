import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useFamily } from '../../contexts/FamilyContext';
import { t } from '../../lib/i18n';
import { supabase } from '../../lib/supabase';
import EventComments from './EventComments';

interface EventPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  event: any;
}

export default function EventPreviewModal({
  visible,
  onClose,
  onEdit,
  event
}: EventPreviewModalProps) {
  const { familyMembers, userFamilies } = useFamily();
  const [showComments, setShowComments] = useState(false);
  const [sharedFamilies, setSharedFamilies] = useState<string[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);

  // 異步獲取分享信息
  useEffect(() => {
    const fetchSharedFamilies = async () => {
      if (!event?.id || event.shared_families || event.shared_family_id) {
        return; // 如果已經有分享信息，就不需要重新獲取
      }

      setLoadingShares(true);
      try {
        const { data: shares, error } = await supabase
          .from('event_shares')
          .select('family_id')
          .eq('event_id', event.id);

        if (!error && shares) {
          setSharedFamilies(shares.map(share => share.family_id));
        }
      } catch (error) {
        console.error('Failed to fetch shared families:', error);
      } finally {
        setLoadingShares(false);
      }
    };

    if (visible && event) {
      fetchSharedFamilies();
    }
  }, [visible, event?.id]);

  if (!event) return null;

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return t('eventPreview.unknownDate');
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (timestamp: number): string => {
    if (!timestamp) return t('eventPreview.unknownTime');
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAttendeeNames = () => {
    if (!event.attendees || event.attendees.length === 0) {
      return t('eventPreview.noAttendees');
    }
    
    // attendees 是對象數組，不是字符串數組
    return event.attendees
      .map((attendee: any) => {
        // attendee 是對象，包含 user_id 和 user 信息
        return attendee.user?.display_name || t('eventPreview.unknownUser');
      })
      .join(', ');
  };

  const getCreatorName = () => {
    // 從家庭成員中找到創建者
    const creator = familyMembers.find(m => m.user_id === event.creator_id);
    return creator?.user?.display_name || t('eventPreview.unknownCreator');
  };

  const getFamilyName = () => {
    // 優先顯示分享到的空間（從事件對象）
    if (event.shared_families && event.shared_families.length > 0) {
      const sharedFamilyNames = event.shared_families
        .map((familyId: string) => {
          const family = userFamilies.find(f => f.id === familyId);
          return family?.name || t('eventPreview.unknownSpace');
        })
        .join(', ');
      return sharedFamilyNames;
    }
    
    // 使用異步獲取的分享信息
    if (sharedFamilies.length > 0) {
      const sharedFamilyNames = sharedFamilies
        .map((familyId: string) => {
          const family = userFamilies.find(f => f.id === familyId);
          return family?.name || t('eventPreview.unknownSpace');
        })
        .join(', ');
      return sharedFamilyNames;
    }
    
    // 如果有 shared_family_id（單個分享）
    if (event.shared_family_id) {
      const family = userFamilies.find(f => f.id === event.shared_family_id);
      return family?.name || t('eventPreview.unknownSpace');
    }
    
    // 如果正在加載分享信息
    if (loadingShares) {
      return t('eventPreview.loadingShares');
    }
    
    // 回退到原始的 family_id
    if (event.family_id) {
      const family = userFamilies.find(f => f.id === event.family_id);
      return family?.name || t('eventPreview.unknownSpace');
    }
    
    return t('eventPreview.personalSpace');
  };

  const formatCreatedDate = (dateString: string): string => {
    if (!dateString) return t('eventPreview.unknownTime');
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecurrenceInfo = () => {
    if (event.recurrence_rule) {
      // 簡單解析重複規則
      try {
        const rule = JSON.parse(event.recurrence_rule);
        switch (rule.frequency) {
          case 'daily': return t('eventPreview.recurrenceDaily');
          case 'weekly': return t('eventPreview.recurrenceWeekly');
          case 'monthly': return t('eventPreview.recurrenceMonthly');
          case 'yearly': return t('eventPreview.recurrenceYearly');
        }
      } catch (e) {
        return t('eventPreview.recurrenceCustom');
      }
    }
    return null;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalView}>
          {/* 頂部工具欄 */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="chevron-down" size={24} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moreButton} onPress={onEdit}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* 事件內容 - 添加 ScrollView */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 事件標題 */}
            <View style={styles.titleSection}>
              <View style={[styles.colorIndicator, { backgroundColor: event.color || '#007AFF' }]} />
              <Text style={styles.eventTitle}>{event.title || t('eventPreview.untitledEvent')}</Text>
            </View>

            {/* 時間信息 */}
            <View style={styles.timeSection}>
              <View style={styles.timeRow}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.timeText}>{formatDate(event.start_ts)}</Text>
              </View>
              
              {event.end_ts && (
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <Text style={styles.timeText}>
                    {formatTime(event.start_ts)} - {formatTime(event.end_ts)}
                  </Text>
                </View>
              )}
            </View>

            {/* 事件詳細信息 */}
            <View style={styles.detailsSection}>
              {/* 空間信息 */}
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={16} color="#666" />
                <Text style={styles.detailLabel}>{t('eventPreview.space')}:</Text>
                <Text style={styles.detailValue}>{getFamilyName()}</Text>
              </View>

              {/* 創建者 */}
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.detailLabel}>{t('eventPreview.creator')}:</Text>
                <Text style={styles.detailValue}>{getCreatorName()}</Text>
              </View>

              {/* 創建時間 */}
              {event.created_at && (
                <View style={styles.detailRow}>
                  <Ionicons name="add-circle-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>{t('eventPreview.createdAt')}:</Text>
                  <Text style={styles.detailValue}>{formatCreatedDate(event.created_at)}</Text>
                </View>
              )}

              {/* 重複規則 */}
              {getRecurrenceInfo() && (
                <View style={styles.detailRow}>
                  <Ionicons name="repeat-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>{t('eventPreview.recurrence')}:</Text>
                  <Text style={styles.detailValue}>{getRecurrenceInfo()}</Text>
                </View>
              )}
            </View>

            {/* 描述 */}
            {event.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>{t('eventPreview.description')}</Text>
                <Text style={styles.descriptionText}>{event.description}</Text>
              </View>
            )}

            {/* 位置 */}
            {event.location && (
              <View style={styles.locationSection}>
                <Text style={styles.sectionTitle}>{t('eventPreview.location')}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.locationText}>{event.location}</Text>
                </View>
              </View>
            )}

            {/* 參與者 */}
            <View style={styles.attendeesSection}>
              <Text style={styles.sectionTitle}>{t('eventPreview.attendees')}</Text>
              <View style={styles.attendeesRow}>
                <Ionicons name="people-outline" size={16} color="#666" />
                <Text style={styles.attendeesText}>{getAttendeeNames()}</Text>
              </View>
            </View>

            {/* 圖片 */}
            {event.image_urls && event.image_urls.length > 0 && (
              <View style={styles.imagesSection}>
                <Text style={styles.sectionTitle}>{t('eventPreview.images')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {event.image_urls.map((imageUrl: string, index: number) => (
                    <Image
                      key={index}
                      source={{ uri: imageUrl }}
                      style={styles.eventImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 留言切換按鈕 */}
            <View style={styles.commentsToggleSection}>
              <TouchableOpacity
                style={styles.commentsToggleButton}
                onPress={() => setShowComments(!showComments)}
              >
                <Ionicons 
                  name={showComments ? "chatbubbles" : "chatbubbles-outline"} 
                  size={20} 
                  color="#007AFF" 
                />
                <Text style={styles.commentsToggleText}>
                  {showComments ? t('eventPreview.hideComments') : t('eventPreview.showComments')}
                </Text>
                <Ionicons 
                  name={showComments ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#007AFF" 
                />
              </TouchableOpacity>
            </View>

            {/* 留言區域 */}
            {showComments && (
              <View style={styles.commentsSection}>
                <EventComments eventId={event.id} visible={true} />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 200,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  colorIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timeSection: {
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
  },
  locationSection: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
  },
  attendeesSection: {
    marginBottom: 20,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
  },
  imagesSection: {
    marginBottom: 20,
  },
  eventImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  commentsToggleSection: {
    marginBottom: 10,
  },
  commentsToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  commentsToggleText: {
    fontSize: 16,
    color: '#007AFF',
    marginHorizontal: 8,
  },
  commentsSection: {
    minHeight: 300,
    maxHeight: 400,
    marginBottom: 20,
  },
}); 