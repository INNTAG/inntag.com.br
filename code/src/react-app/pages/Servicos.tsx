import { Link, useParams } from 'react-router';
import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';
import { SEO, schemas } from '@/react-app/components/SEO';
import { ASSETS } from '@/react-app/data/content';
import { getCompanyAge } from '@/react-app/utils/companyAge';
import { ArrowUpRight, ArrowLeft, CheckCircle2, Clock, Shield, Wrench } from 'lucide-react';

const SERVICOS = [
  {
    slug: 'manutencao-preventiva',
    title: 'Manutenção Preventiva',
    subtitle: 'Programa de manutenção programada',
    shortDesc: 'Garantimos a máxima disponibilidade dos seus ativos elétricos com programas de manutenção estruturados.',
    description: 'Programa estruturado de manutenção preventiva que garante a disponibilidade dos seus ativos elétricos e previne paradas não programadas. Nossa metodologia baseada em análise preditiva identifica problemas antes que se tornem falhas críticas.',
    image: '/api/files/real-disjuntor-abw.jpg',
    features: [
      'Análise termográfica de painéis e conexões',
      'Testes de isolamento e continuidade',
      'Verificação de sistemas de proteção',
      'Reaperto de conexões elétricas',
      'Limpeza técnica especializada',
      'Relatório técnico detalhado',
    ],
    benefits: [
      { icon: Clock, title: 'Disponibilidade', desc: 'Aumento de até 30% na disponibilidade' },
      { icon: Shield, title: 'Prevenção', desc: 'Redução de 90% em paradas não programadas' },
      { icon: Wrench, title: 'Vida Útil', desc: 'Extensão da vida útil dos equipamentos' },
    ],
  },
  {
    slug: 'manutencao-corretiva',
    title: 'Manutenção Corretiva',
    subtitle: 'Atendimento emergencial rápido',
    shortDesc: 'Equipe de plantão disponível para atendimento de emergências com resposta rápida.',
    description: 'Equipe de plantão para atendimento de emergências. Nossa estrutura permite resposta rápida e diagnóstico preciso, minimizando o tempo de parada e os prejuízos operacionais.',
    image: '/api/files/real-barramentos-fabrica.jpg',
    features: [
      'Plantão técnico dedicado',
      'Diagnóstico remoto inicial',
      'Tempo de resposta de até 4 horas',
      'Estoque de peças de reposição',
      'Equipe certificada NR-10 e NR-35',
      'Suporte pós-atendimento',
    ],
    benefits: [
      { icon: Clock, title: 'Velocidade', desc: 'Resposta em até 4 horas' },
      { icon: Shield, title: 'Segurança', desc: 'Equipe 100% certificada' },
      { icon: Wrench, title: 'Eficiência', desc: 'Diagnóstico preciso na primeira visita' },
    ],
  },
  {
    slug: 'revisao-entresafra',
    title: 'Revisão Entresafra',
    subtitle: 'Revisão completa durante paradas',
    shortDesc: 'Aproveitamos paradas programadas para garantir equipamentos 100% operacionais na próxima safra.',
    description: 'Aproveitamos as paradas programadas da sua planta para realizar revisões completas nos equipamentos elétricos, garantindo a próxima safra sem surpresas. Planejamento detalhado e execução em tempo recorde.',
    image: '/api/files/real-paineis-xgear.jpg',
    features: [
      'Planejamento prévio detalhado',
      'Mobilização de equipe dedicada',
      'Revisão completa de painéis',
      'Testes funcionais e de proteção',
      'Substituição de componentes desgastados',
      'Comissionamento completo',
    ],
    benefits: [
      { icon: Clock, title: 'Planejamento', desc: 'Execução dentro do cronograma' },
      { icon: Shield, title: 'Confiabilidade', desc: 'Safra sem paradas imprevistas' },
      { icon: Wrench, title: 'Economia', desc: 'Custo menor que manutenção corretiva' },
    ],
  },
  {
    slug: 'subestacoes',
    title: 'Subestações',
    subtitle: 'Comissionamento e manutenção de SEs',
    shortDesc: 'Serviços completos para subestações de alta e média tensão, do comissionamento à modernização.',
    description: 'Serviços completos para subestações de alta e média tensão: comissionamento, testes de proteção, manutenção preventiva e corretiva, e modernização de sistemas. Experiência comprovada em subestações industriais e de concessionárias.',
    image: ASSETS.substation,
    features: [
      'Comissionamento de equipamentos AT/MT',
      'Testes de relés de proteção',
      'Manutenção de disjuntores e seccionadoras',
      'Análise de óleo isolante',
      'Testes de transformadores',
      'Modernização de sistemas de proteção',
    ],
    benefits: [
      { icon: Clock, title: 'Experiência', desc: `${getCompanyAge()}+ anos em subestações` },
      { icon: Shield, title: 'Certificação', desc: 'Equipe habilitada para AT/MT' },
      { icon: Wrench, title: 'Capacidade', desc: 'Até 500kV de experiência' },
    ],
  },
];

function ServiceDetail({ servico }: { servico: typeof SERVICOS[0] }) {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={servico.image} 
            alt={servico.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <Link 
            to="/servicos"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Todos os Serviços</span>
          </Link>
          
          <p className="text-orange-400 text-sm uppercase tracking-widest font-semibold mb-4">
            {servico.subtitle}
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            {servico.title}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl">
            {servico.description}
          </p>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-orange-500 text-sm uppercase tracking-widest font-semibold mb-4">
                O que está incluído
              </p>
              <h2 className="text-4xl font-bold text-neutral-900 mb-8">
                Escopo do Serviço
              </h2>
              
              <div className="space-y-4">
                {servico.features.map((feature, i) => (
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
              <h3 className="text-2xl font-bold mb-8">Benefícios</h3>
              
              <div className="space-y-6">
                {servico.benefits.map((benefit, i) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="text-orange-400" size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{benefit.title}</h4>
                        <p className="text-white/60">{benefit.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-10 pt-8 border-t border-white/10">
                <p className="text-white/60 mb-4">Precisa deste serviço?</p>
                <Link 
                  to="/contato"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                >
                  Solicitar Proposta
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
            Emergência técnica?
          </h2>
          <p className="text-xl text-white/60 mb-10">
            Nossa equipe de plantão está disponível para atendimentos emergenciais.
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

export default function ServicosPage() {
  const { slug } = useParams();
  
  // If a specific service is selected
  if (slug) {
    const servico = SERVICOS.find(s => s.slug === slug);
    if (!servico) {
      return (
        <div className="min-h-screen bg-white">
          <Navigation lightBackground />
          <div className="pt-40 pb-20 text-center">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Serviço não encontrado</h1>
            <Link 
              to="/servicos" 
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Ver Todos os Serviços
            </Link>
          </div>
          <Footer />
        </div>
      );
    }
    
    return <ServiceDetail servico={servico} />;
  }
  
  // Services listing page
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Serviços Técnicos"
        description="Serviços técnicos especializados: manutenção preventiva e corretiva, comissionamento, revisão entresafra e suporte para subestações. Equipe certificada NR-10 e NR-35."
        keywords="manutenção elétrica, manutenção preventiva, manutenção corretiva, comissionamento, subestações, NR-10, NR-35, field service"
        canonical="/servicos"
        schema={[
          schemas.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Serviços', url: '/servicos' }]),
          ...SERVICOS.map(s => schemas.service(s.title, s.shortDesc, `/servicos/${s.slug}`))
        ]}
      />
      <Navigation />
      
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-end pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={ASSETS.servicesMaintenance} 
            alt="Field Service"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <p className="text-orange-400 text-sm uppercase tracking-widest font-semibold mb-4">
            Serviços Técnicos
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 max-w-4xl">
            Suporte Técnico<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Especializado
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mb-10">
            Equipe técnica altamente qualificada para manutenção, comissionamento 
            e suporte em campo. Resposta rápida para emergências.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/contato"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors"
            >
              Solicitar Atendimento
              <ArrowUpRight size={20} />
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-4 md:gap-12 mt-16">
            <div>
              <p className="text-2xl md:text-4xl font-bold text-white">4h</p>
              <p className="text-white/60 text-xs md:text-sm">Tempo de Resposta</p>
            </div>
            <div>
              <p className="text-2xl md:text-4xl font-bold text-white">100%</p>
              <p className="text-white/60 text-xs md:text-sm">Certificados</p>
            </div>
            <div>
              <p className="text-2xl md:text-4xl font-bold text-white">100%</p>
              <p className="text-white/60 text-xs md:text-sm">Equipe Certificada</p>
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
              Suporte completo para sua operação
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {SERVICOS.map((servico) => (
              <Link
                key={servico.slug}
                to={`/servicos/${servico.slug}`}
                className="group relative overflow-hidden rounded-3xl aspect-[4/3]"
              >
                <img 
                  src={servico.image} 
                  alt={servico.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <p className="text-orange-400 text-sm uppercase tracking-wider font-semibold mb-2">
                    {servico.subtitle}
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                    {servico.title}
                  </h3>
                  <p className="text-white/70 mb-4 line-clamp-2">
                    {servico.shortDesc}
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
          <p className="text-xl text-white/60 mb-10">
            Nossa equipe comercial está preparada para entender suas necessidades 
            e propor a solução mais adequada para sua operação.
          </p>
          <Link 
            to="/contato"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors"
          >
            Solicitar Proposta
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
