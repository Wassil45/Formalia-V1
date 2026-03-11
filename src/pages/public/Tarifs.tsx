import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function Tarifs() {
  const { data: services, isLoading, isError, error } = useQuery({
    queryKey: ['formalites_catalogue_tarifs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formalites_catalogue')
        .select('*')
        .eq('is_active', true)
        .order('price_ht', { ascending: true });
      
      if (error) {
        console.error('Supabase error fetching formalites_catalogue:', error);
        throw error;
      }
      return data;
    }
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="pt-32 pb-20 bg-gradient-to-br from-[#0d0d1c] via-[#1a1a3a] to-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 font-display tracking-tight">
            Des tarifs <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">transparents</span>
          </h1>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-10">
            Pas de frais cachés. Payez uniquement pour les services dont vous avez besoin avec un accompagnement complet inclus.
          </p>
        </div>
      </section>

      <section className="py-20 -mt-16 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto shadow-sm">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-red-900 mb-2">Erreur de chargement</h3>
              <p className="text-red-700 mb-4">
                Impossible de charger les tarifs. Veuillez vérifier votre connexion ou réessayer plus tard.
              </p>
              <p className="text-sm text-red-500 font-mono bg-red-100 p-2 rounded">
                {error instanceof Error ? error.message : 'Erreur inconnue'}
              </p>
            </div>
          ) : services && services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col h-full relative">
                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
                      {service.type}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 font-display">{service.name}</h3>
                    <p className="text-slate-500 text-sm h-10">
                      {service.description || 'Service juridique complet.'}
                    </p>
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900">{service.price_ht}€</span>
                      <span className="text-slate-500 font-medium">HT</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">Soit {service.price_ttc || (service.price_ht * 1.2).toFixed(2)}€ TTC</p>
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    <li className="flex items-start gap-3 text-slate-700 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span>Vérification du dossier par un expert</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-700 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span>Génération des documents juridiques</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-700 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span>Transmission au greffe</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-700 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span>Assistance par email et téléphone</span>
                    </li>
                  </ul>

                  <Link to="/auth" className="block w-full text-center bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary transition-colors mt-auto">
                    Choisir cette offre
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">
              Aucun tarif disponible pour le moment.
            </div>
          )}
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12 font-display">Questions fréquentes</h2>
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Y a-t-il des frais supplémentaires ?</h3>
              <p className="text-slate-600">Nos tarifs incluent nos honoraires de traitement. Les frais légaux obligatoires (frais de greffe, annonce légale, INPI) vous seront facturés à prix coûtant, sans aucune marge de notre part.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Quels sont les moyens de paiement acceptés ?</h3>
              <p className="text-slate-600">Nous acceptons les paiements par carte bancaire (Visa, Mastercard, American Express) via notre partenaire sécurisé Stripe.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Puis-je me faire rembourser ?</h3>
              <p className="text-slate-600">Vous pouvez demander un remboursement intégral tant que votre dossier n'a pas été validé et transmis au greffe par nos formalistes.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
