import { useState } from 'react';
import { X, AlertTriangle, Shield, Trash2 } from 'lucide-react';
import { useDeleteUser } from '../../hooks/useAdminUsers';
import { toast } from 'sonner';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; email: string; first_name?: string; last_name?: string; dossiers_count?: number } | null;
}

export function DeleteUserModal({ isOpen, onClose, user }: DeleteUserModalProps) {
  const [mode, setMode] = useState<'soft' | 'hard'>('soft');
  const [reason, setReason] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const deleteMutation = useDeleteUser();

  if (!isOpen || !user) return null;

  const hasDossiers = (user.dossiers_count || 0) > 0;
  const isEmailMatch = confirmEmail === user.email;
  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

  const handleDelete = () => {
    if (!isEmailMatch) return;
    
    deleteMutation.mutate(
      { id: user.id, mode, reason },
      {
        onSuccess: () => {
          toast.success('Utilisateur supprimé avec succès');
          onClose();
        },
        onError: (error) => {
          toast.error(error.message || 'Erreur lors de la suppression');
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Supprimer le compte de {userName}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-orange-800">⚠️ Cette action est irréversible</h4>
              <p className="text-sm text-orange-700 mt-1">
                La suppression d'un compte utilisateur entraîne la perte d'accès à l'espace client.
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-slate-900">Mode de suppression</h3>
            
            <label className={`flex gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${mode === 'soft' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="mt-0.5">
                <input 
                  type="radio" 
                  name="deleteMode" 
                  value="soft" 
                  checked={mode === 'soft'} 
                  onChange={() => setMode('soft')}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-900">Anonymiser le compte</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Recommandé</span>
                </div>
                <p className="text-sm text-slate-600">
                  Les données personnelles sont effacées. Les dossiers et paiements sont conservés (obligation légale 7 ans). Conforme RGPD.
                </p>
              </div>
            </label>

            <label className={`flex gap-4 p-4 rounded-xl border-2 transition-all ${hasDossiers ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : mode === 'hard' ? 'border-red-600 bg-red-50 cursor-pointer' : 'border-slate-200 hover:border-slate-300 cursor-pointer'}`}>
              <div className="mt-0.5">
                <input 
                  type="radio" 
                  name="deleteMode" 
                  value="hard" 
                  checked={mode === 'hard'} 
                  onChange={() => !hasDossiers && setMode('hard')}
                  disabled={hasDossiers}
                  className="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-600 disabled:opacity-50"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className={`w-4 h-4 ${hasDossiers ? 'text-slate-400' : 'text-red-600'}`} />
                  <span className={`font-semibold ${hasDossiers ? 'text-slate-500' : 'text-slate-900'}`}>Suppression complète</span>
                </div>
                <p className="text-sm text-slate-600">
                  Supprime définitivement le compte et toutes les données.
                </p>
                {hasDossiers && (
                  <p className="text-xs font-medium text-red-600 mt-2">
                    Impossible : ce compte a {user.dossiers_count} dossier(s) actif(s).
                  </p>
                )}
              </div>
            </label>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Raison de la suppression (usage interne)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Ex: Demande client, compte inactif..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Saisissez <span className="font-bold select-all">{user.email}</span> pour confirmer
            </label>
            <input
              type="text"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={user.email}
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={!isEmailMatch || deleteMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Suppression...
              </>
            ) : (
              'Confirmer la suppression'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
