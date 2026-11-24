import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';
import { SEO, schemas } from '@/react-app/components/SEO';
import { ChevronRight } from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════════
   LINGUAGEM VISUAL
   ════════════════════════════════════════════════════════════════════════
   A régua aqui é a página de produto da Apple, e ela se resume a quatro
   decisões que quase toda página comercial quebra:

   1. A TIPOGRAFIA CARREGA A PÁGINA. Títulos grandes, peso semibold,
      entrelinha curta e tracking negativo. Nada de caixa-alta colorida
      anunciando cada seção.
   2. COR SÓ NO DADO. O cinza #f5f5f7 separa as seções; o texto é #1d1d1f
      e #6e6e73. O laranja da marca aparece em dois lugares: na área do
      gráfico e no botão principal. Em mais nenhum.
   3. CARTÃO NÃO TEM BORDA NEM SOMBRA. É um bloco cinza de canto largo. A
      borda fininha em volta de tudo é o que faz uma página parecer um
      painel administrativo.
   4. ESPAÇO É CONTEÚDO. Respiro vertical grande e uma ideia por tela.

   As cores vão em literal mesmo: são desta página, e virar token no
   Tailwind do site inteiro só para cá seria espalhar o que é local.      */
const TINTA = '#1d1d1f';
const CINZA = '#6e6e73';
const CLARO = '#86868b';
const CHAO = '#f5f5f7';
const MARCA = '#e0432a';

/* ════════════════════════════════════════════════════════════════════════
   CURVA DE CARGA DE REFERÊNCIA
   ════════════════════════════════════════════════════════════════════════
   Perfil horário de uma planta industrial em kW, das 0h às 23h. Não é de
   um cliente: é a forma típica de quem soma turno administrativo e
   produção, com o pico empurrado para o começo da noite.                 */
const CURVA = [
  420, 400, 395, 390, 400, 430, 520, 640, 780, 880, 930, 950,
  900, 870, 910, 940, 960, 980, 1180, 1240, 1190, 820, 600, 480,
];

/* A ponta é definida pela distribuidora, em três horas consecutivas. */
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
   O QUE JÁ ESTÁ NA TELA NÃO ESPERA OBSERVADOR
   Deixar tudo em opacidade zero até o IntersectionObserver responder
   funciona para o que vem depois — e deixa a abertura preta, porque para
   o que nasce acima da dobra não houve mudança de visibilidade nenhuma
   para observar.
   ──────────────────────────────────────────────────────────────────────── */
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
      { rootMargin: '0px 0px -10% 0px' },
    );
    obs.observe(el);
    const prazo = window.setTimeout(() => { setVisivel(true); obs.disconnect(); }, 2500);
    return () => { window.clearTimeout(prazo); obs.disconnect(); };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? 'none' : 'translateY(22px)',
        transition: `opacity .9s cubic-bezier(.28,.11,.32,1) ${delay}ms, transform .9s cubic-bezier(.28,.11,.32,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   BARRA LOCAL
   Fina, translúcida, com o nome do assunto à esquerda e links pequenos em
   cinza — o ativo escurece. Sem pílula preta: marcar a seção não precisa
   de um bloco de cor atravessando a barra.
   ──────────────────────────────────────────────────────────────────────── */
const SECOES = [
  { id: 'mecanismo', rotulo: 'Visão geral' },
  { id: 'peak-shaving', rotulo: 'Demanda' },
  { id: 'ponta', rotulo: 'Ponta' },
  { id: 'equipamento', rotulo: 'Equipamento' },
  { id: 'roteiro', rotulo: 'Instalação' },
  { id: 'riscos', rotulo: 'Riscos' },
  { id: 'escopo', rotulo: 'Escopo' },
];

function irPara(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' });
}

function BarraLocal() {
  const [ativa, setAtiva] = useState('');
  const trilhoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvos = SECOES
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => !!e);
    if (!alvos.length) return;

    const obs = new IntersectionObserver(
      (entradas) => {
        /* Com duas seções na tela, a ativa é a de cima: marcar a de baixo
           faria o índice andar na frente de quem lê. */
        const visiveis = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visiveis[0]) setAtiva(visiveis[0].target.id);
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 },
    );
    alvos.forEach((a) => obs.observe(a));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const trilho = trilhoRef.current;
    const alvo = trilho?.querySelector<HTMLElement>(`[data-id="${ativa}"]`);
    if (!trilho || !alvo) return;
    trilho.scrollTo({
      left: Math.max(0, alvo.offsetLeft - trilho.clientWidth / 2 + alvo.clientWidth / 2),
      behavior: 'smooth',
    });
  }, [ativa]);

  return (
    <div
      className="sticky top-[72px] z-40 border-b"
      style={{
        background: 'rgba(255,255,255,.72)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderColor: 'rgba(0,0,0,.08)',
      }}
    >
      <div className="max-w-[1024px] mx-auto px-6 h-[52px] flex items-center gap-6">
        <span className="text-[21px] font-semibold tracking-[-0.02em] shrink-0" style={{ color: TINTA }}>
          BESS
        </span>
        <div
          ref={trilhoRef}
          className="flex-1 min-w-0 flex items-center gap-6 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {SECOES.map((s) => (
            <button
              key={s.id}
              data-id={s.id}
              onClick={() => irPara(s.id)}
              className="whitespace-nowrap text-[12px] transition-colors duration-300 hover:opacity-70"
              style={{
                color: ativa === s.id ? TINTA : CINZA,
                fontWeight: ativa === s.id ? 600 : 400,
              }}
            >
              {s.rotulo}
            </button>
          ))}
        </div>
        <Link
          to="/contato"
          className="shrink-0 rounded-full px-[14px] py-[5px] text-[12px] font-medium text-white transition-opacity hover:opacity-85"
          style={{ background: MARCA }}
        >
          Falar com a engenharia
        </Link>
      </div>
    </div>
  );
}

/* Links de texto com chevron — a forma como a Apple encadeia uma ação
   secundária depois da principal. */
function LinkSeta({ children, para, aoClicar }: {
  children: React.ReactNode; para?: string; aoClicar?: () => void;
}) {
  const conteudo = (
    <span className="inline-flex items-center gap-0.5 text-[17px] group">
      {children}
      <ChevronRight size={16} className="mt-[1px] transition-transform duration-300 group-hover:translate-x-0.5" />
    </span>
  );
  if (para) return <Link to={para} style={{ color: MARCA }}>{conteudo}</Link>;
  return <button onClick={aoClicar} style={{ color: MARCA }}>{conteudo}</button>;
}

/* Número grande com legenda pequena embaixo. */
function Cifra({ valor, unidade, legenda, destaque = false }: {
  valor: string; unidade?: string; legenda: string; destaque?: boolean;
}) {
  return (
    <div>
      <p
        className="text-[34px] md:text-[40px] font-semibold tracking-[-0.03em] leading-none tabular-nums whitespace-nowrap"
        style={{ color: destaque ? MARCA : TINTA }}
      >
        {valor}
        {unidade && (
          <span className="text-[18px] md:text-[21px] font-medium ml-1" style={{ color: destaque ? MARCA : CLARO }}>
            {unidade}
          </span>
        )}
      </p>
      <p className="text-[13px] mt-2.5 leading-snug" style={{ color: CINZA }}>{legenda}</p>
    </div>
  );
}

/* Faixa de controle: rótulo à esquerda, valor à direita, barra embaixo. */
function Controle({ id, rotulo, valor, min, max, passo, onChange, atual }: {
  id: string; rotulo: string; valor: string;
  min: number; max: number; passo: number;
  onChange: (n: number) => void; atual: number;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <label htmlFor={id} className="text-[14px]" style={{ color: CINZA }}>{rotulo}</label>
        <span className="text-[15px] font-semibold tabular-nums" style={{ color: TINTA }}>{valor}</span>
      </div>
      <input
        id={id} type="range" min={min} max={max} step={passo} value={atual}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: MARCA, background: '#e8e8ed' }}
      />
    </div>
  );
}

/* Geometria comum aos dois gráficos. */
const L = 860, A = 300, mE = 42, mD = 16, mT = 24, mB = 28;
const px = (h: number) => mE + (h / 23) * (L - mE - mD);
const py = (kw: number) => mT + (1 - kw / (PICO * 1.1)) * (A - mT - mB);
const CHAO_Y = py(0);

function Eixos() {
  return (
    <>
      {[0, 600, 1200].map((kw) => (
        <g key={kw}>
          <line x1={mE} y1={py(kw)} x2={L - mD} y2={py(kw)} stroke="#e8e8ed" strokeWidth="1" />
          <text x={mE - 10} y={py(kw) + 4} textAnchor="end" fontSize="11" fill={CLARO}>{kw}</text>
        </g>
      ))}
      {[0, 6, 12, 18, 23].map((h) => (
        <text key={h} x={px(h)} y={A - 8} textAnchor="middle" fontSize="11" fill={CLARO}>
          {String(h).padStart(2, '0')}h
        </text>
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SIMULAÇÃO 1 — DEMANDA
   ════════════════════════════════════════════════════════════════════════
   A conta de luz cobra também a maior potência que a planta pediu no mês.
   Uma única hora de pico define a demanda contratada do ano seguinte.    */
function SimuladorDemanda() {
  const [limite, setLimite] = useState(950);
  const [tarifa, setTarifa] = useState(38);

  const c = useMemo(() => {
    const excedentes = CURVA.map((v) => Math.max(0, v - limite));
    const energia = excedentes.reduce((a, b) => a + b, 0);
    const potencia = Math.max(...excedentes);
    const reducao = Math.max(0, PICO - limite);
    const horas = excedentes.filter((v) => v > 0).length;
    const porPotencia = Math.ceil(potencia / GABINETE_KW);
    const porEnergia = Math.ceil(energia / (GABINETE_KWH * DOD));
    return {
      energia, potencia, reducao, horas, porPotencia, porEnergia,
      gabinetes: Math.max(porPotencia, porEnergia, potencia > 0 ? 1 : 0),
      /* Demanda é cobrada por mês; mostrar o ano aqui seria inflar o número
         para um período que a fatura não usa. */
      economia: reducao * tarifa,
      limitante: porEnergia > porPotencia ? 'energia' : 'potência',
    };
  }, [limite, tarifa]);

  const linha = CURVA.map((v, h) => `${h === 0 ? 'M' : 'L'}${px(h).toFixed(1)},${py(v).toFixed(1)}`).join(' ');

  const acima = useMemo(() => {
    const partes: string[] = [];
    let atual: string[] = [];
    CURVA.forEach((v, h) => {
      if (v > limite) {
        if (!atual.length) atual.push(`M${px(h).toFixed(1)},${py(limite).toFixed(1)}`);
        atual.push(`L${px(h).toFixed(1)},${py(v).toFixed(1)}`);
      } else if (atual.length) {
        atual.push(`L${px(h - 1).toFixed(1)},${py(limite).toFixed(1)} Z`);
        partes.push(atual.join(' '));
        atual = [];
      }
    });
    if (atual.length) {
      atual.push(`L${px(23).toFixed(1)},${py(limite).toFixed(1)} Z`);
      partes.push(atual.join(' '));
    }
    return partes.join(' ');
  }, [limite]);

  return (
    <div className="rounded-[28px] bg-white overflow-hidden">
      <div className="px-7 md:px-14 pt-12 md:pt-16">
        <h3 className="text-[32px] md:text-[44px] font-semibold tracking-[-0.025em] leading-[1.08]" style={{ color: TINTA }}>
          Corte o pico.<br />O contrato cai junto.
        </h3>
        <p className="text-[17px] md:text-[19px] mt-4 max-w-[46ch] leading-[1.45]" style={{ color: CINZA }}>
          Arraste o limite de demanda. Tudo que fica acima da linha é o que a bateria
          entrega no lugar da rede.
        </p>
      </div>

      <div className="px-2 md:px-10 mt-8">
        <svg viewBox={`0 0 ${L} ${A}`} className="w-full h-auto" role="img"
             aria-label={`Curva de carga diária com pico de ${PICO} kW e limite de demanda em ${limite} kW`}>
          <defs>
            <linearGradient id="dm-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d1d1f" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#1d1d1f" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="dm-corte" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MARCA} stopOpacity="1" />
              <stop offset="100%" stopColor={MARCA} stopOpacity="0.55" />
            </linearGradient>
          </defs>

          <Eixos />
          <path d={`${linha} L${px(23).toFixed(1)},${CHAO_Y} L${px(0).toFixed(1)},${CHAO_Y} Z`} fill="url(#dm-base)" />
          <path d={acima} fill="url(#dm-corte)" />
          <path d={linha} fill="none" stroke={TINTA} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
          <line x1={mE} y1={py(limite)} x2={L - mD} y2={py(limite)}
                stroke={MARCA} strokeWidth="1.2" strokeDasharray="1 4" strokeLinecap="round" />
          <text x={mE + 2} y={py(limite) - 9} fontSize="12" fill={MARCA} fontWeight="600">
            {limite} kW contratados
          </text>
        </svg>
      </div>

      <div className="px-7 md:px-14 pt-6 grid gap-7 sm:grid-cols-2">
        <Controle id="dm-limite" rotulo="Demanda contratada" valor={`${limite} kW`}
                  min={VALE} max={PICO} passo={10} atual={limite} onChange={setLimite} />
        <Controle id="dm-tarifa" rotulo="Tarifa de demanda" valor={`${real(tarifa)}/kW`}
                  min={15} max={80} passo={1} atual={tarifa} onChange={setTarifa} />
      </div>

      <div className="mt-12 mx-7 md:mx-14 pt-10 border-t" style={{ borderColor: '#e8e8ed' }}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.75fr_1.45fr]">
          <Cifra valor={numero(c.reducao)} unidade="kW"
                 legenda={`Pico cortado, de ${PICO} kW para ${limite} kW`} />
          <Cifra valor={numero(c.energia)} unidade="kWh"
                 legenda={c.horas === 0 ? 'Nenhuma hora acima do limite' : `Por dia, ao longo de ${c.horas} horas`} />
          <Cifra valor={String(c.gabinetes)}
                 legenda={c.gabinetes > 0
                   ? `Gabinetes, limitados por ${c.limitante}`
                   : 'Gabinetes: o pico já cabe no contrato'} />
          <Cifra valor={real(c.economia)} destaque
                 legenda={`Por mês, só na parcela de demanda · ${real(c.economia * 12)} no ano`} />
        </div>
      </div>

      <p className="px-7 md:px-14 py-10 text-[12px] leading-[1.6]" style={{ color: CLARO }}>
        A quantidade de gabinetes é o maior entre o necessário por potência instantânea
        ({c.porPotencia} × {GABINETE_KW} kW) e por energia ({c.porEnergia} × {numero(GABINETE_KWH, 2)} kWh
        a {DOD * 100}% de profundidade de descarga). A economia considera apenas a redução da demanda
        contratada, sem contar ultrapassagens evitadas. Curva de carga ilustrativa — o número do seu
        caso sai da campanha de medição.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SIMULAÇÃO 2 — PONTA
   ════════════════════════════════════════════════════════════════════════
   Aqui não se corta consumo: muda-se a hora dele. E o detalhe que quase
   toda planilha esquece é que o ciclo tem perda — ela volta como energia
   comprada a mais.                                                       */
function SimuladorPonta() {
  const [deslocado, setDeslocado] = useState(60);
  const [tPonta, setTPonta] = useState(2.2);
  const [tFora, setTFora] = useState(0.55);

  const c = useMemo(() => {
    const fracao = deslocado / 100;
    const movida = PONTA.reduce((a, h) => a + CURVA[h], 0) * fracao;
    const recarga = movida / EFICIENCIA;
    const potencia = Math.max(...PONTA.map((h) => CURVA[h])) * fracao;
    const dia = movida * tPonta - recarga * tFora;
    return {
      movida, recarga, potencia,
      perda: recarga - movida,
      ano: dia * DIAS_UTEIS * 12,
      mes: dia * DIAS_UTEIS,
      gabinetes: Math.max(
        Math.ceil(potencia / GABINETE_KW),
        Math.ceil(movida / (GABINETE_KWH * DOD)),
        movida > 0 ? 1 : 0,
      ),
    };
  }, [deslocado, tPonta, tFora]);

  const horasRecarga = [1, 2, 3, 4, 5];
  const depois = CURVA.map((v, h) => {
    if (PONTA.includes(h)) return v * (1 - deslocado / 100);
    if (horasRecarga.includes(h)) return v + c.recarga / horasRecarga.length;
    return v;
  });

  const caminho = (d: number[]) =>
    d.map((v, h) => `${h === 0 ? 'M' : 'L'}${px(h).toFixed(1)},${py(v).toFixed(1)}`).join(' ');

  return (
    <div className="rounded-[28px] bg-white overflow-hidden">
      <div className="px-7 md:px-14 pt-12 md:pt-16">
        <h3 className="text-[32px] md:text-[44px] font-semibold tracking-[-0.025em] leading-[1.08]" style={{ color: TINTA }}>
          Compre barato.<br />Consuma caro.
        </h3>
        <p className="text-[17px] md:text-[19px] mt-4 max-w-[46ch] leading-[1.45]" style={{ color: CINZA }}>
          A linha pontilhada é hoje. A cheia é depois: a ponta desce e a madrugada sobe.
        </p>
      </div>

      <div className="px-2 md:px-10 mt-8">
        <svg viewBox={`0 0 ${L} ${A}`} className="w-full h-auto" role="img"
             aria-label={`Curva de carga antes e depois de deslocar ${deslocado}% do consumo das 18h às 21h`}>
          <defs>
            <linearGradient id="pt-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d1d1f" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#1d1d1f" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect x={px(PONTA[0])} y={mT} width={px(PONTA[PONTA.length - 1] + 1) - px(PONTA[0])}
                height={CHAO_Y - mT} fill={MARCA} opacity="0.06" />
          <text x={(px(PONTA[0]) + px(PONTA[PONTA.length - 1] + 1)) / 2} y={mT - 8}
                textAnchor="middle" fontSize="12" fill={MARCA} fontWeight="600">
            Ponta · 18h às 21h
          </text>

          <Eixos />
          <path d={`${caminho(depois)} L${px(23).toFixed(1)},${CHAO_Y} L${px(0).toFixed(1)},${CHAO_Y} Z`}
                fill="url(#pt-base)" />
          <path d={caminho(CURVA)} fill="none" stroke={CLARO} strokeWidth="1.2"
                strokeDasharray="1 4" strokeLinecap="round" />
          <path d={caminho(depois)} fill="none" stroke={TINTA} strokeWidth="1.8"
                strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>

      <div className="px-7 md:px-14 pt-6 grid gap-7 sm:grid-cols-3">
        <Controle id="pt-desloc" rotulo="Da ponta deslocado" valor={`${deslocado}%`}
                  min={0} max={100} passo={5} atual={deslocado} onChange={setDeslocado} />
        <Controle id="pt-tp" rotulo="Tarifa na ponta" valor={`R$ ${numero(tPonta, 2)}`}
                  min={1} max={4} passo={0.05} atual={tPonta} onChange={setTPonta} />
        <Controle id="pt-tf" rotulo="Fora de ponta" valor={`R$ ${numero(tFora, 2)}`}
                  min={0.2} max={1.2} passo={0.05} atual={tFora} onChange={setTFora} />
      </div>

      <div className="mt-12 mx-7 md:mx-14 pt-10 border-t" style={{ borderColor: '#e8e8ed' }}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.75fr_1.45fr]">
          <Cifra valor={numero(c.movida)} unidade="kWh" legenda="Energia tirada da ponta, por dia útil" />
          <Cifra valor={numero(c.recarga)} unidade="kWh"
                 legenda={`Recarga necessária · ${numero(c.perda)} kWh viram perda no ciclo`} />
          <Cifra valor={String(c.gabinetes)} legenda={`Gabinetes · ${numero(c.potencia)} kW na ponta`} />
          <Cifra valor={real(c.ano)} destaque legenda={`Por ano · ${real(c.mes)} por mês`} />
        </div>
      </div>

      <p className="px-7 md:px-14 py-10 text-[12px] leading-[1.6]" style={{ color: CLARO }}>
        Com eficiência de sistema de {EFICIENCIA * 100}%, cada kWh entregue na ponta exige{' '}
        {numero(1 / EFICIENCIA, 3)} kWh comprados fora dela — a conta acima já desconta isso, e é
        o que falta em quase toda planilha. Impostos, bandeiras e a parcela de demanda ficam de
        fora; entram no estudo final. Base de {DIAS_UTEIS} dias úteis por mês.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
const ROTEIRO = [
  {
    fase: 'Fase 1', titulo: 'Medição e dimensionamento', prazo: '2 a 5 semanas',
    itens: [
      'Analisador de energia instalado de 7 a 30 dias, registrando a curva real',
      'Leitura de 12 faturas: posto tarifário, demanda contratada, ultrapassagens',
      'Dimensionamento por potência e por energia, a 90% de profundidade de descarga',
      'Simulação de retorno com a degradação da bateria ao longo da garantia',
    ],
  },
  {
    fase: 'Fase 2', titulo: 'Engenharia e regulatório', prazo: '3 a 8 semanas',
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
    fase: 'Fase 3', titulo: 'Obra civil e elétrica', prazo: '2 a 4 semanas',
    itens: [
      'Base de concreto verificada para cerca de 1,8 t/m², nivelada e drenada',
      'Via de acesso e área de manobra para içamento de 2,58 t por gabinete',
      'Içamento com plano de rigging e equipe certificada',
      'Infraestrutura elétrica, aterramento e lançamento de cabos',
      'Rede de comunicação Modbus TCP/RTU e link de monitoramento',
    ],
  },
  {
    fase: 'Fase 4', titulo: 'Comissionamento', prazo: '3 a 7 dias',
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
    fase: 'Fase 5', titulo: 'Entrega e operação', prazo: 'contínuo',
    itens: [
      'As-built elétrico e civil, com todas as parametrizações registradas',
      'ART de execução baixada e entregue',
      'Registro de garantia junto ao fabricante, com números de série',
      'Treinamento da equipe de operação e da brigada de incêndio',
      'Contrato de O&M: termografia, inspeção e acompanhamento remoto',
    ],
  },
];

const RISCOS = [
  {
    risco: 'Propagação térmica', prob: 'Baixa', sev: 'Crítica',
    mitiga: 'Célula LFP, a química mais estável para estacionário. Detecção de fumaça, calor e gás — a de monóxido acusa a liberação antes de haver fumaça visível. Aerossol e supressão a água, alívio de deflagração e afastamento entre gabinetes conforme ensaio UL 9540A.',
  },
  {
    risco: 'Derating por temperatura', prob: 'Média', sev: 'Média',
    mitiga: 'O derating começa em 45 °C e tira potência justo no horário do pico. Implantação com sombreamento, circulação livre e orientação estudada; a refrigeração líquida nos módulos já é padrão do equipamento.',
  },
  {
    risco: 'Base subdimensionada', prob: 'Média', sev: 'Alta',
    mitiga: 'São 2.580 kg em 1,05 × 1,40 m, cerca de 1,8 t/m². Verificação estrutural antes da obra, não depois de o gabinete chegar no caminhão.',
  },
  {
    risco: 'Parecer de acesso negado', prob: 'Média', sev: 'Alta',
    mitiga: 'Enquadramento definido antes do projeto e consulta prévia à distribuidora. Na geração distribuída, alterar a capacidade instalada de geração pode derrubar o enquadramento tarifário — é o primeiro ponto a verificar.',
  },
  {
    risco: 'Medição invertida', prob: 'Média', sev: 'Média',
    mitiga: 'TC instalado ao contrário faz o sistema carregar no pico e descarregar no vale. Conferência obrigatória do medidor contra carga conhecida no comissionamento.',
  },
  {
    risco: 'Corrosão em atmosfera agressiva', prob: 'Média', sev: 'Alta',
    mitiga: 'A classe anticorrosiva padrão é C4. Em litoral, usina de açúcar, frigorífico ou química, especificar C5 na compra — depois de entregue não se corrige.',
  },
  {
    risco: 'Perda de prazo de garantia', prob: 'Alta', sev: 'Média',
    mitiga: 'O termo do fabricante dá 90 dias a partir da data da falha para comunicar o defeito. Isso vira rotina do contrato de O&M, com abertura de chamado e relatório de RMA dentro do prazo.',
  },
  {
    risco: 'Ruído junto a divisa', prob: 'Baixa', sev: 'Média',
    mitiga: '70 dB contínuos. Distância de divisa e de área ocupada verificada na escolha do ponto de implantação, antes da obra civil.',
  },
];

const ESCOPO = [
  {
    titulo: 'Quadros e QGBT',
    texto: 'O banco precisa de um ponto de conexão à altura: QGBT novo ou adequação do existente, barramento, proteção e medição dedicadas. São 198,5 A por gabinete — o quadro antigo raramente comporta.',
    itens: ['QGBT e painéis de distribuição', 'Barramento e proteção dimensionados', 'Medição dedicada ao sistema', 'Fabricação própria, com rastreabilidade'],
  },
  {
    titulo: 'Cubículos de média tensão',
    texto: 'Acima de algumas centenas de kW a conexão migra para a média tensão. Entram cubículo de proteção e medição, transformador e a coordenação com a entrada existente.',
    itens: ['Cubículos de proteção e medição', 'Transformador e acessórios', 'Adequação da entrada de energia', 'Comissionamento de média tensão'],
  },
  {
    titulo: 'Estudos de engenharia',
    texto: 'Inserir uma fonte que injeta e absorve muda o curto-circuito da planta inteira. A proteção precisa ser recalculada — é o estudo que mais evita problema depois.',
    itens: ['Curto-circuito e fluxo de potência', 'Seletividade e coordenação da proteção', 'Arc flash e etiquetagem', 'Qualidade de energia e harmônicos'],
  },
  {
    titulo: 'Treinamento',
    texto: 'Banco de lítio exige resposta diferente da que a equipe conhece. Operação, alarme e emergência precisam estar ensaiados antes de acontecer.',
    itens: ['Operação do sistema e leitura de alarmes', 'NR-10 e NR-10 SEP', 'Brigada: emergência com bateria de lítio', 'Bloqueio e sinalização'],
  },
];

const FICHA: [string, string][] = [
  ['Química da célula', 'LFP (LiFePO₄) · 314 Ah'],
  ['Energia utilizável', '261,25 kWh por gabinete'],
  ['Tensão nominal', '832 V · faixa de 676 a 936 V'],
  ['Potência nominal', '125 kW · 137,5 kW máx. em 400 V'],
  ['Saída', '400 / 380 V · 3L / N / PE · 50 ou 60 Hz'],
  ['Rendimento', '98,6% no conversor · 92,0% de sistema'],
  ['Comutação', 'menos de 60 ms'],
  ['Refrigeração', 'líquida nos módulos · ar forçado no conversor'],
  ['Temperatura', '−25 °C a +55 °C · derating a partir de 45 °C'],
  ['Proteção', 'IP54 · corrosão classe C4, com C5 opcional'],
  ['Segurança', 'aerossol e supressão a água · alívio de deflagração opcional'],
  ['Dimensões', '1.050 × 2.250 × 1.400 mm · 2.580 kg'],
  ['Ruído', '70 dB'],
  ['Expansão', 'até 20 gabinetes · 2,5 MW / 5,22 MWh'],
  ['Comunicação', 'Modbus TCP e Modbus RTU'],
];

/* ════════════════════════════════════════════════════════════════════════ */
export default function ServicosBESSPage() {
  return (
    <div className="min-h-screen bg-white antialiased">
      <SEO
        title="BESS — Banco de Baterias Industrial"
        description="Projeto, instalação e comissionamento de sistemas de armazenamento de energia (BESS) para indústria e comércio. Peak shaving, deslocamento de ponta e backup, com quadros, cubículos, estudos de seletividade e treinamento."
        keywords="BESS, banco de baterias, armazenamento de energia, peak shaving, deslocamento de ponta, redução de demanda contratada, comissionamento BESS, seletividade, cubículo de média tensão, QGBT"
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

      {/* ───────── ABERTURA ─────────
          Preto, centrado, uma frase. O gráfico é o produto: a própria curva
          de carga, em escala, com a faixa que a bateria assume. */}
      <section className="relative bg-black pt-32 md:pt-44 pb-0 overflow-hidden">
        <div className="max-w-[1024px] mx-auto px-6 text-center">
          <Surge>
            <p className="text-[19px] md:text-[21px] font-semibold mb-3" style={{ color: MARCA }}>
              BESS
            </p>
            <h1 className="text-[44px] md:text-[80px] font-semibold tracking-[-0.035em] leading-[1.03] text-white">
              A energia mais barata<br />é a que você guarda.
            </h1>
            <p className="text-[19px] md:text-[24px] mt-6 max-w-[34ch] mx-auto leading-[1.4]" style={{ color: '#a1a1a6' }}>
              Banco de baterias para indústria. Corta o pico, sai da ponta e
              sustenta a planta quando a rede cai.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-8">
              <Link to="/contato"
                    className="rounded-full px-[22px] py-[11px] text-[17px] font-normal text-white transition-opacity hover:opacity-85"
                    style={{ background: MARCA }}>
                Solicitar estudo de viabilidade
              </Link>
              <LinkSeta aoClicar={() => irPara('peak-shaving')}>Ver a conta</LinkSeta>
            </div>
          </Surge>
        </div>

        <Surge delay={150}>
          <div className="max-w-[1100px] mx-auto px-6 mt-14 md:mt-20">
            <svg viewBox={`0 0 ${L} ${A}`} className="w-full h-auto" aria-hidden="true">
              <defs>
                <linearGradient id="hero-f" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={MARCA} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={MARCA} stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {(() => {
                const lim = 950;
                const linha = CURVA.map((v, h) => `${h === 0 ? 'M' : 'L'}${px(h).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
                const topo = CURVA.map((v, h) => (v > lim ? { v, h } : null)).filter(Boolean) as { v: number; h: number }[];
                const corte = topo.length
                  ? `M${px(topo[0].h).toFixed(1)},${py(lim).toFixed(1)} `
                    + topo.map((p) => `L${px(p.h).toFixed(1)},${py(p.v).toFixed(1)}`).join(' ')
                    + ` L${px(topo[topo.length - 1].h).toFixed(1)},${py(lim).toFixed(1)} Z`
                  : '';
                return (
                  <>
                    <path d={corte} fill="url(#hero-f)" />
                    <line x1={mE} y1={py(lim)} x2={L - mD} y2={py(lim)}
                          stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="1 4" />
                    <path d={linha} fill="none" stroke="#ffffff" strokeOpacity="0.9"
                          strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
                  </>
                );
              })()}
            </svg>
          </div>
        </Surge>

        <div className="max-w-[1024px] mx-auto px-6 pb-20 md:pb-28">
          <Surge delay={250}>
            <div className="grid grid-cols-3 gap-6 md:gap-16 pt-14 border-t" style={{ borderColor: 'rgba(255,255,255,.14)' }}>
              {[
                ['60 ms', 'Para sustentar a planta quando a rede cai'],
                ['5,22 MWh', 'Por conjunto, com vinte gabinetes em paralelo'],
                ['30%', 'Redução possível do uso do sistema contratado'],
              ].map(([v, t]) => (
                <div key={v}>
                  <p className="text-[26px] md:text-[42px] font-semibold tracking-[-0.03em] text-white leading-none tabular-nums">{v}</p>
                  <p className="text-[12px] md:text-[13px] mt-3 leading-snug" style={{ color: '#86868b' }}>{t}</p>
                </div>
              ))}
            </div>
          </Surge>
        </div>
      </section>

      <BarraLocal />

      {/* ───────── VISÃO GERAL ───────── */}
      <section id="mecanismo" className="py-[100px] md:py-[140px] scroll-mt-32">
        <div className="max-w-[1024px] mx-auto px-6">
          <Surge>
            <div className="text-center max-w-[22ch] mx-auto">
              <h2 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.03em] leading-[1.07]" style={{ color: TINTA }}>
                Três contas. Um equipamento.
              </h2>
            </div>
            <p className="text-[19px] md:text-[21px] text-center max-w-[58ch] mx-auto mt-6 leading-[1.45]" style={{ color: CINZA }}>
              Bateria não se vende por kWh. Vende-se por qual linha da fatura ela derruba
              ou qual prejuízo ela evita. Quase sempre as três acontecem no mesmo sistema —
              e por isso o estudo vem antes do orçamento.
            </p>
          </Surge>

          <div className="grid md:grid-cols-3 gap-5 mt-16">
            {[
              ['Demanda', 'A conta cobra a maior potência que a planta pediu no mês. Uma única hora define a demanda contratada do ano seguinte. A bateria cobre o excedente e o contrato cai.'],
              ['Ponta', 'Nas três horas de ponta o kWh custa cerca de quatro vezes mais. Carregar de madrugada e devolver nesse intervalo é comprar barato para consumir caro.'],
              ['Continuidade', 'Comutação abaixo de 60 ms sustenta carga sensível sem transitório. Para quem já perdeu batelada com queda de energia, é o argumento que fecha.'],
            ].map(([t, d], k) => (
              <Surge key={t} delay={k * 90}>
                <div className="h-full rounded-[22px] p-9" style={{ background: CHAO }}>
                  <h3 className="text-[24px] font-semibold tracking-[-0.02em] mb-3" style={{ color: TINTA }}>{t}</h3>
                  <p className="text-[16px] leading-[1.5]" style={{ color: CINZA }}>{d}</p>
                </div>
              </Surge>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── SIMULADORES ───────── */}
      <section id="peak-shaving" className="scroll-mt-32 pt-[80px] md:pt-[110px] pb-6" style={{ background: CHAO }}>
        <div className="max-w-[1024px] mx-auto px-6">
          <Surge>
            <div className="text-center mb-14">
              <h2 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.03em] leading-[1.07] max-w-[18ch] mx-auto" style={{ color: TINTA }}>
                Mexa nos controles.
              </h2>
              <p className="text-[19px] md:text-[21px] max-w-[56ch] mx-auto mt-6 leading-[1.45]" style={{ color: CINZA }}>
                Curva de carga industrial típica, números reais do equipamento. É exatamente
                a conta que fazemos no estudo de viabilidade — com a sua curva.
              </p>
            </div>
          </Surge>
          <Surge delay={80}><SimuladorDemanda /></Surge>
        </div>
      </section>

      <section id="ponta" className="scroll-mt-32 pt-6 pb-[100px] md:pb-[140px]" style={{ background: CHAO }}>
        <div className="max-w-[1024px] mx-auto px-6">
          <Surge><SimuladorPonta /></Surge>
        </div>
      </section>

      {/* ───────── EQUIPAMENTO ───────── */}
      <section id="equipamento" className="py-[100px] md:py-[140px] scroll-mt-32 bg-black">
        <div className="max-w-[1024px] mx-auto px-6">
          <Surge>
            <div className="text-center">
              <h2 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.03em] leading-[1.07] text-white max-w-[20ch] mx-auto">
                Tudo dentro do mesmo gabinete.
              </h2>
              <p className="text-[19px] md:text-[21px] max-w-[56ch] mx-auto mt-6 leading-[1.45]" style={{ color: '#a1a1a6' }}>
                Conversor, bateria, BMS, EMS, climatização e combate a incêndio integrados de
                fábrica e ensaiados juntos. Chega montado — o que encurta a obra e tira do
                projeto a integração que costuma dar problema em campo.
              </p>
            </div>
          </Surge>

          <Surge delay={100}>
            <div className="mt-16 rounded-[28px] overflow-hidden" style={{ background: '#1d1d1f' }}>
              <div className="px-7 md:px-12 py-9 border-b" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
                <p className="text-[13px] mb-1.5" style={{ color: CLARO }}>Referência de projeto</p>
                <h3 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.02em] text-white">
                  GoodWe ESA · 125 kW / 261 kWh
                </h3>
              </div>
              <dl className="px-7 md:px-12 py-2">
                {FICHA.map(([k, v]) => (
                  <div key={k} className="flex flex-wrap gap-x-8 gap-y-1 justify-between py-3.5 border-b last:border-b-0"
                       style={{ borderColor: 'rgba(255,255,255,.07)' }}>
                    <dt className="text-[15px]" style={{ color: CLARO }}>{k}</dt>
                    <dd className="text-[15px] font-medium text-white text-right tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Surge>

          <Surge delay={150}>
            <div className="grid sm:grid-cols-2 gap-5 mt-5">
              <div className="rounded-[22px] p-9" style={{ background: '#1d1d1f' }}>
                <h3 className="text-[21px] font-semibold tracking-[-0.02em] text-white mb-3">Também em porte menor</h3>
                <p className="text-[16px] leading-[1.5]" style={{ color: '#a1a1a6' }}>
                  Para comércio e indústria de menor porte, a versão de 30 kW / 60 kWh, com
                  inversor híbrido e banco em gabinete externo climatizado. Para residência e
                  backup, a linha de alta e baixa tensão, de 5,4 a 32,4 kWh.
                </p>
              </div>
              <div className="rounded-[22px] p-9" style={{ background: '#1d1d1f' }}>
                <h3 className="text-[21px] font-semibold tracking-[-0.02em] text-white mb-4">O que isso quer dizer na obra</h3>
                <ul className="grid gap-2.5">
                  {[
                    '2,58 t em 1,47 m² exigem base verificada e plano de içamento',
                    'Derating a 45 °C pede sombreamento e circulação, não só espaço',
                    '70 dB definem a distância de divisa e de posto de trabalho',
                    'C4 de série: ambiente agressivo pede C5 especificado na compra',
                  ].map((t) => (
                    <li key={t} className="text-[15px] leading-[1.5] pl-4 relative" style={{ color: '#a1a1a6' }}>
                      <span className="absolute left-0 top-[9px] w-1 h-1 rounded-full" style={{ background: MARCA }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Surge>
        </div>
      </section>

      {/* ───────── ROTEIRO ───────── */}
      <section id="roteiro" className="py-[100px] md:py-[140px] scroll-mt-32">
        <div className="max-w-[1024px] mx-auto px-6">
          <Surge>
            <div className="text-center">
              <h2 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.03em] leading-[1.07] max-w-[20ch] mx-auto" style={{ color: TINTA }}>
                Da medição ao termo de aceite.
              </h2>
              <p className="text-[19px] md:text-[21px] max-w-[58ch] mx-auto mt-6 leading-[1.45]" style={{ color: CINZA }}>
                Cinco fases, nesta ordem. Comissionar não é ligar e ver se acende: é protocolo
                com ensaio, medição e relatório assinado — o documento que sustenta a garantia
                e responde pela instalação se algo acontecer.
              </p>
            </div>
          </Surge>

          <div className="mt-16 grid gap-px rounded-[22px] overflow-hidden" style={{ background: '#e8e8ed' }}>
            {ROTEIRO.map((f, k) => (
              <Surge key={f.fase} delay={k * 60}>
                <div className="bg-white px-7 md:px-12 py-11 grid md:grid-cols-[270px_1fr] gap-7 md:gap-12">
                  <div>
                    <p className="text-[13px] mb-2" style={{ color: MARCA }}>{f.fase}</p>
                    <h3 className="text-[26px] font-semibold tracking-[-0.022em] leading-[1.15] mb-2" style={{ color: TINTA }}>
                      {f.titulo}
                    </h3>
                    <p className="text-[14px]" style={{ color: CLARO }}>{f.prazo}</p>
                  </div>
                  <ul className="grid gap-3 content-start">
                    {f.itens.map((i) => (
                      <li key={i} className="text-[16px] leading-[1.5] pl-4 relative" style={{ color: CINZA }}>
                        <span className="absolute left-0 top-[10px] w-1 h-1 rounded-full" style={{ background: '#c7c7cc' }} />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              </Surge>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── RISCOS ───────── */}
      <section id="riscos" className="py-[100px] md:py-[140px] scroll-mt-32" style={{ background: CHAO }}>
        <div className="max-w-[1024px] mx-auto px-6">
          <Surge>
            <div className="text-center">
              <h2 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.03em] leading-[1.07] max-w-[20ch] mx-auto" style={{ color: TINTA }}>
                O que pode dar errado.
              </h2>
              <p className="text-[19px] md:text-[21px] max-w-[58ch] mx-auto mt-6 leading-[1.45]" style={{ color: CINZA }}>
                Nenhum fornecedor sério entrega banco de bateria sem falar disto. Cada risco
                tem uma mitigação que entra no projeto, na obra ou no contrato. O que não está
                mapeado é o que custa caro depois.
              </p>
            </div>
          </Surge>

          <div className="mt-16 grid md:grid-cols-2 gap-5">
            {RISCOS.map((r, k) => (
              <Surge key={r.risco} delay={(k % 2) * 70}>
                <div className="h-full rounded-[22px] bg-white p-9">
                  <h3 className="text-[21px] font-semibold tracking-[-0.02em] leading-snug mb-3" style={{ color: TINTA }}>
                    {r.risco}
                  </h3>
                  <p className="text-[13px] mb-4" style={{ color: CLARO }}>
                    Severidade <span className="font-semibold" style={{ color: r.sev === 'Crítica' ? MARCA : CINZA }}>{r.sev}</span>
                    <span className="mx-2">·</span>
                    Probabilidade <span className="font-semibold" style={{ color: CINZA }}>{r.prob}</span>
                  </p>
                  <p className="text-[16px] leading-[1.5]" style={{ color: CINZA }}>{r.mitiga}</p>
                </div>
              </Surge>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── ESCOPO ───────── */}
      <section id="escopo" className="py-[100px] md:py-[140px] scroll-mt-32">
        <div className="max-w-[1024px] mx-auto px-6">
          <Surge>
            <div className="text-center">
              <h2 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.03em] leading-[1.07] max-w-[22ch] mx-auto" style={{ color: TINTA }}>
                O banco nunca chega sozinho.
              </h2>
              <p className="text-[19px] md:text-[21px] max-w-[58ch] mx-auto mt-6 leading-[1.45]" style={{ color: CINZA }}>
                Ele precisa de ponto de conexão dimensionado, proteção recalculada e equipe
                treinada. Tudo isso a INNTAG já fabrica e já faz há mais de dezessete anos —
                por isso o projeto inteiro sai de uma casa só.
              </p>
            </div>
          </Surge>

          <div className="mt-16 grid md:grid-cols-2 gap-5">
            {ESCOPO.map((e, k) => (
              <Surge key={e.titulo} delay={(k % 2) * 80}>
                <div className="h-full rounded-[22px] p-9 md:p-11" style={{ background: CHAO }}>
                  <h3 className="text-[26px] font-semibold tracking-[-0.022em] mb-3" style={{ color: TINTA }}>{e.titulo}</h3>
                  <p className="text-[16px] leading-[1.5] mb-7" style={{ color: CINZA }}>{e.texto}</p>
                  <ul className="grid gap-2.5 pt-7 border-t" style={{ borderColor: '#dcdce0' }}>
                    {e.itens.map((i) => (
                      <li key={i} className="text-[15px] leading-[1.5] pl-4 relative" style={{ color: CINZA }}>
                        <span className="absolute left-0 top-[9px] w-1 h-1 rounded-full" style={{ background: MARCA }} />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              </Surge>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FECHO ───────── */}
      <section className="pb-[100px] md:pb-[140px]">
        <div className="max-w-[1024px] mx-auto px-6">
          <Surge>
            <div className="rounded-[28px] px-7 md:px-16 py-16 md:py-24 text-center" style={{ background: CHAO }}>
              <h2 className="text-[36px] md:text-[52px] font-semibold tracking-[-0.03em] leading-[1.08] max-w-[18ch] mx-auto" style={{ color: TINTA }}>
                Comece pela medição.
              </h2>
              <p className="text-[19px] md:text-[21px] max-w-[52ch] mx-auto mt-6 leading-[1.45]" style={{ color: CINZA }}>
                Sem a curva de carga real, qualquer número de bateria é chute. Instalamos o
                analisador na sua planta e devolvemos o estudo com dimensionamento, retorno
                e o escopo completo de obra.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-9">
                <Link to="/contato"
                      className="rounded-full px-[22px] py-[11px] text-[17px] text-white transition-opacity hover:opacity-85"
                      style={{ background: MARCA }}>
                  Solicitar estudo de viabilidade
                </Link>
                <LinkSeta para="/servicos">Ver todos os serviços</LinkSeta>
              </div>
            </div>
          </Surge>
        </div>
      </section>

      <Footer />
    </div>
  );
}
