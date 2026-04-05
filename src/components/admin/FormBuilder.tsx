import { useState } from 'react';
import { 
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Type, AlignLeft, Hash, List, CheckSquare, Calendar, 
  Upload, ToggleLeft, Copy, Eye, EyeOff
} from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Texte court', icon: Type },
  { value: 'textarea', label: 'Texte long', icon: AlignLeft },
  { value: 'number', label: 'Nombre', icon: Hash },
  { value: 'select', label: 'Liste déroulante', icon: List },
  { value: 'radio', label: 'Choix unique', icon: ToggleLeft },
  { value: 'checkbox', label: 'Cases à cocher', icon: CheckSquare },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'file', label: 'Fichier', icon: Upload },
];

interface Field {
  id: string;
  type: string;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: { min?: number; max?: number; pattern?: string };
}

interface Step {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
}

interface FormBuilderProps {
  value: { steps: Step[] } | null;
  onChange: (schema: { steps: Step[] }) => void;
}

const generateId = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_FIELD: Omit<Field, 'id'> = {
  type: 'text',
  label: 'Nouveau champ',
  name: 'new_field',
  required: false,
  placeholder: '',
  options: [],
};

export function FormBuilder({ value, onChange }: FormBuilderProps) {
  const steps = value?.steps ?? [];
  const [activeStep, setActiveStep] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  const updateSteps = (newSteps: Step[]) => {
    onChange({ steps: newSteps });
  };

  const addStep = () => {
    const newStep: Step = {
      id: generateId(),
      title: `Étape ${steps.length + 1}`,
      description: '',
      fields: [],
    };
    const newSteps = [...steps, newStep];
    updateSteps(newSteps);
    setActiveStep(newSteps.length - 1);
  };

  const removeStep = (idx: number) => {
    const newSteps = steps.filter((_, i) => i !== idx);
    updateSteps(newSteps);
    setActiveStep(Math.max(0, idx - 1));
  };

  const updateStep = (idx: number, updates: Partial<Step>) => {
    updateSteps(steps.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const addField = (stepIdx: number) => {
    const field: Field = { id: generateId(), ...DEFAULT_FIELD, 
      name: `field_${generateId()}` };
    updateStep(stepIdx, { 
      fields: [...(steps[stepIdx]?.fields ?? []), field] 
    });
  };

  const updateField = (stepIdx: number, fieldIdx: number, updates: Partial<Field>) => {
    const fields = [...(steps[stepIdx]?.fields ?? [])];
    fields[fieldIdx] = { ...fields[fieldIdx], ...updates };
    updateStep(stepIdx, { fields });
  };

  const removeField = (stepIdx: number, fieldIdx: number) => {
    const fields = steps[stepIdx]?.fields.filter((_, i) => i !== fieldIdx) ?? [];
    updateStep(stepIdx, { fields });
  };

  const duplicateField = (stepIdx: number, fieldIdx: number) => {
    const field = steps[stepIdx]?.fields[fieldIdx];
    if (!field) return;
    const newField = { ...field, id: generateId(), name: `${field.name}_copy` };
    const fields = [...(steps[stepIdx]?.fields ?? [])];
    fields.splice(fieldIdx + 1, 0, newField);
    updateStep(stepIdx, { fields });
  };

  const currentStep = steps[activeStep];

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
      
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white 
        border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">
          Éditeur de formulaire
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs 
              font-medium transition-all ${
              previewMode 
                ? 'bg-primary text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {previewMode ? <><EyeOff className="w-3.5 h-3.5" /> Éditer</> 
              : <><Eye className="w-3.5 h-3.5" /> Prévisualiser</>}
          </button>
        </div>
      </div>

      {previewMode ? (
        // MODE PRÉVISUALISATION
        <div className="p-6 max-h-96 overflow-y-auto">
          {steps.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              Aucune étape configurée
            </p>
          ) : (
            <div className="space-y-6">
              {steps.map((step, si) => (
                <div key={step.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 gradient-primary rounded-full flex items-center 
                      justify-center text-white text-xs font-bold">{si + 1}</span>
                    <h4 className="font-semibold text-slate-900">{step.title}</h4>
                  </div>
                  <div className="space-y-4 pl-8">
                    {step.fields.map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea rows={3} 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 
                              bg-white text-sm resize-none" 
                            placeholder={field.placeholder} disabled />
                        ) : field.type === 'select' ? (
                          <select className="w-full px-3.5 py-2.5 rounded-xl border 
                            border-slate-200 bg-white text-sm" disabled>
                            <option>Sélectionner...</option>
                            {field.options?.map(o => (
                              <option key={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : field.type === 'radio' ? (
                          <div className="space-y-2">
                            {field.options?.map(o => (
                              <label key={o.value} className="flex items-center gap-2 text-sm">
                                <input type="radio" disabled />
                                {o.label}
                              </label>
                            ))}
                          </div>
                        ) : field.type === 'checkbox' ? (
                          <div className="space-y-2">
                            {field.options?.map(o => (
                              <label key={o.value} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" disabled />
                                {o.label}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input 
                            type={field.type} 
                            placeholder={field.placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 
                              bg-white text-sm" 
                            disabled 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // MODE ÉDITION
        <div className="flex h-96">
          
          {/* Panel gauche : liste des étapes */}
          <div className="w-48 border-r border-slate-200 bg-white flex flex-col">
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {steps.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs 
                    font-medium transition-all group flex items-center gap-2 ${
                    activeStep === idx 
                      ? 'bg-primary/8 text-primary' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center 
                    text-[10px] font-bold flex-shrink-0 ${
                    activeStep === idx 
                      ? 'bg-primary text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>{idx + 1}</span>
                  <span className="flex-1 truncate">{step.title}</span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeStep(idx); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded 
                      text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-slate-100">
              <button
                type="button"
                onClick={addStep}
                className="w-full flex items-center justify-center gap-1.5 py-2 
                  text-xs font-medium text-primary bg-primary/8 rounded-xl 
                  hover:bg-primary/15 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter étape
              </button>
            </div>
          </div>

          {/* Panel droit : édition de l'étape active */}
          <div className="flex-1 overflow-y-auto">
            {!currentStep ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                <Plus className="w-8 h-8" />
                <p className="text-sm">Ajoutez une étape pour commencer</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Config de l'étape */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Titre de l'étape
                    </label>
                    <input
                      value={currentStep.title}
                      onChange={e => updateStep(activeStep, { title: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl 
                        focus:outline-none focus:border-primary focus:ring-2 
                        focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Description (optionnel)
                    </label>
                    <input
                      value={currentStep.description ?? ''}
                      onChange={e => updateStep(activeStep, { description: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl 
                        focus:outline-none focus:border-primary focus:ring-2 
                        focus:ring-primary/10 transition-all"
                      placeholder="Sous-titre de l'étape"
                    />
                  </div>
                </div>

                {/* Champs */}
                <div className="space-y-3">
                  {currentStep.fields.map((field, fi) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      onChange={updates => updateField(activeStep, fi, updates)}
                      onDelete={() => removeField(activeStep, fi)}
                      onDuplicate={() => duplicateField(activeStep, fi)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addField(activeStep)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 
                    border-2 border-dashed border-slate-200 rounded-xl text-sm 
                    text-slate-500 hover:border-primary hover:text-primary 
                    hover:bg-primary/4 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un champ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sous-composant d'édition d'un champ
function FieldEditor({ field, onChange, onDelete, onDuplicate }: {
  field: Field;
  onChange: (updates: Partial<Field>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const TypeIcon = FIELD_TYPES.find(t => t.value === field.type)?.icon ?? Type;
  const hasOptions = ['select', 'radio', 'checkbox'].includes(field.type);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* En-tête du champ */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="w-4 h-4 text-slate-300 cursor-grab flex-shrink-0" />
        <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
          <TypeIcon className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={field.label}
            onChange={e => onChange({ label: e.target.value })}
            className="w-full text-sm font-medium text-slate-900 bg-transparent 
              border-none outline-none focus:bg-slate-50 rounded px-1"
            placeholder="Label du champ"
          />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={e => onChange({ required: e.target.checked })}
              className="w-3 h-3 rounded accent-primary"
            />
            Requis
          </label>
          <button type="button" onClick={onDuplicate}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary 
              hover:bg-primary/8 transition-all">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 
              hover:bg-red-50 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Options expandées */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Type</label>
              <select
                value={field.type}
                onChange={e => onChange({ type: e.target.value })}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg 
                  focus:outline-none focus:border-primary transition-all bg-white"
              >
                {FIELD_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nom (technique)</label>
              <input
                value={field.name}
                onChange={e => onChange({ name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg 
                  focus:outline-none focus:border-primary transition-all font-mono"
                placeholder="nom_du_champ"
              />
            </div>
          </div>
          {!hasOptions && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Placeholder</label>
              <input
                value={field.placeholder ?? ''}
                onChange={e => onChange({ placeholder: e.target.value })}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg 
                  focus:outline-none focus:border-primary transition-all"
              />
            </div>
          )}
          {hasOptions && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Options (une par ligne, format: label|valeur)
              </label>
              <textarea
                rows={3}
                value={field.options?.map(o => `${o.label}|${o.value}`).join('\n') ?? ''}
                onChange={e => {
                  const options = e.target.value.split('\n')
                    .filter(l => l.trim())
                    .map(l => {
                      const [label, value] = l.split('|');
                      return { label: label?.trim(), value: value?.trim() ?? label?.trim() };
                    });
                  onChange({ options });
                }}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg 
                  focus:outline-none focus:border-primary transition-all resize-none font-mono"
                placeholder="Option 1|option_1&#10;Option 2|option_2"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
