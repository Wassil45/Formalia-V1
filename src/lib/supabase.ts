/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && url !== 'https://placeholder.supabase.co' && 
         key && key !== 'placeholder-key';
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    lock: async (name, acquireTimeout, fn) => {
      return await fn();
    }
  }
});

// Global listener: handle token errors automatically
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    if (!session) {
      // Clear corrupted tokens from localStorage
      Object.keys(localStorage)
        .filter(key => key.startsWith('sb-'))
        .forEach(key => localStorage.removeItem(key))
    }
  }
})

// Safe session getter — clears bad tokens automatically
let sessionPromise: Promise<any> | null = null;

export async function getSafeSession() {
  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error?.message?.includes('Refresh Token Not Found') ||
          error?.message?.includes('Invalid Refresh Token')) {
        console.warn('Invalid token detected — clearing session')
        
        // Clear all Supabase keys from localStorage
        Object.keys(localStorage)
          .filter(key => key.startsWith('sb-'))
          .forEach(key => localStorage.removeItem(key))
        
        // Sign out cleanly
        await supabase.auth.signOut()
        
        return null
      }
      
      return session
      
    } catch (err) {
      console.error('getSafeSession error:', err)
      return null
    } finally {
      sessionPromise = null;
    }
  })();

  return sessionPromise;
}
