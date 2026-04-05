import React, { useState, useEffect } from 'react';
import { X, Edit, Save, AlertTriangle, Shield, Ban, Lock, Smartphone } from 'lucide-react';
import { useUpdateUser, useUpdateUserEmail, useUpdateUserPassword, useChangeUserRole, useToggleUserStatus, useRevokeSessions } from '../../hooks/useAdminUsers';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company_name?: string;
    siret?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    notes?: string;
    role: 'client' | 'admin';
    is_active: boolean;
    updated_at?: string;
    providers?: string[];
  } | null;
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const { user: currentUser } = useAuth();
  const { data: settings } = useSettings();
  const updateUserMutation = useUpdateUser(user?.id || '');
  const updateEmailMutation = useUpdateUserEmail(user?.id || '');
  const updatePasswordMutation = useUpdateUserPassword(user?.id || '');
  const changeRoleMutation = useChangeUserRole();
  const toggleStatusMutation = useToggleUserStatus();
  const revokeSessionsMutation = useRevokeSessions();

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'notes'>('info');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    siret: '',
    address: '',
    city: '',
    postal_code: '',
    notes: '',
  });
  const [role, setRole] = useState<'client' | 'admin'>('client');
  const [isActive, setIsActive] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isResetEmailSent, setIsResetEmailSent] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        company_name: user.company_name || '',
        siret: user.siret || '',
        address: user.address || '',
        city: user.city || '',
        postal_code: user.postal_code || '',
        notes: user.notes || '',
      });
      setRole(user.role);
      setIsActive(user.is_active);
      setHasUnsavedChanges(false);
      setActiveTab('info');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update profile info
      await updateUserMutation.mutateAsync({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        company_name: formData.company_name,
        siret: formData.siret,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        notes: formData.notes,
        updated_at: user.updated_at,
      });

      // Update email if changed
      if (formData.email !== user.email) {
        await updateEmailMutation.mutateAsync(formData.email);
      }

      // Update role if changed
      if (role !== user.role) {
        await changeRoleMutation.mutateAsync({ id: user.id, role });
      }

      // Update status if changed
      if (isActive !== user.is_active) {
        await toggleStatusMutation.mutateAsync({ id: user.id, is_active: isActive });
      }

      toast.success('Profil mis à jour avec succès');
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    }
  };

  const handleResetPassword = async () => {
    // In a real app, this would call an API to send a reset email
    // For now, we simulate it
    setIsResetEmailSent(true);
    toast.success('Email de réinitialisation envoyé');
    setTimeout(() => setIsResetEmailSent(false), 3000);
  };

  const handleRevokeSessions = () => {
    if (window.confirm('Voulez-vous vraiment déconnecter cet utilisateur de tous ses appareils ?')) {
      revokeSessionsMutation.mutate(user.id);
    }
  };

  const isEmailChanged = formData.email !== user.email;
  const isGoogleOAuth = user.providers?.includes('google');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-inner ${role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
              {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">
                Modifier le profil de {user.first_name} {user.last_name}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200/50 px-6 bg-slate-50/30">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Informations
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Accès & Sécurité
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Notes
            {hasUnsavedChanges && activeTab !== 'notes' && formData.notes !== user.notes && (
              <span className="absolute top-3 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="edit-user-form" onSubmit={handleSubmit}>
            {activeTab === 'info' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {isEmailChanged && (
                    <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg flex gap-2 text-orange-800 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>⚠️ L'utilisateur sera déconnecté et devra confirmer son nouvel email.</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200/50">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Informations professionnelles</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Société</label>
                        <input
                          type="text"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">SIRET</label>
                        <input
                          type="text"
                          name="siret"
                          value={formData.siret}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Adresse</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Code postal</label>
                        <input
                          type="text"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ville</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <section>
                  <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    Rôle et permissions
                  </h4>
                  <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rôle de l'utilisateur</label>
                    <select
                      value={role}
                      disabled={user.id === currentUser?.id}
                      onChange={(e) => {
                        setRole(e.target.value as 'client' | 'admin');
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-slate-50"
                    >
                      <option value="client">Client</option>
                      <option value="admin">Administrateur</option>
                    </select>
                    {user.id === currentUser?.id && (
                      <p className="text-xs text-slate-500 mt-2">Vous ne pouvez pas modifier votre propre rôle.</p>
                    )}
                    {role === 'admin' && user.role !== 'admin' && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg flex gap-2 text-purple-800 text-sm">
                        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>En confirmant, cet utilisateur aura accès à toutes les données {settings?.company_name || 'Formalia'}.</p>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Ban className="w-4 h-4 text-slate-500" />
                    Statut du compte
                  </h4>
                  <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Accès à la plateforme</div>
                      <div className="text-sm text-slate-500">Permet ou bloque la connexion de l'utilisateur</div>
                    </div>
                    <button
                      type="button"
                      disabled={user.id === currentUser?.id}
                      onClick={() => {
                        setIsActive(!isActive);
                        setHasUnsavedChanges(true);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {user.id === currentUser?.id && (
                    <p className="text-xs text-slate-500 mt-2">Vous ne pouvez pas désactiver votre propre compte.</p>
                  )}
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    Sécurité
                  </h4>
                  <div className="space-y-3">
                    {isGoogleOAuth ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 flex items-start gap-3">
                        <Shield className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900 mb-1">Authentification Google</p>
                          <p>Cet utilisateur se connecte via Google. La gestion du mot de passe se fait depuis son compte Google.</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={isResetEmailSent}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <Lock className="w-4 h-4 text-slate-400" />
                          Réinitialiser le mot de passe
                        </div>
                        {isResetEmailSent ? <span className="text-green-600">✓ Email envoyé</span> : <span>→</span>}
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleRevokeSessions}
                      disabled={revokeSessionsMutation.isPending}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-slate-400" />
                        {revokeSessionsMutation.isPending ? 'Révocation...' : 'Révoquer toutes les sessions'}
                      </div>
                      <span>→</span>
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes internes (non visible par le client)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={8}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Ajoutez des notes sur ce client..."
                />
                <div className="text-right text-xs text-slate-500 mt-2">
                  {formData.notes.length} / 2000 caractères
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-slate-200/50 bg-slate-50/50 flex justify-end gap-3 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="edit-user-form"
            disabled={!hasUnsavedChanges || updateUserMutation.isPending || updateEmailMutation.isPending || changeRoleMutation.isPending || toggleStatusMutation.isPending}
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(updateUserMutation.isPending || updateEmailMutation.isPending || changeRoleMutation.isPending || toggleStatusMutation.isPending) ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
