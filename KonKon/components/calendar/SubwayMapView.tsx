import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

interface SubwayStation {
  id: string;
  event: any;
  time: string;
  line: string;
  lineColor: string;
  position: number;
  isTransfer?: boolean;
}

const SUBWAY_LINES = [
  { id: 'work', name: '工作線', color: '#ff6b6b', icon: '💼' },
  { id: 'personal', name: '生活線', color: '#4ecdc4', icon: '🏠' },
  { id: 'health', name: '健康線', color: '#45b7d1', icon: '💪' },
  { id: 'social', name: '社交線', color: '#f9ca24', icon: '👥' },
  { id: 'entertainment', name: '娛樂線', color: '#6c5ce7', icon: '🎉' },
];

export default function SubwayMapView({
  events,
  selectedDate,
  onEventPress,
}: CalendarViewProps) {
  const [stations, setStations] = useState<SubwayStation[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>('all');

  // 獲取選中日期的事件
  const getSelectedDateEvents = () => {
    const targetDayStart = new Date(selectedDate);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetDayStart.getTime();
    }).sort((a, b) => a.start_ts - b.start_ts);
  };

  // 根據事件內容決定地鐵線路
  const getEventLine = (event: any): string => {
    const title = event.title.toLowerCase();
    if (title.includes('工作') || title.includes('會議') || title.includes('office')) {
      return 'work';
    } else if (title.includes('運動') || title.includes('健身') || title.includes('醫療')) {
      return 'health';
    } else if (title.includes('聚會') || title.includes('朋友') || title.includes('社交')) {
      return 'social';
    } else if (title.includes('娛樂') || title.includes('電影') || title.includes('遊戲')) {
      return 'entertainment';
    }
    return 'personal';
  };

  // 生成地鐵站點
  useEffect(() => {
    const selectedEvents = getSelectedDateEvents();
    
    const newStations: SubwayStation[] = selectedEvents.map((event, index) => {
      const lineId = getEventLine(event);
      const line = SUBWAY_LINES.find(l => l.id === lineId) || SUBWAY_LINES[1];
      
      return {
        id: event.id || `station-${index}`,
        event,
        time: formatTime(event.start_ts),
        line: line.id,
        lineColor: line.color,
        position: index,
        isTransfer: Math.random() > 0.7, // 隨機設置轉乘站
      };
    });
    
    setStations(newStations);
  }, [selectedDate, events]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  // 過濾站點
  const getFilteredStations = () => {
    if (selectedLine === 'all') {
      return stations;
    }
    return stations.filter(station => station.line === selectedLine);
  };

  // 渲染地鐵線路選擇器
  const renderLineSelector = () => (
    <ScrollView 
      horizontal 
      style={styles.lineSelector}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.lineSelectorContent}
    >
      <TouchableOpacity
        style={[
          styles.lineButton,
          selectedLine === 'all' && styles.lineButtonActive,
          { borderColor: '#333' }
        ]}
        onPress={() => setSelectedLine('all')}
      >
        <Text style={styles.lineIcon}>🚇</Text>
        <Text style={styles.lineName}>全部線路</Text>
      </TouchableOpacity>
      
      {SUBWAY_LINES.map(line => (
        <TouchableOpacity
          key={line.id}
          style={[
            styles.lineButton,
            selectedLine === line.id && styles.lineButtonActive,
            { borderColor: line.color }
          ]}
          onPress={() => setSelectedLine(line.id)}
        >
          <Text style={styles.lineIcon}>{line.icon}</Text>
          <Text style={styles.lineName}>{line.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // 渲染地鐵站點
  const renderStation = (station: SubwayStation, index: number) => {
    const filteredStations = getFilteredStations();
    const isFirst = index === 0;
    const isLast = index === filteredStations.length - 1;

    return (
      <View key={station.id} style={styles.stationContainer}>
        {/* 地鐵線路軌道 */}
        {!isFirst && (
          <View style={[
            styles.track,
            { backgroundColor: station.lineColor }
          ]} />
        )}
        
        {/* 地鐵站點 */}
        <TouchableOpacity
          style={[
            styles.station,
            station.isTransfer && styles.transferStation,
            { borderColor: station.lineColor }
          ]}
          onPress={() => onEventPress && onEventPress(station.event)}
        >
          <View style={[
            styles.stationCore,
            { backgroundColor: station.lineColor }
          ]}>
            {station.isTransfer && (
              <Text style={styles.transferIcon}>🔄</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* 站點信息 */}
        <View style={styles.stationInfo}>
          <View style={styles.stationCard}>
            <Text style={styles.stationTime}>{station.time}</Text>
            <Text style={styles.stationName} numberOfLines={2}>
              {station.event.title}
            </Text>
            <View style={styles.lineTag}>
              <View style={[
                styles.lineIndicator,
                { backgroundColor: station.lineColor }
              ]} />
              <Text style={styles.lineTagText}>
                {SUBWAY_LINES.find(l => l.id === station.line)?.name}
              </Text>
            </View>
          </View>
        </View>

        {/* 繼續軌道到下一站 */}
        {!isLast && (
          <View style={[
            styles.trackContinue,
            { backgroundColor: station.lineColor }
          ]} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 地鐵圖標題 */}
      <View style={styles.header}>
        <Text style={styles.title}>🚇 地鐵路線圖</Text>
        <Text style={styles.subtitle}>{formatSelectedDate()}</Text>
        <Text style={styles.stationCount}>
          共 {stations.length} 個站點
        </Text>
      </View>

      {/* 線路選擇器 */}
      {renderLineSelector()}

      {/* 地鐵路線圖 */}
      <ScrollView 
        style={styles.mapContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mapContent}
      >
        {getFilteredStations().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚉</Text>
            <Text style={styles.emptyText}>今日無班次</Text>
            <Text style={styles.emptySubtext}>選擇其他日期查看行程</Text>
          </View>
        ) : (
          <View style={styles.routeContainer}>
            {/* 起始站 */}
            <View style={styles.terminalStation}>
              <View style={styles.terminalStationIcon}>
                <Text style={styles.terminalStationText}>起</Text>
              </View>
              <Text style={styles.terminalStationLabel}>今日行程開始</Text>
            </View>

            {/* 站點列表 */}
            {getFilteredStations().map(renderStation)}

            {/* 終點站 */}
            <View style={styles.terminalStation}>
              <View style={[
                styles.terminalStationIcon,
                styles.endStationIcon
              ]}>
                <Text style={styles.terminalStationText}>終</Text>
              </View>
              <Text style={styles.terminalStationLabel}>今日行程結束</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 圖例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendStation} />
          <Text style={styles.legendText}>普通站</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendStation, styles.legendTransfer]}>
            <Text style={styles.legendTransferIcon}>🔄</Text>
          </View>
          <Text style={styles.legendText}>轉乘站</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  stationCount: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  lineSelector: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  lineSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  lineButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  lineButtonActive: {
    backgroundColor: '#f8f9fa',
  },
  lineIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  lineName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2c3e50',
  },
  mapContainer: {
    flex: 1,
  },
  mapContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
  },
  routeContainer: {
    paddingHorizontal: 20,
  },
  terminalStation: {
    alignItems: 'center',
    marginVertical: 20,
  },
  terminalStationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endStationIcon: {
    backgroundColor: '#dc3545',
  },
  terminalStationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  terminalStationLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
  },
  stationContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  track: {
    width: 4,
    height: 40,
    marginBottom: 8,
  },
  station: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferStation: {
    borderWidth: 4,
  },
  stationCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferIcon: {
    fontSize: 8,
    color: '#ffffff',
  },
  stationInfo: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  stationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#495057',
    marginBottom: 4,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  lineTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  lineTagText: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '500',
  },
  trackContinue: {
    width: 4,
    height: 40,
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendStation: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6c757d',
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendTransfer: {
    borderWidth: 2,
    borderColor: '#28a745',
  },
  legendTransferIcon: {
    fontSize: 6,
    color: '#ffffff',
  },
  legendText: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '500',
  },
}); 