import { useState } from 'react';
import Spline from '@splinetool/react-spline';
import { Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { 
  ArrowRight, ShieldCheck, Zap, Clock, CheckCircle2, 
  FileText, Building2, Scale, HeadphonesIcon, FileCheck
} from 'lucide-react';

function HeroSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900 border-b border-white/5">
      {/* Spline 3D Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Spline scene="https://prod.spline.design/x4hLf7TYnpqbhNnn/scene.splinecode" style={{ pointerEvents: 'none' }} />
      </div>

      {/* Overlay sombre pour assurer la lisibilité du texte sur le fond 3D */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] pointer-events-none z-0" />

      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-[100px]" />
      </div>
      
      {/* Contenu principal positionné par dessus le background (z-10, grid pointer-events) */}
      <div className="container mx-auto px-6 relative z-10 pointer-events-none">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-6">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Nouveau : Kbis en 48h chrono</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
              Vos formalités juridiques, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                sans friction.
              </span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
              Créez, modifiez ou fermez votre entreprise en quelques clics. 
              Nos experts juridiques s'occupent de tout, de la rédaction des statuts à l'immatriculation.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                to="/auth" 
                state={{ selectedFormaliteId: null }}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold gradient-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                Démarrer maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/services"
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold bg-white/10 hover:bg-white/20 transition-all"
              >
                Voir nos tarifs
              </Link>
            </div>
          </div>

          {/* 3D Mockup */}
          <div 
            className="relative hidden lg:block animate-fade-in-up pointer-events-auto"
            style={{ perspective: '1000px' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div 
              className="relative w-full aspect-[4/3] rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-xl shadow-2xl overflow-hidden"
              style={{ 
                transform: isHovered ? 'rotateY(0deg) rotateX(0deg)' : 'rotateY(-15deg) rotateX(5deg)',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Fake UI inside mockup */}
              <div className="absolute inset-0 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <Scale className="w-4 h-4 text-white" />
                  </div>
                  <div className="h-4 w-24 bg-white/20 rounded-full" />
                </div>
                <div className="flex-1 flex gap-6">
                  <div className="w-1/3 space-y-3">
                    <div className="h-20 bg-white/5 rounded-xl border border-white/10" />
                    <div className="h-20 bg-white/5 rounded-xl border border-white/10" />
                    <div className="h-20 bg-white/5 rounded-xl border border-white/10" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-6">
                    <div className="h-6 w-1/2 bg-white/20 rounded-full mb-6" />
                    <div className="space-y-4">
                      <div className="h-4 w-full bg-white/10 rounded-full" />
                      <div className="h-4 w-5/6 bg-white/10 rounded-full" />
                      <div className="h-4 w-4/6 bg-white/10 rounded-full" />
                    </div>
                    <div className="mt-8 h-10 w-32 bg-primary/80 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  return (
    <section className="py-10 border-b border-slate-100 bg-white animate-fade-in-up">
      <div className="container mx-auto px-6 text-center">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
          Ils nous font confiance pour leur juridique
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
          <div className="flex items-center gap-2 text-xl font-black text-slate-800">
            <Building2 className="w-6 h-6"/> TechStart
          </div>
          <div className="flex items-center gap-2 text-xl font-black text-slate-800">
            <Zap className="w-6 h-6"/> InnovateCorp
          </div>
          <div className="flex items-center gap-2 text-xl font-black text-slate-800">
            <Scale className="w-6 h-6"/> LegalFlow
          </div>
          <div className="flex items-center gap-2 text-xl font-black text-slate-800">
            <CheckCircle2 className="w-6 h-6"/> TrustPay
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { 
      icon: FileText, 
      title: '1. Choisissez votre formalité', 
      desc: 'Sélectionnez le service adapté à votre besoin parmi notre catalogue.' 
    },
    { 
      icon: Clock, 
      title: '2. Remplissez le formulaire', 
      desc: 'Répondez à quelques questions simples en moins de 5 minutes.' 
    },
    { 
      icon: FileCheck, 
      title: '3. Recevez vos documents', 
      desc: 'Nos experts valident votre dossier et vous envoient votre Kbis.' 
    },
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Comment ça marche ?</h2>
          <p className="text-slate-500">Un processus simple et transparent pour vous faire gagner du temps.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          
          {steps.map((step, i) => (
            <div 
              key={i} 
              className="relative z-10 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center animate-fade-in-up" 
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const { data: settings } = useSettings();
  const companyName = settings?.company_name || 'Formalia';

  const benefits = [
    { icon: Zap, title: 'Rapide', desc: 'Traitement de votre dossier en 24h ouvrées.' },
    { icon: ShieldCheck, title: 'Sécurisé', desc: 'Vos données sont chiffrées et stockées en France.' },
    { icon: HeadphonesIcon, title: 'Accompagnement', desc: 'Des juristes experts à votre écoute par chat ou téléphone.' },
    { icon: CheckCircle2, title: '100% en ligne', desc: 'Zéro papier, signature électronique intégrée.' },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
              Pourquoi choisir {companyName} ?
            </h2>
            <p className="text-lg text-slate-500 mb-8">
              Nous combinons la technologie et l'expertise humaine pour vous offrir la meilleure expérience juridique du marché.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">{b.title}</h4>
                    <p className="text-sm text-slate-500">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-fade-in-up group">
            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-tr from-primary/30 to-secondary/30 blur-3xl absolute -inset-4 opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
            <img 
              src="/equipe.jpg" 
              alt={`Équipe ${companyName} - Teamwork`} 
              className="relative w-full rounded-2xl shadow-2xl border border-white/50 object-cover aspect-[4/3] group-hover:-translate-y-1 transition-transform duration-500"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback si l'image n'est pas encore uploadée manuellement
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80";
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-24 bg-white animate-fade-in-up">
      <div className="container mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden gradient-primary p-12 text-center shadow-2xl shadow-primary/20">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Prêt à lancer votre projet ?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Rejoignez des milliers d'entrepreneurs qui ont choisi la simplicité.
            </p>
            <Link 
              to="/auth"
              state={{ selectedFormaliteId: null }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              Démarrer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Home() {
  return (
    <div className="bg-white">
      <HeroSection />
      <SocialProofSection />
      <HowItWorksSection />
      <BenefitsSection />
      <CtaSection />
    </div>
  );
}
