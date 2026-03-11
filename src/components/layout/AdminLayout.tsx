import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutGrid, FolderOpen, Package, Users, Settings, LogOut } from 'lucide-react';

export function AdminLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex h-screen w-full bg-background-light font-display text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-slate-900 text-white shrink-0 h-full border-r border-slate-800">
        <div className="flex flex-col justify-between h-full p-4">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 px-2 py-2">
              <img src="/logo.png" alt="Formalia Logo" className="w-10 h-10 object-contain" />
              <div className="flex flex-col">
                <h1 className="text-base font-bold leading-normal text-white">Formalia</h1>
                <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/30 w-fit">ADMIN</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              <Link to="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                <LayoutGrid className="w-5 h-5" />
                <span className="text-sm font-medium">Vue d'ensemble</span>
              </Link>
              <Link to="/admin/dossiers" className="flex items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-white shadow-lg shadow-primary/20">
                <FolderOpen className="w-5 h-5" />
                <span className="text-sm font-medium">Dossiers</span>
              </Link>
              <Link to="/admin/produits" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                <Package className="w-5 h-5" />
                <span className="text-sm font-medium">Produits</span>
              </Link>
              <Link to="/admin/utilisateurs" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Utilisateurs</span>
              </Link>
              <Link to="/admin/parametres" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Paramètres</span>
              </Link>
            </nav>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                 {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-white">{profile?.first_name}</p>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
              <button onClick={signOut} className="ml-auto text-slate-400 hover:text-white">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-background-light">
        <Outlet />
      </main>
    </div>
  );
}
