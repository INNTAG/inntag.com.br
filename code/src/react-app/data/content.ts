// INNTAG Content - Professional Copywriting
// Focus: Electrical panels for industry, Field Service for generation, protection, excitation, control and distribution

import { getCompanyAgeDisplay, getCompanyAge } from '@/react-app/utils/companyAge';

export const ASSETS = {
  // Generated premium images
  heroMain: '/api/files/hero-panels-inntag.png',
  solarCinematic: '/api/files/solar-cinematic.png',
  panelsTech: '/api/files/panels-tech.png',
  machinesIndustrial: '/api/files/machines-industrial.png',
  servicesMaintenance: '/api/files/services-maintenance.png',
  aboutFacility: '/api/files/about-team.png',
  aboutTeam: '/api/files/about-team.png',
  substation: '/api/files/substation.jpg',
  
  // Section backgrounds
  ccmPanelBg: '/api/files/ccm-panel-bg.png',
  cubiculosMT: '/api/files/cubiculos-mt-clean.png',
  
  // Page-specific hero backgrounds
  heroPortfolio: '/api/files/hero-portfolio-clientes.png',
  heroContato: '/api/files/hero-contato.png',
  
  // Original INNTAG logo
  logo: '/api/files/logo-inntag.png',
  
  // Project images from original site
  project1: '/api/files/project-1.jpg',
  project2: '/api/files/project-2.jpg',
  project3: '/api/files/project-3.jpg',
  project4: '/api/files/project-4.jpg',
};

export const COMPANY = {
  name: 'Grupo INNTAG',
  tagline: 'Tecnologia, Inovação e Confiabilidade em Soluções Elétricas',
  heroTitle: 'Engenharia Elétrica de Alta Performance para Indústria',
  heroSubtitle: `Há mais de ${getCompanyAge()} anos entregando soluções em painéis elétricos industriais e field service especializado em geração, proteção, excitação, controle e distribuição de energia para subestações e plantas de geração.`,
  
  about: {
    title: 'Quem Somos',
    subtitle: 'Excelência em Engenharia Elétrica Industrial',
    description: `O Grupo INNTAG é referência nacional em soluções elétricas industriais, com foco em painéis elétricos de alta performance e serviços especializados de campo (field service) para os setores mais exigentes do mercado.

Nossa expertise abrange toda a cadeia de geração, proteção, excitação, controle e distribuição de energia elétrica. Atuamos em subestações de alta e média tensão, plantas de geração de energia, instalações industriais e plataformas offshore.

Com uma equipe de engenheiros altamente qualificados e certificados, garantimos soluções que atendem aos mais rigorosos padrões técnicos e normativos do setor elétrico brasileiro.`,
    
    mission: 'Fornecer soluções elétricas industriais de excelência, com tecnologia avançada e serviço especializado que garantem a confiabilidade operacional dos nossos clientes.',
    vision: 'Ser a referência nacional em engenharia elétrica industrial, reconhecida pela competência técnica e compromisso com a segurança.',
  },
  
  stats: [
    { value: getCompanyAgeDisplay(), label: 'Anos de Experiência', suffix: '' },
    { value: '1.000+', label: 'Projetos Executados', suffix: '' },
    { value: '500+', label: 'Clientes Atendidos', suffix: '' },
    { value: '+10', label: 'Países Atendidos', suffix: '' },
  ],
  
  differentiators: [
    { value: 'Engenharia Própria', subtitle: 'Projetos desenvolvidos internamente', label: 'Desenvolvimento Nacional' },
    { value: 'IEC 61439', subtitle: 'Painéis de baixa tensão certificados', label: 'Certificação de Painéis' },
    { value: 'Prazos Desafiadores', subtitle: 'Projetos customizados com entrega garantida', label: 'Compromisso Total' },
    { value: 'Sob Medida', subtitle: 'Cada projeto é único', label: 'Personalização Total' },
  ],
};

export const SERVICES = [
  {
    id: 'paineis',
    title: 'Painéis Elétricos Industriais',
    subtitle: 'Engenharia de Precisão',
    description: 'Projetamos e fabricamos painéis elétricos de baixa e média tensão para aplicações industriais críticas. Nossas soluções incluem CCMs, quadros de distribuição, painéis de proteção e sistemas completos para subestações.',
    features: [
      'Painéis de baixa e média tensão',
      'Centros de Controle de Motores (CCM)',
      'Quadros de Proteção e Controle',
      'Painéis para Subestações',
      'Conformidade total com NR10 e NBR IEC',
    ],
    image: ASSETS.panelsTech,
    accent: 'Certificação NR10',
  },
  {
    id: 'fieldservice',
    title: 'Field Service Especializado',
    subtitle: 'Suporte Técnico em Campo',
    description: 'Serviços especializados de campo para sistemas de geração, proteção, excitação, controle e distribuição de energia. Nossa equipe atua em subestações, plantas de geração e instalações industriais em todo o Brasil.',
    features: [
      'Comissionamento de subestações',
      'Testes de proteção e controle',
      'Manutenção de sistemas de excitação',
      'Parametrização de relés de proteção',
      'Análise e diagnóstico de falhas',
    ],
    image: ASSETS.substation,
    accent: 'Especialistas em Campo',
  },
  {
    id: 'maquinas',
    title: 'Máquinas Rotativas',
    subtitle: 'Potência Industrial',
    description: 'Mais de uma década de expertise em máquinas elétricas rotativas para os setores mais exigentes. Atendemos indústrias pesadas, plataformas offshore, plantas de geração e instalações portuárias.',
    features: [
      'Motores e geradores de grande porte',
      'Manutenção especializada offshore',
      'Rebobinagem industrial',
      'Balanceamento dinâmico',
      'Testes e comissionamento',
    ],
    image: ASSETS.machinesIndustrial,
    accent: '+10 Anos de Expertise',
  },
  {
    id: 'servicos',
    title: 'Serviços de Manutenção',
    subtitle: 'Manutenção Preventiva e Corretiva',
    description: 'Programa completo de manutenção para garantir a confiabilidade e disponibilidade dos seus ativos elétricos. Da manutenção preventiva programada às intervenções emergenciais.',
    features: [
      'Manutenção preventiva programada',
      'Intervenções corretivas emergenciais',
      'Análise termográfica e preditiva',
      'Laudos técnicos e certificações',
      'Treinamento de equipes',
    ],
    image: ASSETS.servicesMaintenance,
    accent: 'Disponibilidade Total',
  },
];

export const SOLAR = {
  id: 'solar',
  title: 'Energia Solar Fotovoltaica',
  subtitle: 'O Futuro é Renovável',
  headline: 'Transforme Luz Solar em Economia Real',
  description: `A energia solar representa não apenas uma escolha sustentável, mas um investimento inteligente com retorno garantido. Nossa divisão de energia fotovoltaica oferece soluções completas, desde o estudo de viabilidade até a instalação e monitoramento do seu sistema.

Com tecnologia de ponta e equipamentos de primeira linha, garantimos a máxima eficiência na geração de energia, permitindo economias significativas na sua conta de luz desde o primeiro mês de operação.`,
  
  benefits: [
    {
      title: 'Retorno em 4-5 Anos',
      description: 'Investimento que se paga rapidamente e gera economia por décadas.',
    },
    {
      title: 'Redução de até 95%',
      description: 'Na conta de energia elétrica, liberando capital para seu negócio.',
    },
    {
      title: 'Vida Útil 25+ Anos',
      description: 'Equipamentos de alta durabilidade com garantia estendida.',
    },
    {
      title: 'Valorização Imobiliária',
      description: 'Imóveis com energia solar valorizam em média 8% no mercado.',
    },
  ],
  
  features: [
    'Estudo de viabilidade técnica e financeira',
    'Projeto executivo personalizado',
    'Equipamentos tier 1 com garantia',
    'Instalação por equipe certificada',
    'Homologação junto à concessionária',
    'Monitoramento remoto em tempo real',
  ],
  
  image: ASSETS.solarCinematic,
  accent: 'Energia Limpa',
};

export const PRODUCTS = {
  title: 'Soluções em Destaque',
  subtitle: 'Produtos que Definem Padrões',
  items: [
    {
      year: '2025',
      title: 'Máquinas Elétricas Rotativas',
      description: 'Nova linha de motores e geradores com eficiência IE4, desenvolvida para operações industriais de alta demanda.',
      category: 'Lançamento',
    },
    {
      year: '2024',
      title: 'Painéis de Distribuição Inteligentes',
      description: 'Sistemas de distribuição com monitoramento IoT integrado, permitindo gestão remota e manutenção preditiva.',
      category: 'Inovação',
    },
    {
      year: '2023',
      title: 'Sistemas de Proteção Avançados',
      description: 'Relés de proteção digital com comunicação IEC 61850, garantindo resposta ultrarrápida a falhas.',
      category: 'Tecnologia',
    },
  ],
};

export const PROJECTS = {
  title: 'Projetos Realizados',
  subtitle: 'Cases de Sucesso',
  items: [
    {
      image: ASSETS.project1,
      title: 'Subestação Industrial',
      category: 'Painéis e Sistemas',
      location: 'São Paulo, SP',
    },
    {
      image: ASSETS.project2,
      title: 'Plataforma Offshore',
      category: 'Máquinas Rotativas',
      location: 'Bacia de Campos',
    },
    {
      image: ASSETS.project3,
      title: 'Planta de Geração',
      category: 'Field Service',
      location: 'Minas Gerais',
    },
    {
      image: ASSETS.project4,
      title: 'Subestação de Distribuição',
      category: 'Proteção e Controle',
      location: 'Rio de Janeiro, RJ',
    },
  ],
};

export const CONTACT = {
  title: 'Entre em Contato',
  subtitle: 'Soluções sob medida para sua operação',
  description: 'Nossa equipe comercial está preparada para entender as necessidades da sua operação e apresentar as melhores soluções em engenharia elétrica industrial.',
  cta: 'Solicitar Proposta Comercial',
  
  info: {
    email: 'contato@inntag.com.br',
    phone: '+55 (19) 3648-3700',
    whatsapp: '+55 (19) 99999-9999',
    address: 'Av. de Cillo, 4034 - Pq Universitário, Americana/SP - CEP 13467-600',
  },
  
  careers: {
    title: 'Trabalhe Conosco',
    description: 'Buscamos talentos apaixonados por engenharia e inovação.',
    email: 'rh@inntag.com.br',
  },
};

export const FOOTER = {
  company: {
    name: 'Grupo INNTAG',
    description: `Tecnologia, Inovação e Confiabilidade em Soluções Elétricas. Há mais de ${getCompanyAge()} anos entregando excelência em engenharia elétrica industrial.`,
  },
  
  services: [
    { label: 'Painéis Elétricos', href: '/produtos' },
    { label: 'Serviços Técnicos', href: '/servicos' },
    { label: 'Máquinas Rotativas', href: '/maquinas' },
    { label: 'Clientes', href: '/clientes' },
    { label: 'Portfolio', href: '/portfolio' },
  ],
  
  company_links: [
    { label: 'Quem Somos', href: '/#sobre' },
    { label: 'Projetos', href: '/portfolio' },
    { label: 'Trabalhe Conosco', href: '/contato' },
    { label: 'Contato', href: '/contato' },
  ],
  
  contact: {
    email: 'contato@inntag.com.br',
    phone: '+55 (19) 3648-3700',
    whatsapp: '+55 (19) 99999-9999',
    address: 'Av. de Cillo, 4034 - Pq Universitário, Americana/SP - CEP 13467-600',
  },
  
  social: {
    linkedin: 'https://linkedin.com/company/inntag',
    instagram: 'https://instagram.com/grupoinntag',
    facebook: 'https://facebook.com/grupoinntag',
  },
  
  legal: {
    copyright: `© ${new Date().getFullYear()} Grupo INNTAG. Todos os direitos reservados.`,
    cnpj: 'CNPJ: 00.000.000/0001-00',
  },
};

export const NAVIGATION = [
  { label: 'Empresa', href: '#empresa' },
  { label: 'Painéis', href: '#paineis' },
  { label: 'Field Service', href: '#fieldservice' },
  { label: 'Máquinas', href: '#maquinas' },
  { label: 'Projetos', href: '#projetos' },
  { label: 'Solar', href: '#solar' },
  { label: 'Contato', href: '#contato' },
];
