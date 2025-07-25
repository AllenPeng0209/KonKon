import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { Tables, TablesInsert } from '../../lib/database.types';

type Expense = Tables<'expenses'>;
type ExpenseInsert = TablesInsert<'expenses'>;

interface AddExpenseModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (expense: ExpenseInsert) => void;
  editingExpense: Expense | null;
  selectedDate: Date | null;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isVisible,
  onClose,
  onSave,
  editingExpense,
  selectedDate,
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { user } = useAuth();
  const { userFamily } = useFamily();

  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setDescription(editingExpense.description || '');
      setDate(new Date(editingExpense.date));
      setType(editingExpense.type as 'income' | 'expense');
    } else {
      resetForm();
      if (selectedDate) {
        setDate(selectedDate);
      }
    }
  }, [editingExpense, isVisible, selectedDate]);

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date());
    setType('expense');
  };

  const handleSave = () => {
    if (!amount || !category) {
      Alert.alert(t('addExpenseModal.error'), t('addExpenseModal.amountCategoryRequired'));
      return;
    }
    if (!user || !user.id) {
      Alert.alert(t('addExpenseModal.error'), t('addExpenseModal.invalidUser'));
      return;
    }

    const expenseData: ExpenseInsert = {
      user_id: user.id,
      family_id: userFamily?.id || null,
      date: date.toISOString().split('T')[0],
      amount: parseFloat(amount),
      category,
      description,
      type,
    };

    onSave(expenseData);
    resetForm();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <BlurView intensity={30} style={styles.blurContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredView}
          keyboardVerticalOffset={20}
        >
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#999" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingExpense ? t('addExpenseModal.editExpense') : t('addExpenseModal.addExpense')}
            </Text>
            <ScrollView style={styles.formContainer}>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'expense' && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType('expense')}
                >
                  <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextSelected]}>{t('addExpenseModal.expense')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'income' && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType('income')}
                >
                  <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextSelected]}>{t('addExpenseModal.income')}</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder={t('addExpenseModal.amount')}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder={t('addExpenseModal.categoryPlaceholder')}
                value={category}
                onChangeText={setCategory}
              />
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder={t('addExpenseModal.description')}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {t('addExpenseModal.selectDate', { date: date.toLocaleDateString() })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </ScrollView>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{t('addExpenseModal.save')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-around',
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
  },
  typeButtonSelected: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  typeButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  datePickerButton: {
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    elevation: 2,
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
});

export default AddExpenseModal; 