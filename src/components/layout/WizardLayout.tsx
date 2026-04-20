import { useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { WizardProvider, useWizard } from '../../context/WizardContext';
import { useSettings } from '../../hooks/useSettings';
import { Scale, X, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

function WizardHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: wizardData, canProceedToStep } = useWizard();
  const { data: settings } = useSettings();
  const logoUrl = settings?.logo_url;

  // Retrieve the custom schema steps of the selected formality
  const { data: formalite } = useQuery({
    queryKey: ['formalite_schema', wizardData.formaliteId],
    enabled: !!wizardData.formaliteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formalites_catalogue')
        .select('form_schema, required_documents')
        .eq('id', wizardData.formaliteId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const STEPS = useMemo(() => {
    const baseSteps = [
      { path: '/formalite', label: 'Formalité', step: 1 }
    ];

    const schemaSteps = (formalite?.form_schema as any)?.steps || [];
    
    // Add custom form steps
    if (schemaSteps.length > 0) {
      schemaSteps.forEach((s: any, index: number) => {
        baseSteps.push({
          path: `/formalite/etape-2?step=${index}`,
          label: s.title || `Étape ${index + 1}`,
          step: 2 + index
        });
      });
    } else {
      // Default to Entreprise if no custom steps
      baseSteps.push({
        path: '/formalite/etape-2?step=0',
        label: 'Entreprise',
        step: 2
      });
    }

    const nextStepOffset = baseSteps.length;

    // Add Documents Step
    baseSteps.push({
      path: '/formalite/etape-3',
      label: 'Documents',
      step: nextStepOffset + 1
    });

    // Add Payment Step
    baseSteps.push({
      path: '/formalite/paiement',
      label: 'Paiement',
      step: nextStepOffset + 2
    });

    return baseSteps;
  }, [formalite]);

  // Determine current step based on location.pathname AND optionally location.search
  const currentStepInfo = useMemo(() => {
    let current = STEPS.find(s => s.path === location.pathname + location.search);
    if (!current) {
      // Fallback for paths without search params or strict path matches
      current = STEPS.find(s => s.path.split('?')[0] === location.pathname);
    }
    return current;
  }, [STEPS, location.pathname, location.search]);

  const currentStep = currentStepInfo?.step ?? 1;
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-[70rem] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
            ) : (
              <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
                <Scale className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <span className="text-sm font-bold text-slate-900 hidden sm:block">{settings?.company_name || 'Formalia'}</span>
          </Link>

          {/* Steps indicators */}
          <div className="hidden md:flex items-center justify-center flex-1 px-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 min-w-max">
            {STEPS.map((step, idx) => {
              const isCompleted = step.step < currentStep;
              const isCurrent = step.step === currentStep;
              // Check access based on original rules: step 1 is always accessible,
              // for custom steps, we check if step 2 is accessible (which means formalite selected)
              // this is an approximation since all middle steps fall under the "etape-2" umbrella.
              let logicalStep = step.step;
              if (location.pathname === '/formalite/etape-2') {
                // If we are evaluating a middle custom step... wait, we can just allow them if `canProceedToStep(2)` is true.
                logicalStep = 2; 
              } else if (step.path === '/formalite/etape-3') {
                logicalStep = 3;
              } else if (step.path === '/formalite/paiement') {
                logicalStep = 4;
              }

              const isAccessible = canProceedToStep(logicalStep) || isCompleted;
              
              return (
                <div key={`${step.path}-${idx}`} className="flex items-center gap-1">
                  <button
                    onClick={() => isAccessible && navigate(step.path)}
                    disabled={!isAccessible}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
                      transition-all max-w-[150px] truncate ${
                      isCurrent 
                        ? 'bg-primary text-white shadow-sm' 
                        : isCompleted 
                        ? 'bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0
                      font-bold ${isCurrent ? 'bg-white/20' : ''}`}>
                      {isCompleted ? '✓' : step.step}
                    </span>
                    <span className="truncate">{step.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Progress mobile + Close */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="md:hidden text-xs text-slate-500 font-medium">
              {currentStep}/{STEPS.length}
            </span>
            <Link 
              to="/dashboard" 
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 
                hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100">
          <div 
            className="h-full gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </header>
  );
}

function WizardLayoutInner() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <WizardHeader />
      <main className="py-8 px-4">
        <Outlet />
      </main>
    </div>
  );
}

export function WizardLayout() {
  return (
    <WizardProvider>
      <WizardLayoutInner />
    </WizardProvider>
  );
}
