import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FolderOpen, FileText, CreditCard, Settings, LogOut, Scale } from 'lucide-react';

export function ClientLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="bg-background-light text-slate-900 font-display antialiased min-h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-gradient-to-b from-[#0d0d1c] to-[#1a1a38] text-white flex flex-col h-screen sticky top-0 border-r border-slate-800">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/logo.png" alt="Formalia Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-xl font-bold tracking-tight">Formalia</h1>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/20 text-white shadow-sm border border-primary/20 group transition-all">
            <LayoutDashboard className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
            <span className="font-medium text-sm">Tableau de bord</span>
          </Link>
          <Link to="/dashboard/dossiers" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <FolderOpen className="w-5 h-5" />
            <span className="font-medium text-sm">Mes dossiers</span>
          </Link>
          <Link to="/dashboard/documents" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <FileText className="w-5 h-5" />
            <span className="font-medium text-sm">Documents</span>
          </Link>
          <Link to="/dashboard/facturation" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <CreditCard className="w-5 h-5" />
            <span className="font-medium text-sm">Facturation</span>
          </Link>
          <Link to="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Paramètres</span>
          </Link>
        </nav>

        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-full bg-slate-700 border-2 border-primary/30 flex items-center justify-center text-sm font-bold">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            <div className="flex flex-col overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
            </div>
            <button onClick={signOut} className="ml-auto text-slate-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50 relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        <Outlet />
      </main>
    </div>
  );
}
