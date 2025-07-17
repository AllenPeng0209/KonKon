import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

const { width: screenWidth } = Dimensions.get('window');
const CELL_SIZE = (screenWidth - 80) / 7;

interface HeatmapDay {
  date: Date;
  eventCount: number;
  intensity: number;
  events: any[];
}

export default function HeatmapView({
  events,
  selectedDate,
  onDatePress,
  onEventPress,
}: CalendarViewProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);

  const getYear = () => selectedDate.getFullYear();
  const getYearDates = () => {
    const year = getYear();
    const dates = [];
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(new Date(year, month, day));
      }
    }
    return dates;
  };

  const getIntensityColor = (intensity: number) => {
    const colors = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];
    return colors[Math.min(intensity, 4)];
  };

  useEffect(() => {
    const yearDates = getYearDates();
    const data: HeatmapDay[] = yearDates.map(date => {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_ts * 1000);
        return eventDate.toDateString() === date.toDateString();
      });

      const intensity = Math.min(Math.floor(dayEvents.length / 2), 4);
      
      return {
        date,
        eventCount: dayEvents.length,
        intensity,
        events: dayEvents,
      };
    });

    setHeatmapData(data);
  }, [events, selectedDate]);

  const renderMonth = (monthData: HeatmapDay[], monthIndex: number) => {
    const monthName = new Date(getYear(), monthIndex, 1).toLocaleDateString('zh-CN', { month: 'short' });
    
    return (
      <View key={monthIndex} style={styles.monthContainer}>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <View style={styles.monthGrid}>
          {monthData.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.heatmapCell,
                {
                  backgroundColor: getIntensityColor(day.intensity),
                  borderColor: selectedIntensity === day.intensity ? '#000' : 'transparent',
                },
              ]}
              onPress={() => {
                onDatePress(day.date);
                setSelectedIntensity(day.intensity);
              }}
            >
              <Text style={styles.dayNumber}>{day.date.getDate()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const groupByMonth = () => {
    const grouped: { [key: number]: HeatmapDay[] } = {};
    heatmapData.forEach(day => {
      const month = day.date.getMonth();
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(day);
    });
    return grouped;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 {getYear()} 年度熱力圖</Text>
        <Text style={styles.subtitle}>事件密度可視化</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heatmapContainer}>
          {Object.entries(groupByMonth()).map(([monthIndex, monthData]) => 
            renderMonth(monthData, parseInt(monthIndex))
          )}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>活躍度圖例</Text>
          <View style={styles.legendRow}>
            <Text style={styles.legendLabel}>少</Text>
            {[0, 1, 2, 3, 4].map(intensity => (
              <View
                key={intensity}
                style={[
                  styles.legendCell,
                  { backgroundColor: getIntensityColor(intensity) }
                ]}
              />
            ))}
            <Text style={styles.legendLabel}>多</Text>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#24292e',
  },
  subtitle: {
    fontSize: 14,
    color: '#586069',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  heatmapContainer: {
    padding: 20,
  },
  monthContainer: {
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 8,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  heatmapCell: {
    width: (screenWidth - 80) / 7 - 2,
    height: (screenWidth - 80) / 7 - 2,
    margin: 1,
    borderRadius: 2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: '#24292e',
  },
  legend: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e4e8',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: 12,
    color: '#586069',
    marginHorizontal: 8,
  },
  legendCell: {
    width: 12,
    height: 12,
    margin: 1,
    borderRadius: 2,
  },
}); 