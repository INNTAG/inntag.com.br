import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

interface PageHeroProps {
  badge?: string;
  title: string;
  subtitle: string;
  image: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats?: Array<{ value: string; label: string }>;
}

export function PageHero({ badge, title, subtitle, image, cta, secondaryCta, stats }: PageHeroProps) {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={image} 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="container-world relative z-10 pt-32 pb-20">
        <div className="max-w-3xl">
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent mb-6">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-sm font-semibold tracking-wide">{badge}</span>
            </div>
          )}

          <h1 className="display-lg text-white mb-6">
            {title}
          </h1>

          <p className="text-xl text-white/80 font-light leading-relaxed max-w-2xl mb-8">
            {subtitle}
          </p>

          {(cta || secondaryCta) && (
            <div className="flex flex-wrap gap-4">
              {cta && (
                <Link 
                  to={cta.href}
                  className="btn-world-lg bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/30 group"
                >
                  {cta.label}
                  <ChevronRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              {secondaryCta && (
                <Link 
                  to={secondaryCta.href}
                  className="btn-world-lg bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}

          {stats && stats.length > 0 && (
            <div className="flex flex-wrap gap-8 md:gap-12 mt-12 pt-8 border-t border-white/10">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
