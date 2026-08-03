import { Link } from 'react-router';
import { X, Zap, Wrench, ExternalLink, Settings } from 'lucide-react';
import { UnifilarDiagram } from '@/react-app/components/UnifilarDiagram';

export default function Unifilar() {
  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/api/files/lp-hero-panels.png)' }}
      />
      <div className="fixed inset-0 bg-black/75" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-white">Diagrama Unifilar</h1>
            <p className="text-xs text-neutral-400">Sistema Elétrico Industrial Típico</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/config/unifilar" className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
              Configurar
            </Link>
            <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-white" />
            </Link>
          </div>
        </div>
      </header>

      {/* Diagram */}
      <div className="relative z-10 pt-20 pb-4 px-2 md:px-4 w-full h-[calc(100vh-60px)] flex flex-col">
        <div className="flex-1 w-full">
          <UnifilarDiagram className="w-full h-full" />
        </div>

        {/* Links - bottom */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Link 
            to="/produtos" 
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-full text-sm font-medium text-white transition-colors"
          >
            <Zap className="w-4 h-4" />
            Ver Produtos
          </Link>
          <Link 
            to="/servicos" 
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium text-white transition-colors"
          >
            <Wrench className="w-4 h-4" />
            Field Service
          </Link>
          <Link 
            to="/contato" 
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Orçamento
          </Link>
        </div>
      </div>
    </div>
  );
}
