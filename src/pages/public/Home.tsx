import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, HeadphonesIcon } from 'lucide-react';

export function Home() {
  return (
    <div className="bg-background-light">
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-[radial-gradient(circle_at_10%_20%,_rgba(80,80,247,0.1)_0%,_rgba(248,248,252,1)_90%)]">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-primary text-xs font-semibold uppercase tracking-wide mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Nouveau : Tableau de bord intelligent
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6 tracking-tight font-display">
                Réalisez vos formalités d'entreprise <br/>en ligne, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">simplement.</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                La solution complète pour immatriculer, modifier ou fermer votre entreprise en toute simplicité et conformité. Dossier Kbis en 48h chrono.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-primary border border-transparent rounded-xl hover:bg-primary-dark hover:-translate-y-1 shadow-xl shadow-primary/30">
                  Commencer maintenant
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/services" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 transition-all duration-200 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-primary hover:border-primary/30 shadow-sm">
                  Voir nos offres
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-4 text-sm text-slate-500 font-medium">
                <p>⭐ 4.9/5 sur Trustpilot · Déjà utilisé par +15,000 entrepreneurs</p>
              </div>
            </div>
            
            {/* Mockup visual */}
            <div className="relative lg:h-[600px] flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-lg transform perspective-1000 -rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-500">
                <div className="glass-panel rounded-2xl p-6 shadow-2xl bg-white/80 border-white/60">
                   <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="flex gap-4 mb-6">
                    <div className="w-1/3 h-24 bg-blue-50 rounded-xl border border-blue-100 flex flex-col justify-center items-center p-2">
                      <div className="h-2 w-12 bg-blue-200 rounded mb-1"></div>
                      <div className="h-3 w-8 bg-primary rounded"></div>
                    </div>
                    <div className="w-1/3 h-24 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center items-center p-2">
                      <div className="h-2 w-12 bg-slate-200 rounded mb-1"></div>
                      <div className="h-3 w-8 bg-slate-300 rounded"></div>
                    </div>
                    <div className="w-1/3 h-24 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center items-center p-2">
                      <div className="h-2 w-12 bg-slate-200 rounded mb-1"></div>
                      <div className="h-3 w-8 bg-slate-300 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
