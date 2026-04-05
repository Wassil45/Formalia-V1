import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { MOCK_SERVICES } from '../../data/mockServices';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, Zap, Star, FileText, CheckCircle2, Sparkles, Info } from 'lucide-react';

const TYPE_COLORS: Record<string, { border: string, glow: string, badge: string, text: string }> = {
  'creation': { border: 'border-l-blue-500', glow: 'hover:shadow-blue-500/20', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-600' },
  'modification': { border: 'border-l-purple-500', glow: 'hover:shadow-purple-500/20', badge: 'bg-purple-100 text-purple-700', text: 'text-purple-600' },
  'fermeture': { border: 'border-l-orange-500', glow: 'hover:shadow-orange-500/20', badge: 'bg-orange-100 text-orange-700', text: 'text-orange-600' },
  'default': { border: 'border-l-slate-500', glow: 'hover:shadow-slate-500/20', badge: 'bg-slate-100 text-slate-700', text: 'text-slate-600' }
};

export function Services() {
  const { data: services, isLoading, isError } = useQuery<any[]>({
    queryKey: ['formalites_catalogue'],
    queryFn: async () => {
      // Si Supabase n'est pas configuré, retourner les données mock
      if (!isSupabaseConfigured()) {
        console.warn('Supabase non configuré — données de démonstration utilisées');
        return MOCK_SERVICES;
      }
      
      try {
        const { data, error } = await supabase
          .from('formalites_catalogue')
          .select('*')
          .eq('is_active', true)
          .order('price_ht', { ascending: true });
        
        if (error) {
          console.error('Erreur Supabase:', error);
          // Fallback sur les données mock en cas d'erreur
          return MOCK_SERVICES;
        }
        return data && data.length > 0 ? data : MOCK_SERVICES;
      } catch (err) {
        console.error('Erreur réseau:', err);
        return MOCK_SERVICES;
      }
    },
    // Ne pas afficher d'erreur si on a des données mock
    retry: false,
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Mis à jour en temps réel
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Toutes vos formalités, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              gérées par des experts.
            </span>
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
              <Zap className="w-4 h-4 text-amber-500" /> Rapide
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Sécurisé
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
              <Star className="w-4 h-4 text-blue-500" /> Accompagnement
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
              <FileText className="w-4 h-4 text-purple-500" /> 100% en ligne
            </span>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        {isError && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <Info className="w-4 h-4 flex-shrink-0" />
            Mode démonstration — Configurez vos variables Supabase pour voir vos données réelles.
          </div>
        )}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-64" />
            ))}
          </div>
        ) : services?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500">Aucun service disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services?.map((service, idx) => {
              const typeStyle = TYPE_COLORS[service.category?.toLowerCase()] || TYPE_COLORS.default;
              const isPopular = service.name.toLowerCase().includes('immatriculation');
              const priceTTC = service.price_ttc ?? (service.price_ht * (1 + (service.tva_rate || 20) / 100));

              return (
                <div 
                  key={service.id}
                  className={`relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 ${typeStyle.border} border-l-4 ${typeStyle.glow} animate-fade-in-up flex flex-col`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {isPopular && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Populaire
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold mb-3 uppercase tracking-wider ${typeStyle.badge}`}>
                      {service.category}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                      {service.name}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        <Clock className="w-4 h-4" />
                        {service.estimated_days} jours
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900">
                          {priceTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          soit {service.price_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} HT
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/auth"
                      state={{ selectedFormaliteId: service.id, selectedFormaliteName: service.name }}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-primary transition-colors shadow-md"
                    >
                      Démarrer
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reassurance Section */}
      <section className="max-w-5xl mx-auto px-6 mt-12">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-black text-primary mb-2">+10 000</div>
              <div className="text-sm font-medium text-slate-500">Dossiers traités</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-black text-emerald-500 mb-2">98%</div>
              <div className="text-sm font-medium text-slate-500">De satisfaction</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-black text-amber-500 mb-2">48h</div>
              <div className="text-sm font-medium text-slate-500">En moyenne</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-black text-purple-500 mb-2">0</div>
              <div className="text-sm font-medium text-slate-500">Papier requis</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
