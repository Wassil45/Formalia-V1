import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { MOCK_SERVICES } from '../../data/mockServices';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ShieldCheck, Lock, CreditCard, Sparkles, ArrowRight, Info } from 'lucide-react';

const FAQ_ITEMS = [
  { 
    q: "Quels sont les frais annexes (greffe, annonces légales) ?", 
    a: "Nos tarifs incluent nos honoraires de traitement. Les frais administratifs obligatoires (greffe, INPI, annonces légales) vous seront facturés à l'euro près, sans aucune marge de notre part." 
  },
  { 
    q: "Combien de temps prend une formalité ?", 
    a: "En moyenne, un dossier complet est traité et envoyé au greffe en 48h ouvrées. Le délai final dépend ensuite de la réactivité de l'administration (généralement 3 à 7 jours)." 
  },
  { 
    q: "Puis-je modifier ma demande après paiement ?", 
    a: "Oui, tant que votre dossier n'a pas été validé et télétransmis au greffe par nos formalistes, vous pouvez nous contacter pour apporter des modifications." 
  },
  { 
    q: "Le paiement est-il sécurisé ?", 
    a: "Absolument. Nous utilisons Stripe, leader mondial des paiements en ligne. Vos données bancaires sont chiffrées et ne transitent jamais par nos serveurs." 
  }
];

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-5 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="font-bold text-slate-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div 
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-5 pt-0 text-slate-600 leading-relaxed border-t border-slate-50">
          {answer}
        </div>
      </div>
    </div>
  );
}

const sortServices = (services: any[]) => {
  const typeOrder: Record<string, number> = {
    'immatriculation': 1,
    'modification': 2,
    'radiation': 3
  };
  
  return [...services].sort((a, b) => {
    // 1. Ordre par type (Création -> Modification -> Fermeture)
    const orderA = typeOrder[a.type] || 99;
    const orderB = typeOrder[b.type] || 99;
    if (orderA !== orderB) return orderA - orderB;
    
    // 2. Par order_index (facultatif si défini en admin)
    if (a.order_index != null && b.order_index != null && a.order_index !== b.order_index) {
      return a.order_index - b.order_index;
    }
    
    // 3. Par prix HT par défaut
    return (a.price_ht || 0) - (b.price_ht || 0);
  });
};

export function Tarifs() {
  const { data: services, isLoading, isError } = useQuery<any[]>({
    queryKey: ['formalites_catalogue_tarifs'],
    queryFn: async () => {
      // Si Supabase n'est pas configuré, retourner les données mock
      if (!isSupabaseConfigured()) {
        console.warn('Supabase non configuré — données de démonstration utilisées');
        return sortServices(MOCK_SERVICES);
      }
      
      try {
        const { data, error } = await supabase
          .from('formalites_catalogue')
          .select('*')
          .eq('is_active', true);
        
        if (error) {
          console.error('Erreur Supabase:', error);
          // Fallback sur les données mock en cas d'erreur
          return sortServices(MOCK_SERVICES);
        }
        return data && data.length > 0 ? sortServices(data) : sortServices(MOCK_SERVICES);
      } catch (err) {
        console.error('Erreur réseau:', err);
        return sortServices(MOCK_SERVICES);
      }
    },
    // Ne pas afficher d'erreur si on a des données mock
    retry: false,
  });

  const minPrice = services && services.length > 0 
    ? Math.min(...services.map(s => s.price_ht)) 
    : 0;

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="bg-slate-900 pt-32 pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/30 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Des tarifs simples, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              sans frais cachés.
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Payez uniquement pour le service dont vous avez besoin. 
            Nos honoraires sont transparents et compétitifs.
          </p>
          
          {minPrice > 0 && (
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
              <span className="text-slate-300 font-medium">À partir de</span>
              <span className="text-3xl font-black text-white">{minPrice}€ <span className="text-lg text-slate-400 font-medium">HT</span></span>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
        {isError && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <Info className="w-4 h-4 flex-shrink-0" />
            Mode démonstration — Configurez vos variables Supabase pour voir vos données réelles.
          </div>
        )}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl h-[500px] animate-pulse shadow-xl" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services?.map((service, idx) => {
              const isPopular = service.name.toLowerCase().includes('immatriculation');
              const priceTTC = service.price_ttc ?? (service.price_ht * (1 + (service.tva_rate || 20) / 100));
              
              return (
                <div 
                  key={service.id}
                  className={`bg-white rounded-3xl p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col animate-fade-in-up ${
                    isPopular ? 'ring-2 ring-primary shadow-primary/20 relative' : 'border border-slate-100 shadow-slate-200/50'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                      <Sparkles className="w-3.5 h-3.5" />
                      Le plus demandé
                    </div>
                  )}

                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider mb-4">
                      {service.type === 'immatriculation' ? 'Création' : service.type === 'modification' ? 'Modification' : service.type === 'radiation' ? 'Fermeture' : 'Formalité'}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-2">
                      {service.name}
                    </h3>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-slate-900">{service.price_ht}€</span>
                      <span className="text-slate-500 font-medium">HT</span>
                    </div>
                    <div className="text-sm text-slate-400 font-medium mt-1">
                      Soit {priceTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} TTC
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 text-sm">Traitement en {service.estimated_days} jours ouvrés</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 text-sm">Vérification par un expert</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 text-sm">Assistance par chat et email</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 text-sm">Garantie anti-rejet greffe</span>
                    </li>
                  </ul>

                  <Link
                    to="/auth"
                    state={{ selectedFormaliteId: service.id, selectedFormaliteName: service.name }}
                    className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-bold transition-all ${
                      isPopular 
                        ? 'gradient-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5' 
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                    }`}
                  >
                    Choisir cette offre
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust Banner */}
      <section className="max-w-4xl mx-auto px-6 mt-16">
        <div className="flex flex-wrap items-center justify-center gap-8 py-8 border-y border-slate-200 opacity-60 grayscale">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
            <Lock className="w-5 h-5" /> Paiement 100% sécurisé
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
            <CreditCard className="w-5 h-5" /> Visa / Mastercard
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
            <ShieldCheck className="w-5 h-5" /> Propulsé par Stripe
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Questions fréquentes</h2>
          <p className="text-slate-500">Tout ce que vous devez savoir sur notre facturation.</p>
        </div>
        
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <FaqItem question={item.q} answer={item.a} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
