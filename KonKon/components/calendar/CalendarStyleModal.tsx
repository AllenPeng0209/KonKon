import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../lib/i18n';

export interface CalendarStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// 從翻譯中獲取樣式名稱和描述的函數
const getStyleInfo = (styleId: string) => {
  const styleKey = styleId.replace('-', '');
  
  // 將樣式 ID 轉換為對應的翻譯鍵
  const styleKeyMap: { [key: string]: string } = {
    'gridmonth': 'gridMonth',
    'weeklygrid': 'weeklyGrid', 
    'cardmonth': 'cardMonth',
    'agendalist': 'agendaList',
    'timeline': 'timeline',
    'dayfocus': 'dayFocus',
    'compactmonth': 'compactMonth',
    'threedayview': 'threeDayView',
    'familygrid': 'familyGrid',
    'familyorbit': 'familyOrbit',
    'familypuzzle': 'familyPuzzle',
    'familygarden': 'familyGarden',
    'yearoverview': 'yearOverview',
    'cloudfloating': 'cloudFloating',
    'constellationwheel': 'constellationWheel',
    'subwaymap': 'subwayMap',
    'gardenplant': 'gardenPlant',
    'puzzlepiece': 'puzzlePiece',
    'fishingpond': 'fishingPond',
    'spaceexploration': 'spaceExploration',
    'treasuremap': 'treasureMap',
    'heatmap': 'heatmap',
    'ganttchart': 'ganttChart',
    'heartbeat': 'heartbeat',
    'bubblechart': 'bubbleChart',
    'seasonallandscape': 'seasonalLandscape',
    'bookshelf': 'bookshelf',
    'musicstaff': 'musicStaff',
    'kitchenrecipe': 'kitchenRecipe',
    'runningtrack': 'runningTrack',
    'mooddiary': 'moodDiary',
    'fitnesschallenge': 'fitnessChallenge',
    'cube3d': 'cube3d',
    'aiprediction': 'aiPrediction',
    'arview': 'arView',
    'seasonalharmony': 'seasonalHarmony',
    'familynotebook': 'familyNotebook',
    'bentobox': 'bentoBox',
    'origamicalendar': 'origamiCalendar',
    'ryokanstyle': 'ryokanStyle'
  };
  
  const translationKey = styleKeyMap[styleKey] || styleKey;
  return {
    name: t(`calendarStyleSelector.styles.${translationKey}` as any),
    description: t(`calendarStyleSelector.styles.${translationKey}` as any) // 暫時使用相同的翻譯
  };
};

const CALENDAR_STYLES: CalendarStyle[] = [
  {
    id: 'grid-month',
    ...getStyleInfo('grid-month'),
    icon: '📅',
  },
  {
    id: 'weekly-grid',
    ...getStyleInfo('weekly-grid'),
    icon: '📊',
  },
  {
    id: 'card-month',
    ...getStyleInfo('card-month'),
    icon: '🎴',
  },
  {
    id: 'timeline',
    ...getStyleInfo('timeline'),
    icon: '⏰',
  },
  {
    id: 'agenda-list',
    ...getStyleInfo('agenda-list'),
    icon: '📋',
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
            <Text style={styles.modalTitle}>{t('calendarStyleSelector.title')}</Text>
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
              {t('calendarStyleSelector.footerText')}
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