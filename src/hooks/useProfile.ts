import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_name?: string;
  siret?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
};

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProfilePayload }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Error updating profile:', error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour du profil');
    }
  });
}
