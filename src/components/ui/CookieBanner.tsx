import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [preferences, setPreferences] = useState({
    essentiels: true, // always true
    analytiques: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsent = { essentiels: true, analytiques: true, marketing: true };
    localStorage.setItem('cookie-consent', JSON.stringify(allConsent));
    setPreferences(allConsent);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const noConsent = { essentiels: true, analytiques: false, marketing: false };
    localStorage.setItem('cookie-consent', JSON.stringify(noConsent));
    setPreferences(noConsent);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowModal(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full z-50 p-4 md:p-6">
        <div className="glass-panel bg-white/80 backdrop-blur-lg border border-slate-200 shadow-2xl rounded-2xl p-6 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Respect de votre vie privée</h3>
            <p className="text-sm text-slate-600">
              Nous utilisons des cookies pour améliorer votre expérience. Consultez notre{' '}
              <a href="/confidentialite" className="text-primary hover:underline font-medium">
                politique de confidentialité
              </a>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleRejectAll} className="rounded-full">
              Tout refuser
            </Button>
            <Button variant="outline" onClick={() => setShowModal(true)} className="rounded-full">
              Personnaliser
            </Button>
            <Button onClick={handleAcceptAll} className="rounded-full bg-primary hover:bg-primary-dark">
              Tout accepter
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Préférences de cookies</DialogTitle>
            <DialogDescription>
              Gérez vos préférences en matière de cookies. Les cookies essentiels sont nécessaires au fonctionnement du site.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900">Cookies essentiels</h4>
                <p className="text-xs text-slate-500">Requis pour le fonctionnement du site.</p>
              </div>
              <Switch checked={preferences.essentiels} disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900">Cookies analytiques</h4>
                <p className="text-xs text-slate-500">Pour mesurer l'audience (Google Analytics).</p>
              </div>
              <Switch 
                checked={preferences.analytiques} 
                onCheckedChange={(c) => setPreferences(prev => ({ ...prev, analytiques: c }))} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900">Cookies marketing</h4>
                <p className="text-xs text-slate-500">Pour vous proposer des offres adaptées.</p>
              </div>
              <Switch 
                checked={preferences.marketing} 
                onCheckedChange={(c) => setPreferences(prev => ({ ...prev, marketing: c }))} 
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-full">
              Annuler
            </Button>
            <Button onClick={handleSavePreferences} className="rounded-full bg-primary hover:bg-primary-dark">
              Enregistrer mes choix
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
