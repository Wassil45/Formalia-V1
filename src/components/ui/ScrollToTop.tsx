import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop({ containerId }: { containerId?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      const scrollTop = 'scrollTop' in target ? target.scrollTop : window.scrollY;
      setIsVisible(scrollTop > 300);
    };

    const container = containerId ? document.getElementById(containerId) : window;
    
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [containerId]);

  const scrollToTop = () => {
    const container = containerId ? document.getElementById(containerId) : window;
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 p-3 rounded-full gradient-primary text-white shadow-[0_4px_14px_0_rgba(79,142,247,0.39)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(79,142,247,0.23)] hover:-translate-y-1 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90 pointer-events-none'
      }`}
      aria-label="Remonter en haut"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
