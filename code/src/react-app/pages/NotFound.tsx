import { Link } from 'react-router';
import { Home, Zap, Wrench, Mail } from 'lucide-react';
import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-24">
        <div className="max-w-2xl text-center">
          <p className="text-orange-500 text-sm uppercase tracking-widest font-semibold mb-6">Erro 404</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Página não encontrada
          </h1>
          <p className="text-neutral-400 text-lg mb-12">
            O endereço acessado não existe ou foi movido. Use os atalhos abaixo para
            continuar navegando.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-full text-sm font-medium text-white transition-colors"
            >
              <Home className="w-4 h-4" />
              Página Inicial
            </Link>
            <Link
              to="/produtos"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium text-white transition-colors"
            >
              <Zap className="w-4 h-4" />
              Produtos
            </Link>
            <Link
              to="/servicos"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium text-white transition-colors"
            >
              <Wrench className="w-4 h-4" />
              Serviços
            </Link>
            <Link
              to="/contato"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contato
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
