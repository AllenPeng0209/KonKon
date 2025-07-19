// 交易記錄列表組件 - 顯示家庭記帳記錄
import {
    FinanceTransactionWithDetails
} from '@/lib/financeService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import {
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface TransactionListProps {
  transactions: FinanceTransactionWithDetails[];
  onRefresh: () => void;
  onEdit: (transaction: FinanceTransactionWithDetails) => void;
  groupBy?: 'date' | 'category' | 'member';
  showGroupTotals?: boolean;
  enableSearch?: boolean;
  enableFilter?: boolean;
}

interface FilterOptions {
  type?: 'income' | 'expense' | 'all';
  category?: string;
  member?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

interface TransactionGroup {
  key: string;
  title: string;
  transactions: FinanceTransactionWithDetails[];
  totalAmount: number;
  incomeAmount: number;
  expenseAmount: number;
}

export default function TransactionList({
  transactions,
  onRefresh,
  onEdit,
  groupBy = 'date',
  showGroupTotals = true,
  enableSearch = true,
  enableFilter = true,
}: TransactionListProps) {
  // 狀態管理
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ type: 'all' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);

  // 搜索和篩選邏輯
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // 文本搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction => 
        (transaction.description?.toLowerCase().includes(query)) ||
        (transaction.category?.name?.toLowerCase().includes(query)) ||
        (transaction.member?.name?.toLowerCase().includes(query)) ||
        (transaction.account?.name?.toLowerCase().includes(query)) ||
        (transaction.tags?.toLowerCase().includes(query))
      );
    }

    // 類型篩選
    if (filterOptions.type && filterOptions.type !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterOptions.type);
    }

    // 分類篩選
    if (filterOptions.category) {
      filtered = filtered.filter(transaction => 
        transaction.category?.name === filterOptions.category
      );
    }

    // 成員篩選
    if (filterOptions.member) {
      filtered = filtered.filter(transaction => 
        transaction.member?.name === filterOptions.member
      );
    }

    // 日期範圍篩選
    if (filterOptions.dateFrom) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.transaction_date) >= filterOptions.dateFrom!
      );
    }
    if (filterOptions.dateTo) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.transaction_date) <= filterOptions.dateTo!
      );
    }

    // 金額範圍篩選
    if (filterOptions.amountMin !== undefined) {
      filtered = filtered.filter(transaction => transaction.amount >= filterOptions.amountMin!);
    }
    if (filterOptions.amountMax !== undefined) {
      filtered = filtered.filter(transaction => transaction.amount <= filterOptions.amountMax!);
    }

    return filtered;
  }, [transactions, searchQuery, filterOptions]);

  // 分組交易記錄
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, TransactionGroup>();

    filteredTransactions.forEach(transaction => {
      let groupKey: string;
      let groupTitle: string;

      switch (groupBy) {
        case 'category':
          groupKey = transaction.category?.id || 'uncategorized';
          groupTitle = transaction.category?.name || '未分類';
          break;
        case 'member':
          groupKey = transaction.member?.id || 'unknown';
          groupTitle = transaction.member?.name || '未知成員';
          break;
        case 'date':
        default:
          const date = new Date(transaction.transaction_date);
          groupKey = date.toISOString().split('T')[0];
          groupTitle = date.toLocaleDateString('zh-TW', { 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
          });
          break;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          title: groupTitle,
          transactions: [],
          totalAmount: 0,
          incomeAmount: 0,
          expenseAmount: 0,
        });
      }

      const group = groups.get(groupKey)!;
      group.transactions.push(transaction);
      
      if (transaction.type === 'income') {
        group.incomeAmount += transaction.amount;
      } else if (transaction.type === 'expense') {
        group.expenseAmount += transaction.amount;
      }
      
      group.totalAmount = group.incomeAmount - group.expenseAmount;
    });

    // 按日期排序組
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (groupBy === 'date') {
        return new Date(b.key).getTime() - new Date(a.key).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    return sortedGroups;
  }, [filteredTransactions, groupBy]);

  // 處理刷新
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  // 切換組展開/收起
  const toggleGroup = (groupKey: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(groupKey)) {
      newExpandedGroups.delete(groupKey);
    } else {
      newExpandedGroups.add(groupKey);
    }
    setExpandedGroups(newExpandedGroups);
  };

  // 清除篩選
  const clearFilters = () => {
    setFilterOptions({ type: 'all' });
    setSearchQuery('');
  };

  // 篩選模態框內容
  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <TouchableOpacity
            onPress={() => setShowFilterModal(false)}
            style={styles.filterCloseButton}
          >
            <Text style={styles.filterCloseText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.filterTitle}>篩選條件</Text>
          <TouchableOpacity
            onPress={clearFilters}
            style={styles.filterClearButton}
          >
            <Text style={styles.filterClearText}>清除</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* 類型選擇 */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>交易類型</Text>
            <View style={styles.filterTypeContainer}>
              {[
                { value: 'all', label: '全部' },
                { value: 'income', label: '收入' },
                { value: 'expense', label: '支出' },
              ].map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.filterTypeButton,
                    filterOptions.type === type.value && styles.filterTypeButtonActive
                  ]}
                  onPress={() => setFilterOptions(prev => ({ ...prev, type: type.value as any }))}
                >
                  <Text style={[
                    styles.filterTypeButtonText,
                    filterOptions.type === type.value && styles.filterTypeButtonTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 日期範圍 */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>日期範圍</Text>
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker('from')}
              >
                <Text style={styles.dateButtonText}>
                  開始: {filterOptions.dateFrom?.toLocaleDateString('zh-TW') || '選擇日期'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker('to')}
              >
                <Text style={styles.dateButtonText}>
                  結束: {filterOptions.dateTo?.toLocaleDateString('zh-TW') || '選擇日期'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 金額範圍 */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>金額範圍</Text>
            <View style={styles.amountRangeContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="最低金額"
                keyboardType="numeric"
                value={filterOptions.amountMin?.toString() || ''}
                onChangeText={(text) => {
                  const amount = parseFloat(text) || undefined;
                  setFilterOptions(prev => ({ ...prev, amountMin: amount }));
                }}
              />
              <Text style={styles.amountSeparator}>-</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="最高金額"
                keyboardType="numeric"
                value={filterOptions.amountMax?.toString() || ''}
                onChangeText={(text) => {
                  const amount = parseFloat(text) || undefined;
                  setFilterOptions(prev => ({ ...prev, amountMax: amount }));
                }}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.filterFooter}>
          <TouchableOpacity
            style={styles.applyFilterButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.applyFilterButtonText}>套用篩選</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={
              showDatePicker === 'from' 
                ? filterOptions.dateFrom || new Date()
                : filterOptions.dateTo || new Date()
            }
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(null);
              if (selectedDate) {
                if (showDatePicker === 'from') {
                  setFilterOptions(prev => ({ ...prev, dateFrom: selectedDate }));
                } else {
                  setFilterOptions(prev => ({ ...prev, dateTo: selectedDate }));
                }
              }
            }}
          />
        )}
      </View>
    </Modal>
  );

  // 渲染搜索欄
  const renderSearchBar = () => {
    if (!enableSearch && !enableFilter) return null;

    return (
      <View style={styles.searchContainer}>
        {enableSearch && (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="搜尋交易記錄..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.searchClearButton}
              >
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        {enableFilter && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="funnel-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 渲染交易項目
  const renderTransactionItem = (transaction: FinanceTransactionWithDetails) => (
    <TouchableOpacity
      key={transaction.id}
      style={styles.transactionItem}
      onPress={() => onEdit(transaction)}
    >
      <View style={styles.transactionIcon}>
        <Text style={styles.transactionEmoji}>
          {transaction.type === 'income' ? '💰' : '💸'}
        </Text>
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>
          {transaction.description || transaction.category?.name || '未命名交易'}
        </Text>
        <Text style={styles.transactionSubtitle}>
          {transaction.account?.name} • {transaction.member?.name}
        </Text>
        {transaction.tags && (
          <Text style={styles.transactionTags}>
            #{transaction.tags.replace(/,/g, ' #')}
          </Text>
        )}
      </View>
      
      <View style={styles.transactionAmountContainer}>
        <Text style={[
          styles.transactionAmount,
          transaction.type === 'income' ? styles.incomeText : styles.expenseText
        ]}>
          {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toLocaleString()}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(transaction.transaction_date).toLocaleDateString('zh-TW')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 渲染組標題
  const renderGroupHeader = (group: TransactionGroup) => (
    <TouchableOpacity
      style={styles.groupHeader}
      onPress={() => toggleGroup(group.key)}
    >
      <View style={styles.groupHeaderLeft}>
        <Ionicons
          name={expandedGroups.has(group.key) ? 'chevron-down' : 'chevron-forward'}
          size={20}
          color="#8E8E93"
        />
        <Text style={styles.groupTitle}>{group.title}</Text>
        <Text style={styles.groupCount}>({group.transactions.length})</Text>
      </View>
      
      {showGroupTotals && (
        <View style={styles.groupTotals}>
          {group.incomeAmount > 0 && (
            <Text style={[styles.groupTotal, styles.incomeText]}>
              +¥{group.incomeAmount.toLocaleString()}
            </Text>
          )}
          {group.expenseAmount > 0 && (
            <Text style={[styles.groupTotal, styles.expenseText]}>
              -¥{group.expenseAmount.toLocaleString()}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderSearchBar()}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        {groupedTransactions.length > 0 ? (
          groupedTransactions.map(group => (
            <View key={group.key} style={styles.groupContainer}>
              {renderGroupHeader(group)}
              {expandedGroups.has(group.key) && (
                <View style={styles.groupContent}>
                  {group.transactions.map(renderTransactionItem)}
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery || Object.keys(filterOptions).some(key => 
                key !== 'type' && filterOptions[key as keyof FilterOptions] !== undefined
              ) ? '沒有符合條件的交易記錄' : '還沒有交易記錄'}
            </Text>
          </View>
        )}
      </ScrollView>

      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
  },
  searchClearButton: {
    padding: 4,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  groupContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 8,
  },
  groupCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  groupTotals: {
    alignItems: 'flex-end',
  },
  groupTotal: {
    fontSize: 14,
    fontWeight: '500',
  },
  groupContent: {
    paddingVertical: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  transactionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  transactionTags: {
    fontSize: 12,
    color: '#007AFF',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  incomeText: {
    color: '#34C759',
  },
  expenseText: {
    color: '#FF3B30',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  
  // 篩選模態框樣式
  filterModal: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterCloseButton: {
    padding: 8,
  },
  filterCloseText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  filterClearButton: {
    padding: 8,
  },
  filterClearText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  filterTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  filterTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterTypeButtonText: {
    fontSize: 14,
    color: '#1D1D1F',
  },
  filterTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  dateRangeContainer: {
    gap: 12,
  },
  dateButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1D1D1F',
  },
  amountRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    fontSize: 16,
  },
  amountSeparator: {
    fontSize: 16,
    color: '#8E8E93',
  },
  filterFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  applyFilterButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});