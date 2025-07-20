import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/lib/database.types';

type SimpleAlbum = Tables<'family_albums'> & {
  user_name?: string;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.8;
const CARD_HEIGHT = screenHeight * 0.5;
const CARD_MARGIN = 20;

interface SimpleAlbumViewProps {
  onAlbumPress?: (album: SimpleAlbum) => void;
  onAddAlbum?: () => void;
  refreshTrigger?: number;
}

const SimpleAlbumView: React.FC<SimpleAlbumViewProps> = ({ onAlbumPress, onAddAlbum, refreshTrigger }) => {
  const { user } = useAuth();
  const { userFamilies } = useFamily();
  const [albums, setAlbums] = useState<SimpleAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const translateX = useSharedValue(0);

  useEffect(() => {
    fetchAlbums();
  }, [user, userFamilies, refreshTrigger]);

  const fetchAlbums = async () => {
    if (!user || !userFamilies || userFamilies.length === 0) return;
    
    try {
      // Get the first family's ID (assuming user belongs to primary family)
      const familyId = userFamilies[0].id;
      
      const { data, error } = await supabase
        .from('family_albums')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching albums:', error);
        return;
      }

      const albumsWithInfo: SimpleAlbum[] = await Promise.all((data || []).map(async album => {
        const { data: userData } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', album.user_id)
          .single();

        return {
          ...album,
          user_name: userData?.display_name || '家庭成員',
        };
      }));

      setAlbums(albumsWithInfo);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlbums();
  };

  const goToNext = () => {
    if (currentIndex < albums.length - 1) {
      setCurrentIndex(currentIndex + 1);
      translateX.value = withSpring(-(currentIndex + 1) * (CARD_WIDTH + CARD_MARGIN));
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      translateX.value = withSpring(-(currentIndex - 1) * (CARD_WIDTH + CARD_MARGIN));
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      const shouldGoNext = event.translationX < -50 && event.velocityX < -500;
      const shouldGoPrevious = event.translationX > 50 && event.velocityX > 500;

      if (shouldGoNext) {
        runOnJS(goToNext)();
      } else if (shouldGoPrevious) {
        runOnJS(goToPrevious)();
      } else {
        translateX.value = withSpring(-currentIndex * (CARD_WIDTH + CARD_MARGIN));
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleAlbumPress = (album: SimpleAlbum) => {
    if (onAlbumPress) {
      onAlbumPress(album);
    }
  };

  const handleAddAlbum = () => {
    if (onAddAlbum) {
      onAddAlbum();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Empty state - show large + button
  if (albums.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.emptyContainer}>
          <TouchableOpacity style={styles.addAlbumButton} onPress={handleAddAlbum}>
            <Text style={styles.addAlbumIcon}>+</Text>
            <Text style={styles.addAlbumText}>新增相簿</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.cardsContainer}>
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.cardsWrapper, animatedStyle]}>
              {albums.map((album, index) => (
                <TouchableOpacity
                  key={album.id}
                  style={styles.card}
                  onPress={() => handleAlbumPress(album)}
                  activeOpacity={0.9}
                >
                  {album.cover_image_url ? (
                    <Image source={{ uri: album.cover_image_url }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.cardPlaceholder}>
                      <Text style={styles.placeholderIcon}>📷</Text>
                    </View>
                  )}
                  <View style={styles.cardOverlay}>
                    <Text style={styles.albumTitle}>{album.name}</Text>
                    {album.theme && (
                      <Text style={styles.albumTheme}>{album.theme}</Text>
                    )}
                    <Text style={styles.albumInfo}>
                      {album.photo_count || 0} 張照片
                    </Text>
                    <Text style={styles.albumCreator}>by {album.user_name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Add new album card */}
              <TouchableOpacity style={styles.addCard} onPress={handleAddAlbum}>
                <Text style={styles.addCardIcon}>+</Text>
                <Text style={styles.addCardText}>新增相簿</Text>
              </TouchableOpacity>
            </Animated.View>
          </PanGestureHandler>
        </View>

        {/* Pagination dots */}
        <View style={styles.pagination}>
          {[...albums, { id: 'add-button', album_id: 'add-button' }].map((album, index) => (
            <View
              key={`pagination-dot-${album.id || index}`}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Album description */}
        {albums.length > 0 && currentIndex < albums.length && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.albumDescription}>
              {albums[currentIndex].story || albums[currentIndex].theme}
            </Text>
            <Text style={styles.albumDetails}>
              📷 {albums[currentIndex].photo_count || 0} 張照片 • 由 {albums[currentIndex].user_name} 創建
            </Text>
          </View>
        )}
        
        {/* Show add album hint when on the add card */}
        {albums.length > 0 && currentIndex === albums.length && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.albumDescription}>
              創建新的家庭相簿
            </Text>
            <Text style={styles.albumDetails}>
              點擊上方按鈕開始創建智能相簿
            </Text>
          </View>
        )}
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  addAlbumButton: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  addAlbumIcon: {
    fontSize: 64,
    color: '#007AFF',
    marginBottom: 16,
  },
  addAlbumText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  cardsContainer: {
    height: CARD_HEIGHT + 100,
    paddingTop: 50,
  },
  cardsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: (screenWidth - CARD_WIDTH) / 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: CARD_MARGIN / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  albumTheme: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  albumInfo: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
  },
  albumCreator: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
  },
  addCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: CARD_MARGIN / 2,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  addCardIcon: {
    fontSize: 48,
    color: '#007AFF',
    marginBottom: 12,
  },
  addCardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#007AFF',
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  albumDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  albumDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default SimpleAlbumView;
export type { SimpleAlbum };