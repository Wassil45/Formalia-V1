import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { ScrollToTop } from '../ui/ScrollToTop';
import { 
  LayoutDashboard, FolderOpen, FileText, 
  CreditCard, Settings, LogOut, Scale, ChevronRight, Plus, HelpCircle, MessageSquare, Menu, X, Globe
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/dossiers', label: 'Mes dossiers', icon: FolderOpen },
  { to: '/dashboard/documents', label: 'Documents', icon: FileText },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/facturation', label: 'Facturation', icon: CreditCard },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/dashboard/parametres', label: 'Paramètres', icon: Settings },
  { to: '/', label: 'Retour au site', icon: Globe },
];

export function ClientLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const { data: settings } = useSettings();
  const logoUrl = settings?.logo_url;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`;

  const SidebarContent = () => (
    <>
      {/* Mobile Header in Sidebar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
          ) : (
            <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center shadow-md">
              <Scale className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          <span className="text-sm font-bold text-slate-900">{settings?.company_name || 'Formalia'}</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* CTA New dossier */}
      <div className="px-3 py-4">
        <Link to="/formalite"
          className="flex items-center gap-2 w-full px-3.5 py-2.5 gradient-primary 
            text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 
            hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <Plus className="w-3.5 h-3.5" />
          Nouvelle formalité
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm 
                font-medium transition-all group ${
                active 
                  ? 'bg-primary/8 text-primary' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-50">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 
          transition-colors group">
          <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center 
            text-primary text-xs font-bold flex-shrink-0 shadow-sm">
            {initials.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{profile?.email}</p>
          </div>
          <button onClick={signOut} title="Déconnexion"
            className="text-slate-400 hover:text-red-500 transition-colors p-1">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* Sidebar Mobile (Overlay) */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white 
            flex flex-col shadow-2xl animate-slide-in-right">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0 w-full">
        {/* Topbar */}
        <div className="flex items-center justify-between px-4 py-3 
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
            <span className="text-sm font-bold text-slate-900">Espace Client</span>
          </div>
          <div className="w-9" /> {/* Spacer */}
        </div>

        <div id="client-scroll-container" className="flex-1 overflow-y-auto relative">
          <Outlet />
          <ScrollToTop containerId="client-scroll-container" />
        </div>
      </main>
    </div>
  );
}
