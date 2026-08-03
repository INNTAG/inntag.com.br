import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ASSETS } from '@/react-app/data/content';

interface TimelineEvent {
  id: number;
  year: number;
  title: string;
  description: string;
  highlight?: string;
  background_image?: string;
  stat1_value?: string;
  stat1_label?: string;
  stat2_value?: string;
  stat2_label?: string;
}

interface TimelinePhoto {
  id: number;
  file_key: string;
  caption?: string;
}

// Fallback data if database is empty
const FALLBACK_EVENTS: TimelineEvent[] = [
  { id: 1, year: 2009, title: 'O Início de Uma Jornada', description: 'Em 16 de março, nasce a INNTAG em Americana/SP.', highlight: 'Fundação', stat1_value: '1', stat1_label: 'Sonho', stat2_value: '∞', stat2_label: 'Determinação' },
  { id: 2, year: 2024, title: 'O Futuro é Agora', description: 'Mais de 1.000 projetos entregues. 17.000+ usuários confiam em nossos sistemas.', highlight: 'Hoje', stat1_value: '1.000+', stat1_label: 'Projetos', stat2_value: '17.000+', stat2_label: 'Usuários' },
];

export function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [eventPhotos, setEventPhotos] = useState<Record<number, TimelinePhoto[]>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxEvent, setLightboxEvent] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/public/timeline');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          // Fetch photos for each event
          data.forEach((event: TimelineEvent) => {
            fetchPhotos(event.id);
          });
        } else {
          setEvents(FALLBACK_EVENTS);
        }
      } catch {
        setEvents(FALLBACK_EVENTS);
      }
    };
    fetchEvents();
  }, []);

  const fetchPhotos = async (eventId: number) => {
    try {
      const res = await fetch(`/api/public/timeline/${eventId}/photos`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEventPhotos(prev => ({ ...prev, [eventId]: data }));
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              setActiveIndex(index);
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [events]);

  const openLightbox = (eventId: number, photoIndex: number) => {
    setLightboxEvent(eventId);
    setLightboxIndex(photoIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxEvent(null);
  };

  const currentPhotos = lightboxEvent ? eventPhotos[lightboxEvent] || [] : [];

  // Default background images
  const defaultImages = [ASSETS.heroMain, ASSETS.project1, ASSETS.project2, ASSETS.project3, ASSETS.project4];

  return (
    <section className="relative bg-neutral-950">
      {/* Progress indicator */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3">
        {events.map((event, index) => (
          <button
            key={event.id}
            onClick={() => {
              sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group flex items-center gap-3"
          >
            <span 
              className={`text-xs font-medium transition-all duration-300 ${
                activeIndex === index 
                  ? 'text-white opacity-100' 
                  : 'text-white/40 opacity-0 group-hover:opacity-100'
              }`}
            >
              {event.year}
            </span>
            <div 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeIndex === index 
                  ? 'bg-red-500 scale-150' 
                  : 'bg-white/30 group-hover:bg-white/60'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Timeline sections */}
      {events.map((event, index) => {
        const photos = eventPhotos[event.id] || [];
        const bgImage = event.background_image || defaultImages[index % defaultImages.length];
        
        return (
          <div
            key={event.id}
            ref={(el) => { sectionRefs.current[index] = el; }}
            className="min-h-screen relative flex items-center overflow-hidden"
          >
            {/* Background image with parallax */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
              style={{ 
                backgroundImage: `url(${bgImage})`,
                transform: `scale(${activeIndex === index ? 1.05 : 1})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-neutral-950/60" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-6 lg:px-16">
              <div className="max-w-3xl">
                {/* Year badge */}
                <div 
                  className={`inline-flex items-center gap-4 mb-8 transition-all duration-700 ${
                    activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  {event.highlight && (
                    <span className="px-4 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-full">
                      {event.highlight}
                    </span>
                  )}
                  <span className="text-red-500 text-7xl lg:text-9xl font-black tracking-tighter">
                    {event.year}
                  </span>
                </div>

                {/* Title */}
                <h2 
                  className={`text-4xl lg:text-6xl font-bold text-white mb-6 transition-all duration-700 delay-100 ${
                    activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  {event.title}
                </h2>

                {/* Description */}
                <p 
                  className={`text-xl lg:text-2xl text-white/70 leading-relaxed mb-12 transition-all duration-700 delay-200 ${
                    activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  {event.description}
                </p>

                {/* Stats */}
                {(event.stat1_value || event.stat2_value) && (
                  <div 
                    className={`flex gap-12 mb-8 transition-all duration-700 delay-300 ${
                      activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  >
                    {event.stat1_value && (
                      <div>
                        <div className="text-4xl lg:text-5xl font-black text-white mb-1">
                          {event.stat1_value}
                        </div>
                        <div className="text-sm text-white/50 uppercase tracking-widest">
                          {event.stat1_label}
                        </div>
                      </div>
                    )}
                    {event.stat2_value && (
                      <div>
                        <div className="text-4xl lg:text-5xl font-black text-white mb-1">
                          {event.stat2_value}
                        </div>
                        <div className="text-sm text-white/50 uppercase tracking-widest">
                          {event.stat2_label}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Photo Gallery */}
                {photos.length > 0 && (
                  <div 
                    className={`transition-all duration-700 delay-400 ${
                      activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  >
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {photos.slice(0, 5).map((photo, pIndex) => (
                        <button
                          key={photo.id}
                          onClick={() => openLightbox(event.id, pIndex)}
                          className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden group"
                        >
                          <img
                            src={photo.file_key}
                            alt={photo.caption || `Foto ${pIndex + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        </button>
                      ))}
                      {photos.length > 5 && (
                        <button
                          onClick={() => openLightbox(event.id, 5)}
                          className="flex-shrink-0 w-24 h-24 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
                        >
                          +{photos.length - 5}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scroll indicator (only on first section) */}
            {index === 0 && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce">
                <span className="text-white/40 text-xs uppercase tracking-widest">Scroll</span>
                <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
              </div>
            )}
          </div>
        );
      })}

      {/* Final CTA section */}
      <div className="min-h-[50vh] relative flex items-center justify-center bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1)_0%,transparent_70%)]" />
        <div className="relative z-10 text-center px-6">
          <h3 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            17+ Anos de Excelência
          </h3>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
            Uma história construída projeto a projeto, cliente a cliente. 
            O próximo capítulo pode ser escrito com você.
          </p>
          <a
            href="/contato"
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-colors"
          >
            Faça Parte Dessa História
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && currentPhotos.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {currentPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev > 0 ? prev - 1 : currentPhotos.length - 1));
                }}
                className="absolute left-6 p-3 text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev < currentPhotos.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-6 p-3 text-white/70 hover:text-white transition-colors"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}

          <div className="max-w-5xl max-h-[85vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentPhotos[lightboxIndex]?.file_key}
              alt={currentPhotos[lightboxIndex]?.caption || 'Foto'}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            {currentPhotos[lightboxIndex]?.caption && (
              <p className="text-white/70 text-center mt-4">
                {currentPhotos[lightboxIndex].caption}
              </p>
            )}
            <div className="text-white/50 text-center mt-2 text-sm">
              {lightboxIndex + 1} / {currentPhotos.length}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
