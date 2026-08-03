import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/react-app/components/Navigation';
import { ArrowLeft, Phone, FileText, CheckCircle2 } from 'lucide-react';

interface SEOTerm {
  id: number;
  term: string;
  category: string;
  slug: string;
  page_title: string;
  page_content: string;
  meta_title: string;
  meta_description: string;
  hero_image: string | null;
  is_page_published: number;
  published_at: string;
}

export default function SEOTermPage() {
  const { category, slug } = useParams();
  const [term, setTerm] = useState<SEOTerm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchTerm();
  }, [category, slug]);

  const fetchTerm = async () => {
    try {
      const res = await fetch(`/api/public/seo-term/${category}/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setTerm(data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('Error fetching term:', err);
      setNotFound(true);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !term) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation lightBackground />
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Página não encontrada</h1>
            <p className="text-neutral-600 mb-8">O conteúdo que você procura não está disponível.</p>
            <Link
              to={category === 'produtos' ? '/produtos' : '/servicos'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para {category === 'produtos' ? 'Produtos' : 'Serviços'}
            </Link>
          </div>
        </div>
        
      </div>
    );
  }

  const categoryLabel = term.category === 'produtos' ? 'Produtos' : 'Serviços';
  const categoryPath = term.category === 'produtos' ? '/produtos' : '/servicos';

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{term.meta_title || term.page_title} | INNTAG</title>
        <meta name="description" content={term.meta_description || ''} />
        <meta property="og:title" content={term.meta_title || term.page_title} />
        <meta property="og:description" content={term.meta_description || ''} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://www.inntag.com.br/${term.category}/${term.slug}`} />
      </Helmet>

      <Navigation lightBackground />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
            <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
            <span>/</span>
            <Link to={categoryPath} className="hover:text-neutral-900 transition-colors">{categoryLabel}</Link>
            <span>/</span>
            <span className="text-neutral-900">{term.term}</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 leading-tight">
            {term.page_title}
          </h1>

          {/* Quick Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="px-4 py-1.5 bg-red-50 text-red-700 rounded-full font-medium">
              {categoryLabel}
            </span>
            <span className="text-neutral-500">
              INNTAG • Especialista em Soluções Elétricas
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div 
            className="prose prose-lg max-w-none prose-headings:text-neutral-900 prose-headings:font-bold prose-p:text-neutral-600 prose-li:text-neutral-600 prose-a:text-red-600 hover:prose-a:text-red-700"
            dangerouslySetInnerHTML={{ __html: term.page_content }}
          />
        </div>
      </article>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Precisa de {term.term}?
          </h2>
          <p className="text-xl text-neutral-400 mb-8 max-w-2xl mx-auto">
            A INNTAG é especialista em soluções elétricas industriais há mais de 17 anos. 
            Fale com nossos engenheiros para um projeto sob medida.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/551936483700"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Falar com Especialista
            </a>
            <Link
              to="/contato"
              className="flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Solicitar Orçamento
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white border-t border-neutral-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Anos de Experiência', value: '17+' },
              { label: 'Projetos Entregues', value: '1.000+' },
              { label: 'Clientes Atendidos', value: '500+' },
              { label: 'Certificação', value: 'ISO 9001' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-6">Conteúdo Relacionado</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              to="/produtos"
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-neutral-200 hover:border-red-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Nossos Produtos</p>
                <p className="text-sm text-neutral-500">QGBT, CCM, Cubículos e mais</p>
              </div>
            </Link>
            <Link
              to="/servicos"
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-neutral-200 hover:border-red-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Field Service</p>
                <p className="text-sm text-neutral-500">Manutenção e comissionamento</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      
    </div>
  );
}
