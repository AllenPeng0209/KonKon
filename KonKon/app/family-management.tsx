import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FamilyManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    activeFamily,
    userFamilies,
    familyMembers,
    loading,
    error,
    createFamily,
    updateFamilyName,
    joinFamilyByCode,
    refreshFamilies,
    switchFamily,
    removeMember,
    leaveFamily,
    deleteFamily,
    inviteByEmail,
  } = useFamily();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showEditNameForm, setShowEditNameForm] = useState(false);
  const [showFamilySelector, setShowFamilySelector] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyDescription, setFamilyDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateFamily = useCallback(async () => {
    if (!familyName.trim()) {
      Alert.alert('提示', '请输入家庭名称');
      return;
    }

    setIsSubmitting(true);
    try {
      const family = await createFamily({
        name: familyName.trim(),
        description: familyDescription.trim() || undefined,
      });

      if (family) {
        Alert.alert('创建成功', `家庭"${family.name}"已创建成功！`);
        setShowCreateForm(false);
        setFamilyName('');
        setFamilyDescription('');
      }
    } catch (error) {
      console.error('创建家庭失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [familyName, familyDescription, createFamily]);

  const handleJoinFamily = useCallback(async () => {
    if (!inviteCode.trim()) {
      Alert.alert('提示', '请输入邀请码');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await joinFamilyByCode(inviteCode.trim());
      if (success) {
        Alert.alert('加入成功', '您已成功加入家庭！');
        setShowJoinForm(false);
        setInviteCode('');
      }
    } catch (error) {
      console.error('加入家庭失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [inviteCode, joinFamilyByCode]);

  const handleInviteByEmail = useCallback(async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('提示', '请输入邮箱地址');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await inviteByEmail(inviteEmail.trim());
      if (success) {
        Alert.alert('邀请成功', '邀请邮件已发送！');
        setShowInviteForm(false);
        setInviteEmail('');
      }
    } catch (error) {
      console.error('邮箱邀请失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [inviteEmail, inviteByEmail]);

  const handleShareInviteCode = useCallback(async () => {
    if (!activeFamily?.invite_code) {
      Alert.alert('提示', '当前家庭没有邀请码');
      return;
    }

    try {
      await Share.share({
        message: `邀请您加入我的家庭"${activeFamily.name}"！\n\n邀请码: ${activeFamily.invite_code}\n\n在 KonKon 应用中输入此邀请码即可加入。`,
        title: '家庭邀请',
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  }, [activeFamily]);

  const handleCopyInviteCode = useCallback(async () => {
    if (!activeFamily?.invite_code) {
      Alert.alert('提示', '当前家庭没有邀请码');
      return;
    }

    try {
      await Clipboard.setString(activeFamily.invite_code);
      Alert.alert('复制成功', '邀请码已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
    }
  }, [activeFamily]);

  const handleRemoveMember = useCallback((memberId: string, memberName: string) => {
    Alert.alert(
      '确认移除',
      `确定要移除成员"${memberName}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            const success = await removeMember(memberId);
            if (success) {
              Alert.alert('移除成功', '成员已被移除');
            }
          },
        },
      ]
    );
  }, [removeMember]);

  const handleLeaveFamily = useCallback(() => {
    Alert.alert(
      '确认离开',
      `确定要离开家庭"${activeFamily?.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            const success = await leaveFamily();
            if (success) {
              Alert.alert('离开成功', '您已离开家庭');
            }
          },
        },
      ]
    );
  }, [activeFamily, leaveFamily]);

  const handleDeleteFamily = useCallback(() => {
    // 檢查是否為個人空間，個人空間不允許解散
    if (activeFamily?.tag === 'personal') {
      Alert.alert('提示', t('space.personalSpaceCannotDissolve'));
      return;
    }

    Alert.alert(
      '确认解散',
      `确定要解散家庭"${activeFamily?.name}"吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '解散',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFamily();
            if (success) {
              Alert.alert('解散成功', '家庭已解散');
            }
          },
        },
      ]
    );
  }, [activeFamily, deleteFamily]);

  const handleEditFamilyName = useCallback(() => {
    if (!activeFamily) return;
    setNewFamilyName(activeFamily.name);
    setShowEditNameForm(true);
  }, [activeFamily]);

  const handleUpdateFamilyName = useCallback(async () => {
    if (!activeFamily || !newFamilyName.trim()) {
      Alert.alert('提示', '请输入有效的家庭名称');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await updateFamilyName(activeFamily.id, newFamilyName.trim());
      if (success) {
        Alert.alert('修改成功', '家庭名称已更新');
        setShowEditNameForm(false);
        setNewFamilyName('');
      }
    } catch (error) {
      console.error('修改家庭名称失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeFamily, newFamilyName, updateFamilyName]);

  const handleSelectFamily = useCallback(async (familyId: string) => {
    setIsSubmitting(true);
    setShowFamilySelector(false);
    
    try {
      await switchFamily(familyId);
      Alert.alert('切换成功', '已切换到新的家庭');
    } catch (error) {
      console.error('切换家庭失败:', error);
      Alert.alert('切换失败', '切换家庭时发生错误');
    } finally {
      setIsSubmitting(false);
    }
  }, [switchFamily]);

  const isOwner = activeFamily?.owner_id === user?.id;
  // 檢查當前用戶是否是家庭成員（無論角色）
  const isFamilyMember = familyMembers.some(member => member.user_id === user?.id);
  // 檢查是否為個人空間 - 個人空間不允許邀請其他人
  const isPersonalSpace = activeFamily?.tag === 'personal';
  // 檢查是否為元空間 - 元空間有特殊的邏輯
  const isMetaSpace = activeFamily?.id === 'meta-space';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>家庭管理</Text>
        <TouchableOpacity onPress={refreshFamilies} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshFamilies} />
        }
      >
        {/* 當前家庭信息 */}
        {activeFamily && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>当前家庭</Text>
            
            <View style={styles.familyCard}>
              <View style={styles.familyInfo}>
                                  <View style={styles.familyNameRow}>
                    <Text style={styles.familyName}>{activeFamily.name}</Text>
                    <View style={styles.familyNameActions}>
                      {userFamilies.length > 1 && (
                        <TouchableOpacity
                          style={styles.selectFamilyButton}
                          onPress={() => setShowFamilySelector(true)}
                        >
                          <Ionicons name="swap-horizontal" size={18} color="#fff" />
                          <Text style={styles.buttonText}>切換</Text>
                        </TouchableOpacity>
                      )}
                      {isOwner && (
                        <TouchableOpacity
                          style={styles.editNameButton}
                          onPress={handleEditFamilyName}
                        >
                          <Ionicons name="pencil" size={18} color="#fff" />
                          <Text style={styles.buttonText}>編輯</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                {activeFamily.description && (
                  <Text style={styles.familyDescription}>
                    {activeFamily.description}
                  </Text>
                )}
                <Text style={styles.familyMeta}>
                  {familyMembers.length} 名成员 • {isOwner ? '您是管理员' : '您是成员'}
                </Text>
              </View>
              

            </View>
          </View>
        )}

        {/* 家庭成员 - 元空間不顯示 */}
        {familyMembers.length > 0 && !isMetaSpace && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>家庭成员</Text>
            {familyMembers.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.user?.display_name || member.user?.email || '未知用户'}
                  </Text>
                  <Text style={styles.memberRole}>
                    {member.role === 'owner' ? '管理员' : '成员'}
                  </Text>
                </View>
                {isOwner && member.user_id !== user?.id && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveMember(
                      member.id,
                      member.user?.display_name || member.user?.email || '未知用户'
                    )}
                  >
                    <Ionicons name="remove-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 快捷操作 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCreateForm(true)}
          >
            <Ionicons name="add-circle" size={24} color="#34C759" />
            <Text style={styles.actionButtonText}>创建新家庭</Text>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CD" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowJoinForm(true)}
          >
            <Ionicons name="person-add" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>加入家庭</Text>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CD" />
          </TouchableOpacity>

          {/* 只要是家庭成員就能使用郵箱邀請，但個人空間和元空間不允許 */}
          {isFamilyMember && !isPersonalSpace && !isMetaSpace && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowInviteForm(true)}
            >
              <Ionicons name="mail" size={24} color="#FF9500" />
              <Text style={styles.actionButtonText}>邮箱邀请</Text>
              <Ionicons name="chevron-forward" size={16} color="#C7C7CD" />
            </TouchableOpacity>
          )}

          {/* 只要是家庭成員就能分享邀請碼，但個人空間和元空間不允許 */}
          {isFamilyMember && !isPersonalSpace && !isMetaSpace && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareInviteCode}
            >
              <Ionicons name="share" size={24} color="#007AFF" />
              <Text style={styles.actionButtonText}>分享邀请</Text>
              <Ionicons name="chevron-forward" size={16} color="#C7C7CD" />
            </TouchableOpacity>
          )}

          {/* 複製邀請碼功能，個人空間和元空間不允許 */}
          {isFamilyMember && !isPersonalSpace && !isMetaSpace && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopyInviteCode}
            >
              <Ionicons name="copy" size={24} color="#007AFF" />
              <Text style={styles.actionButtonText}>复制邀请码</Text>
              <Ionicons name="chevron-forward" size={16} color="#C7C7CD" />
            </TouchableOpacity>
          )}
        </View>

        {/* 危险操作 */}
        {activeFamily && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>危险操作</Text>
            
            {!isOwner && !isPersonalSpace && !isMetaSpace && (
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleLeaveFamily}
              >
                <Ionicons name="exit" size={24} color="#FF3B30" />
                <Text style={[styles.actionButtonText, styles.dangerText]}>
                  离开家庭
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CD" />
              </TouchableOpacity>
            )}

            {isOwner && !isPersonalSpace && !isMetaSpace && (
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleDeleteFamily}
              >
                <Ionicons name="trash" size={24} color="#FF3B30" />
                <Text style={[styles.actionButtonText, styles.dangerText]}>
                  解散家庭
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CD" />
              </TouchableOpacity>
            )}

            {/* 個人空間的提示信息 */}
            {isPersonalSpace && (
              <View style={styles.personalSpaceNotice}>
                <Ionicons name="information-circle" size={20} color="#8E8E93" />
                <Text style={styles.personalSpaceNoticeText}>
                  {t('space.personalSpaceNotice')}
                </Text>
              </View>
            )}

            {/* 元空間的提示信息 */}
            {isMetaSpace && (
              <View style={styles.personalSpaceNotice}>
                <Ionicons name="information-circle" size={20} color="#8E8E93" />
                <Text style={styles.personalSpaceNoticeText}>
                  {t('space.metaSpaceIntegrationView')}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 创建家庭表单 */}
      {showCreateForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>创建家庭</Text>
            
            <TextInput
              style={styles.input}
              placeholder="家庭名称"
              value={familyName}
              onChangeText={setFamilyName}
              maxLength={50}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="家庭描述（可选）"
              value={familyDescription}
              onChangeText={setFamilyDescription}
              multiline
              maxLength={200}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateForm(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleCreateFamily}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>创建</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 加入家庭表单 */}
      {showJoinForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>加入家庭</Text>
            
            <TextInput
              style={styles.input}
              placeholder="输入邀请码"
              value={inviteCode}
              onChangeText={setInviteCode}
              maxLength={20}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowJoinForm(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleJoinFamily}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>加入</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 邮箱邀请表单 */}
      {showInviteForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>邮箱邀请</Text>
            
            <TextInput
              style={styles.input}
              placeholder="输入邮箱地址"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowInviteForm(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleInviteByEmail}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>邀请</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 修改家庭名称表单 */}
      {showEditNameForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>修改家庭名称</Text>
            
            <TextInput
              style={styles.input}
              placeholder="输入新的家庭名称"
              value={newFamilyName}
              onChangeText={setNewFamilyName}
              maxLength={50}
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditNameForm(false);
                  setNewFamilyName('');
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleUpdateFamilyName}
                disabled={isSubmitting || !newFamilyName.trim()}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 家庭選擇器 */}
      {showFamilySelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>選擇家庭</Text>
            
            <ScrollView style={styles.familyListContainer}>
              {userFamilies.map((family, index) => (
                <TouchableOpacity
                  key={family.id}
                  style={[
                    styles.familyOption,
                    activeFamily?.id === family.id && styles.familyOptionActive,
                    // 最後一個項目不顯示底部邊框
                    index === userFamilies.length - 1 && styles.familyOptionLast
                  ]}
                  onPress={() => handleSelectFamily(family.id)}
                >
                  <View style={styles.familyOptionContent}>
                    <Text style={[
                      styles.familyOptionName,
                      activeFamily?.id === family.id && styles.familyOptionNameActive
                    ]}>
                      {family.name}
                    </Text>
                    {family.description && (
                      <Text style={styles.familyOptionDescription}>
                        {family.description}
                      </Text>
                    )}
                    <Text style={styles.familyOptionMeta}>
                      {family.member_count || 0} 名成員
                    </Text>
                  </View>
                  {activeFamily?.id === family.id && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowFamilySelector(false)}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  familyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  familyInfo: {
    marginBottom: 12,
  },
  familyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  familyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  familyNameActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectFamilyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editNameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#34C759',
    marginLeft: 8,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  familyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  familyMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },

  memberCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    color: '#8E8E93',
  },
  removeButton: {
    padding: 8,
  },
  actionButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
    flex: 1,
  },
  dangerButton: {
    backgroundColor: '#FFF5F5',
  },
  dangerText: {
    color: '#FF3B30',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  familyListContainer: {
    maxHeight: 200, // 限制列表高度
    marginBottom: 20,
  },
  familyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  familyOptionLast: {
    borderBottomWidth: 0,
  },
  familyOptionActive: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 8,
  },
  familyOptionContent: {
    flex: 1,
  },
  familyOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  familyOptionNameActive: {
    color: '#007AFF',
  },
  familyOptionDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  familyOptionMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  personalSpaceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  personalSpaceNoticeText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
}); 