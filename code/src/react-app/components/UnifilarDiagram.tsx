import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Zap } from 'lucide-react';

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

  // Line styling
  const lineStyle = { stroke: '#ffffff', strokeWidth: 2.5 };
  const busbarStyle = { stroke: '#ffffff', strokeWidth: 5 };
  const thinLineStyle = { stroke: '#d4d4d4', strokeWidth: 2 };
  const dashedLineStyle = { stroke: '#d4d4d4', strokeWidth: 2, strokeDasharray: '6,4' };

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
        
        {/* ================ SUBESTAÇÃO ================ */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('subestacao', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'subestacao'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="700" y="20" width="200" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="800" y="48" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="600">SUBESTAÇÃO</text>
          <text x="800" y="66" fill="#d4d4d4" fontSize="11" textAnchor="middle">138kV / 69kV / 34.5kV</text>
        </g>
        
        {/* Saída da subestação */}
        <line x1="800" y1="80" x2="800" y2="130" {...lineStyle} />
        
        {/* Barramento MT principal */}
        <line x1="200" y1="130" x2="1300" y2="130" {...busbarStyle} />
        {/* Label do barramento MT */}
        <rect x="1100" y="100" width="140" height="24" fill="rgba(0,0,0,0.8)" rx="3" />
        <text x="1170" y="117" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="500">BARRAMENTO MT</text>
        
        {/* Conexões para cubículos */}
        <line x1="200" y1="130" x2="200" y2="180" {...lineStyle} />
        <line x1="800" y1="130" x2="800" y2="180" {...lineStyle} />
        <line x1="1300" y1="130" x2="1300" y2="180" {...lineStyle} />

        {/* ================ CUBÍCULOS MT ================ */}
        
        {/* Cubículo ADM */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('cubiculo_adm', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'cubiculo_adm'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="100" y="180" width="200" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="200" y="208" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="500">CUBÍCULO MT</text>
          <text x="200" y="226" fill="#d4d4d4" fontSize="11" textAnchor="middle">ADM</text>
        </g>

        {/* Cubículo Fábrica */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('cubiculo_fabrica', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'cubiculo_fabrica'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="700" y="180" width="200" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="800" y="208" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="500">CUBÍCULO MT</text>
          <text x="800" y="226" fill="#d4d4d4" fontSize="11" textAnchor="middle">FÁBRICA</text>
        </g>

        {/* Cubículo Cogeração */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('cubiculo_cogeracao', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'cubiculo_cogeracao'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="1200" y="180" width="200" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="1300" y="208" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="500">CUBÍCULO MT</text>
          <text x="1300" y="226" fill="#d4d4d4" fontSize="11" textAnchor="middle">COGERAÇÃO</text>
        </g>

        {/* ================ TRANSFORMADORES ================ */}
        
        <line x1="200" y1="240" x2="200" y2="270" {...lineStyle} />
        <line x1="800" y1="240" x2="800" y2="270" {...lineStyle} />
        <line x1="1300" y1="240" x2="1300" y2="270" {...lineStyle} />

        {/* Trafo ADM */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('trafo_adm', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'trafo_adm'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <circle cx="200" cy="295" r="25" fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <circle cx="200" cy="345" r="25" fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="200" y="300" fill="#ffffff" fontSize="11" textAnchor="middle">AT</text>
          <text x="200" y="350" fill="#ffffff" fontSize="11" textAnchor="middle">BT</text>
        </g>
        <text x="260" y="320" fill="#d4d4d4" fontSize="11">TRAFO ADM</text>

        {/* Trafo Fábrica */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('trafo_fabrica', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'trafo_fabrica'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <circle cx="800" cy="295" r="25" fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <circle cx="800" cy="345" r="25" fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="800" y="300" fill="#ffffff" fontSize="11" textAnchor="middle">AT</text>
          <text x="800" y="350" fill="#ffffff" fontSize="11" textAnchor="middle">BT</text>
        </g>
        <text x="860" y="320" fill="#d4d4d4" fontSize="11">TRAFO FÁBRICA</text>

        {/* Trafo Cogeração */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('trafo_cogeracao', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'trafo_cogeracao'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <circle cx="1300" cy="295" r="25" fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <circle cx="1300" cy="345" r="25" fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="1300" y="300" fill="#ffffff" fontSize="11" textAnchor="middle">AT</text>
          <text x="1300" y="350" fill="#ffffff" fontSize="11" textAnchor="middle">BT</text>
        </g>
        <text x="1360" y="320" fill="#d4d4d4" fontSize="11">TRAFO COG.</text>

        {/* ================ BARRAMENTO BT com TIEs ================ */}
        
        <line x1="200" y1="370" x2="200" y2="420" {...lineStyle} />
        <line x1="800" y1="370" x2="800" y2="420" {...lineStyle} />
        <line x1="1300" y1="370" x2="1300" y2="420" {...lineStyle} />

        {/* Barramento seção ADM */}
        <line x1="200" y1="420" x2="300" y2="420" {...busbarStyle} />
        
        {/* TIE 1 */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('tie_1', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'tie_1'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="300" y="400" width="70" height="40" rx="4" fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="335" y="425" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="500">TIE</text>
        </g>
        
        {/* Barramento seção Fábrica */}
        <line x1="370" y1="420" x2="1100" y2="420" {...busbarStyle} />
        
        {/* TIE 2 */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('tie_2', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'tie_2'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="1100" y="400" width="70" height="40" rx="4" fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="1135" y="425" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="500">TIE</text>
        </g>
        
        {/* Barramento seção Cogeração */}
        <line x1="1170" y1="420" x2="1300" y2="420" {...busbarStyle} />
        
        {/* Label do barramento BT */}
        <rect x="500" y="380" width="200" height="24" fill="rgba(0,0,0,0.85)" rx="3" />
        <text x="600" y="397" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="500">BARRAMENTO 480V / 440V / 380V</text>

        {/* ================ QGBT's ================ */}
        
        <line x1="200" y1="420" x2="200" y2="480" {...lineStyle} />
        <line x1="650" y1="420" x2="650" y2="480" {...lineStyle} />
        <line x1="1000" y1="420" x2="1000" y2="480" {...lineStyle} />

        {/* QGBT ADM */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('qgbt_adm', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'qgbt_adm'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="100" y="480" width="200" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="200" y="508" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="500">QGBT</text>
          <text x="200" y="526" fill="#d4d4d4" fontSize="11" textAnchor="middle">ADM</text>
        </g>

        {/* QGBT Fábrica */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('qgbt_fabrica', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'qgbt_fabrica'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="550" y="480" width="200" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="650" y="508" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="500">QGBT</text>
          <text x="650" y="526" fill="#d4d4d4" fontSize="11" textAnchor="middle">FÁBRICA</text>
        </g>

        {/* QGBT Essencial */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('qgbt_essencial', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'qgbt_essencial'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="900" y="480" width="200" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="1000" y="508" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="500">QGBT</text>
          <text x="1000" y="526" fill="#d4d4d4" fontSize="11" textAnchor="middle">ESSENCIAL</text>
        </g>

        {/* ================ BANCO DE CAPACITORES ================ */}
        
        {/* Conexão do barramento para o banco */}
        <line x1="450" y1="420" x2="450" y2="480" {...lineStyle} />
        
        {/* Banco de Capacitores - Painel */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('banco_capacitor', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'banco_capacitor'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="380" y="480" width="140" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="450" y="505" fill="#d4d4d4" fontSize="10" textAnchor="middle">BANCO</text>
          <text x="450" y="522" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="500">CAPACITOR</text>
        </g>

        {/* ================ COGERAÇÃO ================ */}
        
        <line x1="1300" y1="420" x2="1300" y2="510" {...lineStyle} />
        
        {/* Gerador */}
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('gerador', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'gerador'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <circle cx="1300" cy="570" r="55" fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="1300" y="565" fill="#ffffff" fontSize="26" textAnchor="middle" fontWeight="500">G</text>
          <text x="1300" y="590" fill="#d4d4d4" fontSize="18" textAnchor="middle">~</text>
        </g>
        <text x="1300" y="645" fill="#d4d4d4" fontSize="12" textAnchor="middle">GERADOR</text>

        {/* Excitação */}
        <line x1="1355" y1="570" x2="1420" y2="570" {...dashedLineStyle} />
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('excitacao', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'excitacao'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="1420" y="540" width="130" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="1485" y="565" fill="#d4d4d4" fontSize="10" textAnchor="middle">PAINEL</text>
          <text x="1485" y="582" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="500">EXCITAÇÃO</text>
        </g>

        {/* Proteção */}
        <line x1="1485" y1="540" x2="1485" y2="490" {...thinLineStyle} />
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('protecao', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'protecao'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="1420" y="430" width="130" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="1485" y="455" fill="#d4d4d4" fontSize="10" textAnchor="middle">PAINEL</text>
          <text x="1485" y="472" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="500">PROTEÇÃO</text>
        </g>

        {/* Sincronismo */}
        <line x1="1485" y1="600" x2="1485" y2="650" {...thinLineStyle} />
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('sincronismo', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'sincronismo'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="1420" y="650" width="130" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="1485" y="675" fill="#d4d4d4" fontSize="10" textAnchor="middle">PAINEL</text>
          <text x="1485" y="692" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="500">SINCRONISMO</text>
        </g>

        {/* QTA */}
        <line x1="1485" y1="710" x2="1485" y2="740" {...thinLineStyle} />
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('qta', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'qta'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="1420" y="740" width="130" height="60" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="1485" y="765" fill="#d4d4d4" fontSize="10" textAnchor="middle">PAINEL</text>
          <text x="1485" y="782" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="500">QTA</text>
        </g>

        {/* ================ DISTRIBUIÇÃO ADM ================ */}
        
        <line x1="200" y1="540" x2="200" y2="580" {...lineStyle} />
        <line x1="100" y1="580" x2="380" y2="580" {...lineStyle} />

        {/* QDL Iluminação */}
        <line x1="140" y1="580" x2="140" y2="620" {...lineStyle} />
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('qdl_iluminacao', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'qdl_iluminacao'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="60" y="620" width="160" height="55" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="140" y="645" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="500">QDL</text>
          <text x="140" y="662" fill="#d4d4d4" fontSize="10" textAnchor="middle">ILUMINAÇÃO</text>
        </g>

        {/* Luminárias */}
        <line x1="140" y1="675" x2="140" y2="710" {...thinLineStyle} />
        <line x1="80" y1="710" x2="200" y2="710" {...thinLineStyle} />
        
        <line x1="95" y1="710" x2="95" y2="730" {...thinLineStyle} />
        <circle cx="95" cy="750" r="18" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        
        <line x1="140" y1="710" x2="140" y2="730" {...thinLineStyle} />
        <circle cx="140" cy="750" r="18" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        
        <line x1="185" y1="710" x2="185" y2="730" {...thinLineStyle} />
        <circle cx="185" cy="750" r="18" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        
        <text x="140" y="790" fill="#a3a3a3" fontSize="10" textAnchor="middle">LUMINÁRIAS</text>

        {/* QDF Tomadas */}
        <line x1="320" y1="580" x2="320" y2="620" {...lineStyle} />
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('qdf_tomadas', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'qdf_tomadas'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="240" y="620" width="160" height="55" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="320" y="645" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="500">QDF</text>
          <text x="320" y="662" fill="#d4d4d4" fontSize="10" textAnchor="middle">TOMADAS</text>
        </g>

        {/* ================ DISTRIBUIÇÃO FÁBRICA ================ */}
        
        <line x1="650" y1="540" x2="650" y2="580" {...lineStyle} />
        <line x1="500" y1="580" x2="800" y2="580" {...lineStyle} />

        {/* CCM Motores */}
        <line x1="550" y1="580" x2="550" y2="620" {...lineStyle} />
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('ccm', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'ccm'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="470" y="620" width="160" height="55" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="550" y="645" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="500">CCM</text>
          <text x="550" y="662" fill="#d4d4d4" fontSize="10" textAnchor="middle">MOTORES</text>
        </g>

        {/* Motores */}
        <line x1="550" y1="675" x2="550" y2="710" {...thinLineStyle} />
        <line x1="480" y1="710" x2="620" y2="710" {...thinLineStyle} />
        
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
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('qdf_fornos', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'qdf_fornos'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="670" y="620" width="160" height="55" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="750" y="645" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="500">QDF</text>
          <text x="750" y="662" fill="#d4d4d4" fontSize="10" textAnchor="middle">FORNOS</text>
        </g>

        {/* Fornos */}
        <line x1="750" y1="675" x2="750" y2="710" {...thinLineStyle} />
        <line x1="690" y1="710" x2="810" y2="710" {...thinLineStyle} />
        
        <line x1="710" y1="710" x2="710" y2="730" {...thinLineStyle} />
        <rect x="680" y="730" width="60" height="45" rx="3" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        <text x="710" y="758" fill="#d4d4d4" fontSize="12" textAnchor="middle">F1</text>

        <line x1="790" y1="710" x2="790" y2="730" {...thinLineStyle} />
        <rect x="760" y="730" width="60" height="45" rx="3" fill="rgba(0,0,0,0.5)" stroke="#d4d4d4" strokeWidth="1.5" />
        <text x="790" y="758" fill="#d4d4d4" fontSize="12" textAnchor="middle">F2</text>

        <text x="750" y="800" fill="#a3a3a3" fontSize="10" textAnchor="middle">FORNOS INDUSTRIAIS</text>

        {/* ================ DISTRIBUIÇÃO ESSENCIAL ================ */}
        
        <line x1="1000" y1="540" x2="1000" y2="580" {...lineStyle} />
        <line x1="900" y1="580" x2="1100" y2="580" {...lineStyle} />

        {/* QDL Emergência */}
        <line x1="940" y1="580" x2="940" y2="620" {...lineStyle} />
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('qdl_emergencia', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'qdl_emergencia'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="860" y="620" width="160" height="55" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="940" y="645" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="500">QDL</text>
          <text x="940" y="662" fill="#d4d4d4" fontSize="10" textAnchor="middle">EMERGÊNCIA</text>
        </g>

        {/* CCM Crítico */}
        <line x1="1060" y1="580" x2="1060" y2="720" {...lineStyle} />
        <g className="cursor-pointer hover:opacity-80" onMouseEnter={(e) => handleMouseEnter('ccm_critico', e)} onMouseLeave={handleMouseLeave} onClick={() => { const item = items.find(i => i.item_key === 'ccm_critico'); if (item?.product_slug) window.location.href = `/produtos/${item.product_slug}`; }}>
          <rect x="980" y="720" width="160" height="55" rx="4" 
            fill="rgba(0,0,0,0.6)" stroke="#ffffff" strokeWidth="2" />
          <text x="1060" y="745" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="500">CCM</text>
          <text x="1060" y="762" fill="#d4d4d4" fontSize="10" textAnchor="middle">CRÍTICO</text>
        </g>

        {/* ================ LEGENDA ================ */}
        <g transform="translate(60, 830)">
          <text x="0" y="0" fill="#ffffff" fontSize="11" fontWeight="600">LEGENDA:</text>
          
          <g transform="translate(80, 0)">
            <line x1="0" y1="-4" x2="30" y2="-4" stroke="#ffffff" strokeWidth="4" />
            <text x="40" y="0" fill="#d4d4d4" fontSize="10">Barramento</text>
          </g>
          
          <g transform="translate(180, 0)">
            <circle cx="10" cy="-4" r="10" fill="transparent" stroke="#ffffff" strokeWidth="1.5" />
            <text x="30" y="0" fill="#d4d4d4" fontSize="10">Transformador</text>
          </g>
          
          <g transform="translate(320, 0)">
            <rect x="0" y="-12" width="30" height="18" rx="2" fill="transparent" stroke="#ffffff" strokeWidth="1.5" />
            <text x="40" y="0" fill="#d4d4d4" fontSize="10">Painel</text>
          </g>
          
          <g transform="translate(420, 0)">
            <circle cx="10" cy="-4" r="12" fill="transparent" stroke="#ffffff" strokeWidth="1.5" />
            <text x="10" y="0" fill="#d4d4d4" fontSize="9" textAnchor="middle">M</text>
            <text x="32" y="0" fill="#d4d4d4" fontSize="10">Motor</text>
          </g>
          
          <g transform="translate(510, 0)">
            <circle cx="12" cy="-4" r="14" fill="transparent" stroke="#ffffff" strokeWidth="1.5" />
            <text x="12" y="-1" fill="#ffffff" fontSize="11" textAnchor="middle">G</text>
            <text x="36" y="0" fill="#d4d4d4" fontSize="10">Gerador</text>
          </g>

          <text x="650" y="0" fill="#a3a3a3" fontSize="10">Passe o mouse nos elementos para detalhes</text>
        </g>

      </svg>
    </div>
  );
}
