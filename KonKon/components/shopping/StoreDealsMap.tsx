import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ShoppingItem, Store } from './ShoppingViewSelector';

interface StoreDealsMapProps {
  stores: Store[];
  items: ShoppingItem[];
  onStoreSelect: (storeId: string) => void;
}

const StoreDealsMap: React.FC<StoreDealsMapProps> = ({
  stores,
  items,
  onStoreSelect
}) => {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // 计算每个商店的匹配度和预估节省金额
  const storesWithRecommendation = stores.map(store => {
    const matchingItems = items.filter(item => 
      !item.completed && store.categories.includes(item.category)
    );
    
    const totalSavings = store.currentDeals.reduce((sum, deal) => {
      const matchingItem = items.find(item => 
        item.name.toLowerCase().includes(deal.itemName.toLowerCase()) && !item.completed
      );
      return matchingItem ? sum + (deal.originalPrice - deal.discountPrice) : sum;
    }, 0);

    return {
      ...store,
      matchingItems: matchingItems.length,
      potentialSavings: totalSavings,
      score: matchingItems.length * 10 + (totalSavings / 100) * 5 - store.distance
    };
  });

  // 按推荐度排序
  const sortedStores = storesWithRecommendation.sort((a, b) => b.score - a.score);

  const categories = [
    { id: 'all', name: '全て', emoji: '🏪' },
    { id: 'supermarket', name: 'スーパー', emoji: '🛒' },
    { id: 'convenience', name: 'コンビニ', emoji: '🏪' },
    { id: 'drugstore', name: 'ドラッグストア', emoji: '💊' },
    { id: 'department', name: 'デパート', emoji: '🏬' },
  ];

  const handleStorePress = (store: Store) => {
    setSelectedStore(store);
    setShowStoreModal(true);
    onStoreSelect(store.id);
  };

  const renderRecommendationHeader = () => (
    <View style={styles.recommendationContainer}>
      <Text style={styles.recommendationTitle}>🎯 おすすめ買い物ルート</Text>
      <Text style={styles.recommendationSubtitle}>
        購入予定商品と特売情報に基づいて最適化されています
      </Text>
      
      {/* 今日のベストディール */}
      <View style={styles.bestDealsSection}>
        <Text style={styles.bestDealsTitle}>🔥 今日のお得情報</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {stores.flatMap(store => store.currentDeals)
            .sort((a, b) => b.discountPercent - a.discountPercent)
            .slice(0, 5)
            .map((deal, index) => (
                             <View key={index} style={styles.dealCard}>
                 <Text style={styles.dealDiscount}>{deal.discountPercent}% OFF</Text>
                 <Text style={styles.dealItemText}>{deal.itemName}</Text>
                 <Text style={styles.dealStore}>{deal.storeName}</Text>
                <View style={styles.dealPrices}>
                  <Text style={styles.originalPrice}>¥{deal.originalPrice}</Text>
                  <Text style={styles.discountPrice}>¥{deal.discountPrice}</Text>
                </View>
              </View>
            ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterChip,
              filterCategory === category.id && styles.activeFilterChip
            ]}
            onPress={() => setFilterCategory(category.id)}
          >
            <Text style={styles.filterEmoji}>{category.emoji}</Text>
            <Text style={[
              styles.filterText,
              filterCategory === category.id && styles.activeFilterText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStoreCard = (storeData: typeof storesWithRecommendation[0]) => {
    const { matchingItems, potentialSavings, ...store } = storeData;
    
    return (
      <TouchableOpacity
        key={store.id}
        style={styles.storeCard}
        onPress={() => handleStorePress(store)}
      >
        {/* 推荐标签 */}
        {potentialSavings > 0 && (
          <View style={styles.savingsLabel}>
            <Text style={styles.savingsText}>¥{potentialSavings}お得</Text>
          </View>
        )}
        
        <View style={styles.storeHeader}>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeLocation}>📍 {store.location}</Text>
            <Text style={styles.storeDistance}>
              🚶‍♀️ {store.distance}km • 徒歩{Math.round(store.distance * 12)}分
            </Text>
          </View>
          
          <View style={styles.storeStats}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{matchingItems}</Text>
              <Text style={styles.statLabel}>商品</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{store.currentDeals.length}</Text>
              <Text style={styles.statLabel}>特売</Text>
            </View>
          </View>
        </View>

        {/* 特売情報プレビュー */}
        {store.currentDeals.length > 0 && (
          <View style={styles.dealsPreview}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {store.currentDeals.slice(0, 3).map((deal, index) => (
                <View key={index} style={styles.miniDealCard}>
                  <Text style={styles.miniDealItem}>{deal.itemName}</Text>
                  <Text style={styles.miniDealPrice}>
                    ¥{deal.discountPrice} 
                    <Text style={styles.miniDealOriginal}>¥{deal.originalPrice}</Text>
                  </Text>
                </View>
              ))}
              {store.currentDeals.length > 3 && (
                <View style={styles.moreDealsBadge}>
                  <Text style={styles.moreDealsText}>+{store.currentDeals.length - 3}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.storeFooter}>
          <Text style={styles.matchingText}>
            🎯 購入予定商品 {matchingItems}個がマッチ
          </Text>
          <Text style={styles.storeArrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredStores = filterCategory === 'all' 
    ? sortedStores 
    : sortedStores.filter(store => 
        store.name.toLowerCase().includes(filterCategory) ||
        store.categories.includes(filterCategory)
      );

  return (
    <ScrollView style={styles.container}>
      {renderRecommendationHeader()}
      {renderCategoryFilter()}

      <View style={styles.storesSection}>
        <View style={styles.storesSectionHeader}>
          <Text style={styles.storesSectionTitle}>🏪 近くの店舗</Text>
          <Text style={styles.storeCount}>{filteredStores.length}件</Text>
        </View>

        {filteredStores.map(renderStoreCard)}
      </View>

      {/* 店舗詳細モーダル */}
      <Modal
        visible={showStoreModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.storeModal}>
            {selectedStore && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedStore.name}</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowStoreModal(false)}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <Text style={styles.modalLocation}>
                    📍 {selectedStore.location}
                  </Text>
                  <Text style={styles.modalDistance}>
                    🚶‍♀️ {selectedStore.distance}km • 徒歩{Math.round(selectedStore.distance * 12)}分
                  </Text>

                  <Text style={styles.dealsTitle}>🔥 現在の特売情報</Text>
                  <ScrollView style={styles.dealsList}>
                    {selectedStore.currentDeals.map((deal, index) => (
                      <View key={index} style={styles.dealItem}>
                        <View style={styles.dealInfo}>
                          <Text style={styles.dealItemName}>{deal.itemName}</Text>
                          <Text style={styles.dealValidUntil}>
                            {deal.validUntil.toLocaleDateString()}まで
                          </Text>
                        </View>
                        <View style={styles.dealPricing}>
                          <Text style={styles.dealOriginalPrice}>
                            ¥{deal.originalPrice}
                          </Text>
                          <Text style={styles.dealDiscountPrice}>
                            ¥{deal.discountPrice}
                          </Text>
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountPercent}>
                              {deal.discountPercent}%OFF
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  recommendationContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  recommendationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  bestDealsSection: {
    marginTop: 16,
  },
  bestDealsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dealCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  dealDiscount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  dealItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 2,
    textAlign: 'center',
  },
  dealStore: {
    fontSize: 12,
    color: '#7f1d1d',
    marginBottom: 8,
  },
  dealPrices: {
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 12,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeFilterChip: {
    backgroundColor: '#3b82f6',
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  storesSection: {
    padding: 16,
  },
  storesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  storesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  storeCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  storeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  savingsLabel: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  storeLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  storeDistance: {
    fontSize: 12,
    color: '#9ca3af',
  },
  storeStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  dealsPreview: {
    marginBottom: 12,
  },
  miniDealCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  miniDealItem: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 2,
    textAlign: 'center',
  },
  miniDealPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  miniDealOriginal: {
    fontSize: 10,
    color: '#6b7280',
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  moreDealsBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  moreDealsText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  storeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  matchingText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  storeArrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  storeModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  modalContent: {
    paddingTop: 20,
  },
  modalLocation: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  modalDistance: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  dealsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  dealsList: {
    maxHeight: 300,
  },
  dealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  dealInfo: {
    flex: 1,
  },
  dealItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  dealValidUntil: {
    fontSize: 12,
    color: '#6b7280',
  },
  dealPricing: {
    alignItems: 'flex-end',
  },
  dealOriginalPrice: {
    fontSize: 12,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  dealDiscountPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  discountBadge: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountPercent: {
    fontSize: 10,
    fontWeight: '600',
    color: '#dc2626',
  },
});

export default StoreDealsMap; 