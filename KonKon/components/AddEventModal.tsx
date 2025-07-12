import { CreateEventData } from '@/hooks/useEvents';
import { t } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const eventTypes = [
  { label: t('addEventModal.eventType_calendar'), value: 'calendar', icon: '🔔' },
  { label: t('addEventModal.eventType_idea'), value: 'idea', icon: '💡' },
  { label: t('addEventModal.eventType_mood'), value: 'mood', icon: '❤️' },
];

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (eventData: CreateEventData) => Promise<void>;
  initialDate?: Date;
  userFamilies?: Array<{id: string, name: string}>;
  editingEvent?: any;
  onUpdate?: (eventId: string, eventData: CreateEventData) => Promise<void>;
}

export default function AddEventModal({ 
  visible, 
  onClose, 
  onSave, 
  initialDate,
  userFamilies = [],
  editingEvent = null,
  onUpdate
}: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('personal');
  const [type, setType] = useState('calendar');

  const colorOptions = [
    { name: t('addEventModal.color_blue'), value: '#007AFF' },
    { name: t('addEventModal.color_red'), value: '#FF3B30' },
    { name: t('addEventModal.color_green'), value: '#34C759' },
    { name: t('addEventModal.color_orange'), value: '#FF9500' },
    { name: t('addEventModal.color_purple'), value: '#AF52DE' },
    { name: t('addEventModal.color_pink'), value: '#FF2D92' },
  ];
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);

  useEffect(() => {
    if (visible) {
      if (editingEvent) {
        setTitle(editingEvent.title || '');
        setDescription(editingEvent.description || '');
        setLocation(editingEvent.location || '');
        setSelectedColor(editingEvent.color || colorOptions[0].value);
        setType(editingEvent.type || 'calendar');
        
        const eventDate = new Date(editingEvent.start_ts * 1000);
        setDate(eventDate);
        
        const formatTime = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        setStartTime(formatTime(new Date(editingEvent.start_ts * 1000)));
        setEndTime(formatTime(new Date(editingEvent.end_ts * 1000)));
        
        if (editingEvent.shared_families && editingEvent.shared_families.length > 0) {
          setSelectedCalendar(editingEvent.shared_families[0]);
        } else {
          setSelectedCalendar('personal');
        }
      } else {
        resetForm();
      }
    }
  }, [visible, editingEvent]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(initialDate || new Date());
    setStartTime('');
    setEndTime('');
    setLocation('');
    setAllDay(false);
    setSelectedColor(colorOptions[0].value);
    setType('calendar');
    setSelectedCalendar('personal');
  };

  const formatTimeInput = (text: string): string => {
    const numbers = text.replace(/[^\d]/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
    }
  };

  const handleStartTimeChange = (text: string) => {
    const formattedTime = formatTimeInput(text);
    setStartTime(formattedTime);
  };

  const handleEndTimeChange = (text: string) => {
    const formattedTime = formatTimeInput(text);
    setEndTime(formattedTime);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('addEventModal.error'), t('addEventModal.titleRequired'));
      return;
    }

    if (!allDay && startTime && !isValidTime(startTime)) {
      Alert.alert(t('addEventModal.error'), t('addEventModal.invalidStartTime'));
      return;
    }

    if (!allDay && endTime && !isValidTime(endTime)) {
      Alert.alert(t('addEventModal.error'), t('addEventModal.invalidEndTime'));
      return;
    }

    if (!allDay && startTime && endTime) {
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);
      if (end <= start) {
        Alert.alert(t('addEventModal.error'), t('addEventModal.endTimeAfterStartTime'));
        return;
      }
    }

    setLoading(true);
    try {
      const eventData: CreateEventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        date: date,
        startTime: allDay ? undefined : startTime || undefined,
        endTime: allDay ? undefined : endTime || undefined,
        location: location.trim() || undefined,
        color: selectedColor,
        shareToFamilies: selectedCalendar === 'personal' ? undefined : [selectedCalendar],
        type,
      };

      if (editingEvent && onUpdate) {
        await onUpdate(editingEvent.id, eventData);
      } else {
        await onSave(eventData);
      }
      
      handleClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : editingEvent ? t('addEventModal.updateFailed') : t('addEventModal.saveFailed');
      Alert.alert(t('addEventModal.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isValidTime = (time: string): boolean => {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

  const adjustDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.topIndicator} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Text style={styles.cancelButton}>✕</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{editingEvent ? t('addEventModal.editEvent') : t('addEventModal.createEvent')}</Text>
            <Text style={styles.subtitle}>{t('addEventModal.recordGoodTimes')}</Text>
          </View>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={loading}
            style={[styles.headerButton, styles.saveButtonContainer, loading && styles.saveButtonDisabled]}
          >
            <Text style={[styles.saveButton, loading && styles.saveButtonTextDisabled]}>
              {loading ? t('addEventModal.saving') : (editingEvent ? t('addEventModal.update') : t('addEventModal.save'))}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.dateSelector}>
            <TouchableOpacity onPress={() => adjustDate(-1)} style={styles.arrowButton}>
              <Text style={styles.arrowText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            <TouchableOpacity onPress={() => adjustDate(1)} style={styles.arrowButton}>
              <Text style={styles.arrowText}>▶</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.eventTypeContainer}>
            {eventTypes.map(item => (
              <TouchableOpacity
                key={item.value}
                style={[styles.eventTypeButton, type === item.value && styles.eventTypeButtonSelected]}
                onPress={() => setType(item.value)}
              >
                <Text style={styles.eventTypeIcon}>{item.icon}</Text>
                <Text style={styles.eventTypeText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('addEventModal.title')}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t('addEventModal.titlePlaceholder')}
              placeholderTextColor="#c7c7cd"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('addEventModal.description')}</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('addEventModal.descriptionPlaceholder')}
              placeholderTextColor="#c7c7cd"
              multiline
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.label}>{t('addEventModal.allDay')}</Text>
            <Switch
              value={allDay}
              onValueChange={setAllDay}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={allDay ? "#f5dd4b" : "#f4f3f4"}
            />
          </View>

          {!allDay && (
            <View style={styles.timeInputContainer}>
              <TextInput
                style={styles.timeInput}
                value={startTime}
                onChangeText={handleStartTimeChange}
                placeholder="09:00"
                keyboardType="numeric"
                maxLength={5}
              />
              <Text style={styles.timeSeparator}>-</Text>
              <TextInput
                style={styles.timeInput}
                value={endTime}
                onChangeText={handleEndTimeChange}
                placeholder="10:00"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('addEventModal.location')}</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder={t('addEventModal.locationPlaceholder')}
              placeholderTextColor="#c7c7cd"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('addEventModal.color')}</Text>
            <View style={styles.colorContainer}>
              {colorOptions.map(color => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.value },
                    selectedColor === color.value && styles.selectedColor,
                  ]}
                  onPress={() => setSelectedColor(color.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('addEventModal.share')}</Text>
            <View style={styles.calendarSelector}>
              <TouchableOpacity
                style={[
                  styles.calendarButton,
                  selectedCalendar === 'personal' && styles.calendarButtonSelected
                ]}
                onPress={() => setSelectedCalendar('personal')}
              >
                <Text style={styles.calendarButtonText}>{t('addEventModal.personal')}</Text>
              </TouchableOpacity>
              {userFamilies.map(family => (
                <TouchableOpacity
                  key={family.id}
                  style={[
                    styles.calendarButton,
                    selectedCalendar === family.id && styles.calendarButtonSelected
                  ]}
                  onPress={() => setSelectedCalendar(family.id)}
                >
                  <Text style={styles.calendarButtonText}>{family.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 20,
  },
  topIndicator: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: {
    padding: 8,
  },
  cancelButton: {
    fontSize: 24,
    color: '#888',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  saveButtonContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  saveButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    backgroundColor: '#a0c7ff',
  },
  saveButtonTextDisabled: {
    color: '#e0e0e0',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  arrowButton: {
    padding: 10,
  },
  arrowText: {
    fontSize: 20,
    color: '#007AFF',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  eventTypeButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  eventTypeButtonSelected: {
    backgroundColor: '#007AFF',
  },
  eventTypeIcon: {
    fontSize: 24,
  },
  eventTypeText: {
    marginTop: 5,
    color: '#000',
  },
  inputGroup: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  timeSeparator: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  colorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calendarSelector: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  calendarButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    marginRight: 10,
  },
  calendarButtonSelected: {
    backgroundColor: '#007AFF',
  },
  calendarButtonText: {
    fontSize: 16,
    color: '#000',
  },
}); 