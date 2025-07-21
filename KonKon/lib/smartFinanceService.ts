import { FinanceCategoryService, FinanceTransactionService } from './financeService';
import { Tables } from './database.types';

type FinanceTransaction = Tables<'finance_transactions'>;
type FinanceCategory = Tables<'finance_categories'>;

export interface SmartCategorySuggestion {
  category: FinanceCategory;
  confidence: number;
  reason: string;
}

export interface SpendingInsight {
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  action?: string;
  data?: any;
}

export interface BudgetPrediction {
  categoryId: string;
  categoryName: string;
  currentSpent: number;
  predictedTotal: number;
  budgetAmount: number;
  daysRemaining: number;
  isOverBudget: boolean;
  severity: 'low' | 'medium' | 'high';
}

export class SmartFinanceService {
  private static instance: SmartFinanceService;
  
  static getInstance(): SmartFinanceService {
    if (!SmartFinanceService.instance) {
      SmartFinanceService.instance = new SmartFinanceService();
    }
    return SmartFinanceService.instance;
  }

  /**
   * 智能分類建議
   * 基於歷史交易記錄，為新交易提供分類建議
   */
  async getSuggestedCategories(
    familyId: string,
    description: string,
    amount: number,
    type: 'income' | 'expense'
  ): Promise<SmartCategorySuggestion[]> {
    try {
      // 1. 獲取歷史交易
      const recentTransactions = await FinanceTransactionService.getRecentTransactions(familyId, 100);
      const categories = await FinanceCategoryService.getCategoriesByFamily(familyId);
      
      // 2. 基於描述的關鍵詞匹配
      const keywordMatches = this.findCategoryByKeywords(description, categories, type);
      
      // 3. 基於金額範圍的歷史分析
      const amountMatches = this.findCategoryByAmount(amount, recentTransactions, categories);
      
      // 4. 基於描述相似度的分析
      const descriptionMatches = this.findCategoryByDescription(description, recentTransactions, categories);
      
      // 5. 合併和評分
      const suggestions = this.combineAndScoreSuggestions(
        keywordMatches,
        amountMatches,
        descriptionMatches
      );
      
      return suggestions.slice(0, 3); // 返回前3個建議
    } catch (error) {
      console.error('獲取智能分類建議失敗:', error);
      return [];
    }
  }

  /**
   * 關鍵詞匹配分類
   */
  private findCategoryByKeywords(
    description: string,
    categories: FinanceCategory[],
    type: 'income' | 'expense'
  ): SmartCategorySuggestion[] {
    const keywordMap: { [key: string]: string[] } = {
      '餐飲': ['餐廳', '食物', '早餐', '午餐', '晚餐', '咖啡', '飲料', '外送', '麥當勞', '星巴克'],
      '交通': ['捷運', '公車', '計程車', 'Uber', '油費', '停車', '高鐵', '火車', '機票'],
      '購物': ['網購', '服飾', '衣服', '鞋子', '包包', '化妝品', '電器', '3C', 'momo', 'pchome'],
      '娛樂': ['電影', '遊戲', '唱歌', 'KTV', '運動', '健身房', 'Netflix', '音樂'],
      '醫療': ['醫院', '診所', '藥局', '看醫生', '健康檢查', '牙醫', '眼科'],
      '教育': ['補習', '課程', '書籍', '學費', '培訓', '證照'],
      '居住': ['房租', '水費', '電費', '瓦斯', '網路', '家具', '裝修'],
      '薪資': ['薪水', '獎金', '加班費', '紅利', '年終'],
      '投資': ['股票', '基金', '保險', '定存', '投資', '理財'],
    };

    const suggestions: SmartCategorySuggestion[] = [];
    const lowerDescription = description.toLowerCase();

    for (const [categoryName, keywords] of Object.entries(keywordMap)) {
      const category = categories.find(c => 
        c.name === categoryName && (c.type === type || c.type === 'both')
      );
      
      if (category) {
        const matchedKeywords = keywords.filter(keyword => 
          lowerDescription.includes(keyword.toLowerCase())
        );
        
        if (matchedKeywords.length > 0) {
          suggestions.push({
            category,
            confidence: Math.min(0.9, matchedKeywords.length * 0.3),
            reason: `描述包含關鍵詞: ${matchedKeywords.join(', ')}`
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * 基於金額範圍分析
   */
  private findCategoryByAmount(
    amount: number,
    transactions: FinanceTransaction[],
    categories: FinanceCategory[]
  ): SmartCategorySuggestion[] {
    const categoryAmountStats: { [categoryId: string]: number[] } = {};
    
    // 統計各分類的金額分佈
    transactions.forEach(transaction => {
      if (!categoryAmountStats[transaction.category_id]) {
        categoryAmountStats[transaction.category_id] = [];
      }
      categoryAmountStats[transaction.category_id].push(transaction.amount);
    });

    const suggestions: SmartCategorySuggestion[] = [];

    for (const [categoryId, amounts] of Object.entries(categoryAmountStats)) {
      if (amounts.length < 3) continue; // 需要足夠的樣本

      const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      // 檢查當前金額是否在合理範圍內
      const isInRange = Math.abs(amount - avg) <= stdDev * 2;
      
      if (isInRange) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          const confidence = Math.max(0.1, 1 - (Math.abs(amount - avg) / (stdDev * 2)));
          suggestions.push({
            category,
            confidence,
            reason: `金額符合此分類的歷史範圍 (平均: $${avg.toFixed(0)})`
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * 基於描述相似度分析
   */
  private findCategoryByDescription(
    description: string,
    transactions: FinanceTransaction[],
    categories: FinanceCategory[]
  ): SmartCategorySuggestion[] {
    const suggestions: SmartCategorySuggestion[] = [];
    const targetWords = description.toLowerCase().split(/\s+/);

    const categoryDescriptions: { [categoryId: string]: string[] } = {};
    
    transactions.forEach(transaction => {
      if (transaction.description) {
        if (!categoryDescriptions[transaction.category_id]) {
          categoryDescriptions[transaction.category_id] = [];
        }
        categoryDescriptions[transaction.category_id].push(transaction.description.toLowerCase());
      }
    });

    for (const [categoryId, descriptions] of Object.entries(categoryDescriptions)) {
      let totalSimilarity = 0;
      let count = 0;

      descriptions.forEach(desc => {
        const descWords = desc.split(/\s+/);
        const commonWords = targetWords.filter(word => 
          descWords.some(dw => dw.includes(word) || word.includes(dw))
        );
        
        if (commonWords.length > 0) {
          totalSimilarity += commonWords.length / Math.max(targetWords.length, descWords.length);
          count++;
        }
      });

      if (count > 0) {
        const avgSimilarity = totalSimilarity / count;
        if (avgSimilarity > 0.2) {
          const category = categories.find(c => c.id === categoryId);
          if (category) {
            suggestions.push({
              category,
              confidence: Math.min(0.8, avgSimilarity),
              reason: `描述與歷史記錄相似度 ${(avgSimilarity * 100).toFixed(1)}%`
            });
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * 合併和評分建議
   */
  private combineAndScoreSuggestions(
    ...suggestionArrays: SmartCategorySuggestion[][]
  ): SmartCategorySuggestion[] {
    const combined: { [categoryId: string]: SmartCategorySuggestion } = {};

    suggestionArrays.forEach(suggestions => {
      suggestions.forEach(suggestion => {
        const categoryId = suggestion.category.id;
        
        if (combined[categoryId]) {
          // 合併信心度 (加權平均)
          combined[categoryId].confidence = 
            (combined[categoryId].confidence + suggestion.confidence) / 2;
          combined[categoryId].reason += ` | ${suggestion.reason}`;
        } else {
          combined[categoryId] = { ...suggestion };
        }
      });
    });

    return Object.values(combined).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 生成支出洞察
   */
  async generateSpendingInsights(
    familyId: string,
    month: Date = new Date()
  ): Promise<SpendingInsight[]> {
    try {
      const insights: SpendingInsight[] = [];
      
      // 獲取本月和上月數據
      const thisMonth = await this.getMonthlyData(familyId, month);
      const lastMonth = await this.getMonthlyData(familyId, new Date(month.getFullYear(), month.getMonth() - 1));
      
      // 1. 支出變化分析
      if (lastMonth.totalExpense > 0) {
        const changePercentage = ((thisMonth.totalExpense - lastMonth.totalExpense) / lastMonth.totalExpense) * 100;
        
        if (changePercentage > 20) {
          insights.push({
            type: 'warning',
            title: '支出大幅增加',
            description: `本月支出比上月增加了 ${changePercentage.toFixed(1)}%，建議檢視支出項目`,
            action: '查看詳細支出',
            data: { changePercentage, thisMonth: thisMonth.totalExpense, lastMonth: lastMonth.totalExpense }
          });
        } else if (changePercentage < -10) {
          insights.push({
            type: 'success',
            title: '支出控制良好',
            description: `本月支出比上月減少了 ${Math.abs(changePercentage).toFixed(1)}%，繼續保持！`,
            data: { changePercentage }
          });
        }
      }

      // 2. 儲蓄率分析
      const savingsRate = thisMonth.totalIncome > 0 
        ? ((thisMonth.totalIncome - thisMonth.totalExpense) / thisMonth.totalIncome) * 100 
        : 0;

      if (savingsRate > 30) {
        insights.push({
          type: 'success',
          title: '儲蓄表現優異',
          description: `本月儲蓄率達到 ${savingsRate.toFixed(1)}%，理財規劃很成功！`,
          data: { savingsRate }
        });
      } else if (savingsRate < 0) {
        insights.push({
          type: 'warning',
          title: '支出超過收入',
          description: '建議檢視並調整支出結構，或尋找增加收入的方法',
          action: '制定預算計劃',
          data: { savingsRate }
        });
      } else if (savingsRate < 10) {
        insights.push({
          type: 'info',
          title: '可以提高儲蓄率',
          description: `目前儲蓄率為 ${savingsRate.toFixed(1)}%，建議目標設定在 20% 以上`,
          action: '查看省錢建議',
          data: { savingsRate }
        });
      }

      // 3. 高支出分類提醒
      const topCategories = thisMonth.categoryBreakdown
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

      if (topCategories.length > 0) {
        const topCategory = topCategories[0];
        const percentage = (topCategory.amount / thisMonth.totalExpense) * 100;
        
        if (percentage > 40) {
          insights.push({
            type: 'info',
            title: `${topCategory.name}支出佔比較高`,
            description: `佔總支出的 ${percentage.toFixed(1)}%，可考慮是否有優化空間`,
            action: '查看分類詳情',
            data: { categoryName: topCategory.name, percentage, amount: topCategory.amount }
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('生成支出洞察失敗:', error);
      return [];
    }
  }

  /**
   * 預測預算使用情況
   */
  async predictBudgetUsage(familyId: string): Promise<BudgetPrediction[]> {
    // TODO: 實現預算預測邏輯
    // 這需要整合預算功能
    return [];
  }

  /**
   * 獲取月度數據
   */
  private async getMonthlyData(familyId: string, month: Date) {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    // TODO: 調用實際的統計服務
    // 這裡需要實現從 FinanceStatsService 獲取數據的邏輯
    return {
      totalIncome: 0,
      totalExpense: 0,
      categoryBreakdown: [] as Array<{ name: string; amount: number }>
    };
  }

  /**
   * 檢測重複交易
   */
  async detectDuplicateTransactions(
    familyId: string,
    newTransaction: {
      amount: number;
      description?: string;
      category_id: string;
      date: string;
    }
  ): Promise<FinanceTransaction[]> {
    try {
      // 獲取最近7天的交易
      const recentTransactions = await FinanceTransactionService.getRecentTransactions(familyId, 50);
      
      const duplicates = recentTransactions.filter(transaction => {
        // 同樣金額
        const sameAmount = Math.abs(transaction.amount - newTransaction.amount) < 0.01;
        
        // 同樣分類
        const sameCategory = transaction.category_id === newTransaction.category_id;
        
        // 近期日期 (3天內)
        const transactionDate = new Date(transaction.date);
        const newTransactionDate = new Date(newTransaction.date);
        const daysDiff = Math.abs(transactionDate.getTime() - newTransactionDate.getTime()) / (1000 * 60 * 60 * 24);
        const recentDate = daysDiff <= 3;
        
        // 相似描述 (如果有的話)
        let similarDescription = true;
        if (newTransaction.description && transaction.description) {
          const desc1 = newTransaction.description.toLowerCase().trim();
          const desc2 = transaction.description.toLowerCase().trim();
          similarDescription = desc1 === desc2 || 
            (desc1.includes(desc2) || desc2.includes(desc1));
        }

        return sameAmount && sameCategory && recentDate && similarDescription;
      });

      return duplicates;
    } catch (error) {
      console.error('檢測重複交易失敗:', error);
      return [];
    }
  }
}

export const smartFinanceService = SmartFinanceService.getInstance();