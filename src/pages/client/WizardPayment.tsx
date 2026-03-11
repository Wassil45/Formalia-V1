import { CheckCircle2, FileText, CreditCard, ShieldCheck } from 'lucide-react';

export function WizardPayment() {
  return (
    <div className="flex-grow flex flex-col items-center py-8 md:py-12 px-4 bg-background-light min-h-screen">
      <div className="w-full max-w-[900px] flex flex-col gap-8">
        
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <p className="text-slate-900 text-base font-medium">Étape 5 sur 5</p>
            <p className="text-primary text-sm font-semibold">100% complété</p>
          </div>
          <div className="w-full rounded-full bg-slate-200 h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 text-3xl md:text-4xl font-black tracking-tight font-display">Finalisation du dossier</h1>
          <p className="text-slate-500 text-lg">Vérifiez les informations et procédez au paiement sécurisé.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recap Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-500" />
                <h2 className="font-bold text-slate-900">Récapitulatif des informations</h2>
              </div>
              <div className="p-6 flex flex-col gap-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type de formalité</span>
                    <span className="text-slate-900 font-medium">Création SAS</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dénomination</span>
                    <span className="text-slate-900 font-medium">Formalia Tech</span>
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Siège social</span>
                    <span className="text-slate-900 font-medium">123 Avenue des Champs-Élysées, 75008 Paris</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Documents fournis</h3>
                  <ul className="flex flex-col gap-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Pièce d'identité du dirigeant
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Justificatif de domicile
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          </div>

          {/* Payment Column */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden sticky top-6">
              <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <h2 className="font-bold text-lg mb-1">Total à régler</h2>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black tracking-tight">149</span>
                  <span className="text-xl font-medium text-slate-300 mb-1">€ HT</span>
                </div>
                <p className="text-slate-400 text-sm mt-2">+ 29.80€ TVA (20%)</p>
              </div>
              
              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Frais de formalité</span>
                  <span className="font-medium text-slate-900">149.00 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Frais de greffe (estimés)</span>
                  <span className="font-medium text-slate-900">37.45 €</span>
                </div>
                <div className="w-full h-px bg-slate-100 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total TTC</span>
                  <span className="font-bold text-lg text-slate-900">216.25 €</span>
                </div>

                <button className="mt-4 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payer par carte
                </button>

                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Paiement 100% sécurisé via Stripe
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
