import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, X } from 'lucide-react';

export function WizardStep3() {
  return (
    <div className="flex-grow flex flex-col items-center py-8 md:py-12 px-4 bg-background-light min-h-screen">
      <div className="w-full max-w-[780px] flex flex-col gap-8">
        
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <p className="text-slate-900 text-base font-medium">Étape 3 sur 5</p>
            <p className="text-primary text-sm font-semibold">60% complété</p>
          </div>
          <div className="w-full rounded-full bg-slate-200 h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: '60%' }}></div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 text-3xl md:text-4xl font-black tracking-tight font-display">Téléchargement des documents</h1>
          <p className="text-slate-500 text-lg">Veuillez fournir les justificatifs nécessaires à l'immatriculation de votre entreprise.</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Active Drag & Drop */}
          <div className="bg-white rounded-xl border-2 border-dashed border-primary/30 hover:border-primary transition-colors p-8 flex flex-col items-center justify-center gap-4 text-center group cursor-pointer relative overflow-hidden">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-1 relative z-10">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-slate-900 font-bold text-lg">Justificatif de domicile</h3>
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded">Requis</span>
              </div>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Glissez-déposez votre fichier ici (PDF, JPG, PNG) ou <span className="text-primary font-medium underline decoration-2 decoration-primary/30 hover:decoration-primary">cliquez pour parcourir</span>
              </p>
              <p className="text-slate-400 text-xs mt-2">Max. 10 Mo par fichier</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-200">
          <button className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-2 px-4 py-2 rounded-lg transition-colors">
            Retour
          </button>
          <button className="bg-primary hover:bg-primary/90 text-white font-bold text-base px-8 py-3 rounded-xl shadow-lg shadow-primary/30 transition-all transform active:scale-95 flex items-center gap-2">
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
