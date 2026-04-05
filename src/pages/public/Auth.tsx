import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useSettings } from '../../hooks/useSettings';
import { 
  Mail, Lock, Eye, EyeOff, Scale, CheckCircle2, 
  ArrowRight, Loader2, ShieldCheck, Zap, HeadphonesIcon
} from 'lucide-react';

const schema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  { icon: Zap, text: 'Kbis en 48h chrono' },
  { icon: ShieldCheck, text: 'Paiement 100% sécurisé' },
  { icon: HeadphonesIcon, text: 'Experts juridiques disponibles' },
];

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { data: settings } = useSettings();
  const logoUrl = settings?.logo_url;

  const selectedFormalite = location.state as { 
    selectedFormaliteId?: string; 
    selectedFormaliteName?: string 
  } | null;

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormData) => {
    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user!.id)
          .single();

        toast('success', 'Connexion réussie', `Bienvenue !`);

        const redirectTo = selectedFormalite?.selectedFormaliteId
          ? '/formalite'
          : profile?.role === 'admin' ? '/admin' : '/dashboard';
        navigate(redirectTo, { state: selectedFormalite });
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast('success', 'Compte créé !', 'Vérifiez votre email pour confirmer.');
      }
    } catch (err: unknown) {
      toast('error', 'Erreur', err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleForgotPassword = async () => {
    const email = watch('email');
    if (!email) { toast('warning', 'Email requis', 'Entrez votre email d\'abord'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast('error', 'Erreur', error.message);
    else { setForgotSent(true); toast('success', 'Email envoyé !', 'Vérifiez votre boîte mail.'); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel gauche — branding */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 
        bg-gradient-to-br from-slate-900 via-[#1a1a3a] to-primary relative overflow-hidden">
        
        {/* Effets visuels */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full 
          blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/20 rounded-full 
          blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-9 h-9 object-contain" />
          ) : (
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="w-4.5 h-4.5 text-white" />
            </div>
          )}
          <span className="text-white text-xl font-bold">{settings?.company_name || 'Formalia'}</span>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h1 className="text-white text-4xl font-black leading-tight mb-6">
            Vos formalités juridiques,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r 
              from-blue-400 to-purple-400">
              sans friction.
            </span>
          </h1>
          <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
            Rejoignez +10 000 entrepreneurs qui gèrent leur administratif avec {settings?.company_name || 'Formalia'}.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/80 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['#6366F1','#8B5CF6','#06B6D4','#10B981'].map(color => (
              <div key={color} 
                className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center 
                  justify-center text-white text-xs font-bold"
                style={{ backgroundColor: color }}
              >
                {color[1].toUpperCase()}
              </div>
            ))}
          </div>
          <p className="text-white/60 text-xs">
            ⭐ 4.9/5 · Noté par 2 400+ entrepreneurs
          </p>
        </div>
      </div>

      {/* Panel droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-lg font-bold text-slate-900">{settings?.company_name || 'Formalia'}</span>
          </div>

          {/* Formalité pré-sélectionnée */}
          {selectedFormalite?.selectedFormaliteName && (
            <div className="mb-6 flex items-center gap-2.5 p-3.5 bg-primary/8 
              border border-primary/20 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="text-sm">
                <span className="text-slate-600">Formalité sélectionnée : </span>
                <span className="font-semibold text-primary">
                  {selectedFormalite.selectedFormaliteName}
                </span>
              </div>
            </div>
          )}

          {/* Titre */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {isLogin ? 'Bon retour 👋' : 'Créer un compte'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isLogin 
                ? `Connectez-vous à votre espace ${settings?.company_name || 'Formalia'}`
                : 'Commencez gratuitement, sans engagement'
              }
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-8">
            {[
              { key: true, label: 'Connexion' },
              { key: false, label: 'Inscription' },
            ].map(tab => (
              <button
                key={String(tab.key)}
                onClick={() => setIsLogin(tab.key)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  isLogin === tab.key 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 
                  text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.fr"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm
                    outline-none transition-all ${
                    errors.email 
                      ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-100' 
                      : 'border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-primary hover:text-primary-dark"
                  >
                    {forgotSent ? '✓ Email envoyé' : 'Mot de passe oublié ?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 
                  text-slate-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm
                    outline-none transition-all ${
                    errors.password 
                      ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-100' 
                      : 'border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 
                    text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-3.5 
                rounded-xl text-sm font-bold text-white transition-all mt-2 ${
                isSubmitting 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'gradient-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting 
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</>
                : <>{isLogin ? 'Se connecter' : 'Créer mon compte'}<ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          {!isLogin && (
            <p className="text-xs text-slate-400 text-center mt-6">
              En créant un compte, vous acceptez nos{' '}
              <Link to="/cgv" className="text-primary hover:underline">CGV</Link>
              {' '}et notre{' '}
              <Link to="/confidentialite" className="text-primary hover:underline">
                politique de confidentialité
              </Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
