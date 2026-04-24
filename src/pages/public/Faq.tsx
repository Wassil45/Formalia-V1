import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import Spline from '@splinetool/react-spline';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';

import { Database } from '../../types/database.types';

type FaqRow = Database['public']['Tables']['faq']['Row'];

// FAQ mock si Supabase non configuré
const MOCK_FAQ: FaqRow[] = [
  { id: '1', question: 'Quels sont les délais de traitement ?', 
    answer: 'Nos délais varient selon la formalité : 48h pour une création, 3 à 5 jours pour une modification.', 
    category: 'general', order_index: 1, is_published: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', question: 'Quels documents faut-il fournir ?', 
    answer: 'Les documents requis dépendent de la formalité. Notre wizard vous guide pas à pas.', 
    category: 'documents', order_index: 2, is_published: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', question: 'Comment suivre mon dossier ?', 
    answer: 'Connectez-vous à votre espace client pour suivre l\'avancement en temps réel.', 
    category: 'general', order_index: 3, is_published: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', question: 'Quels moyens de paiement acceptez-vous ?', 
    answer: 'Cartes bancaires (Visa, Mastercard, American Express) via Stripe sécurisé.', 
    category: 'paiement', order_index: 4, is_published: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', question: 'Puis-je modifier mon dossier après paiement ?', 
    answer: 'Oui, tant que votre dossier n\'est pas transmis au greffe.', 
    category: 'general', order_index: 5, is_published: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Général', documents: 'Documents', 
  paiement: 'Paiement', delais: 'Délais', technique: 'Technique'
};

export function Faq() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { data: settings } = useSettings();

  const { data: faqs } = useQuery({
    queryKey: ['public_faq'],
    queryFn: async (): Promise<FaqRow[]> => {
      if (!isSupabaseConfigured()) return MOCK_FAQ;
      
      const fetchPromise = supabase
        .from('faq')
        .select('*')
        .eq('is_published', true)
        .order('order_index');
        
      const timeoutPromise = new Promise<{data: any, error: any}>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase request timeout')), 4000);
      });

      try {
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
        if (error) return MOCK_FAQ;
        return (data as FaqRow[]) && data.length > 0 ? (data as FaqRow[]) : MOCK_FAQ;
      } catch (err) {
        return MOCK_FAQ;
      }
    },
  });

  const categories = [...new Set(faqs?.map(f => f.category) ?? [])];

  const filtered = faqs?.filter(f => {
    const matchSearch = !search 
      || f.question.toLowerCase().includes(search.toLowerCase())
      || f.answer.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || f.category === activeCategory;
    return matchSearch && matchCat;
  }) ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-slate-900 pt-32 pb-20 text-white relative overflow-hidden">
        {/* Spline 3D Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Spline scene="https://prod.spline.design/x4hLf7TYnpqbhNnn/scene.splinecode" style={{ pointerEvents: 'none' }} />
        </div>

        {/* Overlay sombre pour assurer la lisibilité du texte sur le fond 3D */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] pointer-events-none z-0" />

        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full 
            blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10 pointer-events-none">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center 
            justify-center mx-auto mb-6 shadow-xl pointer-events-auto">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black mb-4">
            Questions fréquentes
          </h1>
          <p className="text-indigo-200 text-lg mb-8">
            Tout ce que vous devez savoir sur nos services.
          </p>
          {/* Barre de recherche */}
          <div className="relative max-w-md mx-auto pointer-events-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une question..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl text-slate-900 
                text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Filtres catégories */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !activeCategory 
                  ? 'gradient-primary text-white shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Tout voir ({faqs?.length ?? 0})
            </button>
            {categories.map(cat => (
              <button key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat 
                    ? 'gradient-primary text-white shadow-md' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {CATEGORY_LABELS[cat] ?? cat} ({faqs?.filter(f => f.category === cat).length})
              </button>
            ))}
          </div>
        )}

        {/* Accordéon FAQ */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun résultat pour "{search}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(faq => (
              <div key={faq.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden
                  ${openId === faq.id 
                    ? 'border-primary/30 shadow-md shadow-primary/5' 
                    : 'border-slate-100 shadow-sm hover:shadow-md'}`}
              >
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                  {openId === faq.id 
                    ? <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                </button>
                {openId === faq.id && (
                  <div className="px-6 pb-5 animate-fade-in-up">
                    <div className="h-px bg-slate-100 mb-4" />
                    <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center bg-white rounded-2xl border border-slate-100 
          shadow-sm p-8">
          <h3 className="font-bold text-slate-900 mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="text-slate-500 text-sm mb-4">Notre équipe est disponible pour vous aider.</p>
          <a href={`mailto:${settings?.email_contact || 'contact@formalia.fr'}`}
            className="inline-flex items-center gap-2 px-6 py-3 gradient-primary text-white 
              rounded-xl text-sm font-semibold shadow-md shadow-primary/20 
              hover:shadow-lg transition-all">
            Nous contacter
          </a>
        </div>
      </section>
    </div>
  );
}
