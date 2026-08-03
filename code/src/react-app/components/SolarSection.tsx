import { useEffect, useRef } from 'react';
import { Sun, TrendingUp, Shield, Home, CheckCircle2, ArrowRight } from 'lucide-react';
import { SOLAR } from '../data/content';

const benefitIcons = [TrendingUp, Sun, Shield, Home];

export function SolarSection() {
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="solar" ref={sectionRef} className="section-content relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-red-50/30" />
      
      <div className="container-world relative z-10">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto reveal">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
            bg-accent/10 text-accent text-sm font-semibold mb-6">
            <Sun size={18} />
            {SOLAR.accent}
          </div>
          <h2 className="display-xl">{SOLAR.headline}</h2>
          <p className="body-lg mt-8 max-w-3xl mx-auto">
            {SOLAR.description.split('\n\n')[0]}
          </p>
        </div>

        {/* Main Image */}
        <div className="mt-16 reveal stagger-1">
          <div className="img-reveal rounded-[2rem] overflow-hidden aspect-[21/9] shadow-2xl">
            <img 
              src={SOLAR.image} 
              alt="Energia Solar Fotovoltaica"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {SOLAR.benefits.map((benefit, index) => {
            const Icon = benefitIcons[index];
            return (
              <div 
                key={index}
                className={`reveal stagger-${index + 2} card-world p-8 text-center group`}
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto
                  group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                  <Icon size={28} className="text-accent group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mt-6">{benefit.title}</h3>
                <p className="text-muted-foreground mt-3">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        {/* Features & CTA */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mt-24">
          {/* Features List */}
          <div className="reveal stagger-3">
            <h3 className="display-md">Do Projeto à Operação</h3>
            <p className="body-md mt-4">
              Entregamos soluções completas de energia solar, cuidando de cada etapa 
              para garantir máxima eficiência e retorno sobre seu investimento.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {SOLAR.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-foreground text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Card */}
          <div className="reveal stagger-4">
            <div className="bg-foreground text-background rounded-3xl p-10 relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold">Pronto para Economizar?</h3>
                <p className="text-background/70 mt-4 text-lg">
                  Solicite um estudo gratuito de viabilidade para seu projeto 
                  de energia solar e descubra quanto você pode economizar.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <a 
                    href="#contato" 
                    className="btn-world-lg bg-accent text-foreground hover:bg-accent/90 
                      inline-flex justify-center animate-pulse-glow"
                  >
                    Solicitar Estudo Gratuito
                    <ArrowRight size={20} />
                  </a>
                </div>

                <p className="text-sm text-background/50 mt-6">
                  Sem compromisso. Resposta rápida.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
