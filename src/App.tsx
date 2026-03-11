import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout';
import { ClientLayout } from './components/layout/ClientLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { CookieBanner } from './components/ui/CookieBanner';

import { ErrorBoundary } from './components/ErrorBoundary';

// Public Pages
const Home = lazy(() => import('./pages/public/Home').then(module => ({ default: module.Home })));
const Services = lazy(() => import('./pages/public/Services').then(module => ({ default: module.Services })));
const Tarifs = lazy(() => import('./pages/public/Tarifs').then(module => ({ default: module.Tarifs })));
const Auth = lazy(() => import('./pages/public/Auth').then(module => ({ default: module.Auth })));
const MentionsLegales = lazy(() => import('./pages/public/MentionsLegales').then(module => ({ default: module.MentionsLegales })));
const CGV = lazy(() => import('./pages/public/CGV').then(module => ({ default: module.CGV })));
const Confidentialite = lazy(() => import('./pages/public/Confidentialite').then(module => ({ default: module.Confidentialite })));

// Client Pages
const Dashboard = lazy(() => import('./pages/client/Dashboard').then(module => ({ default: module.Dashboard })));
const WizardStep2 = lazy(() => import('./pages/client/WizardStep2').then(module => ({ default: module.WizardStep2 })));
const WizardStep3 = lazy(() => import('./pages/client/WizardStep3').then(module => ({ default: module.WizardStep3 })));
const WizardPayment = lazy(() => import('./pages/client/WizardPayment').then(module => ({ default: module.WizardPayment })));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then(module => ({ default: module.AdminProducts })));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 bg-primary/20 rounded-xl"></div>
      <div className="h-4 w-32 bg-slate-200 rounded"></div>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <CookieBanner />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/tarifs" element={<Tarifs />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgv" element={<CGV />} />
            <Route path="/confidentialite" element={<Confidentialite />} />
          </Route>
          
          {/* Auth Route (no header) */}
          <Route path="/auth" element={<Auth />} />

          {/* Client Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="client" />}>
            <Route element={<ClientLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/formalite/etape-2" element={<WizardStep2 />} />
              <Route path="/formalite/etape-3" element={<WizardStep3 />} />
              <Route path="/formalite/paiement" element={<WizardPayment />} />
            </Route>
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/produits" element={<AdminProducts />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
    </ErrorBoundary>
  );
}
