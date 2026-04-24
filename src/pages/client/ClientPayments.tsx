import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, CheckCircle, Clock, XCircle, Download } from 'lucide-react';

export function ClientPayments() {
  const { user } = useAuth();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['client_payments', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          reference,
          total_amount,
          stripe_payment_status,
          created_at,
          formalites_catalogue (name)
        `)
        .eq('client_id', user!.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getPaymentStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
      case 'succeeded':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3.5 h-3.5" /> Payé</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3.5 h-3.5" /> En attente</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3.5 h-3.5" /> Échoué</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800">Non payé</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 min-w-0 w-full">
      <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-5 sticky top-0 z-10 w-full">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 font-display truncate">Mes paiements</h1>
          <p className="text-sm text-slate-500 mt-0.5 truncate">Consultez l'historique de vos paiements et téléchargez vos factures.</p>
        </div>
      </header>

      <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto w-full min-w-0">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Aucun paiement</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              L'historique de vos paiements et vos factures apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full min-w-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 md:px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">Date</th>
                    <th className="hidden md:table-cell px-4 md:px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">Référence</th>
                    <th className="hidden sm:table-cell px-4 md:px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">Prestation</th>
                    <th className="px-4 md:px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">Montant</th>
                    <th className="px-4 md:px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">Statut</th>
                    <th className="px-4 md:px-6 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">Facture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 md:px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                        <div className="block md:hidden text-xs font-mono mt-1 text-slate-400">
                          {payment.reference}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 md:px-6 py-4 text-sm font-mono font-medium text-slate-900 whitespace-nowrap">
                        {payment.reference}
                      </td>
                      <td className="hidden sm:table-cell px-4 md:px-6 py-4 text-sm text-slate-600 whitespace-nowrap truncate max-w-[150px]">
                        {payment.formalites_catalogue?.name}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                        {payment.total_amount} € <span className="text-xs text-slate-500 font-normal">TTC</span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(payment.stripe_payment_status)}
                      </td>
                    <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                      <button 
                        disabled={payment.stripe_payment_status !== 'paid' && payment.stripe_payment_status !== 'succeeded'}
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Télécharger la facture"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
