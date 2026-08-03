import { Link, useParams } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';
import { SEO, schemas } from '@/react-app/components/SEO';
import { ASSETS } from '@/react-app/data/content';
import { ArrowRight, ArrowLeft, Download, Play, Check, Loader2, ChevronDown } from 'lucide-react';

interface Product {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string | null;
  full_description: string | null;
  image_key: string | null;
  display_order: number;
  is_active: number;
}

interface ProductSpec {
  id: number;
  spec_value: string;
}

interface ProductFeature {
  id: number;
  feature_text: string;
}

interface ProductDoc {
  id: number;
  doc_type: string;
  doc_title: string;
  file_key: string | null;
  external_url: string | null;
}

interface ProductGalleryItem {
  id: number;
  image_key: string;
  caption: string | null;
}

interface FullProduct extends Product {
  specs: ProductSpec[];
  features: ProductFeature[];
  docs: ProductDoc[];
  gallery: ProductGalleryItem[];
}

// Helper to get image URL (handles both external URLs and file keys)
function getImageUrl(imageKey: string | null, fallback: string = ASSETS.panelsTech): string {
  if (!imageKey) return fallback;
  if (imageKey.startsWith('http')) return imageKey;
  return `/api/files/${imageKey}`;
}

// Intersection Observer hook for scroll animations
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}

// Product Detail Page - Apple Style
function ProductDetail({ slug }: { slug: string }) {
  const [produto, setProduto] = useState<FullProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const heroRef = useInView();
  const specsRef = useInView();
  const featuresRef = useInView();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/public/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduto(data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
      setIsLoading(false);
    };
    fetchProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !produto) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-40 pb-20 text-center px-6">
          <h1 className="text-5xl font-semibold text-neutral-900">Produto não encontrado</h1>
          <p className="text-neutral-500 mt-4 text-lg">O produto solicitado não existe ou foi removido.</p>
          <Link to="/produtos" className="inline-flex items-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-full font-medium mt-10 hover:bg-neutral-800 transition-all">
            Ver Todos os Produtos
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const imageUrl = getImageUrl(produto.image_key);
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://www.inntag.com.br${imageUrl}`;

  return (
    <div className="min-h-screen bg-neutral-50">
      <SEO
        title={`${produto.title} | Painéis Elétricos INNTAG`}
        description={produto.short_description || `${produto.title} - Painéis elétricos de alta qualidade com certificação IEC 61439 e NBR. Engenharia própria e fabricação sob medida.`}
        keywords={`${produto.title}, painéis elétricos, ${produto.subtitle || ''}, quadros elétricos, INNTAG, IEC 61439, NBR`}
        canonical={`https://www.inntag.com.br/produtos/${slug}`}
        image={fullImageUrl}
        schema={schemas.product(
          produto.title,
          produto.full_description || produto.short_description || `${produto.title} - Painel elétrico fabricado pela INNTAG`,
          fullImageUrl,
          `/produtos/${slug}`
        )}
      />
      <Navigation lightBackground />
      
      {/* Hero - Apple Product Style */}
      <section 
        ref={heroRef.ref}
        className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 bg-gradient-to-b from-neutral-100 to-white"
      >
        <div className="text-center max-w-4xl mx-auto">
          <Link 
            to="/produtos" 
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-8 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>Todos os Produtos</span>
          </Link>
          
          {produto.subtitle && (
            <p className="text-red-600 font-medium tracking-wide uppercase text-sm mb-4">
              {produto.subtitle}
            </p>
          )}
          
          <h1 className="text-6xl md:text-8xl font-semibold text-neutral-900 tracking-tight mb-6">
            {produto.title}
          </h1>
          
          {produto.short_description && (
            <p className="text-xl md:text-2xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
              {produto.short_description}
            </p>
          )}
        </div>
        
        {/* Product Image - Floating */}
        <div className="mt-12 w-full max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white z-10" />
            <img 
              src={imageUrl} 
              alt={produto.title}
              className="w-full h-auto max-h-[60vh] object-contain"
            />
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className={`mt-8 transition-all duration-1000 delay-500 ${heroRef.isInView ? 'opacity-100' : 'opacity-0'}`}>
          <ChevronDown size={24} className="text-neutral-400 animate-bounce" />
        </div>
      </section>

      {/* Specs Row - Apple Style */}
      {produto.specs.length > 0 && (
        <section 
          ref={specsRef.ref}
          className="py-24 px-6 border-t border-neutral-200"
        >
          <div className="max-w-6xl mx-auto">
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-1000 ${specsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {produto.specs.map((spec, index) => (
                <div 
                  key={spec.id} 
                  className="text-center"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-2">
                    {spec.spec_value}
                  </div>
                  <div className="text-sm text-neutral-500 uppercase tracking-wide">
                    {index === 0 ? 'Tensão' : index === 1 ? 'Corrente' : index === 2 ? 'Proteção' : 'Norma'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Description + Features */}
      <section 
        ref={featuresRef.ref}
        className="py-24 px-6 bg-neutral-950"
      >
        <div className="max-w-6xl mx-auto">
          <div className={`grid lg:grid-cols-2 gap-16 transition-all duration-1000 ${featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Description */}
            <div>
              <h2 className="text-4xl md:text-5xl font-semibold text-white mb-8 leading-tight">
                Engenharia de<br />precisão.
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed">
                {produto.full_description || 'Nossos produtos são projetados e fabricados seguindo as mais rigorosas normas técnicas brasileiras e internacionais, garantindo máxima confiabilidade e segurança para sua operação.'}
              </p>
            </div>
            
            {/* Features List */}
            <div className="space-y-6">
              {(produto.features.length > 0 ? produto.features : [
                { id: 1, feature_text: 'Conformidade com normas IEC/NBR' },
                { id: 2, feature_text: 'Ensaios de tipo completos' },
                { id: 3, feature_text: 'Garantia estendida de fábrica' },
                { id: 4, feature_text: 'Suporte técnico especializado' },
              ]).map((feature, index) => (
                <div 
                  key={feature.id}
                  className="flex items-start gap-4 transition-all duration-500"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-white" />
                  </div>
                  <span className="text-white text-lg">{feature.feature_text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {produto.gallery.length > 0 && (
        <section className="py-24 px-6 bg-neutral-100">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-semibold text-neutral-900 mb-12 text-center">Galeria</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {produto.gallery.map((img) => (
                <div key={img.id} className="aspect-[4/3] rounded-2xl overflow-hidden bg-white">
                  <img 
                    src={getImageUrl(img.image_key)} 
                    alt={img.caption || ''} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Documentation */}
      {produto.docs.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-neutral-900 mb-12 text-center">Documentação</h2>
            <div className="space-y-4">
              {produto.docs.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.external_url || (doc.file_key ? `/api/files/${doc.file_key}` : '#')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-6 rounded-2xl border border-neutral-200 hover:border-neutral-400 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      doc.doc_type === 'video' ? 'bg-blue-100' : 'bg-red-100'
                    }`}>
                      {doc.doc_type === 'video' ? (
                        <Play size={20} className="text-blue-600" />
                      ) : (
                        <Download size={20} className="text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{doc.doc_title}</h3>
                      <p className="text-sm text-neutral-500 uppercase">{doc.doc_type}</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-32 px-6 bg-gradient-to-b from-white to-neutral-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-6">
            Pronto para começar?
          </h2>
          <p className="text-neutral-500 text-xl mb-10 max-w-xl mx-auto">
            Entre em contato para uma proposta técnica personalizada.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/contato" 
              className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-4 rounded-full font-medium hover:bg-red-700 transition-all"
            >
              Solicitar Proposta
              <ArrowRight size={18} />
            </Link>
            <Link 
              to="/produtos" 
              className="inline-flex items-center justify-center gap-2 bg-neutral-200 text-neutral-900 px-8 py-4 rounded-full font-medium hover:bg-neutral-300 transition-all"
            >
              Ver Outros Produtos
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}

// Products Listing Page - Apple Style
export default function ProdutosPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const heroRef = useInView();

  useEffect(() => {
    if (!slug) {
      const fetchProducts = async () => {
        try {
          const res = await fetch('/api/public/products');
          if (res.ok) {
            const data = await res.json();
            setProducts(data);
          }
        } catch (err) {
          console.error('Error fetching products:', err);
        }
        setIsLoading(false);
      };
      fetchProducts();
    }
  }, [slug]);
  
  if (slug) {
    return <ProductDetail slug={slug} />;
  }
  
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Painéis e Sistemas Elétricos"
        description="Catálogo de produtos INNTAG: Cubículos MT, QGBT, CCM, QDF, Painéis de Proteção, Painéis de Excitação, Quadros Auxiliares. Engenharia própria, certificação IEC e NBR."
        keywords="painéis elétricos, cubículos média tensão, QGBT, CCM, QDF, painéis de proteção, quadros auxiliares, IEC 61439"
        canonical="/produtos"
        schema={schemas.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Produtos', url: '/produtos' }])}
      />
      <Navigation lightBackground />
      
      {/* Hero - Clean Apple Style */}
      <section 
        ref={heroRef.ref}
        className="min-h-[70vh] flex flex-col items-center justify-center px-6 pt-32 pb-16"
      >
        <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${heroRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-red-600 font-medium tracking-wide uppercase text-sm mb-6">
            Catálogo de Produtos
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-neutral-900 tracking-tight mb-8 leading-[1.1]">
            Painéis e Sistemas<br />
            <span className="text-neutral-400">Elétricos.</span>
          </h1>
          <p className="text-xl md:text-2xl text-neutral-500 max-w-2xl mx-auto">
            Soluções de engenharia para os setores mais exigentes da indústria.
          </p>
        </div>
      </section>

      {/* Products Grid - Magazine Style */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-1">
              {products.map((produto, index) => (
                <ProductCard key={produto.slug} product={produto} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 px-6 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">
            Projeto especial?
          </h2>
          <p className="text-neutral-400 text-xl mb-10 max-w-xl mx-auto">
            Desenvolvemos soluções personalizadas para atender às necessidades específicas da sua operação.
          </p>
          <Link 
            to="/contato" 
            className="inline-flex items-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-full font-medium hover:bg-neutral-100 transition-all"
          >
            Fale com um Especialista
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}

// Individual Product Card Component
function ProductCard({ product, index }: { product: Product; index: number }) {
  const cardRef = useInView();
  const isEven = index % 2 === 0;
  
  return (
    <div
      ref={cardRef.ref}
      className={`transition-all duration-700 ${cardRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <Link to={`/produtos/${product.slug}`} className="group block">
        <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16 py-16 border-t border-neutral-200 hover:bg-neutral-50 transition-colors px-8 lg:px-16 rounded-3xl`}>
          <div className="w-full lg:w-1/2 relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
              <img 
                src={getImageUrl(product.image_key)} 
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            {product.subtitle && (
              <p className="text-red-600 font-medium text-sm tracking-wide uppercase mb-3">
                {product.subtitle}
              </p>
            )}
            <h2 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight">
              {product.title}
            </h2>
            <p className="text-neutral-500 text-lg mb-8 leading-relaxed max-w-lg">
              {product.short_description || 'Clique para mais informações sobre este produto.'}
            </p>
            <span className="inline-flex items-center gap-2 text-red-600 font-medium group-hover:gap-3 transition-all">
              Saiba mais
              <ArrowRight size={18} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-32">
      <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-8">
        <div className="w-12 h-12 border-2 border-neutral-300 rounded-lg" />
      </div>
      <h3 className="text-3xl font-semibold text-neutral-900 mb-4">
        Catálogo em construção
      </h3>
      <p className="text-neutral-500 text-lg max-w-md mx-auto mb-10">
        Estamos preparando nosso catálogo digital. Entre em contato para conhecer nossa linha completa.
      </p>
      <Link 
        to="/contato" 
        className="inline-flex items-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-full font-medium hover:bg-neutral-800 transition-all"
      >
        Fale Conosco
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}
