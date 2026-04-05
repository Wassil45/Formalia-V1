import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';

interface Props { children?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, errorInfo.componentStack);
    // TODO: Sentry.captureException(error, { extra: errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 
            p-8 text-center animate-scale-in">
            <div className="w-16 h-16 bg-red-50 text-red-400 rounded-2xl flex items-center 
              justify-center mx-auto mb-6 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Une erreur est survenue sur Formalia
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Nous sommes désolés, une erreur inattendue empêche l'affichage de cette page. Notre équipe technique a été notifiée.
            </p>

            {/* Détails tech uniquement en développement */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-left">
                <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5" />
                  Détails (mode développement)
                </p>
                <pre className="text-xs text-red-500 overflow-auto max-h-32 
                  whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 py-3 
                  gradient-primary text-white rounded-xl font-semibold text-sm 
                  shadow-md shadow-primary/20 hover:shadow-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Recharger la page
              </button>
              <button
                onClick={() => { 
                  this.setState({ hasError: false, error: null }); 
                  window.location.href = '/'; 
                }}
                className="w-full flex items-center justify-center gap-2 py-3 
                  border border-slate-200 text-slate-600 rounded-xl font-medium 
                  text-sm hover:bg-slate-50 transition-all"
              >
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </button>
              <a
                href="mailto:support@formalia.fr?subject=Rapport d'erreur Formalia"
                className="w-full flex items-center justify-center gap-2 py-3 
                  border border-slate-200 text-slate-600 rounded-xl font-medium 
                  text-sm hover:bg-slate-50 transition-all"
              >
                <Mail className="w-4 h-4" />
                Signaler le problème
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
