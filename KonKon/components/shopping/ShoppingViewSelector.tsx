import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import FamilyShoppingBoard from './FamilyShoppingBoard';
import ShoppingBudgetTracker from './ShoppingBudgetTracker';
import ShoppingHistoryAnalyzer from './ShoppingHistoryAnalyzer';
import SmartShoppingList from './SmartShoppingList';
import StoreDealsMap from './StoreDealsMap';

export type ShoppingViewStyle = 
  | 'smart-list'
  | 'family-board' 
  | 'store-deals'
  | 'budget-tracker'
  | 'history-analyzer';

interface ShoppingViewSelectorProps {
  shoppingItems: ShoppingItem[];
  stores: Store[];
  familyMembers: FamilyMember[];
  budget: ShoppingBudget;
  onItemToggle: (itemId: string) => void;
  onItemAdd: (item: Omit<ShoppingItem, 'id'>) => void;
  onItemDelete: (itemId: string) => void;
  onAssignMember: (itemId: string, memberId: string) => void;
  style?: ShoppingViewStyle;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  assignedTo?: string;
  store?: string;
  addedBy: string;
  addedDate: Date;
  completedDate?: Date;
  actualPrice?: number;
  notes?: string;
}

export interface Store {
  id: string;
  name: string;
  location: string;
  categories: string[];
  currentDeals: Deal[];
  averagePrices: { [category: string]: number };
  distance: number;
  isFrequentlyUsed: boolean;
}

export interface Deal {
  id: string;
  storeName: string;
  itemName: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  validUntil: Date;
  category: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  shoppingPreference: string[];
  assignedItems: string[];
}

export interface ShoppingBudget {
  monthly: number;
  weekly: number;
  spent: number;
  remaining: number;
  categories: { [category: string]: number };
}

const ShoppingViewSelector: React.FC<ShoppingViewSelectorProps> = ({
  shoppingItems,
  stores,
  familyMembers,
  budget,
  onItemToggle,
  onItemAdd,
  onItemDelete,
  onAssignMember,
  style = 'smart-list'
}) => {
  const renderCurrentView = () => {
    switch (style) {
      case 'smart-list':
        return (
          <SmartShoppingList
            items={shoppingItems}
            stores={stores}
            onItemToggle={onItemToggle}
            onItemAdd={onItemAdd}
            onItemDelete={onItemDelete}
          />
        );
      case 'family-board':
        return (
          <FamilyShoppingBoard
            items={shoppingItems}
            familyMembers={familyMembers}
            onAssignMember={onAssignMember}
            onItemToggle={onItemToggle}
          />
        );
      case 'store-deals':
        return (
          <StoreDealsMap
            stores={stores}
            items={shoppingItems}
            onStoreSelect={(storeId: string) => console.log('Store selected:', storeId)}
          />
        );
      case 'budget-tracker':
        return (
          <ShoppingBudgetTracker
            budget={budget}
            items={shoppingItems}
            onBudgetUpdate={(newBudget: ShoppingBudget) => console.log('Budget updated:', newBudget)}
          />
        );
      case 'history-analyzer':
        return (
          <ShoppingHistoryAnalyzer
            items={shoppingItems}
            stores={stores}
            onInsightAction={(action: any) => console.log('Insight action:', action)}
          />
        );
      default:
        return (
          <SmartShoppingList
            items={shoppingItems}
            stores={stores}
            onItemToggle={onItemToggle}
            onItemAdd={onItemAdd}
            onItemDelete={onItemDelete}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 スマート買い物管理</Text>
        <Text style={styles.headerSubtitle}>
          家族みんなで効率的にお買い物
        </Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentView()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    letterSpacing: 0.1,
  },
  content: {
    flex: 1,
  },
});

export default ShoppingViewSelector; 