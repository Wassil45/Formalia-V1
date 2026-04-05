import { User, Shield, Key, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminAccount() {
  const { profile } = useAuth();

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">Mon compte</h2>
        <p className="text-slate-500 mt-1 text-sm">Gérez vos informations personnelles et vos préférences.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-700 border-4 border-white shadow-sm">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile?.first_name} {profile?.last_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> Administrateur
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                <input type="text" defaultValue={profile?.first_name} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input type="text" defaultValue={profile?.last_name} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" defaultValue={profile?.email} disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-sm outline-none cursor-not-allowed" />
                <p className="text-xs text-slate-400 mt-1">L'adresse email ne peut pas être modifiée.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Sécurité</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
              <Key className="w-4 h-4" /> Modifier le mot de passe
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all">
            <Save className="w-4 h-4" /> Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
