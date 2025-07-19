import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ShoppingItem, Store } from './ShoppingViewSelector';

interface SmartShoppingListProps {
  items: ShoppingItem[];
  stores: Store[];
  onItemToggle: (itemId: string) => void;
  onItemAdd: (item: Omit<ShoppingItem, 'id'>) => void;
  onItemDelete: (itemId: string) => void;
}

const SmartShoppingList: React.FC<SmartShoppingListProps> = ({
  items,
  stores,
  onItemToggle,
  onItemAdd,
  onItemDelete
}) => {
  const [newItemText, setNewItemText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('食材');
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);

  // 商品分类
  const categories = [
    { id: 'produce', name: '野菜・果物', emoji: '🥬', color: '#4CAF50' },
    { id: 'meat', name: '肉・魚', emoji: '🥩', color: '#FF5722' },
    { id: 'dairy', name: '乳製品', emoji: '🥛', color: '#2196F3' },
    { id: 'pantry', name: '調味料・保存', emoji: '🥫', color: '#FF9800' },
    { id: 'frozen', name: '冷凍食品', emoji: '❄️', color: '#00BCD4' },
    { id: 'snacks', name: 'お菓子', emoji: '🍪', color: '#9C27B0' },
    { id: 'household', name: '日用品', emoji: '🧽', color: '#795548' },
    { id: 'other', name: 'その他', emoji: '📦', color: '#607D8B' },
  ];

  // AI优化购物路线
  useEffect(() => {
    const optimizeShoppingRoute = () => {
      const incompleteItems = items.filter(item => !item.completed);
      const sortedByCategory = incompleteItems.sort((a, b) => {
        const categoryOrder = ['produce', 'meat', 'dairy', 'frozen', 'pantry', 'snacks', 'household'];
        return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      });
      setOptimizedRoute(sortedByCategory.map(item => item.id));
    };

    optimizeShoppingRoute();
  }, [items]);

  const handleQuickAdd = () => {
    if (newItemText.trim()) {
      const newItem: Omit<ShoppingItem, 'id'> = {
        name: newItemText.trim(),
        category: selectedCategory,
        quantity: 1,
        unit: '個',
        estimatedPrice: 0,
        priority: 'medium',
        completed: false,
        addedBy: 'user',
        addedDate: new Date(),
      };
      onItemAdd(newItem);
      setNewItemText('');
    }
  };

  const getProgressStats = () => {
    const total = items.length;
    const completed = items.filter(item => item.completed).length;
    const totalBudget = items.reduce((sum, item) => sum + item.estimatedPrice, 0);
    const spentBudget = items
      .filter(item => item.completed)
      .reduce((sum, item) => sum + (item.actualPrice || item.estimatedPrice), 0);

    return { total, completed, totalBudget, spentBudget };
  };

  const stats = getProgressStats();
  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  const renderProgressHeader = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>📋 お買い物リスト</Text>
        <Text style={styles.progressSubtitle}>
          {stats.completed}/{stats.total}完了 ({Math.round(progress)}%)
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>完了率 {Math.round(progress)}%</Text>
      </View>

      <View style={styles.budgetInfo}>
        <Text style={styles.budgetText}>
          💰 予算: ¥{stats.totalBudget.toLocaleString()} 
          (使用済み: ¥{stats.spentBudget.toLocaleString()})
        </Text>
      </View>
    </View>
  );

  const renderQuickAdd = () => (
    <View style={styles.quickAddContainer}>
      <View style={styles.quickAddInput}>
        <TextInput
          style={styles.textInput}
          placeholder="商品を追加... (例: 牛乳 2本)"
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleQuickAdd}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleQuickAdd}>
          <Text style={styles.addButtonText}>追加</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSmartSuggestions = () => {
    const suggestions = [
      { emoji: '🥛', text: '牛乳', category: 'dairy' },
      { emoji: '🍞', text: 'パン', category: 'pantry' },
      { emoji: '🥚', text: '卵', category: 'dairy' },
      { emoji: '🍎', text: 'りんご', category: 'produce' },
    ];

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>💡 よく購入される商品</Text>
        <View style={styles.suggestionsList}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => {
                setNewItemText(suggestion.text);
                setSelectedCategory(suggestion.category);
              }}
            >
              <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
              <Text style={styles.suggestionText}>{suggestion.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderShoppingItem = (item: ShoppingItem) => {
    const category = categories.find(cat => cat.id === item.category) || categories[categories.length - 1];
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.itemContainer,
          item.completed && styles.completedItemContainer
        ]}
        onPress={() => onItemToggle(item.id)}
      >
        <View style={styles.itemLeft}>
          <View style={[styles.checkbox, item.completed && styles.checkedBox]}>
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <View style={styles.itemInfo}>
            <Text style={[
              styles.itemName,
              item.completed && styles.completedText
            ]}>
              {item.name}
            </Text>
            <Text style={styles.itemDetails}>
              {item.quantity}{item.unit} • ¥{item.estimatedPrice}
            </Text>
          </View>
        </View>
        
        <View style={styles.itemRight}>
          {item.priority === 'high' && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>急</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onItemDelete(item.id)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const groupedItems = categories.map(category => ({
    category,
    items: items.filter(item => item.category === category.id)
  })).filter(group => group.items.length > 0);

  return (
    <ScrollView style={styles.container}>
      {renderProgressHeader()}
      {renderQuickAdd()}
      {renderSmartSuggestions()}

      {/* 最適化された買い物ルート */}
      {optimizedRoute.length > 0 && (
        <View style={styles.routeContainer}>
          <Text style={styles.routeTitle}>🗺️ 効率的な買い物ルート</Text>
          <Text style={styles.routeSubtitle}>売り場順で最適化されています</Text>
        </View>
      )}

      {/* 商品リスト */}
      {groupedItems.map(({ category, items: categoryItems }) => (
        <View key={category.id} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryCount}>{categoryItems.length}</Text>
            </View>
          </View>
          {categoryItems.map(renderShoppingItem)}
        </View>
      ))}

      {items.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>🛒</Text>
          <Text style={styles.emptyStateTitle}>買い物リストは空です</Text>
          <Text style={styles.emptyStateText}>
            上の入力フィールドから商品を追加してください
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  progressContainer: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  budgetInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  budgetText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  quickAddContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickAddInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  routeContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  routeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  categorySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedItemContainer: {
    backgroundColor: '#f9fafb',
    opacity: 0.7,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  itemDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#dc2626',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SmartShoppingList; 