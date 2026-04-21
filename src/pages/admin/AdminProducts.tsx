import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { MOCK_SERVICES } from '../../data/mockServices';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SkeletonRow } from '../../components/ui/Skeleton';
import { FormBuilder } from '../../components/admin/FormBuilder';
import * as Icons from 'lucide-react';
import { 
  Plus, Search, Edit, Trash2, Package, X, 
  AlertTriangle, ToggleLeft, ToggleRight, Eye, EyeOff, Info,
  FilePlus, ArrowUp, ArrowDown
} from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(3, 'Nom requis (min 3 caractères)'),
  type: z.enum(['immatriculation', 'modification', 'radiation']),
  description: z.string().min(10, 'Description requise (min 10 caractères)'),
  price_ht: z.coerce.number().min(1, 'Prix requis'),
  tva_rate: z.coerce.number().min(0).max(100).default(20),
  estimated_delay_days: z.coerce.number().min(1).optional(),
  is_active: z.boolean().default(true),
  order_index: z.coerce.number().default(0),
  icon: z.string().default('FileText'),
  iconColor: z.string().optional(),
  intro_text: z.string().optional(),
  required_documents: z.array(z.object({
    id: z.string(),
    label: z.string().min(1, 'Requis'),
    hint: z.string().optional()
  })).optional(),
  form_schema: z.any().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

const TYPE_LABELS = {
  immatriculation: 'Création',
  modification: 'Modification', 
  radiation: 'Fermeture',
};
const TYPE_COLORS = {
  immatriculation: 'bg-primary/10 text-primary',
  modification: 'bg-violet-100 text-violet-700',
  radiation: 'bg-red-100 text-red-700',
};

const AVAILABLE_COLORS = [
  { label: 'Bleu', value: 'text-blue-500' },
  { label: 'Violet', value: 'text-purple-500' },
  { label: 'Vert', value: 'text-emerald-500' },
  { label: 'Orange', value: 'text-orange-500' },
  { label: 'Rose', value: 'text-pink-500' },
  { label: 'Gris', value: 'text-slate-500' },
];

const formatIconName = (name: string) => {
  if (!name) return 'FileText';
  return name.trim().split(/[-_ ]+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
};

function DocsBuilder({ control, register, errors }: any) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "required_documents",
  });

  const inputCls = (err: boolean) => `w-full px-3.5 py-2.5 rounded-xl border text-sm 
    outline-none transition-all ${err 
      ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-100' 
      : 'border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10'
    }`;

  return (
    <div className="space-y-4">
      {fields.map((item, index) => (
        <div key={item.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative group">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button type="button" onClick={() => index > 0 && move(index, index - 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700">
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => index < fields.length - 1 && move(index, index + 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700">
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => remove(index)}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <input type="hidden" {...register(`required_documents.${index}.id`)} />
                <label className="text-xs font-medium text-slate-600 mb-1 block">Titre (requis)</label>
                <input 
                  {...register(`required_documents.${index}.label`)} 
                  className={inputCls(!!errors?.required_documents?.[index]?.label)}
                  placeholder="Ex: Pièce d'identité"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Description (optionnel)</label>
              <input 
                {...register(`required_documents.${index}.hint`)} 
                className={inputCls(false)}
                placeholder="Ex: CNI, passeport ou titre de séjour"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ id: Math.random().toString(36).slice(2, 9), label: '', hint: '' })}
        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 
          text-sm font-medium text-slate-500 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-2"
      >
        <FilePlus className="w-4 h-4" />
        Ajouter une pièce justificative
      </button>
    </div>
  );
}

function ProductModal({ 
  product, onClose 
}: { 
  product?: ProductForm & { id: string }; onClose: () => void 
}) {
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const initialIconParts = (product?.icon || 'FileText').split(':');
  const initialIconName = formatIconName(initialIconParts[0]);
  const initialIconColor = initialIconParts[1] || 'text-slate-500';

  const initialIntroText = typeof product?.required_documents === 'string' 
    ? product.required_documents 
    : (product?.required_documents as any)?.text || '';
    
  const initialDocsSchema = (product?.required_documents as any)?.docs || [];

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = 
    useForm<ProductForm>({
      resolver: zodResolver(productSchema) as any,
      defaultValues: product ? { 
        ...product, 
        icon: initialIconName,
        iconColor: initialIconColor,
        intro_text: initialIntroText,
        required_documents: initialDocsSchema
      } : { 
        tva_rate: 20, 
        is_active: true, 
        type: 'immatriculation', 
        form_schema: null,
        icon: 'FileText',
        iconColor: 'text-slate-500',
        intro_text: '',
        required_documents: []
      },
    });

  const isActive = watch('is_active');
  const prixHT = watch('price_ht') ?? 0;
  const tva = watch('tva_rate') ?? 20;
  const prixTTC = +(prixHT * (1 + tva / 100)).toFixed(2);
  
  // Preview Icône
  const rawIconName = watch('icon');
  const previewIconName = formatIconName(rawIconName);
  const previewIconColor = watch('iconColor') || 'text-slate-500';
  const PreviewIconComponent = (Icons as any)[previewIconName] || Icons.HelpCircle;

  const mutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const cleanIconName = formatIconName(data.icon);
      const finalIcon = data.iconColor && data.iconColor !== 'text-slate-500' 
        ? `${cleanIconName}:${data.iconColor}`
        : cleanIconName; // On garde la compatibilité si c'est gris par défaut

      const payload = { 
        name: data.name,
        type: data.type,
        description: data.description,
        price_ht: data.price_ht,
        tva_rate: data.tva_rate,
        estimated_delay_days: data.estimated_delay_days,
        is_active: data.is_active,
        order_index: data.order_index,
        icon: finalIcon,
        price_ttc: prixTTC,
        required_documents: { text: data.intro_text, docs: data.required_documents },
        form_schema: data.form_schema,
        steps_config: data.form_schema, // compatibilité
      };
      if (isEdit) {
        const { error } = await supabase
          .from('formalites_catalogue').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('formalites_catalogue').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Invalide TOUTES les queries qui utilisent ce catalogue
      // → met à jour automatiquement Services.tsx, Tarifs.tsx et AdminProducts.tsx
      queryClient.invalidateQueries({ queryKey: ['formalites_catalogue'] });
      queryClient.invalidateQueries({ queryKey: ['formalites_catalogue_tarifs'] });
      queryClient.invalidateQueries({ queryKey: ['admin_formalites_catalogue'] });
      queryClient.invalidateQueries({ queryKey: ['formalites_wizard'] });
      toast.success(`${isEdit ? 'Produit mis à jour' : 'Produit créé'}: Visible immédiatement sur le site client`);
      onClose();
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  });

  const inputCls = (err: boolean) => `w-full px-3.5 py-2.5 rounded-xl border text-sm 
    outline-none transition-all ${err 
      ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-100' 
      : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl 
        animate-scale-in overflow-hidden">

        {/* Header modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Visible immédiatement sur le site client après sauvegarde
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d as ProductForm))} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Nom */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Nom du service <span className="text-red-400">*</span>
            </label>
            <input {...register('name')} className={inputCls(!!errors.name)} 
              placeholder="Création SAS" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Catégorie</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <label key={value} className="cursor-pointer">
                  <input {...register('type')} type="radio" value={value} className="sr-only" />
                  <div className={`p-2.5 rounded-xl border-2 text-center text-xs font-semibold 
                    transition-all ${watch('type') === value 
                      ? 'border-primary bg-primary/8 text-primary' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    {label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea {...register('description')} rows={2} 
              className={inputCls(!!errors.description) + ' resize-none'}
              placeholder="Description du service..." />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Prix HT (€) <span className="text-red-400">*</span>
              </label>
              <input {...register('price_ht')} type="number" min={1} step={0.01}
                className={inputCls(!!errors.price_ht)} placeholder="149" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">TVA (%)</label>
              <input {...register('tva_rate')} type="number" min={0} max={100}
                className={inputCls(false)} placeholder="20" />
            </div>
          </div>

          {/* Prix TTC calculé */}
          {prixHT > 0 && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
              <span className="text-slate-500">Prix TTC calculé</span>
              <span className="font-bold text-slate-900">
                {prixTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          )}

          {/* Délai + Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Délai (jours)
              </label>
              <input {...register('estimated_delay_days')} type="number" min={1}
                className={inputCls(false)} placeholder="5" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Visibilité</label>
              <button
                type="button"
                onClick={() => setValue('is_active', !isActive)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl 
                  border-2 text-sm font-semibold transition-all ${
                  isActive 
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                {isActive 
                  ? <><Eye className="w-4 h-4" /> Visible</>
                  : <><EyeOff className="w-4 h-4" /> Masqué</>
                }
              </button>
            </div>
          </div>

          {/* Ordre et Icône */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Ordre
              </label>
              <input {...register('order_index')} type="number"
                className={inputCls(false)} placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block flex justify-between">
                Icône <span className="font-normal text-slate-400 text-xs">Aperçu :</span>
              </label>
              <div className="relative">
                <input {...register('icon')} type="text"
                  className={`${inputCls(false)} pl-11`} placeholder="File text" />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <PreviewIconComponent className={`w-5 h-5 ${previewIconColor}`} />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Couleur de l'icône
              </label>
              <select {...register('iconColor')} className={inputCls(false)}>
                {AVAILABLE_COLORS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4">
            <label className="text-sm font-semibold text-slate-800 block mb-1">
              Introduction
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Ce texte d'introduction sera affiché au client avant qu'il ne commence à remplir le formulaire.
            </p>
            <textarea {...register('intro_text')} rows={2} 
              className={inputCls(false) + ' resize-none'}
              placeholder="Ex: Merci de bien vouloir remplir ce formulaire avec attention..." />
          </div>

          {/* Configuration des documents requis */}
          <div className="border-t border-slate-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Pièces justificatives
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configurez les documents que le client devra télécharger
                </p>
              </div>
            </div>
            
            <DocsBuilder control={control} register={register} errors={errors} />
            
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Formulaire client
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configurez les étapes que le client devra remplir
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {watch('form_schema')?.steps?.length ?? 0} étape(s)
              </span>
            </div>
            <FormBuilder
              value={watch('form_schema')}
              onChange={schema => setValue('form_schema', schema)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-sm 
                font-medium text-slate-600 hover:bg-slate-50 transition-all">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting || mutation.isPending}
              className="flex-1 py-3 rounded-xl gradient-primary text-white text-sm 
                font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all 
                disabled:opacity-60">
              {mutation.isPending ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; product?: ProductForm & { id: string } }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['admin_formalites_catalogue'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase non configuré — données de démonstration utilisées');
        return MOCK_SERVICES as any[];
      }
      try {
        const { data, error } = await supabase
          .from('formalites_catalogue').select('*').order('created_at', { ascending: false });
        if (error) {
          console.error('Erreur Supabase:', error);
          return MOCK_SERVICES as any[];
        }
        return data && data.length > 0 ? data as any[] : MOCK_SERVICES as any[];
      } catch (err) {
        console.error('Erreur réseau:', err);
        return MOCK_SERVICES as any[];
      }
    },
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('formalites_catalogue').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formalites_catalogue'] });
      queryClient.invalidateQueries({ queryKey: ['formalites_catalogue_tarifs'] });
      queryClient.invalidateQueries({ queryKey: ['admin_formalites_catalogue'] });
      queryClient.invalidateQueries({ queryKey: ['formalites_wizard'] });
      toast.success(`Produit supprimé: Retiré du catalogue client`);
      setDeleteConfirm(null);
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('formalites_catalogue').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['formalites_catalogue'] });
      queryClient.invalidateQueries({ queryKey: ['formalites_catalogue_tarifs'] });
      queryClient.invalidateQueries({ queryKey: ['admin_formalites_catalogue'] });
      queryClient.invalidateQueries({ queryKey: ['formalites_wizard'] });
      toast.success(`${is_active ? 'Produit activé' : 'Produit masqué'}: Mis à jour sur le site client`);
    },
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.toLowerCase();
    return products.filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) 
        || p.description?.toLowerCase().includes(q);
      const matchFilter = !activeFilter || p.type === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [products, search, activeFilter]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 min-w-0 w-full">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-5 sticky top-0 z-10 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">Catalogue des services</h1>
            <p className="text-sm text-slate-500 mt-0.5 truncate">
              Toute modification est visible en temps réel sur le site client
            </p>
          </div>
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center justify-center gap-2 px-4 py-2.5 gradient-primary text-white 
              text-sm font-semibold rounded-xl shadow-md shadow-primary/20 
              hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nouveau service
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">

        {isError && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <Info className="w-4 h-4 flex-shrink-0" />
            Mode démonstration — Configurez vos variables Supabase pour voir vos données réelles.
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 
           flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbars-hidden w-full md:w-auto">
            {[null, ...Object.keys(TYPE_LABELS)].map(type => (
              <button key={String(type)}
                onClick={() => setActiveFilter(type)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  activeFilter === type 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type === null ? `Tous (${products?.length ?? 0})` 
                  : TYPE_LABELS[type as keyof typeof TYPE_LABELS]}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-auto shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl 
                text-sm w-full md:w-52 focus:outline-none focus:border-primary focus:ring-2 
                focus:ring-primary/10 focus:bg-white transition-all" />
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden w-full min-w-0 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  {['Service', 'Catégorie', 'Prix HT', 'TVA', 'Délai', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-xs font-semibold text-slate-400 
                      uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1,2,3].map(i => <SkeletonRow key={i} columns={7} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Aucun service trouvé
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const iconParts = (p.icon || 'FileText').split(':');
                  const iconName = iconParts[0];
                  const iconColorClass = iconParts[1] || 'text-primary';
                  const IconComponent = (Icons as any)[iconName] ? (Icons as any)[iconName] : Icons.Package;

                  return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/8 rounded-xl flex items-center 
                          justify-center flex-shrink-0">
                          <IconComponent className={`w-4 h-4 ${iconColorClass}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[180px]">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg 
                        ${TYPE_COLORS[p.type as keyof typeof TYPE_COLORS]}`}>
                        {TYPE_LABELS[p.type as keyof typeof TYPE_LABELS]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {p.price_ht.toLocaleString('fr-FR', 
                          { style: 'currency', currency: 'EUR' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{p.tva_rate}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">
                        {p.estimated_delay_days ? `${p.estimated_delay_days}j` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive.mutate({ id: p.id, is_active: !p.is_active })}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg 
                          text-xs font-semibold transition-all ${
                          p.is_active 
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {p.is_active 
                          ? <><Eye className="w-3 h-3" /> Visible</>
                          : <><EyeOff className="w-3 h-3" /> Masqué</>
                        }
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 
                        transition-opacity">
                        <button
                          onClick={() => setModal({ open: true, product: p })}
                          className="p-2 rounded-lg text-slate-400 hover:text-primary 
                            hover:bg-primary/8 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 
                            hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Modal création/édition */}
      {modal.open && (
        <ProductModal 
          product={modal.product} 
          onClose={() => setModal({ open: false })} 
        />
      )}

      {/* Dialog suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full 
            animate-scale-in text-center">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center 
              mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Supprimer ce service ?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Cette action est irréversible. Le service sera immédiatement retiré du catalogue client.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm 
                  font-medium text-slate-600 hover:bg-slate-50 transition-all">
                Annuler
              </button>
              <button onClick={() => deleteMutation.mutate(deleteConfirm!)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm 
                  font-bold text-white transition-all disabled:opacity-60">
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
