import { HealthRecord, healthService, HealthStats } from '@/lib/healthService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

interface BloodPressureChartProps {
  userId?: string;
  familyId?: string;
}

const BloodPressureChart: React.FC<BloodPressureChartProps> = ({
  userId,
  familyId,
}) => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30');
  const [showSystolic, setShowSystolic] = useState(true);
  const [showDiastolic, setShowDiastolic] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedPeriod, userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const days = parseInt(selectedPeriod);
      
      // 獲取血壓記錄
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const bloodPressureRecords = await healthService.getBloodPressureRecords(
        userId,
        100,
        startDate
      );
      setRecords(bloodPressureRecords);

      // 獲取統計數據
      const healthStats = await healthService.getBloodPressureStats(userId, days);
      setStats(healthStats);
    } catch (error) {
      console.error('載入血壓數據失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (records.length === 0) return null;

    // 按日期排序，最舊到最新
    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.measurement_time).getTime() - new Date(b.measurement_time).getTime()
    );

    // 如果記錄太多，進行採樣
    let sampledRecords = sortedRecords;
    if (sortedRecords.length > 15) {
      const step = Math.ceil(sortedRecords.length / 15);
      sampledRecords = sortedRecords.filter((_, index) => index % step === 0);
    }

    const labels = sampledRecords.map(record => {
      const date = new Date(record.measurement_time);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const datasets = [];

    if (showSystolic && sampledRecords.some(r => r.systolic_bp)) {
      datasets.push({
        data: sampledRecords.map(record => record.systolic_bp || 0),
        color: () => '#FF6B35', // 收縮壓顏色
        strokeWidth: 2,
      });
    }

    if (showDiastolic && sampledRecords.some(r => r.diastolic_bp)) {
      datasets.push({
        data: sampledRecords.map(record => record.diastolic_bp || 0),
        color: () => '#4CAF50', // 舒張壓顏色
        strokeWidth: 2,
      });
    }

    return {
      labels,
      datasets,
    };
  };

  const renderPeriodButton = (period: '7' | '30' | '90', label: string) => (
    <TouchableOpacity
      key={period}
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.periodButtonActive
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[
        styles.periodButtonText,
        selectedPeriod === period && styles.periodButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStats = () => {
    if (!stats) return null;

    const avgSystolic = stats.averageBP.systolic;
    const avgDiastolic = stats.averageBP.diastolic;
    const category = healthService.getBloodPressureCategory(avgSystolic, avgDiastolic);

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>血壓統計</Text>
          <Text style={styles.statsPeriod}>最近 {selectedPeriod} 天</Text>
        </View>

        <View style={styles.statsGrid}>
          {/* 平均血壓 */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Ionicons name="heart" size={20} color="#FF6B35" />
              <Text style={styles.statCardTitle}>平均血壓</Text>
            </View>
            <Text style={styles.statCardValue}>
              {avgSystolic}/{avgDiastolic}
            </Text>
            <Text style={styles.statCardUnit}>mmHg</Text>
            <View style={[styles.categoryIndicator, { backgroundColor: category.color + '20' }]}>
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.label}
              </Text>
            </View>
          </View>

          {/* 血壓趨勢 */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Ionicons 
                name={
                  stats.bloodPressureTrend === 'improving' ? 'trending-down' :
                  stats.bloodPressureTrend === 'worsening' ? 'trending-up' : 'remove'
                } 
                size={20} 
                color={
                  stats.bloodPressureTrend === 'improving' ? '#4CAF50' :
                  stats.bloodPressureTrend === 'worsening' ? '#FF5722' : '#FFA726'
                }
              />
              <Text style={styles.statCardTitle}>變化趨勢</Text>
            </View>
            <Text style={[
              styles.trendText,
              {
                color: stats.bloodPressureTrend === 'improving' ? '#4CAF50' :
                       stats.bloodPressureTrend === 'worsening' ? '#FF5722' : '#FFA726'
              }
            ]}>
              {
                stats.bloodPressureTrend === 'improving' ? '改善中' :
                stats.bloodPressureTrend === 'worsening' ? '需注意' : '穩定'
              }
            </Text>
          </View>

          {/* 記錄次數 */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Ionicons name="analytics" size={20} color="#2196F3" />
              <Text style={styles.statCardTitle}>記錄次數</Text>
            </View>
            <Text style={styles.statCardValue}>{records.length}</Text>
            <Text style={styles.statCardUnit}>次</Text>
          </View>

          {/* 用藥依從性 */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Ionicons name="medical" size={20} color="#9C27B0" />
              <Text style={styles.statCardTitle}>用藥依從</Text>
            </View>
            <Text style={styles.statCardValue}>{stats.medicationAdherence}</Text>
            <Text style={styles.statCardUnit}>%</Text>
            <View style={[
              styles.adherenceBar,
              { 
                backgroundColor: stats.medicationAdherence >= 80 ? '#4CAF50' : 
                                stats.medicationAdherence >= 60 ? '#FFA726' : '#FF5722'
              }
            ]}>
              <View 
                style={[
                  styles.adherenceProgress, 
                  { width: `${stats.medicationAdherence}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderChart = () => {
    const chartData = getChartData();
    
    if (!chartData || chartData.datasets.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="bar-chart-outline" size={48} color="#CCCCCC" />
          <Text style={styles.noDataText}>暫無血壓數據</Text>
          <Text style={styles.noDataSubtext}>開始記錄血壓以查看趨勢圖</Text>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>血壓趨勢圖</Text>
          <View style={styles.chartLegend}>
            <TouchableOpacity 
              style={styles.legendItem}
              onPress={() => setShowSystolic(!showSystolic)}
            >
              <View style={[
                styles.legendColor, 
                { backgroundColor: showSystolic ? '#FF6B35' : '#CCCCCC' }
              ]} />
              <Text style={[
                styles.legendText,
                { color: showSystolic ? '#333' : '#999' }
              ]}>收縮壓</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.legendItem}
              onPress={() => setShowDiastolic(!showDiastolic)}
            >
              <View style={[
                styles.legendColor, 
                { backgroundColor: showDiastolic ? '#4CAF50' : '#CCCCCC' }
              ]} />
              <Text style={[
                styles.legendText,
                { color: showDiastolic ? '#333' : '#999' }
              ]}>舒張壓</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={Math.max(chartWidth, chartData.labels.length * 50)}
            height={220}
            yAxisSuffix=" mmHg"
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.8})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
              },
              propsForBackgroundLines: {
                stroke: '#E5E5E5',
                strokeWidth: 1,
              }
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={false}
          />
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 時間段選擇 */}
      <View style={styles.periodContainer}>
        {renderPeriodButton('7', '7天')}
        {renderPeriodButton('30', '30天')}
        {renderPeriodButton('90', '90天')}
      </View>

      {/* 統計數據 */}
      {renderStats()}

      {/* 血壓趨勢圖 */}
      {renderChart()}

      {/* 健康建議 */}
      {stats && stats.averageBP.systolic > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>健康建議</Text>
          {(() => {
            const avgSystolic = stats.averageBP.systolic;
            const avgDiastolic = stats.averageBP.diastolic;
            const recommendations = [];

            if (avgSystolic >= 140 || avgDiastolic >= 90) {
              recommendations.push({
                icon: 'warning',
                color: '#FF5722',
                text: '血壓偏高，建議諮詢醫生並考慮調整生活方式'
              });
            } else if (avgSystolic >= 130 || avgDiastolic >= 80) {
              recommendations.push({
                icon: 'alert-circle',
                color: '#FFA726',
                text: '血壓略高，建議增加運動量並注意飲食'
              });
            } else {
              recommendations.push({
                icon: 'checkmark-circle',
                color: '#4CAF50',
                text: '血壓正常，繼續保持健康的生活方式'
              });
            }

            if (stats.medicationAdherence < 80) {
              recommendations.push({
                icon: 'medical',
                color: '#9C27B0',
                text: '用藥依從性偏低，請按時服藥並諮詢醫生'
              });
            }

            if (stats.bloodPressureTrend === 'worsening') {
              recommendations.push({
                icon: 'trending-up',
                color: '#FF5722',
                text: '血壓呈上升趨勢，建議加強自我管理'
              });
            }

            return recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name={rec.icon as any} size={20} color={rec.color} />
                <Text style={styles.recommendationText}>{rec.text}</Text>
              </View>
            ));
          })()}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statsPeriod: {
    fontSize: 12,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (screenWidth - 80) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statCardUnit: {
    fontSize: 12,
    color: '#999',
  },
  categoryIndicator: {
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  trendText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  adherenceBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  adherenceProgress: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
  },
  recommendationsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default BloodPressureChart; 