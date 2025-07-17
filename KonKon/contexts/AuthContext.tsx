import { Tables } from '@/lib/database.types';
import { Session, User } from '@supabase/supabase-js';
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
  signOut: () => Promise<void>;
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

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    userFamilyDetails,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 