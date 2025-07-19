// 交易記錄列表組件 - 顯示家庭記帳記錄
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  FinanceTransactionWithDetails,
  FinanceTransactionService,
} from '@/lib/financeService';

interface TransactionListProps {
  transactions: FinanceTransactionWithDetails[];
  onRefresh: () => void;
  onEdit: (transaction: FinanceTransactionWithDetails) => void;
  groupBy?: 'date' | 'category' | 'member';
  showGroupTotals?: boolean;
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
}: TransactionListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 分組交易記錄
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, TransactionGroup>();

    transactions.forEach(transaction => {
      let groupKey: string;
      let groupTitle: string;

      switch (groupBy) {
        case 'date':
          const date = new Date(transaction.transaction_date);
          groupKey = transaction.transaction_date;
          groupTitle = formatDateGroup(date);
          break;
        case 'category':
          groupKey = transaction.category.id;
          groupTitle = transaction.category.name;
          break;
        case 'member':
          groupKey = transaction.member.id;
          groupTitle = transaction.member.name;
          break;
        default:
          groupKey = 'all';
          groupTitle = '全部記錄';
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

    // 排序群組
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (groupBy === 'date') {
        return new Date(b.key).getTime() - new Date(a.key).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    // 對每個群組內的交易進行排序
    sortedGroups.forEach(group => {
      group.transactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return sortedGroups;
  }, [transactions, groupBy]);

  const toggleGroup = (groupKey: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(groupKey)) {
      newExpandedGroups.delete(groupKey);
    } else {
      newExpandedGroups.add(groupKey);
    }
    setExpandedGroups(newExpandedGroups);
  };

  const handleDeleteTransaction = (transaction: FinanceTransactionWithDetails) => {
    Alert.alert(
      '確認刪除',
      `確定要刪除這筆交易嗎？\n${transaction.description}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await FinanceTransactionService.delete(transaction.id);
              onRefresh();
            } catch (error) {
              console.error('刪除交易失敗:', error);
              Alert.alert('錯誤', '刪除失敗，請稍後重試');
            }
          }
        }
      ]
    );
  };

  const renderTransactionItem = (transaction: FinanceTransactionWithDetails) => (
    <TouchableOpacity
      key={transaction.id}
      style={styles.transactionItem}
      onPress={() => onEdit(transaction)}
      onLongPress={() => handleDeleteTransaction(transaction)}
    >
      <View style={styles.transactionLeft}>
        {/* 分類顏色指示器 */}
        <View style={[
          styles.categoryIndicator,
          { backgroundColor: transaction.category.color }
        ]} />
        
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionCategory}>
              {transaction.category.name}
            </Text>
            <Text style={styles.metaSeparator}> • </Text>
            <Text style={styles.transactionAccount}>
              {transaction.account.name}
            </Text>
            {transaction.location && (
              <>
                <Text style={styles.metaSeparator}> • </Text>
                <Text style={styles.transactionLocation}>
                  {transaction.location}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
        ]}>
          {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toLocaleString()}
        </Text>
        <Text style={styles.transactionTime}>
          {formatTime(transaction.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderGroup = (group: TransactionGroup) => {
    const isExpanded = expandedGroups.has(group.key);
    
    return (
      <View key={group.key} style={styles.groupContainer}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleGroup(group.key)}
        >
          <View style={styles.groupHeaderLeft}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <Text style={styles.groupCount}>
              {group.transactions.length}筆交易
            </Text>
          </View>
          
          {showGroupTotals && (
            <View style={styles.groupHeaderRight}>
              <Text style={[
                styles.groupTotal,
                group.totalAmount >= 0 ? styles.incomeAmount : styles.expenseAmount
              ]}>
                {group.totalAmount >= 0 ? '+' : ''}¥{Math.abs(group.totalAmount).toLocaleString()}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#9CA3AF"
              />
            </View>
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.groupContent}>
            {group.transactions.map(renderTransactionItem)}
          </View>
        )}
      </View>
    );
  };

  // 如果沒有交易記錄
  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>暫無交易記錄</Text>
        <Text style={styles.emptySubtitle}>
          開始記錄您的收入和支出
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <ScrollView.RefreshControl
          refreshing={false}
          onRefresh={onRefresh}
        />
      }
    >
      {groupedTransactions.map(renderGroup)}
    </ScrollView>
  );
}

// 格式化日期分組標題
function formatDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (transactionDate.getTime() === today.getTime()) {
    return '今天';
  } else if (transactionDate.getTime() === yesterday.getTime()) {
    return '昨天';
  } else if (transactionDate.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  } else {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
}

// 格式化時間
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  groupContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  groupHeaderLeft: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  groupCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  groupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupContent: {
    paddingHorizontal: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAccount: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  incomeAmount: {
    color: '#10B981',
  },
  expenseAmount: {
    color: '#EF4444',
  },
  transactionTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});