import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { WizardProvider, useWizard } from '../../context/WizardContext';
import { useSettings } from '../../hooks/useSettings';
import { Scale, X, ChevronRight } from 'lucide-react';

const STEPS = [
  { path: '/formalite', label: 'Formalité', step: 1 },
  { path: '/formalite/etape-2', label: 'Entreprise', step: 2 },
  { path: '/formalite/etape-3', label: 'Documents', step: 3 },
  { path: '/formalite/paiement', label: 'Paiement', step: 4 },
];

function WizardHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canProceedToStep } = useWizard();
  const { data: settings } = useSettings();
  const logoUrl = settings?.logo_url;
  
  const currentStep = STEPS.find(s => s.path === location.pathname)?.step ?? 1;
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
            ) : (
              <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
                <Scale className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <span className="text-sm font-bold text-slate-900">{settings?.company_name || 'Formalia'}</span>
          </Link>

          {/* Steps indicators */}
          <div className="hidden sm:flex items-center gap-1">
            {STEPS.map((step, idx) => {
              const isCompleted = step.step < currentStep;
              const isCurrent = step.step === currentStep;
              const isAccessible = canProceedToStep(step.step);
              
              return (
                <div key={step.path} className="flex items-center gap-1">
                  <button
                    onClick={() => isAccessible && navigate(step.path)}
                    disabled={!isAccessible}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
                      transition-all ${
                      isCurrent 
                        ? 'bg-primary text-white shadow-sm' 
                        : isCompleted 
                        ? 'bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs 
                      font-bold ${isCurrent ? 'bg-white/20' : ''}`}>
                      {isCompleted ? '✓' : step.step}
                    </span>
                    {step.label}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress mobile + Close */}
          <div className="flex items-center gap-3">
            <span className="sm:hidden text-xs text-slate-500 font-medium">
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
