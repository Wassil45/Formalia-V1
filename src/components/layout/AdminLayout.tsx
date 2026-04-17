import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { 
  LayoutGrid, FolderOpen, Package, Users, Settings, 
  LogOut, Scale, Menu, X, ChevronRight, Bell, HelpCircle, Mail,
  BarChart2, Download, UserCircle, Globe
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Vue d\'ensemble', icon: LayoutGrid, exact: true },
  { to: '/admin/dossiers', label: 'Dossiers', icon: FolderOpen },
  { to: '/admin/produits', label: 'Catalogue', icon: Package },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/admin/emails', label: 'Modèles emails', icon: Mail },
  { to: '/admin/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/admin/statistiques', label: 'Statistiques', icon: BarChart2 },
  { to: '/admin/exports', label: 'Exports', icon: Download },
  { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
  { to: '/admin/account', label: 'Mon compte', icon: UserCircle },
  { to: '/', label: 'Retour au site', icon: Globe },
];

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: settings } = useSettings();
  const logoUrl = settings?.logo_url;

  // Ferme la sidebar au changement de route (mobile)
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center 
              justify-center shadow-md">
              <Scale className="w-4 h-4 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-white">{settings?.company_name || 'Formalia'}</h1>
            <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">
              Admin
            </span>
          </div>
        </div>
        {/* Bouton fermer (mobile seulement) */}
        <button 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white 
            hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm 
                font-medium transition-all group ${
                active 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800 
          transition-colors">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center 
            justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
            {initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{profile?.email}</p>
          </div>
          <button onClick={signOut} title="Déconnexion"
            className="text-slate-500 hover:text-red-400 transition-colors p-1">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 flex-col bg-slate-900 shrink-0 h-full">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile (overlay) */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-slate-900 
            flex flex-col lg:hidden animate-slide-in-right">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar mobile */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 
          bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
            ) : (
              <div className="w-6 h-6 gradient-primary rounded-lg flex items-center 
                justify-center shadow-sm">
                <Scale className="w-3 h-3 text-white" />
              </div>
            )}
            <span className="text-sm font-bold text-slate-900">Admin</span>
          </div>
          <div className="w-9" /> {/* Spacer pour centrer le titre */}
        </div>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
