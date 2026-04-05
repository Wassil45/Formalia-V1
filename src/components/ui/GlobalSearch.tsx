import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Users, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <>
      <div className="relative w-64">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Rechercher (Cmd+K)" 
          onClick={() => setIsOpen(true)}
          readOnly
          className="w-full pl-9 pr-4 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md text-sm transition-all outline-none cursor-text"
        />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)}></div>
          <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 py-3 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input 
                ref={inputRef}
                type="text" 
                placeholder="Rechercher un dossier, un client, une formalité..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
              />
              <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded font-mono">ESC</div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2">
              {query.length > 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Recherche en cours pour "{query}"...
                </div>
              ) : (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Accès rapides</div>
                  <button onClick={() => handleSelect('/admin/dossiers')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-left transition-colors">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-md"><FileText className="w-4 h-4" /></div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">Tous les dossiers</div>
                      <div className="text-xs text-slate-500">Accéder à la liste complète des dossiers clients</div>
                    </div>
                  </button>
                  <button onClick={() => handleSelect('/admin/utilisateurs')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-left transition-colors">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-md"><Users className="w-4 h-4" /></div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">Utilisateurs</div>
                      <div className="text-xs text-slate-500">Gérer les clients et administrateurs</div>
                    </div>
                  </button>
                  <button onClick={() => handleSelect('/admin/produits')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-left transition-colors">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md"><ShoppingBag className="w-4 h-4" /></div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">Catalogue des formalités</div>
                      <div className="text-xs text-slate-500">Modifier les produits et formulaires</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
