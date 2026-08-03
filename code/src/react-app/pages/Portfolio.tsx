import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Layout } from '@/react-app/components/Layout';
import { PageHero } from '@/react-app/components/PageHero';
import { Timeline } from '@/react-app/components/Timeline';
import { SEO, schemas } from '@/react-app/components/SEO';
import { ASSETS } from '@/react-app/data/content';
import { getCompanyAge } from '@/react-app/utils/companyAge';
import { ArrowRight, MapPin, Loader2 } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  description?: string;
  location?: string;
  client_name?: string;
  group_name?: string;
  unit_name?: string;
  unit_city?: string;
  unit_state?: string;
  status: string;
  cover_image?: string;
}

interface ProjectFile {
  id: number;
  file_key: string;
  category: string;
}

const CATEGORIAS = ['Todos', 'Painéis e Proteção', 'Field Service', 'Máquinas Rotativas', 'Painéis Elétricos'];

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectImages, setProjectImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/public/projects');
        const data = await res.json();
        const projectList = Array.isArray(data) ? data : [];
        setProjects(projectList);
        
        // Fetch first image for each project
        const images: Record<number, string> = {};
        await Promise.all(
          projectList.map(async (project: Project) => {
            try {
              const filesRes = await fetch(`/api/public/projects/${project.id}/files`);
              const files: ProjectFile[] = await filesRes.json();
              const photo = files.find((f) => f.category === 'photo');
              if (photo) {
                // file_key can be full URL or R2 key
                images[project.id] = photo.file_key.startsWith('http') 
                  ? photo.file_key 
                  : `/api/files/${photo.file_key}`;
              }
            } catch (err) {
              // Ignore errors for individual projects
            }
          })
        );
        setProjectImages(images);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  // Fallback images for projects without photos
  const fallbackImages = [ASSETS.project1, ASSETS.project2, ASSETS.project3, ASSETS.project4];

  const portfolioSchemas = [
    schemas.organization(),
    schemas.breadcrumb([
      { name: 'Home', url: 'https://www.inntag.com.br/' },
      { name: 'Portfólio', url: 'https://www.inntag.com.br/portfolio' },
    ]),
  ];

  return (
    <Layout >
      <SEO
        title="Portfólio de Projetos | INNTAG"
        description={`Mais de 1.000 projetos executados em ${getCompanyAge()} anos. Painéis elétricos, CCMs, QGBTs e subestações para indústrias em todo Brasil.`}
        keywords="portfólio INNTAG, projetos painéis elétricos, cases CCM, projetos industriais, subestações"
        canonical="https://www.inntag.com.br/portfolio"
        schema={portfolioSchemas}
      />
      <PageHero
        badge="Portfólio"
        title="Nosso Legado em Engenharia"
        subtitle={`Mais de 1.000 projetos executados em ${getCompanyAge()} anos de atuação. Cada entrega reflete nosso compromisso com excelência técnica e cumprimento de prazos.`}
        image={ASSETS.heroMain}
        cta={{ label: 'Solicitar Orçamento', href: '/contato' }}
        stats={[
          { value: '1.000+', label: 'Projetos Entregues' },
          { value: '100%', label: 'Compromisso' },
        ]}
      />

      {/* Timeline - História da INNTAG */}
      <Timeline />
      
      {/* Filter */}
      <section className="py-8 border-b border-border sticky top-20 bg-background/95 backdrop-blur-sm z-30">
        <div className="container-world">
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((cat, i) => (
              <button
                key={cat}
                className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                  i === 0 
                    ? 'bg-accent text-white border-accent' 
                    : 'border-border hover:border-accent hover:text-accent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Projects Grid */}
      <section className="section-content">
        <div className="container-world">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Nenhum projeto disponível no momento.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((projeto, index) => (
                <div
                  key={projeto.id}
                  className="card-world group overflow-hidden"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={projectImages[projeto.id] || fallbackImages[index % fallbackImages.length]} 
                      alt={projeto.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {(projeto.group_name || projeto.client_name) && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full">
                          {projeto.group_name || projeto.client_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-2 group-hover:text-accent transition-colors">
                      {projeto.title}
                    </h3>
                    {(projeto.unit_city || projeto.location) && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                        <MapPin size={14} />
                        <span>
                          {projeto.unit_city && projeto.unit_state 
                            ? `${projeto.unit_city}/${projeto.unit_state}`
                            : projeto.location}
                        </span>
                      </div>
                    )}
                    {projeto.description && (
                      <p className="text-muted-foreground line-clamp-2">
                        {projeto.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* CTA */}
      <section className="section-content bg-foreground text-background">
        <div className="container-world text-center">
          <h2 className="display-md mb-6 text-background">
            Seu projeto pode ser o próximo
          </h2>
          <p className="body-lg text-background/70 max-w-2xl mx-auto mb-8">
            Conte-nos sobre seu desafio. Vamos transformá-lo em mais um 
            caso de sucesso no nosso portfólio.
          </p>
          <Link 
            to="/contato" 
            className="btn-world-lg bg-accent text-white hover:bg-accent/90 inline-flex items-center gap-2"
          >
            Iniciar Conversa
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
