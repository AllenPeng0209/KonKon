import { useAuth } from '@/contexts/AuthContext';
import type { MealPlan } from '@/lib/mealService';
import mealService from '@/lib/mealService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface NutritionEntry {
  date: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ meal?: string; time?: string }>();
  
  const [activeTab, setActiveTab] = useState<'recipes' | 'details' | 'nutrition'>('recipes');
  const [selectedRecipe, setSelectedRecipe] = useState<MealPlan | null>(null);
  const [availableRecipes, setAvailableRecipes] = useState<MealPlan[]>([]);
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [calorieInput, setCalorieInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const mealTypeInfo = {
    breakfast: { emoji: '🌅', name: '早餐', time: '08:00' },
    lunch: { emoji: '☀️', name: '午餐', time: '12:30' },
    dinner: { emoji: '🌆', name: '晚餐', time: '18:30' },
    snack: { emoji: '🍰', name: '點心', time: '15:00' },
  };

  const currentMeal = params.meal as keyof typeof mealTypeInfo || 'lunch';
  const mealInfo = mealTypeInfo[currentMeal];

  useEffect(() => {
    loadRecipes();
    loadNutritionEntries();
  }, [currentMeal]);

  const loadRecipes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const recipes = await mealService.generateLunchSuggestions(user.id, {
        servings: 2,
        available_time: 15,
        cuisine_preference: '家常'
      });
      setAvailableRecipes(recipes);
      if (recipes.length > 0) {
        setSelectedRecipe(recipes[0]);
      }
    } catch (error) {
      console.error('載入菜譜失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNutritionEntries = () => {
    // 模擬載入營養記錄
    const mockEntries: NutritionEntry[] = [
      {
        date: new Date().toISOString().split('T')[0],
        mealType: currentMeal,
        calories: 485,
        protein: 25,
        carbs: 55,
        fat: 12,
        notes: '今天的便當很香'
      }
    ];
    setNutritionEntries(mockEntries);
  };

  const handleRecipeSelect = (recipe: MealPlan) => {
    setSelectedRecipe(recipe);
    setActiveTab('details');
  };

  const handleSaveNutrition = () => {
    if (!calorieInput) {
      Alert.alert('提示', '請輸入卡路里數值');
      return;
    }

    const newEntry: NutritionEntry = {
      date: new Date().toISOString().split('T')[0],
      mealType: currentMeal,
      calories: parseInt(calorieInput),
      protein: Math.round(parseInt(calorieInput) * 0.15), // 估算
      carbs: Math.round(parseInt(calorieInput) * 0.5),
      fat: Math.round(parseInt(calorieInput) * 0.3),
      notes: notesInput
    };

    setNutritionEntries([newEntry, ...nutritionEntries]);
    setCalorieInput('');
    setNotesInput('');
    Alert.alert('成功', '營養記錄已保存');
  };

  const renderRecipesList = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>
        {mealInfo.emoji} 選擇{mealInfo.name}菜譜
      </Text>
      {availableRecipes.map((recipe) => (
        <TouchableOpacity
          key={recipe.id}
          style={[
            styles.recipeCard,
            selectedRecipe?.id === recipe.id && styles.selectedRecipeCard
          ]}
          onPress={() => handleRecipeSelect(recipe)}
        >
          <View style={styles.recipeCardHeader}>
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName}>{recipe.title}</Text>
              <Text style={styles.recipeSubInfo}>
                {recipe.cuisine_type} · {recipe.servings}人份 · ⏱️ {recipe.cooking_time}分鐘
              </Text>
            </View>
            <View style={styles.recipeNutrition}>
              <Text style={styles.caloriesText}>{recipe.nutrition.calories}</Text>
              <Text style={styles.caloriesUnit}>卡</Text>
            </View>
          </View>
          <View style={styles.recipeTags}>
            {recipe.tags.map((tag) => (
              <Text key={tag} style={styles.recipeTag}>#{tag}</Text>
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderRecipeDetails = () => {
    if (!selectedRecipe) {
      return (
        <View style={styles.noRecipeContainer}>
          <Text style={styles.noRecipeText}>請先選擇一個菜譜</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.recipeDetailsContainer}>
          {/* 菜譜標題 */}
          <Text style={styles.recipeTitle}>{selectedRecipe.title}</Text>
          <Text style={styles.recipeSubtitle}>
            {selectedRecipe.cuisine_type} · {selectedRecipe.servings}人份 · ⏱️ {selectedRecipe.cooking_time}分鐘 · {'⭐'.repeat(selectedRecipe.difficulty)}
          </Text>

          {/* 營養信息 */}
          <View style={styles.nutritionInfo}>
            <Text style={styles.nutritionTitle}>營養成分</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedRecipe.nutrition.calories}</Text>
                <Text style={styles.nutritionLabel}>卡路里</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedRecipe.nutrition.protein}g</Text>
                <Text style={styles.nutritionLabel}>蛋白質</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedRecipe.nutrition.carbs}g</Text>
                <Text style={styles.nutritionLabel}>碳水</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedRecipe.nutrition.fat}g</Text>
                <Text style={styles.nutritionLabel}>脂肪</Text>
              </View>
            </View>
          </View>

          {/* 食材清單 */}
          <View style={styles.ingredientsSection}>
            <Text style={styles.sectionTitle}>🥘 所需食材</Text>
            {selectedRecipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>
                  {ingredient.name} {ingredient.amount} {ingredient.unit}
                </Text>
              </View>
            ))}
          </View>

          {/* 製作步驟 */}
          <View style={styles.instructionsSection}>
            <Text style={styles.sectionTitle}>👨‍🍳 製作步驟</Text>
            {selectedRecipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderNutritionLog = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>📊 營養記錄</Text>
      
      {/* 添加新記錄 */}
      <View style={styles.addNutritionSection}>
        <Text style={styles.addNutritionTitle}>記錄今日{mealInfo.name}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.calorieInput}
            placeholder="卡路里"
            value={calorieInput}
            onChangeText={setCalorieInput}
            keyboardType="numeric"
          />
          <Text style={styles.inputUnit}>卡</Text>
        </View>
        <TextInput
          style={styles.notesInput}
          placeholder="備註 (可選)"
          value={notesInput}
          onChangeText={setNotesInput}
          multiline
        />
        <TouchableOpacity
          style={styles.saveNutritionButton}
          onPress={handleSaveNutrition}
        >
          <Text style={styles.saveNutritionText}>保存記錄</Text>
        </TouchableOpacity>
      </View>

      {/* 歷史記錄 */}
      <Text style={styles.historyTitle}>歷史記錄</Text>
      {nutritionEntries.map((entry, index) => (
        <View key={index} style={styles.nutritionEntry}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryDate}>{entry.date}</Text>
            <Text style={styles.entryMeal}>{mealTypeInfo[entry.mealType as keyof typeof mealTypeInfo].name}</Text>
          </View>
          <View style={styles.entryNutrition}>
            <Text style={styles.entryCalories}>{entry.calories} 卡</Text>
            <Text style={styles.entryMacros}>
              蛋白質 {entry.protein}g · 碳水 {entry.carbs}g · 脂肪 {entry.fat}g
            </Text>
          </View>
          {entry.notes && (
            <Text style={styles.entryNotes}>{entry.notes}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部標題 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mealInfo.emoji} {mealInfo.name} 詳情
        </Text>
        <View />
      </View>

      {/* 標籤頁 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipes' && styles.activeTab]}
          onPress={() => setActiveTab('recipes')}
        >
          <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>
            菜譜選擇
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            詳細做法
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]}
          onPress={() => setActiveTab('nutrition')}
        >
          <Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>
            熱量記錄
          </Text>
        </TouchableOpacity>
      </View>

      {/* 內容區域 */}
      <View style={styles.content}>
        {activeTab === 'recipes' && renderRecipesList()}
        {activeTab === 'details' && renderRecipeDetails()}
        {activeTab === 'nutrition' && renderNutritionLog()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  selectedRecipeCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  recipeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  recipeSubInfo: {
    fontSize: 13,
    color: '#6b7280',
  },
  recipeNutrition: {
    alignItems: 'center',
  },
  caloriesText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  caloriesUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recipeTag: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    color: '#374151',
  },
  noRecipeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noRecipeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  recipeDetailsContainer: {
    paddingBottom: 24,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  recipeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  nutritionInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  ingredientsSection: {
    marginBottom: 24,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 14,
    color: '#374151',
  },
  instructionsSection: {
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  addNutritionSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  addNutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calorieInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  inputUnit: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveNutritionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveNutritionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  nutritionEntry: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  entryMeal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  entryNutrition: {
    marginBottom: 4,
  },
  entryCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  entryMacros: {
    fontSize: 12,
    color: '#6b7280',
  },
  entryNotes: {
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
  },
}); 