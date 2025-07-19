import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ShoppingItem, Store } from './ShoppingViewSelector';

interface ShoppingHistoryAnalyzerProps {
  items: ShoppingItem[];
  stores: Store[];
  onInsightAction: (action: InsightAction) => void;
}

interface InsightAction {
  type: 'add_recurring' | 'set_reminder' | 'budget_alert' | 'store_recommendation';
  data: any;
}

interface ShoppingPattern {
  item: string;
  frequency: number;
  lastPurchased: Date;
  avgPrice: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface MonthlySpending {
  month: string;
  amount: number;
  items: number;
  avgPerItem: number;
}

const { width } = Dimensions.get('window');

const ShoppingHistoryAnalyzer: React.FC<ShoppingHistoryAnalyzerProps> = ({
  items,
  stores,
  onInsightAction
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [shoppingPatterns, setShoppingPatterns] = useState<ShoppingPattern[]>([]);
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([]);

  // 分析购物模式
  useEffect(() => {
    analyzeShoppingPatterns();
    analyzeMonthlySpending();
  }, [items, selectedPeriod]);

  const analyzeShoppingPatterns = () => {
    const completedItems = items.filter(item => item.completed);
    const itemFrequency: { [key: string]: ShoppingItem[] } = {};
    
    // 按商品名称分组
    completedItems.forEach(item => {
      const key = item.name.toLowerCase();
      if (!itemFrequency[key]) {
        itemFrequency[key] = [];
      }
      itemFrequency[key].push(item);
    });

    // 计算购买模式
    const patterns = Object.entries(itemFrequency)
      .map(([itemName, purchases]) => {
        const prices = purchases.map(p => p.actualPrice || p.estimatedPrice);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const sortedPurchases = purchases.sort((a, b) => 
          new Date(b.completedDate || b.addedDate).getTime() - 
          new Date(a.completedDate || a.addedDate).getTime()
        );

        // 计算价格趋势
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (prices.length >= 3) {
          const recent = prices.slice(0, Math.floor(prices.length / 2));
          const older = prices.slice(Math.floor(prices.length / 2));
          const recentAvg = recent.reduce((sum, price) => sum + price, 0) / recent.length;
          const olderAvg = older.reduce((sum, price) => sum + price, 0) / older.length;
          
          if (recentAvg > olderAvg * 1.1) trend = 'increasing';
          else if (recentAvg < olderAvg * 0.9) trend = 'decreasing';
        }

        return {
          item: purchases[0].name,
          frequency: purchases.length,
          lastPurchased: new Date(sortedPurchases[0].completedDate || sortedPurchases[0].addedDate),
          avgPrice,
          trend
        };
      })
      .filter(pattern => pattern.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency);

    setShoppingPatterns(patterns.slice(0, 10));
  };

  const analyzeMonthlySpending = () => {
    const completedItems = items.filter(item => item.completed);
    const monthlyData: { [key: string]: { amount: number; items: number } } = {};

    completedItems.forEach(item => {
      const date = new Date(item.completedDate || item.addedDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, items: 0 };
      }
      
      monthlyData[monthKey].amount += item.actualPrice || item.estimatedPrice;
      monthlyData[monthKey].items += 1;
    });

    const spending = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        amount: data.amount,
        items: data.items,
        avgPerItem: data.amount / data.items
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // 最近6个月

    setMonthlySpending(spending);
  };

  // 生成AI洞察
  const getAIInsights = () => {
    const insights = [];

    // 重复购买提醒
    const frequentItems = shoppingPatterns.filter(p => p.frequency >= 3);
    frequentItems.forEach(pattern => {
      const daysSinceLastPurchase = Math.floor(
        (new Date().getTime() - pattern.lastPurchased.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastPurchase > 7) {
        insights.push({
          type: 'recurring_reminder',
          title: `${pattern.item}の補充時期`,
          description: `前回の購入から${daysSinceLastPurchase}日経過しています`,
          action: () => onInsightAction({
            type: 'add_recurring',
            data: { item: pattern.item, frequency: 'weekly' }
          }),
          color: '#3b82f6',
          emoji: '🔄'
        });
      }
    });

    // 価格変動アラート
    const priceTrendItems = shoppingPatterns.filter(p => p.trend !== 'stable');
    priceTrendItems.forEach(pattern => {
      if (pattern.trend === 'increasing') {
        insights.push({
          type: 'price_alert',
          title: `${pattern.item}の価格上昇`,
          description: `平均価格が上昇傾向です (¥${Math.round(pattern.avgPrice)})`,
          action: () => onInsightAction({
            type: 'store_recommendation',
            data: { item: pattern.item }
          }),
          color: '#f59e0b',
          emoji: '📈'
        });
      }
    });

    // 予算最適化
    if (monthlySpending.length >= 2) {
      const lastMonth = monthlySpending[monthlySpending.length - 1];
      const prevMonth = monthlySpending[monthlySpending.length - 2];
      
      if (lastMonth.amount > prevMonth.amount * 1.2) {
        insights.push({
          type: 'budget_alert',
          title: '支出増加アラート',
          description: `前月比${Math.round(((lastMonth.amount - prevMonth.amount) / prevMonth.amount) * 100)}%増加`,
          action: () => onInsightAction({
            type: 'budget_alert',
            data: { increase: lastMonth.amount - prevMonth.amount }
          }),
          color: '#dc2626',
          emoji: '⚠️'
        });
      }
    }

    return insights.slice(0, 5);
  };

  const insights = getAIInsights();

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'quarter'] as const).map(period => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.activePeriodButton
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.activePeriodButtonText
          ]}>
            {period === 'week' ? '週間' : period === 'month' ? '月間' : '四半期'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAIInsights = () => (
    <View style={styles.insightsContainer}>
      <Text style={styles.sectionTitle}>🤖 AIからの提案</Text>
      <Text style={styles.sectionSubtitle}>
        購入履歴を分析した結果をお知らせします
      </Text>
      
      {insights.length === 0 ? (
        <View style={styles.noInsights}>
          <Text style={styles.noInsightsEmoji}>🎯</Text>
          <Text style={styles.noInsightsText}>
            データが蓄積されると、より詳細な分析を提供できます
          </Text>
        </View>
      ) : (
        insights.map((insight, index) => (
          <TouchableOpacity
            key={index}
            style={styles.insightCard}
            onPress={insight.action}
          >
            <View style={styles.insightHeader}>
              <Text style={styles.insightEmoji}>{insight.emoji}</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
              <View style={[styles.insightIndicator, { backgroundColor: insight.color }]} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderSpendingTrend = () => {
    const maxAmount = Math.max(...monthlySpending.map(m => m.amount));
    
    return (
      <View style={styles.trendContainer}>
        <Text style={styles.sectionTitle}>📊 支出トレンド</Text>
        
        <View style={styles.chartContainer}>
          {monthlySpending.map((month, index) => {
            const height = (month.amount / maxAmount) * 120;
            return (
              <View key={month.month} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height }]} />
                </View>
                <Text style={styles.barLabel}>
                  {month.month.split('-')[1]}月
                </Text>
                <Text style={styles.barAmount}>
                  ¥{Math.round(month.amount / 1000)}k
                </Text>
              </View>
            );
          })}
        </View>

        {/* 支出統計 */}
        <View style={styles.trendStats}>
          <View style={styles.trendStatCard}>
            <Text style={styles.trendStatValue}>
              ¥{monthlySpending.length > 0 
                ? Math.round(monthlySpending.reduce((sum, m) => sum + m.amount, 0) / monthlySpending.length).toLocaleString()
                : 0
              }
            </Text>
            <Text style={styles.trendStatLabel}>月平均支出</Text>
          </View>
          
          <View style={styles.trendStatCard}>
            <Text style={styles.trendStatValue}>
              {monthlySpending.length > 0 
                ? Math.round(monthlySpending.reduce((sum, m) => sum + m.items, 0) / monthlySpending.length)
                : 0
              }
            </Text>
            <Text style={styles.trendStatLabel}>月平均商品数</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderShoppingPatterns = () => (
    <View style={styles.patternsContainer}>
      <Text style={styles.sectionTitle}>🔄 購買パターン</Text>
      <Text style={styles.sectionSubtitle}>
        よく購入する商品と価格動向
      </Text>
      
      {shoppingPatterns.map((pattern, index) => (
        <View key={index} style={styles.patternCard}>
          <View style={styles.patternHeader}>
            <Text style={styles.patternItem}>{pattern.item}</Text>
            <View style={[
              styles.trendBadge,
              {
                backgroundColor: 
                  pattern.trend === 'increasing' ? '#fee2e2' :
                  pattern.trend === 'decreasing' ? '#ecfdf5' : '#f3f4f6'
              }
            ]}>
              <Text style={[
                styles.trendText,
                {
                  color:
                    pattern.trend === 'increasing' ? '#dc2626' :
                    pattern.trend === 'decreasing' ? '#059669' : '#6b7280'
                }
              ]}>
                {pattern.trend === 'increasing' ? '↗️' :
                 pattern.trend === 'decreasing' ? '↘️' : '→'}
                {pattern.trend === 'increasing' ? '上昇' :
                 pattern.trend === 'decreasing' ? '下降' : '安定'}
              </Text>
            </View>
          </View>
          
          <View style={styles.patternStats}>
            <View style={styles.patternStat}>
              <Text style={styles.patternStatValue}>{pattern.frequency}回</Text>
              <Text style={styles.patternStatLabel}>購入回数</Text>
            </View>
            
            <View style={styles.patternStat}>
              <Text style={styles.patternStatValue}>¥{Math.round(pattern.avgPrice)}</Text>
              <Text style={styles.patternStatLabel}>平均価格</Text>
            </View>
            
            <View style={styles.patternStat}>
              <Text style={styles.patternStatValue}>
                {Math.floor((new Date().getTime() - pattern.lastPurchased.getTime()) / (1000 * 60 * 60 * 24))}日前
              </Text>
              <Text style={styles.patternStatLabel}>最終購入</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {renderPeriodSelector()}
      {renderAIInsights()}
      {renderSpendingTrend()}
      {renderShoppingPatterns()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#3b82f6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activePeriodButtonText: {
    color: '#ffffff',
  },
  insightsContainer: {
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  noInsights: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noInsightsEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  noInsightsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  insightCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  insightIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginLeft: 12,
  },
  trendContainer: {
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
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  barAmount: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },
  trendStats: {
    flexDirection: 'row',
    gap: 16,
  },
  trendStatCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  trendStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  trendStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  patternsContainer: {
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
  patternCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  patternItem: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  trendBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patternStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  patternStat: {
    alignItems: 'center',
  },
  patternStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  patternStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default ShoppingHistoryAnalyzer; 