import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizard } from '../../context/WizardContext';
import { supabase } from '../../lib/supabase';
import { Building2, MapPin, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export function WizardStep2() {
  const navigate = useNavigate();
  const { data: wizardData, setCompanyInfo, canProceedToStep } = useWizard();

  useEffect(() => {
    if (!canProceedToStep(2)) navigate('/formalite');
  }, []);

  // Fetch le form_schema de la formalité sélectionnée
  const { data: formalite, isLoading } = useQuery({
    queryKey: ['formalite_schema', wizardData.formaliteId],
    enabled: !!wizardData.formaliteId,
    queryFn: async () => {
      if (!wizardData.formaliteId) return null;
      const { data, error } = await supabase
        .from('formalites_catalogue')
        .select('form_schema, name')
        .eq('id', wizardData.formaliteId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const schema = formalite?.form_schema as { steps: any[] } | null;
  const hasCustomForm = schema?.steps && schema.steps.length > 0;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    defaultValues: wizardData.companyInfo ?? {},
  });

  const [currentSchemaStep, setCurrentSchemaStep] = React.useState(0);
  const schemaSteps = schema?.steps ?? [];
  const currentSchemaStepData = schemaSteps[currentSchemaStep];
  const isLastSchemaStep = currentSchemaStep >= schemaSteps.length - 1;

  const onSubmit = (data: any) => {
    if (!isLastSchemaStep && hasCustomForm) {
      setCurrentSchemaStep(s => s + 1);
      return;
    }
    setCompanyInfo(data);
    navigate('/formalite/etape-3');
  };

  const renderField = (field: any) => {
    const inputCls = `w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white 
      text-sm focus:outline-none focus:border-primary focus:ring-2 
      focus:ring-primary/10 transition-all`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...register(field.name, { required: field.required })}
            rows={3}
            placeholder={field.placeholder}
            className={`${inputCls} resize-none`}
          />
        );
      case 'select':
        return (
          <select {...register(field.name, { required: field.required })} className={inputCls}>
            <option value="">Sélectionner...</option>
            {field.options?.map((o: any) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((o: any) => (
              <label key={o.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  {...register(field.name, { required: field.required })}
                  type="radio"
                  value={o.value}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((o: any) => (
              <label key={o.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  {...register(`${field.name}.${o.value}`)}
                  type="checkbox"
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-slate-700">{o.label}</span>
              </label>
            ))}
          </div>
        );
      case 'file':
        return (
          <input
            type="file"
            {...register(field.name, { required: field.required })}
            className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 
              file:rounded-xl file:border-0 file:text-sm file:font-medium 
              file:bg-primary/8 file:text-primary hover:file:bg-primary/15 
              cursor-pointer"
          />
        );
      default:
        return (
          <input
            {...register(field.name, { required: field.required })}
            type={field.type}
            placeholder={field.placeholder}
            className={inputCls}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Si pas de form_schema configuré → formulaire par défaut
  if (!hasCustomForm) {
    return <DefaultCompanyForm onSubmit={(data) => { setCompanyInfo(data); navigate('/formalite/etape-3'); }} defaultValues={wizardData.companyInfo} />;
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Progress des sous-étapes du schema */}
      {schemaSteps.length > 1 && (
        <div className="flex items-center gap-2 mb-8">
          {schemaSteps.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex-1 h-1.5 rounded-full transition-all ${
                idx <= currentSchemaStep ? 'bg-primary' : 'bg-slate-200'
              }`} />
            </div>
          ))}
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {currentSchemaStepData?.title ?? 'Informations'}
        </h1>
        {currentSchemaStepData?.description && (
          <p className="text-slate-500">{currentSchemaStepData.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          {currentSchemaStepData?.fields?.map((field: any) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {renderField(field)}
              {errors[field.name] && (
                <div className="flex items-center gap-1.5 mt-1.5 text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <p className="text-xs">Ce champ est requis</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4">
          <button type="button"
            onClick={() => {
              if (currentSchemaStep > 0) setCurrentSchemaStep(s => s - 1);
              else navigate('/formalite');
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium 
              text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <button type="submit"
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold 
              text-white gradient-primary shadow-md shadow-primary/20 
              hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            {isLastSchemaStep ? 'Continuer' : 'Étape suivante'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

const defaultSchema = z.object({
  denomination: z.string().min(1, 'La dénomination sociale est requise'),
  sigle: z.string().optional(),
  objetSocial: z.string().min(20, 'Décrivez l\'activité en au moins 20 caractères'),
  capitalSocial: z.coerce.number().min(1, 'Capital social requis (minimum 1€)').optional(),
  adresse: z.string().min(5, 'Adresse complète requise'),
  codePostal: z.string().regex(/^\d{5}$/, 'Code postal invalide (5 chiffres)'),
  ville: z.string().min(1, 'Ville requise'),
});

type DefaultFormData = z.infer<typeof defaultSchema>;

function FormField({ 
  label, error, required, children, hint 
}: { 
  label: string; error?: string; required?: boolean; 
  children: React.ReactNode; hint?: string 
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && (
        <div className="flex items-center gap-1.5 text-red-500">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}

const inputClass = (hasError: boolean) => `
  w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 
  placeholder:text-slate-400 outline-none transition-all duration-200
  ${hasError 
    ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100' 
    : 'border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10'
  }
`;

function DefaultCompanyForm({ onSubmit, defaultValues }: { onSubmit: (data: DefaultFormData) => void, defaultValues: any }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<DefaultFormData>({
    resolver: zodResolver(defaultSchema) as any,
    mode: 'onBlur',
    defaultValues: defaultValues ?? {},
  });

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Informations sur votre entreprise
        </h1>
        <p className="text-slate-500">
          Ces données serviront à rédiger vos statuts et formulaires officiels.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* Section Identité */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-50 bg-slate-50/50">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Identité de la société</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Dénomination sociale" error={errors.denomination?.message} required>
              <input 
                {...register('denomination')} 
                className={inputClass(!!errors.denomination)}
                placeholder="Ex : Formalia Tech"
              />
            </FormField>
            <FormField label="Sigle" error={errors.sigle?.message} hint="Optionnel">
              <input 
                {...register('sigle')} 
                className={inputClass(!!errors.sigle)}
                placeholder="Ex : FT"
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Objet social" error={errors.objetSocial?.message} required
                hint="Décrivez l'activité principale (20 caractères minimum)">
                <textarea 
                  {...register('objetSocial')} 
                  rows={3}
                  className={inputClass(!!errors.objetSocial) + ' resize-none'}
                  placeholder="Conseil en stratégie digitale, développement web..."
                />
              </FormField>
            </div>
            <FormField label="Capital social (€)" error={errors.capitalSocial?.message}
              hint="Minimum 1€ pour une SAS/SASU">
              <input 
                {...register('capitalSocial')} 
                type="number" min={1}
                className={inputClass(!!errors.capitalSocial)}
                placeholder="1000"
              />
            </FormField>
          </div>
        </div>

        {/* Section Siège social */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-50 bg-slate-50/50">
            <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Siège social</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-3">
              <FormField label="Adresse" error={errors.adresse?.message} required>
                <input 
                  {...register('adresse')} 
                  className={inputClass(!!errors.adresse)}
                  placeholder="12 rue de la Paix"
                />
              </FormField>
            </div>
            <FormField label="Code postal" error={errors.codePostal?.message} required>
              <input 
                {...register('codePostal')} 
                className={inputClass(!!errors.codePostal)}
                placeholder="75001"
                maxLength={5}
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Ville" error={errors.ville?.message} required>
                <input 
                  {...register('ville')} 
                  className={inputClass(!!errors.ville)}
                  placeholder="Paris"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button 
            type="button"
            onClick={() => navigate('/formalite')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium 
              text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <button 
            type="submit"
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold 
              text-white gradient-primary shadow-md shadow-primary/20 
              hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
