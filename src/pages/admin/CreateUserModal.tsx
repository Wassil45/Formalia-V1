import React, { useState } from 'react';
import { X, User, Shield, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCreateUser } from '../../hooks/useAdminUsers';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const createUserMutation = useCreateUser();
  const { data: settings } = useSettings();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'client' as 'client' | 'admin',
    phone: '',
    company_name: '',
    siret: '',
    address: '',
    city: '',
    postal_code: '',
    send_invite: true,
    auto_confirm: true,
  });
  const [showProInfo, setShowProInfo] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    return score;
  };

  const strength = calculatePasswordStrength(formData.password);
  const strengthColor = strength === 0 ? 'bg-slate-200' : strength === 1 ? 'bg-red-500' : strength === 2 ? 'bg-orange-500' : 'bg-green-500';
  const strengthText = strength === 0 ? '' : strength === 1 ? 'Faible' : strength === 2 ? 'Moyen' : 'Fort';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    createUserMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Compte créé avec succès');
        if (formData.send_invite) {
          toast.success(`Email d'invitation envoyé à ${formData.email}`);
        }
        onClose();
        setFormData({
          email: '', password: '', confirmPassword: '', first_name: '', last_name: '',
          role: 'client', phone: '', company_name: '', siret: '', address: '', city: '', postal_code: '',
          send_invite: true, auto_confirm: true,
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Erreur lors de la création du compte');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-[560px] overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">Créer un nouveau compte</h2>
            <p className="text-sm text-slate-500 mt-1">Administrateur ou client</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {createUserMutation.isError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">{createUserMutation.error?.message || 'Une erreur est survenue'}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'client' }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.role === 'client' 
                  ? 'border-blue-500 bg-blue-50/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${formData.role === 'client' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                <User className="w-5 h-5" />
              </div>
              <h3 className={`font-semibold mb-1 ${formData.role === 'client' ? 'text-blue-900' : 'text-slate-700'}`}>Client</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Accès à l'espace personnel et aux formalités</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.role === 'admin' 
                  ? 'border-purple-500 bg-purple-50/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${formData.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                <Shield className="w-5 h-5" />
              </div>
              <h3 className={`font-semibold mb-1 ${formData.role === 'admin' ? 'text-purple-900' : 'text-slate-700'}`}>Administrateur</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Accès complet au back-office {settings?.company_name || 'Formalia'}</p>
            </button>
          </div>

          <form id="create-user-form" onSubmit={handleSubmit} className="space-y-5">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Email professionnel *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {formData.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: `${(strength / 3) * 100}%` }} />
                    </div>
                    <span className={`text-[10px] font-medium ${strength === 3 ? 'text-green-600' : 'text-slate-500'}`}>{strengthText}</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-1">8 caractères min · 1 majuscule · 1 chiffre</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
              </div>
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

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowProInfo(!showProInfo)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-slate-700 hover:bg-slate-100/50 transition-colors"
              >
                Informations professionnelles
                {showProInfo ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              
              {showProInfo && (
                <div className="p-4 border-t border-slate-200 space-y-4 bg-white/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Nom de la société</label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">SIRET</label>
                      <input
                        type="text"
                        name="siret"
                        value={formData.siret}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Ville</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    name="send_invite"
                    checked={formData.send_invite}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 group-hover:border-blue-500" />
                  <CheckCircle2 className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">Envoyer un email d'invitation</div>
                  <div className="text-xs text-slate-500">L'utilisateur recevra un lien pour se connecter</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    name="auto_confirm"
                    checked={formData.auto_confirm}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 group-hover:border-blue-500" />
                  <CheckCircle2 className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">Confirmer l'email automatiquement</div>
                  <div className="text-xs text-slate-500">Recommandé pour les comptes créés par un administrateur</div>
                </div>
              </label>
            </div>
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
            form="create-user-form"
            disabled={createUserMutation.isPending || formData.password !== formData.confirmPassword || strength < 2}
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createUserMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Création...
              </>
            ) : (
              'Créer le compte →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
