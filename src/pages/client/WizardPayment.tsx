import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizard } from '../../context/WizardContext';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  CreditCard, ShieldCheck, FileText, CheckCircle2, 
  ArrowLeft, Loader2, Lock, Building2, MapPin, File
} from 'lucide-react';

const FRAIS_GREFFE = 37.45;

export function WizardPayment() {
  const navigate = useNavigate();
  const { data: wizardData, setDossierId, canProceedToStep } = useWizard();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!canProceedToStep(4)) navigate('/formalite/etape-3');
  }, [canProceedToStep, navigate]);

  const prixHT = wizardData.formalitePriceHT ?? 0;
  const tauxTVA = wizardData.formaliteTvaRate ?? 20;
  const montantTVA = +(prixHT * tauxTVA / 100).toFixed(2);
  const prixTTC = +(prixHT + montantTVA).toFixed(2);
  const totalTTC = +(prixTTC + FRAIS_GREFFE).toFixed(2);

  const formatEur = (n: number) => 
    n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      let currentDossierId = wizardData.dossierId;

      // 1. Créer ou mettre à jour le dossier en DB
      if (currentDossierId) {
        const { error } = await supabase
          .from('dossiers')
          .update({
            formalite_id: wizardData.formaliteId!,
            form_data: {
              companyInfo: wizardData.companyInfo,
              documents: wizardData.documents,
            } as any,
            total_amount: totalTTC,
          })
          .eq('id', currentDossierId);
        if (error) throw error;
      } else {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase();
        const { data: dossier, error } = await supabase
          .from('dossiers')
          .insert({
            reference: `DOS-${timestamp}-${random}`,
            client_id: user!.id,
            formalite_id: wizardData.formaliteId!,
            status: 'draft',
            form_data: {
              companyInfo: wizardData.companyInfo,
              documents: wizardData.documents,
            } as any,
            total_amount: totalTTC,
          })
          .select()
          .single();

        if (error) throw error;
        currentDossierId = (dossier as any).id;
        setDossierId(currentDossierId!);
      }

      // 2. Créer session Stripe Checkout
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dossierId: currentDossierId, 
          formaliteId: wizardData.formaliteId,
          successUrl: window.location.origin + '/dashboard/confirmation?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: window.location.origin + '/dashboard/dossiers/' + currentDossierId
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement');
      }

      if (data.url) {
        // Stripe ne supporte pas l'affichage par défaut dans un Iframe (comme c'est le cas pour la preview AI Studio)
        // On redirige donc dans un nouvel onglet ou on essaie de naviguer la top window.
        if (window.top !== window.self) {
          // Dans un iframe (ex: preview AI Studio)
          const newWindow = window.open(data.url, '_blank');
          if (!newWindow) {
             toast.error("Le bloqueur de pop-up a empêché l'ouverture du paiement. Veuillez cliquer sur le lien pour continuer.");
             // Fallback visuel avec un lien direct si le popup est bloqué
             const link = document.createElement('a');
             link.href = data.url;
             link.target = '_blank';
             link.click();
          } else {
             toast.info("La page de paiement s'est ouverte dans un nouvel onglet.");
          }
        } else {
          window.location.href = data.url;
        }
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (err: unknown) {
      toast.error(`Erreur: ${err instanceof Error ? err.message : 'Une erreur est survenue'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Récapitulatif et paiement
        </h1>
        <p className="text-slate-500">Vérifiez vos informations avant de procéder.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* Récap — 3/5 */}
        <div className="lg:col-span-3 space-y-4">

          {/* Formalité */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Formalité choisie</span>
            </div>
            <div className="p-5">
              <p className="font-bold text-slate-900">{wizardData.formaliteName}</p>
              <p className="text-sm text-slate-500 mt-1 capitalize">{wizardData.formaliteType}</p>
            </div>
          </div>

          {/* Entreprise */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Entreprise</span>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Dénomination</p>
                <p className="text-sm font-semibold text-slate-900">
                  {wizardData.companyInfo?.denomination}
                  {wizardData.companyInfo?.sigle && ` (${wizardData.companyInfo.sigle})`}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Siège social</p>
                <p className="text-sm text-slate-700">
                  {wizardData.companyInfo?.adresse}, {wizardData.companyInfo?.codePostal} {wizardData.companyInfo?.ville}
                </p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
              <File className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">
                Documents fournis ({wizardData.documents.length})
              </span>
            </div>
            <div className="p-5 space-y-2">
              {wizardData.documents.map(doc => (
                <div key={doc.id} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Paiement — 2/5 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg sticky top-24">

            {/* Header prix */}
            <div className="p-6 gradient-primary rounded-t-2xl text-white">
              <p className="text-sm font-medium text-white/80 mb-1">Total à régler</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{formatEur(totalTTC)}</span>
              </div>
              <p className="text-xs text-white/60 mt-1">TVA et frais de greffe inclus</p>
            </div>

            {/* Détail */}
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Honoraires HT</span>
                <span className="font-medium text-slate-900">{formatEur(prixHT)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">TVA ({tauxTVA}%)</span>
                <span className="font-medium text-slate-900">{formatEur(montantTVA)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Frais de greffe</span>
                <span className="font-medium text-slate-900">{formatEur(FRAIS_GREFFE)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between">
                <span className="font-bold text-slate-900">Total TTC</span>
                <span className="font-bold text-slate-900">{formatEur(totalTTC)}</span>
              </div>
            </div>

            {/* Bouton paiement */}
            <div className="px-5 pb-5 space-y-3">
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 
                  rounded-xl text-sm font-bold text-white transition-all ${
                  isProcessing 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'gradient-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</>
                ) : (
                  <><CreditCard className="w-4 h-4" /> Payer par carte</>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Lock className="w-3 h-3" />
                Paiement sécurisé 256-bit SSL
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 
                bg-emerald-50 rounded-xl py-2.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Remboursement si dossier non transmis
              </div>
            </div>

            {/* Retour */}
            <div className="px-5 pb-5">
              <button
                onClick={() => navigate('/formalite/etape-3')}
                className="btn-secondary w-full"
              >
                <ArrowLeft className="w-4 h-4" />
                Modifier le dossier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
