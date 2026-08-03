import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Linkedin, Facebook, Twitter, ChevronRight } from 'lucide-react';
import { Navigation } from '@/react-app/components/Navigation';
import { ContactSection } from '@/react-app/components/ContactSection';
import { SEO, schemas } from '@/react-app/components/SEO';
import { ASSETS } from '@/react-app/data/content';

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image_url: string;
  author_name: string;
  author_role: string;
  is_featured: number;
  is_published: number;
  published_at: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  schema_type: string;
  view_count: number;
  tags?: string[];
}

const categoryLabels: Record<string, string> = {
  noticia: 'Notícia',
  artigo: 'Artigo Técnico',
  case: 'Case de Sucesso',
  release: 'Press Release'
};

const categoryColors: Record<string, string> = {
  noticia: 'bg-blue-500',
  artigo: 'bg-emerald-500',
  case: 'bg-amber-500',
  release: 'bg-purple-500'
};

// SEO Head component
function SEOHead({ article }: { article: Article }) {
  useEffect(() => {
    // Update document title
    document.title = article.meta_title || `${article.title} | INNTAG`;
    
    // Update meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('description', article.meta_description || article.excerpt);
    updateMeta('keywords', article.meta_keywords || '');
    updateMeta('og:title', article.og_title || article.title, true);
    updateMeta('og:description', article.og_description || article.excerpt, true);
    updateMeta('og:image', article.og_image || article.image_url, true);
    updateMeta('og:type', 'article', true);
    updateMeta('og:url', window.location.href, true);
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', article.og_title || article.title);
    updateMeta('twitter:description', article.og_description || article.excerpt);
    updateMeta('twitter:image', article.og_image || article.image_url);

    // Add JSON-LD structured data
    const existingScript = document.querySelector('script[data-article-schema]');
    if (existingScript) existingScript.remove();

    const schema = {
      '@context': 'https://schema.org',
      '@type': article.schema_type || 'Article',
      headline: article.title,
      description: article.excerpt,
      image: article.image_url,
      author: {
        '@type': 'Person',
        name: article.author_name || 'INNTAG'
      },
      publisher: {
        '@type': 'Organization',
        name: 'INNTAG',
        logo: { '@type': 'ImageObject', url: ASSETS.logo }
      },
      datePublished: article.published_at,
      dateModified: article.published_at,
      mainEntityOfPage: window.location.href
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-article-schema', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.title = 'INNTAG - Engenharia Elétrica de Alta Performance';
      const schemaScript = document.querySelector('script[data-article-schema]');
      if (schemaScript) schemaScript.remove();
    };
  }, [article]);

  return null;
}

// Article List Page
function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('todos');

  useEffect(() => {
    fetchArticles();
  }, [activeCategory]);

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'todos') params.append('category', activeCategory);
      const res = await fetch(`/api/public/articles?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const featured = articles.find(a => a.is_featured);
  const regular = articles.filter(a => !a.is_featured);

  return (
    <>
      <SEO
        title="Destaques | INNTAG Blog & Notícias"
        description="Acompanhe as últimas novidades, artigos técnicos e cases de sucesso do setor elétrico industrial. Blog INNTAG."
        keywords="blog INNTAG, notícias painéis elétricos, artigos técnicos, cases de sucesso, setor elétrico industrial"
        canonical="/destaques"
        schema={schemas.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Destaques', url: '/destaques' }])}
      />
      <Navigation />
      
      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-16 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="w-6 md:w-8 h-px bg-red-500" />
              <span className="text-red-500 text-xs md:text-sm font-semibold tracking-[0.15em] uppercase">Blog & Notícias</span>
              <div className="w-6 md:w-8 h-px bg-red-500" />
            </div>
            <h1 className="text-3xl md:text-6xl font-bold text-white tracking-tight mb-4 md:mb-6">
              Destaques
            </h1>
            <p className="text-neutral-400 text-base md:text-xl max-w-2xl mx-auto">
              Acompanhe as últimas novidades, artigos técnicos e cases de sucesso do setor elétrico.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 md:py-8 bg-neutral-50 border-b border-neutral-200 sticky top-16 md:top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-start md:justify-center gap-2 flex-nowrap md:flex-wrap overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'noticia', label: 'Notícias' },
              { key: 'artigo', label: 'Artigos Técnicos' },
              { key: 'case', label: 'Cases' },
              { key: 'release', label: 'Press Releases' }
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all ${
                  activeCategory === cat.key
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-neutral-500 text-lg">Nenhum artigo encontrado.</p>
              <p className="text-neutral-400 mt-2">Os destaques serão publicados em breve.</p>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <Link to={`/destaques/${featured.slug}`} className="block mb-8 md:mb-12 group">
                  <div className="relative h-[320px] md:h-[500px] rounded-2xl md:rounded-3xl overflow-hidden bg-neutral-900">
                    <img
                      src={featured.image_url || ASSETS.heroMain}
                      alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 p-5 md:p-12 flex flex-col justify-end">
                      <span className={`inline-block ${categoryColors[featured.category] || 'bg-red-500'} text-white text-[10px] md:text-xs font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-full mb-3 md:mb-4 w-fit`}>
                        {categoryLabels[featured.category] || 'Destaque'}
                      </span>
                      <h2 className="text-xl md:text-4xl font-bold text-white mb-2 md:mb-4 max-w-3xl group-hover:text-red-400 transition-colors line-clamp-2">
                        {featured.title}
                      </h2>
                      <p className="text-white/90 text-sm md:text-lg max-w-2xl mb-4 md:mb-6 line-clamp-2 hidden sm:block">
                        {featured.excerpt}
                      </p>
                      <div className="flex items-center gap-4 md:gap-6 text-white text-xs md:text-sm">
                        <span className="flex items-center gap-1.5 md:gap-2">
                          <Calendar size={14} className="md:w-4 md:h-4" />
                          {new Date(featured.published_at).toLocaleDateString('pt-BR')}
                        </span>
                        {featured.author_name && (
                          <span className="hidden sm:inline">Por {featured.author_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {regular.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <ContactSection />
    </>
  );
}

// Article Card Component
function ArticleCard({ article }: { article: Article }) {
  return (
    <Link to={`/destaques/${article.slug}`} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-red-200 hover:shadow-xl transition-all duration-300">
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.image_url || ASSETS.heroMain}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <span className={`absolute top-4 left-4 ${categoryColors[article.category] || 'bg-red-500'} text-white text-xs font-bold px-3 py-1 rounded-full`}>
            {categoryLabels[article.category] || article.category}
          </span>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-3 line-clamp-2 group-hover:text-red-600 transition-colors">
            {article.title}
          </h3>
          <p className="text-neutral-500 text-sm line-clamp-2 mb-4">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(article.published_at).toLocaleDateString('pt-BR')}
            </span>
            <span className="flex items-center gap-1 text-red-600 font-medium group-hover:gap-2 transition-all">
              Ler mais <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Single Article Page
function ArticlePage({ slug }: { slug: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/public/articles/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setArticle(data);
        // Fetch related articles
        const relRes = await fetch(`/api/public/articles?category=${data.category}&limit=3`);
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelated(relData.filter((a: Article) => a.slug !== slug).slice(0, 3));
        }
      }
    } catch (err) {
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Artigo não encontrado</h1>
          <Link to="/destaques" className="text-red-600 hover:underline">
            ← Voltar para Destaques
          </Link>
        </div>
        <ContactSection />
      </>
    );
  }

  return (
    <>
      <SEOHead article={article} />
      <Navigation />

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[500px]">
        <img
          src={article.image_url || ASSETS.heroMain}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-4xl mx-auto px-8 pb-16 w-full">
            <Link
              to="/destaques"
              className="inline-flex items-center gap-2 text-white hover:text-white/80 mb-6 transition-colors"
            >
              <ArrowLeft size={18} />
              Voltar para Destaques
            </Link>
            <span className={`inline-block ${categoryColors[article.category] || 'bg-red-500'} text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4`}>
              {categoryLabels[article.category] || article.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-white text-sm">
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                {new Date(article.published_at).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={16} />
                {Math.ceil((article.content?.length || 0) / 1000)} min de leitura
              </span>
              {article.author_name && (
                <span>Por <strong className="text-white">{article.author_name}</strong></span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-8">
          {/* Share */}
          <div className="flex items-center gap-4 mb-12 pb-8 border-b border-neutral-200">
            <span className="flex items-center gap-2 text-neutral-500 text-sm">
              <Share2 size={16} />
              Compartilhar:
            </span>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all"
            >
              <Linkedin size={18} />
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all"
            >
              <Facebook size={18} />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-all"
            >
              <Twitter size={18} />
            </a>
          </div>

          {/* Excerpt */}
          <p className="text-xl text-neutral-600 leading-relaxed mb-8 font-medium">
            {article.excerpt}
          </p>

          {/* Article Body */}
          <div
            className="prose prose-lg prose-neutral max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-neutral-600 prose-p:leading-relaxed
              prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-neutral-900
              prose-ul:my-6 prose-li:text-neutral-600
              prose-img:rounded-2xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-12 pt-8 border-t border-neutral-200">
              <Tag size={16} className="text-neutral-400" />
              {article.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-4 py-1.5 bg-neutral-100 text-neutral-600 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Author */}
          {article.author_name && (
            <div className="mt-12 p-8 bg-neutral-50 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center text-2xl font-bold text-neutral-500">
                  {article.author_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900">{article.author_name}</h4>
                  {article.author_role && (
                    <p className="text-neutral-500 text-sm">{article.author_role}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="py-16 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8">Artigos Relacionados</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map(rel => (
                <ArticleCard key={rel.id} article={rel} />
              ))}
            </div>
          </div>
        </section>
      )}

      <ContactSection />
    </>
  );
}

// Main Component
export default function Destaques() {
  const { slug } = useParams();

  if (slug) {
    return <ArticlePage slug={slug} />;
  }

  return <ArticleList />;
}
