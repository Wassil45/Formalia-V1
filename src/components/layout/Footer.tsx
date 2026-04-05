import { Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { Linkedin, Twitter, Scale } from 'lucide-react';

export function Footer() {
  const { data: settings } = useSettings();

  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isOpen = day >= 1 && day <= 5 && hour >= 9 && hour < 18;

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Logo & Tagline */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-6 group w-fit">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={`${settings?.company_name || 'Formalia'} Logo`} className="h-8 object-contain group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Scale className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-xl font-bold text-white tracking-tight">
                {settings?.company_name}
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              La LegalTech de référence pour gérer vos formalités d'entreprise en toute simplicité et sécurité.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Produit</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/services" className="text-slate-400 hover:text-white transition-colors">Services</Link></li>
              <li><Link to="/tarifs" className="text-slate-400 hover:text-white transition-colors">Tarifs</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">À propos</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Légal</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/mentions-legales" className="text-slate-400 hover:text-white transition-colors">Mentions légales</Link></li>
              <li><Link to="/cgv" className="text-slate-400 hover:text-white transition-colors">CGV</Link></li>
              <li><Link to="/confidentialite" className="text-slate-400 hover:text-white transition-colors">Confidentialité</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Accessibilité</a></li>
            </ul>
          </div>

          {/* Contact & Réseaux */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Contact</h4>
            <ul className="space-y-3 text-sm font-medium mb-8">
              <li>
                <a href={`mailto:${settings?.email_contact}`} className="text-slate-400 hover:text-white transition-colors">
                  {settings?.email_contact}
                </a>
              </li>
              <li>
                <span className="text-slate-400">{settings?.phone_contact}</span>
              </li>
              <li className="flex items-center gap-2 text-xs mt-2">
                <div className="relative flex h-2 w-2">
                  {isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isOpen ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                </div>
                <span className="text-slate-400">
                  {isOpen ? 'Disponible Lun-Ven 9h-18h' : 'Fermé (Lun-Ven 9h-18h)'}
                </span>
              </li>
            </ul>

            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Réseaux</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} {settings?.company_name} — SIREN {settings?.siren}
          </div>
          <div className="flex items-center gap-1">
            Fait avec <span className="text-red-500">❤️</span> en France
          </div>
        </div>
      </div>
    </footer>
  );
}
