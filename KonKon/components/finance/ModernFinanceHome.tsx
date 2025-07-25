import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  icon: string;
  account: string;
}

interface FinanceStats {
  monthlyBalance: number;
  income: number;
  expense: number;
  transactionCount: number;
}

export default function ModernFinanceHome() {
  const router = useRouter();

  // 空的初始數據
  const [stats] = useState<FinanceStats>({
    monthlyBalance: 0,
    income: 0,
    expense: 0,
    transactionCount: 0,
  });

  const [recentTransactions] = useState<Transaction[]>([]);

  const formatAmount = (amount: number, type: 'income' | 'expense' = 'expense') => {
    const prefix = type === 'income' ? '+' : '-';
    return `${prefix}¥${amount.toLocaleString()}`;
  };

  const getAmountColor = (type: 'income' | 'expense') => {
    return type === 'income' ? '#34C759' : '#FF3B30';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 演示模式提醒 */}
        <View style={styles.demoNotice}>
          <Text style={styles.demoIcon}>ℹ️</Text>
          <Text style={styles.demoText}>
            這是演示模式，創建家庭後可保存真實記帳數據
          </Text>
        </View>

        {/* 主要餘額展示 */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>本月結餘</Text>
          <Text style={styles.balanceAmount}>
            ¥{stats.monthlyBalance.toLocaleString()}
          </Text>
          
          {/* 收支對比 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>收入</Text>
              <Text style={[styles.statValue, { color: '#34C759' }]}>
                ¥{stats.income.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>支出</Text>
              <Text style={[styles.statValue, { color: '#FF3B30' }]}>
                ¥{stats.expense.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>交易</Text>
              <Text style={styles.statValue}>
                {stats.transactionCount} 筆
              </Text>
            </View>
          </View>
        </View>

        {/* 最近交易 */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>最近記錄</Text>
            <TouchableOpacity onPress={() => router.push('/finance-management')}>
              <Text style={styles.viewAllButton}>查看全部</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <TouchableOpacity 
                key={transaction.id} 
                style={[
                  styles.transactionItem,
                  index === recentTransactions.length - 1 && styles.lastTransactionItem
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionEmoji}>{transaction.icon}</Text>
                </View>
                <View style={styles.transactionContent}>
                  <Text style={styles.transactionTitle}>{transaction.title}</Text>
                  <Text style={styles.transactionMeta}>
                    {transaction.date} · {transaction.account}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: getAmountColor(transaction.type) }
                ]}>
                  {formatAmount(transaction.amount, transaction.type)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💰</Text>
              <Text style={styles.emptyStateTitle}>還沒有記錄</Text>
              <Text style={styles.emptyStateSubtitle}>
                開始記錄您的收支，建立財務習慣
              </Text>
            </View>
          )}
        </View>

        {/* 快速新增按鈕 */}
        <View style={styles.quickAddContainer}>
          <TouchableOpacity 
            style={styles.quickAddButton}
            onPress={() => router.push('/finance-management')}
            activeOpacity={0.8}
          >
            <Text style={styles.quickAddIcon}>💰</Text>
            <Text style={styles.quickAddText}>記一筆</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    gap: 8,
  },
  demoIcon: {
    fontSize: 24,
  },
  demoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  viewAllButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  lastTransactionItem: {
    borderBottomWidth: 0,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionEmoji: {
    fontSize: 22,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  transactionMeta: {
    fontSize: 13,
    color: '#8E8E93',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickAddContainer: {
    padding: 20,
    alignItems: 'center',
  },
  quickAddButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickAddIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});