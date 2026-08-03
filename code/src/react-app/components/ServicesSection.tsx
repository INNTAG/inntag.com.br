import { useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SERVICES } from '../data/content';

export function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 150);
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
    <section ref={sectionRef} className="section-content">
      <div className="container-world">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto reveal">
          <div className="accent-line mx-auto mb-6" />
          <span className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
            Nossas Soluções
          </span>
          <h2 className="display-lg mt-4">
            Engenharia de Excelência para Cada Desafio
          </h2>
          <p className="body-lg mt-6">
            Oferecemos um portfólio completo de soluções elétricas, desde projetos 
            complexos até manutenção especializada.
          </p>
        </div>

        {/* Services */}
        <div className="mt-20 space-y-32">
          {SERVICES.map((service, index) => (
            <div 
              key={service.id} 
              id={service.id}
              className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center reveal stagger-${index + 1}`}
            >
              {/* Content - alternating sides */}
              <div className={`space-y-8 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                    bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider">
                    {service.accent}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
                    {service.subtitle}
                  </span>
                  <h3 className="display-md mt-2">{service.title}</h3>
                </div>

                <p className="body-md">{service.description}</p>

                <ul className="space-y-3">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a 
                  href="#contato" 
                  className="btn-world-md btn-outline inline-flex"
                >
                  Solicitar Proposta
                </a>
              </div>

              {/* Image */}
              <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className="img-reveal rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl shadow-foreground/10">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
