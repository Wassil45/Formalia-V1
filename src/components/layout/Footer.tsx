import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Formalia Logo" className="w-8 h-8 object-contain" />
              <h3 className="text-white text-lg font-bold">Formalia</h3>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              La solution LegalTech de référence pour gérer vos formalités d'entreprise en toute simplicité et sécurité.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions Légales</Link></li>
              <li><Link to="/cgv" className="hover:text-white transition-colors">CGV</Link></li>
              <li><Link to="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>contact@formalia.fr</li>
              <li>01 23 45 67 89</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 text-center">
          &copy; {new Date().getFullYear()} Formalia SAS. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
