import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUpdateProfile } from '../../hooks/useProfile';

export function ClientSettings() {
  const { profile, user } = useAuth();
  const updateProfileMutation = useUpdateProfile();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company_name: '',
    siret: '',
    address: '',
    city: '',
    postal_code: '',
  });

  useEffect(() => {
    if (profile) {
      const fullProfile = profile as any;
      setFormData({
        first_name: fullProfile.first_name || '',
        last_name: fullProfile.last_name || '',
        phone: fullProfile.phone || '',
        company_name: fullProfile.company_name || '',
        siret: fullProfile.siret || '',
        address: fullProfile.address || '',
        city: fullProfile.city || '',
        postal_code: fullProfile.postal_code || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      updateProfileMutation.mutate({ id: user.id, data: formData });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 min-w-0 w-full">
      <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-5 sticky top-0 z-10 w-full">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">Paramètres</h1>
          <p className="text-sm text-slate-500 mt-0.5 truncate">Gérez vos informations personnelles et vos préférences.</p>
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full min-w-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600 uppercase flex-shrink-0">
              {profile?.first_name?.[0] || ''}{profile?.last_name?.[0] || ''}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{profile?.first_name} {profile?.last_name}</h2>
              <p className="text-slate-500">{profile?.role === 'admin' ? 'Administrateur' : 'Client'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom *</label>
              <input 
                type="text" 
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input 
                type="text" 
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                defaultValue={profile?.email} 
                disabled 
                className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed" 
              />
              <p className="text-xs text-slate-400 mt-1">L'adresse email ne peut pas être modifiée ici. Veuillez contacter le support.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Entreprise</label>
              <input 
                type="text" 
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SIRET</label>
              <input 
                type="text" 
                name="siret"
                value={formData.siret}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
              <input 
                type="text" 
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
              <input 
                type="text" 
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
