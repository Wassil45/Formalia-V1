import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
      <div className="glass-panel border-b border-white/50 shadow-sm bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Formalia Logo" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold tracking-tight text-slate-900">Formalia</span>
            </Link>
            
            <nav className="hidden md:flex gap-8">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Accueil</Link>
              <Link to="/services" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Services</Link>
              <Link to="/tarifs" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Tarifs</Link>
              <Link to="/auth" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Connexion</Link>
            </nav>

            <div className="hidden md:block">
              <Link to="/auth" className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 bg-primary border border-transparent rounded-full hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/20">
                Démarrer ma formalité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
