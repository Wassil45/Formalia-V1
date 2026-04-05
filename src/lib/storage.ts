import { supabase, isSupabaseConfigured } from './supabase';

export const BUCKETS = {
  DOCUMENTS: 'dossier-documents',
  ASSETS: 'assets',
} as const;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export async function uploadDocument(
  file: File,
  userId: string,
  formaliteId: string,
  fileId: string
): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    // Mode demo : retourner une URL fictive
    return { 
      success: true, 
      url: URL.createObjectURL(file),
      path: `demo/${fileId}` 
    };
  }

  try {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${formaliteId}/${fileId}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKETS.DOCUMENTS)
      .upload(path, file, { 
        upsert: false,
        contentType: file.type 
      });

    if (error) {
      // Gestion des erreurs courantes
      if (error.message.includes('Bucket not found')) {
        return { 
          success: false, 
          error: 'Storage non configuré. Créez le bucket "dossier-documents" dans Supabase.' 
        };
      }
      if (error.message.includes('row-level security')) {
        return { 
          success: false, 
          error: 'Permissions insuffisantes. Vérifiez les politiques RLS du storage.' 
        };
      }
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.DOCUMENTS)
      .getPublicUrl(data.path);

    return { success: true, url: publicUrl, path: data.path };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function uploadAsset(file: File, name: string): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, url: URL.createObjectURL(file) };
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKETS.ASSETS)
      .upload(name, file, { upsert: true, contentType: file.type });

    if (error) return { success: false, error: error.message };

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.ASSETS).getPublicUrl(data.path);

    return { success: true, url: publicUrl, path: data.path };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}
