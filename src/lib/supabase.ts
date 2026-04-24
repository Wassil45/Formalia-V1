/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && 
         !url.includes('placeholder.supabase.co') && 
         !url.includes('votre-projet.supabase.co') &&
         key && 
         key !== 'placeholder-key' &&
         !key.includes('votre_cle_anon_publique'));
};

const safeStorage = (() => {
  try { return window.localStorage; } catch { return undefined; }
})();

const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const urlStr = url.toString();
  // Do not abort large file uploads/downloads
  const isStorageRequest = urlStr.includes('/storage/v1/object/');
  
  const controller = new AbortController();
  const timeoutMs = isStorageRequest ? 60000 : 5000; // 60s for storage, 5s for normal API
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    lock: async (name, acquireTimeout, fn) => {
      return await fn();
    }
  },
  global: {
    fetch: customFetch
  }
});

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
