import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { FamilyMember, ShoppingItem } from './ShoppingViewSelector';

interface FamilyShoppingBoardProps {
  items: ShoppingItem[];
  familyMembers: FamilyMember[];
  onAssignMember: (itemId: string, memberId: string) => void;
  onItemToggle: (itemId: string) => void;
}

const FamilyShoppingBoard: React.FC<FamilyShoppingBoardProps> = ({
  items,
  familyMembers,
  onAssignMember,
  onItemToggle
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // 按分配状态分组商品
  const unassignedItems = items.filter(item => !item.assignedTo && !item.completed);
  const assignedItems = items.filter(item => item.assignedTo && !item.completed);
  const completedItems = items.filter(item => item.completed);

  // 按家庭成员分组已分配的商品
  const groupedByMember = familyMembers.map(member => ({
    member,
    items: assignedItems.filter(item => item.assignedTo === member.id)
  }));

  const handleAssignItem = (itemId: string) => {
    setSelectedItem(itemId);
    setShowAssignModal(true);
  };

  const handleMemberSelect = (memberId: string) => {
    if (selectedItem) {
      onAssignMember(selectedItem, memberId);
      setShowAssignModal(false);
      setSelectedItem(null);
    }
  };

  const renderFamilyStats = () => {
    const memberStats = familyMembers.map(member => {
      const memberItems = items.filter(item => item.assignedTo === member.id);
      const completedCount = memberItems.filter(item => item.completed).length;
      const totalCount = memberItems.length;
      const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        member,
        completedCount,
        totalCount,
        completionRate
      };
    });

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>👨‍👩‍👧‍👦 家族の購買状況</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {memberStats.map(({ member, completedCount, totalCount, completionRate }) => (
            <View key={member.id} style={styles.memberStatCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{member.avatar}</Text>
              </View>
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={styles.statNumbers}>
                <Text style={styles.statPrimary}>
                  {completedCount}/{totalCount}
                </Text>
                <Text style={styles.statSecondary}>
                  完了率 {completionRate}%
                </Text>
              </View>
              <View style={styles.progressMini}>
                <View 
                  style={[
                    styles.progressMiniFill, 
                    { width: `${completionRate}%` }
                  ]} 
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderUnassignedSection = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📋 未分配の商品</Text>
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{unassignedItems.length}</Text>
        </View>
      </View>
      
      {unassignedItems.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={styles.emptyText}>すべて分配済み</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.itemsRow}>
            {unassignedItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.unassignedItemCard}
                onPress={() => handleAssignItem(item.id)}
              >
                <Text style={styles.itemEmoji}>🛍️</Text>
                <Text style={styles.itemCardName}>{item.name}</Text>
                <Text style={styles.itemCardDetails}>
                  {item.quantity}{item.unit}
                </Text>
                <View style={styles.assignButton}>
                  <Text style={styles.assignButtonText}>分配</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderMemberSection = (member: FamilyMember, memberItems: ShoppingItem[]) => (
    <View key={member.id} style={styles.memberSection}>
      <View style={styles.memberSectionHeader}>
        <View style={styles.memberInfo}>
          <View style={styles.memberSectionAvatar}>
            <Text style={styles.memberSectionAvatarText}>{member.avatar}</Text>
          </View>
          <Text style={styles.memberSectionName}>{member.name} の担当</Text>
        </View>
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{memberItems.length}</Text>
        </View>
      </View>

      {memberItems.length === 0 ? (
        <View style={styles.emptyMemberSection}>
          <Text style={styles.emptyMemberText}>担当商品がありません</Text>
        </View>
      ) : (
        <View style={styles.memberItemsList}>
          {memberItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.memberItemCard}
              onPress={() => onItemToggle(item.id)}
            >
              <View style={styles.memberItemLeft}>
                <View style={[styles.itemCheckbox, item.completed && styles.checkedItemBox]}>
                  {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.memberItemInfo}>
                  <Text style={[
                    styles.memberItemName,
                    item.completed && styles.completedItemText
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={styles.memberItemDetails}>
                    {item.quantity}{item.unit} • ¥{item.estimatedPrice}
                  </Text>
                </View>
              </View>
              
              {item.priority === 'high' && (
                <View style={styles.priorityIndicator}>
                  <Text style={styles.priorityText}>急</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderCompletedSection = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>✅ 購入完了</Text>
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{completedItems.length}</Text>
        </View>
      </View>
      
      {completedItems.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyText}>まだ購入完了なし</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.itemsRow}>
            {completedItems.slice(0, 5).map(item => {
              const purchaser = familyMembers.find(m => m.id === item.assignedTo);
              return (
                <View key={item.id} style={styles.completedItemCard}>
                  <Text style={styles.completedItemName}>{item.name}</Text>
                  <Text style={styles.completedItemPurchaser}>
                    {purchaser?.avatar} {purchaser?.name}
                  </Text>
                  <Text style={styles.completedItemPrice}>
                    ¥{item.actualPrice || item.estimatedPrice}
                  </Text>
                </View>
              );
            })}
            {completedItems.length > 5 && (
              <View style={styles.moreCompletedCard}>
                <Text style={styles.moreCompletedText}>
                  +{completedItems.length - 5}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {renderFamilyStats()}
      {renderUnassignedSection()}
      
      {/* 家庭成员分配的商品 */}
      {groupedByMember.map(({ member, items: memberItems }) =>
        renderMemberSection(member, memberItems)
      )}
      
      {renderCompletedSection()}

      {/* 分配成员选择模态框 */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.assignModal}>
            <Text style={styles.modalTitle}>担当者を選択</Text>
            <Text style={styles.modalSubtitle}>
              この商品を誰が買いに行きますか？
            </Text>
            
            <View style={styles.memberList}>
              {familyMembers.map(member => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberOption}
                  onPress={() => handleMemberSelect(member.id)}
                >
                  <View style={styles.memberOptionAvatar}>
                    <Text style={styles.memberOptionAvatarText}>
                      {member.avatar}
                    </Text>
                  </View>
                  <Text style={styles.memberOptionName}>{member.name}</Text>
                  <Text style={styles.memberOptionArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAssignModal(false)}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  memberStatCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberAvatarText: {
    fontSize: 24,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  statNumbers: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statPrimary: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  statSecondary: {
    fontSize: 11,
    color: '#6b7280',
  },
  progressMini: {
    width: 60,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressMiniFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  sectionContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  itemCountBadge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemsRow: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  unassignedItemCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  itemEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  itemCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
    textAlign: 'center',
  },
  itemCardDetails: {
    fontSize: 12,
    color: '#b45309',
    marginBottom: 8,
  },
  assignButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  assignButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  memberSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  memberSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberSectionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberSectionAvatarText: {
    fontSize: 18,
  },
  memberSectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyMemberSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyMemberText: {
    fontSize: 14,
    color: '#6b7280',
  },
  memberItemsList: {
    gap: 8,
  },
  memberItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  memberItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedItemBox: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberItemInfo: {
    flex: 1,
  },
  memberItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  completedItemText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  memberItemDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  priorityIndicator: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  completedItemCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  completedItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
    textAlign: 'center',
  },
  completedItemPurchaser: {
    fontSize: 12,
    color: '#0284c7',
    marginBottom: 4,
  },
  completedItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  moreCompletedCard: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCompletedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  assignModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  memberList: {
    marginBottom: 24,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
  },
  memberOptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberOptionAvatarText: {
    fontSize: 20,
  },
  memberOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  memberOptionArrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});

export default FamilyShoppingBoard; 