// Family Finance Service Layer
// Comprehensive TypeScript service for family financial management

import { supabase } from './supabase';

// ========================================
// TypeScript 型別定義
// ========================================

export interface FinanceAccount {
  id: string;
  family_id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit_card' | 'savings' | 'investment' | 'other';
  currency: string;
  balance: number;
  is_active: boolean;
  description?: string;
  bank_name?: string;
  account_number?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceCategory {
  id: string;
  family_id?: string;
  parent_id?: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  is_system: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  children?: FinanceCategory[];
}

export interface FinanceTransaction {
  id: string;
  family_id: string;
  account_id: string;
  category_id: string;
  member_id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description?: string;
  notes?: string;
  transaction_date: string;
  receipt_url?: string;
  tags?: string;
  is_recurring: boolean;
  recurring_pattern?: any;
  location?: string;
  reference_number?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface FinanceTransactionWithDetails extends FinanceTransaction {
  account: FinanceAccount;
  category: FinanceCategory;
  member: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface FinanceTransfer {
  id: string;
  from_transaction_id: string;
  to_transaction_id: string;
  from_account_id: string;
  to_account_id: string;
  transfer_fee: number;
  exchange_rate: number;
  created_at: string;
}

export interface FinanceBudget {
  id: string;
  family_id: string;
  category_id?: string;
  name: string;
  amount: number;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
  alert_threshold: number;
  is_active: boolean;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceBudgetWithDetails extends FinanceBudget {
  category?: FinanceCategory;
  spent_amount: number;
  remaining_amount: number;
  usage_percentage: number;
}

export interface FinanceSavingsGoal {
  id: string;
  family_id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  priority: number;
  category?: string;
  auto_transfer_amount?: number;
  auto_transfer_frequency?: string;
  source_account_id?: string;
  target_account_id?: string;
  is_active: boolean;
  achieved_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceSavingsGoalWithDetails extends FinanceSavingsGoal {
  progress_percentage: number;
  days_remaining?: number;
  monthly_required?: number;
  source_account?: FinanceAccount;
  target_account?: FinanceAccount;
}

export interface FinanceMemberShare {
  id: string;
  family_id: string;
  category_id: string;
  member_id: string;
  share_percentage: number;
  fixed_amount?: number;
  is_active: boolean;
  effective_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceReminder {
  id: string;
  family_id: string;
  member_id: string;
  type: 'bill_due' | 'budget_alert' | 'saving_goal' | 'recurring_transaction';
  title: string;
  description?: string;
  amount?: number;
  due_date?: string;
  is_completed: boolean;
  priority: number;
  related_id?: string;
  related_type?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceStats {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  totalAccounts: number;
  totalTransactions: number;
  averageTransaction: number;
  topCategory: {
    name: string;
    amount: number;
  };
  monthlyTrend: {
    month: string;
    income: number;
    expense: number;
  }[];
}

export interface MemberFinanceStats {
  memberId: string;
  memberName: string;
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  topCategories: {
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
  budgetUsage: {
    budgetName: string;
    used: number;
    total: number;
    percentage: number;
  }[];
}

// ========================================
// 帳戶管理服務
// ========================================
export class FinanceAccountService {
  static async getByFamily(familyId: string): Promise<FinanceAccount[]> {
    const { data, error } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  static async create(accountData: Omit<FinanceAccount, 'id' | 'created_at' | 'updated_at'>): Promise<FinanceAccount> {
    const { data, error } = await supabase
      .from('finance_accounts')
      .insert(accountData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(accountId: string, updates: Partial<FinanceAccount>): Promise<FinanceAccount> {
    const { data, error } = await supabase
      .from('finance_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_accounts')
      .update({ is_active: false })
      .eq('id', accountId);

    if (error) throw error;
  }

  static async getBalance(accountId: string): Promise<number> {
    const { data, error } = await supabase
      .from('finance_accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (error) throw error;
    return data.balance;
  }
}

// ========================================
// 分類管理服務
// ========================================
export class FinanceCategoryService {
  static async getByFamily(familyId: string): Promise<FinanceCategory[]> {
    const { data, error } = await supabase
      .from('finance_categories')
      .select('*')
      .or(`family_id.eq.${familyId},family_id.is.null`)
      .eq('is_active', true)
      .order('type, display_order');

    if (error) throw error;
    return data || [];
  }

  static async getByType(familyId: string, type: 'income' | 'expense'): Promise<FinanceCategory[]> {
    const { data, error } = await supabase
      .from('finance_categories')
      .select('*')
      .or(`family_id.eq.${familyId},family_id.is.null`)
      .eq('type', type)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  static async create(categoryData: Omit<FinanceCategory, 'id' | 'created_at' | 'updated_at'>): Promise<FinanceCategory> {
    const { data, error } = await supabase
      .from('finance_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(categoryId: string, updates: Partial<FinanceCategory>): Promise<FinanceCategory> {
    const { data, error } = await supabase
      .from('finance_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_categories')
      .update({ is_active: false })
      .eq('id', categoryId);

    if (error) throw error;
  }

  static async getHierarchical(familyId: string): Promise<FinanceCategory[]> {
    const categories = await this.getByFamily(familyId);
    const categoryMap = new Map(categories.map(cat => [cat.id, { ...cat, children: [] }]));
    const rootCategories: FinanceCategory[] = [];

    categories.forEach(category => {
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        categoryMap.get(category.parent_id)!.children!.push(categoryMap.get(category.id)!);
      } else {
        rootCategories.push(categoryMap.get(category.id)!);
      }
    });

    return rootCategories;
  }
}

// ========================================
// 交易管理服務 (核心記帳功能)
// ========================================
export class FinanceTransactionService {
  static async getByFamily(familyId: string, startDate?: string, endDate?: string): Promise<FinanceTransactionWithDetails[]> {
    let query = supabase
      .from('finance_transactions')
      .select(`
        *,
        account:finance_accounts(id, name, type, currency),
        category:finance_categories(id, name, type, color, icon),
        member:family_members(id, name, avatar_url)
      `)
      .eq('family_id', familyId)
      .order('transaction_date', { ascending: false });

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async create(transactionData: Omit<FinanceTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<FinanceTransaction> {
    const { data, error } = await supabase
      .from('finance_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(transactionId: string, updates: Partial<FinanceTransaction>): Promise<FinanceTransaction> {
    const { data, error } = await supabase
      .from('finance_transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(transactionId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;
  }

  static async createTransfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string,
    memberId: string,
    transferFee: number = 0,
    exchangeRate: number = 1.0
  ): Promise<FinanceTransfer> {
    // 創建轉出交易
    const fromTransaction = await this.create({
      family_id: '', // 需要從上下文獲取
      account_id: fromAccountId,
      category_id: '', // 需要系統轉帳分類
      member_id: memberId,
      amount: amount + transferFee,
      type: 'expense',
      description: `轉帳至其他帳戶: ${description}`,
      transaction_date: new Date().toISOString().split('T')[0],
      status: 'completed'
    });

    // 創建轉入交易
    const toTransaction = await this.create({
      family_id: '', // 需要從上下文獲取
      account_id: toAccountId,
      category_id: '', // 需要系統轉帳分類
      member_id: memberId,
      amount: amount * exchangeRate,
      type: 'income',
      description: `接收轉帳: ${description}`,
      transaction_date: new Date().toISOString().split('T')[0],
      status: 'completed'
    });

    // 創建轉帳記錄
    const { data, error } = await supabase
      .from('finance_transfers')
      .insert({
        from_transaction_id: fromTransaction.id,
        to_transaction_id: toTransaction.id,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        transfer_fee: transferFee,
        exchange_rate: exchangeRate
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ========================================
// 預算管理服務
// ========================================
export class FinanceBudgetService {
  static async getByFamily(familyId: string): Promise<FinanceBudgetWithDetails[]> {
    const { data, error } = await supabase
      .from('finance_budgets')
      .select(`
        *,
        category:finance_categories(id, name, type, color, icon)
      `)
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 計算每個預算的使用情況
    const budgetsWithDetails = await Promise.all(
      (data || []).map(async budget => {
        const spentAmount = await this.getSpentAmount(budget.id);
        const remainingAmount = budget.amount - spentAmount;
        const usagePercentage = (spentAmount / budget.amount) * 100;

        return {
          ...budget,
          spent_amount: spentAmount,
          remaining_amount: remainingAmount,
          usage_percentage: usagePercentage
        };
      })
    );

    return budgetsWithDetails;
  }

  static async create(budgetData: Omit<FinanceBudget, 'id' | 'created_at' | 'updated_at'>): Promise<FinanceBudget> {
    const { data, error } = await supabase
      .from('finance_budgets')
      .insert(budgetData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(budgetId: string, updates: Partial<FinanceBudget>): Promise<FinanceBudget> {
    const { data, error } = await supabase
      .from('finance_budgets')
      .update(updates)
      .eq('id', budgetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(budgetId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_budgets')
      .update({ is_active: false })
      .eq('id', budgetId);

    if (error) throw error;
  }

  private static async getSpentAmount(budgetId: string): Promise<number> {
    // 這裡需要計算預算期間內的實際支出
    // 實現邏輯根據預算的時間範圍和分類來查詢交易
    const { data, error } = await supabase
      .from('finance_budgets')
      .select('*')
      .eq('id', budgetId)
      .single();

    if (error) return 0;

    // 計算預算期間的支出（簡化版本）
    const { data: transactions } = await supabase
      .from('finance_transactions')
      .select('amount')
      .eq('category_id', data.category_id)
      .eq('type', 'expense')
      .gte('transaction_date', data.start_date)
      .lte('transaction_date', data.end_date || new Date().toISOString());

    return transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  }
}

// ========================================
// 儲蓄目標服務
// ========================================
export class FinanceSavingsGoalService {
  static async getByFamily(familyId: string): Promise<FinanceSavingsGoalWithDetails[]> {
    const { data, error } = await supabase
      .from('finance_savings_goals')
      .select(`
        *,
        source_account:finance_accounts!source_account_id(id, name, type),
        target_account:finance_accounts!target_account_id(id, name, type)
      `)
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;

    // 計算每個目標的進度詳情
    const goalsWithDetails = (data || []).map(goal => {
      const progressPercentage = (goal.current_amount / goal.target_amount) * 100;
      const daysRemaining = goal.target_date 
        ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : undefined;
      const monthlyRequired = goal.target_date && daysRemaining && daysRemaining > 0
        ? (goal.target_amount - goal.current_amount) / (daysRemaining / 30)
        : undefined;

      return {
        ...goal,
        progress_percentage: Math.min(progressPercentage, 100),
        days_remaining: daysRemaining,
        monthly_required: monthlyRequired
      };
    });

    return goalsWithDetails;
  }

  static async create(goalData: Omit<FinanceSavingsGoal, 'id' | 'created_at' | 'updated_at'>): Promise<FinanceSavingsGoal> {
    const { data, error } = await supabase
      .from('finance_savings_goals')
      .insert(goalData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(goalId: string, updates: Partial<FinanceSavingsGoal>): Promise<FinanceSavingsGoal> {
    const { data, error } = await supabase
      .from('finance_savings_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async addProgress(goalId: string, amount: number): Promise<FinanceSavingsGoal> {
    const { data: goal } = await supabase
      .from('finance_savings_goals')
      .select('current_amount, target_amount')
      .eq('id', goalId)
      .single();

    if (!goal) throw new Error('目標不存在');

    const newAmount = goal.current_amount + amount;
    const updates: Partial<FinanceSavingsGoal> = {
      current_amount: newAmount
    };

    // 如果達成目標，設置達成日期
    if (newAmount >= goal.target_amount && !goal.achieved_date) {
      updates.achieved_date = new Date().toISOString().split('T')[0];
    }

    return this.update(goalId, updates);
  }

  static async delete(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_savings_goals')
      .update({ is_active: false })
      .eq('id', goalId);

    if (error) throw error;
  }
}

// ========================================
// 統計分析服務
// ========================================
export class FinanceStatsService {
  static async getFamilyStats(familyId: string, startDate?: string, endDate?: string): Promise<FinanceStats> {
    // 設置默認時間範圍為當月
    const now = new Date();
    const defaultStart = startDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultEnd = endDate || now.toISOString().split('T')[0];

    // 獲取收入統計
    const { data: incomeData } = await supabase
      .from('finance_transactions')
      .select('amount')
      .eq('family_id', familyId)
      .eq('type', 'income')
      .eq('status', 'completed')
      .gte('transaction_date', defaultStart)
      .lte('transaction_date', defaultEnd);

    // 獲取支出統計
    const { data: expenseData } = await supabase
      .from('finance_transactions')
      .select('amount')
      .eq('family_id', familyId)
      .eq('type', 'expense')
      .eq('status', 'completed')
      .gte('transaction_date', defaultStart)
      .lte('transaction_date', defaultEnd);

    // 獲取帳戶統計
    const { data: accountsData } = await supabase
      .from('finance_accounts')
      .select('id')
      .eq('family_id', familyId)
      .eq('is_active', true);

    // 獲取交易統計
    const { data: transactionsData } = await supabase
      .from('finance_transactions')
      .select('amount, category:finance_categories(name)')
      .eq('family_id', familyId)
      .eq('status', 'completed')
      .gte('transaction_date', defaultStart)
      .lte('transaction_date', defaultEnd);

    const totalIncome = incomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpense = expenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalTransactions = transactionsData?.length || 0;

    // 計算最大支出分類
    const categoryTotals = new Map<string, number>();
    transactionsData?.forEach(t => {
      if (t.category?.name) {
        categoryTotals.set(
          t.category.name,
          (categoryTotals.get(t.category.name) || 0) + t.amount
        );
      }
    });

    const topCategoryEntry = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      totalAccounts: accountsData?.length || 0,
      totalTransactions,
      averageTransaction: totalTransactions > 0 ? (totalIncome + totalExpense) / totalTransactions : 0,
      topCategory: topCategoryEntry 
        ? { name: topCategoryEntry[0], amount: topCategoryEntry[1] }
        : { name: '無', amount: 0 },
      monthlyTrend: [] // 這裡可以實現月度趨勢分析
    };
  }

  static async getMemberStats(memberId: string, familyId: string): Promise<MemberFinanceStats> {
    const { data: memberData } = await supabase
      .from('family_members')
      .select('name')
      .eq('id', memberId)
      .single();

    const { data: transactionsData } = await supabase
      .from('finance_transactions')
      .select(`
        amount, type,
        category:finance_categories(name)
      `)
      .eq('member_id', memberId)
      .eq('family_id', familyId)
      .eq('status', 'completed');

    const incomeTransactions = transactionsData?.filter(t => t.type === 'income') || [];
    const expenseTransactions = transactionsData?.filter(t => t.type === 'expense') || [];

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    // 計算分類統計
    const categoryTotals = new Map<string, number>();
    expenseTransactions.forEach(t => {
      if (t.category?.name) {
        categoryTotals.set(
          t.category.name,
          (categoryTotals.get(t.category.name) || 0) + t.amount
        );
      }
    });

    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([categoryName, amount]) => ({
        categoryName,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
      }));

    return {
      memberId,
      memberName: memberData?.name || '未知成員',
      totalIncome,
      totalExpense,
      transactionCount: transactionsData?.length || 0,
      topCategories,
      budgetUsage: [] // 這裡可以實現預算使用分析
    };
  }
}

// ========================================
// 提醒服務
// ========================================
export class FinanceReminderService {
  static async getByFamily(familyId: string): Promise<FinanceReminder[]> {
    const { data, error } = await supabase
      .from('finance_reminders')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_completed', false)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async create(reminderData: Omit<FinanceReminder, 'id' | 'created_at' | 'updated_at'>): Promise<FinanceReminder> {
    const { data, error } = await supabase
      .from('finance_reminders')
      .insert(reminderData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markCompleted(reminderId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_reminders')
      .update({ is_completed: true })
      .eq('id', reminderId);

    if (error) throw error;
  }

  static async delete(reminderId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_reminders')
      .delete()
      .eq('id', reminderId);

    if (error) throw error;
  }
}