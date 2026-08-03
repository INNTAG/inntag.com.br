import { useEffect, useRef } from 'react';
import { PROJECTS } from '../data/content';

export function ProjectsSection() {
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
    <section id="projetos" ref={sectionRef} className="section-content bg-foreground text-background">
      <div className="container-world">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto reveal">
          <div className="w-16 h-1 bg-accent rounded-full mx-auto mb-6" />
          <span className="text-sm uppercase tracking-widest text-background/50 font-medium">
            {PROJECTS.subtitle}
          </span>
          <h2 className="display-lg mt-4 text-background">{PROJECTS.title}</h2>
          <p className="text-xl text-background/60 mt-6">
            Conheça alguns dos projetos que demonstram nossa capacidade de 
            entregar soluções de alta complexidade.
          </p>
        </div>

        {/* Projects Grid - Bento style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
          {PROJECTS.items.map((project, index) => (
            <div 
              key={index}
              className={`reveal stagger-${index + 1} group relative overflow-hidden rounded-2xl
                ${index === 0 ? 'lg:col-span-2 lg:row-span-2' : 'aspect-square'}
                ${index === 0 ? 'aspect-square lg:aspect-auto' : ''}`}
            >
              <img 
                src={project.image} 
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent 
                opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <span className="text-xs uppercase tracking-wider text-accent font-medium">
                  {project.category}
                </span>
                <h3 className="text-xl font-semibold text-white mt-2">{project.title}</h3>
                <p className="text-sm text-white/60 mt-1">{project.location}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 reveal stagger-5">
          <a 
            href="#contato" 
            className="btn-world-lg bg-white text-foreground hover:bg-white/90 inline-flex"
          >
            Ver Todos os Projetos
          </a>
        </div>
      </div>
    </section>
  );
}
