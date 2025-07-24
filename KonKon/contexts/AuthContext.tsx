import { Tables } from '@/lib/database.types';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type FamilyDetails = Tables<'family_members'> & {
  families: Tables<'families'> | null;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userFamilyDetails: FamilyDetails[] | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signInWithApple: () => Promise<any>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFamilyDetails, setUserFamilyDetails] = useState<FamilyDetails[] | null>(null);

  useEffect(() => {
    setLoading(true);
    console.log('[Auth] AuthProvider mounted. Setting up listener.');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`[Auth] onAuthStateChange event: ${_event}`, session);
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserFamilyDetails(currentUser.id);
      } else {
        setUserFamilyDetails(null);
        console.log('[Auth] No user session found.');
      }
      setLoading(false);
    });

    return () => {
      console.log('[Auth] AuthProvider unmounted. Unsubscribing.');
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserFamilyDetails = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          families (*)
        `)
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      setUserFamilyDetails(data);
    } catch (error) {
      console.error('Error fetching user family details:', error);
      setUserFamilyDetails(null);
    }
  };
  
  const signIn = async (email: string, password:string) => {
    console.log('[Auth] Attempting sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('[Auth] SignIn Error:', error.message);
    } else {
      console.log('[Auth] SignIn Success. Session:', data.session);
    }
    return { data, error };
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signInWithApple = async () => {
    try {
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Authentication is not available on this device');
      }

      // Request Apple authentication
      const nonce = Math.random().toString(36).substring(2, 15);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        state: nonce,
        nonce: await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            nonce
        ),
      });

      console.log('[Auth] Apple credential received:', credential);


      // Sign in with Supabase
      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: nonce,
      });

      if (error) {
        console.error('[Auth] Apple SignIn Error:', error.message);
        throw error;
      }

      console.log('[Auth] Apple SignIn Success:', data);
      return { data, error: null };

    } catch (error) {
      console.error('[Auth] Apple SignIn Error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    console.log('[Auth] 开始退出登录...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] 退出登录出错:', error);
        throw error;
      }
      console.log('[Auth] 退出登录成功');
    } catch (error) {
      console.error('[Auth] 退出登录失败:', error);
      throw error;
    }
  }

  const updatePassword = async (newPassword: string) => {
    console.log('[Auth] 开始更新密码...');
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('[Auth] 更新密码失败:', error);
        throw error;
      }

      console.log('[Auth] 密码更新成功');
      return { data, error: null };
    } catch (error) {
      console.error('[Auth] 密码更新异常:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    userFamilyDetails,
    signIn,
    signUp,
    signInWithApple,
    signOut,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 