import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';
import { SEO, schemas } from '@/react-app/components/SEO';
import {
  ArrowUpRight, ArrowDown, BatteryCharging, ShieldAlert, Zap, Gauge,
  Thermometer, FileCheck2, GraduationCap, Boxes, Cable, Ruler, Flame,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════════
   CURVA DE CARGA DE REFERÊNCIA
   ════════════════════════════════════════════════════════════════════════
   Perfil horário de uma planta industrial em kW, das 0h às 23h. Não é de
   um cliente: é a forma típica de quem tem turno administrativo somado a
   produção, com o pico empurrado para o começo da noite. Serve para o
   visitante ver o mecanismo; o estudo real vem da campanha de medição.   */
const CURVA = [
  420, 400, 395, 390, 400, 430, 520, 640, 780, 880, 930, 950,
  900, 870, 910, 940, 960, 980, 1180, 1240, 1190, 820, 600, 480,
];

/* A ponta é definida pela distribuidora, em três horas consecutivas. Aqui,
   das 18h às 21h — o recorte mais comum no Sudeste. */
const PONTA = [18, 19, 20];

/* Equipamento de referência: GoodWe ESA 125 kW / 261 kWh, profundidade de
   descarga de 90% (recomendada em datasheet), eficiência de sistema 92%. */
const GABINETE_KW = 125;
const GABINETE_KWH = 261.25;
const DOD = 0.9;
const EFICIENCIA = 0.92;
const DIAS_UTEIS = 22;

const PICO = Math.max(...CURVA);
const VALE = Math.min(...CURVA);

const real = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const numero = (n: number, casas = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

/* ────────────────────────────────────────────────────────────────────────
   Aparece ao entrar na tela. Um movimento curto, uma vez só, e respeitando
   quem pediu menos animação no sistema.

   O QUE JÁ ESTÁ NA TELA NÃO ESPERA OBSERVADOR. A primeira versão deixava
   tudo em opacidade zero até o IntersectionObserver responder — e para o
   que nasce acima da dobra ele não responde, porque não houve mudança de
   visibilidade nenhuma para observar. Resultado: a abertura da página
   ficava preta e vazia. Quem está na tela aparece agora; o observador fica
   só para o que vem depois, que é para o que ele serve.                  */
function Surge({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const jaNaTela = r.top < window.innerHeight * 0.92 && r.bottom > 0;
    if (jaNaTela || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisivel(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisivel(true); obs.disconnect(); } },
      { rootMargin: '0px 0px -12% 0px' },
    );
    obs.observe(el);

    /* Rede de segurança: se por qualquer motivo o observador não responder,
       o conteúdo aparece mesmo assim. Página em branco não é opção. */
    const prazo = window.setTimeout(() => { setVisivel(true); obs.disconnect(); }, 2500);

    return () => { window.clearTimeout(prazo); obs.disconnect(); };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? 'none' : 'translateY(18px)',
        transition: `opacity .7s cubic-bezier(.22,.61,.36,1) ${delay}ms, transform .7s cubic-bezier(.22,.61,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   NAVEGAÇÃO DA PÁGINA
   A página é longa e tem seis assuntos diferentes. Sem um índice que diga
   onde a pessoa está, ela rola no escuro. A barra gruda abaixo do menu do
   site, marca a seção visível e leva até ela com rolagem suave.
   ──────────────────────────────────────────────────────────────────────── */
const SECOES = [
  { id: 'mecanismo', rotulo: 'Como funciona' },
  { id: 'peak-shaving', rotulo: 'Peak shaving' },
  { id: 'ponta', rotulo: 'Ponta' },
  { id: 'equipamento', rotulo: 'Equipamento' },
  { id: 'roteiro', rotulo: 'Instalação' },
  { id: 'riscos', rotulo: 'Riscos' },
  { id: 'escopo', rotulo: 'Escopo completo' },
];

function IndiceFixo() {
  const [ativa, setAtiva] = useState(SECOES[0].id);
  const trilhoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvos = SECOES
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => !!e);
    if (!alvos.length) return;

    const obs = new IntersectionObserver(
      (entradas) => {
        /* A seção ativa é a que está mais acima entre as visíveis: com duas
           na tela ao mesmo tempo, marcar a de baixo faria o índice andar
           para a frente de quem lê. */
        const visiveis = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visiveis[0]) setAtiva(visiveis[0].target.id);
      },
      { rootMargin: '-140px 0px -55% 0px', threshold: 0 },
    );
    alvos.forEach((a) => obs.observe(a));
    return () => obs.disconnect();
  }, []);

  /* Em telas estreitas o índice rola na horizontal; a pílula ativa se traz
     para dentro da vista sozinha. */
  useEffect(() => {
    const trilho = trilhoRef.current;
    const botao = trilho?.querySelector<HTMLElement>(`[data-id="${ativa}"]`);
    if (!trilho || !botao) return;
    const folga = botao.offsetLeft - trilho.clientWidth / 2 + botao.clientWidth / 2;
    trilho.scrollTo({ left: Math.max(0, folga), behavior: 'smooth' });
  }, [ativa]);

  const ir = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const topo = el.getBoundingClientRect().top + window.scrollY - 104;
    window.scrollTo({ top: topo, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200/80">
      <div
        ref={trilhoRef}
        className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto py-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {SECOES.map((s) => (
          <button
            key={s.id}
            data-id={s.id}
            onClick={() => ir(s.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
              ativa === s.id
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            {s.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   GRÁFICO 1 — PEAK SHAVING
   ════════════════════════════════════════════════════════════════════════
   O que a conta de luz cobra não é só energia: é também a maior potência
   que a planta pediu no mês. Uma única hora de pico define a demanda
   contratada dos doze meses seguintes.

   Arrastar o limite mostra o que a bateria teria de cobrir acima dele, e
   quantos gabinetes isso exige — por potência instantânea E por energia,
   porque os dois limitam, e o maior dos dois manda.                      */
function GraficoPeakShaving() {
  const [limite, setLimite] = useState(950);
  const [tarifaDemanda, setTarifaDemanda] = useState(38);

  const conta = useMemo(() => {
    const excedentes = CURVA.map((v) => Math.max(0, v - limite));
    const energia = excedentes.reduce((a, b) => a + b, 0);       // kWh/dia
    const potencia = Math.max(...excedentes);                     // kW de pico
    const reducao = Math.max(0, PICO - limite);
    const horas = excedentes.filter((v) => v > 0).length;
    const porPotencia = Math.ceil(potencia / GABINETE_KW);
    const porEnergia = Math.ceil(energia / (GABINETE_KWH * DOD));
    const gabinetes = Math.max(porPotencia, porEnergia, potencia > 0 ? 1 : 0);
    return {
      energia, potencia, reducao, horas, gabinetes, porPotencia, porEnergia,
      economiaMes: reducao * tarifaDemanda,
      limitante: porEnergia > porPotencia ? 'energia' : 'potência',
    };
  }, [limite, tarifaDemanda]);

  /* Geometria do desenho. O viewBox é fixo e o SVG escala: assim o gráfico
     funciona igual no celular e na TV da sala de reunião. */
  const L = 820, A = 300, mE = 46, mD = 14, mT = 16, mB = 30;
  const x = (h: number) => mE + (h / 23) * (L - mE - mD);
  const y = (kw: number) => mT + (1 - kw / (PICO * 1.08)) * (A - mT - mB);
  const chao = y(0);

  const linha = CURVA.map((v, h) => `${h === 0 ? 'M' : 'L'}${x(h).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const areaBase = `${linha} L${x(23).toFixed(1)},${chao} L${x(0).toFixed(1)},${chao} Z`;

  /* O recorte acima do limite: a faixa que a bateria assume. */
  const acima = (() => {
    const partes: string[] = [];
    let atual: string[] = [];
    CURVA.forEach((v, h) => {
      if (v > limite) {
        if (!atual.length) atual.push(`M${x(h).toFixed(1)},${y(limite).toFixed(1)}`);
        atual.push(`L${x(h).toFixed(1)},${y(v).toFixed(1)}`);
      } else if (atual.length) {
        atual.push(`L${x(h - 1).toFixed(1)},${y(limite).toFixed(1)} Z`);
        partes.push(atual.join(' '));
        atual = [];
      }
    });
    if (atual.length) {
      atual.push(`L${x(23).toFixed(1)},${y(limite).toFixed(1)} Z`);
      partes.push(atual.join(' '));
    }
    return partes.join(' ');
  })();

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden">
      <div className="p-6 md:p-8 pb-0">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-1">
          <div>
            <p className="text-orange-500 text-xs uppercase tracking-widest font-bold mb-2">Simulação 01</p>
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-900">Cortar o pico</h3>
          </div>
          <p className="text-sm text-neutral-500 max-w-sm">
            Arraste o limite. Tudo que fica acima da linha é o que a bateria entrega
            em vez da rede.
          </p>
        </div>
      </div>

      <div className="px-2 md:px-6">
        <svg viewBox={`0 0 ${L} ${A}`} className="w-full h-auto" role="img"
             aria-label={`Curva de carga diária com pico de ${PICO} kW e limite de demanda em ${limite} kW`}>
          <defs>
            <linearGradient id="ps-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0a0a" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="ps-corte" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* grade */}
          {[0, 300, 600, 900, 1200].map((kw) => (
            <g key={kw}>
              <line x1={mE} y1={y(kw)} x2={L - mD} y2={y(kw)} stroke="#e5e5e5" strokeWidth="1" />
              <text x={mE - 8} y={y(kw) + 4} textAnchor="end" fontSize="11" fill="#a3a3a3">{kw}</text>
            </g>
          ))}
          {[0, 6, 12, 18, 23].map((h) => (
            <text key={h} x={x(h)} y={A - 10} textAnchor="middle" fontSize="11" fill="#a3a3a3">
              {String(h).padStart(2, '0')}h
            </text>
          ))}

          <path d={areaBase} fill="url(#ps-base)" />
          <path d={acima} fill="url(#ps-corte)" style={{ transition: 'd .25s ease' }} />
          <path d={linha} fill="none" stroke="#171717" strokeWidth="2.2"
                strokeLinejoin="round" strokeLinecap="round" />

          {/* a linha do limite */}
          <line x1={mE} y1={y(limite)} x2={L - mD} y2={y(limite)}
                stroke="#f97316" strokeWidth="2" strokeDasharray="6 5" />
          <rect x={L - mD - 116} y={y(limite) - 24} width="110" height="19" rx="5" fill="#f97316" />
          <text x={L - mD - 61} y={y(limite) - 10.5} textAnchor="middle" fontSize="11.5"
                fill="#ffffff" fontWeight="600">
            limite {limite} kW
          </text>
        </svg>
      </div>

      {/* controles */}
      <div className="px-6 md:px-8 pt-2 pb-6 grid gap-5 sm:grid-cols-2">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label htmlFor="ps-limite" className="text-sm font-semibold text-neutral-700">
              Demanda contratada
            </label>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">{limite} kW</span>
          </div>
          <input
            id="ps-limite" type="range" min={VALE} max={PICO} step={10}
            value={limite} onChange={(e) => setLimite(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label htmlFor="ps-tarifa" className="text-sm font-semibold text-neutral-700">
              Tarifa de demanda
            </label>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">
              {real(tarifaDemanda)}/kW
            </span>
          </div>
          <input
            id="ps-tarifa" type="range" min={15} max={80} step={1}
            value={tarifaDemanda} onChange={(e) => setTarifaDemanda(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>
      </div>

      {/* resultado */}
      <div className="border-t border-neutral-200 bg-neutral-50 px-6 md:px-8 py-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Pico cortado</p>
          <p className="text-3xl font-bold text-neutral-900 tabular-nums">{numero(conta.reducao)} <span className="text-lg font-semibold text-neutral-400">kW</span></p>
          <p className="text-xs text-neutral-500 mt-1">de {PICO} kW para {limite} kW</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Energia por dia</p>
          <p className="text-3xl font-bold text-neutral-900 tabular-nums">{numero(conta.energia)} <span className="text-lg font-semibold text-neutral-400">kWh</span></p>
          <p className="text-xs text-neutral-500 mt-1">
            {conta.horas === 0 ? 'nenhuma hora acima do limite' : `ao longo de ${conta.horas} h do dia`}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Gabinetes</p>
          <p className="text-3xl font-bold text-neutral-900 tabular-nums">{conta.gabinetes}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {conta.gabinetes > 0
              ? `limitado por ${conta.limitante} · ${numero(conta.gabinetes * GABINETE_KWH)} kWh`
              : 'o pico já cabe no contrato'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-orange-600 font-semibold mb-1">Economia por mês</p>
          <p className="text-3xl font-bold text-orange-600 tabular-nums">{real(conta.economiaMes)}</p>
          <p className="text-xs text-neutral-500 mt-1">só na parcela de demanda</p>
        </div>
      </div>

      <div className="px-6 md:px-8 py-4 border-t border-neutral-200 text-xs text-neutral-500 leading-relaxed">
        <strong className="text-neutral-700">Como a conta é feita:</strong> a quantidade de gabinetes é
        o maior entre o necessário por potência instantânea ({conta.porPotencia} × {GABINETE_KW} kW) e por
        energia ({conta.porEnergia} × {numero(GABINETE_KWH, 2)} kWh a {DOD * 100}% de profundidade de descarga).
        A economia considera apenas a redução da demanda contratada, sem contar ultrapassagens evitadas.
        Curva de carga ilustrativa — o número do seu caso sai da campanha de medição.
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   GRÁFICO 2 — DESLOCAMENTO DE PONTA
   ════════════════════════════════════════════════════════════════════════
   Aqui não se corta consumo: muda-se a hora dele. A bateria carrega barato
   de madrugada e devolve nas três horas em que o kWh custa quatro vezes
   mais. O detalhe que quase toda planilha esquece: o ciclo tem perda, e
   ela entra como energia comprada a mais.                                */
function GraficoPonta() {
  /* Começa em 60%: deslocar a ponta inteira é possível, mas exige um banco
     grande demais para ser o primeiro número que alguém vê. */
  const [deslocado, setDeslocado] = useState(60);
  const [tarifaPonta, setTarifaPonta] = useState(2.2);
  const [tarifaFora, setTarifaFora] = useState(0.55);

  const conta = useMemo(() => {
    const fracao = deslocado / 100;
    const energiaPonta = PONTA.reduce((a, h) => a + CURVA[h], 0);
    const movida = energiaPonta * fracao;
    const recarga = movida / EFICIENCIA;
    const perda = recarga - movida;
    const potencia = Math.max(...PONTA.map((h) => CURVA[h])) * fracao;
    const evitado = movida * tarifaPonta;
    const gasto = recarga * tarifaFora;
    const dia = evitado - gasto;
    const porPotencia = Math.ceil(potencia / GABINETE_KW);
    const porEnergia = Math.ceil(movida / (GABINETE_KWH * DOD));
    return {
      energiaPonta, movida, recarga, perda, potencia, dia,
      mes: dia * DIAS_UTEIS,
      ano: dia * DIAS_UTEIS * 12,
      gabinetes: Math.max(porPotencia, porEnergia, movida > 0 ? 1 : 0),
    };
  }, [deslocado, tarifaPonta, tarifaFora]);

  const L = 820, A = 300, mE = 46, mD = 14, mT = 16, mB = 30;
  const x = (h: number) => mE + (h / 23) * (L - mE - mD);
  const y = (kw: number) => mT + (1 - kw / (PICO * 1.08)) * (A - mT - mB);
  const chao = y(0);

  /* A curva depois do deslocamento: a ponta baixa na fração escolhida, e a
     madrugada sobe com a recarga, distribuída entre 1h e 5h. */
  const horasRecarga = [1, 2, 3, 4, 5];
  const depois = CURVA.map((v, h) => {
    if (PONTA.includes(h)) return v * (1 - deslocado / 100);
    if (horasRecarga.includes(h)) return v + conta.recarga / horasRecarga.length;
    return v;
  });

  const caminho = (dados: number[]) =>
    dados.map((v, h) => `${h === 0 ? 'M' : 'L'}${x(h).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden">
      <div className="p-6 md:p-8 pb-0">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-1">
          <div>
            <p className="text-orange-500 text-xs uppercase tracking-widest font-bold mb-2">Simulação 02</p>
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-900">Sair da ponta</h3>
          </div>
          <p className="text-sm text-neutral-500 max-w-sm">
            A linha clara é hoje. A escura é depois: a ponta desce, a madrugada sobe.
          </p>
        </div>
      </div>

      <div className="px-2 md:px-6">
        <svg viewBox={`0 0 ${L} ${A}`} className="w-full h-auto" role="img"
             aria-label={`Curva de carga antes e depois de deslocar ${deslocado}% do consumo das 18h às 21h`}>
          <defs>
            <linearGradient id="pt-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#171717" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#171717" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* janela de ponta */}
          <rect x={x(PONTA[0])} y={mT} width={x(PONTA[PONTA.length - 1] + 1) - x(PONTA[0])}
                height={chao - mT} fill="#f97316" opacity="0.07" />
          <text x={(x(PONTA[0]) + x(PONTA[PONTA.length - 1] + 1)) / 2} y={mT + 15}
                textAnchor="middle" fontSize="11" fill="#ea580c" fontWeight="700">
            PONTA · 18h–21h
          </text>

          {[0, 300, 600, 900, 1200].map((kw) => (
            <g key={kw}>
              <line x1={mE} y1={y(kw)} x2={L - mD} y2={y(kw)} stroke="#e5e5e5" strokeWidth="1" />
              <text x={mE - 8} y={y(kw) + 4} textAnchor="end" fontSize="11" fill="#a3a3a3">{kw}</text>
            </g>
          ))}
          {[0, 6, 12, 18, 23].map((h) => (
            <text key={h} x={x(h)} y={A - 10} textAnchor="middle" fontSize="11" fill="#a3a3a3">
              {String(h).padStart(2, '0')}h
            </text>
          ))}

          <path d={`${caminho(depois)} L${x(23).toFixed(1)},${chao} L${x(0).toFixed(1)},${chao} Z`}
                fill="url(#pt-area)" style={{ transition: 'd .3s ease' }} />
          <path d={caminho(CURVA)} fill="none" stroke="#d4d4d4" strokeWidth="2"
                strokeDasharray="5 4" strokeLinejoin="round" />
          <path d={caminho(depois)} fill="none" stroke="#171717" strokeWidth="2.4"
                strokeLinejoin="round" strokeLinecap="round" style={{ transition: 'd .3s ease' }} />
        </svg>
      </div>

      <div className="px-6 md:px-8 pt-2 pb-6 grid gap-5 sm:grid-cols-3">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label htmlFor="pt-desloc" className="text-sm font-semibold text-neutral-700">Da ponta deslocado</label>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">{deslocado}%</span>
          </div>
          <input id="pt-desloc" type="range" min={0} max={100} step={5}
                 value={deslocado} onChange={(e) => setDeslocado(Number(e.target.value))}
                 className="w-full accent-orange-500" />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label htmlFor="pt-tp" className="text-sm font-semibold text-neutral-700">Tarifa na ponta</label>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">
              R$ {numero(tarifaPonta, 2)}
            </span>
          </div>
          <input id="pt-tp" type="range" min={1} max={4} step={0.05}
                 value={tarifaPonta} onChange={(e) => setTarifaPonta(Number(e.target.value))}
                 className="w-full accent-orange-500" />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label htmlFor="pt-tf" className="text-sm font-semibold text-neutral-700">Fora de ponta</label>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">
              R$ {numero(tarifaFora, 2)}
            </span>
          </div>
          <input id="pt-tf" type="range" min={0.2} max={1.2} step={0.05}
                 value={tarifaFora} onChange={(e) => setTarifaFora(Number(e.target.value))}
                 className="w-full accent-orange-500" />
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-neutral-50 px-6 md:px-8 py-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Energia deslocada</p>
          <p className="text-3xl font-bold text-neutral-900 tabular-nums">{numero(conta.movida)} <span className="text-lg font-semibold text-neutral-400">kWh</span></p>
          <p className="text-xs text-neutral-500 mt-1">por dia útil</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Recarga necessária</p>
          <p className="text-3xl font-bold text-neutral-900 tabular-nums">{numero(conta.recarga)} <span className="text-lg font-semibold text-neutral-400">kWh</span></p>
          <p className="text-xs text-neutral-500 mt-1">{numero(conta.perda)} kWh viram perda no ciclo</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Gabinetes</p>
          <p className="text-3xl font-bold text-neutral-900 tabular-nums">{conta.gabinetes}</p>
          <p className="text-xs text-neutral-500 mt-1">{numero(conta.potencia)} kW na ponta</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-orange-600 font-semibold mb-1">Economia por ano</p>
          <p className="text-3xl font-bold text-orange-600 tabular-nums">{real(conta.ano)}</p>
          <p className="text-xs text-neutral-500 mt-1">{real(conta.mes)} por mês · {DIAS_UTEIS} dias úteis</p>
        </div>
      </div>

      <div className="px-6 md:px-8 py-4 border-t border-neutral-200 text-xs text-neutral-500 leading-relaxed">
        <strong className="text-neutral-700">O detalhe que falta em quase toda planilha:</strong> com
        eficiência de sistema de {EFICIENCIA * 100}%, cada kWh entregue na ponta exige{' '}
        {numero(1 / EFICIENCIA, 3)} kWh comprados fora dela. A conta acima já desconta isso.
        Impostos, bandeiras e a parcela de demanda ficam de fora — entram no estudo final.
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ROTEIRO
   ════════════════════════════════════════════════════════════════════════ */
const ROTEIRO = [
  {
    fase: 'Fase 1',
    titulo: 'Medição e dimensionamento',
    prazo: '2 a 5 semanas',
    icone: Gauge,
    itens: [
      'Analisador de energia instalado de 7 a 30 dias, registrando a curva real',
      'Leitura de 12 faturas: posto tarifário, demanda contratada, ultrapassagens',
      'Dimensionamento por potência e por energia, com profundidade de descarga de 90%',
      'Simulação de retorno com a degradação da bateria ao longo da garantia',
    ],
  },
  {
    fase: 'Fase 2',
    titulo: 'Engenharia e regulatório',
    prazo: '3 a 8 semanas',
    icone: FileCheck2,
    itens: [
      'Projeto elétrico, unifilar, aterramento e SPDA',
      'Estudo de curto-circuito, seletividade e coordenação da proteção',
      'Definição do enquadramento: colocalizado, autônomo ou atrás do medidor',
      'Solicitação e parecer de acesso junto à distribuidora',
      'Projeto e aprovação no corpo de bombeiros, conforme a IT do estado',
      'ART de projeto registrada no CREA',
    ],
  },
  {
    fase: 'Fase 3',
    titulo: 'Obra civil e elétrica',
    prazo: '2 a 4 semanas',
    icone: Ruler,
    itens: [
      'Base de concreto verificada para cerca de 1,8 t/m², nivelada e drenada',
      'Via de acesso e área de manobra para içamento de 2,58 t por gabinete',
      'Içamento com plano de rigging e equipe certificada',
      'Infraestrutura elétrica, aterramento e lançamento de cabos',
      'Rede de comunicação Modbus TCP/RTU e link de monitoramento',
    ],
  },
  {
    fase: 'Fase 4',
    titulo: 'Comissionamento',
    prazo: '3 a 7 dias',
    icone: BatteryCharging,
    itens: [
      'Inspeção mecânica, torque marcado e ensaio de isolação com a bateria seccionada',
      'Atualização de firmware do PCS, BMS e EMS antes de qualquer ensaio',
      'Parametrização de rede conforme o parecer de acesso, não conforme o padrão de fábrica',
      'Ensaio de anti-ilhamento com registro do tempo de atuação',
      'Conferência do medidor contra carga conhecida — TC invertido faz o sistema trabalhar ao contrário',
      'Ciclo completo de carga e descarga, com dispersão entre células registrada',
      'Transferência para backup com carga real, cronometrada',
      'Ensaio da detecção de fumaça, calor e gás, e prontidão da supressão',
      'Relatório de comissionamento assinado, como pede a NFPA 855',
    ],
  },
  {
    fase: 'Fase 5',
    titulo: 'Entrega e operação',
    prazo: 'contínuo',
    icone: GraduationCap,
    itens: [
      'As-built elétrico e civil, com todas as parametrizações registradas',
      'ART de execução baixada e entregue',
      'Registro de garantia junto ao fabricante, com números de série',
      'Treinamento da equipe de operação e da brigada de incêndio',
      'Contrato de O&M: termografia, inspeção e acompanhamento remoto',
    ],
  },
];

/* ════════════════════════════════════════════════════════════════════════
   RISCOS
   ════════════════════════════════════════════════════════════════════════
   Severidade e probabilidade avaliadas para instalação industrial no
   Brasil. O que importa na página não é a nota: é a mitigação ao lado.   */
const RISCOS = [
  {
    risco: 'Propagação térmica (thermal runaway)',
    prob: 'Baixa', sev: 'Crítica', icone: Flame,
    mitiga: 'Célula LFP, que é a química mais estável para estacionário. Detecção de fumaça, calor e gás — a de monóxido acusa a liberação antes de haver fumaça visível. Aerossol e supressão a água, alívio de deflagração e afastamento entre gabinetes conforme ensaio UL 9540A.',
  },
  {
    risco: 'Derating por temperatura ambiente',
    prob: 'Média', sev: 'Média', icone: Thermometer,
    mitiga: 'O derating começa em 45 °C e tira potência justo no horário do pico. Implantação com sombreamento, circulação livre e orientação estudada; refrigeração líquida nos packs já é padrão do equipamento.',
  },
  {
    risco: 'Base subdimensionada',
    prob: 'Média', sev: 'Alta', icone: Ruler,
    mitiga: 'São 2.580 kg em 1,05 × 1,40 m, cerca de 1,8 t/m². Verificação estrutural antes da obra, não depois do gabinete chegar no caminhão.',
  },
  {
    risco: 'Parecer de acesso negado ou atrasado',
    prob: 'Média', sev: 'Alta', icone: FileCheck2,
    mitiga: 'Enquadramento definido antes do projeto e consulta prévia à distribuidora. Na geração distribuída, alterar a capacidade instalada de geração pode derrubar o enquadramento tarifário — é o primeiro ponto a verificar.',
  },
  {
    risco: 'Medição invertida no peak shaving',
    prob: 'Média', sev: 'Média', icone: Gauge,
    mitiga: 'TC instalado ao contrário faz o sistema carregar no pico e descarregar no vale. Conferência obrigatória do medidor contra carga conhecida no comissionamento.',
  },
  {
    risco: 'Corrosão em atmosfera agressiva',
    prob: 'Média', sev: 'Alta', icone: ShieldAlert,
    mitiga: 'A classe anticorrosiva padrão é C4. Em litoral, usina de açúcar, frigorífico ou química, especificar C5 na compra — depois do gabinete entregue não se corrige.',
  },
  {
    risco: 'Perda de prazo de garantia',
    prob: 'Alta', sev: 'Média', icone: AlertTriangle,
    mitiga: 'O termo do fabricante dá 90 dias a partir da data da falha para comunicar o defeito. Isso vira rotina do contrato de O&M, com abertura de chamado e relatório de RMA dentro do prazo.',
  },
  {
    risco: 'Ruído junto a divisa ou posto de trabalho',
    prob: 'Baixa', sev: 'Média', icone: Zap,
    mitiga: '70 dB contínuos. Distância de divisa e de área ocupada verificada na escolha do ponto de implantação, antes da obra civil.',
  },
];

const corSev: Record<string, string> = {
  'Crítica': 'bg-red-50 text-red-700 border-red-200',
  'Alta': 'bg-orange-50 text-orange-700 border-orange-200',
  'Média': 'bg-amber-50 text-amber-700 border-amber-200',
  'Baixa': 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

/* ════════════════════════════════════════════════════════════════════════
   ESCOPO QUE VEM JUNTO
   ════════════════════════════════════════════════════════════════════════
   O banco de baterias quase nunca chega sozinho: ele precisa de um ponto
   de conexão, de proteção coordenada e de gente treinada para operar. Tudo
   isso a INNTAG já fabrica e já faz.                                     */
const ESCOPO = [
  {
    icone: Boxes,
    titulo: 'Quadros e QGBT',
    texto: 'O BESS precisa de um ponto de conexão à altura: QGBT novo ou adequação do existente, barramento, proteção e medição dedicadas. São 198,5 A por gabinete — o quadro antigo raramente comporta.',
    itens: ['QGBT e painéis de distribuição', 'Barramento e proteção dimensionados', 'Medição dedicada para o sistema', 'Fabricação própria, com rastreabilidade'],
  },
  {
    icone: Cable,
    titulo: 'Cubículos de média tensão',
    texto: 'Acima de algumas centenas de kW a conexão migra para a média tensão. Entram cubículo de proteção e medição, transformador e a coordenação com a entrada existente.',
    itens: ['Cubículos de proteção e medição', 'Transformador e acessórios', 'Adequação da entrada de energia', 'Comissionamento de MT'],
  },
  {
    icone: Gauge,
    titulo: 'Estudos de engenharia',
    texto: 'Inserir uma fonte que injeta e absorve muda o curto-circuito da planta inteira. A proteção precisa ser recalculada — não é opcional, e é o estudo que mais evita problema depois.',
    itens: ['Curto-circuito e fluxo de potência', 'Seletividade e coordenação da proteção', 'Arc flash e etiquetagem', 'Qualidade de energia e harmônicos'],
  },
  {
    icone: GraduationCap,
    titulo: 'Treinamento',
    texto: 'Banco de lítio exige resposta diferente da que a equipe conhece. Operação, alarme e emergência precisam estar ensaiados antes de acontecer.',
    itens: ['Operação do sistema e leitura de alarmes', 'NR-10 e NR-10 SEP', 'Brigada: emergência com bateria de lítio', 'Procedimentos de bloqueio e sinalização'],
  },
];

/* ════════════════════════════════════════════════════════════════════════ */
export default function ServicosBESSPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="BESS — Banco de Baterias Industrial"
        description="Projeto, instalação e comissionamento de sistemas de armazenamento de energia (BESS) para indústria e comércio. Peak shaving, deslocamento de ponta e backup, com quadros, cubículos, estudos de seletividade e treinamento."
        keywords="BESS, banco de baterias, armazenamento de energia, peak shaving, deslocamento de ponta, redução de demanda contratada, GoodWe, comissionamento BESS, seletividade, cubículo de média tensão, QGBT"
        canonical="/servicos/bess"
        type="service"
        schema={[
          schemas.breadcrumb([
            { name: 'Home', url: '/' },
            { name: 'Serviços', url: '/servicos' },
            { name: 'BESS', url: '/servicos/bess' },
          ]),
          schemas.service(
            'BESS — Sistemas de Armazenamento de Energia',
            'Projeto, instalação e comissionamento de bancos de bateria para indústria: peak shaving, deslocamento de ponta e backup.',
            '/servicos/bess',
          ),
        ]}
      />
      <Navigation />

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative min-h-[88vh] flex items-end pb-20 overflow-hidden bg-neutral-950">
        {/* Fundo: a própria curva de carga, desenhada em escala, servindo de
            imagem. É o assunto da página virando a abertura dela. */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 820 300" preserveAspectRatio="none" className="w-full h-full opacity-[0.17]">
            <defs>
              <linearGradient id="hero-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${CURVA.map((v, h) => `${h === 0 ? 'M' : 'L'}${(h / 23) * 820},${300 - (v / 1340) * 300}`).join(' ')} L820,300 L0,300 Z`}
              fill="url(#hero-g)"
            />
            <path
              d={CURVA.map((v, h) => `${h === 0 ? 'M' : 'L'}${(h / 23) * 820},${300 - (v / 1340) * 300}`).join(' ')}
              fill="none" stroke="#f97316" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/60" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <Surge>
            <Link to="/servicos"
                  className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
              ← Serviços
            </Link>
            <p className="text-orange-400 text-sm uppercase tracking-widest font-semibold mb-4">
              BESS · Armazenamento de energia
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 max-w-4xl leading-[1.04]">
              A energia mais barata<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                é a que você guarda
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mb-10 leading-relaxed">
              Banco de baterias para indústria e comércio: corta o pico de demanda, tira
              o consumo do horário de ponta e sustenta a planta quando a rede cai.
              Projeto, obra, comissionamento e operação com a mesma equipe.
            </p>
          </Surge>

          <Surge delay={120}>
            <div className="flex flex-wrap gap-4">
              <Link to="/contato"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors">
                Solicitar estudo de viabilidade
                <ArrowUpRight size={20} />
              </Link>
              <a href="#peak-shaving"
                 onClick={(e) => {
                   e.preventDefault();
                   const el = document.getElementById('peak-shaving');
                   if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 104, behavior: 'smooth' });
                 }}
                 className="inline-flex items-center gap-2 border border-white/25 hover:border-white/60 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors">
                Ver a conta na prática
                <ArrowDown size={18} />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 md:gap-12 mt-16 max-w-3xl">
              <div>
                <p className="text-2xl md:text-4xl font-bold text-white tabular-nums">&lt;60<span className="text-lg md:text-2xl">ms</span></p>
                <p className="text-white/50 text-xs md:text-sm mt-1">Comutação para backup</p>
              </div>
              <div>
                <p className="text-2xl md:text-4xl font-bold text-white tabular-nums">5,2<span className="text-lg md:text-2xl">MWh</span></p>
                <p className="text-white/50 text-xs md:text-sm mt-1">Por conjunto, em paralelo</p>
              </div>
              <div>
                <p className="text-2xl md:text-4xl font-bold text-white tabular-nums">30<span className="text-lg md:text-2xl">%</span></p>
                <p className="text-white/50 text-xs md:text-sm mt-1">Redução possível do MUST</p>
              </div>
            </div>
          </Surge>
        </div>
      </section>

      <IndiceFixo />

      {/* ───────────────────────── MECANISMO ───────────────────────── */}
      <section id="mecanismo" className="py-24 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-6">
          <Surge>
            <div className="max-w-3xl mb-16">
              <p className="text-orange-500 text-sm uppercase tracking-widest font-semibold mb-4">Como funciona</p>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 leading-tight">
                Três contas diferentes, um mesmo equipamento
              </h2>
              <p className="text-xl text-neutral-600 leading-relaxed">
                Bateria não se vende por kWh. Vende-se por qual linha da fatura ela derruba
                ou qual prejuízo ela evita. Quase sempre as três acontecem juntas no mesmo
                sistema — e é por isso que o estudo tem que vir antes do orçamento.
              </p>
            </div>
          </Surge>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: '01', t: 'Demanda', i: Gauge,
                d: 'A conta cobra a maior potência que a planta pediu no mês. Uma única hora define a demanda contratada do ano seguinte. A bateria cobre o excedente e o contrato cai.',
              },
              {
                n: '02', t: 'Ponta', i: Zap,
                d: 'Nas três horas de ponta o kWh custa cerca de quatro vezes mais. Carregar de madrugada e devolver nesse intervalo é comprar barato para consumir caro.',
              },
              {
                n: '03', t: 'Continuidade', i: BatteryCharging,
                d: 'Comutação abaixo de 60 ms sustenta carga sensível sem transitório. Para quem já perdeu batelada por queda de energia, esse é o argumento que fecha.',
              },
            ].map((c, k) => (
              <Surge key={c.n} delay={k * 90}>
                <div className="h-full rounded-3xl border border-neutral-200 p-8 hover:border-neutral-300 hover:shadow-lg transition-all duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold tracking-widest text-neutral-400">{c.n}</span>
                    <c.i className="text-orange-500" size={22} />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">{c.t}</h3>
                  <p className="text-neutral-600 leading-relaxed">{c.d}</p>
                </div>
              </Surge>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── GRÁFICOS ───────────────────────── */}
      <section id="peak-shaving" className="py-16 scroll-mt-28 bg-neutral-50/70">
        <div className="max-w-7xl mx-auto px-6">
          <Surge>
            <div className="max-w-3xl mb-10">
              <p className="text-orange-500 text-sm uppercase tracking-widest font-semibold mb-4">Simulações</p>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 leading-tight">
                Mexa nos controles
              </h2>
              <p className="text-xl text-neutral-600 leading-relaxed">
                Os dois gráficos abaixo usam uma curva de carga industrial típica e os números
                reais do equipamento. Arraste e veja quantos gabinetes cada cenário exige —
                é exatamente a conta que fazemos no estudo de viabilidade, com a sua curva.
              </p>
            </div>
          </Surge>
          <Surge delay={80}><GraficoPeakShaving /></Surge>
        </div>
      </section>

      <section id="ponta" className="py-16 pb-24 scroll-mt-28 bg-neutral-50/70">
        <div className="max-w-7xl mx-auto px-6">
          <Surge><GraficoPonta /></Surge>
        </div>
      </section>

      {/* ───────────────────────── EQUIPAMENTO ───────────────────────── */}
      <section id="equipamento" className="py-24 scroll-mt-28 bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <Surge>
            <div className="max-w-3xl mb-16">
              <p className="text-orange-400 text-sm uppercase tracking-widest font-semibold mb-4">Equipamento</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                All-in-one, com tudo dentro do mesmo gabinete
              </h2>
              <p className="text-xl text-white/60 leading-relaxed">
                Conversor, bateria, BMS, EMS, climatização e combate a incêndio integrados de
                fábrica e ensaiados juntos. Chega montado, o que encurta obra e tira do projeto
                a integração que normalmente dá problema em campo.
              </p>
            </div>
          </Surge>

          <div className="grid lg:grid-cols-3 gap-6">
            <Surge className="lg:col-span-2">
              <div className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="px-6 md:px-8 py-5 border-b border-white/10">
                  <p className="text-xs uppercase tracking-widest text-white/40 font-bold mb-1">Referência de projeto</p>
                  <h3 className="text-xl font-bold">GoodWe ESA · 125 kW / 261 kWh</h3>
                </div>
                <div className="divide-y divide-white/10">
                  {[
                    ['Química da célula', 'LFP (LiFePO₄) · 314 Ah'],
                    ['Energia utilizável', '261,25 kWh por gabinete'],
                    ['Tensão nominal do banco', '832 V · faixa 676 a 936 V'],
                    ['Potência nominal CA', '125 kW · 137,5 kW máx. em 400 V'],
                    ['Saída', '400 / 380 V · 3L / N / PE · 50 ou 60 Hz'],
                    ['Rendimento', '98,6% no conversor · 92,0% de sistema'],
                    ['Comutação carga/descarga', 'menos de 60 ms'],
                    ['Refrigeração', 'líquida nos módulos · ventilação forçada no conversor'],
                    ['Temperatura de operação', '−25 °C a +55 °C · derating a partir de 45 °C'],
                    ['Proteção e corrosão', 'IP54 · classe C4, com C5 opcional'],
                    ['Segurança', 'aerossol e supressão a água · alívio de deflagração opcional'],
                    ['Dimensões e peso', '1.050 × 2.250 × 1.400 mm · 2.580 kg'],
                    ['Ruído', '70 dB'],
                    ['Expansão', 'até 20 gabinetes em paralelo · 2,5 MW / 5,22 MWh'],
                    ['Comunicação', 'Modbus TCP e Modbus RTU'],
                  ].map(([k, v]) => (
                    <div key={k} className="px-6 md:px-8 py-3.5 flex flex-wrap gap-x-6 gap-y-1 justify-between">
                      <span className="text-white/50 text-sm">{k}</span>
                      <span className="text-sm font-semibold tabular-nums text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Surge>

            <Surge delay={100}>
              <div className="h-full grid gap-6 content-start">
                <div className="rounded-3xl bg-orange-500 p-8">
                  <h3 className="text-xl font-bold mb-3">Também em porte menor</h3>
                  <p className="text-white/90 leading-relaxed text-[15px]">
                    Para comércio e indústria de menor porte há a versão de 30 kW / 60 kWh,
                    com inversor híbrido e banco em gabinete externo climatizado. E para
                    residência e backup, a linha de alta e baixa tensão, de 5,4 a 32,4 kWh.
                  </p>
                </div>
                <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
                  <h3 className="text-lg font-bold mb-4">O que isso quer dizer na obra</h3>
                  <ul className="space-y-3 text-[15px] text-white/70">
                    {[
                      '2,58 t em 1,47 m² exigem base verificada e plano de içamento',
                      'Derating a 45 °C pede sombreamento e circulação, não só espaço',
                      '70 dB definem a distância de divisa e de posto de trabalho',
                      'C4 de série: ambiente agressivo pede C5 especificado na compra',
                    ].map((t) => (
                      <li key={t} className="flex gap-3">
                        <CheckCircle2 size={17} className="text-orange-400 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Surge>
          </div>
        </div>
      </section>

      {/* ───────────────────────── ROTEIRO ───────────────────────── */}
      <section id="roteiro" className="py-24 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-6">
          <Surge>
            <div className="max-w-3xl mb-16">
              <p className="text-orange-500 text-sm uppercase tracking-widest font-semibold mb-4">Roteiro</p>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 leading-tight">
                Da medição ao termo de aceite
              </h2>
              <p className="text-xl text-neutral-600 leading-relaxed">
                Cinco fases, nesta ordem. O comissionamento não é ligar e ver se acende:
                é um protocolo com ensaio, medição e relatório assinado — o documento que
                sustenta a garantia e responde pela instalação se algo acontecer.
              </p>
            </div>
          </Surge>

          <div className="grid gap-5">
            {ROTEIRO.map((f, k) => (
              <Surge key={f.fase} delay={k * 60}>
                <div className="grid md:grid-cols-[260px_1fr] gap-6 md:gap-10 rounded-3xl border border-neutral-200 p-7 md:p-9 hover:border-neutral-300 transition-colors duration-500">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <f.icone size={19} className="text-orange-600" />
                      </div>
                      <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">{f.fase}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-900 leading-tight mb-2">{f.titulo}</h3>
                    <p className="text-sm text-neutral-500">{f.prazo}</p>
                  </div>
                  <ul className="grid gap-2.5 content-start">
                    {f.itens.map((i) => (
                      <li key={i} className="flex gap-3 text-neutral-600 leading-relaxed">
                        <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Surge>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── RISCOS ───────────────────────── */}
      <section id="riscos" className="py-24 scroll-mt-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6">
          <Surge>
            <div className="max-w-3xl mb-16">
              <p className="text-orange-500 text-sm uppercase tracking-widest font-semibold mb-4">Análise de riscos</p>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 leading-tight">
                O que pode dar errado — e o que fazemos antes
              </h2>
              <p className="text-xl text-neutral-600 leading-relaxed">
                Nenhum fornecedor sério entrega banco de bateria sem falar disto. Cada risco
                abaixo tem uma mitigação que entra no projeto, na obra ou no contrato de
                operação. O que não está mapeado é o que custa caro depois.
              </p>
            </div>
          </Surge>

          <div className="grid md:grid-cols-2 gap-5">
            {RISCOS.map((r, k) => (
              <Surge key={r.risco} delay={(k % 2) * 70}>
                <div className="h-full rounded-3xl bg-white border border-neutral-200 p-7">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                      <r.icone size={18} className="text-neutral-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-neutral-900 leading-snug mb-2">{r.risco}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${corSev[r.sev]}`}>
                          Severidade {r.sev}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-neutral-100 text-neutral-600 border-neutral-200">
                          Probabilidade {r.prob}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-neutral-600 leading-relaxed text-[15px]">{r.mitiga}</p>
                </div>
              </Surge>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── ESCOPO ───────────────────────── */}
      <section id="escopo" className="py-24 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-6">
          <Surge>
            <div className="max-w-3xl mb-16">
              <p className="text-orange-500 text-sm uppercase tracking-widest font-semibold mb-4">Escopo completo</p>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 leading-tight">
                O banco de bateria nunca chega sozinho
              </h2>
              <p className="text-xl text-neutral-600 leading-relaxed">
                Ele precisa de um ponto de conexão dimensionado, de proteção recalculada e de
                equipe treinada para operar. Tudo isso a INNTAG já fabrica e já faz há mais de
                dezessete anos — e por isso o projeto inteiro sai de uma casa só.
              </p>
            </div>
          </Surge>

          <div className="grid md:grid-cols-2 gap-6">
            {ESCOPO.map((e, k) => (
              <Surge key={e.titulo} delay={(k % 2) * 80}>
                <div className="h-full rounded-3xl border border-neutral-200 p-8 hover:border-neutral-300 hover:shadow-lg transition-all duration-500">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-6">
                    <e.icone size={22} className="text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">{e.titulo}</h3>
                  <p className="text-neutral-600 leading-relaxed mb-6">{e.texto}</p>
                  <ul className="grid gap-2.5 pt-6 border-t border-neutral-200">
                    {e.itens.map((i) => (
                      <li key={i} className="flex gap-3 text-[15px] text-neutral-700">
                        <CheckCircle2 size={17} className="text-orange-500 shrink-0 mt-0.5" />
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Surge>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <section className="py-24 bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Surge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Comece pela medição
            </h2>
            <p className="text-xl text-white/60 mb-10 leading-relaxed">
              Sem a curva de carga real, qualquer número de bateria é chute. Instalamos o
              analisador na sua planta e devolvemos o estudo com dimensionamento, retorno e
              o escopo completo de obra.
            </p>
            <Link to="/contato"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors">
              Solicitar estudo de viabilidade
              <ArrowUpRight size={20} />
            </Link>
          </Surge>
        </div>
      </section>

      <Footer />
    </div>
  );
}
