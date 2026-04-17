import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { PublicLayout } from './components/layout/PublicLayout';
import { ClientLayout } from './components/layout/ClientLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { WizardLayout } from './components/layout/WizardLayout';
import { CookieBanner } from './components/ui/CookieBanner';
import { ErrorBoundary } from './components/ErrorBoundary';

// ── Public Pages ──
const Home = lazy(() => import('./pages/public/Home').then(m => ({ default: m.Home })));
const Services = lazy(() => import('./pages/public/Services').then(m => ({ default: m.Services })));
const Tarifs = lazy(() => import('./pages/public/Tarifs').then(m => ({ default: m.Tarifs })));
const Auth = lazy(() => import('./pages/public/Auth').then(m => ({ default: m.Auth })));
const Faq = lazy(() => import('./pages/public/Faq').then(m => ({ default: m.Faq })));
const MentionsLegales = lazy(() => import('./pages/public/MentionsLegales').then(m => ({ default: m.MentionsLegales })));
const CGV = lazy(() => import('./pages/public/CGV').then(m => ({ default: m.CGV })));
const Confidentialite = lazy(() => import('./pages/public/Confidentialite').then(m => ({ default: m.Confidentialite })));

// ── Client Pages ──
const Dashboard = lazy(() => import('./pages/client/Dashboard').then(m => ({ default: m.Dashboard })));
const DossiersList = lazy(() => import('./pages/client/DossiersList').then(m => ({ default: m.DossiersList })));
const DossierDetail = lazy(() => import('./pages/client/DossierDetail').then(m => ({ default: m.DossierDetail })));
const ClientDocuments = lazy(() => import('./pages/client/ClientDocuments').then(m => ({ default: m.ClientDocuments })));
const ClientPayments = lazy(() => import('./pages/client/ClientPayments').then(m => ({ default: m.ClientPayments })));
const ClientSettings = lazy(() => import('./pages/client/ClientSettings').then(m => ({ default: m.ClientSettings })));
const ConfirmationPage = lazy(() => import('./pages/client/ConfirmationPage').then(m => ({ default: m.ConfirmationPage })));
const ClientMessages = lazy(() => import('./pages/client/ClientMessages').then(m => ({ default: m.ClientMessages })));

// ── Wizard Pages ──
const WizardStep1 = lazy(() => import('./pages/client/WizardStep1').then(m => ({ default: m.WizardStep1 })));
const WizardStep2 = lazy(() => import('./pages/client/WizardStep2').then(m => ({ default: m.WizardStep2 })));
const WizardStep3 = lazy(() => import('./pages/client/WizardStep3').then(m => ({ default: m.WizardStep3 })));
const WizardPayment = lazy(() => import('./pages/client/WizardPayment').then(m => ({ default: m.WizardPayment })));

// ── Admin Pages ──
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminDossiers = lazy(() => import('./pages/admin/AdminDossiers').then(m => ({ default: m.AdminDossiers })));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminEmails = lazy(() => import('./pages/admin/AdminEmails').then(m => ({ default: m.AdminEmails })));
const AdminFaq = lazy(() => import('./pages/admin/AdminFaq').then(m => ({ default: m.AdminFaq })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminStatistics = lazy(() => import('./pages/admin/AdminStatistics').then(m => ({ default: m.AdminStatistics })));
const AdminExports = lazy(() => import('./pages/admin/AdminExports').then(m => ({ default: m.AdminExports })));
const AdminAccount = lazy(() => import('./pages/admin/AdminAccount').then(m => ({ default: m.AdminAccount })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 gradient-primary rounded-xl flex items-center 
        justify-center shadow-lg animate-pulse">
        <div className="w-5 h-5 bg-white/40 rounded" />
      </div>
      <p className="text-sm text-slate-500 font-medium">Chargement...</p>
    </div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const hideHeader = location.pathname.startsWith('/formalite') || 
                     location.pathname.startsWith('/dashboard') || 
                     location.pathname.startsWith('/admin');
  
  return (
    <>
      <CookieBanner />
      {!hideHeader && <Header />}
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── Routes Publiques ── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/tarifs" element={<Tarifs />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgv" element={<CGV />} />
            <Route path="/confidentialite" element={<Confidentialite />} />
          </Route>

          {/* ── Auth ── */}
          <Route path="/auth" element={<Auth />} />

          {/* ── Client — avec sidebar ── */}
          <Route element={<ProtectedRoute requiredRole="client" />}>
            <Route element={<ClientLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/dossiers" element={<DossiersList />} />
              <Route path="/dashboard/dossiers/:id" element={<DossierDetail />} />
              <Route path="/dashboard/documents" element={<ClientDocuments />} />
              <Route path="/dashboard/facturation" element={<ClientPayments />} />
              <Route path="/dashboard/parametres" element={<ClientSettings />} />
              <Route path="/dashboard/confirmation" element={<ConfirmationPage />} />
              <Route path="/dashboard/messages" element={<ClientMessages />} />
            </Route>
          </Route>

          {/* ── Wizard — plein écran ── */}
          <Route element={<ProtectedRoute requiredRole="client" />}>
            <Route element={<WizardLayout />}>
              <Route path="/formalite" element={<WizardStep1 />} />
              <Route path="/formalite/etape-2" element={<WizardStep2 />} />
              <Route path="/formalite/etape-3" element={<WizardStep3 />} />
              <Route path="/formalite/paiement" element={<WizardPayment />} />
            </Route>
          </Route>

          {/* ── Admin ── */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/dossiers" element={<AdminDossiers />} />
              <Route path="/admin/dossiers/:id" element={<AdminDossiers />} />
              <Route path="/admin/produits" element={<AdminProducts />} />
              <Route path="/admin/utilisateurs" element={<AdminUsers />} />
              <Route path="/admin/emails" element={<AdminEmails />} />
              <Route path="/admin/faq" element={<AdminFaq />} />
              <Route path="/admin/parametres" element={<AdminSettings />} />
              <Route path="/admin/statistiques" element={<AdminStatistics />} />
              <Route path="/admin/exports" element={<AdminExports />} />
              <Route path="/admin/account" element={<AdminAccount />} />
            </Route>
          </Route>

        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}
