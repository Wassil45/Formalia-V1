import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ClientMessages() {
  const { user } = useAuth();
  const { data: settings } = useSettings();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['client_messages', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          reference,
          admin_message_to_client,
          updated_at,
          formalites_catalogue (name)
        `)
        .eq('client_id', user!.id)
        .not('admin_message_to_client', 'is', null)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-5 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Messages</h1>
          <p className="text-sm text-slate-500 mt-0.5">Échangez avec l'équipe {settings?.company_name || 'Formalia'}.</p>
        </div>
      </header>

      <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : !messages || messages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Aucun message</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Vos conversations avec notre équipe de support apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-lg">
                    Dossier {msg.reference} <span className="text-sm font-normal text-slate-500 ml-2">({msg.formalites_catalogue?.name})</span>
                  </h3>
                  <span className="text-sm text-slate-500">
                    {new Date(msg.updated_at).toLocaleDateString('fr-FR', { 
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                  <p className="text-slate-700 whitespace-pre-wrap">{msg.admin_message_to_client}</p>
                </div>
                <div className="flex justify-end">
                  <Link 
                    to={`/dashboard/dossiers/${msg.id}`}
                    className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                  >
                    Voir le dossier <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
