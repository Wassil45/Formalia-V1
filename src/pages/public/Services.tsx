import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { MOCK_SERVICES } from '../../data/mockServices';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
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
        return [...MOCK_SERVICES].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      }
      
      try {
        const { data, error } = await supabase
          .from('formalites_catalogue')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true })
          .order('price_ht', { ascending: true });
        
        if (error) {
          console.error('Erreur Supabase:', error);
          // Fallback sur les données mock en cas d'erreur
          return [...MOCK_SERVICES].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        }
        return data && data.length > 0 ? data : [...MOCK_SERVICES].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      } catch (err) {
        console.error('Erreur réseau:', err);
        return [...MOCK_SERVICES].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
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
          <div className="space-y-24">
            {['immatriculation', 'modification', 'radiation'].map(type => {
              const typeServices = services?.filter(s => s.type === type).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
              if (!typeServices || typeServices.length === 0) return null;

              const typeTitle = {
                immatriculation: 'Création d\'entreprise',
                modification: 'Modification statutaire',
                radiation: 'Fermeture d\'entreprise'
              }[type];

              return (
                <div key={type} className="space-y-12">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-900">{typeTitle}</h2>
                    <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
                    {typeServices.map((service, idx) => {
                      // On met en avant le 2ème élément (index 1) ou celui qui a isPopular
                      const isHighlighted = idx === 1 || (typeServices.length === 1 && service.name.toLowerCase().includes('premium'));
                      const priceTTC = service.price_ttc ?? (service.price_ht * (1 + (service.tva_rate || 20) / 100));
                      
                      // Séparer la description en liste de fonctionnalités (par retour à la ligne ou point)
                      const features = service.description?.split(/\n|\. /).filter((f: string) => f.trim().length > 0) || [];
                      
                      const IconComponent = service.icon && (Icons as any)[service.icon] ? (Icons as any)[service.icon] : null;

                      return (
                        <div 
                          key={service.id}
                          className={`relative bg-white rounded-2xl p-8 transition-all duration-300 flex flex-col h-full ${
                            isHighlighted 
                              ? 'border-2 border-primary shadow-xl shadow-primary/10 scale-105 z-10' 
                              : 'border border-slate-200 shadow-sm hover:shadow-md'
                          }`}
                        >
                          {isHighlighted && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                              Le plus populaire
                            </div>
                          )}
                          
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                              {IconComponent && (
                                <div className={`p-2 rounded-lg ${isHighlighted ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                                  <IconComponent className="w-6 h-6" />
                                </div>
                              )}
                              <h3 className={`text-xl font-bold ${isHighlighted ? 'text-primary' : 'text-slate-700'}`}>
                                {service.name}
                              </h3>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-4xl font-black text-slate-900">
                                {service.price_ht}€
                              </span>
                              <span className="text-sm font-medium text-slate-500">
                                + frais légaux
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 min-h-[2.5rem]">
                              {features[0] || service.description}
                            </p>
                          </div>

                          <div className="flex-1 space-y-4 mb-8">
                            {features.map((feature: string, i: number) => (
                              <div key={i} className="flex items-start gap-3">
                                <div className="mt-0.5 bg-emerald-100 rounded-full p-0.5 flex-shrink-0">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="text-sm text-slate-600 leading-tight">{feature.replace(/\.$/, '')}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-auto pt-6 border-t border-slate-100">
                            <Link
                              to="/auth"
                              state={{ selectedFormaliteId: service.id, selectedFormaliteName: service.name }}
                              className={`flex items-center justify-center w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                                isHighlighted
                                  ? 'bg-primary text-white hover:bg-blue-600 shadow-md shadow-primary/20'
                                  : 'bg-white text-primary border-2 border-primary hover:bg-blue-50'
                              }`}
                            >
                              Choisir {service.name.split(' ')[0]}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
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
