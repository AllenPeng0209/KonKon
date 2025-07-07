import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { 
  RecurrenceRule, 
  formatRecurrenceDescription,
  validateRecurrenceRule,
  parseNaturalLanguageRecurrence 
} from '../lib/recurrenceEngine';

interface RecurrenceRuleEditorProps {
  initialRule?: RecurrenceRule;
  onRuleChange: (rule: RecurrenceRule | null) => void;
  onCancel: () => void;
}

export default function RecurrenceRuleEditor({
  initialRule,
  onRuleChange,
  onCancel,
}: RecurrenceRuleEditorProps) {
  const [rule, setRule] = useState<RecurrenceRule>(
    initialRule || {
      frequency: 'WEEKLY',
      interval: 1,
    }
  );
  const [isEnabled, setIsEnabled] = useState(!!initialRule);
  const [endType, setEndType] = useState<'never' | 'count' | 'until'>('never');
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');

  useEffect(() => {
    if (rule.count) {
      setEndType('count');
    } else if (rule.until) {
      setEndType('until');
    } else {
      setEndType('never');
    }
  }, [rule]);

  const frequencies = [
    { value: 'DAILY', label: '每天' },
    { value: 'WEEKLY', label: '每周' },
    { value: 'MONTHLY', label: '每月' },
    { value: 'YEARLY', label: '每年' },
  ] as const;

  const weekDays = [
    { value: 'MO', label: '周一' },
    { value: 'TU', label: '周二' },
    { value: 'WE', label: '周三' },
    { value: 'TH', label: '周四' },
    { value: 'FR', label: '周五' },
    { value: 'SA', label: '周六' },
    { value: 'SU', label: '周日' },
  ];

  const handleFrequencyChange = (frequency: RecurrenceRule['frequency']) => {
    setRule(prev => ({ ...prev, frequency, byDay: undefined, byMonthDay: undefined }));
  };

  const handleIntervalChange = (interval: string) => {
    const num = parseInt(interval, 10);
    if (!isNaN(num) && num > 0) {
      setRule(prev => ({ ...prev, interval: num }));
    }
  };

  const handleWeekDayToggle = (day: string) => {
    setRule(prev => {
      const byDay = prev.byDay || [];
      const newByDay = byDay.includes(day)
        ? byDay.filter(d => d !== day)
        : [...byDay, day];
      
      return { ...prev, byDay: newByDay.length > 0 ? newByDay : undefined };
    });
  };

  const handleEndTypeChange = (type: 'never' | 'count' | 'until') => {
    setEndType(type);
    setRule(prev => ({
      ...prev,
      count: type === 'count' ? prev.count || 10 : undefined,
      until: type === 'until' ? prev.until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
    }));
  };

  const handleCountChange = (count: string) => {
    const num = parseInt(count, 10);
    if (!isNaN(num) && num > 0) {
      setRule(prev => ({ ...prev, count: num }));
    }
  };

  const handleNaturalLanguageInput = () => {
    if (!naturalLanguageInput.trim()) return;

    const parsedRule = parseNaturalLanguageRecurrence(naturalLanguageInput);
    if (parsedRule) {
      setRule(parsedRule);
      setIsEnabled(true);
      setNaturalLanguageInput('');
      Alert.alert('解析成功', `已解析为: ${formatRecurrenceDescription(parsedRule)}`);
    } else {
      Alert.alert('解析失败', '无法理解输入的重复模式，请尝试其他表达方式');
    }
  };

  const handleSave = () => {
    if (!isEnabled) {
      onRuleChange(null);
      return;
    }

    const validation = validateRecurrenceRule(rule);
    if (!validation.valid) {
      Alert.alert('验证失败', validation.errors.join('\n'));
      return;
    }

    onRuleChange(rule);
  };

  const renderFrequencyOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>重复频率</Text>
      <View style={styles.optionRow}>
        {frequencies.map(freq => (
          <TouchableOpacity
            key={freq.value}
            style={[
              styles.frequencyButton,
              rule.frequency === freq.value && styles.frequencyButtonActive
            ]}
            onPress={() => handleFrequencyChange(freq.value)}
          >
            <Text style={[
              styles.frequencyButtonText,
              rule.frequency === freq.value && styles.frequencyButtonTextActive
            ]}>
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderIntervalInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>间隔</Text>
      <View style={styles.intervalRow}>
        <Text style={styles.intervalLabel}>每</Text>
        <TextInput
          style={styles.intervalInput}
          value={rule.interval?.toString() || '1'}
          onChangeText={handleIntervalChange}
          keyboardType="numeric"
          maxLength={2}
        />
        <Text style={styles.intervalLabel}>
          {rule.frequency === 'DAILY' && '天'}
          {rule.frequency === 'WEEKLY' && '周'}
          {rule.frequency === 'MONTHLY' && '月'}
          {rule.frequency === 'YEARLY' && '年'}
        </Text>
      </View>
    </View>
  );

  const renderWeekDayOptions = () => {
    if (rule.frequency !== 'WEEKLY') return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>星期几</Text>
        <View style={styles.weekDayRow}>
          {weekDays.map(day => (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.weekDayButton,
                rule.byDay?.includes(day.value) && styles.weekDayButtonActive
              ]}
              onPress={() => handleWeekDayToggle(day.value)}
            >
              <Text style={[
                styles.weekDayButtonText,
                rule.byDay?.includes(day.value) && styles.weekDayButtonTextActive
              ]}>
                {day.label.slice(-1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderEndOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>结束条件</Text>
      
      <TouchableOpacity
        style={[styles.endOption, endType === 'never' && styles.endOptionActive]}
        onPress={() => handleEndTypeChange('never')}
      >
        <Text style={styles.endOptionText}>永不结束</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.endOption, endType === 'count' && styles.endOptionActive]}
        onPress={() => handleEndTypeChange('count')}
      >
        <View style={styles.endOptionRow}>
          <Text style={styles.endOptionText}>重复</Text>
          {endType === 'count' && (
            <TextInput
              style={styles.countInput}
              value={rule.count?.toString() || '10'}
              onChangeText={handleCountChange}
              keyboardType="numeric"
              maxLength={3}
            />
          )}
          <Text style={styles.endOptionText}>次</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.endOption, endType === 'until' && styles.endOptionActive]}
        onPress={() => handleEndTypeChange('until')}
      >
        <Text style={styles.endOptionText}>
          结束于 {rule.until?.toLocaleDateString('zh-CN')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderNaturalLanguageInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>智能解析</Text>
      <Text style={styles.sectionSubtitle}>
        尝试用自然语言描述重复模式，如"每两周"、"工作日"、"每月15号"
      </Text>
      <View style={styles.naturalInputRow}>
        <TextInput
          style={styles.naturalInput}
          value={naturalLanguageInput}
          onChangeText={setNaturalLanguageInput}
          placeholder="输入重复模式..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.parseButton}
          onPress={handleNaturalLanguageInput}
        >
          <Text style={styles.parseButtonText}>解析</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPreview = () => {
    if (!isEnabled) return null;

    return (
      <View style={styles.preview}>
        <Text style={styles.previewTitle}>预览</Text>
        <Text style={styles.previewText}>
          {formatRecurrenceDescription(rule) || '无重复'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.title}>重复设置</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.enableSection}>
          <Text style={styles.enableText}>启用重复</Text>
          <Switch
            value={isEnabled}
            onValueChange={setIsEnabled}
            trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
            thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        {isEnabled && (
          <>
            {renderNaturalLanguageInput()}
            {renderFrequencyOptions()}
            {renderIntervalInput()}
            {renderWeekDayOptions()}
            {renderEndOptions()}
            {renderPreview()}
          </>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  enableSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  enableText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  frequencyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  frequencyButtonText: {
    fontSize: 14,
    color: '#666',
  },
  frequencyButtonTextActive: {
    color: '#fff',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intervalLabel: {
    fontSize: 16,
    color: '#333',
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    minWidth: 60,
    textAlign: 'center',
  },
  weekDayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weekDayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  weekDayButtonText: {
    fontSize: 14,
    color: '#666',
  },
  weekDayButtonTextActive: {
    color: '#fff',
  },
  endOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  endOptionActive: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
  },
  endOptionText: {
    fontSize: 16,
    color: '#333',
  },
  endOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 16,
    color: '#333',
    minWidth: 50,
    textAlign: 'center',
  },
  naturalInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  naturalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
  },
  parseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  parseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  preview: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    color: '#333',
  },
});