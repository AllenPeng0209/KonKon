import TransactionForm from '@/components/finance/TransactionForm';
import FinanceView from '@/components/FinanceView';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import {
    FinanceAccountService,
    FinanceCategory,
    FinanceCategoryService,
    FinanceTransactionService
} from '@/lib/financeService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  topCategory?: { name: string; amount: number };
}

// 模擬數據 - 讓用戶立即看到效果
const mockTransactions = [
  {
    id: 'mock-1',
    family_id: 'mock-family',
    account_id: 'mock-account-1',
    category_id: 'mock-cat-1',
    member_id: 'mock-member-1',
    amount: 5800,
    type: 'income' as const,
    description: '薪水',
    transaction_date: new Date().toISOString().split('T')[0],
    status: 'completed' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account: { name: '主要帳戶', type: 'bank' as const },
    category: { name: '薪資', type: 'income' as const, color: '#34C759' },
    member: { name: '我', avatar_url: null }
  },
  {
    id: 'mock-2',
    family_id: 'mock-family',
    account_id: 'mock-account-1',
    category_id: 'mock-cat-2',
    member_id: 'mock-member-1',
    amount: 1200,
    type: 'expense' as const,
    description: '午餐',
    transaction_date: new Date().toISOString().split('T')[0],
    status: 'completed' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account: { name: '現金', type: 'cash' as const },
    category: { name: '餐飲', type: 'expense' as const, color: '#FF3B30' },
    member: { name: '我', avatar_url: null }
  },
  {
    id: 'mock-3',
    family_id: 'mock-family',
    account_id: 'mock-account-2',
    category_id: 'mock-cat-3',
    member_id: 'mock-member-1',
    amount: 800,
    type: 'expense' as const,
    description: '地鐵車票',
    transaction_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 昨天
    status: 'completed' as const,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    account: { name: 'IC卡', type: 'other' as const },
    category: { name: '交通', type: 'expense' as const, color: '#FF9500' },
    member: { name: '我', avatar_url: null }
  }
];

const mockAccounts = [
  {
    id: 'mock-account-1',
    name: '主要銀行帳戶',
    type: 'bank' as const,
    balance: 125000,
    currency: 'JPY'
  },
  {
    id: 'mock-account-2',
    name: '現金',
    type: 'cash' as const,
    balance: 8500,
    currency: 'JPY'
  },
  {
    id: 'mock-account-3',
    name: '信用卡',
    type: 'credit_card' as const,
    balance: -15600,
    currency: 'JPY'
  }
];

export default function FinanceManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeFamily, familyMembers } = useFamily();
  
  // 數據狀態 - 使用模擬數據提供即時體驗
  const [transactions, setTransactions] = useState<any[]>(mockTransactions);
  const [accounts, setAccounts] = useState<any[]>(mockAccounts);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalIncome: 5800,
    totalExpense: 2000,
    balance: 3800,
    transactionCount: 3,
    topCategory: { name: '餐飲', amount: 1200 }
  });
  
  // UI 狀態
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeView, setActiveView] = useState<'overview' | 'transactions' | 'accounts' | 'budgets'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // 模態框狀態
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);


  useEffect(() => {
    // 只有當有真實家庭時才載入真實數據
    if (activeFamily) {
      loadInitialData();
    }
  }, [activeFamily]);

  useEffect(() => {
    if (activeFamily) {
      loadTransactions();
      calculateMonthlyStats();
    }
  }, [activeFamily, currentMonth]);

  const loadInitialData = async () => {
    if (!activeFamily) return;
    
    try {
      setIsLoading(true);
      await Promise.all([
        loadTransactions(),
        loadAccounts(),
        loadCategories(),
      ]);
      await calculateMonthlyStats();
    } catch (error) {
      console.error('載入初始數據錯誤:', error);
      // 發生錯誤時保持使用模擬數據
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!activeFamily) return;
    
    try {
      // 獲取當月交易記錄
      const startDate = `${currentMonth}-01`;
      const endDate = new Date(new Date(currentMonth).getFullYear(), new Date(currentMonth).getMonth() + 1, 0).toISOString().split('T')[0];
      
      const transactionData = await FinanceTransactionService.getByFamily(activeFamily.id, startDate, endDate);
      if (transactionData.length > 0) {
        setTransactions(transactionData);
      }
      // 如果沒有真實數據，繼續使用模擬數據
    } catch (error) {
      console.error('載入交易記錄錯誤:', error);
      // 保持使用模擬數據
    }
  };

  const loadAccounts = async () => {
    if (!activeFamily) return;
    
    try {
      const accountData = await FinanceAccountService.getByFamily(activeFamily.id);
      if (accountData.length > 0) {
        setAccounts(accountData);
      }
    } catch (error) {
      console.error('載入帳戶錯誤:', error);
    }
  };

  const loadCategories = async () => {
    if (!activeFamily) return;
    
    try {
      const categoryData = await FinanceCategoryService.getByFamily(activeFamily.id);
      setCategories(categoryData);
    } catch (error) {
      console.error('載入分類錯誤:', error);
    }
  };

  const calculateMonthlyStats = async () => {
    if (!activeFamily) return;

    try {
      const startDate = `${currentMonth}-01`;
      const endDate = new Date(new Date(currentMonth).getFullYear(), new Date(currentMonth).getMonth() + 1, 0).toISOString().split('T')[0];
      
      const monthlyTransactions = await FinanceTransactionService.getByFamily(activeFamily.id, startDate, endDate);
      
      if (monthlyTransactions.length > 0) {
        const totalIncome = monthlyTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = monthlyTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        // 計算最大支出分類
        const categoryTotals = new Map<string, number>();
        monthlyTransactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            if (t.category?.name) {
              categoryTotals.set(t.category.name, (categoryTotals.get(t.category.name) || 0) + t.amount);
            }
          });

        const topCategoryEntry = Array.from(categoryTotals.entries())
          .sort((a, b) => b[1] - a[1])[0];

        setMonthlyStats({
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          transactionCount: monthlyTransactions.length,
          topCategory: topCategoryEntry ? { name: topCategoryEntry[0], amount: topCategoryEntry[1] } : undefined
        });
      }
    } catch (error) {
      console.error('計算月度統計錯誤:', error);
      // 保持使用模擬數據的統計
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowAddTransactionModal(true);
  };

  const handleTransactionAdded = async () => {
    setShowAddTransactionModal(false);
    await loadTransactions();
    await calculateMonthlyStats();
  };

  const handleTransactionPress = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowAddTransactionModal(true);
  };

  const handleMonthChange = (newMonth: string) => {
    setCurrentMonth(newMonth);
  };

  const handleVoiceRecording = () => {
    // 簡化的語音記帳功能
    Alert.alert(
      '語音記帳',
      '語音記帳功能正在開發中...\n\n未來將支持：\n• 語音輸入交易內容\n• 智能識別金額和分類\n• 快速創建記帳記錄',
      [
        { text: '我知道了', style: 'default' }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>家庭財務</Text>
        <Text style={styles.headerSubtitle}>
          {activeFamily?.name || '演示模式'}
        </Text>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleVoiceRecording}
        >
          <Ionicons name="mic" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleAddTransaction}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'overview', label: '總覽', icon: 'analytics-outline' },
        { key: 'transactions', label: '交易', icon: 'list-outline' },
        { key: 'accounts', label: '帳戶', icon: 'wallet-outline' },
        { key: 'budgets', label: '預算', icon: 'pie-chart-outline' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabItem, activeView === tab.key && styles.tabItemActive]}
          onPress={() => setActiveView(tab.key as any)}
        >
          <Ionicons 
            name={tab.icon as any} 
            size={20} 
            color={activeView === tab.key ? '#007AFF' : '#8E8E93'} 
          />
          <Text style={[
            styles.tabLabel, 
            activeView === tab.key && styles.tabLabelActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMonthSelector = () => (
    <View style={styles.monthSelector}>
      <TouchableOpacity
        style={styles.monthButton}
        onPress={() => {
          const prevMonth = new Date(currentMonth + '-01');
          prevMonth.setMonth(prevMonth.getMonth() - 1);
          setCurrentMonth(prevMonth.toISOString().slice(0, 7));
        }}
      >
        <Ionicons name="chevron-back" size={20} color="#007AFF" />
      </TouchableOpacity>
      
      <Text style={styles.monthText}>
        {new Date(currentMonth + '-01').toLocaleDateString('zh-TW', { 
          year: 'numeric', 
          month: 'long' 
        })}
      </Text>
      
      <TouchableOpacity
        style={styles.monthButton}
        onPress={() => {
          const nextMonth = new Date(currentMonth + '-01');
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          setCurrentMonth(nextMonth.toISOString().slice(0, 7));
        }}
      >
        <Ionicons name="chevron-forward" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderOverviewStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>本月收入</Text>
        <Text style={[styles.statValue, styles.incomeText]}>
          ¥{monthlyStats.totalIncome.toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>本月支出</Text>
        <Text style={[styles.statValue, styles.expenseText]}>
          ¥{monthlyStats.totalExpense.toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>結餘</Text>
        <Text style={[
          styles.statValue, 
          monthlyStats.balance >= 0 ? styles.incomeText : styles.expenseText
        ]}>
          ¥{monthlyStats.balance.toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>交易筆數</Text>
        <Text style={styles.statValue}>
          {monthlyStats.transactionCount}
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      );
    }

    switch (activeView) {
      case 'overview':
        return (
          <ScrollView 
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          >
            {!activeFamily && (
              <View style={styles.demoNotice}>
                <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
                <Text style={styles.demoText}>
                  這是演示模式，創建家庭後可保存真實記帳數據
                </Text>
              </View>
            )}
            {renderOverviewStats()}
            <FinanceView 
              expenses={transactions.map(t => ({
                id: t.id,
                amount: t.amount,
                category: t.category?.name || '其他',
                date: t.transaction_date,
                type: t.type,
                description: t.description
              }))}
              monthlySummary={{
                income: monthlyStats.totalIncome,
                expense: monthlyStats.totalExpense
              }}
            />
          </ScrollView>
        );

      case 'transactions':
        return (
          <ScrollView 
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          >
            <View style={styles.transactionsList}>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TouchableOpacity
                    key={transaction.id}
                    style={styles.transactionItem}
                    onPress={() => handleTransactionPress(transaction)}
                  >
                    <View style={styles.transactionIcon}>
                      <Text style={styles.transactionEmoji}>
                        {transaction.type === 'income' ? '💰' : '💸'}
                      </Text>
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionTitle}>
                        {transaction.description || transaction.category?.name || '未分類'}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.transaction_date).toLocaleDateString('zh-TW')}
                      </Text>
                      <Text style={styles.transactionAccount}>
                        {transaction.account?.name}
                      </Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={[
                        styles.transactionAmountText,
                        transaction.type === 'income' ? styles.incomeText : styles.expenseText
                      ]}>
                        {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>本月還沒有交易記錄</Text>
                  <TouchableOpacity style={styles.addFirstTransactionButton} onPress={handleAddTransaction}>
                    <Text style={styles.addFirstTransactionText}>新增第一筆記錄</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        );

      case 'accounts':
        return (
          <ScrollView 
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          >
            <View style={styles.accountsList}>
              {accounts.map((account) => (
                <View key={account.id} style={styles.accountItem}>
                  <View style={styles.accountIcon}>
                    <Text style={styles.accountEmoji}>
                      {account.type === 'bank' ? '🏦' : 
                       account.type === 'cash' ? '💵' :
                       account.type === 'credit_card' ? '💳' : '🏛️'}
                    </Text>
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountType}>{account.type}</Text>
                  </View>
                  <View style={styles.accountBalance}>
                    <Text style={[
                      styles.accountBalanceText,
                      account.balance >= 0 ? styles.incomeText : styles.expenseText
                    ]}>
                      ¥{Math.abs(account.balance).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        );

      case 'budgets':
        return (
          <View style={styles.content}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>預算管理功能開發中...</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabBar()}
      {renderMonthSelector()}
      {renderContent()}

      {/* 浮動新增按鈕 */}
      <View style={styles.floatingButtons}>
        {/* 語音記帳按鈕 */}
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleVoiceRecording}
        >
          <Ionicons name="mic" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* 新增交易按鈕 */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddTransaction}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 記帳表單模態框 */}
      <TransactionForm
        visible={showAddTransactionModal}
        onClose={() => setShowAddTransactionModal(false)}
        onSuccess={handleTransactionAdded}
        editTransaction={editingTransaction}
      />


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    width: 60,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 120,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
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
  demoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    marginHorizontal: 20,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  incomeText: {
    color: '#34C759',
  },
  expenseText: {
    color: '#FF3B30',
  },
  transactionsList: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  transactionAccount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountsList: {
    padding: 16,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountEmoji: {
    fontSize: 20,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  accountBalance: {
    alignItems: 'flex-end',
  },
  accountBalanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  addFirstTransactionButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addFirstTransactionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
    gap: 12,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
}); 