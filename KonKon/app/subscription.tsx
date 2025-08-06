import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription } from '@/hooks/useSubscription';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

interface FAQ {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
}

export default function SubscriptionScreen() {
  const colorScheme = useColorScheme();
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [isSubscriptionAvailable, setIsSubscriptionAvailable] = useState(false);
  
  // 安全地使用訂閱 hook
  const subscription = Platform.OS === 'ios' ? useSubscription() : {
    status: { isActive: false, isTrialActive: false },
    isLoading: false,
    isPremium: false,
    isTrialActive: false,
    trialDaysRemaining: 0,
    startSubscription: async () => false,
    cancelSubscription: async () => false,
    restorePurchases: async () => false,
    refresh: async () => {},
    hasFeature: () => false,
    showPremiumPrompt: () => false
  };

  useEffect(() => {
    // 檢查是否支持訂閱功能
    setIsSubscriptionAvailable(Platform.OS === 'ios');
  }, []);

  const styles = getStyles(colorScheme);
  const colors = Colors[colorScheme ?? 'light'];

  const handleSubscribe = async () => {
    if (!isSubscriptionAvailable) {
      Alert.alert(
        t('common.error'),
        t('subscription.errors.unavailable')
      );
      return;
    }

    try {
      const success = await subscription.startSubscription(selectedPlan);
      if (success) {
        Alert.alert(
          t('common.success'),
          t('subscription.success.activated')
        );
      }
    } catch (error) {
      console.error('訂閱失敗:', error);
      Alert.alert(
        t('common.error'),
        t('subscription.errors.failed')
      );
    }
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  // 用戶痛點場景 - 重新設計突出AI價值
  const painPoints = [
    {
      id: '1',
      text: t('subscription.painPoints.items.0'),
      avatar: require('@/assets/images/cat-avatar.png'),
    },
    {
      id: '2', 
      text: t('subscription.painPoints.items.1'),
      avatar: require('@/assets/images/cat-avatar.png'),
    },
    {
      id: '3',
      text: t('subscription.painPoints.items.2'),
      avatar: require('@/assets/images/cat-avatar.png'),
    },
    {
      id: '4',
      text: t('subscription.painPoints.items.3'),
      avatar: require('@/assets/images/cat-avatar.png'),
    },
  ];

  // 功能對比 - 重新設計突出AI價值
  const features = [
    { name: t('subscription.features.aiVoiceAssistant'), free: t('subscription.featureComparison.dailyLimit'), premium: t('subscription.featureComparison.unlimited'), isAI: true },
    { name: t('subscription.features.aiConflictDetection'), free: false, premium: true, isAI: true },
    { name: t('subscription.features.personalizedRecommendations'), free: false, premium: true, isAI: true },
    { name: t('subscription.features.multimodalAI'), free: t('subscription.featureComparison.basicVersion'), premium: t('subscription.featureComparison.professionalVersion'), isAI: true },
    { name: t('subscription.features.predictiveReminders'), free: false, premium: true, isAI: true },
    { name: t('subscription.features.familyTimeCoordination'), free: false, premium: true, isAI: true },
    { name: t('subscription.features.lifestyleAnalysis'), free: false, premium: true, isAI: true },
    { name: t('subscription.features.adFree'), free: false, premium: true, isAI: false },
    { name: t('subscription.features.premiumSupport'), free: false, premium: true, isAI: false },
  ];

  // FAQ 項目
  const faqItems = [
    {
      id: 'trial',
      question: t('subscription.faq.trial.question'),
      answer: t('subscription.faq.trial.answer')
    },
    {
      id: 'devices',
      question: t('subscription.faq.devices.question'),
      answer: t('subscription.faq.devices.answer')
    },
    {
      id: 'receipt',
      question: t('subscription.faq.receipt.question'),
      answer: t('subscription.faq.receipt.answer')
    },
    {
      id: 'sharing',
      question: t('subscription.faq.sharing.question'),
      answer: t('subscription.faq.sharing.answer')
    },
    {
      id: 'web',
      question: t('subscription.faq.web.question'),
      answer: t('subscription.faq.web.answer')
    }
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{t('subscription.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Cat Image */}
          <View style={styles.imageContainer}>
            <Image 
              source={require('@/assets/images/subscription.png')}
              style={styles.catImage}
              resizeMode="cover"
            />
          </View>

          {/* 痛點場景 */}
          <View style={styles.painPointsSection}>
            <Text style={styles.sectionTitle}>{t('subscription.painPoints.title')}</Text>
            {painPoints.map((point) => (
              <View key={point.id} style={styles.painPointItem}>
                <Image source={point.avatar} style={styles.painPointAvatar} />
                <Text style={styles.painPointText}>{point.text}</Text>
              </View>
            ))}
          </View>

          {/* 功能展示卡片 */}
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.featureCard}
          >
            <View style={styles.phoneContainer}>
              <View style={styles.phoneScreen}>
                <View style={styles.phoneStatusBar}>
                  <Text style={styles.phoneTime}>17:53</Text>
                  <View style={styles.phoneSignals} />
                </View>
                <View style={styles.phoneContent}>
                  <Text style={styles.phoneTitle}>Travel</Text>
                  <View style={styles.phoneTimeRange}>
                    <Text style={styles.phoneTimeText}>10:00</Text>
                    <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
                    <Text style={styles.phoneTimeText}>15:00</Text>
                  </View>
                  <View style={styles.phoneAttachments}>
                    <Text style={styles.attachmentText}>📎 2 attachments</Text>
                    <View style={styles.attachmentItem}>
                      <Ionicons name="document" size={16} color="#ff6b6b" />
                      <Text style={styles.attachmentName}>travel itinerary.png</Text>
                    </View>
                    <View style={styles.attachmentItem}>
                      <Ionicons name="document" size={16} color="#ff6b6b" />
                      <Text style={styles.attachmentName}>ticket.pdf</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{t('subscription.features.aiAssistantTitle')}</Text>
              <Text style={styles.featureDescription}>
                {t('subscription.features.aiAssistantDesc')}
              </Text>
              <Text style={styles.featureSubtext}>
                {t('subscription.features.aiAssistantSubtext')}
              </Text>
            </View>
          </LinearGradient>

          {/* 功能對比表 */}
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonTitle}>{t('subscription.features.title')}</Text>
            <View style={styles.comparisonTable}>
              {/* 表格標題行 */}
              <View style={[styles.comparisonRow, styles.comparisonHeaderRow]}>
                <Text numberOfLines={1} style={[styles.comparisonHeaderText, { flex: 2 }]}>{t('subscription.featureComparison.function')}</Text>
                <Text numberOfLines={1} style={[styles.comparisonHeaderText, { flex: 1, textAlign: 'left' }]}>{t('subscription.featureComparison.freeVersion')}</Text>
                <Text numberOfLines={1} style={[styles.comparisonHeaderText, { flex: 1, textAlign: 'left' }]}>{t('subscription.featureComparison.aiPremium')}</Text>
              </View>
              
              {/* 功能行 */}
              {features.map((feature, index) => (
                <View key={index} style={[
                  styles.comparisonRow,
                  feature.isAI && styles.aiFeatureRow
                ]}>
                  {/* 功能名稱單元格 */}
                  <View style={[styles.comparisonCell, styles.featureNameCell]}>
                    <View style={styles.featureNameContainer}>
                      {feature.isAI && (
                        <View style={styles.aiBadge}>
                          <Text style={styles.aiBadgeText}>AI</Text>
                        </View>
                      )}
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.featureName,
                          feature.isAI && styles.aiFeatureName
                        ]}>
                        {feature.name}
                      </Text>
                    </View>
                  </View>
                  
                  {/* 免費版狀態單元格 */}
                  <View style={styles.comparisonCell}>
                    {typeof feature.free === 'string' ? (
                      <Text numberOfLines={1} style={styles.featureStatusText}>{feature.free}</Text>
                    ) : (
                      <View style={styles.iconContainer}>
                        {feature.free ? (
                          <Ionicons name="checkmark" size={16} color="#4CAF50" />
                        ) : (
                          <Ionicons name="close" size={16} color="#ccc" />
                        )}
                      </View>
                    )}
                  </View>
                  
                  {/* Premium狀態單元格 */}
                  <View style={styles.comparisonCell}>
                    {typeof feature.premium === 'string' ? (
                      <Text numberOfLines={1} style={[styles.featureStatusText, styles.premiumText]}>{feature.premium}</Text>
                    ) : (
                      <View style={styles.iconContainer}>
                        {feature.premium ? (
                          <Ionicons name="checkmark" size={16} color="#4CAF50" />
                        ) : (
                          <Ionicons name="close" size={16} color="#ccc" />
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 定价标题 */}
          <Text style={styles.pricingTitle}>{t('subscription.pricing.title')}</Text>

          {/* 定价方案 */}
          <View style={styles.pricingSection}>
            {/* 月付方案 */}
            <TouchableOpacity
              style={[styles.pricingCard, selectedPlan === 'monthly' && styles.selectedPricingCard]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.pricingOption}>
                <View style={[styles.radioButton, selectedPlan === 'monthly' && styles.radioButtonSelected]} />
                <Text style={styles.pricingPeriod}>{t('subscription.pricing.monthly')}</Text>
              </View>
              <Text style={styles.pricingPrice}>{t('subscription.pricing.monthlyPrice')}</Text>
            </TouchableOpacity>

            {/* 年付方案 */}
            <TouchableOpacity
              style={[styles.pricingCard, styles.recommendedCard, selectedPlan === 'yearly' && styles.selectedPricingCard]}
              onPress={() => setSelectedPlan('yearly')}
            >
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>{t('subscription.pricing.saveText')}</Text>
              </View>
              <View style={styles.pricingOption}>
                <View style={[styles.radioButton, selectedPlan === 'yearly' && styles.radioButtonSelected]} />
                <View>
                  <Text style={styles.pricingPeriod}>{t('subscription.pricing.yearly')}</Text>
                  <Text style={styles.pricingSubtext}>{t('subscription.pricing.yearlyDescription')}</Text>
                </View>
              </View>
              <View style={styles.pricingPriceContainer}>
                <Text style={styles.pricingPriceMonthly}>{t('subscription.pricing.yearlyPriceMonthly')}</Text>
                <Text style={styles.pricingPriceYearly}>{t('subscription.pricing.yearlyPrice')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 订阅按钮 */}
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>{t('subscription.cta.startTrial')}</Text>
            <Text style={styles.subscribeSubtext}>{t('subscription.cta.cancelAnytime')}</Text>
          </TouchableOpacity>

          {/* 试用说明 */}
          <Text style={styles.trialNotice}>
            {t('subscription.trial.notice')}
          </Text>

          {/* 服务连结 */}
          <View style={styles.serviceLinks}>
            <TouchableOpacity>
              <Text style={styles.serviceLink}>{t('subscription.legal.privacy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.serviceLink}>{t('subscription.legal.terms')}</Text>
            </TouchableOpacity>
          </View>

          {/* FAQ 区域 */}
          <View style={styles.faqSection}>
            <Text style={styles.faqTitle}>{t('subscription.faq.title')}</Text>
            {faqItems.map((item) => (
              <View key={item.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(item.id)}
                >
                  <View style={styles.faqQuestionContainer}>
                    <Text style={styles.faqQuestionPrefix}>{t('subscription.faq.questionPrefix')}</Text>
                    <Text style={styles.faqQuestionContent}>{item.question}</Text>
                  </View>
                  <Ionicons
                    name={expandedFAQ === item.id ? "remove" : "add"}
                    size={20}
                    color={colorScheme === 'dark' ? '#fff' : '#666'}
                  />
                </TouchableOpacity>
                {expandedFAQ === item.id && (
                  <View style={styles.faqAnswer}>
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswerPrefix}>{t('subscription.faq.answerPrefix')}</Text>
                      <Text style={styles.faqAnswerContent}>{item.answer}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* 注意事项 */}
          <View style={styles.noticeSection}>
            <Text style={styles.noticeTitle}>{t('subscription.terms.title')}</Text>
            <Text style={styles.noticeText}>{t('subscription.terms.trialOnce')}</Text>
            <Text style={styles.noticeText}>{t('subscription.terms.noRefund')}</Text>
            <Text style={styles.noticeText}>{t('subscription.terms.cancel24h')}</Text>
            <Text style={styles.noticeText}>{t('subscription.terms.autoRenew')}</Text>
            <Text style={styles.noticeText}>{t('subscription.terms.appleId')}</Text>
            <Text style={styles.noticeText}>{t('subscription.terms.deleteApp')}</Text>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#fafbfc',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
      borderBottomWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    headerButton: {
      padding: 8,
      borderRadius: 16,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    headerSpacer: {
      width: 36, // 與headerButton寬度相同，保持平衡
    },
    moreButton: {
      padding: 8,
      borderRadius: 16,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
    },
    content: {
      flex: 1,
    },
    titleSection: {
      paddingHorizontal: 24,
      paddingVertical: 16, // 大幅減少標題下方的留白
      alignItems: 'center',
    },
    mainTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 28,
      letterSpacing: -0.8,
      marginBottom: 8,
    },
    imageContainer: {
      alignItems: 'center',
      paddingVertical: 8, // 大幅減少上下留白
      paddingHorizontal: 0, // 去掉左右留白
    },
    catImage: {
      width: width * 0.92, // 增加寬度，減少左右留白
      height: 320, // 增加高度以更好地顯示貓頭
      borderRadius: 20,
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
    painPointsSection: {
      paddingHorizontal: 24,
      paddingVertical: 32,
      backgroundColor: colorScheme === 'dark' ? '#111' : '#ffffff',
      marginHorizontal: 16,
      marginVertical: 16,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    painPointItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(76, 175, 80, 0.05)',
      borderRadius: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50',
    },
    painPointAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    painPointText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
      fontWeight: '500',
    },
    featureCard: {
      margin: 24,
      borderRadius: 24,
      padding: 32,
      elevation: 8,
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    phoneContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    phoneScreen: {
      width: width * 0.55,
      backgroundColor: '#fff',
      borderRadius: 28,
      padding: 20,
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    phoneStatusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    phoneTime: {
      fontSize: 15,
      fontWeight: '600',
      color: '#000',
    },
    phoneSignals: {
      flexDirection: 'row',
    },
    phoneContent: {
      alignItems: 'center',
    },
    phoneTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#4CAF50',
      marginBottom: 16,
    },
    phoneTimeRange: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderRadius: 12,
    },
    phoneTimeText: {
      fontSize: 24,
      fontWeight: '800',
      color: '#000',
      marginHorizontal: 8,
    },
    phoneAttachments: {
      alignSelf: 'stretch',
    },
    attachmentText: {
      fontSize: 14,
      color: '#4CAF50',
      marginBottom: 12,
      fontWeight: '600',
    },
    attachmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    attachmentName: {
      fontSize: 13,
      color: '#666',
      marginLeft: 8,
      fontWeight: '500',
    },
    featureTextContainer: {
      alignItems: 'center',
    },
    featureTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#fff',
      marginBottom: 12,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    featureDescription: {
      fontSize: 17,
      color: '#fff',
      textAlign: 'center',
      marginBottom: 8,
      fontWeight: '600',
      opacity: 0.95,
    },
    featureSubtext: {
      fontSize: 15,
      color: '#fff',
      textAlign: 'center',
      opacity: 0.85,
      fontWeight: '500',
    },
    solutionSection: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
      backgroundColor: colorScheme === 'dark' ? '#111' : '#ffffff',
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    userQuote: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255, 193, 7, 0.1)',
      borderRadius: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#FFC107',
    },
    quoteAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    quoteText: {
      fontSize: 17,
      color: colors.text,
      fontWeight: '600',
      fontStyle: 'italic',
    },
    solutionButton: {
      backgroundColor: '#4CAF50',
      paddingHorizontal: 40,
      paddingVertical: 18,
      borderRadius: 30,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    solutionButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    trialText: {
      fontSize: 15,
      color: colors.icon,
      fontWeight: '500',
    },
    comparisonSection: {
      paddingHorizontal: 24,
      paddingVertical: 32,
      backgroundColor: colorScheme === 'dark' ? '#111' : '#ffffff',
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    comparisonTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    comparisonTable: {
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f8f9fa',
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    comparisonRow: {
      flexDirection: 'row',
      paddingVertical: 14,
      paddingHorizontal: 0,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? '#333' : '#e9ecef',
      alignItems: 'center',
    },
    comparisonHeaderRow: {
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f9fa',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderBottomWidth: 2,
      borderBottomColor: colorScheme === 'dark' ? '#444' : '#ddd',
    },
    comparisonCell: {
      flex: 1,
      justifyContent: 'left',
      alignItems: 'left',
      minHeight: 10,
      paddingLeft: 0,
    },
    comparisonHeaderText: {
      fontWeight: '700',
      color: colors.text,
      fontSize: 13,
      textAlign: 'left',
    },
    aiFeatureRow: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(76, 175, 80, 0.05)',
    },
    featureNameCell: {
      flex: 2,
      alignItems: 'flex-start',
      paddingLeft: 12,
    },
    featureNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    featureName: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
      flexShrink: 1,
    },
    aiFeatureName: {
      fontWeight: '700',
      color: '#4CAF50',
    },
    aiBadge: {
      backgroundColor: '#4CAF50',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      marginRight: 6,
      minWidth: 24,
      alignItems: 'center',
    },
    aiBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
    featureStatusText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'left',
    },
    premiumText: {
      color: '#4CAF50',
      fontWeight: '700',
    },
    pricingTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      paddingHorizontal: 24,
      marginTop: 32,
      marginBottom: 32,
      letterSpacing: -0.3,
    },
    pricingSection: {
      paddingHorizontal: 24,
    },
    pricingCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: 18,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    recommendedCard: {
      position: 'relative',
      backgroundColor: colorScheme === 'dark' ? '#1a4a3a' : '#e8f5e8',
    },
    selectedPricingCard: {
      borderColor: '#4CAF50',
      shadowColor: '#4CAF50',
      shadowOpacity: 0.3,
    },
    recommendedBadge: {
      position: 'absolute',
      top: -12,
      left: 20,
      backgroundColor: '#4CAF50',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    recommendedText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    pricingOption: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#ccc',
      marginRight: 16,
    },
    radioButtonSelected: {
      borderColor: '#4CAF50',
      backgroundColor: '#4CAF50',
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 3,
    },
    pricingPeriod: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    pricingSubtext: {
      fontSize: 13,
      color: colors.icon,
      fontWeight: '500',
    },
    pricingPrice: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    pricingPriceContainer: {
      alignItems: 'flex-end',
    },
    pricingPriceMonthly: {
      fontSize: 14,
      color: colors.icon,
      fontWeight: '500',
    },
    pricingPriceYearly: {
      fontSize: 20,
      fontWeight: '800',
      color: '#4CAF50',
    },
    subscribeButton: {
      backgroundColor: '#4CAF50',
      marginHorizontal: 24,
      marginTop: 32,
      paddingVertical: 20,
      borderRadius: 30,
      alignItems: 'center',
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    subscribeButtonText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    subscribeSubtext: {
      color: '#fff',
      fontSize: 15,
      opacity: 0.9,
      marginTop: 6,
      fontWeight: '500',
    },
    trialNotice: {
      textAlign: 'center',
      color: colors.icon,
      fontSize: 14,
      paddingHorizontal: 24,
      marginTop: 20,
      fontWeight: '500',
      opacity: 0.8,
    },
    serviceLinks: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    serviceLink: {
      color: Colors.light.tint,
      fontSize: 15,
      textDecorationLine: 'underline',
      fontWeight: '600',
    },
    faqSection: {
      paddingHorizontal: 24,
      paddingVertical: 32,
      backgroundColor: colorScheme === 'dark' ? '#111' : '#ffffff',
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    faqTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    faqItem: {
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      borderRadius: 12,
      marginBottom: 8,
      overflow: 'hidden',
    },
    faqQuestion: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    faqQuestionContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
    },
    faqQuestionPrefix: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginRight: 8,
    },
    faqQuestionText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
    },
    faqQuestionContent: {
      flexShrink: 1,
    },
    faqAnswer: {
      paddingBottom: 20,
      paddingHorizontal: 16,
      backgroundColor: colorScheme === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
    },
    faqAnswerContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    faqAnswerPrefix: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginRight: 8,
    },
    faqAnswerContent: {
      fontSize: 15,
      color: colors.icon,
      lineHeight: 22,
      marginBottom: 6,
      fontWeight: '500',
      flexShrink: 1,
    },
    noticeSection: {
      paddingHorizontal: 24,
      paddingVertical: 24,
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f8f9fa',
      marginHorizontal: 24,
      marginBottom: 32,
      borderRadius: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#FF9800',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    noticeTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    noticeText: {
      fontSize: 13,
      color: colors.icon,
      lineHeight: 20,
      marginBottom: 6,
      fontWeight: '500',
    },
    iconContainer: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
  } as any);
}; 