import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_SETTINGS: Record<string, string> = {
  company_name: 'Formalia SAS',
  siren: '123 456 789',
  capital: '10 000',
  address: '123 rue de la République, 75001 Paris',
  rcs_city: 'Paris',
  tva_number: 'FR 12 123456789',
  email_contact: 'contact@formalia.fr',
  email_dpo: 'dpo@formalia.fr',
  phone_contact: '01 23 45 67 89',
  director_name: 'Jean Dupont',
  hosting_provider: 'Google Cloud Platform',
};

const SettingsContext = createContext<{ data: Record<string, string>; isLoading: boolean }>({
  data: DEFAULT_SETTINGS,
  isLoading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
      const { data, error } = await supabase.from('settings').select('*');
      if (error) return DEFAULT_SETTINGS;
      const map = Object.fromEntries(((data as any[]) ?? []).map(s => [s.key, s.value]));
      return { ...DEFAULT_SETTINGS, ...map };
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min
  });

  return (
    <SettingsContext.Provider value={{ data: data ?? DEFAULT_SETTINGS, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
