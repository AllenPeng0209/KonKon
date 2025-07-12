import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';

export default function FamilyManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    userFamily, 
    familyMembers, 
    loading, 
    error,
    removeMember,
    leaveFamily,
    deleteFamily,
    refreshFamily,
  } = useFamily();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // 页面获得焦点时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      refreshFamily();
    }, [])
  );

  const handleBack = () => {
    router.back();
  };

  const handleShareInviteCode = async () => {
    if (!userFamily?.invite_code) return;
    
    try {
      await Share.share({
        message: t('familyManagement.shareInviteMessage', { familyName: userFamily.name, inviteCode: userFamily.invite_code }),
        title: t('familyManagement.shareInviteTitle'),
      });
    } catch (error) {
      console.error(t('familyManagement.shareFailed'), error);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      t('familyManagement.removeMemberTitle'),
      t('familyManagement.removeMemberMessage', { memberName }),
      [
        { text: t('familyManagement.cancel'), style: 'cancel' },
        {
          text: t('familyManagement.remove'),
          style: 'destructive',
          onPress: async () => {
            const success = await removeMember(memberId);
            if (success) {
              Alert.alert(t('familyManagement.success'), t('familyManagement.memberRemoved'));
            } else {
              Alert.alert('エラー', error || t('familyManagement.removeMemberFailed'));
            }
          },
        },
      ]
    );
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      t('familyManagement.leaveFamilyTitle'),
      t('familyManagement.leaveFamilyMessage'),
      [
        { text: t('familyManagement.cancel'), style: 'cancel' },
        {
          text: t('familyManagement.leaveFamily'),
          style: 'destructive',
          onPress: async () => {
            const success = await leaveFamily();
            if (success) {
              Alert.alert(t('familyManagement.success'), t('familyManagement.familyLeft'), [
                { text: t('familyManagement.ok'), onPress: () => router.replace('/profile') }
              ]);
            } else {
              Alert.alert('エラー', error || t('familyManagement.leaveFamilyFailed'));
            }
          },
        },
      ]
    );
  };

  const handleDeleteFamily = () => {
    Alert.alert(
      t('familyManagement.dissolveFamilyTitle'),
      t('familyManagement.dissolveFamilyMessage'),
      [
        { text: t('familyManagement.cancel'), style: 'cancel' },
        {
          text: t('familyManagement.dissolved'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFamily();
            if (success) {
              Alert.alert(t('familyManagement.success'), t('familyManagement.familyDissolved'), [
                { text: t('familyManagement.ok'), onPress: () => router.replace('/profile') }
              ]);
            } else {
              Alert.alert('エラー', error || t('familyManagement.dissolveFamilyFailed'));
            }
          },
        },
      ]
    );
  };

  const isOwner = user && userFamily && userFamily.owner_id === user.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('familyManagement.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {userFamily ? (
          <View>
            {/* 家族信息 */}
            <View style={styles.familyInfo}>
              <Text style={styles.familyName}>{userFamily.name}</Text>
              <Text style={styles.memberCount}>{t('familyManagement.memberCount', { count: familyMembers.length })}</Text>
              {userFamily.invite_code && (
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCode}>{t('familyManagement.inviteCode', { code: userFamily.invite_code })}</Text>
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={handleShareInviteCode}
                  >
                    <Text style={styles.shareButtonText}>{t('familyManagement.share')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 成员列表 */}
            <View style={styles.membersSection}>
              <Text style={styles.sectionTitle}>{t('familyManagement.members')}</Text>
              {familyMembers.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.user?.display_name || member.user?.email || t('familyManagement.unknownUser')}
                    </Text>
                    <Text style={styles.memberRole}>
                      {member.role === 'owner' ? t('familyManagement.owner') : t('familyManagement.members')}
                    </Text>
                  </View>
                  {isOwner && member.user_id !== user.id && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveMember(member.id, member.user?.display_name || member.user?.email || t('familyManagement.unknownUser'))}
                    >
                      <Text style={styles.removeButtonText}>{t('familyManagement.remove')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              {/* 添加成员按钮 */}
              <TouchableOpacity 
                style={styles.addMemberButton}
                onPress={() => setShowInviteModal(true)}
              >
                <Text style={styles.addMemberIcon}>+</Text>
                <Text style={styles.addMemberText}>{t('familyManagement.inviteMember')}</Text>
              </TouchableOpacity>
            </View>


          </View>
        ) : (
          <View style={styles.noFamily}>
            <Text style={styles.noFamilyText}>{t('familyManagement.noFamilyFound')}</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-family')}
            >
              <Text style={styles.createButtonText}>{t('familyManagement.createFamily')}</Text>
            </TouchableOpacity>
          </View>
                  )}
        </ScrollView>

        {/* 操作按钮 - 移到底部 */}
        {userFamily && (
          <View style={styles.bottomActions}>
            {isOwner ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteFamily}
              >
                <Text style={styles.deleteButtonText}>{t('familyManagement.dissolveFamily')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.leaveButton]}
                onPress={handleLeaveFamily}
              >
                <Text style={styles.leaveButtonText}>{t('familyManagement.leaveFamily')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 邀请模态框 */}
        <Modal
          visible={showInviteModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowInviteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('familyManagement.inviteModalTitle')}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowInviteModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inviteOptions}>
                <TouchableOpacity 
                  style={styles.inviteOptionButton}
                  onPress={handleShareInviteCode}
                >
                  <Text style={styles.inviteOptionText}>{t('familyManagement.shareInviteCode')}</Text>
                  <Text style={styles.inviteOptionSubtitle}>{t('familyManagement.byInviteCode')}</Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>
                
                <TouchableOpacity 
                  style={styles.inviteOptionButton}
                  onPress={() => router.push('/join-family')}
                >
                  <Text style={styles.inviteOptionText}>{t('familyManagement.enterInviteCode')}</Text>
                  <Text style={styles.inviteOptionSubtitle}>{t('familyManagement.byInviteCode')}</Text>
                </TouchableOpacity>

              </View>

            </View>
          </View>
        </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 10,
  },
  backIcon: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  familyInfo: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  familyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  inviteCode: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  noFamily: {
    alignItems: 'center',
    paddingTop: 60,
  },
  noFamilyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  shareButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  membersSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  memberRole: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: '#F59E0B',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFF',
  },
  addMemberIcon: {
    fontSize: 24,
    color: '#007AFF',
    marginRight: 8,
  },
  addMemberText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  bottomActions: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
  },
  inviteOptions: {
    padding: 20,
  },
  inviteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  inviteOptionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  inviteOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  inviteOptionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  inviteOptionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#6b7280',
  },
}); 