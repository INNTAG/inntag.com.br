import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { COMPANY, ASSETS } from '../data/content';
import { getCompanyAge } from '@/react-app/utils/companyAge';

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 100);
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="empresa" ref={sectionRef} className="section-content bg-secondary">
      <div className="container-world">
        {/* Header */}
        <div className="max-w-3xl reveal">
          <div className="accent-line mb-6" />
          <span className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
            {COMPANY.about.title}
          </span>
          <h2 className="display-lg mt-4">{COMPANY.about.subtitle}</h2>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 mt-16">
          {/* Text Content */}
          <div className="space-y-8 reveal stagger-1">
            <div className="body-lg whitespace-pre-line">
              {COMPANY.about.description}
            </div>
            
            {/* Mission & Vision */}
            <div className="space-y-6 pt-8 border-t border-border">
              <div>
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-3">
                  Nossa Missão
                </h3>
                <p className="text-lg text-foreground">{COMPANY.about.mission}</p>
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-3">
                  Nossa Visão
                </h3>
                <p className="text-lg text-foreground">{COMPANY.about.vision}</p>
              </div>
            </div>

            <a 
              href="#contato" 
              className="inline-flex items-center gap-2 text-foreground font-semibold group"
            >
              Conheça nossa história completa
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Image */}
          <div className="reveal stagger-2">
            <div className="relative">
              <div className="img-reveal rounded-3xl overflow-hidden aspect-[4/3]">
                <img 
                  src={ASSETS.aboutFacility} 
                  alt="Instalações INNTAG"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-8 -left-8 md:-left-12 bg-foreground text-background 
                p-6 md:p-8 rounded-2xl shadow-2xl max-w-[280px]">
                <div className="text-4xl md:text-5xl font-bold text-accent">{getCompanyAge()}+</div>
                <div className="text-sm text-background/70 mt-2">
                  Anos transformando o setor elétrico brasileiro
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
