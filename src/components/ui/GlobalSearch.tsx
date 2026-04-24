import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Users, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';

export function GlobalSearchTrigger({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const buttonClasses = theme === 'dark' 
    ? "bg-slate-800/50 hover:bg-slate-800 text-slate-400"
    : "bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200";

  const kbdClasses = theme === 'dark'
    ? "bg-slate-700 text-slate-300"
    : "bg-white text-slate-500 border border-slate-200 shadow-sm";

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-xl transition-colors cursor-text group outline-none ${buttonClasses}`}
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Recherche rapide...</span>
        <span className={`hidden group-hover:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded ${kbdClasses}`}>Cmd+K</span>
      </button>

      {isOpen && (
        <GlobalSearchModal onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

function GlobalSearchModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const { data: results, isLoading } = useQuery<{ dossiers: any[]; clients: any[]; formalites: any[] } | null>({
    queryKey: ['global-search', debouncedSearch, profile?.role],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return null;
      
      const searchTerm = `%${debouncedSearch}%`;
      const isUid = debouncedSearch.length > 20 && debouncedSearch.includes('-');
      
      // Résultats structurés
      const out = { dossiers: [] as any[], clients: [] as any[], formalites: [] as any[] };

      // 1. Chercher Formulaires (Catalogue)
      const { data: formalites } = await supabase
        .from('formalites_catalogue')
        .select('id, name')
        .ilike('name', searchTerm)
        .limit(3);
      if (formalites) out.formalites = formalites;

      // 2. Chercher Dossiers
      let dossiersQuery: any = supabase
        .from('dossiers')
        .select(`id, company_name, representative_first_name, representative_last_name, status, formalites_catalogue(name)`)
        .limit(5);

      if (!isAdmin && profile?.id) {
        dossiersQuery = dossiersQuery.eq('user_id', profile.id);
      }

      const { data: dossiers } = await (isUid 
        ? dossiersQuery.eq('id', debouncedSearch) 
        : dossiersQuery.or(`company_name.ilike.${searchTerm},representative_first_name.ilike.${searchTerm},representative_last_name.ilike.${searchTerm}`));
        
      if (dossiers) out.dossiers = dossiers;

      // 3. Chercher Clients (Admin uniquement)
      if (isAdmin) {
        const { data: clients } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('role', 'client')
          .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
          .limit(3);
        if (clients) out.clients = clients;
      }

      return out;
    },
    enabled: debouncedSearch.length >= 2,
  });

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-white rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Input area */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-blue-500 mr-3" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder={isAdmin ? "Rechercher un dossier, un client, ou une formalité..." : "Rechercher un dossier ou une formalité..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-900 text-lg placeholder:text-slate-400"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-2" />}
          <div className="text-[10px] text-slate-400 font-mono border border-slate-200 px-1.5 py-0.5 rounded ml-2">ESC</div>
        </div>

        {/* Results area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {(!debouncedSearch || debouncedSearch.length < 2) ? (
            <div className="p-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Accès rapides</div>
              <button onClick={() => handleSelect(isAdmin ? '/admin/dossiers' : '/dashboard/dossiers')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">Vos dossiers</div>
                  <div className="text-xs text-slate-500">Accéder à la liste des dossiers</div>
                </div>
              </button>
              {isAdmin && (
                <button onClick={() => handleSelect('/admin/utilisateurs')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors mt-1">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Utilisateurs</div>
                    <div className="text-xs text-slate-500">Gérer les clients</div>
                  </div>
                </button>
              )}
            </div>
          ) : results ? (
            <div className="p-4 space-y-4">
              
              {/* DOSSIERS */}
              {results.dossiers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Dossiers
                  </div>
                  <div className="space-y-1">
                    {results.dossiers.map(d => (
                      <button 
                        key={d.id} 
                        onClick={() => handleSelect(isAdmin ? `/admin/dossiers/${d.id}` : `/dashboard/dossiers/${d.id}`)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-blue-50 rounded-xl text-left transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {d.company_name || `${d.representative_first_name} ${d.representative_last_name}`}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {(d.formalites_catalogue as any)?.name} • ID: {d.id.split('-')[0]}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CLIENTS */}
              {results.clients.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-2 mt-2">
                    <Users className="w-3.5 h-3.5" /> Clients
                  </div>
                  <div className="space-y-1">
                    {results.clients.map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => handleSelect('/admin/utilisateurs')}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-purple-50 rounded-xl text-left transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {c.first_name} {c.last_name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{c.email}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FORMALITÉS */}
              {results.formalites.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-2 mt-2">
                    <ShoppingBag className="w-3.5 h-3.5" /> Formalités (Catalogue)
                  </div>
                  <div className="space-y-1">
                    {results.formalites.map(f => (
                      <button 
                        key={f.id} 
                        onClick={() => handleSelect(isAdmin ? '/admin/produits' : '/formalite')}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-emerald-50 rounded-xl text-left transition-colors group"
                      >
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {f.name}
                        </div>
                        <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.dossiers.length === 0 && results.clients.length === 0 && results.formalites.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-sm flex flex-col items-center">
                  <Search className="w-8 h-8 text-slate-300 mb-2" />
                  Aucun résultat trouvé pour "{debouncedSearch}"
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
