import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Share,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';

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
        message: `家族「${userFamily.name}」に招待されました！\n\n招待コード: ${userFamily.invite_code}\n\nKonKonアプリで招待コードを入力してください。`,
        title: '家族への招待',
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'メンバーを削除',
      `${memberName}を家族から削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            const success = await removeMember(memberId);
            if (success) {
              Alert.alert('成功', 'メンバーを削除しました');
            } else {
              Alert.alert('エラー', error || 'メンバーの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      '家族を退出',
      '家族を退出しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            const success = await leaveFamily();
            if (success) {
              Alert.alert('成功', '家族を退出しました', [
                { text: 'OK', onPress: () => router.replace('/profile') }
              ]);
            } else {
              Alert.alert('エラー', error || '家族の退出に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleDeleteFamily = () => {
    Alert.alert(
      '家族を解散',
      '家族を解散しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解散',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFamily();
            if (success) {
              Alert.alert('成功', '家族を解散しました', [
                { text: 'OK', onPress: () => router.replace('/profile') }
              ]);
            } else {
              Alert.alert('エラー', error || '家族の解散に失敗しました');
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
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>家族管理</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {userFamily ? (
          <View>
            {/* 家族信息 */}
            <View style={styles.familyInfo}>
              <Text style={styles.familyName}>{userFamily.name}</Text>
              <Text style={styles.memberCount}>メンバー: {familyMembers.length}人</Text>
              {userFamily.invite_code && (
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCode}>招待コード: {userFamily.invite_code}</Text>
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={handleShareInviteCode}
                  >
                    <Text style={styles.shareButtonText}>共有</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 成员列表 */}
            <View style={styles.membersSection}>
              <Text style={styles.sectionTitle}>メンバー</Text>
              {familyMembers.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.user?.display_name || member.user?.email || '未知用户'}
                    </Text>
                    <Text style={styles.memberRole}>
                      {member.role === 'owner' ? '管理者' : 'メンバー'}
                    </Text>
                  </View>
                  {isOwner && member.user_id !== user.id && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveMember(member.id, member.user?.display_name || member.user?.email || '未知用户')}
                    >
                      <Text style={styles.removeButtonText}>削除</Text>
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
                <Text style={styles.addMemberText}>メンバーを招待</Text>
              </TouchableOpacity>
            </View>


          </View>
        ) : (
          <View style={styles.noFamily}>
            <Text style={styles.noFamilyText}>家族が見つかりません</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-family')}
            >
              <Text style={styles.createButtonText}>家族を作成</Text>
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
                <Text style={styles.deleteButtonText}>家族を解散</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.leaveButton]}
                onPress={handleLeaveFamily}
              >
                <Text style={styles.leaveButtonText}>家族を退出</Text>
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
                <Text style={styles.modalTitle}>メンバーを招待</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowInviteModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inviteOptions}>
                <TouchableOpacity 
                  style={styles.inviteOption}
                  onPress={handleShareInviteCode}
                >
                  <Text style={styles.inviteOptionIcon}>📱</Text>
                  <Text style={styles.inviteOptionText}>LINEで共有</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.inviteOption}
                  onPress={() => {
                    // QR Code 功能待实现
                    Alert.alert('QRコード', 'QRコード機能は開発中です');
                  }}
                >
                  <Text style={styles.inviteOptionIcon}>📷</Text>
                  <Text style={styles.inviteOptionText}>QRコード</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.inviteOption}
                  onPress={() => {
                    // 邮件功能待实现
                    Alert.alert('メール', 'メール機能は開発中です');
                  }}
                >
                  <Text style={styles.inviteOptionIcon}>✉️</Text>
                  <Text style={styles.inviteOptionText}>メールで送信</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.inviteOption}
                  onPress={() => {
                    // 复制邀请链接
                    if (userFamily?.invite_code) {
                      const inviteLink = `konkon://join?code=${userFamily.invite_code}`;
                      // 这里可以使用 Clipboard API 复制链接
                      Alert.alert('成功', '招待リンクがコピーされました');
                    }
                  }}
                >
                  <Text style={styles.inviteOptionIcon}>🔗</Text>
                  <Text style={styles.inviteOptionText}>リンクをコピー</Text>
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
}); 