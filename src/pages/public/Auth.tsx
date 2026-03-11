import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, EyeOff, Eye } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        
        // Fetch profile to determine role and redirect accordingly
        if (authData.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();
            
          if (profile?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        // In a real app, you'd handle email confirmation here
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background-light">
      {/* Left Section */}
      <div className="relative w-full lg:w-[40%] flex flex-col justify-between p-8 lg:p-12 overflow-hidden bg-gradient-to-br from-[#0d0d1c] via-[#1a1a3a] to-primary">
        <div className="relative z-10 flex items-center gap-3 mb-10 lg:mb-0">
          <img src="/logo.png" alt="Formalia Logo" className="w-12 h-12 object-contain" />
          <h2 className="text-white text-xl font-bold tracking-tight">Formalia</h2>
        </div>
        <div className="relative z-10 flex flex-col justify-center flex-grow max-w-md">
          <h1 className="text-white text-3xl lg:text-4xl font-black leading-tight tracking-tight mb-6 font-display">
            Gérez toutes vos formalités juridiques.
          </h1>
          <p className="text-indigo-100 text-lg mb-10 leading-relaxed opacity-90">
            Rejoignez plus de 10 000 entrepreneurs qui nous font confiance pour leur gestion administrative.
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full max-w-[440px] glass-panel rounded-2xl shadow-lg p-6 sm:p-10 bg-white/80">
          <div className="flex border-b border-gray-200 mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-4 text-center font-bold text-sm sm:text-base transition-colors ${isLogin ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'}`}
            >
              Connexion
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-4 text-center font-bold text-sm sm:text-base transition-colors ${!isLogin ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'}`}
            >
              Créer un compte
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Adresse e-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  {...register('email')}
                  type="email" 
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border-gray-200 bg-white text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-primary sm:text-sm shadow-sm" 
                  placeholder="exemple@email.com" 
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">Mot de passe</label>
                {isLogin && <a href="#" className="text-xs font-semibold text-primary hover:text-indigo-600">Mot de passe oublié ?</a>}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  {...register('password')}
                  type={showPassword ? "text" : "password"} 
                  className="block w-full pl-10 pr-10 py-3 rounded-xl border-gray-200 bg-white text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-primary sm:text-sm shadow-sm" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="mt-2 w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-primary to-indigo-600 hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
            </button>

            {!isLogin && (
              <p className="text-xs text-slate-500 text-center mt-4">
                En vous inscrivant, vous acceptez nos <Link to="/cgv" className="text-primary hover:underline">CGV</Link> et notre <Link to="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
                <br />
                <span className="italic">Vos données sont conservées 7 ans conformément aux obligations légales françaises.</span>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
