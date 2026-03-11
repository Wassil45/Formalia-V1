import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, ArrowRight, Building2, Briefcase, FileSignature, Scale, Zap, HeadphonesIcon, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function Services() {
  const { data: services, isLoading, isError, error } = useQuery({
    queryKey: ['formalites_catalogue'],
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'immatriculation': return <Building2 className="w-7 h-7" />;
      case 'modification': return <Briefcase className="w-7 h-7" />;
      case 'radiation': return <FileSignature className="w-7 h-7" />;
      default: return <Scale className="w-7 h-7" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'immatriculation': return 'bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white';
      case 'modification': return 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white';
      case 'radiation': return 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white';
      default: return 'bg-slate-50 text-slate-600 group-hover:bg-slate-600 group-hover:text-white';
    }
  };

  const getBgClass = (type: string) => {
    switch (type) {
      case 'immatriculation': return 'bg-primary/5';
      case 'modification': return 'bg-purple-50';
      case 'radiation': return 'bg-red-50';
      default: return 'bg-slate-50';
    }
  };

  const getLinkColorClass = (type: string) => {
    switch (type) {
      case 'immatriculation': return 'text-primary hover:text-primary-dark';
      case 'modification': return 'text-purple-600 hover:text-purple-800';
      case 'radiation': return 'text-red-500 hover:text-red-700';
      default: return 'text-slate-600 hover:text-slate-800';
    }
  };

  return (
    <div className="bg-background-light min-h-screen">
      <section className="pt-32 pb-20 bg-gradient-to-br from-[#0d0d1c] via-[#1a1a3a] to-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 font-display tracking-tight">
            Des formalités <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">sans friction</span>
          </h1>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-10">
            Découvrez notre catalogue complet de services juridiques. De la création à la fermeture, nous vous accompagnons à chaque étape de la vie de votre entreprise.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-red-900 mb-2">Erreur de chargement</h3>
              <p className="text-red-700 mb-4">
                Impossible de charger le catalogue des services. Veuillez vérifier votre connexion ou réessayer plus tard.
              </p>
              <p className="text-sm text-red-500 font-mono bg-red-100 p-2 rounded">
                {error instanceof Error ? error.message : 'Erreur inconnue'}
              </p>
            </div>
          ) : services && services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 ${getBgClass(service.type)}`}></div>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors relative z-10 ${getColorClass(service.type)}`}>
                    {getIcon(service.type)}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 font-display relative z-10">{service.name}</h3>
                  <p className="text-slate-600 mb-6 flex-grow relative z-10">
                    {service.description || 'Service juridique professionnel.'}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 relative z-10">
                    <span className="text-sm font-semibold text-slate-500">À partir de <span className="text-slate-900 text-lg">{service.price_ht}€</span></span>
                    <Link to="/auth" className={`font-bold flex items-center gap-1 ${getLinkColorClass(service.type)}`}>
                      Démarrer <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500">
              Aucun service disponible pour le moment.
            </div>
          )}
        </div>
      </section>

      {/* Reassurance */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">100% Dématérialisé</h3>
              <p className="text-sm text-slate-600">Zéro papier, tout se fait depuis votre espace sécurisé.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Paiement Sécurisé</h3>
              <p className="text-sm text-slate-600">Vos transactions sont chiffrées et protégées.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                <HeadphonesIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Experts Dédiés</h3>
              <p className="text-sm text-slate-600">Une équipe de juristes disponible par chat et téléphone.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Traitement Rapide</h3>
              <p className="text-sm text-slate-600">Dossiers traités en 24h et Kbis envoyé en 48h.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
