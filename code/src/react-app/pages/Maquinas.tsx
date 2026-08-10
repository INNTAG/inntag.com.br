import { Link, useParams } from 'react-router';
import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';
import { SEO, schemas } from '@/react-app/components/SEO';
import { ASSETS } from '@/react-app/data/content';
import { useBackgrounds } from '@/react-app/hooks/useBackgrounds';
import { ArrowUpRight, ArrowLeft, CheckCircle2, Zap, Settings, Shield, Gauge, Factory, Anchor } from 'lucide-react';

const MAQUINAS = [
  {
    slug: 'motores-industriais',
    title: 'Motores Industriais',
    subtitle: 'Motores de grande porte',
    shortDesc: 'Manutenção e reparo de motores elétricos de média e alta tensão para aplicações industriais críticas.',
    description: 'Especialistas em motores elétricos de grande porte para indústrias pesadas. Realizamos manutenção preventiva, corretiva, rebobinagem e modernização de motores de média e alta tensão, garantindo máxima eficiência e disponibilidade operacional.',
    image: ASSETS.machinesIndustrial,
    features: [
      'Motores de média tensão (até 13.8kV)',
      'Motores de alta tensão (acima de 13.8kV)',
      'Rebobinagem com materiais classe H',
      'Balanceamento dinâmico de precisão',
      'Testes de desempenho e eficiência',
      'Análise de vibração e termografia',
    ],
    benefits: [
      { icon: Gauge, title: 'Eficiência', desc: 'Recuperação máxima de eficiência original' },
      { icon: Shield, title: 'Garantia', desc: '24 meses de garantia em rebobinagens' },
      { icon: Settings, title: 'Precisão', desc: 'Equipamentos de última geração' },
    ],
    specs: [
      { label: 'Potência', value: 'Até 50.000 HP' },
      { label: 'Tensão', value: 'Até 13.8kV' },
      { label: 'Rotação', value: '300 a 3.600 RPM' },
    ],
  },
  {
    slug: 'geradores',
    title: 'Geradores',
    subtitle: 'Geradores síncronos e assíncronos',
    shortDesc: 'Manutenção especializada em geradores para usinas termelétricas, hidrelétricas e plantas industriais.',
    description: 'Expertise em geradores síncronos de grande porte para plantas de geração de energia. Nossa equipe atua em usinas termelétricas, hidrelétricas, PCHs e plantas industriais com cogeração, oferecendo serviços de manutenção, reparo e modernização.',
    image: ASSETS.substation,
    features: [
      'Geradores síncronos de grande porte',
      'Sistemas de excitação estática e rotativa',
      'Substituição de enrolamentos estatóricos',
      'Reparo de polos e enrolamentos de campo',
      'Modernização de sistemas de proteção',
      'Comissionamento e testes de performance',
    ],
    benefits: [
      { icon: Zap, title: 'Potência', desc: 'Experiência até 500 MVA' },
      { icon: Shield, title: 'Confiabilidade', desc: 'Redução de falhas em 95%' },
      { icon: Factory, title: 'Experiência', desc: 'Principais usinas do Brasil' },
    ],
    specs: [
      { label: 'Potência', value: 'Até 500 MVA' },
      { label: 'Tensão', value: 'Até 25kV' },
      { label: 'Tipo', value: 'Síncronos e Assíncronos' },
    ],
  },
  {
    slug: 'offshore',
    title: 'Offshore & Naval',
    subtitle: 'Máquinas para ambiente marítimo',
    shortDesc: 'Serviços especializados para máquinas elétricas em plataformas offshore e embarcações.',
    description: 'Mais de uma década de experiência em máquinas elétricas rotativas para o setor offshore e naval. Atendemos plataformas de petróleo, FPSOs, navios e estaleiros com serviços especializados que atendem aos rigorosos padrões do setor.',
    image: ASSETS.machinesIndustrial,
    features: [
      'Motores de propulsão naval',
      'Geradores de bordo e emergência',
      'Thruster motors e bow thrusters',
      'Motores para bombas e compressores',
      'Certificação DNV, ABS e Lloyd\'s',
      'Atendimento embarcado e em dique',
    ],
    benefits: [
      { icon: Anchor, title: 'Experiência', desc: '10+ anos no setor offshore' },
      { icon: Shield, title: 'Certificação', desc: 'DNV, ABS, Lloyd\'s, BV' },
      { icon: Settings, title: 'Mobilidade', desc: 'Equipe para atendimento embarcado' },
    ],
    specs: [
      { label: 'Certificações', value: 'DNV, ABS, Lloyd\'s' },
      { label: 'Atendimento', value: 'Embarcado ou em dique' },
      { label: 'Prazo', value: 'Mobilização em 48h' },
    ],
  },
  {
    slug: 'rebobinagem',
    title: 'Rebobinagem Industrial',
    subtitle: 'Reparo de enrolamentos',
    shortDesc: 'Centro de rebobinagem equipado para motores e geradores de qualquer porte e especificação.',
    description: 'Centro de rebobinagem industrial com capacidade para atender máquinas de qualquer porte. Utilizamos materiais de primeira linha e processos controlados que garantem a qualidade e durabilidade dos enrolamentos, com garantia estendida.',
    image: ASSETS.panelsTech,
    features: [
      'Rebobinagem de estatores e rotores',
      'Isolamento classe F e H',
      'Impregnação a vácuo (VPI)',
      'Projeto de enrolamentos otimizados',
      'Recuperação de núcleos magnéticos',
      'Testes dielétricos e de surto',
    ],
    benefits: [
      { icon: Settings, title: 'Qualidade', desc: 'Processo VPI de última geração' },
      { icon: Shield, title: 'Garantia', desc: '24 meses em todos os serviços' },
      { icon: Gauge, title: 'Eficiência', desc: 'Melhoria de até 5% no rendimento' },
    ],
    specs: [
      { label: 'Isolamento', value: 'Classe F e H' },
      { label: 'Processo', value: 'VPI - Vacuum Pressure Impregnation' },
      { label: 'Garantia', value: '24 meses' },
    ],
  },
];

function MaquinaDetail({ maquina }: { maquina: typeof MAQUINAS[0] }) {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={`${maquina.title} | Máquinas Elétricas`}
        description={maquina.description}
        keywords={`${maquina.title.toLowerCase()}, máquinas elétricas, manutenção, reparo, INNTAG, ${maquina.features.slice(0, 3).join(', ').toLowerCase()}`}
        canonical={`/maquinas/${maquina.slug}`}
        image={maquina.image}
        type="service"
        schema={[
          schemas.service(maquina.title, maquina.description, `/maquinas/${maquina.slug}`),
          schemas.breadcrumb([
            { name: 'Home', url: '/' },
            { name: 'Máquinas', url: '/maquinas' },
            { name: maquina.title, url: `/maquinas/${maquina.slug}` }
          ])
        ]}
      />
      <Navigation />
      
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={maquina.image} 
            alt={maquina.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <Link 
            to="/maquinas"
            className="inline-flex items-center gap-2 text-white hover:text-white/80 mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Todas as Máquinas</span>
          </Link>
          
          <p className="text-orange-400 text-sm uppercase tracking-widest font-semibold mb-4">
            {maquina.subtitle}
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            {maquina.title}
          </h1>
          <p className="text-xl text-white max-w-2xl">
            {maquina.description}
          </p>
        </div>
      </section>
      
      {/* Specs Bar */}
      <section className="bg-neutral-900 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {maquina.specs.map((spec, i) => (
              <div key={i} className="text-center">
                <p className="text-orange-400 text-sm uppercase tracking-wider mb-1">{spec.label}</p>
                <p className="text-white text-xl font-bold">{spec.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-orange-500 text-sm uppercase tracking-widest font-semibold mb-4">
                Capacidades Técnicas
              </p>
              <h2 className="text-4xl font-bold text-neutral-900 mb-8">
                Escopo de Serviços
              </h2>
              
              <div className="space-y-4">
                {maquina.features.map((feature, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-4 p-4 bg-white rounded-xl border border-neutral-200"
                  >
                    <CheckCircle2 className="text-orange-500 mt-0.5 flex-shrink-0" size={20} />
                    <span className="text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-neutral-900 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-8">Diferenciais</h3>
              
              <div className="space-y-6">
                {maquina.benefits.map((benefit, i) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="text-orange-400" size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{benefit.title}</h4>
                        <p className="text-white">{benefit.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-10 pt-8 border-t border-white/10">
                <p className="text-white mb-4">Solicite um orçamento</p>
                <Link 
                  to="/contato"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                >
                  Falar com Especialista
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-24 bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Máquina parada?
          </h2>
          <p className="text-xl text-white mb-10">
            Nossa equipe pode fazer diagnóstico remoto ou presencial com mobilização rápida.
          </p>
          <Link 
            to="/contato"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors"
          >
            Contato Emergencial
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}

export default function MaquinasPage() {
  const { slug } = useParams();
  const { getBackground, loading: bgLoading } = useBackgrounds();

  // If a specific machine type is selected
  if (slug) {
    const maquina = MAQUINAS.find(m => m.slug === slug);
    if (!maquina) {
      return (
        <div className="min-h-screen bg-white">
          <Navigation lightBackground />
          <div className="pt-40 pb-20 text-center">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Serviço não encontrado</h1>
            <Link 
              to="/maquinas" 
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Ver Todas as Máquinas
            </Link>
          </div>
          <Footer />
        </div>
      );
    }
    
    return <MaquinaDetail maquina={maquina} />;
  }
  
  // Machines listing page
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Máquinas Elétricas Rotativas"
        description="Manutenção, reparo e modernização de motores industriais, geradores e transformadores de grande porte. Expertise em máquinas de média e alta tensão para indústria, geração de energia e setor offshore."
        keywords="motores industriais, geradores, transformadores, rebobinagem, manutenção de máquinas, motores de alta tensão, máquinas rotativas, INNTAG"
        canonical="/maquinas"
        image={ASSETS.machinesIndustrial}
        type="service"
        schema={[
          schemas.organization(),
          schemas.breadcrumb([
            { name: 'Home', url: '/' },
            { name: 'Máquinas', url: '/maquinas' }
          ])
        ]}
      />
      <Navigation />
      
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-end pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900">
          {!bgLoading && (
            <img
              src={getBackground('maquinas', 'hero', ASSETS.machinesIndustrial)}
              alt="Máquinas Elétricas Rotativas"
              className="w-full h-full object-cover opacity-0 transition-opacity duration-500"
              onLoad={(e) => { e.currentTarget.style.opacity = '1'; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <p className="text-orange-400 text-sm uppercase tracking-widest font-semibold mb-4">
            Máquinas Elétricas Rotativas
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 max-w-4xl">
            Potência e<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Confiabilidade
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mb-10">
            Mais de uma década de expertise em motores e geradores de grande porte 
            para indústria, geração de energia e setor offshore.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/contato"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors"
            >
              Solicitar Orçamento
              <ArrowUpRight size={20} />
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-4 md:gap-12 mt-16">
            <div>
              <p className="text-2xl md:text-4xl font-bold text-white">10+</p>
              <p className="text-white/60 text-xs md:text-sm">Anos de Experiência</p>
            </div>
            <div>
              <p className="text-2xl md:text-4xl font-bold text-white">50MW</p>
              <p className="text-white/60 text-xs md:text-sm">Maior Motor Atendido</p>
            </div>
            <div>
              <p className="text-2xl md:text-4xl font-bold text-white">500+</p>
              <p className="text-white/60 text-xs md:text-sm">Máquinas Reparadas</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Expertise Areas */}
      <section className="py-24 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-orange-400 text-sm uppercase tracking-widest font-semibold mb-4">
              Áreas de Atuação
            </p>
            <h2 className="text-4xl md:text-5xl font-bold">
              Expertise em máquinas de grande porte
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <Factory className="text-orange-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Indústria</h3>
              <p className="text-white/60">
                Siderurgia, mineração, papel e celulose, petroquímica, cimento e outras indústrias de base.
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <Zap className="text-orange-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Geração de Energia</h3>
              <p className="text-white/60">
                Usinas termelétricas, hidrelétricas, PCHs, biomassa e plantas de cogeração industrial.
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <Anchor className="text-orange-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Offshore & Naval</h3>
              <p className="text-white/60">
                Plataformas de petróleo, FPSOs, navios, rebocadores e estaleiros em todo o Brasil.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Services Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-orange-500 text-sm uppercase tracking-widest font-semibold mb-4">
              Nossos Serviços
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900">
              Soluções completas em máquinas rotativas
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {MAQUINAS.map((maquina) => (
              <Link
                key={maquina.slug}
                to={`/maquinas/${maquina.slug}`}
                className="group relative overflow-hidden rounded-3xl aspect-[4/3]"
              >
                <img 
                  src={maquina.image} 
                  alt={maquina.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <p className="text-orange-400 text-sm uppercase tracking-wider font-semibold mb-2">
                    {maquina.subtitle}
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                    {maquina.title}
                  </h3>
                  <p className="text-white/70 mb-4 line-clamp-2">
                    {maquina.shortDesc}
                  </p>
                  <span className="inline-flex items-center gap-2 text-orange-400 font-semibold text-sm group-hover:gap-3 transition-all">
                    Ver detalhes
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-24 bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Inicie seu Projeto
          </h2>
          <p className="text-xl text-white mb-10">
            Nossa equipe técnica está preparada para avaliar sua máquina 
            e propor a melhor solução com o melhor custo-benefício.
          </p>
          <Link 
            to="/contato"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors"
          >
            Solicitar Avaliação
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
