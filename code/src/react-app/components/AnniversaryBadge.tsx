import { useEffect, useState } from 'react';
import { isAnniversaryDay, getAnniversaryYear } from '@/react-app/utils/companyAge';

/**
 * Corporate anniversary badge - only appears on March 16th
 * Premium, sophisticated design inspired by luxury brands
 */
export function AnniversaryBadge() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const anniversaryYear = getAnniversaryYear();
  
  useEffect(() => {
    // Check if it's anniversary day and user hasn't dismissed
    const isAnniversary = isAnniversaryDay();
    const wasDismissed = sessionStorage.getItem('anniversary-dismissed') === 'true';
    
    if (isAnniversary && !wasDismissed) {
      // Small delay for dramatic entrance
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('anniversary-dismissed', 'true');
  };
  
  if (!show || dismissed) return null;
  
  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={handleDismiss}
      />
      
      {/* Badge Modal - Center */}
      <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 animate-scale-in">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Decorative top gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-900 via-red-600 to-neutral-900" />
          
          {/* Content */}
          <div className="px-10 py-12 text-center">
            {/* Anniversary seal icon */}
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-neutral-100" />
              <div className="relative w-20 h-20 rounded-full border-2 border-neutral-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-neutral-900 leading-none">{anniversaryYear}</div>
                  <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">anos</div>
                </div>
              </div>
              {/* Decorative ring */}
              <svg className="absolute inset-0 w-24 h-24 mx-auto -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="46" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  className="text-neutral-200"
                />
                <circle 
                  cx="50" cy="50" r="46" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeDasharray="289"
                  strokeDashoffset="0"
                  className="text-red-500 animate-draw-circle"
                />
              </svg>
            </div>
            
            {/* Typography */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-red-600 tracking-[0.3em] uppercase">
                Desde 2009
              </p>
              
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {anniversaryYear} Anos de Excelência
              </h2>
              
              <div className="w-12 h-px bg-neutral-300 mx-auto" />
              
              <p className="text-neutral-600 leading-relaxed">
                Celebramos hoje {anniversaryYear} anos de inovação, tecnologia e 
                confiabilidade em soluções elétricas industriais.
              </p>
              
              <p className="text-sm text-neutral-500">
                Obrigado pela confiança de nossos clientes e parceiros.
              </p>
            </div>
            
            {/* Signature */}
            <div className="mt-8 pt-8 border-t border-neutral-100">
              <img 
                src="/api/files/logo-inntag.png"
                alt="INNTAG"
                className="h-6 mx-auto opacity-80"
              />
              <p className="text-[10px] text-neutral-400 mt-3 tracking-wider uppercase">
                Grupo INNTAG • 16 de Março de {new Date().getFullYear()}
              </p>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes draw-circle {
          from { stroke-dashoffset: 289; }
          to { stroke-dashoffset: 0; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .animate-draw-circle {
          animation: draw-circle 1.5s ease-out 0.5s forwards;
          stroke-dashoffset: 289;
        }
      `}</style>
    </>
  );
}
