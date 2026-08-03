import { useState, useEffect } from 'react';
import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';
import { SEO, schemas } from '@/react-app/components/SEO';
import { ASSETS } from '@/react-app/data/content';
import { useBackgrounds } from '@/react-app/hooks/useBackgrounds';
import { getCompanyAge } from '@/react-app/utils/companyAge';
import { Loader2, Building2, Factory, Zap, Anchor, Leaf, Fuel, Mountain } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  logo_key?: string;
}

interface SEOContent {
  meta_title?: string;
  meta_description?: string;
  intro_text?: string;
}

const SETORES = [
  { name: 'Óleo & Gás', icon: Fuel },
  { name: 'Mineração', icon: Mountain },
  { name: 'Siderurgia', icon: Factory },
  { name: 'Geração de Energia', icon: Zap },
  { name: 'Papel e Celulose', icon: Leaf },
  { name: 'Sucroalcooleiro', icon: Leaf },
  { name: 'Petroquímico', icon: Fuel },
  { name: 'Naval & Offshore', icon: Anchor },
];

// Default SEO content for this page
const DEFAULT_SEO: SEOContent = {
  meta_title: 'Clientes INNTAG | Empresas que Confiam em Nossas Soluções Elétricas',
  meta_description: 'Conheça os clientes INNTAG: mais de 500 empresas dos setores de óleo e gás, mineração, siderurgia e energia confiam em nossos painéis elétricos e soluções industriais.',
  intro_text: `A INNTAG é referência nacional na fabricação de painéis elétricos industriais, atendendo há mais de ${getCompanyAge()} anos empresas líderes nos segmentos mais exigentes do mercado. Nossa carteira de clientes inclui multinacionais e grandes corporações brasileiras dos setores de óleo e gás, mineração, siderurgia, geração de energia, papel e celulose, sucroalcooleiro, petroquímico e naval. Cada projeto entregue reforça nosso compromisso com qualidade, conformidade às normas IEC e NBR, e atendimento técnico especializado.`
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [seoContent, setSeoContent] = useState<SEOContent>(DEFAULT_SEO);
  const { getBackground } = useBackgrounds();
  
  const heroImage = getBackground('clientes', 'hero', ASSETS.heroPortfolio);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const clientsRes = await fetch('/api/public/clients');
        const clientsData = await clientsRes.json();
        setClients(Array.isArray(clientsData) ? clientsData : []);
        
        // Fetch SEO content
        const seoRes = await fetch('/api/public/content/seo_portfolio');
        if (seoRes.ok) {
          const seoData = await seoRes.json();
          if (seoData.value) {
            const parsed = JSON.parse(seoData.value);
            setSeoContent({ ...DEFAULT_SEO, ...parsed });
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Set page title and meta
  useEffect(() => {
    if (seoContent.meta_title) {
      document.title = seoContent.meta_title;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && seoContent.meta_description) {
      metaDesc.setAttribute('content', seoContent.meta_description);
    }
  }, [seoContent]);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={seoContent.meta_title || "Clientes INNTAG"}
        description={seoContent.meta_description || "Conheça os clientes INNTAG: mais de 500 empresas confiam em nossos painéis elétricos."}
        keywords="clientes INNTAG, painéis elétricos industriais, óleo e gás, mineração, siderurgia, energia"
        canonical="/clientes"
        schema={schemas.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Clientes', url: '/clientes' }])}
      />
      <Navigation />
      
      {/* Hero with Background */}
      <section className="relative min-h-[60vh] flex items-end pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Clientes INNTAG"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <p className="text-orange-400 text-sm uppercase tracking-widest font-semibold mb-4">
            Nossos Clientes
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 max-w-4xl">
            Empresas que<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Confiam na INNTAG
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mb-10">
            Há mais de {getCompanyAge()} anos atendemos os principais players dos setores industriais 
            mais exigentes do Brasil e do mundo.
          </p>
          
          <div className="flex gap-12 mt-8">
            <div>
              <p className="text-4xl font-bold text-white">500+</p>
              <p className="text-white/60 text-sm">Clientes Ativos</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">+10</p>
              <p className="text-white/60 text-sm">Países Atendidos</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">8</p>
              <p className="text-white/60 text-sm">Setores Industriais</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Intro Text Section */}
      {seoContent.intro_text && (
        <section className="py-16 bg-neutral-50 border-b border-neutral-200">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-lg text-neutral-700 leading-relaxed text-center">
              {seoContent.intro_text}
            </p>
          </div>
        </section>
      )}

      {/* Client Logos */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-orange-500 text-sm uppercase tracking-widest font-semibold mb-4">
              Parceiros de Confiança
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900">
              Clientes Atendidos
            </h2>
            <p className="text-neutral-500 text-lg mt-4">
              Conheça algumas das empresas que confiam na INNTAG para suas soluções elétricas.
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 rounded-3xl">
              <Building2 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">
                Cadastre clientes no painel administrativo para exibi-los aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {clients.map((cliente) => (
                <div 
                  key={cliente.id}
                  className="aspect-video bg-white border border-neutral-200 rounded-2xl flex items-center justify-center p-8 hover:border-orange-300 hover:shadow-xl transition-all group"
                >
                  {cliente.logo_key ? (
                    <img 
                      src={`/api/files/${cliente.logo_key}`} 
                      alt={cliente.name}
                      className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="text-neutral-500 text-sm text-center font-medium">
                      {cliente.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sectors */}
      <section className="py-24 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-orange-400 text-sm uppercase tracking-widest font-semibold mb-4">
              Setores de Atuação
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Expertise em Diversos Segmentos
            </h2>
            <p className="text-neutral-400 text-lg mt-4">
              Nossa experiência abrange os setores industriais mais críticos e exigentes.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {SETORES.map((setor, index) => {
              const Icon = setor.icon;
              return (
                <div 
                  key={index}
                  className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center hover:bg-white/10 hover:border-orange-500/30 transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500/30 transition-colors">
                    <Icon className="text-orange-400" size={28} />
                  </div>
                  <span className="text-lg font-semibold text-white">{setor.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            <div className="p-4 md:p-8">
              <div className="text-4xl md:text-6xl font-bold text-orange-500">500+</div>
              <div className="text-neutral-600 mt-2 text-sm md:text-base font-medium">Clientes Atendidos</div>
            </div>
            <div className="p-4 md:p-8">
              <div className="text-4xl md:text-6xl font-bold text-orange-500">1.000+</div>
              <div className="text-neutral-600 mt-2 text-sm md:text-base font-medium">Projetos Entregues</div>
            </div>
            <div className="p-4 md:p-8">
              <div className="text-4xl md:text-6xl font-bold text-orange-500">{getCompanyAge()}+</div>
              <div className="text-neutral-600 mt-2 text-sm md:text-base font-medium">Anos de Mercado</div>
            </div>
            <div className="p-4 md:p-8">
              <div className="text-4xl md:text-6xl font-bold text-orange-500">+10</div>
              <div className="text-neutral-600 mt-2 text-sm md:text-base font-medium">Países Atendidos</div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
