import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { LogIn, Eye, EyeOff, Building2, Image, FileText, MapPin, Calendar, LogOut, ExternalLink, Phone, MessageCircle, Mail, User, Box, Wrench, ChevronDown, ChevronRight, FolderOpen, Layers, Clock, CheckCircle2, Circle, ArrowRight, ArrowLeft, X, ZoomIn } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const INNTAG_CONTACTS = {
  phone: '(19) 3648-3700',
  whatsapp: '5519936483700',
  email: 'contato@inntag.com.br',
  address: 'Av. de Cillo 4034, Pq Universitário, Americana/SP'
};

// Flat Flag SVG Components
const FlagBR = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5 rounded-sm overflow-hidden">
    <rect fill="#009B3A" width="512" height="512"/>
    <polygon fill="#FEDF00" points="256,64 448,256 256,448 64,256"/>
    <circle fill="#002776" cx="256" cy="256" r="96"/>
    <path d="M160,256 Q256,190 352,256" stroke="#FFFFFF" strokeWidth="12" fill="none"/>
  </svg>
);

const FlagUS = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5 rounded-sm overflow-hidden">
    <rect fill="#BF0A30" width="512" height="512"/>
    <rect fill="#FFFFFF" y="39" width="512" height="30"/>
    <rect fill="#FFFFFF" y="98" width="512" height="30"/>
    <rect fill="#FFFFFF" y="157" width="512" height="30"/>
    <rect fill="#FFFFFF" y="216" width="512" height="30"/>
    <rect fill="#FFFFFF" y="275" width="512" height="30"/>
    <rect fill="#FFFFFF" y="334" width="512" height="30"/>
    <rect fill="#FFFFFF" y="393" width="512" height="30"/>
    <rect fill="#FFFFFF" y="452" width="512" height="30"/>
    <rect fill="#002868" width="205" height="276"/>
  </svg>
);

const FlagES = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5 rounded-sm overflow-hidden">
    <rect fill="#AA151B" width="512" height="128"/>
    <rect fill="#F1BF00" y="128" width="512" height="256"/>
    <rect fill="#AA151B" y="384" width="512" height="128"/>
  </svg>
);

// Language translations
const translations = {
  pt: {
    portalTitle: 'Portal do Cliente',
    welcome: 'Bem-vindo',
    projects: 'Projetos',
    panels: 'Painéis',
    services: 'Serviços',
    documents: 'Documentos',
    photos: 'Fotos',
    contact: 'Contato',
    logout: 'Sair',
    phone: 'Telefone',
    email: 'Email',
    projectManager: 'Responsável',
    viewAll: 'Ver todos',
    noProjects: 'Nenhum projeto encontrado',
    contactUs: 'Entre em contato para iniciar um projeto',
    completed: 'Concluído',
    inProgress: 'Em Andamento',
    pending: 'Pendente',
    active: 'Ativo',
    scanForSupport: 'Escaneie para suporte',
    openWhatsApp: 'Abrir WhatsApp',
    back: 'Voltar ao site',
    location: 'Localização',
    date: 'Data',
    serialNumber: 'Número de Série',
    noDocs: 'Sem documentos',
    adminView: 'Visualização Admin',
    backToAdmin: 'Voltar ao Admin',
    followProjects: 'Acompanhe seus projetos e documentos',
  },
  en: {
    portalTitle: 'Client Portal',
    welcome: 'Welcome',
    projects: 'Projects',
    panels: 'Panels',
    services: 'Services',
    documents: 'Documents',
    photos: 'Photos',
    contact: 'Contact',
    logout: 'Logout',
    phone: 'Phone',
    email: 'Email',
    projectManager: 'Manager',
    viewAll: 'View all',
    noProjects: 'No projects found',
    contactUs: 'Contact us to start a project',
    completed: 'Completed',
    inProgress: 'In Progress',
    pending: 'Pending',
    active: 'Active',
    scanForSupport: 'Scan for support',
    openWhatsApp: 'Open WhatsApp',
    back: 'Back to site',
    location: 'Location',
    date: 'Date',
    serialNumber: 'Serial Number',
    noDocs: 'No documents',
    adminView: 'Admin View',
    backToAdmin: 'Back to Admin',
    followProjects: 'Track your projects and documents',
  },
  es: {
    portalTitle: 'Portal del Cliente',
    welcome: 'Bienvenido',
    projects: 'Proyectos',
    panels: 'Paneles',
    services: 'Servicios',
    documents: 'Documentos',
    photos: 'Fotos',
    contact: 'Contacto',
    logout: 'Salir',
    phone: 'Teléfono',
    email: 'Correo',
    projectManager: 'Responsable',
    viewAll: 'Ver todos',
    noProjects: 'No se encontraron proyectos',
    contactUs: 'Contáctenos para iniciar un proyecto',
    completed: 'Completado',
    inProgress: 'En Progreso',
    pending: 'Pendiente',
    active: 'Activo',
    scanForSupport: 'Escanee para soporte',
    openWhatsApp: 'Abrir WhatsApp',
    back: 'Volver al sitio',
    location: 'Ubicación',
    date: 'Fecha',
    serialNumber: 'Número de Serie',
    noDocs: 'Sin documentos',
    adminView: 'Vista de Admin',
    backToAdmin: 'Volver al Admin',
    followProjects: 'Sigue tus proyectos y documentos',
  }
};

type Language = 'pt' | 'en' | 'es';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  client_id: number;
  client_name: string;
  client_logo: string | null;
}

interface ProjectFile {
  id: number;
  file_key: string;
  file_name: string;
  file_type: string;
  category: string;
}

interface PanelDocument {
  id: number;
  file_key: string;
  file_name: string;
  file_type: string;
  category: string;
}

interface Panel {
  id: number;
  tag: string;
  serial_number?: string;
  description?: string;
  status: string;
  documents: PanelDocument[];
}

interface ServiceDocument {
  id: number;
  file_key: string;
  file_name: string;
  file_type: string;
  category: string;
  notes?: string;
}

interface Service {
  id: number;
  os_number: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  documents: ServiceDocument[];
}

interface Project {
  id: number;
  title: string;
  description?: string;
  location?: string;
  os_number?: string;
  project_year?: number;
  status: string;
  created_at: string;
  files: ProjectFile[];
  panels: Panel[];
  services: Service[];
  responsavel?: string;
  responsavel_email?: string;
  responsavel_telefone?: string;
  group_name?: string;
  group_logo_key?: string;
  group_sector?: string;
  unit_name?: string;
  unit_city?: string;
  unit_state?: string;
}

// Language Selector Component
function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [open, setOpen] = useState(false);
  
  const flags = {
    pt: { flag: <FlagBR />, label: 'Português' },
    en: { flag: <FlagUS />, label: 'English' },
    es: { flag: <FlagES />, label: 'Español' },
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-neutral-200 hover:bg-white hover:shadow-sm transition-all"
      >
        {flags[lang].flag}
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden min-w-[140px]">
            {Object.entries(flags).map(([key, { flag, label }]) => (
              <button
                key={key}
                onClick={() => { setLang(key as Language); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors ${lang === key ? 'bg-orange-50' : ''}`}
              >
                {flag}
                <span className={`text-sm ${lang === key ? 'font-semibold text-orange-600' : 'text-neutral-700'}`}>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Panel Card Component
function PanelCard({ panel, t }: { panel: Panel; t: typeof translations.pt }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden hover:shadow-lg transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Box className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-neutral-900 text-lg">{panel.tag}</div>
            {panel.serial_number && (
              <div className="text-sm text-neutral-500">{t.serialNumber}: {panel.serial_number}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
            panel.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' :
            panel.status === 'em_producao' ? 'bg-blue-100 text-blue-700' :
            'bg-neutral-100 text-neutral-600'
          }`}>
            {panel.status === 'concluido' ? t.completed : panel.status === 'em_producao' ? t.inProgress : panel.status}
          </span>
          {panel.documents.length > 0 && (
            <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
              {panel.documents.length}
            </span>
          )}
          <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="border-t border-neutral-100 p-5 bg-neutral-50/50">
          {panel.description && (
            <p className="text-neutral-600 mb-4 leading-relaxed">{panel.description}</p>
          )}
          {panel.documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {panel.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={`/api/files/${doc.file_key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-neutral-200 hover:border-orange-300 hover:shadow-md transition-all group"
                >
                  <FileText className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-neutral-700 truncate flex-1">{doc.file_name}</span>
                  <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-orange-500 transition-colors" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 italic">{t.noDocs}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Service Card Component
function ServiceCard({ service, t }: { service: Service; t: typeof translations.pt }) {
  const [expanded, setExpanded] = useState(false);
  
  const docsByCategory = service.documents.reduce((acc, doc) => {
    const cat = doc.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {} as Record<string, ServiceDocument[]>);

  const SERVICE_DOC_LABELS: Record<string, string> = {
    photo: 'Fotos', certificate: 'Certificados', safety: 'Segurança',
    report: 'Relatórios', expense: 'Despesas', technical: 'Técnicos', other: 'Outros'
  };
  
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden hover:shadow-lg transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-neutral-900 text-lg">OS {service.os_number}</div>
            {service.description && (
              <div className="text-sm text-neutral-500 line-clamp-1 max-w-xs">{service.description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
            service.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' :
            service.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
            service.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
            'bg-neutral-100 text-neutral-600'
          }`}>
            {service.status === 'concluido' ? t.completed : 
             service.status === 'em_andamento' ? t.inProgress : 
             service.status === 'pendente' ? t.pending : service.status}
          </span>
          {service.documents.length > 0 && (
            <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
              {service.documents.length}
            </span>
          )}
          <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[600px]' : 'max-h-0'}`}>
        <div className="border-t border-neutral-100 p-5 bg-neutral-50/50">
          {(service.start_date || service.end_date) && (
            <div className="flex gap-6 text-sm text-neutral-600 mb-4">
              {service.start_date && (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  Início: {new Date(service.start_date).toLocaleDateString('pt-BR')}
                </span>
              )}
              {service.end_date && (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Término: {new Date(service.end_date).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          )}
          {Object.keys(docsByCategory).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(docsByCategory).map(([category, docs]) => (
                <div key={category}>
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    {SERVICE_DOC_LABELS[category] || category}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {docs.map((doc) => (
                      <a
                        key={doc.id}
                        href={`/api/files/${doc.file_key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-neutral-200 hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <FileText className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-neutral-700 truncate flex-1">{doc.file_name}</span>
                        <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-blue-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 italic">{t.noDocs}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Project Card Component - Premium Apple Style
function ProjectCard({ project, t, formatDate }: { project: Project; t: typeof translations.pt; formatDate: (d: string) => string }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'panels' | 'services'>('overview');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const photos = project.files?.filter((f) => f.category === 'photo') || [];
  const documents = project.files?.filter((f) => f.category === 'document') || [];

  const statusConfig = {
    completed: { label: t.completed, icon: CheckCircle2, bg: 'bg-emerald-500', text: 'text-white' },
    in_progress: { label: t.inProgress, icon: Clock, bg: 'bg-blue-500', text: 'text-white' },
    default: { label: t.active, icon: Circle, bg: 'bg-neutral-200', text: 'text-neutral-700' }
  };
  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.default;
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
      {/* Project Header - Light Theme */}
      <div className="p-6 lg:p-8 border-b border-neutral-100 bg-gradient-to-br from-neutral-50 to-white">
        {/* Top Row: Group/Unit + Status */}
        <div className="flex items-start justify-between mb-4">
          <div>
            {project.group_name && (
              <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{project.group_name}</span>
                {project.unit_name && (
                  <>
                    <span className="text-neutral-300">›</span>
                    <span>{project.unit_name}</span>
                    {project.unit_city && (
                      <span className="text-neutral-400">({project.unit_city}/{project.unit_state})</span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.bg} ${status.text} text-sm font-semibold shadow-lg`}>
            <StatusIcon className="w-4 h-4" />
            {status.label}
          </div>
        </div>

        {/* Project Title and Info */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {project.os_number && (
                <span className="text-sm font-mono bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-orange-500/30">
                  OS {project.os_number}
                </span>
              )}
              {project.project_year && (
                <span className="text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-semibold">
                  {project.project_year}
                </span>
              )}
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">{project.title}</h3>
            {project.description && (
              <p className="text-neutral-600 leading-relaxed max-w-2xl">{project.description}</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3">
            {photos.length > 0 && (
              <div className="text-center px-4 py-3 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                <div className="text-2xl font-bold text-neutral-900">{photos.length}</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">{t.photos}</div>
              </div>
            )}
            {project.panels && project.panels.length > 0 && (
              <div className="text-center px-4 py-3 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                <div className="text-2xl font-bold text-neutral-900">{project.panels.length}</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">{t.panels}</div>
              </div>
            )}
            {project.services && project.services.length > 0 && (
              <div className="text-center px-4 py-3 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                <div className="text-2xl font-bold text-neutral-900">{project.services.length}</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">{t.services}</div>
              </div>
            )}
          </div>
        </div>

        {/* Location & Date */}
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-neutral-200">
          {project.location && (
            <div className="flex items-center gap-2 text-neutral-600">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="text-sm">{project.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-neutral-600">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="text-sm">{formatDate(project.created_at)}</span>
          </div>
          {project.responsavel && (
            <div className="flex items-center gap-2 text-neutral-600">
              <User className="w-4 h-4 text-orange-500" />
              <span className="text-sm">{project.responsavel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="border-b border-neutral-100">
        <div className="flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'overview' ? 'text-orange-600' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <FolderOpen className="w-4 h-4" />
              {t.documents}
            </span>
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500" />
            )}
          </button>
          {project.panels && project.panels.length > 0 && (
            <button
              onClick={() => setActiveTab('panels')}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                activeTab === 'panels' ? 'text-orange-600' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Layers className="w-4 h-4" />
                {t.panels} ({project.panels.length})
              </span>
              {activeTab === 'panels' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500" />
              )}
            </button>
          )}
          {project.services && project.services.length > 0 && (
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                activeTab === 'services' ? 'text-orange-600' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Wrench className="w-4 h-4" />
                {t.services} ({project.services.length})
              </span>
              {activeTab === 'services' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 lg:p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Photos Grid - Thumbnail Style with Lightbox */}
            {photos.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">
                  <Image className="w-4 h-4 text-orange-500" />
                  {t.photos} ({photos.length})
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                  {photos.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => setLightboxImage({ url: `/api/files/${file.file_key}`, name: file.file_name })}
                      className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200 hover:border-orange-400 hover:shadow-lg transition-all duration-300 group bg-neutral-100"
                    >
                      <img
                        src={`/api/files/${file.file_key}`}
                        alt={file.file_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {t.documents} ({documents.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((file) => (
                    <a
                      key={file.id}
                      href={`/api/files/${file.file_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-5 bg-gradient-to-br from-neutral-50 to-white rounded-2xl border border-neutral-200 hover:border-orange-300 hover:shadow-lg transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-neutral-900 truncate">{file.file_name}</div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wider">PDF Document</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {photos.length === 0 && documents.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-500">{t.noDocs}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'panels' && project.panels && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {project.panels.map((panel) => (
              <PanelCard key={panel.id} panel={panel} t={t} />
            ))}
          </div>
        )}

        {activeTab === 'services' && project.services && (
          <div className="space-y-4">
            {project.services.map((service) => (
              <ServiceCard key={service.id} service={service} t={t} />
            ))}
          </div>
        )}
      </div>

      {/* Contact Footer */}
      <div className="p-6 lg:p-8 bg-gradient-to-br from-neutral-50 to-neutral-100/50 border-t border-neutral-200/50">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Contact Cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a 
              href={`tel:${INNTAG_CONTACTS.phone.replace(/\D/g, '')}`}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-neutral-200 hover:border-orange-300 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">{t.phone}</div>
                <div className="font-bold text-neutral-900">{INNTAG_CONTACTS.phone}</div>
              </div>
            </a>
            <a 
              href={`mailto:${INNTAG_CONTACTS.email}`}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-neutral-200 hover:border-blue-300 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">{t.email}</div>
                <div className="font-bold text-neutral-900">{INNTAG_CONTACTS.email}</div>
              </div>
            </a>
          </div>

          {/* WhatsApp QR */}
          <div className="flex items-center gap-6 p-5 bg-white rounded-2xl border border-neutral-200">
            <QRCodeSVG 
              value={`https://wa.me/${INNTAG_CONTACTS.whatsapp}`}
              size={80}
              level="M"
            />
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
                <MessageCircle className="w-5 h-5" />
                WhatsApp SAC
              </div>
              <p className="text-xs text-neutral-500 mb-3">{t.scanForSupport}</p>
              <a
                href={`https://wa.me/${INNTAG_CONTACTS.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
              >
                <MessageCircle className="w-4 h-4" />
                {t.openWhatsApp}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative max-w-5xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-white text-sm font-medium truncate">{lightboxImage.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Portal() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>('pt');
  const t = translations[lang];
  
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loginMode, setLoginMode] = useState<'cliente' | 'admin'>('cliente');
  const [adminViewMode, setAdminViewMode] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<{ id: number; name: string; logo_key?: string; sector?: string } | null>(null);
  const [availableGroups, setAvailableGroups] = useState<{ id: number; name: string; logo_key?: string; sector?: string }[]>([]);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  
  // Check if we might be coming from admin - show loading instead of login form
  const [checkingAdminAccess, setCheckingAdminAccess] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hasAdminSession = !!sessionStorage.getItem('admin_session');
    const hasViewGroup = !!params.get('view_group');
    const hasAdminToken = !!params.get('admin_token');
    // Only show loading if we have a view_group with valid session, or admin_token in URL
    return (hasViewGroup && hasAdminSession) || hasAdminToken;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('view_group');
    const urlToken = params.get('admin_token');
    const adminToken = urlToken || sessionStorage.getItem('admin_session');
    
    // Admin com view_group específico
    if (groupId && adminToken) {
      fetchAdminView(parseInt(groupId), adminToken);
      return;
    }
    
    // Admin logado mas sem view_group - mostrar seleção de grupos
    if (adminToken) {
      setAdminLoggedIn(true);
      fetchAvailableGroups(adminToken);
      return;
    }
    
    // Não é admin - parar de verificar
    setCheckingAdminAccess(false);
    
    const storedUser = localStorage.getItem('portal_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchProjects(parsedUser.client_id);
    }
  }, []);

  const fetchAvailableGroups = async (token: string) => {
    try {
      const res = await fetch('/api/admin/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableGroups(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
    setCheckingAdminAccess(false);
  };

  const fetchAdminView = async (groupId: number, token: string) => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`/api/admin/portal-view/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setViewingGroup(data.group);
        setProjects(data.projects || []);
        setAdminViewMode(true);
        setUser({
          id: 0,
          username: 'admin',
          name: 'Administrador INNTAG',
          email: '',
          client_id: groupId,
          client_name: data.group.name,
          client_logo: data.group.logo_key ? `/api/files/${data.group.logo_key}` : null
        });
      } else {
        navigate('/portal');
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingProjects(false);
    setCheckingAdminAccess(false);
  };

  const fetchProjects = async (clientId: number) => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`/api/portal/projects?client_id=${clientId}`);
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoadingProjects(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMode === 'admin') {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: username, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Erro ao fazer login');
          setLoading(false);
          return;
        }
        sessionStorage.setItem('admin_session', data.token);
        navigate('/config/dashboard');
      } else {
        const res = await fetch('/api/portal/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Erro ao fazer login');
          setLoading(false);
          return;
        }
        localStorage.setItem('portal_user', JSON.stringify(data.user));
        localStorage.setItem('portal_token', data.token);
        setUser(data.user);
        fetchProjects(data.user.client_id);
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    if (adminViewMode) {
      navigate('/config/empresas');
      return;
    }
    localStorage.removeItem('portal_user');
    localStorage.removeItem('portal_token');
    setUser(null);
    setProjects([]);
  };

  const formatDate = (dateStr: string) => {
    const locales = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
    return new Date(dateStr).toLocaleDateString(locales[lang]);
  };

  // Login Screen or Admin Group Selector
  if (!user) {
    // Verificando acesso admin - mostrar loading
    if (checkingAdminAccess) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-50 flex items-center justify-center p-4">
          <div className="text-center">
            <img 
              src="/api/files/logo-inntag.png" 
              alt="INNTAG" 
              className="h-16 mx-auto mb-6" 
            />
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-neutral-500">Carregando...</p>
          </div>
        </div>
      );
    }
    
    // Admin já logado - mostrar seletor de grupos
    if (adminLoggedIn) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-50 flex items-center justify-center p-4">
          <div className="fixed top-4 right-4 z-50">
            <LanguageSelector lang={lang} setLang={setLang} />
          </div>

          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <img 
                src="/api/files/logo-inntag.png" 
                alt="INNTAG" 
                className="h-16 mx-auto mb-6" 
              />
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Portal do Cliente</h1>
              <p className="text-neutral-500">Você está logado como administrador. Selecione uma empresa para visualizar.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-neutral-200/50 shadow-2xl shadow-neutral-200/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-900">Empresas Cadastradas</h2>
                <button
                  onClick={() => navigate('/config/empresas')}
                  className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Admin
                </button>
              </div>
              
              {availableGroups.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhuma empresa cadastrada ainda.</p>
                  <button
                    onClick={() => navigate('/config/empresas')}
                    className="mt-4 text-orange-600 font-medium hover:text-orange-700"
                  >
                    Cadastrar empresa
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {availableGroups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => {
                        const token = sessionStorage.getItem('admin_session');
                        if (token) fetchAdminView(group.id, token);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 hover:bg-orange-50 border border-neutral-200 hover:border-orange-200 transition-all group"
                    >
                      <div className="w-14 h-14 rounded-xl bg-white border border-neutral-200 flex items-center justify-center overflow-hidden">
                        {group.logo_key ? (
                          <img src={`/api/files/${group.logo_key}`} alt="" className="w-full h-full object-contain p-2" />
                        ) : (
                          <Building2 className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-neutral-900 group-hover:text-orange-600 transition-colors">{group.name}</div>
                        {group.sector && (
                          <div className="text-sm text-neutral-500">{group.sector}</div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-orange-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center mt-6">
              <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao site
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Login normal
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-50 flex items-center justify-center p-4">
        {/* Language selector */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector lang={lang} setLang={setLang} />
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <img 
              src="/api/files/logo-inntag.png" 
              alt="INNTAG" 
              className="h-16 mx-auto mb-6" 
            />
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t.portalTitle}</h1>
            <p className="text-neutral-500">{t.followProjects}</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-neutral-200/50 shadow-2xl shadow-neutral-200/50">
            <div className="flex mb-8 bg-neutral-100 rounded-2xl p-1.5">
              <button
                type="button"
                onClick={() => { setLoginMode('cliente'); setError(''); }}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                  loginMode === 'cliente'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Cliente
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('admin'); setError(''); }}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                  loginMode === 'admin'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Administrador
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm mb-6">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {loginMode === 'admin' ? 'Email ou Nome' : 'Usuário'}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={loginMode === 'admin' ? 'Seu email ou nome' : 'Seu nome de usuário'}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 pr-12 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full mt-4 text-neutral-500 hover:text-neutral-700 py-2 text-sm font-medium transition-colors"
            >
              ← {t.back}
            </button>
          </form>

          <p className="text-center text-neutral-400 text-xs mt-6">
            Tecnologia, Inovação e Confiabilidade em Soluções Elétricas
          </p>
        </div>
      </div>
    );
  }

  // Dashboard Screen - Premium Apple Style
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-50">
      {/* Admin View Banner */}
      {adminViewMode && viewingGroup && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <Eye className="w-5 h-5" />
              <span className="font-semibold">{t.adminView}</span>
              <span className="opacity-75">— {viewingGroup.name}</span>
            </div>
            <button
              onClick={() => navigate('/config/empresas')}
              className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors font-medium"
            >
              ← {t.backToAdmin}
            </button>
          </div>
        </div>
      )}
      
      {/* Header - Apple Style */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img 
                src="/api/files/logo-inntag.png" 
                alt="INNTAG" 
                className="h-10" 
              />
              <div className="hidden md:block h-8 w-px bg-neutral-200" />
              <div className="hidden md:flex items-center gap-3">
                {user.client_logo ? (
                  <img src={user.client_logo} alt={user.client_name} className="h-8 w-auto object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-neutral-400" />
                  </div>
                )}
                <span className="font-semibold text-neutral-900">{user.client_name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageSelector lang={lang} setLang={setLang} />
              
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-neutral-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold text-sm">
                  {(user.name || user.username).charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-neutral-900">{user.name || user.username}</div>
                  {user.email && <div className="text-xs text-neutral-500">{user.email}</div>}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-all"
                title={t.logout}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Welcome Hero */}
        <div className="mb-10 lg:mb-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="text-sm text-orange-600 font-semibold uppercase tracking-wider mb-2">{t.portalTitle}</div>
              <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-3">
                {t.welcome}, {(user.name || user.username).split(' ')[0]}
              </h1>
              <p className="text-lg text-neutral-500">{t.followProjects}</p>
            </div>
            
            {/* Stats Overview */}
            <div className="flex gap-4">
              <div className="px-6 py-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                <div className="text-3xl font-bold text-neutral-900">{projects.length}</div>
                <div className="text-sm text-neutral-500">{t.projects}</div>
              </div>
              <div className="px-6 py-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                <div className="text-3xl font-bold text-neutral-900">
                  {projects.reduce((sum, p) => sum + (p.panels?.length || 0), 0)}
                </div>
                <div className="text-sm text-neutral-500">{t.panels}</div>
              </div>
              <div className="px-6 py-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                <div className="text-3xl font-bold text-neutral-900">
                  {projects.reduce((sum, p) => sum + (p.services?.length || 0), 0)}
                </div>
                <div className="text-sm text-neutral-500">{t.services}</div>
              </div>
            </div>
          </div>
        </div>

        {loadingProjects ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-neutral-500">Carregando projetos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-neutral-200 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3">{t.noProjects}</h3>
            <p className="text-neutral-500 max-w-md mx-auto">{t.contactUs}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} t={t} formatDate={formatDate} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/50 bg-white/50 backdrop-blur mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/api/files/logo-inntag.png" 
                alt="INNTAG" 
                className="h-8" 
              />
              <span className="text-sm text-neutral-500">
                Tecnologia, Inovação e Confiabilidade em Soluções Elétricas
              </span>
            </div>
            <div className="text-sm text-neutral-400">
              {INNTAG_CONTACTS.address}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
