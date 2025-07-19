// 記帳表單組件 - 日本家庭記帳功能核心
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  FinanceTransaction, 
  FinanceAccount, 
  FinanceCategory,
  FinanceTransactionService,
  FinanceAccountService,
  FinanceCategoryService 
} from '@/lib/financeService';
import { useFamily } from '@/contexts/FamilyContext';

interface TransactionFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTransaction?: FinanceTransaction;
  defaultType?: 'income' | 'expense';
}

export default function TransactionForm({
  visible,
  onClose,
  onSuccess,
  editTransaction,
  defaultType = 'expense'
}: TransactionFormProps) {
  const { currentFamily, currentMember } = useFamily();
  
  // 表單狀態
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAccount, setSelectedAccount] = useState<FinanceAccount | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FinanceCategory | null>(null);
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // 數據狀態
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 模態框狀態
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // 載入初始數據
  useEffect(() => {
    if (visible && currentFamily) {
      loadAccounts();
      loadCategories();
    }
  }, [visible, currentFamily]);

  // 編輯模式初始化
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type as 'income' | 'expense');
      setAmount(editTransaction.amount.toString());
      setDescription(editTransaction.description || '');
      setNotes(editTransaction.notes || '');
      setSelectedDate(new Date(editTransaction.transaction_date));
      setLocation(editTransaction.location || '');
      setTags(editTransaction.tags || '');
      setIsRecurring(editTransaction.is_recurring);
    } else {
      resetForm();
    }
  }, [editTransaction]);

  const loadAccounts = async () => {
    if (!currentFamily) return;
    try {
      const accountsData = await FinanceAccountService.getByFamily(currentFamily.id);
      setAccounts(accountsData);
      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0]);
      }
    } catch (error) {
      console.error('載入帳戶失敗:', error);
    }
  };

  const loadCategories = async () => {
    if (!currentFamily) return;
    try {
      const categoriesData = await FinanceCategoryService.getByType(currentFamily.id, type);
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0]);
      }
    } catch (error) {
      console.error('載入分類失敗:', error);
    }
  };

  // 當類型變更時重新載入分類
  useEffect(() => {
    if (currentFamily) {
      loadCategories();
      setSelectedCategory(null);
    }
  }, [type, currentFamily]);

  const resetForm = () => {
    setType(defaultType);
    setAmount('');
    setDescription('');
    setNotes('');
    setSelectedDate(new Date());
    setSelectedAccount(accounts[0] || null);
    setSelectedCategory(null);
    setLocation('');
    setTags('');
    setIsRecurring(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const transactionData = {
        family_id: currentFamily!.id,
        account_id: selectedAccount!.id,
        category_id: selectedCategory!.id,
        member_id: currentMember!.id,
        amount: parseFloat(amount),
        type,
        description: description.trim(),
        notes: notes.trim() || undefined,
        transaction_date: selectedDate.toISOString().split('T')[0],
        location: location.trim() || undefined,
        tags: tags.trim() || undefined,
        is_recurring: isRecurring,
        status: 'completed' as const
      };

      if (editTransaction) {
        await FinanceTransactionService.update(editTransaction.id, transactionData);
      } else {
        await FinanceTransactionService.create(transactionData);
      }

      Alert.alert(
        '成功',
        editTransaction ? '交易已更新' : '記帳完成',
        [{ text: '確定', onPress: () => {
          onSuccess();
          onClose();
          resetForm();
        }}]
      );
    } catch (error) {
      console.error('提交交易失敗:', error);
      Alert.alert('錯誤', '提交失敗，請稍後重試');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!currentFamily || !currentMember) {
      Alert.alert('錯誤', '請先選擇家庭');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('錯誤', '請輸入有效金額');
      return false;
    }
    if (!selectedAccount) {
      Alert.alert('錯誤', '請選擇帳戶');
      return false;
    }
    if (!selectedCategory) {
      Alert.alert('錯誤', '請選擇分類');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('錯誤', '請輸入交易描述');
      return false;
    }
    return true;
  };

  const formatAmount = (text: string) => {
    // 格式化金額輸入，支持小數點
    const cleanText = text.replace(/[^0-9.]/g, '');
    const parts = cleanText.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts[1];
    }
    return cleanText;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 標題欄 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {editTransaction ? '編輯交易' : '新增記錄'}
          </Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={isLoading}
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          >
            <Text style={[styles.saveButtonText, isLoading && styles.saveButtonTextDisabled]}>
              {isLoading ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 收入/支出切換 */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                styles.expenseButton,
                type === 'expense' && styles.typeButtonActive
              ]}
              onPress={() => setType('expense')}
            >
              <Ionicons 
                name="remove-circle" 
                size={20} 
                color={type === 'expense' ? '#FFFFFF' : '#EF4444'} 
              />
              <Text style={[
                styles.typeButtonText,
                type === 'expense' && styles.typeButtonTextActive
              ]}>
                支出
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                styles.incomeButton,
                type === 'income' && styles.typeButtonActive
              ]}
              onPress={() => setType('income')}
            >
              <Ionicons 
                name="add-circle" 
                size={20} 
                color={type === 'income' ? '#FFFFFF' : '#10B981'} 
              />
              <Text style={[
                styles.typeButtonText,
                type === 'income' && styles.typeButtonTextActive
              ]}>
                收入
              </Text>
            </TouchableOpacity>
          </View>

          {/* 金額輸入 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>金額 *</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>¥</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(text) => setAmount(formatAmount(text))}
                placeholder="0"
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>
          </View>

          {/* 帳戶選擇 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>帳戶 *</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowAccountPicker(true)}
            >
              <View style={styles.selectorContent}>
                <Text style={styles.selectorText}>
                  {selectedAccount ? selectedAccount.name : '選擇帳戶'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* 分類選擇 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>分類 *</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowCategoryPicker(true)}
            >
              <View style={styles.selectorContent}>
                {selectedCategory && (
                  <View style={[
                    styles.categoryIndicator,
                    { backgroundColor: selectedCategory.color }
                  ]} />
                )}
                <Text style={styles.selectorText}>
                  {selectedCategory ? selectedCategory.name : '選擇分類'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* 描述輸入 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>描述 *</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="請輸入交易描述"
              maxLength={100}
            />
          </View>

          {/* 日期選擇 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>日期</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="calendar" size={16} color="#6B7280" />
                <Text style={styles.selectorText}>
                  {selectedDate.toLocaleDateString('ja-JP')}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* 詳細信息（可折疊） */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>詳細信息</Text>
            
            {/* 地點 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>地點</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="購物地點、商店名稱等"
                maxLength={100}
              />
            </View>

            {/* 備註 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>備註</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="額外備註信息"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            {/* 標籤 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>標籤</Text>
              <TextInput
                style={styles.textInput}
                value={tags}
                onChangeText={setTags}
                placeholder="標籤，用逗號分隔"
                maxLength={100}
              />
            </View>

            {/* 週期性交易 */}
            <View style={styles.switchRow}>
              <Text style={styles.inputLabel}>週期性交易</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={isRecurring ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </View>
        </ScrollView>

        {/* 日期選擇器 */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        {/* 帳戶選擇模態框 */}
        <Modal
          visible={showAccountPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAccountPicker(false)}
        >
          <AccountPickerModal
            accounts={accounts}
            selectedAccount={selectedAccount}
            onSelect={(account) => {
              setSelectedAccount(account);
              setShowAccountPicker(false);
            }}
            onClose={() => setShowAccountPicker(false)}
          />
        </Modal>

        {/* 分類選擇模態框 */}
        <Modal
          visible={showCategoryPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <CategoryPickerModal
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={(category) => {
              setSelectedCategory(category);
              setShowCategoryPicker(false);
            }}
            onClose={() => setShowCategoryPicker(false)}
          />
        </Modal>
      </View>
    </Modal>
  );
}

// 帳戶選擇組件
function AccountPickerModal({ 
  accounts, 
  selectedAccount, 
  onSelect, 
  onClose 
}: {
  accounts: FinanceAccount[];
  selectedAccount: FinanceAccount | null;
  onSelect: (account: FinanceAccount) => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.pickerContainer}>
      <View style={styles.pickerHeader}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.pickerCloseButton}>關閉</Text>
        </TouchableOpacity>
        <Text style={styles.pickerTitle}>選擇帳戶</Text>
        <View style={styles.pickerHeaderRight} />
      </View>
      
      <ScrollView style={styles.pickerContent}>
        {accounts.map(account => (
          <TouchableOpacity
            key={account.id}
            style={[
              styles.pickerItem,
              selectedAccount?.id === account.id && styles.pickerItemSelected
            ]}
            onPress={() => onSelect(account)}
          >
            <View style={styles.accountItem}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountType}>
                  {getAccountTypeText(account.type)} • ¥{account.balance.toLocaleString()}
                </Text>
              </View>
              {selectedAccount?.id === account.id && (
                <Ionicons name="checkmark" size={20} color="#3B82F6" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// 分類選擇組件
function CategoryPickerModal({ 
  categories, 
  selectedCategory, 
  onSelect, 
  onClose 
}: {
  categories: FinanceCategory[];
  selectedCategory: FinanceCategory | null;
  onSelect: (category: FinanceCategory) => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.pickerContainer}>
      <View style={styles.pickerHeader}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.pickerCloseButton}>關閉</Text>
        </TouchableOpacity>
        <Text style={styles.pickerTitle}>選擇分類</Text>
        <View style={styles.pickerHeaderRight} />
      </View>
      
      <ScrollView style={styles.pickerContent}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.pickerItem,
              selectedCategory?.id === category.id && styles.pickerItemSelected
            ]}
            onPress={() => onSelect(category)}
          >
            <View style={styles.categoryItem}>
              <View style={[
                styles.categoryIndicator,
                { backgroundColor: category.color }
              ]} />
              <Text style={styles.categoryName}>{category.name}</Text>
              {selectedCategory?.id === category.id && (
                <Ionicons name="checkmark" size={20} color="#3B82F6" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// 帳戶類型文本
function getAccountTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    bank: '銀行帳戶',
    cash: '現金',
    credit_card: '信用卡',
    savings: '儲蓄帳戶',
    investment: '投資帳戶',
    other: '其他'
  };
  return typeMap[type] || type;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: '#E5E7EB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeToggle: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  expenseButton: {
    backgroundColor: 'transparent',
  },
  incomeButton: {
    backgroundColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#374151',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  selector: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  notesInput: {
    height: 80,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  pickerCloseButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  pickerHeaderRight: {
    width: 40,
  },
  pickerContent: {
    flex: 1,
  },
  pickerItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
});