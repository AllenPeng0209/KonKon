import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../lib/i18n';

export interface CalendarStyle {
  id: string;
  name: string;
  description: string;
  color: string; // 改用顏色代替emoji
}

// 從翻譯中獲取樣式名稱和描述的函數
const getStyleInfo = (styleId: string) => {
  return {
    name: t(`calendarStyles.${styleId}.name`),
    description: t(`calendarStyles.${styleId}.description`),
  };
};

// 如果翻譯不存在，使用默認值
const getDefaultStyleInfo = (styleId: string) => {
  const defaultStyles: Record<string, { name: string; description: string }> = {
    'grid-month': {
      name: 'グリッド月表示',
      description: '月全体をグリッド形式で表示'
    },
    'weekly-grid': {
      name: '週間グリッド',
      description: '週単位のグリッド表示'
    },
    'card-month': {
      name: 'カード月表示',
      description: 'カード形式の月表示'
    },
    'timeline': {
      name: 'タイムライン表示',
      description: '時系列での表示'
    },
    'agenda-list': {
      name: 'アジェンダリスト',
      description: 'リスト形式での表示'
    },
  };
  
  return defaultStyles[styleId] || { name: styleId, description: '' };
};

const CALENDAR_STYLES: CalendarStyle[] = [
  {
    id: 'grid-month',
    ...getStyleInfo('grid-month'),
    color: '#3B82F6', // 藍色
  },
  {
    id: 'weekly-grid',
    ...getStyleInfo('weekly-grid'),
    color: '#10B981', // 綠色
  },
  {
    id: 'card-month',
    ...getStyleInfo('card-month'),
    color: '#F59E0B', // 橙色
  },
  {
    id: 'timeline',
    ...getStyleInfo('timeline'),
    color: '#EF4444', // 紅色
  },
  {
    id: 'agenda-list',
    ...getStyleInfo('agenda-list'),
    color: '#8B5CF6', // 紫色
  },
];

interface CalendarStyleModalProps {
  visible: boolean;
  currentStyle: string;
  onClose: () => void;
  onStyleSelect: (style: CalendarStyle) => void;
}

export default function CalendarStyleModal({
  visible,
  currentStyle,
  onClose,
  onStyleSelect,
}: CalendarStyleModalProps) {
  const handleStyleSelect = (style: CalendarStyle) => {
    onStyleSelect(style);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 現代化的標題區域 */}
          <View style={styles.headerContainer}>
            <View style={styles.handleBar} />
            <Text style={styles.title}>{t('calendarStyleSelector.title')}</Text>
            <Text style={styles.subtitle}>
              {t('calendarStyleSelector.footerText')}
            </Text>
          </View>
          
          {/* 樣式選項列表 */}
          <ScrollView 
            style={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {CALENDAR_STYLES.map((style, index) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleOption,
                  currentStyle === style.id && styles.selectedOption,
                  index === CALENDAR_STYLES.length - 1 && styles.lastOption
                ]}
                onPress={() => handleStyleSelect(style)}
                activeOpacity={0.8}
              >
                {/* 顏色指示器 */}
                <View style={[styles.colorIndicator, { backgroundColor: style.color }]} />
                
                {/* 文字內容 */}
                <View style={styles.textContainer}>
                  <Text style={[
                    styles.styleName,
                    currentStyle === style.id && styles.selectedStyleName
                  ]}>
                    {style.name}
                  </Text>
                  <Text style={[
                    styles.styleDescription,
                    currentStyle === style.id && styles.selectedStyleDescription
                  ]}>
                    {style.description}
                  </Text>
                </View>
                
                {/* 選中狀態指示器 */}
                {currentStyle === style.id && (
                  <View style={[styles.selectedIndicator, { backgroundColor: style.color }]}>
                    <View style={styles.selectedDot} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* 底部操作區域 */}
          <View style={styles.footerContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>
                {t('common.cancel') || 'キャンセル'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  headerContainer: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    backgroundColor: '#F8FAFF',
    borderBottomColor: '#E5E7EB',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  colorIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  selectedStyleName: {
    color: '#1F2937',
  },
  styleDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  selectedStyleDescription: {
    color: '#9CA3AF',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
}); 