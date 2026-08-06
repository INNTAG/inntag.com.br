import { Link } from 'react-router';
import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';
import { AnniversaryBadge } from '@/react-app/components/AnniversaryBadge';
import { SEO, schemas } from '@/react-app/components/SEO';
import { UnifilarDiagram } from '@/react-app/components/UnifilarDiagram';
import { ASSETS, COMPANY } from '@/react-app/data/content';
import { getCompanyAge } from '@/react-app/utils/companyAge';
import { useLanguage } from '@/react-app/contexts/LanguageContext';
import { useBackgrounds } from '@/react-app/hooks/useBackgrounds';
import { ArrowRight, ArrowUpRight, Shield, Clock, Award, Wrench } from 'lucide-react';
import { useEffect, useRef } from 'react';

// Intersection observer hook for reveal animations
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    if (ref.current) {
      ref.current.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
    }
    return () => observer.disconnect();
  }, []);
  return ref;
}
export default function Home() {
  const revealRef = useReveal();
  const {
    t,
    language
  } = useLanguage();
  const {
    getBackground
  } = useBackgrounds();
  const companyAge = getCompanyAge();

  // Dynamic backgrounds from database
  const heroImage = getBackground('home', 'hero', ASSETS.heroMain);
  const qualityImage = getBackground('home', 'quality', ASSETS.ccmPanelBg);

  // SEO schemas
  const homeSchemas = [schemas.organization(), schemas.localBusiness()];
  const icons = [Shield, Clock, Award, Wrench];

  // Translated stats
  const translatedStats = [{
    value: `${companyAge}+`,
    label: t('stats.years')
  }, {
    value: '1.000+',
    label: t('stats.projects')
  }, {
    value: '500+',
    label: t('stats.clients')
  }, {
    value: '+10',
    label: t('stats.countries')
  }];
  return <div ref={revealRef} className="min-h-screen bg-[#fafafa]">
      <SEO canonical="/" schema={homeSchemas} />
      <Navigation />
      
      {/* Hero - Cinematic Full-screen */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Video-style Background */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover scale-105" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>

        {/* Hero Content - Left Aligned */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-8 md:px-12 lg:px-20 pb-48 md:pb-32">
          <div className="max-w-3xl">
            {/* Accent Tag */}
            <div className="inline-flex items-center gap-3 mb-8 hero-reveal" style={{ animationDelay: '0ms' }}>
              <div className="w-8 h-px bg-red-500" />
              <span className="text-red-400 text-sm font-medium tracking-[0.15em] uppercase">
                Grupo INNTAG
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-reveal" style={{ animationDelay: '100ms' }}>
              <span className="block text-[clamp(2.5rem,6vw,5rem)] font-bold text-white leading-[1.05] tracking-[-0.02em]">
                {language === 'pt' ? 'Engenharia Elétrica' : t('hero.title').split(' ').slice(0, -2).join(' ')}
              </span>
              <span className="block text-[clamp(2.5rem,6vw,5rem)] font-bold text-white leading-[1.05] tracking-[-0.02em] mt-2">
                {language === 'pt' ? 'de Alta Performance' : t('hero.title').split(' ').slice(-2).join(' ')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-white text-lg md:text-xl max-w-xl mt-8 leading-relaxed hero-reveal" style={{ animationDelay: '200ms' }}>
              {t('hero.subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mt-12 hero-reveal" style={{ animationDelay: '300ms' }}>
              <Link to="/contato" className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300">
                {t('hero.cta')}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/portfolio" className="group inline-flex items-center justify-center gap-3 text-white px-8 py-4 rounded-full font-medium border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300">
                {t('hero.ctaSecondary')}
                <ArrowUpRight size={18} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Bar - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/30 backdrop-blur-sm">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 py-6 md:py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 md:gap-8 md:gap-12">
              {translatedStats.map((stat, i) => <div key={i} className="hero-reveal" style={{
              animationDelay: `${400 + i * 100}ms`
            }}>
                  <div className="text-2xl md:text-4xl font-bold text-white tracking-tight">{stat.value}</div>
                  <div className="text-white/80 text-xs md:text-sm mt-1 font-medium">{stat.label}</div>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Diagrama Unifilar Section */}
      <section className="relative py-16 md:py-24 bg-neutral-950 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{
        backgroundImage: 'url(/api/files/lp-hero-panels.png)'
      }} />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative max-w-[1600px] mx-auto px-4 md:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12 reveal-item opacity-0 translate-y-8 transition-all duration-700">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-red-500" />
              <span className="text-red-500 text-sm font-semibold tracking-[0.2em] uppercase">Sistema Elétrico</span>
              <div className="w-8 h-px bg-red-500" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">Sua Indústria, Nossos Produtos e Servicos</h2>
            <p className="text-neutral-400 text-lg mt-4 max-w-2xl mx-auto">
              Clique nos elementos para conhecer nossos produtos e soluções
            </p>
          </div>
          
          {/* Diagram */}
          <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <UnifilarDiagram className="w-full h-[500px] md:h-[600px] lg:h-[700px]" />
          </div>
          

        </div>
      </section>

      {/* Differentiators - Light Premium */}
      <section className="relative py-28 md:py-36 bg-neutral-100 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative max-w-[1400px] mx-auto px-8 md:px-12 lg:px-20">
          {/* Section Header */}
          <div className="text-center mb-20 reveal-item opacity-0 translate-y-8 transition-all duration-700">
            <p className="text-red-600 text-sm font-semibold tracking-[0.3em] uppercase mb-4">{language === 'pt' ? 'Diferenciais' : 'Why Choose Us'}</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight">
              {t('differentiators.title')}
            </h2>
          </div>
          
          {/* Differentiators Grid - Bento Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPANY.differentiators.map((item, i) => {
            const Icon = icons[i];
            return <div key={i} className="group reveal-item opacity-0 translate-y-8 transition-all duration-700 relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-neutral-200" style={{
              transitionDelay: `${i * 100}ms`
            }}>
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <Icon className="text-white" size={26} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl md:text-2xl font-bold text-neutral-900 leading-tight">
                      {item.value}
                    </h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>
                  
                  {/* Label Tag */}
                  <div className="mt-6 pt-4 border-t border-neutral-100">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-red-600">{item.label}</span>
                    </span>
                  </div>
                </div>;
          })}
          </div>
          
          {/* Bottom Accent Line */}
          <div className="mt-16 flex justify-center reveal-item opacity-0 translate-y-4 transition-all duration-700 delay-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-red-500" />
              <span className="text-neutral-600 text-sm font-medium">
                {language === 'pt' ? `Compromisso com excelência desde 2009` : language === 'en' ? `Commitment to excellence since 2009` : language === 'es' ? `Compromiso con la excelencia desde 2009` : language === 'it' ? `Impegno per l'eccellenza dal 2009` : `Engagement envers l'excellence depuis 2009`}
              </span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-red-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Política de Qualidade - Red with CCM Background */}
      <section className="relative py-32 md:py-40 overflow-hidden">
        {/* CCM Background Image with Red Overlay */}
        <div className="absolute inset-0">
          <img src={qualityImage} alt="" className="w-full h-full object-cover scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-red-600/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-red-700/50 via-transparent to-red-700/30" />
        </div>
        
        <div className="relative max-w-[1400px] mx-auto px-8 md:px-12 lg:px-20">
          {/* Header */}
          <div className="text-center mb-20 reveal-item opacity-0 translate-y-8 transition-all duration-700">
            <span className="text-white/80 text-xs font-medium tracking-[0.2em] uppercase mb-6 block">Política da Qualidade</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Compromisso com a Excelência
            </h2>
          </div>

          {/* Main Content */}
          <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-10 md:p-14">
              {/* White accent corner */}
              <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden rounded-tl-3xl">
                <div className="absolute top-0 left-0 w-1 h-16 bg-white" />
                <div className="absolute top-0 left-0 h-1 w-16 bg-white" />
              </div>
              
              <div className="max-w-4xl mx-auto">
                <p className="text-white text-xl md:text-2xl leading-relaxed font-light mb-10">
                  Através do comprometimento da direção e de seus colaboradores, o grupo INNTAG busca:
                </p>
                
                {/* Pillars Grid */}
                <div className="grid md:grid-cols-2 gap-5">
                  {[{
                  icon: '01',
                  title: 'Satisfação do Cliente',
                  desc: 'Respeitar os compromissos assumidos, visando sempre à satisfação de nossos clientes'
                }, {
                  icon: '02',
                  title: 'Melhoria Contínua',
                  desc: 'Promover a melhoria contínua do sistema de gestão da qualidade, produtos, processos e serviços'
                }, {
                  icon: '03',
                  title: 'Desenvolvimento Humano',
                  desc: 'Desenvolver, qualificar e conscientizar colaboradores em um ambiente de trabalho saudável e seguro'
                }, {
                  icon: '04',
                  title: 'Conformidade',
                  desc: 'Atender aos requisitos do sistema de gestão implantado e normas aplicáveis'
                }].map((item, i) => <div key={i} className="group flex gap-5 p-6 rounded-2xl bg-white/10 border border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300">
                      <div className="flex-shrink-0">
                        <span className="block text-3xl font-bold text-white">{item.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                        <p className="text-white/80 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Cards */}
          <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-200 mt-8">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="group p-8 rounded-2xl bg-white/10 border border-white/20 hover:border-white/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold text-lg mb-3">Comunicação Interna</h4>
                <p className="text-white/80 text-sm leading-relaxed">
                  Divulgação através dos quadros de comunicação interna, colocados em pontos estratégicos da organização.
                </p>
              </div>
              
              <div className="group p-8 rounded-2xl bg-white/10 border border-white/20 hover:border-white/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold text-lg mb-3">Verificação Contínua</h4>
                <p className="text-white/80 text-sm leading-relaxed">
                  Treinamento de integração e revisão com colaboradores, verificado através das Auditorias internas da qualidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products - Premium Bento Grid */}
      <section className="py-16 md:py-28 lg:py-36 bg-[#0a0a0a] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-5 md:px-12 lg:px-20">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8 mb-10 md:mb-20">
            <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700">
              <div className="inline-flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-6 md:w-8 h-px bg-red-500" />
                <span className="text-red-500 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase">Produtos</span>
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] md:leading-[0.95]">
                Soluções que<br />
                <span className="bg-gradient-to-r from-neutral-400 to-neutral-600 bg-clip-text text-transparent">Definem Padrões</span>
              </h2>
            </div>
            <Link to="/produtos" className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-100 inline-flex items-center gap-2 md:gap-3 text-white text-sm md:text-base px-5 md:px-6 py-2.5 md:py-3 rounded-full border border-white/20 hover:bg-white hover:text-black font-medium transition-all group self-start md:self-auto">
              Ver catálogo completo
              <ArrowRight size={14} className="md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Premium Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
            {/* Featured - CCM */}
            <Link to="/produtos/ccm" className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-150 md:col-span-12 lg:col-span-8 group relative h-[280px] md:h-[400px] lg:h-[480px] rounded-2xl md:rounded-[2rem] overflow-hidden">
              <img src={ASSETS.panelsTech} alt="CCM" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 p-5 md:p-10 lg:p-12 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center gap-1.5 md:gap-2 bg-red-500 text-white text-[10px] md:text-xs font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-full">
                    <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-white rounded-full animate-pulse" />
                    Destaque
                  </span>
                  <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <ArrowUpRight className="text-white" size={16} />
                  </div>
                </div>
                
                <div>
                  <p className="text-red-400 text-xs md:text-sm font-semibold tracking-wider uppercase mb-2 md:mb-3">Painéis Elétricos</p>
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4 leading-tight">
                    CCM & Centros de<br className="hidden md:block" />Controle de Motores
                  </h3>
                  <p className="text-white/90 text-sm md:text-lg max-w-lg leading-relaxed hidden md:block">
                    Projetados para máxima confiabilidade em operações industriais críticas.
                  </p>
                </div>
              </div>
            </Link>

            {/* Proteção */}
            <Link to="/produtos/protecao" className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-200 md:col-span-6 lg:col-span-4 group relative h-[200px] md:h-[400px] lg:h-[480px] rounded-2xl md:rounded-[2rem] overflow-hidden bg-gradient-to-br from-neutral-900 to-[#0a0a0a] border border-white/10">
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-red-500/10 rounded-full blur-[60px] md:blur-[80px] group-hover:bg-red-500/20 transition-all duration-500" />
              
              <div className="relative h-full p-5 md:p-8 lg:p-10 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-between gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-xl md:rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/20 flex items-center justify-center">
                  <Shield className="text-red-500" size={22} />
                </div>
                
                <div className="flex-1 md:flex-none">
                  <p className="text-neutral-500 text-xs md:text-sm font-medium uppercase tracking-wider mb-1 md:mb-3">Sistemas de</p>
                  <h3 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-4">Proteção</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-0 md:mb-6 hidden md:block">
                    Relés digitais com protocolo IEC 61850 para proteção avançada.
                  </p>
                  <div className="inline-flex items-center gap-2 text-red-500 text-sm md:text-base font-medium group-hover:gap-3 transition-all">
                    Explorar <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Excitação */}
            <Link to="/produtos/excitacao" className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-250 md:col-span-6 lg:col-span-6 group relative h-[160px] md:h-[280px] lg:h-[320px] rounded-2xl md:rounded-[2rem] overflow-hidden bg-gradient-to-br from-neutral-900 to-[#0a0a0a] border border-white/10">
              <div className="absolute inset-0 p-5 md:p-8 lg:p-10 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-between gap-4">
                <div className="flex md:flex-row items-center md:items-start justify-between md:w-full gap-4">
                  <div className="w-11 h-11 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl bg-neutral-800 flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-7 md:h-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <ArrowUpRight className="text-neutral-600 group-hover:text-white transition-colors hidden md:block" size={24} />
                </div>
                
                <div className="flex-1 md:flex-none">
                  <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-white mb-1 md:mb-2">Sistemas de Excitação</h3>
                  <p className="text-neutral-500 text-sm">Regulação de tensão para geradores síncronos</p>
                </div>
                
                <ArrowUpRight className="text-neutral-600 group-hover:text-white transition-colors md:hidden shrink-0" size={20} />
              </div>
            </Link>

            {/* Cubículos */}
            <Link to="/produtos/cubiculos" className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-300 md:col-span-12 lg:col-span-6 group relative h-[180px] md:h-[280px] lg:h-[320px] rounded-2xl md:rounded-[2rem] overflow-hidden">
              <img src={ASSETS.cubiculosMT} alt="Cubículos" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              
              <div className="absolute inset-0 p-5 md:p-8 lg:p-10 flex flex-col justify-between">
                <div className="self-end">
                  <ArrowUpRight className="text-white/60 group-hover:text-white transition-colors" size={20} />
                </div>
                
                <div>
                  <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-white mb-1 md:mb-2">Cubículos de Média Tensão</h3>
                  <p className="text-neutral-300 text-sm">Soluções compactas para distribuição de energia</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Services - Cinematic Split */}
      <section className="relative bg-neutral-100 overflow-hidden">
        <div className="grid lg:grid-cols-2">
          {/* Image Side - Full Bleed */}
          <div className="relative h-[600px] lg:h-auto overflow-hidden">
            <img src={getBackground('servicos', 'hero', ASSETS.servicesMaintenance)} alt="Field Service INNTAG" className="w-full h-full object-cover scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:hidden" />
            
            {/* Floating Stats Card */}
            <div className="absolute bottom-8 left-8 lg:bottom-16 lg:left-16 right-8 lg:right-auto">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl max-w-xs">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">+17</span>
                  <span className="text-2xl font-bold text-neutral-900">anos</span>
                </div>
                <p className="text-neutral-600 font-medium">Experiência em Campo</p>
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-neutral-600">Verifique disponibilidade para atendimento</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="py-20 lg:py-32 px-8 md:px-12 lg:px-16 xl:px-24">
            <div className="max-w-xl">
              <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700">
                <div className="inline-flex items-center gap-3 mb-8">
                  <div className="w-10 h-px bg-red-500" />
                  <span className="text-red-600 text-sm font-bold tracking-[0.2em] uppercase">Serviços</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-8">
                  Field Service<br />
                  <span className="text-neutral-400">Especializado</span>
                </h2>
                
                <p className="text-neutral-600 text-lg md:text-xl leading-relaxed mb-12">
                  Equipe técnica altamente qualificada para manutenção, comissionamento e suporte em campo com atuação nacional.
                </p>
              </div>

              {/* Services List - Premium Style */}
              <div className="space-y-4 mb-12">
                {[{
                title: 'Manutenção Preventiva e Corretiva',
                desc: 'Programas personalizados'
              }, {
                title: 'Revisão de Entresafra',
                desc: 'Paradas programadas'
              }, {
                title: 'Comissionamento de Subestações',
                desc: 'Startup completo'
              }, {
                title: 'Atendimento Emergencial',
                desc: 'Resposta rápida'
              }].map((item, i) => <div key={i} className="reveal-item opacity-0 translate-x-4 transition-all duration-500 group flex items-center gap-5 p-5 rounded-2xl bg-white border border-neutral-200 hover:border-red-200 hover:shadow-lg transition-all cursor-pointer" style={{
                transitionDelay: `${200 + i * 100}ms`
              }}>
                    <div className="flex-shrink-0 w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 group-hover:scale-125 transition-transform" />
                    <div className="flex-1">
                      <span className="text-neutral-900 font-semibold block">{item.title}</span>
                      <span className="text-neutral-500 text-sm">{item.desc}</span>
                    </div>
                    <ArrowRight size={18} className="text-neutral-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                  </div>)}
              </div>

              <Link to="/servicos" className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-500 group inline-flex items-center gap-3 bg-neutral-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-500 transition-colors">
                Conhecer Serviços
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Machines - Industrial Power */}
      <section className="py-24 md:py-32 bg-neutral-950 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 lg:px-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="order-2 lg:order-1">
              <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-8 h-px bg-red-500" />
                  <span className="text-red-500 text-sm font-semibold tracking-[0.15em] uppercase">Máquinas Rotativas</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-6">
                  Potência para<br />
                  <span className="text-neutral-500">Operações Críticas</span>
                </h2>
                
                <p className="text-neutral-400 text-lg leading-relaxed mb-10">
                  Mais de uma década de expertise em máquinas elétricas rotativas para os setores mais exigentes. 
                  Atendemos indústrias pesadas, plataformas offshore, plantas de geração e instalações portuárias.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {[{
                value: '+10',
                label: 'Anos de Expertise'
              }, {
                value: '500+',
                label: 'Máquinas Atendidas'
              }, {
                value: '100%',
                label: 'Equipe Certificada'
              }, {
                value: 'Offshore',
                label: 'Atuação Especializada'
              }].map((stat, i) => <div key={i} className="reveal-item opacity-0 translate-y-4 transition-all duration-500 p-5 rounded-2xl bg-white/5 border border-white/10" style={{
                transitionDelay: `${200 + i * 100}ms`
              }}>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-neutral-500 text-sm mt-1">{stat.label}</div>
                  </div>)}
              </div>

              <div className="space-y-3 mb-10">
                {['Motores e geradores de grande porte', 'Manutenção especializada offshore', 'Rebobinagem industrial', 'Balanceamento dinâmico'].map((item, i) => <div key={i} className="reveal-item opacity-0 translate-x-4 transition-all duration-500 flex items-center gap-4" style={{
                transitionDelay: `${400 + i * 100}ms`
              }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-white font-medium">{item}</span>
                  </div>)}
              </div>

              <Link to="/maquinas" className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-700 group inline-flex items-center gap-3 bg-white text-neutral-900 px-8 py-4 rounded-full font-semibold hover:bg-red-500 hover:text-white transition-all">
                Ver Máquinas
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Image */}
            <div className="order-1 lg:order-2 reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-100">
              <div className="relative">
                <div className="aspect-[4/3] rounded-3xl overflow-hidden">
                  <img src={getBackground('maquinas', 'hero', ASSETS.machinesIndustrial)} alt="Máquinas Rotativas INNTAG" className="w-full h-full object-cover" loading="lazy" />
                </div>
                {/* Accent Badge */}
                <div className="absolute -bottom-6 -left-6 bg-red-500 rounded-2xl p-6 shadow-2xl">
                  <div className="text-4xl font-bold text-white">+10</div>
                  <div className="text-white/80 text-sm mt-1">Anos de Expertise</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Trust */}
      <section className="py-24 md:py-32 bg-neutral-100">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 lg:px-20">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Image */}
            <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700 relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden">
                <img src={ASSETS.cubiculosMT} alt="Cubículos de Média Tensão INNTAG" className="w-full h-full object-cover" loading="lazy" />
              </div>
              {/* Decorative Element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-red-500 rounded-2xl -z-10" />
            </div>
            
            {/* Content */}
            <div>
              <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-100">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-8 h-px bg-red-500" />
                  <span className="text-red-600 text-sm font-semibold tracking-[0.15em] uppercase">Por que INNTAG</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight leading-tight mb-6">
                  {getCompanyAge()} Anos de<br />
                  <span className="text-neutral-400">Excelência Técnica</span>
                </h2>
                
                <p className="text-neutral-600 text-lg leading-relaxed mb-10">
                  Quando cada hora de parada custa caro, você precisa de um parceiro que entrega. 
                  Engenharia própria, certificações internacionais e suporte técnico dedicado.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {COMPANY.differentiators.map((item, i) => <div key={i} className="reveal-item opacity-0 translate-y-4 transition-all duration-500 p-5 rounded-2xl bg-white border border-neutral-200" style={{
                transitionDelay: `${200 + i * 100}ms`
              }}>
                    <div className="text-xl font-bold text-neutral-900">{item.value}</div>
                    <div className="text-neutral-500 text-sm mt-1">{item.subtitle}</div>
                  </div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destaques Section */}
      <section className="py-24 md:py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700 text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-red-500" />
              <span className="text-red-600 text-sm font-semibold tracking-[0.15em] uppercase">Destaques</span>
              <div className="w-8 h-px bg-red-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight">
              Notícias e Artigos
            </h2>
            <p className="text-neutral-600 text-lg mt-4 max-w-2xl mx-auto">
              Acompanhe as últimas novidades, cases de sucesso e artigos técnicos do setor elétrico.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-12">
            {['Todos', 'Notícias', 'Artigos', 'Cases'].map((tab, i) => <button key={tab} className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all ${i === 0 ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'}`}>
                {tab}
              </button>)}
          </div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Featured Article */}
            <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-100 md:col-span-2 lg:col-span-2 group">
              <div className="relative h-[400px] rounded-3xl overflow-hidden bg-neutral-900">
                <img src={ASSETS.heroMain} alt="Destaque" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 w-fit">
                    Destaque
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    INNTAG expande operações para mercado internacional
                  </h3>
                  <p className="text-white text-lg max-w-xl">
                    Nova unidade de negócios atenderá clientes em mais de 10 países da América Latina.
                  </p>
                </div>
              </div>
            </div>

            {/* Side Articles */}
            <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700 delay-200 flex flex-col gap-6">
              <article className="group flex-1 bg-white rounded-2xl p-6 border border-neutral-200 hover:border-red-200 hover:shadow-lg transition-all">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Artigo Técnico</span>
                <h4 className="text-lg font-bold text-neutral-900 mt-3 mb-2 group-hover:text-red-600 transition-colors">
                  Eficiência energética em sistemas de excitação
                </h4>
                <p className="text-neutral-500 text-sm line-clamp-2">
                  Como otimizar o consumo de energia em geradores síncronos industriais.
                </p>
              </article>
              
              <article className="group flex-1 bg-white rounded-2xl p-6 border border-neutral-200 hover:border-red-200 hover:shadow-lg transition-all">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Case de Sucesso</span>
                <h4 className="text-lg font-bold text-neutral-900 mt-3 mb-2 group-hover:text-red-600 transition-colors">
                  Modernização de subestação em usina termelétrica
                </h4>
                <p className="text-neutral-500 text-sm line-clamp-2">
                  Projeto executado em tempo recorde durante parada programada.
                </p>
              </article>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/destaques" className="inline-flex items-center gap-2 text-neutral-900 font-semibold hover:text-red-600 transition-colors">
              Ver todos os destaques
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA - Full Width */}
      <section className="relative py-32 md:py-40 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-neutral-950">
          <div className="absolute inset-0 opacity-30">
            <img src={heroImage} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/50 via-neutral-950/80 to-neutral-950" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-8 text-center">
          <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
              Vamos Desenvolver seu Projeto
            </h2>
            <p className="text-neutral-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Entre em contato com nossa equipe comercial para discutir 
              as necessidades específicas da sua operação.
            </p>
            <Link to="/contato" className="group inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-5 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300">
              Solicitar Proposta Comercial
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Anniversary Badge - Only shows on March 16 */}
      <AnniversaryBadge />
      
      {/* CSS for reveal animations */}
      <style>{`
        .revealed {
          opacity: 1 !important;
          transform: translateY(0) translateX(0) !important;
        }
        /* Hero da 1ª dobra: aparece imediatamente via CSS (não espera o JS), melhora o LCP */
        @keyframes heroReveal {
          from { opacity: 0; transform: translateY(1.5rem); }
          to   { opacity: 1; transform: none; }
        }
        .hero-reveal { opacity: 0; animation: heroReveal .8s cubic-bezier(.2,.7,.2,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .hero-reveal { animation: none; opacity: 1; }
        }
      `}</style>
    </div>;
}