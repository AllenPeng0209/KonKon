import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/lib/database.types';
import { t } from '@/lib/i18n'; // 导入 t 函数
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AddMemoryModal from './AddMemoryModal'; // 导入模态框

type Memory = Tables<'family_memories'> & {
  // 未来のために：ユーザー情報を結合するためのプレースホルダー
  // user_avatar: string;
  // user_name: string;
};

const MemoryCard = ({ memory }: { memory: Memory }) => {
  const imageUrls = memory.image_urls as string[] | null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarPlaceholder}><Text>👤</Text></View>
        <View>
          <Text style={styles.userName}>{t('album.familyMember')}</Text>
          <Text style={styles.date}>{new Date(memory.created_at).toLocaleString()}</Text>
        </View>
      </View>
      {memory.story && <Text style={styles.story}>{memory.story}</Text>}
      {imageUrls && imageUrls.length > 0 && (
        <Image source={{ uri: imageUrls[0] }} style={styles.mainImage} />
      )}
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.footerButton}>
          <Text>❤️ {t('album.like')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}>
          <Text>💬 {t('album.comment')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const AlbumView = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Tables<'family_memories'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, [user]);

  const fetchMemories = async () => {
    if (!user) {
        setLoading(false);
        return;
    };
    
    setLoading(true);
    // TODO: ここでは、ユーザーのfamily_idに基づいて取得する必要があります
      const { data, error } = await supabase
        .from('family_memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching memories:', error);
      } else {
        setMemories(data);
      }
      setLoading(false);
    };

  const handleRefresh = () => {
    fetchMemories();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>{t('album.loading')}</Text>
      </View>
    );
  }

  if (memories.length === 0) {
    return (
        <View style={styles.centered}>
            <Text style={styles.emptyStateIcon}>🖼️</Text>
            <Text style={styles.emptyStateText}>{t('album.emptyStateTitle')}</Text>
            <Text style={styles.emptyStateSubText}>{t('album.emptyStateSubtitle')}</Text>
        </View>
    )
  }

  return (
    <>
    <ScrollView style={styles.container}>
      {memories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </ScrollView>
    <AddMemoryModal 
        isVisible={showAddMemoryModal}
        onClose={() => setShowAddMemoryModal(false)}
        onSave={() => {
            setShowAddMemoryModal(false);
            handleRefresh();
        }}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  date: {
    fontSize: 12,
    color: '#6c757d',
  },
  story: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  mainImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 8,
  },
  footerButton: {
    padding: 8,
  }
});

export default AlbumView; 