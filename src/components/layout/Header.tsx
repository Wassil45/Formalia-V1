import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Scale, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const dashboardLink = profile?.role === 'admin' ? '/admin' : '/dashboard';

  const { data: settings } = useSettings();
  const logoUrl = settings?.logo_url;

  useEffect(() => setIsMenuOpen(false), [location]);

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/services', label: 'Services' },
    { to: '/tarifs', label: 'Tarifs' },
    { to: '/faq', label: 'FAQ' },
  ];

  const isActive = (path: string) => 
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* Overlay blur transparent pour la page (sorti du header pour corriger le bug du backdrop-filter) */}
      <div 
        className={`md:hidden fixed inset-0 transition-opacity duration-300 z-40 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: '64px', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={() => setIsMenuOpen(false)}
      />

      <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Burger mobile */}
            <button
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
              {logoUrl ? (
                <img src={logoUrl} alt={`${settings?.company_name || 'Formalia'} Logo`} className="h-8 object-contain group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center 
                  shadow-md group-hover:scale-105 transition-transform">
                  <Scale className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                {settings?.company_name || 'Formalia'}
              </span>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'text-primary bg-primary/8'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link
                  to={dashboardLink}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(dashboardLink)
                      ? 'text-primary bg-primary/8'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Mon espace
                </Link>
              )}
            </nav>

            {/* Actions desktop */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <button 
                    onClick={signOut}
                    className="text-sm font-medium text-slate-600 hover:text-red-600 
                      px-4 py-2 rounded-lg hover:bg-red-50 transition-all flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                  <Link 
                    to={dashboardLink}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold 
                      text-white gradient-primary rounded-xl shadow-md shadow-primary/25 
                      hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 
                      transition-all duration-200"
                  >
                    Tableau de bord
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/auth" 
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 
                      px-4 py-2 rounded-lg hover:bg-slate-50 transition-all"
                  >
                    Connexion
                  </Link>
                  <Link 
                    to="/auth"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold 
                      text-white gradient-primary rounded-xl shadow-md shadow-primary/25 
                      hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 
                      transition-all duration-200"
                  >
                    Démarrer
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Menu mobile positionné relativement à max-w-7xl mais affiché dessous le header */}
          <div 
            className={`md:hidden absolute left-0 w-full px-4 pt-2 pb-6 transition-all duration-300 origin-top z-50 ${
              isMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            }`} 
            style={{ top: '64px' }}
          >
            <div className="bg-white/90 backdrop-blur-3xl border border-white/80 shadow-[0_20px_40px_rgb(0,0,0,0.15)] rounded-[1.5rem] p-3.5 flex flex-col gap-1.5 ring-1 ring-black/5">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-5 py-3.5 rounded-2xl text-[15px] font-medium transition-all flex items-center ${
                    isActive(link.to)
                      ? 'text-primary bg-primary/10 shadow-sm shadow-primary/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Séparateur */}
              <div className="h-px bg-slate-200/50 my-1.5 mx-2" />
              
              {user ? (
                <>
                  <Link 
                    to={dashboardLink} 
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-5 py-3.5 rounded-2xl text-[15px] font-medium transition-all flex items-center ${
                      isActive(dashboardLink)
                        ? 'text-primary bg-primary/10 shadow-sm shadow-primary/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                    }`}
                  >
                    Mon espace
                  </Link>
                  <button 
                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                    className="px-5 py-3.5 rounded-2xl text-[15px] font-medium text-red-600 hover:bg-red-50 text-left flex items-center gap-2 transition-all mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/auth" 
                    onClick={() => setIsMenuOpen(false)}
                    className="px-5 py-3.5 rounded-2xl text-[15px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-all"
                  >
                    Connexion
                  </Link>
                  <Link 
                    to="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 mt-2 w-full py-4 text-[15px] 
                      font-bold text-white gradient-primary rounded-2xl shadow-lg shadow-primary/20 
                      hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Démarrer ma formalité
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
