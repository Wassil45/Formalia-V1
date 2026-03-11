import { useState } from 'react';
import { Building2, MapPin, User, ArrowRight, ArrowLeft } from 'lucide-react';

export function WizardStep2() {
  return (
    <div className="flex-grow flex flex-col items-center py-8 md:py-12 px-4 bg-background-light min-h-screen">
      <div className="w-full max-w-[780px] flex flex-col gap-8">
        
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <p className="text-slate-900 text-base font-medium">Étape 2 sur 5</p>
            <p className="text-primary text-sm font-semibold">40% complété</p>
          </div>
          <div className="w-full rounded-full bg-slate-200 h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: '40%' }}></div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 text-3xl md:text-4xl font-black tracking-tight font-display">Informations sur l'entreprise</h1>
          <p className="text-slate-500 text-lg">Ces informations nous permettront de rédiger vos statuts et formulaires M0.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <form className="flex flex-col gap-8">
            
            {/* Section: Identité */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-slate-900">Identité de la société</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Dénomination sociale <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Ex: Formalia Tech" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Sigle (Optionnel)</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Ex: FT" />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Objet social principal <span className="text-red-500">*</span></label>
                  <textarea rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none" placeholder="Décrivez l'activité principale de votre entreprise..."></textarea>
                </div>
              </div>
            </div>

            {/* Section: Siège social */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-slate-900">Siège social</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5 md:col-span-3">
                  <label className="text-sm font-semibold text-slate-700">Adresse <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Numéro et nom de rue" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Code postal <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Ex: 75001" />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Ville <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Ex: Paris" />
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-2 px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button className="bg-primary hover:bg-primary/90 text-white font-bold text-base px-8 py-3 rounded-xl shadow-lg shadow-primary/30 transition-all transform active:scale-95 flex items-center gap-2">
            Continuer <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
