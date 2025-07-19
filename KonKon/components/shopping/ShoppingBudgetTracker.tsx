import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ShoppingBudget, ShoppingItem } from './ShoppingViewSelector';

interface ShoppingBudgetTrackerProps {
  budget: ShoppingBudget;
  items: ShoppingItem[];
  onBudgetUpdate: (newBudget: ShoppingBudget) => void;
}

const ShoppingBudgetTracker: React.FC<ShoppingBudgetTrackerProps> = ({
  budget,
  items,
  onBudgetUpdate
}) => {
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState({
    monthly: budget.monthly.toString(),
    weekly: budget.weekly.toString(),
  });

  // 计算购物统计数据
  const getShoppingStats = () => {
    const completedItems = items.filter(item => item.completed);
    const pendingItems = items.filter(item => !item.completed);
    
    const actualSpent = completedItems.reduce((sum, item) => 
      sum + (item.actualPrice || item.estimatedPrice), 0
    );
    
    const estimatedPending = pendingItems.reduce((sum, item) => 
      sum + item.estimatedPrice, 0
    );

    const totalEstimated = actualSpent + estimatedPending;
    const savings = items.reduce((sum, item) => {
      if (item.completed && item.actualPrice && item.actualPrice < item.estimatedPrice) {
        return sum + (item.estimatedPrice - item.actualPrice);
      }
      return sum;
    }, 0);

    return {
      actualSpent,
      estimatedPending,
      totalEstimated,
      savings,
      remaining: budget.monthly - actualSpent,
    };
  };

  const stats = getShoppingStats();
  const weeklyProgress = (stats.actualSpent / budget.weekly) * 100;
  const monthlyProgress = (stats.actualSpent / budget.monthly) * 100;

  // 获取预算状态
  const getBudgetStatus = () => {
    if (monthlyProgress >= 90) return { color: '#dc2626', label: '予算オーバー間近' };
    if (monthlyProgress >= 75) return { color: '#f59e0b', label: '予算使用中' };
    return { color: '#10b981', label: '予算内' };
  };

  const budgetStatus = getBudgetStatus();

  // 按类别分析支出
  const getCategoryAnalysis = () => {
    const categories = ['produce', 'meat', 'dairy', 'pantry', 'frozen', 'snacks', 'household'];
    
    return categories.map(categoryId => {
      const categoryItems = items.filter(item => item.category === categoryId);
      const spent = categoryItems
        .filter(item => item.completed)
        .reduce((sum, item) => sum + (item.actualPrice || item.estimatedPrice), 0);
      
      const estimated = categoryItems
        .reduce((sum, item) => sum + item.estimatedPrice, 0);

      const categoryNames: { [key: string]: { name: string; emoji: string } } = {
        produce: { name: '野菜・果物', emoji: '🥬' },
        meat: { name: '肉・魚', emoji: '🥩' },
        dairy: { name: '乳製品', emoji: '🥛' },
        pantry: { name: '調味料・保存', emoji: '🥫' },
        frozen: { name: '冷凍食品', emoji: '❄️' },
        snacks: { name: 'お菓子', emoji: '🍪' },
        household: { name: '日用品', emoji: '🧽' },
      };

      return {
        id: categoryId,
        name: categoryNames[categoryId]?.name || categoryId,
        emoji: categoryNames[categoryId]?.emoji || '📦',
        spent,
        estimated,
        percentage: stats.actualSpent > 0 ? (spent / stats.actualSpent) * 100 : 0,
      };
    }).filter(cat => cat.spent > 0 || cat.estimated > 0);
  };

  const categoryAnalysis = getCategoryAnalysis();

  const handleBudgetSave = () => {
    const newBudget: ShoppingBudget = {
      ...budget,
      monthly: parseFloat(editingBudget.monthly) || budget.monthly,
      weekly: parseFloat(editingBudget.weekly) || budget.weekly,
    };
    
    onBudgetUpdate(newBudget);
    setShowBudgetModal(false);
  };

  const renderBudgetOverview = () => (
    <View style={styles.budgetOverviewContainer}>
      <View style={styles.budgetHeader}>
        <Text style={styles.budgetTitle}>💰 予算管理</Text>
        <TouchableOpacity
          style={styles.editBudgetButton}
          onPress={() => setShowBudgetModal(true)}
        >
          <Text style={styles.editBudgetText}>編集</Text>
        </TouchableOpacity>
      </View>

      {/* 月間予算進捗 */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>今月の使用状況</Text>
          <View style={[styles.statusBadge, { backgroundColor: budgetStatus.color + '20' }]}>
            <Text style={[styles.statusText, { color: budgetStatus.color }]}>
              {budgetStatus.label}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(monthlyProgress, 100)}%`,
                backgroundColor: budgetStatus.color 
              }
            ]} 
          />
        </View>
        
        <View style={styles.progressStats}>
          <Text style={styles.progressText}>
            ¥{stats.actualSpent.toLocaleString()} / ¥{budget.monthly.toLocaleString()}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(monthlyProgress)}%使用
          </Text>
        </View>
      </View>

      {/* 週間予算進捗 */}
      <View style={styles.progressSection}>
        <Text style={styles.progressSubtitle}>今週の使用状況</Text>
        <View style={styles.weeklyProgressBar}>
          <View 
            style={[
              styles.weeklyProgressFill, 
              { 
                width: `${Math.min(weeklyProgress, 100)}%`,
                backgroundColor: weeklyProgress > 100 ? '#dc2626' : '#10b981'
              }
            ]} 
          />
        </View>
        <Text style={styles.weeklyProgressText}>
          ¥{stats.actualSpent.toLocaleString()} / ¥{budget.weekly.toLocaleString()}
        </Text>
      </View>

      {/* 予算統計カード */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>💸</Text>
          <Text style={styles.statValue}>¥{stats.actualSpent.toLocaleString()}</Text>
          <Text style={styles.statLabel}>実際の支出</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={styles.statValue}>¥{stats.estimatedPending.toLocaleString()}</Text>
          <Text style={styles.statLabel}>予定支出</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={[
            styles.statValue, 
            { color: stats.remaining >= 0 ? '#10b981' : '#dc2626' }
          ]}>
            ¥{stats.remaining.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>残予算</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            ¥{stats.savings.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>節約額</Text>
        </View>
      </View>
    </View>
  );

  const renderCategoryAnalysis = () => (
    <View style={styles.categoryAnalysisContainer}>
      <Text style={styles.sectionTitle}>📈 カテゴリ別支出分析</Text>
      
      {categoryAnalysis.map((category) => (
        <View key={category.id} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <Text style={styles.categoryAmount}>
              ¥{category.spent.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.categoryProgress}>
            <View style={styles.categoryProgressBar}>
              <View 
                style={[
                  styles.categoryProgressFill, 
                  { width: `${category.percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.categoryPercentage}>
              {Math.round(category.percentage)}%
            </Text>
          </View>
          
          {category.estimated > category.spent && (
            <Text style={styles.categoryEstimated}>
              予算: ¥{category.estimated.toLocaleString()}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderSavingsInsights = () => {
    const savingsItems = items.filter(item => 
      item.completed && 
      item.actualPrice && 
      item.actualPrice < item.estimatedPrice
    );

    if (savingsItems.length === 0) {
      return null;
    }

    return (
      <View style={styles.savingsContainer}>
        <Text style={styles.sectionTitle}>🎉 節約成果</Text>
        <Text style={styles.savingsSubtitle}>
          おめでとうございます！{savingsItems.length}個の商品で節約できました
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {savingsItems.slice(0, 5).map((item, index) => {
            const saved = item.estimatedPrice - (item.actualPrice || 0);
            return (
              <View key={index} style={styles.savingsCard}>
                <Text style={styles.savingsItemName}>{item.name}</Text>
                <Text style={styles.savingsAmount}>¥{saved} 節約</Text>
                <View style={styles.savingsPrices}>
                  <Text style={styles.originalPrice}>
                    ¥{item.estimatedPrice}
                  </Text>
                  <Text style={styles.actualPrice}>
                    ¥{item.actualPrice}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {renderBudgetOverview()}
      {renderCategoryAnalysis()}
      {renderSavingsInsights()}

      {/* 予算編集モーダル */}
      <Modal
        visible={showBudgetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.budgetModal}>
            <Text style={styles.modalTitle}>予算設定</Text>
            
            <View style={styles.budgetForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>月間予算</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={editingBudget.monthly}
                  onChangeText={(text) => setEditingBudget(prev => ({ ...prev, monthly: text }))}
                  keyboardType="numeric"
                  placeholder="月間予算を入力"
                />
                <Text style={styles.inputUnit}>円</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>週間予算</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={editingBudget.weekly}
                  onChangeText={(text) => setEditingBudget(prev => ({ ...prev, weekly: text }))}
                  keyboardType="numeric"
                  placeholder="週間予算を入力"
                />
                <Text style={styles.inputUnit}>円</Text>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBudgetModal(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleBudgetSave}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
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
  budgetOverviewContainer: {
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
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  budgetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  editBudgetButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editBudgetText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  progressSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  weeklyProgressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  weeklyProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6b7280',
  },
  weeklyProgressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  categoryAnalysisContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 30,
  },
  categoryEstimated: {
    fontSize: 12,
    color: '#9ca3af',
  },
  savingsContainer: {
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
  savingsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  savingsCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  savingsItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
    textAlign: 'center',
  },
  savingsAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  savingsPrices: {
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 12,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  actualPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 24,
  },
  budgetForm: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#374151',
  },
  inputUnit: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ShoppingBudgetTracker; 