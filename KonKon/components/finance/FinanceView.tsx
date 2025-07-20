import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface FinanceViewProps {
  expenses: any[];
  monthlySummary: { expense: number; income: number };
}

// A simple color hashing function for categories
const categoryColors: { [key: string]: string } = {
  '餐饮': '#FFDDC1', '交通': '#D4F0F0', '购物': '#FEE2E2',
  '娱乐': '#E6E6FA', '居家': '#D1E7DD', '医疗': '#F8D7DA',
  '其他': '#E9ECEF',
};
const getCategoryColor = (category: string) => {
  return categoryColors[category] || '#E0E0E0';
};

const FinanceView: React.FC<FinanceViewProps> = ({ expenses, monthlySummary }) => {
  const balance = monthlySummary.income - monthlySummary.expense;

  const aggregatedExpenses: { [key: string]: number } = expenses.reduce((acc, expense) => {
    if (expense.type === 'expense') {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
    }
    return acc;
  }, {} as { [key: string]: number });

  const sortedCategories = Object.entries(aggregatedExpenses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  const totalAggregatedExpense = sortedCategories.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Monthly Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryDate}>{new Date().getFullYear()}年 {new Date().getMonth() + 1}月</Text>
        <Text style={styles.balanceAmount}>¥{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.balanceLabel}>結餘</Text>
        <View style={styles.incomeExpenseContainer}>
          <View style={styles.incomeExpenseBox}>
            <Text style={styles.incomeExpenseLabel}>收入</Text>
            <Text style={[styles.incomeExpenseAmount, styles.income]}>¥{monthlySummary.income.toLocaleString()}</Text>
          </View>
          <View style={styles.incomeExpenseBox}>
            <Text style={styles.incomeExpenseLabel}>支出</Text>
            <Text style={[styles.incomeExpenseAmount, styles.expense]}>¥{monthlySummary.expense.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Spending Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>支出分類</Text>
        <View style={styles.chartContainer}>
          {sortedCategories.map(([category, amount]) => (
            <View key={category} style={styles.barContainer}>
              <View style={styles.barLabelContainer}>
                <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
                <Text style={styles.barCategory}>{category}</Text>
              </View>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, { 
                  width: totalAggregatedExpense > 0 ? `${(amount / totalAggregatedExpense) * 100}%` : '0%',
                  backgroundColor: getCategoryColor(category) 
                  }]} 
                />
              </View>
              <Text style={styles.barAmount}>¥{amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>最近紀錄</Text>
        {expenses.slice(0, 5).map((item, index) => (
          <View key={item.id || index} style={styles.transactionItem}>
             <View style={[styles.transactionIconContainer, { backgroundColor: getCategoryColor(item.category) }]}>
              <Text style={styles.transactionIcon}>🛍️</Text>
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionCategory}>{item.category}</Text>
              <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.transactionAmount, item.type === 'income' ? styles.income : styles.expense]}>
              {item.type === 'income' ? '+' : '-'} ¥{item.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4A4A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#4A4A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryDate: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#212529',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 24,
  },
  incomeExpenseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  incomeExpenseBox: {
    alignItems: 'center',
    flex: 1,
  },
  incomeExpenseLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  incomeExpenseAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  income: {
    color: '#28a745',
  },
  expense: {
    color: '#dc3545',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 20,
  },
  chartContainer: {
    // Styles for the chart area
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  barLabelContainer: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  barCategory: {
    fontSize: 14,
    color: '#495057',
  },
  barWrapper: {
    flex: 1,
    height: 10,
    backgroundColor: '#f1f3f5',
    borderRadius: 5,
    marginHorizontal: 8,
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  barAmount: {
    fontSize: 14,
    color: '#495057',
    minWidth: 50,
    textAlign: 'right',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionIcon: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FinanceView; 