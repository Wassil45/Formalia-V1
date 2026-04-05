import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

type FormField = {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  help?: string;
  options?: string[];
};

type DynamicFieldProps = {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
};

export const DynamicField = ({ field, register, errors, watch, setValue }: DynamicFieldProps) => {
  const error = errors[field.id];

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type={field.type}
            placeholder={field.placeholder}
            {...register(field.id, {
              required: field.required ? `${field.label} est obligatoire` : false,
              ...(field.type === 'email' && {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email invalide'
                }
              })
            })}
            className={`
              w-full px-4 py-3 rounded-xl border text-slate-800
              focus:outline-none focus:ring-2 
              transition-all duration-200
              ${error 
                ? 'border-red-400 focus:ring-red-200 bg-red-50/30' 
                : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400 bg-slate-50/50 focus:bg-white'
              }
            `}
          />
          {field.help && <p className="text-xs text-slate-500">{field.help}</p>}
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {error.message as string}
            </p>
          )}
        </div>
      );

    case 'select':
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            {...register(field.id, {
              required: field.required ? `${field.label} est obligatoire` : false
            })}
            className={`
              w-full px-4 py-3 rounded-xl border 
              focus:outline-none focus:ring-2 
              text-slate-800 bg-white transition-all
              ${error 
                ? 'border-red-400 focus:ring-red-200' 
                : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
              }
            `}
          >
            <option value="">Sélectionnez...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {error.message as string}
            </p>
          )}
        </div>
      );

    case 'siret':
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            maxLength={14}
            placeholder="14 chiffres"
            {...register(field.id, {
              required: field.required ? `${field.label} est obligatoire` : false,
              pattern: {
                value: /^\d{14}$/,
                message: 'Le SIRET doit contenir exactement 14 chiffres'
              }
            })}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 14);
              setValue(field.id, val);
            }}
            className={`
              w-full px-4 py-3 rounded-xl border font-mono
              focus:outline-none focus:ring-2 
              transition-all duration-200
              ${error 
                ? 'border-red-400 focus:ring-red-200' 
                : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400 bg-slate-50/50 focus:bg-white'
              }
            `}
          />
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {error.message as string}
            </p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            rows={4}
            placeholder={field.placeholder}
            {...register(field.id, {
              required: field.required ? `${field.label} est obligatoire` : false
            })}
            className={`
              w-full px-4 py-3 rounded-xl border resize-none
              focus:outline-none focus:ring-2 
              transition-all duration-200
              ${error 
                ? 'border-red-400 focus:ring-red-200' 
                : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400 bg-slate-50/50 focus:bg-white'
              }
            `}
          />
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {error.message as string}
            </p>
          )}
        </div>
      );

    default:
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">{field.label}</label>
          <input
            type="text"
            {...register(field.id)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      );
  }
};
