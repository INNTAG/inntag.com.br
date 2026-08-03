import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'product' | 'service';
  noindex?: boolean;
  // Article specific
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  // Language alternates for hreflang
  alternates?: { lang: string; url: string }[];
  // Schema.org structured data
  schema?: object | object[];
}

const BASE_URL = 'https://www.inntag.com.br';
const DEFAULT_IMAGE = '/api/files/hero-panels-inntag.png';
const SITE_NAME = 'Grupo INNTAG';

// Default language alternates
const DEFAULT_ALTERNATES = [
  { lang: 'pt-BR', url: '' },
  { lang: 'en', url: '' },
  { lang: 'es', url: '' },
  { lang: 'x-default', url: '' }
];

export function SEO({
  title,
  description = 'O Grupo INNTAG oferece soluções completas em energia solar, painéis elétricos, máquinas rotativas e serviços de manutenção. Mais de 17 anos de experiência e 1.000+ projetos executados.',
  keywords = 'energia solar, painéis elétricos, máquinas rotativas, manutenção elétrica, INNTAG, soluções elétricas',
  canonical,
  image = DEFAULT_IMAGE,
  imageAlt = 'Grupo INNTAG - Soluções Elétricas Industriais',
  type = 'website',
  noindex = false,
  publishedTime,
  modifiedTime,
  author = 'Grupo INNTAG',
  section,
  alternates,
  schema
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Soluções Elétricas, Energia Solar, Painéis e Máquinas`;
  const canonicalPath = canonical || '/';
  const fullCanonical = `${BASE_URL}${canonicalPath}`;
  
  // Ensure image is absolute URL
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  
  // Build alternates with current canonical path
  const langAlternates = alternates || DEFAULT_ALTERNATES.map(alt => ({
    lang: alt.lang,
    url: `${BASE_URL}${canonicalPath}`
  }));

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Language / Geo Tags */}
      <meta name="language" content="pt-BR" />
      <meta name="geo.region" content="BR-SP" />
      <meta name="geo.placename" content="Americana" />
      
      {/* Hreflang Tags for International SEO */}
      {langAlternates.map(alt => (
        <link key={alt.lang} rel="alternate" hrefLang={alt.lang} href={alt.url} />
      ))}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'article' ? 'article' : 'website'} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:locale:alternate" content="es_ES" />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:secure_url" content={fullImage} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      
      {/* Article specific OG tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@inntag" />
      <meta name="twitter:creator" content="@inntag" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={imageAlt} />
      
      {/* Additional Meta Tags for Rich Snippets */}
      <meta name="author" content={author} />
      <meta name="copyright" content="Grupo INNTAG" />
      <meta name="theme-color" content="#dc2626" />
      
      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(schema) ? schema : [schema])}
        </script>
      )}
    </Helmet>
  );
}

// Pre-built schema generators
export const schemas = {
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Grupo INNTAG",
    "description": "Soluções completas em energia solar, painéis elétricos, máquinas rotativas e serviços de manutenção elétrica.",
    "url": BASE_URL,
    "logo": "/api/files/inntag-logo.png",
    "foundingDate": "2009-03-16",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. de Cillo, 4034",
      "addressLocality": "Americana",
      "addressRegion": "SP",
      "postalCode": "13467-600",
      "addressCountry": "BR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-19-3648-3700",
      "contactType": "sales",
      "areaServed": "BR",
      "availableLanguage": "Portuguese"
    },
    "sameAs": [
      "https://www.linkedin.com/company/inntag"
    ]
  }),

  localBusiness: (city?: string) => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": city ? `INNTAG - ${city}` : "Grupo INNTAG",
    "description": `Soluções em painéis elétricos, field service e máquinas industriais${city ? ` em ${city}` : ''}.`,
    "url": BASE_URL,
    "image": DEFAULT_IMAGE,
    "telephone": "+55-19-3648-3700",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. de Cillo, 4034",
      "addressLocality": "Americana",
      "addressRegion": "SP",
      "postalCode": "13467-600",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -22.7394,
      "longitude": -47.3313
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "18:00"
    },
    "priceRange": "$$$$"
  }),

  service: (name: string, description: string, url: string) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": "Grupo INNTAG"
    },
    "url": `${BASE_URL}${url}`,
    "areaServed": "BR",
    "serviceType": "Industrial Electrical Services"
  }),

  product: (name: string, description: string, image: string, url: string) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "image": image,
    "url": `${BASE_URL}${url}`,
    "brand": {
      "@type": "Brand",
      "name": "INNTAG"
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "Grupo INNTAG"
    },
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "BRL",
      "seller": {
        "@type": "Organization",
        "name": "Grupo INNTAG"
      }
    }
  }),

  article: (title: string, description: string, image: string, datePublished: string, url: string) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image,
    "datePublished": datePublished,
    "dateModified": datePublished,
    "url": `${BASE_URL}${url}`,
    "author": {
      "@type": "Organization",
      "name": "Grupo INNTAG"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Grupo INNTAG",
      "logo": {
        "@type": "ImageObject",
        "url": "/api/files/inntag-logo.png"
      }
    }
  }),

  breadcrumb: (items: { name: string; url: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${BASE_URL}${item.url}`
    }))
  }),

  faq: (questions: { question: string; answer: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  })
};
