import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface CalendarStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const CALENDAR_STYLES: CalendarStyle[] = [
  {
    id: 'grid-month',
    name: '網格月視圖',
    description: '經典的月份網格日曆',
    icon: '📅',
  },
  {
    id: 'weekly-grid',
    name: '週視圖',
    description: '按小時顯示的週日曆',
    icon: '📊',
  },
  {
    id: 'card-month',
    name: '卡片月視圖',
    description: '卡片式的月份展示',
    icon: '🎴',
  },
  {
    id: 'timeline',
    name: '時間軸視圖',
    description: '單日時間軸展示',
    icon: '⏰',
  },
  {
    id: 'event-stream',
    name: '事件流視圖',
    description: '流式事件列表展示',
    icon: '🌊',
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
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>選擇日曆樣式</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.styleList} showsVerticalScrollIndicator={false}>
            {CALENDAR_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleItem,
                  currentStyle === style.id && styles.selectedStyleItem,
                ]}
                onPress={() => handleStyleSelect(style)}
                activeOpacity={0.7}
              >
                <View style={styles.styleIcon}>
                  <Text style={styles.iconText}>{style.icon}</Text>
                </View>
                
                <View style={styles.styleContent}>
                  <Text style={[
                    styles.styleName,
                    currentStyle === style.id && styles.selectedStyleName,
                  ]}>
                    {style.name}
                  </Text>
                  <Text style={[
                    styles.styleDescription,
                    currentStyle === style.id && styles.selectedStyleDescription,
                  ]}>
                    {style.description}
                  </Text>
                </View>
                
                {currentStyle === style.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Text style={styles.footerText}>
              長按日曆中心區域可重新打開此選單
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  styleList: {
    paddingVertical: 8,
  },
  styleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  selectedStyleItem: {
    backgroundColor: '#eff6ff',
    borderBottomColor: '#dbeafe',
  },
  styleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  styleContent: {
    flex: 1,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedStyleName: {
    color: '#3b82f6',
  },
  styleDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  selectedStyleDescription: {
    color: '#60a5fa',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 