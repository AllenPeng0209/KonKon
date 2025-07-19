import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { ChoreViewStyleId, choreViewConfigs, getChoreViewsByCategory } from './ChoreViewTypes';

interface ChoreViewStyleModalProps {
  visible: boolean;
  currentStyle: ChoreViewStyleId;
  onStyleSelect: (style: ChoreViewStyleId) => void;
  onClose: () => void;
}

export default function ChoreViewStyleModal({
  visible,
  currentStyle,
  onStyleSelect,
  onClose,
}: ChoreViewStyleModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 獲取所有分類
  const categories = [
    { key: 'all', label: '全部', count: choreViewConfigs.length },
    { key: '基礎', label: '基礎視圖', count: getChoreViewsByCategory('基礎').length },
    { key: '家庭', label: '家庭專用', count: getChoreViewsByCategory('家庭').length },
    { key: '遊戲化', label: '遊戲化', count: getChoreViewsByCategory('遊戲化').length },
    { key: '數據', label: '數據分析', count: getChoreViewsByCategory('數據').length },
    { key: '主題', label: '情境主題', count: getChoreViewsByCategory('主題').length },
    { key: '效率', label: '效率管理', count: getChoreViewsByCategory('效率').length },
    { key: '趣味', label: '趣味創新', count: getChoreViewsByCategory('趣味').length },
  ];

  // 過濾視圖配置
  const getFilteredConfigs = () => {
    let filtered = choreViewConfigs;

    // 分類過濾
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(config => config.category === selectedCategory);
    }

    // 搜索過濾
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(config =>
        config.name.toLowerCase().includes(query) ||
        config.description.toLowerCase().includes(query) ||
        config.features.some(feature => feature.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const handleStyleSelect = (styleId: ChoreViewStyleId) => {
    onStyleSelect(styleId);
  };

  const StyleCard = ({ config }: { config: typeof choreViewConfigs[0] }) => {
    const isSelected = config.id === currentStyle;
    const isDifficult = config.difficulty === 'hard';
    
    return (
      <TouchableOpacity
        style={[
          styles.styleCard,
          isSelected && styles.styleCardSelected,
          isDifficult && styles.styleCardDifficult
        ]}
        onPress={() => handleStyleSelect(config.id)}
      >
        <View style={styles.styleCardHeader}>
          <View style={styles.styleCardLeft}>
            <View style={[
              styles.colorIndicator,
              { backgroundColor: config.color }
            ]} />
            <View>
              <Text style={[
                styles.styleName,
                isSelected && styles.styleNameSelected
              ]}>
                {config.name}
              </Text>
              <Text style={styles.styleCategory}>
                {config.category}
              </Text>
            </View>
          </View>
          
          <View style={styles.styleCardRight}>
            {config.gameified && (
              <View style={styles.gameifiedBadge}>
                <Text style={styles.badgeText}>🎮</Text>
              </View>
            )}
            {config.dataVisualization && (
              <View style={styles.dataBadge}>
                <Text style={styles.badgeText}>📊</Text>
              </View>
            )}
            {isDifficult && (
              <View style={styles.difficultyBadge}>
                <Text style={styles.badgeText}>⭐</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.styleDescription} numberOfLines={2}>
          {config.description}
        </Text>

        <View style={styles.featuresContainer}>
          {config.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {config.features.length > 3 && (
            <Text style={styles.moreFeatures}>
              +{config.features.length - 3}
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓ 當前使用</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredConfigs = getFilteredConfigs();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 標題欄 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>關閉</Text>
          </TouchableOpacity>
          <Text style={styles.title}>選擇視圖樣式</Text>
          <View style={styles.headerRight} />
        </View>

        {/* 搜索欄 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索視圖樣式..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* 分類過濾 */}
        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.key && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.key && styles.categoryButtonTextActive
                ]}>
                  {category.label}
                </Text>
                <View style={styles.categoryCount}>
                  <Text style={styles.categoryCountText}>
                    {category.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 結果計數 */}
        <View style={styles.resultCount}>
          <Text style={styles.resultCountText}>
            找到 {filteredConfigs.length} 個視圖樣式
          </Text>
        </View>

        {/* 視圖樣式列表 */}
        <ScrollView 
          style={styles.stylesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.stylesListContent}
        >
          {filteredConfigs.map(config => (
            <StyleCard key={config.id} config={config} />
          ))}
          
          {filteredConfigs.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>沒有找到匹配的視圖樣式</Text>
              <Text style={styles.emptySubtitle}>
                嘗試調整搜索條件或選擇其他分類
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  categoryContainer: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  categoryCount: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  categoryCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  resultCountText: {
    fontSize: 12,
    color: '#6B7280',
  },
  stylesList: {
    flex: 1,
  },
  stylesListContent: {
    padding: 16,
    gap: 12,
  },
  styleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  styleCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  styleCardDifficult: {
    borderStyle: 'dashed',
  },
  styleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  styleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  styleNameSelected: {
    color: '#1D4ED8',
  },
  styleCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  styleCardRight: {
    flexDirection: 'row',
    gap: 4,
  },
  gameifiedBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  dataBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  difficultyBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
  },
  styleDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  featureTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featureText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '500',
  },
  moreFeatures: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  selectedIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});