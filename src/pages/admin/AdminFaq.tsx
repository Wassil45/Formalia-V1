import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { 
  Plus, Edit, Trash2, GripVertical, Eye, EyeOff, 
  X, Save, ChevronDown, ChevronUp
} from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'Général' },
  { value: 'documents', label: 'Documents' },
  { value: 'paiement', label: 'Paiement' },
  { value: 'delais', label: 'Délais' },
  { value: 'technique', label: 'Technique' },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  is_published: boolean;
}

function FaqModal({ item, onClose }: { item?: FaqItem; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState(item?.question ?? '');
  const [answer, setAnswer] = useState(item?.answer ?? '');
  const [category, setCategory] = useState(item?.category ?? 'general');
  const [isPublished, setIsPublished] = useState(item?.is_published ?? true);

  const save = useMutation({
    mutationFn: async () => {
      if (item) {
        const { error } = await (supabase as any)
          .from('faq')
          .update({ question, answer, category, is_published: isPublished, 
            updated_at: new Date().toISOString() })
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { data: maxOrder } = await (supabase as any)
          .from('faq').select('order_index').order('order_index', { ascending: false }).limit(1);
        const nextOrder = ((maxOrder?.[0]?.order_index ?? 0) + 1);
        const { error } = await (supabase as any)
          .from('faq').insert({ question, answer, category, is_published: isPublished, 
            order_index: nextOrder });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq'] });
      queryClient.invalidateQueries({ queryKey: ['public_faq'] });
      toast('success', item ? 'Question mise à jour' : 'Question ajoutée',
        'Visible immédiatement sur le site');
      onClose();
    },
    onError: (err: any) => toast('error', 'Erreur', err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg 
        animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">
            {item ? 'Modifier la question' : 'Nouvelle question'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Catégorie
            </label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm 
                focus:outline-none focus:border-primary transition-all bg-white">
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Question <span className="text-red-400">*</span>
            </label>
            <input value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="Quels sont les délais de traitement ?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm 
                focus:outline-none focus:border-primary focus:ring-2 
                focus:ring-primary/10 transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Réponse <span className="text-red-400">*</span>
            </label>
            <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={5}
              placeholder="Réponse détaillée..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm 
                focus:outline-none focus:border-primary focus:ring-2 
                focus:ring-primary/10 transition-all resize-none" />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700">Publier</p>
              <p className="text-xs text-slate-400">Visible sur le site client</p>
            </div>
            <button type="button" onClick={() => setIsPublished(!isPublished)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs 
                font-semibold transition-all ${
                isPublished 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
              {isPublished ? <><Eye className="w-3.5 h-3.5" /> Publié</> 
                : <><EyeOff className="w-3.5 h-3.5" /> Masqué</>}
            </button>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm 
              font-medium text-slate-600 hover:bg-slate-50 transition-all">
            Annuler
          </button>
          <button onClick={() => save.mutate()}
            disabled={!question.trim() || !answer.trim() || save.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3 
              gradient-primary text-white rounded-xl text-sm font-bold 
              shadow-md shadow-primary/20 disabled:opacity-60 transition-all">
            <Save className="w-4 h-4" />
            {save.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminFaq() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: FaqItem }>({ open: false });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faq'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq').select('*').order('order_index');
      if (error) throw error;
      return (data ?? []) as FaqItem[];
    },
  });

  const deleteFaq = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faq').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq'] });
      queryClient.invalidateQueries({ queryKey: ['public_faq'] });
      toast('success', 'Question supprimée');
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await (supabase as any).from('faq')
        .update({ is_published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq'] });
      queryClient.invalidateQueries({ queryKey: ['public_faq'] });
      toast('success', 'Visibilité mise à jour');
    },
  });

  const filtered = faqs?.filter(f => !activeCategory || f.category === activeCategory) ?? [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 
        sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">FAQ</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {faqs?.filter(f => f.is_published).length} question(s) publiée(s)
            </p>
          </div>
          <button onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white 
              text-sm font-semibold rounded-xl shadow-md shadow-primary/20 
              hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        {/* Filtres catégories */}
        <div className="flex items-center gap-2 flex-wrap">
          {[null, ...CATEGORIES].map(cat => (
            <button key={String(cat?.value ?? 'all')}
              onClick={() => setActiveCategory(cat?.value ?? null)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === (cat?.value ?? null) 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
              {cat?.label ?? 'Toutes'}
            </button>
          ))}
        </div>

        {/* Liste FAQ */}
        <div className="space-y-3">
          {isLoading ? (
            [1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 
                animate-pulse space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <p className="text-slate-400 text-sm">Aucune question dans cette catégorie</p>
            </div>
          ) : (
            filtered.map(faq => (
              <div key={faq.id} className={`bg-white rounded-2xl border shadow-sm 
                hover:shadow-md transition-all overflow-hidden ${
                faq.is_published ? 'border-slate-100' : 'border-slate-200 opacity-60'
              }`}>
                <div className="flex items-start gap-3 p-5">
                  <GripVertical className="w-5 h-5 text-slate-300 cursor-grab mt-0.5 
                    flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full 
                        bg-slate-100 text-slate-600 uppercase tracking-wide`}>
                        {CATEGORIES.find(c => c.value === faq.category)?.label}
                      </span>
                      {!faq.is_published && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full 
                          bg-amber-100 text-amber-600">Masqué</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-1">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => togglePublish.mutate({ 
                        id: faq.id, is_published: !faq.is_published })}
                      className={`p-2 rounded-xl transition-all ${
                        faq.is_published 
                          ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                          : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
                      title={faq.is_published ? 'Masquer' : 'Publier'}>
                      {faq.is_published 
                        ? <Eye className="w-3.5 h-3.5" /> 
                        : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setModal({ open: true, item: faq })}
                      className="p-2 rounded-xl text-slate-400 hover:text-primary 
                        hover:bg-primary/8 transition-all">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteFaq.mutate(faq.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 
                        hover:bg-red-50 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modal.open && (
        <FaqModal item={modal.item} onClose={() => setModal({ open: false })} />
      )}
    </div>
  );
}
