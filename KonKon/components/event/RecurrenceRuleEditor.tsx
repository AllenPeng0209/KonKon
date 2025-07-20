import { t } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    RecurrenceRule,
    formatRecurrenceDescription,
    parseNaturalLanguageRecurrence,
    validateRecurrenceRule
} from '../../lib/recurrenceEngine';

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
    { value: 'DAILY', label: t('recurrenceRuleEditor.daily') },
    { value: 'WEEKLY', label: t('recurrenceRuleEditor.weekly') },
    { value: 'MONTHLY', label: t('recurrenceRuleEditor.monthly') },
    { value: 'YEARLY', label: t('recurrenceRuleEditor.yearly') },
  ] as const;

  const weekDays = [
    { value: 'MO', label: t('recurrenceRuleEditor.monday') },
    { value: 'TU', label: t('recurrenceRuleEditor.tuesday') },
    { value: 'WE', label: t('recurrenceRuleEditor.wednesday') },
    { value: 'TH', label: t('recurrenceRuleEditor.thursday') },
    { value: 'FR', label: t('recurrenceRuleEditor.friday') },
    { value: 'SA', label: t('recurrenceRuleEditor.saturday') },
    { value: 'SU', label: t('recurrenceRuleEditor.sunday') },
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
      Alert.alert(t('recurrenceRuleEditor.parseSuccess'), t('recurrenceRuleEditor.parsedAs', { description: formatRecurrenceDescription(parsedRule) }));
    } else {
      Alert.alert(t('recurrenceRuleEditor.parseFailed'), t('recurrenceRuleEditor.parseFailedMessage'));
    }
  };

  const handleSave = () => {
    if (!isEnabled) {
      onRuleChange(null);
      return;
    }

    const validation = validateRecurrenceRule(rule);
    if (!validation.valid) {
      Alert.alert(t('recurrenceRuleEditor.validationFailed'), validation.errors.join('\n'));
      return;
    }

    onRuleChange(rule);
  };

  const renderFrequencyOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('recurrenceRuleEditor.frequency')}</Text>
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
      <Text style={styles.sectionTitle}>{t('recurrenceRuleEditor.interval')}</Text>
      <View style={styles.intervalRow}>
        <Text style={styles.intervalLabel}>{t('recurrenceRuleEditor.every')}</Text>
        <TextInput
          style={styles.intervalInput}
          value={rule.interval?.toString() || '1'}
          onChangeText={handleIntervalChange}
          keyboardType="numeric"
          maxLength={2}
        />
        <Text style={styles.intervalLabel}>
          {rule.frequency === 'DAILY' && t('recurrenceRuleEditor.days')}
          {rule.frequency === 'WEEKLY' && t('recurrenceRuleEditor.weeks')}
          {rule.frequency === 'MONTHLY' && t('recurrenceRuleEditor.months')}
          {rule.frequency === 'YEARLY' && t('recurrenceRuleEditor.years')}
        </Text>
      </View>
    </View>
  );

  const renderWeekDayOptions = () => {
    if (rule.frequency !== 'WEEKLY') return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('recurrenceRuleEditor.onFollowingDays')}</Text>
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
      <Text style={styles.sectionTitle}>{t('recurrenceRuleEditor.endDate')}</Text>
      
      <TouchableOpacity
        style={[styles.endOption, endType === 'never' && styles.endOptionActive]}
        onPress={() => handleEndTypeChange('never')}
      >
        <Text style={styles.endOptionText}>{t('recurrenceRuleEditor.neverEnd')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.endOption, endType === 'count' && styles.endOptionActive]}
        onPress={() => handleEndTypeChange('count')}
      >
        <View style={styles.endOptionRow}>
          <Text style={styles.endOptionText}>{t('recurrenceRuleEditor.after_count')}</Text>
          {endType === 'count' && (
            <TextInput
              style={styles.countInput}
              value={rule.count?.toString() || '10'}
              onChangeText={handleCountChange}
              keyboardType="numeric"
              maxLength={3}
            />
          )}
          <Text style={styles.endOptionText}>{t('recurrenceRuleEditor.occurrences')}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.endOption, endType === 'until' && styles.endOptionActive]}
        onPress={() => handleEndTypeChange('until')}
      >
        <Text style={styles.endOptionText}>
          {t('recurrenceRuleEditor.until')} {rule.until?.toLocaleDateString(undefined)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderNaturalLanguageInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('recurrenceRuleEditor.smartParsing')}</Text>
      <Text style={styles.sectionSubtitle}>
        {t('recurrenceRuleEditor.smartParsingSubtitle')}
      </Text>
      <View style={styles.naturalInputRow}>
        <TextInput
          style={styles.naturalInput}
          value={naturalLanguageInput}
          onChangeText={setNaturalLanguageInput}
          placeholder={t('recurrenceRuleEditor.naturalLanguagePlaceholder')}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.parseButton}
          onPress={handleNaturalLanguageInput}
        >
          <Text style={styles.parseButtonText}>{t('recurrenceRuleEditor.parse')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPreview = () => {
    if (!isEnabled) {
      return (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>{t('recurrenceRuleEditor.preview')}</Text>
          <Text style={styles.previewText}>
            {t('recurrenceRuleEditor.noRecurrence')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('recurrenceRuleEditor.preview')}</Text>
        <Text style={styles.previewText}>{formatRecurrenceDescription(rule)}</Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelButton}>{t('recurrenceRuleEditor.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('recurrenceRuleEditor.recurrenceSettings')}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>{t('recurrenceRuleEditor.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.enableSection}>
          <Text style={styles.enableText}>{t('recurrenceRuleEditor.enableRecurrence')}</Text>
          <Switch
            value={isEnabled}
            onValueChange={setIsEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        {isEnabled && (
          <>
            {renderNaturalLanguageInput()}
            <View style={styles.divider} />
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  enableSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  enableText: {
    fontSize: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  frequencyButtonActive: {
    backgroundColor: '#007AFF',
  },
  frequencyButtonText: {
    fontSize: 14,
    color: '#333',
  },
  frequencyButtonTextActive: {
    color: '#fff',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intervalLabel: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
  },
  weekDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  weekDayButtonActive: {
    backgroundColor: '#007AFF',
  },
  weekDayButtonText: {
    fontSize: 14,
    color: '#333',
  },
  weekDayButtonTextActive: {
    color: '#fff',
  },
  endOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
  },
  endOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f2ff',
  },
  endOptionText: {
    fontSize: 16,
  },
  endOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 8,
  },
  preview: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
  },
  naturalInputRow: {
    flexDirection: 'row',
  },
  naturalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  parseButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  parseButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
}); 