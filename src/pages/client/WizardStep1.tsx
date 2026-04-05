import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { MOCK_SERVICES } from '../../data/mockServices';
import { useWizard } from '../../context/WizardContext';
import { Building2, RefreshCw, XCircle, CheckCircle2, 
  Clock, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

const TYPE_CONFIG = {
  immatriculation: {
    icon: Building2,
    color: 'text-primary',
    bg: 'bg-primary/8',
    border: 'border-primary/20',
    badge: 'bg-primary/10 text-primary',
    label: 'Création',
  },
  modification: {
    icon: RefreshCw,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    label: 'Modification',
  },
  radiation: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    label: 'Fermeture',
  },
};

export function WizardStep1() {
  const navigate = useNavigate();
  const { setFormalite } = useWizard();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: services, isLoading, isError } = useQuery<any[]>({
    queryKey: ['formalites_wizard'],
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

  const handleContinue = () => {
    const selected = services?.find(s => s.id === selectedId);
    if (!selected) return;
    setFormalite({
      id: selected.id,
      name: selected.name,
      type: selected.type,
      price_ht: selected.price_ht,
      tva_rate: selected.tva_rate,
    });
    navigate('/formalite/etape-2');
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Quelle formalité souhaitez-vous réaliser ?
        </h1>
        <p className="text-slate-500 text-lg">
          Sélectionnez le service correspondant à votre besoin.
        </p>
      </div>

      {isError && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <Info className="w-4 h-4 flex-shrink-0" />
          Mode démonstration — Configurez vos variables Supabase pour voir vos données réelles.
        </div>
      )}

      {/* Cards */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {services?.map(service => {
            const config = TYPE_CONFIG[service.type as keyof typeof TYPE_CONFIG] 
              ?? TYPE_CONFIG.immatriculation;
            const Icon = config.icon;
            const isSelected = selectedId === service.id;

            return (
              <button
                key={service.id}
                onClick={() => setSelectedId(service.id)}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200
                  bg-white hover:-translate-y-1 ${
                  isSelected
                    ? 'border-primary shadow-lg shadow-primary/10'
                    : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                }`}
              >
                {/* Badge sélectionné */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                )}

                <div className={`w-12 h-12 ${config.bg} ${config.color} rounded-xl 
                  flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full 
                    ${config.badge}`}>
                    {config.label}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {service.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div>
                    <span className="text-xl font-bold text-slate-900">
                      {service.price_ht}€
                    </span>
                    <span className="text-sm text-slate-400 ml-1">HT</span>
                  </div>
                  {service.estimated_delay_days && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {service.estimated_delay_days}j
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!selectedId}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold 
            text-white transition-all duration-200 ${
            selectedId 
              ? 'gradient-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5' 
              : 'bg-slate-200 cursor-not-allowed text-slate-400'
          }`}
        >
          Continuer
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
