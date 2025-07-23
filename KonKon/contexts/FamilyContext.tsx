import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// 元空間定義
const META_SPACE_FAMILY: Family = {
  id: 'meta-space',
  name: '元空間',
  description: '查看所有空間信息',
  avatar_url: null,
  owner_id: '',
  invite_code: null,
  timezone: null,
  created_at: null,
  updated_at: null,
  member_count: 0,
};

interface Family {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  owner_id: string;
  invite_code: string | null;
  timezone: string | null;
  created_at: string | null;
  updated_at: string | null;
  member_count?: number; // 添加成员数量字段
}

interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: {
    display_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface FamilyContextType {
  activeFamily: Family | null;
  userFamilies: Family[];
  familyMembers: FamilyMember[];
  loading: boolean;
  error: string | null;
  isMetaSpaceActive: boolean; // 新增：標識是否為元空間狀態
  
  createFamily: (data: { name: string; description?: string; tag?: string }) => Promise<Family | null>;
  updateFamilyName: (familyId: string, newName: string) => Promise<boolean>;
  joinFamilyByCode: (inviteCode: string) => Promise<boolean>;
  refreshFamilies: () => Promise<void>;
  switchFamily: (familyId: string | null) => Promise<void>;
  removeMember: (memberId: string) => Promise<boolean>;
  leaveFamily: () => Promise<boolean>;
  deleteFamily: () => Promise<boolean>;
  inviteByEmail: (email: string) => Promise<boolean>;
  reorderFamilies: (familyIds: string[]) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeFamily, setActiveFamily] = useState<Family | null>(null);
  const [userFamilies, setUserFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 新增：計算元空間狀態
  const isMetaSpaceActive = activeFamily?.id === 'meta-space';

  useEffect(() => {
    if (user) {
      fetchUserFamilies();
    } else {
      // 用户登出时清空家庭信息
      setActiveFamily(null);
      setUserFamilies([]);
      setFamilyMembers([]);
    }
  }, [user]);

  // 新增：保存家庭順序到本地存儲
  const saveFamilyOrder = async (familyIds: string[]) => {
    if (!user) return;
    
    try {
      await AsyncStorage.setItem(`family_order_${user.id}`, JSON.stringify(familyIds));
    } catch (error) {
      console.error('保存家庭順序失败:', error);
    }
  };

  // 新增：從本地存儲獲取家庭順序
  const getFamilyOrder = async (): Promise<string[]> => {
    if (!user) return [];
    
    try {
      const orderData = await AsyncStorage.getItem(`family_order_${user.id}`);
      return orderData ? JSON.parse(orderData) : [];
    } catch (error) {
      console.error('獲取家庭順序失敗:', error);
      return [];
    }
  };

  // 新增：重新排序家庭列表
  const reorderFamilies = async (familyIds: string[]) => {
    setUserFamilies(prevFamilies => {
      const reorderedFamilies = familyIds
        .map(id => prevFamilies.find(family => family.id === id))
        .filter(Boolean) as Family[];
      
      // 添加任何不在重新排序列表中的家庭
      const remainingFamilies = prevFamilies.filter(
        family => !familyIds.includes(family.id)
      );
      
      const newOrder = [...reorderedFamilies, ...remainingFamilies];
      
      // 保存到本地存儲
      saveFamilyOrder(newOrder.map(f => f.id));
      
      return newOrder;
    });
  };

  const fetchUserFamilies = async () => {
    if (!user) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // 1. Get all family memberships for the user
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (memberError) {
        throw memberError;
      }

      if (memberData && memberData.length > 0) {
        const familyIds = memberData.map(m => m.family_id);
        
        // 2. Fetch details for all those families
        const { data: familiesData, error: familiesError } = await supabase
          .from('families')
          .select('*')
          .in('id', familyIds);

        if (familiesError) {
          throw familiesError;
        }

        // 3. 为每个家庭获取成员数量
        if (familiesData) {
          const familiesWithMemberCount = await Promise.all(
            familiesData.map(async (family) => {
              const { count, error: countError } = await supabase
                .from('family_members')
                .select('*', { count: 'exact', head: true })
                .eq('family_id', family.id);
              
              if (countError) {
                console.error(`获取家庭 ${family.id} 成员数量失败:`, countError);
                return { ...family, member_count: 0 };
              }
              return { ...family, member_count: count || 0 };
            })
          );

          // 4. 按照保存的順序排列家庭列表
          const savedOrder = await getFamilyOrder();
          const orderedFamilies = savedOrder.length > 0 
            ? savedOrder
                .map(id => familiesWithMemberCount.find(f => f.id === id))
                .filter(Boolean)
                .concat(
                  familiesWithMemberCount.filter(f => !savedOrder.includes(f.id))
                ) as Family[]
            : familiesWithMemberCount;

          setUserFamilies(orderedFamilies);

          // 5. Set the first family as active and fetch its members
          const currentActiveFamily = activeFamily 
            ? orderedFamilies.find(f => f.id === activeFamily.id) 
            : null;

          if (currentActiveFamily) {
            setActiveFamily(currentActiveFamily);
            await fetchFamilyMembers(currentActiveFamily.id);
          } else if (orderedFamilies.length > 0) {
            const newActiveFamily = orderedFamilies[0];
            setActiveFamily(newActiveFamily);
            await fetchFamilyMembers(newActiveFamily.id);
          } else {
            setActiveFamily(null);
            setFamilyMembers([]);
          }
        } else {
           setUserFamilies([]);
           setActiveFamily(null);
           setFamilyMembers([]);
        }
      } else {
        // No families found for the user
        setActiveFamily(null);
        setUserFamilies([]);
        setFamilyMembers([]);
      }
    } catch (err) {
      console.error('获取家庭列表失败:', err);
      setError('获取家庭列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          id,
          family_id,
          user_id,
          role,
          joined_at,
          users (
            display_name,
            email,
            avatar_url
          )
        `)
        .eq('family_id', familyId)
        .order('joined_at', { ascending: true });

      if (error) {
        // console.error('获取家庭成员失败:', error);
        return;
      }

      setFamilyMembers(data.map(member => ({
        ...member,
        user: member.users
      })) as FamilyMember[]);
    } catch (err) {
      // console.error('获取家庭成员异常:', err);
    }
  };

  const createFamily = async (data: { name: string; description?: string; tag?: string }) => {
    if (!user) {
      setError('用户未登录');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name: data.name,
          description: data.description,
          tag: data.tag || 'family',
          owner_id: user.id,
        })
        .select()
        .single();

      if (familyError) {
        // console.error('创建家庭失败:', familyError);
        setError(`创建家庭失败: ${familyError.message}`);
        return null;
      }

      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        // console.error('添加家庭成员失败:', memberError);
        setError(`添加家庭成员失败: ${memberError.message}`);
        // Consider rolling back family creation here
        return null;
      }

      await fetchUserFamilies();
      return familyData as Family;
    } catch (err) {
      // console.error('创建家庭异常:', err);
      setError('创建家庭失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinFamilyByCode = async (inviteCode: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('id, name')
        .eq('invite_code', inviteCode.trim())
        .single();

      if (familyError || !familyData) {
        setError('邀请码无效');
        return false;
      }

      const { error: joinError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) {
        setError('加入家庭失败');
        return false;
      }

      await fetchUserFamilies();
      return true;
    } catch (err) {
      // console.error('加入家庭异常:', err);
      setError('加入家庭失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshFamilies = async () => {
    await fetchUserFamilies();
  };

  const switchFamily = async (familyId: string | null) => {
    if (familyId === null) {
      // 清除活躍家庭
      setActiveFamily(null);
      setFamilyMembers([]); // 清空家庭成員
    } else if (familyId === 'meta-space') {
      // 切換到元空間
      setActiveFamily(META_SPACE_FAMILY);
      // 元空間是純粹的個人AI對話空間，不顯示任何家庭成員信息
      setFamilyMembers([]);
    } else {
      // 切換到指定家庭
      const familyToSwitch = userFamilies.find(f => f.id === familyId);
      if (familyToSwitch && familyToSwitch.id !== activeFamily?.id) {
        setLoading(true);
        setActiveFamily(familyToSwitch);
        await fetchFamilyMembers(familyToSwitch.id);
        setLoading(false);
      }
    }
  };

  const removeMember = async (memberId: string) => {
    if (!user || !activeFamily) return false;
    
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        // console.error('移除成员失败:', error);
        setError('移除成员失败');
        return false;
      }

      await fetchUserFamilies();
      return true;
    } catch (err) {
      // console.error('移除成员异常:', err);
      setError('移除成员失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveFamily = async () => {
    if (!user || !activeFamily) return false;
    
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('user_id', user.id)
        .eq('family_id', activeFamily.id);

      if (error) {
        // console.error('离开家庭失败:', error);
        setError('离开家庭失败');
        return false;
      }
      
      await fetchUserFamilies();
      return true;
    } catch (err) {
      // console.error('离开家庭异常:', err);
      setError('离开家庭失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteFamily = async () => {
    if (!user || !activeFamily) return false;
    
    try {
      setLoading(true);
      setError(null);

      // 先删除所有成员
      const { error: membersError } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', activeFamily.id);

      if (membersError) {
        // console.error('删除家庭成员失败:', membersError);
        setError('解散家庭失败');
        return false;
      }

      // 然后删除家庭
      const { error: familyError } = await supabase
        .from('families')
        .delete()
        .eq('id', activeFamily.id);

      if (familyError) {
        // console.error('删除家庭失败:', familyError);
        setError('解散家庭失败');
        return false;
      }

      await fetchUserFamilies();
      return true;
    } catch (err) {
      // console.error('解散家庭异常:', err);
      setError('解散家庭失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateFamilyName = async (familyId: string, newName: string) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('families')
        .update({ name: newName.trim(), updated_at: new Date().toISOString() })
        .eq('id', familyId)
        .eq('owner_id', user.id); // 只有家庭擁有者才能修改

      if (updateError) {
        // console.error('修改家庭名稱失败:', updateError);
        setError('修改家庭名稱失败');
        return false;
      }

      // 更新本地狀態
      await fetchUserFamilies();
      return true;
    } catch (err) {
      // console.error('修改家庭名稱异常:', err);
      setError('修改家庭名稱失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const inviteByEmail = async (email: string) => {
    if (!user || !activeFamily) return false;
    
    try {
      setLoading(true);
      setError(null);

      // 这里可以实现邮箱邀请逻辑
      // 暂时返回成功，可以后续完善
      // console.log('邀请邮箱:', email);
      setError('邮箱邀请功能开发中');
      return false;
    } catch (err) {
      // console.error('邮箱邀请异常:', err);
      setError('邮箱邀请失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FamilyContext.Provider
      value={{
        activeFamily,
        userFamilies,
        familyMembers,
        loading,
        error,
        isMetaSpaceActive, // 新增
        createFamily,
        updateFamilyName,
        joinFamilyByCode,
        refreshFamilies,
        switchFamily,
        removeMember,
        leaveFamily,
        deleteFamily,
        inviteByEmail,
        reorderFamilies,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
} 