import { User, Shield, Key, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminAccount() {
  const { profile } = useAuth();

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-5 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Mon compte</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gérez vos informations personnelles et vos préférences.</p>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-3xl font-bold text-primary border-4 border-white shadow-sm flex-shrink-0">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{profile?.first_name} {profile?.last_name}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Administrateur
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8 space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label>
                  <input type="text" defaultValue={profile?.first_name} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label>
                  <input type="text" defaultValue={profile?.last_name} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input type="email" defaultValue={profile?.email} disabled className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-sm outline-none cursor-not-allowed" />
                  <p className="text-xs text-slate-400 mt-1">L'adresse email ne peut pas être modifiée.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Sécurité</h3>
              <button className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                <Key className="w-4 h-4" /> Modifier le mot de passe
              </button>
            </div>
          </div>

          <div className="p-5 md:p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 gradient-primary text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <Save className="w-4 h-4" /> Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
