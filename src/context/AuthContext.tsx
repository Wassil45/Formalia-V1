import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getSafeSession } from '../lib/supabase';
import { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: 'client' | 'admin' | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelFetch = () => {};

    // Check active sessions and sets the user
    getSafeSession().then((session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(cancel => {
          if (cancel) cancelFetch = cancel;
        });
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = 
      supabase.auth.onAuthStateChange(async (event, session) => {
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          window.location.href = '/auth'
          return
        }
        
        if (event === 'TOKEN_REFRESHED' && !session) {
          // Token refresh failed — force re-login
          console.warn('Token refresh failed — redirecting to login')
          Object.keys(localStorage)
            .filter(k => k.startsWith('sb-'))
            .forEach(k => localStorage.removeItem(k))
          setUser(null)
          window.location.href = '/auth'
          return
        }
        
        if (session?.user) {
          setUser(session.user)
          // Fetch profile safely
          try {
            const { data } = await supabase
              .from('profiles')
              .select('id, role, first_name, last_name, email')
              .eq('id', session.user.id)
              .single()
            setProfile(data as any)
          } catch (err) {
            console.error('Error in onAuthStateChange profile fetch:', err)
          } finally {
            setIsLoading(false)
          }
        } else {
          setProfile(null)
          setIsLoading(false)
        }
      })
    
    return () => {
      cancelFetch();
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    let cancelled = false;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!cancelled) {
        if (error) throw error;
        setProfile(data as any);
      }
    } catch (error: any) {
      if (!cancelled) console.error('Error fetching profile:', error);
      // Si profil inexistant (nouvel utilisateur), le créer automatiquement
      if ((error as any)?.code === 'PGRST116') {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: authUser?.email ?? '',
              role: 'client',
            })
            .select()
            .single();
          if (!cancelled) setProfile(newProfile as any);
        } catch (insertError) {
          console.error('Impossible de créer le profil:', insertError);
        }
      }
    } finally {
      if (!cancelled) setIsLoading(false);
    }
    return () => { cancelled = true; };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    isAdmin: profile?.role === 'admin',
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
