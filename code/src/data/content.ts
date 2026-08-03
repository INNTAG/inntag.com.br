// Conteúdo completo do site Inntag

// Company founding date: March 16, 2009
const FOUNDING_DATE = new Date(2009, 2, 16);

export function getCompanyAge(): number {
  const today = new Date();
  let age = today.getFullYear() - FOUNDING_DATE.getFullYear();
  const monthDiff = today.getMonth() - FOUNDING_DATE.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < FOUNDING_DATE.getDate())) {
    age--;
  }
  return age;
}

export const siteConfig = {
  name: "Grupo INNTAG",
  tagline: "Tecnologia, Inovação e Confiabilidade em Soluções Elétricas",
  description: "O Grupo INNTAG atua de forma integrada, oferecendo soluções completas nas áreas de energia, painéis, máquinas e serviços.",
  contact: {
    email: "contato@inntag.com.br",
    phone: "(11) 0000-0000",
  }
};

export const getStats = () => [
  { value: `${getCompanyAge()}+`, label: "Anos de experiência", suffix: "" },
  { value: "1.000", label: "Projetos executados", suffix: "+" },
  { value: "17.000", label: "Usuários atendidos", suffix: "+" },
  { value: "4", label: "Frentes de atuação", suffix: "" },
];

// For backwards compatibility
export const stats = getStats();

export const businessAreas = [
  {
    id: "energia-solar",
    title: "Energia Solar",
    subtitle: "INNTAG ENERGIA SOLAR",
    description: `Empresa com mais de ${getCompanyAge()} anos de experiência dedicada a oferecer soluções completas em geração e distribuição de energia.`,
    mission: "Transformar a relação das pessoas e empresas com a energia, promovendo economia, conforto e sustentabilidade.",
    benefits: [
      {
        title: "Retorno Financeiro Acelerado",
        description: "Recupere investimento em 4 a 5 anos com economias até 90% na conta de energia mensal"
      },
      {
        title: "Valorização do Imóvel",
        description: "Agregue maior valor ao patrimônio; imóveis com solar são altamente valorizados no mercado"
      },
      {
        title: "Sustentabilidade",
        description: "Reduza emissão de carbono e alinhe-se a práticas sustentáveis"
      }
    ],
    icon: "sun",
    color: "from-amber-500 to-orange-600"
  },
  {
    id: "paineis-sistemas",
    title: "Painéis e Sistemas",
    subtitle: "INNTAG PAINÉIS E SISTEMAS",
    description: "Especialistas em desenvolver e modernizar sistemas elétricos seguros, confiáveis e de alta performance.",
    features: [
      "Painéis projetados para suportar condições extremas",
      "Foco em durabilidade, segurança e fácil manutenção",
      "Conformidade com normas técnicas das principais concessionárias"
    ],
    services: [
      "Startups e comissionamentos",
      "Modernização e retrofit",
      "Inspeções e adequações NR10",
      "Subestações e transformadores"
    ],
    icon: "zap",
    color: "from-blue-500 to-cyan-600"
  },
  {
    id: "maquinas",
    title: "Máquinas",
    subtitle: "INNTAG MÁQUINAS",
    description: "Mais de 10 anos de experiência liderando entrega de soluções elétricas personalizadas para indústrias, plataformas offshore e grandes infraestruturas.",
    solutions: [
      "Máquinas rotativas de alto desempenho",
      "Sistemas de controle modernos",
      "Manutenção técnica especializada"
    ],
    sectors: ["Sucroalcooleiro", "Construção civil", "Siderurgia", "Mineração", "Alimentos", "Papel e celulose"],
    icon: "cog",
    color: "from-slate-600 to-slate-800"
  },
  {
    id: "servicos",
    title: "Serviços",
    subtitle: "INNTAG SERVIÇOS",
    description: "Manutenção elétrica completa com foco em eficiência e prevenção de falhas.",
    philosophy: "A manutenção preventiva é essencial para prolongar a vida útil dos equipamentos e reduzir custos com paradas inesperadas.",
    services: [
      "Revisões periódicas em sistemas de alta, média e baixa tensão",
      "Diagnóstico e correção de falhas preventiva",
      "Soluções Turnkey em geração e cogeração de energia"
    ],
    icon: "wrench",
    color: "from-emerald-500 to-teal-600"
  }
];

export const products = [
  {
    year: "2025",
    title: "Máquinas Elétricas Rotativas",
    description: "Desenvolvimento, reforma e manutenção em motores e geradores de alta performance para aplicações industriais"
  },
  {
    year: "2024",
    title: "Painéis de Distribuição",
    description: "Painéis elétricos sob medida com montagem precisa para sistemas de baixa e média tensão"
  },
  {
    year: "2023",
    title: "Sistemas de Proteção",
    description: "Sistemas inteligentes com relés, sensores e automação para integridade de equipamentos"
  }
];

export const featuredProducts = [
  "Manutenção preventiva painel elétrico",
  "Gerador de energia solar fotovoltaica",
  "Geração fotovoltaica",
  "Fornecedor de quadro elétrico"
];

export const navigation = [
  { name: "Home", href: "#home" },
  { name: "Empresa", href: "#empresa" },
  { name: "Soluções", href: "#solucoes" },
  { name: "Produtos", href: "#produtos" },
  { name: "Contato", href: "#contato" },
];
