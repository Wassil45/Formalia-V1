import React, { useState } from 'react';
import { X, Lock, Mail, KeyRound } from 'lucide-react';
import { useUpdateUserEmail, useUpdateUserPassword } from '../../hooks/useAdminUsers';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; email?: string } | null;
}

export function SecuritySettingsModal({ isOpen, onClose, user }: SecuritySettingsModalProps) {
  const updateEmailMutation = useUpdateUserEmail(user?.id || '');
  const updatePasswordMutation = useUpdateUserPassword(user?.id || '');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'email' | 'password'>('email');

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen && user) {
      setEmail(user.email || '');
      setPassword('');
      setActiveTab('email');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== user.email) {
      updateEmailMutation.mutate(email, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length >= 6) {
      updatePasswordMutation.mutate(password, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
            <Lock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Sécurité du compte</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'email' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('email')}
          >
            <Mail className="w-4 h-4" /> Email
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'password' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('password')}
          >
            <KeyRound className="w-4 h-4" /> Mot de passe
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <p className="text-sm text-slate-500 mb-4">
                Modifier l'adresse email de cet utilisateur. Un email de confirmation sera envoyé à la nouvelle adresse si la confirmation est requise.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nouvel email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateEmailMutation.isPending || email === user.email}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {updateEmailMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : null}
                  Mettre à jour l'email
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-sm text-slate-500 mb-4">
                Définir un nouveau mot de passe pour cet utilisateur. L'utilisateur sera déconnecté de toutes ses sessions actives.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder="6 caractères minimum"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updatePasswordMutation.isPending || password.length < 6}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {updatePasswordMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : null}
                  Mettre à jour le mot de passe
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
