import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { ScrollToTop } from '../ui/ScrollToTop';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-16 md:pt-20">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
