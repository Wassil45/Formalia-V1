import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, ArrowRight, FileText, Download, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export function ConfirmationPage() {
  const { user, role } = useAuth();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const sessionId = params.get('session_id');
  const navigate = useNavigate();

  const { data: dossier, isLoading, isError } = useQuery({
    queryKey: ['confirmation', sessionId],
    queryFn: async () => {
      if (!sessionId || !user) return null;
      
      const { data, error } = await supabase
        .from('dossiers')
        .select('*, formalites_catalogue(*)')
        .eq('stripe_session_id', sessionId)
        .eq('client_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && !!user,
    retry: 5,
    retryDelay: 2000
  });

  useEffect(() => {
    if (dossier) {
      sessionStorage.removeItem('formalia_wizard_draft');
    }
  }, [dossier]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-slate-600 font-medium">Vérification de votre paiement...</p>
      </div>
    );
  }

  if (isError || (!isLoading && !dossier)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          < Mail className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Paiement non vérifié</h1>
        <p className="text-slate-600 max-w-md mb-8">
          Nous n'avons pas pu confirmer votre paiement immédiatement. Si vous avez été débité, votre dossier apparaîtra dans votre espace client d'ici quelques minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to={role === 'admin' ? '/admin/dossiers' : '/dashboard/dossiers'} className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">
            Voir mes dossiers
          </Link>
          <Link to={role === 'admin' ? '/admin' : '/dashboard'} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
        >
          <div className="bg-gradient-to-br from-primary to-secondary p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2">Paiement réussi !</h1>
            <p className="text-white/80">Votre formalité est désormais entre les mains de nos experts.</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Récapitulatif</h3>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Référence</span>
                  <span className="font-mono font-bold text-slate-900">{(dossier as { reference?: string }).reference}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Formalité</span>
                  <span className="font-bold text-slate-900">{(dossier as { formalites_catalogue?: { name?: string } }).formalites_catalogue?.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Montant payé</span>
                  <span className="font-bold text-slate-900">{(dossier as { total_amount?: number }).total_amount} € TTC</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-6 flex flex-col justify-center">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm">Confirmation envoyée</h4>
                    <p className="text-blue-700 text-xs mt-1">Un email récapitulatif a été envoyé à votre adresse {user?.email}.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Prochaines étapes</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <p className="text-slate-600 text-sm pt-1">Nos experts vérifient la conformité de vos documents sous 24h ouvrées.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <p className="text-slate-600 text-sm pt-1">Nous déposons votre dossier auprès des organismes compétents (Greffe, INPI, etc.).</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <p className="text-slate-600 text-sm pt-1">Vous recevez votre Kbis ou attestation de modification par email.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to={role === 'admin' ? '/admin/dossiers' : '/dashboard/dossiers'} className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                Suivre mon dossier <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                <Download className="w-5 h-5" /> Facture PDF
              </button>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-slate-400 text-sm mt-8">
          Besoin d'aide ? <Link to="/dashboard/messages" className="text-primary hover:underline">Contactez notre support</Link>
        </p>
      </div>
    </div>
  );
}
