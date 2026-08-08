import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Zap, Smartphone } from 'lucide-react';

interface UnifilarItem {
  id: number;
  item_key: string;
  name: string;
  description: string;
  product_id: number | null;
  product_slug?: string;
  product_name?: string;
  product_image?: string;
}

interface PopupPosition {
  x: number;
  y: number;
}

// Helper to get image URL from image_key
function getImageUrl(imageKey: string | null): string | null {
  if (!imageKey) return null;
  if (imageKey.startsWith('http')) return imageKey;
  return `/api/files/${imageKey}`;
}

interface UnifilarDiagramProps {
  showHeader?: boolean;
  showFooterLinks?: boolean;
  className?: string;
}

export function UnifilarDiagram({ className = '' }: UnifilarDiagramProps) {
  const [items, setItems] = useState<UnifilarItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<UnifilarItem | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition>({ x: 0, y: 0 });

  // Celular em pé → versão simplificada; girar para paisagem mostra a completa
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px) and (orientation: portrait)');
    const update = () => setIsMobilePortrait(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    fetch('/api/public/unifilar')
      .then(r => r.json())
      .then(data => setItems(data.items || []))
      .catch(() => {});
  }, []);

  const handleMouseEnter = (itemKey: string, e: React.MouseEvent) => {
    const item = items.find(i => i.item_key === itemKey);
    if (item) {
      const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
      const popupWidth = 520;
      const popupHeight = 200;
      
      // Position popup to the right of the element by default
      let x = rect.right + 15;
      let y = rect.top + rect.height / 2 - popupHeight / 2;
      
      // If popup would go off right edge, position to the left
      if (x + popupWidth > window.innerWidth - 20) {
        x = rect.left - popupWidth - 15;
      }
      
      // If popup would go off left edge, center it horizontally
      if (x < 20) {
        x = Math.max(20, rect.left + rect.width / 2 - popupWidth / 2);
      }
      
      // Keep within vertical bounds
      if (y < 80) y = 80;
      if (y + popupHeight > window.innerHeight - 20) {
        y = window.innerHeight - popupHeight - 20;
      }
      
      setPopupPosition({ x, y });
      setHoveredItem(item);
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  // ---------- Interação dos nós (clique + teclado) ----------
  const openItem = (key: string) => {
    const item = items.find(i => i.item_key === key);
    if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`;
  };

  const nodeProps = (key: string) => {
    const item = items.find(i => i.item_key === key);
    return {
      className: 'uf-node',
      role: 'link' as const,
      tabIndex: 0,
      'aria-label': item ? `${item.name} — ver produto relacionado` : key,
      onMouseEnter: (e: React.MouseEvent) => handleMouseEnter(key, e),
      onMouseLeave: handleMouseLeave,
      onClick: () => openItem(key),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openItem(key); }
      },
    };
  };

  // Tipografia técnica para tensões (autoridade de engenharia)
  const MONO = "'JetBrains Mono','Cascadia Code','SF Mono',Consolas,monospace";

  // Line styling
  const lineStyle = { stroke: '#e4e4e7', strokeWidth: 2.5, strokeLinecap: 'round' } as const;
  // Barramento MT (13,8kV) em vermelho; barramentos BT em laranja
  const busbarMTStyle = { stroke: '#dc2626', strokeWidth: 6, strokeLinecap: 'round', style: { filter: 'drop-shadow(0 0 5px rgba(220,38,38,0.5))' } } as const;
  const busbarBTStyle = { stroke: '#f97316', strokeWidth: 6, strokeLinecap: 'round', style: { filter: 'drop-shadow(0 0 5px rgba(249,115,22,0.45))' } } as const;
  const thinLineStyle = { stroke: '#d4d4d4', strokeWidth: 2, strokeLinecap: 'round' } as const;
  const dashedLineStyle = { stroke: '#d4d4d4', strokeWidth: 2, strokeDasharray: '6,4', strokeLinecap: 'round' } as const;

  // SCADA: pulso de energia que corre por cima da linha (a linha sólida fica embaixo)
  const Flow = ({ x1, y1, x2, y2, dur = 1.4, color = '#fdba74' }: { x1: number; y1: number; x2: number; y2: number; dur?: number; color?: string }) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="7 14" opacity="0.85" pointerEvents="none">
      <animate attributeName="stroke-dashoffset" from="21" to="0" dur={`${dur}s`} repeatCount="indefinite" />
    </line>
  );

  // ---------- Versão mobile (retrato): unifilar simplificado ----------
  if (isMobilePortrait) {
    return (
      <div className={`relative ${className}`}>
        {/* Aviso: girar o celular para a versão completa */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/85 backdrop-blur border border-neutral-700 text-neutral-300 text-xs whitespace-nowrap">
          <Smartphone className="w-4 h-4 rotate-90 text-orange-400" />
          Gire o celular para o diagrama completo
        </div>

        <svg viewBox="0 -44 420 764" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="nodeGradM" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b2b2f" />
              <stop offset="100%" stopColor="#0c0c0e" />
            </linearGradient>
            <radialGradient id="genGradM" cx="50%" cy="38%" r="72%">
              <stop offset="0%" stopColor="#43290f" />
              <stop offset="100%" stopColor="#0c0c0e" />
            </radialGradient>
            <filter id="nodeShadowM" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.55" />
            </filter>
          </defs>
          <style>{`
            .uf-node { transition: filter .2s ease; cursor: pointer; outline: none; }
            .uf-node > rect, .uf-node > circle { transition: stroke .2s ease; }
            .uf-node:hover, .uf-node:focus-visible { filter: drop-shadow(0 0 9px rgba(249,115,22,0.6)); }
            .uf-node:hover > rect, .uf-node:hover > circle,
            .uf-node:focus-visible > rect, .uf-node:focus-visible > circle { stroke: #f97316; }
            .uf-node text { letter-spacing: .4px; }
          `}</style>

          {/* SUBESTAÇÃO */}
          <g {...nodeProps('subestacao')}>
            <rect x="60" y="26" width="200" height="64" rx="6" fill="url(#nodeGradM)" stroke="#b91c1c" strokeWidth="2" filter="url(#nodeShadowM)" />
            <text x="160" y="52" fill="#ffffff" fontSize="15" textAnchor="middle" fontWeight="600">SUBESTAÇÃO</text>
            <text x="160" y="72" fill="#d4d4d4" fontSize="10" textAnchor="middle" fontFamily={MONO}>138kV / 69kV / 13,8kV</text>
          </g>
          <line x1="160" y1="90" x2="160" y2="132" {...lineStyle} />
          <Flow x1={160} y1={90} x2={160} y2={132} dur={1.1} color="#fca5a5" />
          <rect x="153" y="102" width="14" height="14" rx="2" fill="#0c0c0e" stroke="#e4e4e7" strokeWidth="1.5" pointerEvents="none" />

          {/* Barramento MT 13,8kV */}
          <line x1="60" y1="132" x2="360" y2="132" {...busbarMTStyle} />
          <Flow x1={160} y1={132} x2={360} y2={132} dur={1.6} color="#fca5a5" />
          <circle cx="160" cy="132" r="5" fill="#ef4444" />
          <circle cx="330" cy="132" r="5" fill="#ef4444" />
          <rect x="200" y="120" width="112" height="24" rx="6" fill="#18181b" stroke="#dc2626" strokeWidth="1" />
          <text x="256" y="136" fill="#fca5a5" fontSize="10" textAnchor="middle" fontWeight="600" fontFamily={MONO}>MT • 13,8kV</text>

          {/* CUBÍCULO MT */}
          <line x1="160" y1="132" x2="160" y2="180" {...lineStyle} />
          <Flow x1={160} y1={132} x2={160} y2={180} dur={1.2} color="#fca5a5" />
          <rect x="153" y="149" width="14" height="14" rx="2" fill="#0c0c0e" stroke="#e4e4e7" strokeWidth="1.5" pointerEvents="none" />
          <g {...nodeProps('cubiculo_fabrica')}>
            <rect x="60" y="180" width="200" height="58" rx="6" fill="url(#nodeGradM)" stroke="#71717a" strokeWidth="1.5" filter="url(#nodeShadowM)" />
            <text x="160" y="204" fill="#ffffff" fontSize="15" textAnchor="middle" fontWeight="600">CUBÍCULO MT</text>
            <text x="160" y="222" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">FÁBRICA</text>
          </g>

          {/* TRAFO (IEC) */}
          <line x1="160" y1="238" x2="160" y2="268" {...lineStyle} />
          <Flow x1={160} y1={238} x2={160} y2={268} dur={1.25} color="#fca5a5" />
          <g {...nodeProps('trafo_fabrica')}>
            <circle cx="160" cy="293" r="25" fill="none" stroke="#e4e4e7" strokeWidth="2" />
            <circle cx="160" cy="333" r="25" fill="none" stroke="#e4e4e7" strokeWidth="2" />
            <text x="160" y="289" fill="#ffffff" fontSize="10" textAnchor="middle">AT</text>
            <text x="160" y="345" fill="#ffffff" fontSize="10" textAnchor="middle">BT</text>
          </g>
          <text x="198" y="316" fill="#d4d4d4" fontSize="11">TRAFO</text>

          {/* Barramento 440V */}
          <line x1="160" y1="358" x2="160" y2="396" {...lineStyle} />
          <Flow x1={160} y1={358} x2={160} y2={396} dur={1.3} />
          <line x1="70" y1="396" x2="250" y2="396" {...busbarBTStyle} />
          <circle cx="160" cy="396" r="5" fill="#fb923c" />
          <rect x="70" y="384" width="64" height="24" rx="6" fill="#18181b" stroke="#f97316" strokeWidth="1" />
          <text x="102" y="400" fill="#fdba74" fontSize="10" textAnchor="middle" fontWeight="600" fontFamily={MONO}>440V</text>

          {/* QGBT */}
          <line x1="160" y1="396" x2="160" y2="444" {...lineStyle} />
          <Flow x1={160} y1={396} x2={160} y2={444} dur={1.35} />
          <rect x="153" y="412" width="14" height="14" rx="2" fill="#0c0c0e" stroke="#e4e4e7" strokeWidth="1.5" pointerEvents="none" />
          <g {...nodeProps('qgbt_fabrica')}>
            <rect x="60" y="444" width="200" height="58" rx="6" fill="url(#nodeGradM)" stroke="#71717a" strokeWidth="1.5" filter="url(#nodeShadowM)" />
            <text x="160" y="468" fill="#ffffff" fontSize="15" textAnchor="middle" fontWeight="600">QGBT</text>
            <text x="160" y="486" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">FÁBRICA</text>
          </g>

          {/* CCM */}
          <line x1="160" y1="502" x2="160" y2="534" {...lineStyle} />
          <Flow x1={160} y1={502} x2={160} y2={534} dur={1.3} />
          <g {...nodeProps('ccm')}>
            <rect x="60" y="534" width="200" height="54" rx="6" fill="url(#nodeGradM)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadowM)" />
            <text x="160" y="556" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="600">CCM</text>
            <text x="160" y="574" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">MOTORES</text>
          </g>

          {/* Motores */}
          <line x1="160" y1="588" x2="160" y2="612" {...thinLineStyle} />
          <line x1="100" y1="612" x2="220" y2="612" {...thinLineStyle} />
          {[100, 160, 220].map(cx => (
            <g key={cx}>
              <line x1={cx} y1={612} x2={cx} y2={630} {...thinLineStyle} />
              <circle cx={cx} cy={650} r="20" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
              <text x={cx} y={648} fill="#d4d4d4" fontSize="11" textAnchor="middle">M</text>
              <text x={cx} y={661} fill="#a3a3a3" fontSize="8" textAnchor="middle">3~</text>
            </g>
          ))}
          <text x="160" y="696" fill="#a3a3a3" fontSize="10" textAnchor="middle">MOTORES ELÉTRICOS</text>

          {/* GERADOR (cogeração 13,8kV) */}
          <line x1="330" y1="132" x2="330" y2="278" {...lineStyle} />
          <Flow x1={330} y1={278} x2={330} y2={132} dur={1.3} color="#fca5a5" />
          <rect x="323" y="196" width="14" height="14" rx="2" fill="#0c0c0e" stroke="#e4e4e7" strokeWidth="1.5" pointerEvents="none" />
          <g {...nodeProps('gerador')}>
            <circle cx="330" cy="320" r="42" fill="url(#genGradM)" stroke="#f97316" strokeWidth="2.5" filter="url(#nodeShadowM)" />
            <text x="330" y="316" fill="#ffffff" fontSize="22" textAnchor="middle" fontWeight="600">G</text>
            <text x="330" y="338" fill="#d4d4d4" fontSize="14" textAnchor="middle">~</text>
          </g>
          <text x="330" y="382" fill="#d4d4d4" fontSize="11" textAnchor="middle">GERADOR</text>
          <text x="330" y="398" fill="#fca5a5" fontSize="10" textAnchor="middle" fontFamily={MONO}>13,8kV</text>

          {/* LEDs de status */}
          <g pointerEvents="none">
            {([[246, 38], [246, 192], [246, 456], [246, 546]] as [number, number][]).map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3.5" fill="#4ade80" style={{ filter: 'drop-shadow(0 0 3px rgba(74,222,128,0.9))' }}>
                <animate attributeName="opacity" values="1;0.25;1" dur="2.4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>

          {/* Dica */}
          <text x="210" y="716" fill="#a3a3a3" fontSize="10" textAnchor="middle">Toque nos equipamentos para conhecer os produtos</text>
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Product Popup - appears on hover */}
      {hoveredItem && createPortal(
        <div 
          className="fixed z-[9999] flex bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl pointer-events-none"
          style={{ 
            left: `${popupPosition.x}px`, 
            top: `${popupPosition.y}px`,
            width: '520px',
            maxWidth: 'calc(100vw - 40px)'
          }}
        >
          {/* Image - Left side */}
          {hoveredItem.product_image ? (
            <div className="w-52 flex-shrink-0 bg-neutral-800 flex items-center justify-center p-4">
              <img 
                src={getImageUrl(hoveredItem.product_image) || ''} 
                alt={hoveredItem.product_name || hoveredItem.name}
                className="w-full h-44 object-contain"
              />
            </div>
          ) : (
            <div className="w-52 flex-shrink-0 bg-neutral-800 flex items-center justify-center">
              <Zap className="w-12 h-12 text-neutral-600" />
            </div>
          )}
          
          {/* Content - Right side */}
          <div className="flex-1 p-5 flex flex-col justify-center">
            <p className="text-orange-500 text-xs font-semibold tracking-widest uppercase mb-1">
              Equipamento
            </p>
            <h3 className="text-xl font-bold text-white mb-2">
              {hoveredItem.name}
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-4">
              {hoveredItem.description}
            </p>
            
            {hoveredItem.product_slug && (
              <div className="flex items-center gap-2 text-orange-500 text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>Clique para ver detalhes</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Diagram SVG */}
      <svg
        viewBox="0 0 1600 850"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Nós em vidro grafite */}
          <linearGradient id="nodeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2b2b2f" />
            <stop offset="100%" stopColor="#0c0c0e" />
          </linearGradient>
          {/* Gerador em destaque */}
          <radialGradient id="genGrad" cx="50%" cy="38%" r="72%">
            <stop offset="0%" stopColor="#43290f" />
            <stop offset="100%" stopColor="#0c0c0e" />
          </radialGradient>
          {/* Sombra dos nós (profundidade) */}
          <filter id="nodeShadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.55" />
          </filter>
          {/* Grade técnica de supervisório */}
          <pattern id="scadaGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#52525b" strokeWidth="1" opacity="0.18" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1600" height="850" fill="url(#scadaGrid)" pointerEvents="none" />
        <style>{`
          .uf-node { transition: filter .2s ease; cursor: pointer; outline: none; }
          .uf-node > rect, .uf-node > circle { transition: stroke .2s ease; }
          .uf-node:hover, .uf-node:focus-visible { filter: drop-shadow(0 0 9px rgba(249,115,22,0.6)); }
          .uf-node:hover > rect, .uf-node:hover > circle,
          .uf-node:focus-visible > rect, .uf-node:focus-visible > circle { stroke: #f97316; }
          .uf-node text { letter-spacing: .4px; }
        `}</style>

        {/* ================ SUBESTAÇÃO ================ */}
        <g {...nodeProps('subestacao')}>
          <rect x="700" y="20" width="200" height="60" rx="4"
            fill="url(#nodeGrad)" stroke="#b91c1c" strokeWidth="2" filter="url(#nodeShadow)" />
          <text x="800" y="48" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="600">SUBESTAÇÃO</text>
          <text x="800" y="66" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5" fontFamily={MONO}>138kV / 69kV / 13,8kV</text>
        </g>
        
        {/* Saída da subestação */}
        <line x1="800" y1="80" x2="800" y2="130" {...lineStyle} />
        <Flow x1={800} y1={80} x2={800} y2={130} dur={1.1} color="#fca5a5" />

        {/* Barramento MT principal 13,8kV */}
        <line x1="200" y1="130" x2="1300" y2="130" {...busbarMTStyle} />
        {/* Energia flui do ponto de injeção (subestação) para as pontas */}
        <Flow x1={800} y1={130} x2={200} y2={130} dur={2.2} color="#fca5a5" />
        <Flow x1={800} y1={130} x2={1300} y2={130} dur={2} color="#fca5a5" />
        {/* Label do barramento MT */}
        <rect x="1080" y="118" width="180" height="24" fill="#18181b" stroke="#dc2626" strokeWidth="1" rx="6" />
        <text x="1170" y="134" fill="#fca5a5" fontSize="10" textAnchor="middle" fontWeight="600" fontFamily={MONO}>BARRAMENTO MT • 13,8kV</text>
        
        {/* Conexões para cubículos */}
        <line x1="200" y1="130" x2="200" y2="180" {...lineStyle} />
        <line x1="800" y1="130" x2="800" y2="180" {...lineStyle} />
        <line x1="1300" y1="130" x2="1300" y2="180" {...lineStyle} />
        <Flow x1={200} y1={130} x2={200} y2={180} dur={1.2} color="#fca5a5" />
        <Flow x1={800} y1={130} x2={800} y2={180} dur={1.3} color="#fca5a5" />
        {/* Cogeração exporta: fluxo sobe para o barramento */}
        <Flow x1={1300} y1={180} x2={1300} y2={130} dur={1.25} color="#fca5a5" />
        {/* Pontos de junção no barramento MT */}
        <circle cx="200" cy="130" r="5" fill="#ef4444" />
        <circle cx="800" cy="130" r="5" fill="#ef4444" />
        <circle cx="1300" cy="130" r="5" fill="#ef4444" />

        {/* ================ CUBÍCULOS MT ================ */}
        
        {/* Cubículo ADM */}
        <g {...nodeProps('cubiculo_adm')}>
          <rect x="100" y="180" width="200" height="60" rx="4" 
            fill="url(#nodeGrad)" stroke="#71717a" strokeWidth="1.5" filter="url(#nodeShadow)" />
          <text x="200" y="208" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">CUBÍCULO MT</text>
          <text x="200" y="226" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">ADM</text>
        </g>

        {/* Cubículo Fábrica */}
        <g {...nodeProps('cubiculo_fabrica')}>
          <rect x="700" y="180" width="200" height="60" rx="4" 
            fill="url(#nodeGrad)" stroke="#71717a" strokeWidth="1.5" filter="url(#nodeShadow)" />
          <text x="800" y="208" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">CUBÍCULO MT</text>
          <text x="800" y="226" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">FÁBRICA</text>
        </g>

        {/* Cubículo Cogeração */}
        <g {...nodeProps('cubiculo_cogeracao')}>
          <rect x="1200" y="180" width="200" height="60" rx="4" 
            fill="url(#nodeGrad)" stroke="#71717a" strokeWidth="1.5" filter="url(#nodeShadow)" />
          <text x="1300" y="208" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">CUBÍCULO MT</text>
          <text x="1300" y="226" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">COGERAÇÃO</text>
        </g>

        {/* ================ TRANSFORMADORES ================ */}
        
        <line x1="200" y1="240" x2="200" y2="275" {...lineStyle} />
        <line x1="800" y1="240" x2="800" y2="275" {...lineStyle} />
        <line x1="1300" y1="240" x2="1300" y2="420" {...lineStyle} />
        <Flow x1={200} y1={240} x2={200} y2={275} dur={1.2} color="#fca5a5" />
        <Flow x1={800} y1={240} x2={800} y2={275} dur={1.3} color="#fca5a5" />
        <Flow x1={1300} y1={420} x2={1300} y2={240} dur={1.4} color="#fca5a5" />

        {/* Trafo ADM — símbolo IEC: enrolamentos sobrepostos */}
        <g {...nodeProps('trafo_adm')}>
          <circle cx="200" cy="300" r="25" fill="none" stroke="#e4e4e7" strokeWidth="2" />
          <circle cx="200" cy="340" r="25" fill="none" stroke="#e4e4e7" strokeWidth="2" />
          <text x="200" y="296" fill="#ffffff" fontSize="10" textAnchor="middle">AT</text>
          <text x="200" y="352" fill="#ffffff" fontSize="10" textAnchor="middle">BT</text>
        </g>
        <text x="260" y="320" fill="#d4d4d4" fontSize="11">TRAFO ADM</text>

        {/* Trafo Fábrica — símbolo IEC: enrolamentos sobrepostos */}
        <g {...nodeProps('trafo_fabrica')}>
          <circle cx="800" cy="300" r="25" fill="none" stroke="#e4e4e7" strokeWidth="2" />
          <circle cx="800" cy="340" r="25" fill="none" stroke="#e4e4e7" strokeWidth="2" />
          <text x="800" y="296" fill="#ffffff" fontSize="10" textAnchor="middle">AT</text>
          <text x="800" y="352" fill="#ffffff" fontSize="10" textAnchor="middle">BT</text>
        </g>
        <text x="860" y="320" fill="#d4d4d4" fontSize="11">TRAFO FÁBRICA</text>

        {/* Cogeração em 13,8kV: sem trafo — o gerador conecta direto no cubículo MT */}

        {/* ================ BARRAMENTO BT com TIEs ================ */}
        
        <line x1="200" y1="365" x2="200" y2="420" {...lineStyle} />
        <line x1="800" y1="365" x2="800" y2="420" {...lineStyle} />
        <Flow x1={200} y1={365} x2={200} y2={420} dur={1.35} />
        <Flow x1={800} y1={365} x2={800} y2={420} dur={1.2} />

        {/* Barramento Fábrica 440V — termina exatamente nas conexões (450 a 1000) */}
        <line x1="450" y1="420" x2="1000" y2="420" {...busbarBTStyle} />

        {/* Label do barramento BT */}
        <rect x="490" y="408" width="120" height="24" fill="#18181b" stroke="#f97316" strokeWidth="1" rx="6" />
        <text x="550" y="424" fill="#fdba74" fontSize="10" textAnchor="middle" fontWeight="600" fontFamily={MONO}>BARRAMENTO 440V</text>

        {/* ================ QGBT's ================ */}

        <line x1="200" y1="420" x2="200" y2="480" {...lineStyle} />
        <line x1="650" y1="420" x2="650" y2="480" {...lineStyle} />
        <line x1="1000" y1="420" x2="1000" y2="480" {...lineStyle} />
        <Flow x1={200} y1={420} x2={200} y2={480} dur={1.4} />
        <Flow x1={650} y1={420} x2={650} y2={480} dur={1.3} />
        <Flow x1={1000} y1={420} x2={1000} y2={480} dur={1.35} />
        {/* Pontos de junção no barramento BT */}
        <circle cx="450" cy="420" r="5" fill="#fb923c" />
        <circle cx="650" cy="420" r="5" fill="#fb923c" />
        <circle cx="800" cy="420" r="5" fill="#fb923c" />
        <circle cx="1000" cy="420" r="5" fill="#fb923c" />

        {/* QGBT ADM */}
        <g {...nodeProps('qgbt_adm')}>
          <rect x="100" y="480" width="200" height="60" rx="4" 
            fill="url(#nodeGrad)" stroke="#71717a" strokeWidth="1.5" filter="url(#nodeShadow)" />
          <text x="200" y="508" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">QGBT</text>
          <text x="200" y="526" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">ADM</text>
        </g>

        {/* QGBT Fábrica */}
        <g {...nodeProps('qgbt_fabrica')}>
          <rect x="550" y="480" width="200" height="60" rx="4" 
            fill="url(#nodeGrad)" stroke="#71717a" strokeWidth="1.5" filter="url(#nodeShadow)" />
          <text x="650" y="508" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">QGBT</text>
          <text x="650" y="526" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">FÁBRICA</text>
        </g>

        {/* QGBT Essencial */}
        <g {...nodeProps('qgbt_essencial')}>
          <rect x="900" y="480" width="200" height="60" rx="4" 
            fill="url(#nodeGrad)" stroke="#71717a" strokeWidth="1.5" filter="url(#nodeShadow)" />
          <text x="1000" y="508" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">QGBT</text>
          <text x="1000" y="526" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">ESSENCIAL</text>
        </g>

        {/* ================ BANCO DE CAPACITORES ================ */}
        
        {/* Conexão do barramento para o banco */}
        <line x1="450" y1="420" x2="450" y2="480" {...lineStyle} />
        
        {/* Banco de Capacitores - Painel */}
        <g {...nodeProps('banco_capacitor')}>
          <rect x="380" y="480" width="140" height="60" rx="4" 
            fill="url(#nodeGrad)" stroke="#71717a" strokeWidth="1.5" filter="url(#nodeShadow)" />
          <text x="450" y="505" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">BANCO</text>
          <text x="450" y="522" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="600">CAPACITOR</text>
        </g>

        {/* ================ COGERAÇÃO ================ */}
        
        {/* Gerador 13,8kV conecta direto ao trafo da cogeração (sem passar pela barra de 440V) */}
        <line x1="1300" y1="420" x2="1300" y2="516" {...lineStyle} />
        <Flow x1={1300} y1={516} x2={1300} y2={420} dur={1.2} color="#fca5a5" />
        
        {/* Gerador */}
        <g {...nodeProps('gerador')}>
          <circle cx="1300" cy="570" r="55" fill="url(#genGrad)" stroke="#f97316" strokeWidth="2.5" filter="url(#nodeShadow)" />
          <text x="1300" y="565" fill="#ffffff" fontSize="26" textAnchor="middle" fontWeight="600">G</text>
          <text x="1300" y="590" fill="#d4d4d4" fontSize="18" textAnchor="middle">~</text>
        </g>
        <text x="1300" y="645" fill="#d4d4d4" fontSize="12" textAnchor="middle">GERADOR</text>
        <text x="1300" y="661" fill="#fca5a5" fontSize="10" textAnchor="middle" fontFamily={MONO}>13,8kV</text>

        {/* Excitação */}
        <line x1="1355" y1="570" x2="1420" y2="570" {...dashedLineStyle} />
        <g {...nodeProps('excitacao')}>
          <rect x="1420" y="540" width="130" height="60" rx="4"
            fill="url(#nodeGrad)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadow)" />
          <text x="1485" y="565" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">PAINEL</text>
          <text x="1485" y="582" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="600">EXCITAÇÃO</text>
        </g>

        {/* Proteção */}
        <line x1="1485" y1="540" x2="1485" y2="490" {...thinLineStyle} />
        <g {...nodeProps('protecao')}>
          <rect x="1420" y="430" width="130" height="60" rx="4"
            fill="url(#nodeGrad)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadow)" />
          <text x="1485" y="455" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">PAINEL</text>
          <text x="1485" y="472" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="600">PROTEÇÃO</text>
        </g>

        {/* Sincronismo */}
        <line x1="1485" y1="600" x2="1485" y2="650" {...thinLineStyle} />
        <g {...nodeProps('sincronismo')}>
          <rect x="1420" y="650" width="130" height="60" rx="4"
            fill="url(#nodeGrad)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadow)" />
          <text x="1485" y="675" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">PAINEL</text>
          <text x="1485" y="692" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="600">SINCRONISMO</text>
        </g>

        {/* QTA */}
        <line x1="1485" y1="710" x2="1485" y2="740" {...thinLineStyle} />
        <g {...nodeProps('qta')}>
          <rect x="1420" y="740" width="130" height="60" rx="4"
            fill="url(#nodeGrad)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadow)" />
          <text x="1485" y="765" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">PAINEL</text>
          <text x="1485" y="782" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="600">QTA</text>
        </g>

        {/* ================ DISTRIBUIÇÃO ADM ================ */}
        
        <line x1="200" y1="540" x2="200" y2="580" {...lineStyle} />
        <line x1="140" y1="580" x2="320" y2="580" {...lineStyle} />

        {/* QDL Iluminação */}
        <line x1="140" y1="580" x2="140" y2="620" {...lineStyle} />
        <g {...nodeProps('qdl_iluminacao')}>
          <rect x="60" y="620" width="160" height="55" rx="4"
            fill="url(#nodeGrad)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadow)" />
          <text x="140" y="645" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">QDL</text>
          <text x="140" y="662" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">ILUMINAÇÃO</text>
        </g>

        {/* Luminárias */}
        <line x1="140" y1="675" x2="140" y2="710" {...thinLineStyle} />
        <line x1="95" y1="710" x2="185" y2="710" {...thinLineStyle} />
        
        <line x1="95" y1="710" x2="95" y2="730" {...thinLineStyle} />
        <circle cx="95" cy="750" r="18" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        
        <line x1="140" y1="710" x2="140" y2="730" {...thinLineStyle} />
        <circle cx="140" cy="750" r="18" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        
        <line x1="185" y1="710" x2="185" y2="730" {...thinLineStyle} />
        <circle cx="185" cy="750" r="18" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />

        {/* Símbolo IEC de luminária: círculo com X */}
        {[95, 140, 185].map(cx => (
          <g key={cx} pointerEvents="none">
            <line x1={cx - 9} y1={741} x2={cx + 9} y2={759} stroke="#d4d4d4" strokeWidth="1.5" />
            <line x1={cx - 9} y1={759} x2={cx + 9} y2={741} stroke="#d4d4d4" strokeWidth="1.5" />
          </g>
        ))}

        <text x="140" y="790" fill="#a3a3a3" fontSize="10" textAnchor="middle">LUMINÁRIAS</text>

        {/* QDF Tomadas */}
        <line x1="320" y1="580" x2="320" y2="620" {...lineStyle} />
        <g {...nodeProps('qdf_tomadas')}>
          <rect x="240" y="620" width="160" height="55" rx="4"
            fill="url(#nodeGrad)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadow)" />
          <text x="320" y="645" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">QDF</text>
          <text x="320" y="662" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">TOMADAS</text>
        </g>

        {/* ================ DISTRIBUIÇÃO FÁBRICA ================ */}
        
        <line x1="650" y1="540" x2="650" y2="580" {...lineStyle} />
        <line x1="550" y1="580" x2="750" y2="580" {...lineStyle} />

        {/* CCM Motores */}
        <line x1="550" y1="580" x2="550" y2="620" {...lineStyle} />
        <g {...nodeProps('ccm')}>
          <rect x="470" y="620" width="160" height="55" rx="4"
            fill="url(#nodeGrad)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadow)" />
          <text x="550" y="645" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">CCM</text>
          <text x="550" y="662" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">MOTORES</text>
        </g>

        {/* Motores */}
        <line x1="550" y1="675" x2="550" y2="710" {...thinLineStyle} />
        <line x1="500" y1="710" x2="600" y2="710" {...thinLineStyle} />
        
        <line x1="500" y1="710" x2="500" y2="730" {...thinLineStyle} />
        <circle cx="500" cy="755" r="22" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        <text x="500" y="752" fill="#d4d4d4" fontSize="12" textAnchor="middle">M</text>
        <text x="500" y="767" fill="#a3a3a3" fontSize="9" textAnchor="middle">3~</text>

        <line x1="550" y1="710" x2="550" y2="730" {...thinLineStyle} />
        <circle cx="550" cy="755" r="22" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        <text x="550" y="752" fill="#d4d4d4" fontSize="12" textAnchor="middle">M</text>
        <text x="550" y="767" fill="#a3a3a3" fontSize="9" textAnchor="middle">3~</text>

        <line x1="600" y1="710" x2="600" y2="730" {...thinLineStyle} />
        <circle cx="600" cy="755" r="22" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        <text x="600" y="752" fill="#d4d4d4" fontSize="12" textAnchor="middle">M</text>
        <text x="600" y="767" fill="#a3a3a3" fontSize="9" textAnchor="middle">3~</text>

        <text x="550" y="800" fill="#a3a3a3" fontSize="10" textAnchor="middle">MOTORES ELÉTRICOS</text>

        {/* QDF Fornos */}
        <line x1="750" y1="580" x2="750" y2="620" {...lineStyle} />
        <g {...nodeProps('qdf_fornos')}>
          <rect x="670" y="620" width="160" height="55" rx="4"
            fill="url(#nodeGrad)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadow)" />
          <text x="750" y="645" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">QDF</text>
          <text x="750" y="662" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">FORNOS</text>
        </g>

        {/* Fornos */}
        <line x1="750" y1="675" x2="750" y2="710" {...thinLineStyle} />
        <line x1="710" y1="710" x2="790" y2="710" {...thinLineStyle} />
        
        <line x1="710" y1="710" x2="710" y2="730" {...thinLineStyle} />
        <rect x="680" y="730" width="60" height="45" rx="3" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        <text x="710" y="758" fill="#d4d4d4" fontSize="12" textAnchor="middle">F1</text>

        <line x1="790" y1="710" x2="790" y2="730" {...thinLineStyle} />
        <rect x="760" y="730" width="60" height="45" rx="3" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        <text x="790" y="758" fill="#d4d4d4" fontSize="12" textAnchor="middle">F2</text>

        <text x="750" y="800" fill="#a3a3a3" fontSize="10" textAnchor="middle">FORNOS INDUSTRIAIS</text>

        {/* ================ DISTRIBUIÇÃO ESSENCIAL ================ */}
        
        <line x1="1000" y1="540" x2="1000" y2="580" {...lineStyle} />
        <line x1="940" y1="580" x2="1060" y2="580" {...lineStyle} />

        {/* QDL Emergência */}
        <line x1="940" y1="580" x2="940" y2="620" {...lineStyle} />
        <g {...nodeProps('qdl_emergencia')}>
          <rect x="860" y="620" width="160" height="55" rx="4"
            fill="url(#nodeGrad)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadow)" />
          <text x="940" y="645" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">QDL</text>
          <text x="940" y="662" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">EMERGÊNCIA</text>
        </g>

        {/* CCM Crítico */}
        <line x1="1060" y1="580" x2="1060" y2="720" {...lineStyle} />
        <g {...nodeProps('ccm_critico')}>
          <rect x="980" y="720" width="160" height="55" rx="4"
            fill="url(#nodeGrad)" stroke="#52525b" strokeWidth="1.25" filter="url(#nodeShadow)" />
          <text x="1060" y="745" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="600">CCM</text>
          <text x="1060" y="762" fill="#a1a1aa" fontSize="10" textAnchor="middle" letterSpacing="1.5">CRÍTICO</text>
        </g>

        {/* ================ DISJUNTORES (IEC) nos alimentadores ================ */}
        <g pointerEvents="none">
          {([
            [800, 105],                             // saída da subestação
            [200, 155], [800, 155], [1300, 155],    // alimentadores MT
            [200, 450], [450, 450], [650, 450], [1000, 450], // alimentadores BT
            [1300, 468],                            // disjuntor do gerador
          ] as [number, number][]).map(([x, y], i) => (
            <rect key={i} x={x - 7} y={y - 7} width="14" height="14" rx="2" fill="#0c0c0e" stroke="#e4e4e7" strokeWidth="1.5" />
          ))}
        </g>

        {/* ================ LEDs DE STATUS (SCADA) ================ */}
        <g pointerEvents="none">
          {([
            [888, 32],                                  // Subestação
            [288, 192], [888, 192], [1388, 192],        // Cubículos MT
            [288, 492], [738, 492], [1088, 492],        // QGBTs
            [508, 492],                                 // Banco Capacitor
            [208, 632], [388, 632], [618, 632],         // QDL Ilum., QDF Tomadas, CCM
            [818, 632], [1008, 632],                    // QDF Fornos, QDL Emergência
            [1128, 732],                                // CCM Crítico
            [1538, 442], [1538, 552], [1538, 662], [1538, 752], // Painéis
          ] as [number, number][]).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.5" fill="#4ade80" style={{ filter: 'drop-shadow(0 0 3px rgba(74,222,128,0.9))' }}>
              <animate attributeName="opacity" values="1;0.25;1" dur="2.4s" begin={`${(i % 5) * 0.45}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>

        {/* ================ LEGENDA ================ */}
        <g transform="translate(60, 830)">
          <rect x="-16" y="-21" width="1420" height="36" rx="10" fill="rgba(12,12,14,0.78)" stroke="#27272a" strokeWidth="1" />
          <text x="0" y="0" fill="#ffffff" fontSize="11" fontWeight="600" letterSpacing="1">LEGENDA</text>

          <g transform="translate(90, 0)">
            <line x1="0" y1="-4" x2="30" y2="-4" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
            <text x="38" y="0" fill="#d4d4d4" fontSize="11">Barramento MT 13,8kV</text>
          </g>

          <g transform="translate(255, 0)">
            <line x1="0" y1="-4" x2="30" y2="-4" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
            <text x="38" y="0" fill="#d4d4d4" fontSize="11">Barramento BT</text>
          </g>

          <line x1="378" y1="-14" x2="378" y2="6" stroke="#3f3f46" strokeWidth="1" />

          <g transform="translate(396, 0)">
            <circle cx="10" cy="-8" r="8" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="10" cy="0" r="8" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <text x="28" y="0" fill="#d4d4d4" fontSize="11">Transformador</text>
          </g>

          <g transform="translate(530, 0)">
            <rect x="0" y="-11" width="14" height="14" rx="2" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <text x="22" y="0" fill="#d4d4d4" fontSize="11">Disjuntor</text>
          </g>

          <g transform="translate(625, 0)">
            <rect x="0" y="-12" width="28" height="16" rx="2" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <text x="36" y="0" fill="#d4d4d4" fontSize="11">Painel</text>
          </g>

          <g transform="translate(715, 0)">
            <circle cx="10" cy="-4" r="11" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <text x="10" y="0" fill="#d4d4d4" fontSize="9" textAnchor="middle">M</text>
            <text x="30" y="0" fill="#d4d4d4" fontSize="11">Motor</text>
          </g>

          <g transform="translate(795, 0)">
            <circle cx="11" cy="-4" r="12" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <text x="11" y="-1" fill="#ffffff" fontSize="10" textAnchor="middle">G</text>
            <text x="32" y="0" fill="#d4d4d4" fontSize="11">Gerador</text>
          </g>

          <line x1="885" y1="-14" x2="885" y2="6" stroke="#3f3f46" strokeWidth="1" />

          <g transform="translate(903, 0)">
            <circle cx="6" cy="-4" r="4" fill="#4ade80" />
            <text x="16" y="0" fill="#d4d4d4" fontSize="11">Em operação</text>
          </g>

          <g transform="translate(1015, 0)">
            <line x1="0" y1="-4" x2="30" y2="-4" stroke="#fdba74" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="7 14" />
            <text x="38" y="0" fill="#d4d4d4" fontSize="11">Fluxo de energia</text>
          </g>

          <text x="1160" y="0" fill="#a3a3a3" fontSize="10">Toque ou passe o mouse para detalhes</text>
        </g>

      </svg>
    </div>
  );
}
