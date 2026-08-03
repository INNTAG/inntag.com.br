import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { COMPANY, ASSETS } from '../data/content';

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="section-hero">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={ASSETS.heroMain}
          alt="INNTAG Industrial"
          className={`w-full h-full object-cover transition-all duration-[2s] ease-out
            ${isLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}
        />
        <div className="absolute inset-0 gradient-hero" />
      </div>

      {/* Content */}
      <div className="container-world relative z-10 text-center text-white">
        {/* Eyebrow */}
        <div 
          className={`transition-all duration-1000 delay-300
            ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
            bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            {COMPANY.tagline}
          </span>
        </div>

        {/* Main Title */}
        <h1 
          className={`display-xl text-white mt-8 max-w-5xl mx-auto transition-all duration-1000 delay-500
            ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          {COMPANY.heroTitle}
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-xl md:text-2xl text-white/70 mt-8 max-w-3xl mx-auto leading-relaxed
            transition-all duration-1000 delay-700
            ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {COMPANY.heroSubtitle}
        </p>

        {/* CTAs */}
        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 mt-12
            transition-all duration-1000 delay-[900ms]
            ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <a href="#contato" className="btn-world-lg bg-white text-foreground hover:bg-white/90 
            shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1 transition-all">
            Solicitar Orçamento
          </a>
          <a href="#empresa" className="btn-world-lg btn-secondary">
            Conhecer a Empresa
          </a>
        </div>

        {/* Stats Row */}
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mt-20 pt-12 border-t border-white/10
            transition-all duration-1000 delay-[1100ms]
            ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {COMPANY.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
              <div className="text-xs md:text-sm uppercase tracking-wider text-white/50 mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div 
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-[1300ms]
          ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      >
        <a 
          href="#empresa" 
          className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors group"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown size={20} className="animate-bounce" />
        </a>
      </div>
    </section>
  );
}
