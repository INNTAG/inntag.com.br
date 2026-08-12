import { useParams, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';
import { SEO, schemas } from '@/react-app/components/SEO';
import { ASSETS } from '@/react-app/data/content';
import { ArrowRight, Check, MapPin, Phone, Shield, Award, ChevronRight, Loader2, Factory, Cpu, CheckCircle2, ArrowUpRight, Star, Zap, Fuel, Pickaxe, FlaskConical, Ship, Wheat, Droplets } from 'lucide-react';

// INNTAG vertical-specific hero images - realistic industrial equipment
const ASSET_BASE = '/api/files';

// Vertical-based images (PAINÉIS, SERVIÇOS, MÁQUINAS) — somente fotos reais da fábrica/campo
const VERTICAL_HERO_IMAGES = {
  paineis: [
    `${ASSET_BASE}/hero-paineis-mt.jpg`,            // Painéis MT reais
    `${ASSET_BASE}/real-paineis-xgear.jpg`,         // Painéis X-Gear reais
    `${ASSET_BASE}/real-barramentos-fabrica.jpg`,   // Barramentos na fábrica
    `${ASSET_BASE}/real-tc-vermelho.jpg`,           // TC em bancada
  ],
  field_service: [
    `${ASSET_BASE}/servico-subestacao.webp`,        // Serviço em subestação (real)
    `${ASSET_BASE}/real-disjuntor-abw.jpg`,         // Disjuntor em manutenção
    `${ASSET_BASE}/hero-paineis-mt.jpg`,            // Painéis MT reais
  ],
  maquinas: [
    `${ASSET_BASE}/maquina-motor.jpg`,              // Motor industrial real
    `${ASSET_BASE}/real-barramentos-fabrica.jpg`,   // Fábrica
  ],
};

// Industry-context images - secondary choice based on city industry (fotos reais)
const INDUSTRY_HERO_IMAGES = {
  petrochemical: [
    `${ASSET_BASE}/servico-subestacao.webp`,
    `${ASSET_BASE}/hero-paineis-mt.jpg`,
  ],
  mining: [
    `${ASSET_BASE}/maquina-motor.jpg`,
    `${ASSET_BASE}/real-barramentos-fabrica.jpg`,
  ],
  steel: [
    `${ASSET_BASE}/real-barramentos-fabrica.jpg`,
    `${ASSET_BASE}/hero-paineis-mt.jpg`,
  ],
  port: [
    `${ASSET_BASE}/maquina-motor.jpg`,
    `${ASSET_BASE}/real-paineis-xgear.jpg`,
  ],
  automotive: [
    `${ASSET_BASE}/real-paineis-xgear.jpg`,
    `${ASSET_BASE}/real-barramentos-fabrica.jpg`,
  ],
  agro: [
    `${ASSET_BASE}/servico-subestacao.webp`,
    `${ASSET_BASE}/real-barramentos-fabrica.jpg`,
  ],
  food: [
    `${ASSET_BASE}/real-paineis-xgear.jpg`,
    `${ASSET_BASE}/real-barramentos-fabrica.jpg`,
  ],
  energy: [
    `${ASSET_BASE}/servico-subestacao.webp`,
    `${ASSET_BASE}/hero-paineis-mt.jpg`,
  ],
  default: [
    `${ASSET_BASE}/hero-paineis-mt.jpg`,
    `${ASSET_BASE}/real-barramentos-fabrica.jpg`,
    `${ASSET_BASE}/real-paineis-xgear.jpg`,
  ],
};

// Map template to industry for image selection
const TEMPLATE_TO_INDUSTRY: Record<string, string> = {
  petroleo: 'petrochemical',
  mineracao: 'mining',
  siderurgia: 'steel',
  naval: 'port',
  automotivo: 'automotive',
  agro: 'agro',
  sucro: 'agro',
  alimentos: 'food',
  energia: 'energy',
  quimico: 'petrochemical',
  saneamento: 'energy',
  infra: 'default',
  industrial: 'steel',
  corporativo: 'default',
  default: 'default',
};

interface CityIndustry {
  has_petrochemical?: number;
  has_oil_platform?: number;
  has_mining?: number;
  has_steel?: number;
  has_port?: number;
  has_automotive?: number;
  has_agro?: number;
  has_food_industry?: number;
  has_energy?: number;
}

function getHeroImageForCity(
  template: string | null,
  cityName: string | null,
  cityIndustry?: CityIndustry,
  vertical?: string | null
): string {
  // PRIORITY 1: Vertical-specific images (paineis, field_service, maquinas)
  if (vertical && VERTICAL_HERO_IMAGES[vertical as keyof typeof VERTICAL_HERO_IMAGES]) {
    const verticalImages = VERTICAL_HERO_IMAGES[vertical as keyof typeof VERTICAL_HERO_IMAGES];
    if (!cityName) return verticalImages[0];
    const hash = cityName.toLowerCase().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return verticalImages[hash % verticalImages.length];
  }
  
  // PRIORITY 2: City industry context (petrochemical, mining, etc.)
  let industryKey = 'default';
  
  if (cityIndustry) {
    if (cityIndustry.has_petrochemical || cityIndustry.has_oil_platform) industryKey = 'petrochemical';
    else if (cityIndustry.has_mining) industryKey = 'mining';
    else if (cityIndustry.has_steel) industryKey = 'steel';
    else if (cityIndustry.has_port) industryKey = 'port';
    else if (cityIndustry.has_automotive) industryKey = 'automotive';
    else if (cityIndustry.has_food_industry) industryKey = 'food';
    else if (cityIndustry.has_agro) industryKey = 'agro';
    else if (cityIndustry.has_energy) industryKey = 'energy';
  }
  
  // Fallback to template mapping if no city industry
  if (industryKey === 'default' && template) {
    industryKey = TEMPLATE_TO_INDUSTRY[template] || 'default';
  }
  
  const images = INDUSTRY_HERO_IMAGES[industryKey as keyof typeof INDUSTRY_HERO_IMAGES] || INDUSTRY_HERO_IMAGES.default;
  
  // Use city name hash to select varied but consistent image
  if (!cityName) return images[0];
  const hash = cityName.toLowerCase().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return images[hash % images.length];
}

// Vertical-specific content
const VERTICAL_CONTENT = {
  paineis: {
    badge: 'Painéis Elétricos',
    defaultH1: 'Painéis Elétricos Industriais',
    subtitle: 'Engenharia própria. Certificação IEC 61439. Qualidade que a indústria reconhece.',
    trustTitle: 'Confiança que a indústria reconhece',
    trustItems: [
      { title: 'Certificação IEC 61439', desc: 'Painéis certificados conforme normas internacionais de segurança e qualidade.' },
      { title: 'Engenharia Própria', desc: 'Projetos desenvolvidos internamente, garantindo total controle de qualidade.' },
      { title: 'Produção Integrada', desc: 'Fábrica própria com tecnologia de ponta e processos otimizados.' },
      { title: 'Soluções Sob Medida', desc: 'Cada projeto é único, desenvolvido para suas necessidades específicas.' },
    ],
    productsLabel: 'Nossos Produtos',
    productsTitle: 'Painéis Elétricos',
    productsDesc: 'Soluções completas em painéis de média e baixa tensão, projetados com engenharia de excelência.',
    ctaText: 'Solicitar Orçamento',
    ctaSubtext: 'Solicite uma proposta técnica personalizada',
  },
  field_service: {
    badge: 'Field Service',
    defaultH1: 'Serviços de Campo Especializados',
    subtitle: 'Equipe técnica qualificada. Atendimento nacional. Agilidade que sua operação exige.',
    trustTitle: 'Excelência em serviços técnicos',
    trustItems: [
      { title: 'Equipe Certificada', desc: 'Técnicos treinados e certificados para atender operações críticas.' },
      { title: 'Cobertura Nacional', desc: 'Atendimento em todo o Brasil com agilidade e eficiência.' },
      { title: 'Manutenção Preventiva', desc: 'Planos de manutenção que evitam paradas não programadas.' },
      { title: 'Comissionamento', desc: 'Instalação e comissionamento de painéis elétricos industriais.' },
    ],
    productsLabel: 'Nossos Serviços',
    productsTitle: 'Serviços Especializados',
    productsDesc: 'Field service, comissionamento, manutenção preventiva e corretiva para sua operação.',
    ctaText: 'Solicitar Atendimento',
    ctaSubtext: 'Equipe técnica disponível em todo Brasil',
  },
  maquinas: {
    badge: 'Máquinas Industriais',
    defaultH1: 'Máquinas e Equipamentos Industriais',
    subtitle: 'Equipamentos de alta performance. Suporte técnico especializado. Peças de reposição.',
    trustTitle: 'Tecnologia para sua produção',
    trustItems: [
      { title: 'Alta Performance', desc: 'Equipamentos selecionados para máxima eficiência e durabilidade.' },
      { title: 'Suporte Técnico', desc: 'Equipe especializada para instalação e manutenção dos equipamentos.' },
      { title: 'Peças de Reposição', desc: 'Estoque de peças para manutenção rápida e eficiente.' },
      { title: 'Treinamento', desc: 'Capacitação da sua equipe para operação dos equipamentos.' },
    ],
    productsLabel: 'Nossos Equipamentos',
    productsTitle: 'Máquinas Industriais',
    productsDesc: 'Motores, inversores, soft-starters e equipamentos para otimizar sua produção.',
    ctaText: 'Solicitar Cotação',
    ctaSubtext: 'Encontre o equipamento ideal para sua operação',
  },
};

// Template style configurations - 15 varied designs maintaining INNTAG brand
const TEMPLATES = {
  default: {
    name: 'Padrão',
    heroOverlay: 'bg-gradient-to-b from-neutral-950/80 via-neutral-950/70 to-neutral-950',
    heroBadge: 'bg-white/10 backdrop-blur-sm border border-white/20',
    heroTitle: 'text-white',
    heroSubtitle: 'text-white/70',
    trustBg: 'bg-neutral-50',
    trustCard: 'bg-white shadow-sm hover:shadow-xl',
    trustTitle: 'text-neutral-900',
    trustText: 'text-neutral-600',
    productsBg: 'bg-white',
    productsLabel: 'text-red-600',
    productsTitle: 'text-neutral-900',
    productCard: 'bg-neutral-50 hover:shadow-2xl',
    servicesBg: 'bg-neutral-950',
    servicesText: 'text-white',
    servicesCard: 'bg-white/5 border-white/10 hover:border-red-500/50',
    proofBg: 'bg-gradient-to-br from-red-600 to-red-700',
    segmentsBg: 'bg-white',
    segmentCard: 'bg-neutral-50 hover:bg-white hover:shadow-xl',
    ctaBg: 'bg-neutral-950',
    ctaButton: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-600/30',
    accent: 'red',
  },
  industrial: {
    name: 'Industrial Premium',
    heroOverlay: 'bg-gradient-to-b from-black/90 via-neutral-900/85 to-neutral-900',
    heroBadge: 'bg-amber-500/20 backdrop-blur-sm border border-amber-500/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-amber-100/70',
    trustBg: 'bg-neutral-900',
    trustCard: 'bg-neutral-800/80 border border-neutral-700/50 shadow-lg shadow-black/20 hover:shadow-amber-500/10 hover:border-amber-500/30',
    trustTitle: 'text-white',
    trustText: 'text-neutral-400',
    productsBg: 'bg-neutral-950',
    productsLabel: 'text-amber-500',
    productsTitle: 'text-white',
    productCard: 'bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10',
    servicesBg: 'bg-black',
    servicesText: 'text-white',
    servicesCard: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10',
    proofBg: 'bg-gradient-to-br from-amber-600 via-orange-600 to-red-700',
    segmentsBg: 'bg-neutral-900',
    segmentCard: 'bg-neutral-800/60 border border-neutral-700/50 hover:bg-neutral-800 hover:shadow-xl hover:shadow-black/30 hover:border-amber-500/30',
    ctaBg: 'bg-black',
    ctaButton: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/30',
    accent: 'amber',
  },
  corporativo: {
    name: 'Corporativo',
    heroOverlay: 'bg-gradient-to-b from-slate-900/85 via-slate-900/75 to-slate-900',
    heroBadge: 'bg-blue-500/15 backdrop-blur-sm border border-blue-400/30',
    heroTitle: 'text-white',
    heroSubtitle: 'text-blue-100/70',
    trustBg: 'bg-gradient-to-b from-slate-50 to-white',
    trustCard: 'bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-blue-300/50',
    trustTitle: 'text-slate-900',
    trustText: 'text-slate-600',
    productsBg: 'bg-white',
    productsLabel: 'text-blue-600',
    productsTitle: 'text-slate-900',
    productCard: 'bg-slate-50 border border-slate-200/60 hover:shadow-xl hover:border-blue-300/50',
    servicesBg: 'bg-slate-900',
    servicesText: 'text-white',
    servicesCard: 'bg-blue-500/5 border-blue-400/20 hover:border-blue-400/50 hover:bg-blue-500/10',
    proofBg: 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700',
    segmentsBg: 'bg-gradient-to-b from-white to-slate-50',
    segmentCard: 'bg-white border border-slate-200/80 hover:shadow-lg hover:border-blue-300/50',
    ctaBg: 'bg-slate-900',
    ctaButton: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-600/30',
    accent: 'blue',
  },
  // Template 4: Energia - tons de vermelho vibrante para setor elétrico
  energia: {
    name: 'Energia',
    heroOverlay: 'bg-gradient-to-b from-red-950/90 via-red-900/80 to-neutral-950',
    heroBadge: 'bg-red-500/20 backdrop-blur-sm border border-red-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-red-100/70',
    trustBg: 'bg-red-50',
    trustCard: 'bg-white border border-red-100 shadow-sm hover:shadow-lg hover:border-red-300/50',
    trustTitle: 'text-neutral-900',
    trustText: 'text-neutral-600',
    productsBg: 'bg-white',
    productsLabel: 'text-red-600',
    productsTitle: 'text-neutral-900',
    productCard: 'bg-red-50/50 border border-red-100 hover:shadow-xl hover:border-red-300',
    servicesBg: 'bg-red-950',
    servicesText: 'text-white',
    servicesCard: 'bg-red-500/10 border-red-500/30 hover:border-red-400/60 hover:bg-red-500/20',
    proofBg: 'bg-gradient-to-br from-red-700 via-red-600 to-orange-600',
    segmentsBg: 'bg-red-50/50',
    segmentCard: 'bg-white border border-red-100 hover:shadow-lg hover:border-red-300',
    ctaBg: 'bg-red-950',
    ctaButton: 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 shadow-red-500/30',
    accent: 'red',
  },
  // Template 5: Petróleo - tons escuros com detalhes dourados
  petroleo: {
    name: 'Petróleo & Gás',
    heroOverlay: 'bg-gradient-to-b from-zinc-950/95 via-zinc-900/90 to-black',
    heroBadge: 'bg-yellow-500/15 backdrop-blur-sm border border-yellow-500/30',
    heroTitle: 'text-white',
    heroSubtitle: 'text-yellow-100/60',
    trustBg: 'bg-zinc-900',
    trustCard: 'bg-zinc-800/90 border border-zinc-700 shadow-lg hover:shadow-yellow-500/5 hover:border-yellow-500/30',
    trustTitle: 'text-white',
    trustText: 'text-zinc-400',
    productsBg: 'bg-zinc-950',
    productsLabel: 'text-yellow-500',
    productsTitle: 'text-white',
    productCard: 'bg-zinc-900 border border-zinc-800 hover:border-yellow-500/40 hover:shadow-xl',
    servicesBg: 'bg-black',
    servicesText: 'text-white',
    servicesCard: 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/10',
    proofBg: 'bg-gradient-to-br from-yellow-600 via-amber-700 to-orange-800',
    segmentsBg: 'bg-zinc-900',
    segmentCard: 'bg-zinc-800/70 border border-zinc-700 hover:bg-zinc-800 hover:border-yellow-500/30',
    ctaBg: 'bg-black',
    ctaButton: 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 shadow-yellow-500/20',
    accent: 'yellow',
  },
  // Template 6: Mineração - tons terrosos e robustos
  mineracao: {
    name: 'Mineração',
    heroOverlay: 'bg-gradient-to-b from-stone-900/90 via-stone-800/85 to-neutral-950',
    heroBadge: 'bg-orange-500/20 backdrop-blur-sm border border-orange-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-orange-100/70',
    trustBg: 'bg-stone-100',
    trustCard: 'bg-white border border-stone-200 shadow-sm hover:shadow-lg hover:border-orange-300',
    trustTitle: 'text-stone-900',
    trustText: 'text-stone-600',
    productsBg: 'bg-stone-50',
    productsLabel: 'text-orange-600',
    productsTitle: 'text-stone-900',
    productCard: 'bg-white border border-stone-200 hover:shadow-xl hover:border-orange-300',
    servicesBg: 'bg-stone-900',
    servicesText: 'text-white',
    servicesCard: 'bg-orange-500/10 border-orange-500/30 hover:border-orange-400/60 hover:bg-orange-500/15',
    proofBg: 'bg-gradient-to-br from-orange-700 via-amber-700 to-stone-800',
    segmentsBg: 'bg-stone-100',
    segmentCard: 'bg-white border border-stone-200 hover:shadow-lg hover:border-orange-300',
    ctaBg: 'bg-stone-900',
    ctaButton: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-600/30',
    accent: 'orange',
  },
  // Template 7: Agronegócio - tons verdes naturais
  agro: {
    name: 'Agronegócio',
    heroOverlay: 'bg-gradient-to-b from-emerald-950/85 via-emerald-900/75 to-neutral-950',
    heroBadge: 'bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-emerald-100/70',
    trustBg: 'bg-emerald-50',
    trustCard: 'bg-white border border-emerald-100 shadow-sm hover:shadow-lg hover:border-emerald-300',
    trustTitle: 'text-neutral-900',
    trustText: 'text-neutral-600',
    productsBg: 'bg-white',
    productsLabel: 'text-emerald-600',
    productsTitle: 'text-neutral-900',
    productCard: 'bg-emerald-50/50 border border-emerald-100 hover:shadow-xl hover:border-emerald-300',
    servicesBg: 'bg-emerald-950',
    servicesText: 'text-white',
    servicesCard: 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-500/15',
    proofBg: 'bg-gradient-to-br from-emerald-700 via-green-600 to-teal-700',
    segmentsBg: 'bg-emerald-50/50',
    segmentCard: 'bg-white border border-emerald-100 hover:shadow-lg hover:border-emerald-300',
    ctaBg: 'bg-emerald-950',
    ctaButton: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-600/30',
    accent: 'emerald',
  },
  // Template 8: Naval/Portuário - tons azuis marítimos
  naval: {
    name: 'Naval & Portuário',
    heroOverlay: 'bg-gradient-to-b from-cyan-950/90 via-blue-900/80 to-slate-950',
    heroBadge: 'bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-cyan-100/70',
    trustBg: 'bg-cyan-50',
    trustCard: 'bg-white border border-cyan-100 shadow-sm hover:shadow-lg hover:border-cyan-300',
    trustTitle: 'text-slate-900',
    trustText: 'text-slate-600',
    productsBg: 'bg-white',
    productsLabel: 'text-cyan-600',
    productsTitle: 'text-slate-900',
    productCard: 'bg-cyan-50/50 border border-cyan-100 hover:shadow-xl hover:border-cyan-300',
    servicesBg: 'bg-slate-900',
    servicesText: 'text-white',
    servicesCard: 'bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/15',
    proofBg: 'bg-gradient-to-br from-cyan-700 via-blue-600 to-indigo-700',
    segmentsBg: 'bg-cyan-50/50',
    segmentCard: 'bg-white border border-cyan-100 hover:shadow-lg hover:border-cyan-300',
    ctaBg: 'bg-slate-900',
    ctaButton: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-600/30',
    accent: 'cyan',
  },
  // Template 9: Siderurgia - tons metálicos escuros
  siderurgia: {
    name: 'Siderurgia',
    heroOverlay: 'bg-gradient-to-b from-gray-900/95 via-gray-800/90 to-black',
    heroBadge: 'bg-gray-400/20 backdrop-blur-sm border border-gray-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-gray-300/80',
    trustBg: 'bg-gray-100',
    trustCard: 'bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-red-300',
    trustTitle: 'text-gray-900',
    trustText: 'text-gray-600',
    productsBg: 'bg-gray-50',
    productsLabel: 'text-red-600',
    productsTitle: 'text-gray-900',
    productCard: 'bg-white border border-gray-200 hover:shadow-xl hover:border-red-300',
    servicesBg: 'bg-gray-900',
    servicesText: 'text-white',
    servicesCard: 'bg-red-500/10 border-red-500/20 hover:border-red-400/50 hover:bg-red-500/15',
    proofBg: 'bg-gradient-to-br from-gray-700 via-gray-600 to-red-900',
    segmentsBg: 'bg-gray-100',
    segmentCard: 'bg-white border border-gray-200 hover:shadow-lg hover:border-red-300',
    ctaBg: 'bg-gray-900',
    ctaButton: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-600/30',
    accent: 'red',
  },
  // Template 10: Químico/Farmacêutico - tons roxos e limpos
  quimico: {
    name: 'Químico',
    heroOverlay: 'bg-gradient-to-b from-purple-950/90 via-purple-900/80 to-slate-950',
    heroBadge: 'bg-purple-500/20 backdrop-blur-sm border border-purple-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-purple-100/70',
    trustBg: 'bg-purple-50',
    trustCard: 'bg-white border border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-300',
    trustTitle: 'text-slate-900',
    trustText: 'text-slate-600',
    productsBg: 'bg-white',
    productsLabel: 'text-purple-600',
    productsTitle: 'text-slate-900',
    productCard: 'bg-purple-50/50 border border-purple-100 hover:shadow-xl hover:border-purple-300',
    servicesBg: 'bg-purple-950',
    servicesText: 'text-white',
    servicesCard: 'bg-purple-500/10 border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-500/15',
    proofBg: 'bg-gradient-to-br from-purple-700 via-violet-600 to-indigo-700',
    segmentsBg: 'bg-purple-50/50',
    segmentCard: 'bg-white border border-purple-100 hover:shadow-lg hover:border-purple-300',
    ctaBg: 'bg-purple-950',
    ctaButton: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-purple-600/30',
    accent: 'purple',
  },
  // Template 11: Automotivo - tons escuros premium
  automotivo: {
    name: 'Automotivo',
    heroOverlay: 'bg-gradient-to-b from-neutral-900/95 via-neutral-800/90 to-black',
    heroBadge: 'bg-red-500/20 backdrop-blur-sm border border-red-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-neutral-300/80',
    trustBg: 'bg-neutral-100',
    trustCard: 'bg-white border border-neutral-200 shadow-sm hover:shadow-lg hover:border-red-300',
    trustTitle: 'text-neutral-900',
    trustText: 'text-neutral-600',
    productsBg: 'bg-neutral-50',
    productsLabel: 'text-red-600',
    productsTitle: 'text-neutral-900',
    productCard: 'bg-white border border-neutral-200 hover:shadow-xl hover:border-red-300',
    servicesBg: 'bg-neutral-900',
    servicesText: 'text-white',
    servicesCard: 'bg-red-500/10 border-red-500/20 hover:border-red-400/50 hover:bg-red-500/15',
    proofBg: 'bg-gradient-to-br from-neutral-800 via-red-900 to-neutral-900',
    segmentsBg: 'bg-neutral-100',
    segmentCard: 'bg-white border border-neutral-200 hover:shadow-lg hover:border-red-300',
    ctaBg: 'bg-neutral-900',
    ctaButton: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-600/30',
    accent: 'red',
  },
  // Template 12: Saneamento - tons azuis claros
  saneamento: {
    name: 'Saneamento',
    heroOverlay: 'bg-gradient-to-b from-sky-950/85 via-sky-900/75 to-slate-950',
    heroBadge: 'bg-sky-500/20 backdrop-blur-sm border border-sky-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-sky-100/70',
    trustBg: 'bg-sky-50',
    trustCard: 'bg-white border border-sky-100 shadow-sm hover:shadow-lg hover:border-sky-300',
    trustTitle: 'text-slate-900',
    trustText: 'text-slate-600',
    productsBg: 'bg-white',
    productsLabel: 'text-sky-600',
    productsTitle: 'text-slate-900',
    productCard: 'bg-sky-50/50 border border-sky-100 hover:shadow-xl hover:border-sky-300',
    servicesBg: 'bg-slate-900',
    servicesText: 'text-white',
    servicesCard: 'bg-sky-500/10 border-sky-500/30 hover:border-sky-400/60 hover:bg-sky-500/15',
    proofBg: 'bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-700',
    segmentsBg: 'bg-sky-50/50',
    segmentCard: 'bg-white border border-sky-100 hover:shadow-lg hover:border-sky-300',
    ctaBg: 'bg-slate-900',
    ctaButton: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-600/30',
    accent: 'sky',
  },
  // Template 13: Alimentos - tons acolhedores
  alimentos: {
    name: 'Alimentos',
    heroOverlay: 'bg-gradient-to-b from-orange-950/85 via-amber-900/75 to-neutral-950',
    heroBadge: 'bg-orange-500/20 backdrop-blur-sm border border-orange-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-orange-100/70',
    trustBg: 'bg-orange-50',
    trustCard: 'bg-white border border-orange-100 shadow-sm hover:shadow-lg hover:border-orange-300',
    trustTitle: 'text-neutral-900',
    trustText: 'text-neutral-600',
    productsBg: 'bg-white',
    productsLabel: 'text-orange-600',
    productsTitle: 'text-neutral-900',
    productCard: 'bg-orange-50/50 border border-orange-100 hover:shadow-xl hover:border-orange-300',
    servicesBg: 'bg-amber-950',
    servicesText: 'text-white',
    servicesCard: 'bg-orange-500/10 border-orange-500/30 hover:border-orange-400/60 hover:bg-orange-500/15',
    proofBg: 'bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-700',
    segmentsBg: 'bg-orange-50/50',
    segmentCard: 'bg-white border border-orange-100 hover:shadow-lg hover:border-orange-300',
    ctaBg: 'bg-amber-950',
    ctaButton: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-orange-500/30',
    accent: 'orange',
  },
  // Template 14: Sucroalcooleiro - tons verdes e dourados
  sucro: {
    name: 'Sucroalcooleiro',
    heroOverlay: 'bg-gradient-to-b from-lime-950/85 via-green-900/75 to-neutral-950',
    heroBadge: 'bg-lime-500/20 backdrop-blur-sm border border-lime-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-lime-100/70',
    trustBg: 'bg-lime-50',
    trustCard: 'bg-white border border-lime-100 shadow-sm hover:shadow-lg hover:border-lime-300',
    trustTitle: 'text-neutral-900',
    trustText: 'text-neutral-600',
    productsBg: 'bg-white',
    productsLabel: 'text-lime-600',
    productsTitle: 'text-neutral-900',
    productCard: 'bg-lime-50/50 border border-lime-100 hover:shadow-xl hover:border-lime-300',
    servicesBg: 'bg-green-950',
    servicesText: 'text-white',
    servicesCard: 'bg-lime-500/10 border-lime-500/30 hover:border-lime-400/60 hover:bg-lime-500/15',
    proofBg: 'bg-gradient-to-br from-lime-700 via-green-600 to-emerald-700',
    segmentsBg: 'bg-lime-50/50',
    segmentCard: 'bg-white border border-lime-100 hover:shadow-lg hover:border-lime-300',
    ctaBg: 'bg-green-950',
    ctaButton: 'bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-500 hover:to-green-500 shadow-lime-600/30',
    accent: 'lime',
  },
  // Template 15: Infraestrutura - tons neutros profissionais
  infra: {
    name: 'Infraestrutura',
    heroOverlay: 'bg-gradient-to-b from-slate-800/90 via-slate-700/80 to-slate-900',
    heroBadge: 'bg-slate-500/20 backdrop-blur-sm border border-slate-400/40',
    heroTitle: 'text-white',
    heroSubtitle: 'text-slate-200/80',
    trustBg: 'bg-slate-100',
    trustCard: 'bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-orange-300',
    trustTitle: 'text-slate-900',
    trustText: 'text-slate-600',
    productsBg: 'bg-slate-50',
    productsLabel: 'text-orange-600',
    productsTitle: 'text-slate-900',
    productCard: 'bg-white border border-slate-200 hover:shadow-xl hover:border-orange-300',
    servicesBg: 'bg-slate-800',
    servicesText: 'text-white',
    servicesCard: 'bg-orange-500/10 border-orange-500/20 hover:border-orange-400/50 hover:bg-orange-500/15',
    proofBg: 'bg-gradient-to-br from-slate-700 via-slate-600 to-orange-800',
    segmentsBg: 'bg-slate-100',
    segmentCard: 'bg-white border border-slate-200 hover:shadow-lg hover:border-orange-300',
    ctaBg: 'bg-slate-800',
    ctaButton: 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-orange-600/30',
    accent: 'orange',
  },
};

type TemplateKey = keyof typeof TEMPLATES;

interface LandingPageData {
  id: number;
  slug: string;
  title: string;
  template: string | null;
  vertical: string | null;
  city_name: string | null;
  state_abbr: string | null;
  state: string | null;
  region: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  h1_title: string | null;
  intro_text: string | null;
  custom_content: string | null;
  hero_image: string | null;
  // City industry flags
  has_port: number | null;
  has_mining: number | null;
  has_agro: number | null;
  has_steel: number | null;
  has_automotive: number | null;
  has_petrochemical: number | null;
  has_energy: number | null;
  has_food_industry: number | null;
  has_oil_platform: number | null;
  industrial_sectors: string | null;
  population: number | null;
  products: any[];
  services: any[];
  machines: any[];
}

interface Product {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string | null;
}

interface Service {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string | null;
}

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<LandingPageData | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [lpRes, productsRes, servicesRes] = await Promise.all([
          fetch(`/api/public/landing-pages/${slug}`),
          fetch('/api/public/products'),
          fetch('/api/public/services')
        ]);
        
        if (!lpRes.ok) {
          setError('Página não encontrada');
          return;
        }
        
        const lpData = await lpRes.json();
        setData(lpData);
        
        if (productsRes.ok) {
          const products = await productsRes.json();
          setAllProducts(products);
        }
        if (servicesRes.ok) {
          const services = await servicesRes.json();
          setAllServices(services);
        }
      } catch (err) {
        setError('Erro ao carregar página');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{error || 'Página não encontrada'}</h1>
          <Link to="/" className="text-red-500 hover:text-red-400">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  // Get template config
  const templateKey = (data.template && data.template in TEMPLATES ? data.template : 'default') as TemplateKey;
  const t = TEMPLATES[templateKey];
  const isIndustrial = templateKey === 'industrial';
  const isCorporativo = templateKey === 'corporativo';

  // Get vertical config
  const verticalKey = (data.vertical || 'paineis') as keyof typeof VERTICAL_CONTENT;
  const vc = VERTICAL_CONTENT[verticalKey] || VERTICAL_CONTENT.paineis;
  const isFieldService = verticalKey === 'field_service';
  const isMaquinas = verticalKey === 'maquinas';

  // Calculate years
  const foundingDate = new Date(2009, 2, 16);
  const now = new Date();
  let yearsInBusiness = now.getFullYear() - foundingDate.getFullYear();
  if (now < new Date(now.getFullYear(), 2, 16)) yearsInBusiness--;

  // Helper for images
  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.ccmPanelBg;
    if (image.startsWith('http')) return image;
    return `/api/files/${image}`;
  };

  // Products & Services with fallback - adapts based on vertical
  const displayProducts: Product[] = data.products && data.products.length > 0
    ? data.products.map((p: any) => ({
        id: p.product_id,
        slug: p.product_slug,
        title: p.custom_title || p.product_title,
        subtitle: p.product_subtitle,
        description: p.custom_description || p.product_description,
        image: p.product_image
      }))
    : allProducts.slice(0, 6).map((p: any) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        description: p.short_description,
        image: p.image_key || p.image
      }));

  const displayServices: Service[] = data.services && data.services.length > 0
    ? data.services.map((s: any) => ({
        id: s.service_id,
        slug: s.service_slug,
        title: s.custom_title || s.service_title,
        subtitle: s.service_subtitle,
        description: s.custom_description || s.service_description,
        image: s.service_image
      }))
    : allServices.slice(0, 4).map((s: any) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        subtitle: s.subtitle,
        description: s.description,
        image: s.image_url || s.image
      }));

  const locationLabel = data.city_name && data.state_abbr 
    ? `${data.city_name}/${data.state_abbr}` 
    : data.city_name || '';

  // Select hero image based on vertical first, then city industry or template
  const heroImage = data.hero_image || getHeroImageForCity(
    data.template,
    data.city_name,
    {
      has_petrochemical: data.has_petrochemical ?? undefined,
      has_oil_platform: data.has_oil_platform ?? undefined,
      has_mining: data.has_mining ?? undefined,
      has_steel: data.has_steel ?? undefined,
      has_port: data.has_port ?? undefined,
      has_automotive: data.has_automotive ?? undefined,
      has_agro: data.has_agro ?? undefined,
      has_food_industry: data.has_food_industry ?? undefined,
      has_energy: data.has_energy ?? undefined,
    },
    data.vertical
  );

  // Template-specific accent colors
  const accentColor = isIndustrial ? 'text-amber-500' : isCorporativo ? 'text-blue-600' : 'text-red-600';
  const accentHover = isIndustrial ? 'hover:text-amber-400' : isCorporativo ? 'hover:text-blue-500' : 'hover:text-red-500';

  return (
    <div className={`min-h-screen ${isIndustrial ? 'bg-neutral-950' : 'bg-white'}`}>
      <SEO
        title={data.meta_title || `${vc.defaultH1}${locationLabel ? ` em ${locationLabel}` : ''}`}
        description={data.meta_description || `${vc.subtitle.replace('${yearsInBusiness}', String(yearsInBusiness))} Solicite orçamento para ${locationLabel || 'sua região'}.`}
        keywords={data.meta_keywords || `${vc.badge.toLowerCase()}, ${data.city_name?.toLowerCase() || ''}, painéis elétricos, INNTAG, soluções industriais`}
        canonical={`/lp/${slug}`}
        image={heroImage}
        type="service"
        schema={[
          schemas.localBusiness(data.city_name || undefined),
          schemas.breadcrumb([
            { name: 'Home', url: '/' },
            { name: vc.badge, url: `/${verticalKey === 'paineis' ? 'produtos' : verticalKey === 'field_service' ? 'servicos' : 'maquinas'}` },
            { name: locationLabel || vc.defaultH1, url: `/lp/${slug}` }
          ])
        ]}
      />
      <Navigation />
      
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 ${t.heroOverlay}`} />
          {/* Industrial template: add grain texture overlay */}
          {isIndustrial && (
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
          )}
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 text-center pt-24">
          {locationLabel && (
            <div className={`inline-flex items-center gap-2 px-5 py-2.5 ${t.heroBadge} rounded-full mb-8 animate-fade-in`}>
              <MapPin className={`w-4 h-4 ${isIndustrial ? 'text-amber-400' : isCorporativo ? 'text-blue-400' : 'text-red-400'}`} />
              <span className="text-sm font-medium text-white/90">{vc.badge} em {locationLabel}</span>
            </div>
          )}
          
          <h1 className={`text-3xl md:text-5xl lg:text-7xl font-semibold ${t.heroTitle} tracking-tight leading-[1.1] mb-6 md:mb-8`}>
            {data.h1_title || `${vc.defaultH1}${locationLabel ? ` em ${locationLabel}` : ''}`}
          </h1>
          
          <p className={`text-lg md:text-xl lg:text-2xl ${t.heroSubtitle} max-w-3xl mx-auto leading-relaxed mb-8 md:mb-12`}>
            {vc.subtitle.replace('${yearsInBusiness}', String(yearsInBusiness))}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-12 md:mb-16">
            <Link 
              to="/contato"
              className={`group inline-flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold rounded-full transition-all shadow-2xl ${
                isIndustrial 
                  ? 'bg-amber-500 text-black hover:bg-amber-400' 
                  : isCorporativo
                  ? 'bg-white text-slate-900 hover:bg-slate-100'
                  : 'bg-white text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {isIndustrial ? 'Solicitar Projeto' : 'Solicitar Proposta'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="tel:+551936483700"
              className={`inline-flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold rounded-full border transition-all ${
                isIndustrial
                  ? 'bg-white/5 text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                  : isCorporativo
                  ? 'bg-blue-500/10 text-blue-200 border-blue-400/30 hover:bg-blue-500/20'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Phone className="w-5 h-5" />
              (19) 3648-3700
            </a>
          </div>
          
          {/* Stats Row */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 lg:gap-12 pt-8 md:pt-12 border-t ${
            isIndustrial ? 'border-amber-500/20' : isCorporativo ? 'border-blue-400/20' : 'border-white/10'
          }`}>
            <div className="text-center">
              <div className={`text-2xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2 ${isIndustrial ? 'text-amber-400' : isCorporativo ? 'text-blue-300' : 'text-white'}`}>{yearsInBusiness}+</div>
              <div className="text-[10px] md:text-sm text-white/50 uppercase tracking-wider">Anos de Mercado</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2 ${isIndustrial ? 'text-amber-400' : isCorporativo ? 'text-blue-300' : 'text-white'}`}>1000+</div>
              <div className="text-[10px] md:text-sm text-white/50 uppercase tracking-wider">Projetos Entregues</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2 ${isIndustrial ? 'text-amber-400' : isCorporativo ? 'text-blue-300' : 'text-white'}`}>IEC</div>
              <div className="text-[10px] md:text-sm text-white/50 uppercase tracking-wider">Certificação 61439</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2 ${isIndustrial ? 'text-amber-400' : isCorporativo ? 'text-blue-300' : 'text-white'}`}>100%</div>
              <div className="text-[10px] md:text-sm text-white/50 uppercase tracking-wider">Engenharia Própria</div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className={`w-6 h-10 border-2 rounded-full flex items-start justify-center p-2 ${
            isIndustrial ? 'border-amber-500/40' : isCorporativo ? 'border-blue-400/40' : 'border-white/30'
          }`}>
            <div className={`w-1 h-2 rounded-full animate-pulse ${
              isIndustrial ? 'bg-amber-400/60' : isCorporativo ? 'bg-blue-400/60' : 'bg-white/50'
            }`} />
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className={`py-12 md:py-20 ${t.trustBg}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 md:mb-16">
            <p className={`text-xs md:text-sm font-semibold uppercase tracking-widest ${accentColor} mb-3 md:mb-4`}>Por que a INNTAG</p>
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-semibold ${t.trustTitle} tracking-tight`}>
              {vc.trustTitle}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {vc.trustItems.map((item, i) => {
              const icons = [Shield, Cpu, Factory, Award];
              const Icon = icons[i % icons.length];
              const colors = isIndustrial 
                ? ['bg-amber-500/20 text-amber-400', 'bg-orange-500/20 text-orange-400', 'bg-yellow-500/20 text-yellow-400', 'bg-lime-500/20 text-lime-400']
                : isCorporativo 
                ? ['bg-blue-100 text-blue-600', 'bg-indigo-100 text-indigo-600', 'bg-slate-100 text-slate-600', 'bg-emerald-100 text-emerald-600']
                : ['bg-red-50 text-red-600', 'bg-orange-50 text-orange-600', 'bg-blue-50 text-blue-600', 'bg-green-50 text-green-600'];
              return (
                <div key={i} className={`rounded-xl md:rounded-2xl p-4 md:p-8 transition-all duration-300 ${t.trustCard}`}>
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-6 ${colors[i % colors.length].split(' ')[0]}`}>
                    <Icon className={`w-5 h-5 md:w-7 md:h-7 ${colors[i % colors.length].split(' ')[1]}`} />
                  </div>
                  <h3 className={`text-sm md:text-lg font-semibold ${t.trustTitle} mb-1 md:mb-2`}>{item.title}</h3>
                  <p className={`${t.trustText} text-xs md:text-sm leading-relaxed hidden sm:block`}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCTS/SERVICES SECTION - adapts based on vertical */}
      {((isFieldService ? displayServices : displayProducts).length > 0) && (
        <section className={`py-16 md:py-24 ${t.productsBg}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 mb-10 md:mb-16">
              <div>
                <p className={`text-xs md:text-sm font-semibold uppercase tracking-widest ${t.productsLabel} mb-2 md:mb-4`}>{vc.productsLabel}</p>
                <h2 className={`text-2xl md:text-3xl lg:text-4xl font-semibold ${t.productsTitle} tracking-tight`}>
                  {vc.productsTitle}{locationLabel ? ` para ${locationLabel}` : ''}
                </h2>
                <p className={`mt-4 text-lg ${isIndustrial ? 'text-neutral-400' : 'text-neutral-600'} max-w-2xl`}>
                  {vc.productsDesc}
                </p>
              </div>
              <Link 
                to={isFieldService ? "/servicos" : "/produtos"}
                className={`inline-flex items-center gap-2 ${accentColor} font-semibold ${accentHover} transition-colors shrink-0`}
              >
                Ver {isFieldService ? 'todos os serviços' : isMaquinas ? 'todos os equipamentos' : 'todos os produtos'}
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {(isFieldService ? displayServices : displayProducts).map((item, index) => (
                <Link 
                  key={item.id || index}
                  to={isFieldService ? `/servicos/${item.slug}` : `/produtos/${item.slug}`}
                  className={`group relative rounded-3xl overflow-hidden transition-all duration-500 ${t.productCard}`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img 
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${
                      isIndustrial ? 'from-amber-900/60' : 'from-neutral-900/60'
                    } via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  </div>
                  <div className="p-4 md:p-8">
                    <h3 className={`text-sm md:text-xl font-semibold ${t.productsTitle} group-hover:${accentColor.replace('text-', '')} transition-colors mb-1 md:mb-2`}>
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className={`${isIndustrial ? 'text-neutral-500' : 'text-neutral-500'} text-xs md:text-sm mb-2 md:mb-4 hidden sm:block`}>{item.subtitle}</p>
                    )}
                    <div className={`flex items-center gap-1 md:gap-2 ${accentColor} font-medium text-xs md:text-sm opacity-0 group-hover:opacity-100 transition-opacity`}>
                      {isFieldService ? 'Conhecer serviço' : 'Conhecer produto'} <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SERVICES SECTION */}
      {displayServices.length > 0 && (
        <section className={`py-16 md:py-24 ${t.servicesBg} ${t.servicesText} overflow-hidden`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
              <div>
                <p className={`text-xs md:text-sm font-semibold uppercase tracking-widest ${
                  isIndustrial ? 'text-amber-500' : isCorporativo ? 'text-blue-400' : 'text-red-500'
                } mb-3 md:mb-4`}>Serviços Especializados</p>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-4 md:mb-6">
                  {isIndustrial ? 'Suporte técnico para operações críticas' : isCorporativo ? 'Serviços que sua operação exige' : 'Suporte técnico que sua operação merece'}
                </h2>
                <p className={`text-base md:text-lg ${isIndustrial ? 'text-neutral-400' : isCorporativo ? 'text-slate-400' : 'text-neutral-400'} mb-6 md:mb-8 leading-relaxed`}>
                  Field service, comissionamento, manutenção preventiva e corretiva. Nossa equipe técnica está preparada para atender {locationLabel || 'todo o Brasil'} com excelência.
                </p>
                
                <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                  {[
                    'Equipe técnica certificada e treinada',
                    'Atendimento em todo território nacional',
                    'Contratos de manutenção personalizados',
                    'Diagnóstico e soluções rápidas',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 md:gap-4">
                      <CheckCircle2 className={`w-5 h-5 md:w-6 md:h-6 shrink-0 ${
                        isIndustrial ? 'text-amber-500' : isCorporativo ? 'text-blue-400' : 'text-green-500'
                      }`} />
                      <span className={`text-sm md:text-base ${isIndustrial ? 'text-neutral-300' : isCorporativo ? 'text-slate-300' : 'text-neutral-300'}`}>{item}</span>
                    </div>
                  ))}
                </div>
                
                <Link 
                  to="/servicos"
                  className={`inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold rounded-full transition-all ${
                    isIndustrial 
                      ? 'bg-amber-500 text-black hover:bg-amber-400' 
                      : isCorporativo
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : 'bg-white text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  Conhecer nossos serviços
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {displayServices.slice(0, 4).map((service, index) => (
                  <Link 
                    key={service.id || index}
                    to={`/servicos/${service.slug}`}
                    className={`group p-4 md:p-6 rounded-xl md:rounded-2xl border transition-all ${t.servicesCard}`}
                  >
                    <h3 className={`text-base md:text-lg font-semibold text-white mb-1 md:mb-2 transition-colors ${
                      isIndustrial ? 'group-hover:text-amber-400' : isCorporativo ? 'group-hover:text-blue-400' : 'group-hover:text-red-400'
                    }`}>
                      {service.title}
                    </h3>
                    {service.subtitle && (
                      <p className="text-xs md:text-sm text-neutral-500 hidden sm:block">{service.subtitle}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SOCIAL PROOF */}
      <section className={`py-12 md:py-20 ${t.proofBg} text-white`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 items-center">
            <div className="md:col-span-2">
              <div className="flex items-center gap-1.5 md:gap-2 mb-4 md:mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 md:w-6 md:h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed mb-4 md:mb-6">
                {isIndustrial 
                  ? '"A INNTAG entrega o que promete. Robustez e confiabilidade em ambientes industriais exigentes."'
                  : isCorporativo
                  ? '"Parceria de excelência. A INNTAG compreende as necessidades corporativas e entrega soluções premium."'
                  : '"A INNTAG superou nossas expectativas em qualidade e prazo. Parceiros que entendem as demandas da indústria."'}
              </blockquote>
              <p className="text-white/80 text-sm md:text-base">
                — Engenharia de uma das maiores empresas de energia do Brasil
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl lg:text-7xl font-bold mb-1 md:mb-2">1000+</div>
              <div className="text-white/80 text-sm md:text-base">Projetos entregues com sucesso</div>
            </div>
          </div>
        </div>
      </section>

      {/* SEGMENTS SERVED */}
      <section className={`py-16 md:py-24 ${t.segmentsBg}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 md:mb-16">
            <p className={`text-xs md:text-sm font-semibold uppercase tracking-widest ${accentColor} mb-3 md:mb-4`}>Segmentos Atendidos</p>
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-semibold ${isIndustrial ? 'text-white' : 'text-neutral-900'} tracking-tight`}>
              {isIndustrial ? 'Presença nos setores mais pesados' : 'Experiência nos setores mais exigentes'}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {[
              { icon: Zap, name: 'Energia', desc: 'Geração e transmissão', color: 'text-amber-500' },
              { icon: Fuel, name: 'Óleo & Gás', desc: 'Onshore e offshore', color: 'text-orange-600' },
              { icon: Factory, name: 'Indústria', desc: 'Manufatura e processos', color: isIndustrial ? 'text-neutral-300' : 'text-neutral-700' },
              { icon: Pickaxe, name: 'Mineração', desc: 'Operações de grande porte', color: 'text-stone-600' },
              { icon: FlaskConical, name: 'Químico', desc: 'Petroquímico e farmacêutico', color: 'text-emerald-600' },
              { icon: Ship, name: 'Naval', desc: 'Estaleiros e embarcações', color: 'text-blue-600' },
              { icon: Wheat, name: 'Agronegócio', desc: 'Usinas e cooperativas', color: 'text-lime-600' },
              { icon: Droplets, name: 'Saneamento', desc: 'Água e efluentes', color: 'text-cyan-500' },
            ].map((segment, i) => {
              const Icon = segment.icon;
              return (
                <div key={i} className={`group text-center p-4 md:p-8 rounded-xl md:rounded-2xl transition-all duration-300 ${t.segmentCard}`}>
                  <div className={`w-10 h-10 md:w-14 md:h-14 mx-auto mb-3 md:mb-5 rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                    isIndustrial ? 'bg-neutral-700/60 shadow-lg shadow-black/30' : 'bg-white shadow-sm'
                  }`}>
                    <Icon className={`w-5 h-5 md:w-7 md:h-7 ${segment.color}`} />
                  </div>
                  <h3 className={`font-semibold text-sm md:text-base mb-0.5 md:mb-1 ${isIndustrial ? 'text-white' : 'text-neutral-900'}`}>{segment.name}</h3>
                  <p className={`text-xs md:text-sm ${isIndustrial ? 'text-neutral-500' : 'text-neutral-500'} hidden sm:block`}>{segment.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className={`py-16 md:py-24 ${t.ctaBg} text-white`}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4 md:mb-6">
            {isFieldService 
              ? `Precisa de suporte técnico${locationLabel ? ` em ${locationLabel}` : ''}?`
              : isMaquinas
              ? `Procurando equipamentos${locationLabel ? ` em ${locationLabel}` : ''}?`
              : `Pronto para seu projeto${locationLabel ? ` em ${locationLabel}` : ''}?`}
          </h2>
          <p className={`text-lg md:text-xl ${isIndustrial ? 'text-neutral-400' : isCorporativo ? 'text-slate-400' : 'text-neutral-400'} mb-8 md:mb-12 max-w-2xl mx-auto`}>
            {vc.ctaSubtext}. Nossa equipe está preparada para atender suas necessidades.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12">
            <Link 
              to="/contato"
              className={`group inline-flex items-center justify-center gap-2 md:gap-3 px-8 md:px-10 py-4 md:py-5 text-sm md:text-base text-white font-semibold rounded-full transition-all shadow-2xl ${t.ctaButton}`}
            >
              {vc.ctaText}
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="tel:+551936483700"
              className={`inline-flex items-center justify-center gap-2 md:gap-3 px-8 md:px-10 py-4 md:py-5 text-sm md:text-base text-white font-semibold rounded-full border transition-all ${
                isIndustrial 
                  ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' 
                  : isCorporativo
                  ? 'bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/20'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}
            >
              <Phone className="w-5 h-5" />
              (19) 3648-3700
            </a>
          </div>
          
          <div className={`flex flex-wrap justify-center gap-4 md:gap-8 text-xs md:text-sm ${
            isIndustrial ? 'text-neutral-500' : isCorporativo ? 'text-slate-500' : 'text-neutral-500'
          }`}>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Check className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isIndustrial ? 'text-amber-500' : isCorporativo ? 'text-blue-400' : 'text-green-500'}`} />
              Orçamento sem compromisso
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Check className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isIndustrial ? 'text-amber-500' : isCorporativo ? 'text-blue-400' : 'text-green-500'}`} />
              Atendimento em todo Brasil
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Check className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isIndustrial ? 'text-amber-500' : isCorporativo ? 'text-blue-400' : 'text-green-500'}`} />
              Engenharia personalizada
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
