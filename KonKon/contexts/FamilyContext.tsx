import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

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
  
  createFamily: (data: { name: string; description?: string }) => Promise<Family | null>;
  joinFamilyByCode: (inviteCode: string) => Promise<boolean>;
  refreshFamilies: () => Promise<void>;
  switchFamily: (familyId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<boolean>;
  leaveFamily: () => Promise<boolean>;
  deleteFamily: () => Promise<boolean>;
  inviteByEmail: (email: string) => Promise<boolean>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeFamily, setActiveFamily] = useState<Family | null>(null);
  const [userFamilies, setUserFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        setUserFamilies(familiesData || []);
        
        // 3. Set the first family as active and fetch its members
        const currentActiveFamily = activeFamily 
          ? familiesData.find(f => f.id === activeFamily.id) 
          : null;

        if (currentActiveFamily) {
          setActiveFamily(currentActiveFamily);
          await fetchFamilyMembers(currentActiveFamily.id);
        } else if (familiesData && familiesData.length > 0) {
          const newActiveFamily = familiesData[0];
          setActiveFamily(newActiveFamily);
          await fetchFamilyMembers(newActiveFamily.id);
        } else {
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

  const createFamily = async (data: { name: string; description?: string }) => {
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

  const switchFamily = async (familyId: string) => {
    const familyToSwitch = userFamilies.find(f => f.id === familyId);
    if (familyToSwitch && familyToSwitch.id !== activeFamily?.id) {
      setLoading(true);
      setActiveFamily(familyToSwitch);
      await fetchFamilyMembers(familyToSwitch.id);
      setLoading(false);
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
        createFamily,
        joinFamilyByCode,
        refreshFamilies,
        switchFamily,
        removeMember,
        leaveFamily,
        deleteFamily,
        inviteByEmail,
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