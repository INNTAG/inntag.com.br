import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import ConfigLayout from './ConfigLayout';
import { 
  Sparkles, Instagram, Copy, RefreshCw, FileText,
  Package, FolderKanban, BookOpen, MessageSquare, Trash2,
  Wand2, Save, X, ChevronRight, Palette, Check,
  Layout, Eye, Link2, Calendar, Clock, ChevronLeft
} from 'lucide-react';

interface SocialPost {
  id: number;
  post_type: string;
  category: string;
  title: string;
  content: string;
  hashtags: string;
  image_prompt: string;
  image_url: string;
  platform: string;
  status: string;
  scheduled_at: string;
  product_id: number;
  project_id: number;
  standard_id: number;
  created_at: string;
}

interface Template {
  id: number;
  name: string;
  post_type: string;
  platform: string;
  content_template: string;
  hashtags_template: string;
  tone: string;
}

interface DesignTemplate {
  id: number;
  name: string;
  template_type: string;
  layout_style: string;
  aspect_ratio: string;
  background_type: string;
  background_color: string;
  gradient_start: string;
  gradient_end: string;
  gradient_direction: string;
  accent_color: string;
  text_color: string;
  secondary_text_color: string;
  font_style: string;
  logo_position: string;
  overlay_style: string;
  badge_text: string;
}

// MetaAccount interface - for future Meta integration (#76)
// interface MetaAccount {
//   id: number;
//   account_type: string;
//   account_id: string;
//   account_name: string;
//   account_username: string;
//   profile_picture_url: string;
//   page_id: string;
//   is_active: number;
//   last_post_at: string;
//   created_at: string;
// }

interface Product { id: number; name: string; }
interface Project { id: number; name: string; year: string; }
interface Standard { id: number; code: string; title: string; }

const POST_TYPES = [
  { value: 'product', label: 'Produto', icon: Package },
  { value: 'project', label: 'Projeto', icon: FolderKanban },
  { value: 'standard', label: 'Norma Técnica', icon: BookOpen },
  { value: 'tip', label: 'Dica Técnica', icon: MessageSquare },
  { value: 'company', label: 'Institucional', icon: Sparkles },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Rascunho', color: 'bg-neutral-100 text-neutral-700' },
  { value: 'ready', label: 'Pronto', color: 'bg-blue-100 text-blue-700' },
  { value: 'scheduled', label: 'Agendado', color: 'bg-amber-100 text-amber-700' },
  { value: 'published', label: 'Publicado', color: 'bg-green-100 text-green-700' },
];

const TABS = [
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'templates', label: 'Templates', icon: Palette },
  { id: 'accounts', label: 'Contas', icon: Link2 },
];

// Template Preview Component
function TemplatePreview({ template, selected, onClick }: { 
  template: DesignTemplate; 
  selected: boolean;
  onClick: () => void;
}) {
  const getBackground = () => {
    if (template.background_type === 'solid') {
      return { backgroundColor: template.background_color || '#1a1a1a' };
    }
    if (template.background_type === 'gradient') {
      const dir = template.gradient_direction === 'to-br' ? '135deg' 
        : template.gradient_direction === 'to-r' ? '90deg'
        : template.gradient_direction === 'to-b' ? '180deg' : '135deg';
      return { 
        background: `linear-gradient(${dir}, ${template.gradient_start || '#1a1a1a'}, ${template.gradient_end || '#2d2d2d'})`
      };
    }
    return { backgroundColor: '#1a1a1a' };
  };

  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer group relative rounded-xl overflow-hidden transition-all ${
        selected ? 'ring-2 ring-orange-500 ring-offset-2' : 'hover:ring-2 hover:ring-neutral-300'
      }`}
    >
      <div 
        className="aspect-square p-4 flex flex-col justify-between"
        style={getBackground()}
      >
        {/* Logo position indicator */}
        <div className="flex justify-between items-start">
          {template.logo_position === 'top-left' && (
            <div className="w-6 h-2 rounded-full" style={{ backgroundColor: template.accent_color }} />
          )}
          {template.badge_text && (
            <span 
              className="text-[8px] font-bold px-1.5 py-0.5 rounded"
              style={{ 
                backgroundColor: template.accent_color,
                color: template.text_color
              }}
            >
              {template.badge_text}
            </span>
          )}
          {template.logo_position === 'top-right' && (
            <div className="w-6 h-2 rounded-full ml-auto" style={{ backgroundColor: template.accent_color }} />
          )}
        </div>

        {/* Content preview */}
        <div className={`flex-1 flex flex-col ${
          template.layout_style === 'centered' ? 'items-center justify-center text-center' :
          template.layout_style === 'quote' ? 'items-center justify-center' :
          'justify-end'
        }`}>
          {template.layout_style === 'quote' && (
            <div className="text-3xl mb-1" style={{ color: template.accent_color }}>"</div>
          )}
          <div 
            className="w-full h-2 rounded-full mb-1.5 max-w-[80%]"
            style={{ backgroundColor: template.text_color, opacity: 0.9 }}
          />
          <div 
            className="w-full h-1.5 rounded-full max-w-[60%]"
            style={{ backgroundColor: template.secondary_text_color || template.text_color, opacity: 0.5 }}
          />
          {template.layout_style === 'stats' && (
            <div className="flex gap-2 mt-3 w-full justify-center">
              {[1,2,3].map(i => (
                <div key={i} className="text-center">
                  <div className="text-xs font-bold" style={{ color: template.accent_color }}>17+</div>
                  <div className="w-8 h-1 rounded-full mt-0.5" style={{ backgroundColor: template.text_color, opacity: 0.3 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom accent */}
        {template.layout_style !== 'minimal' && (
          <div 
            className="w-8 h-1 rounded-full mt-2"
            style={{ backgroundColor: template.accent_color }}
          />
        )}
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <Eye className="w-5 h-5 text-white drop-shadow-lg" />
      </div>
    </div>
  );
}

// Full Template Preview Modal
function TemplatePreviewModal({ template, onClose }: { template: DesignTemplate; onClose: () => void }) {
  const getBackground = () => {
    if (template.background_type === 'solid') {
      return { backgroundColor: template.background_color || '#1a1a1a' };
    }
    if (template.background_type === 'gradient') {
      const dir = template.gradient_direction === 'to-br' ? '135deg' 
        : template.gradient_direction === 'to-r' ? '90deg'
        : template.gradient_direction === 'to-b' ? '180deg' : '135deg';
      return { 
        background: `linear-gradient(${dir}, ${template.gradient_start || '#1a1a1a'}, ${template.gradient_end || '#2d2d2d'})`
      };
    }
    return { backgroundColor: '#1a1a1a' };
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Instagram-sized preview */}
        <div 
          className="w-[400px] h-[400px] rounded-2xl overflow-hidden shadow-2xl p-8 flex flex-col justify-between"
          style={getBackground()}
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 rounded" style={{ backgroundColor: template.accent_color }} />
              <span className="text-xs font-medium" style={{ color: template.text_color, opacity: 0.6 }}>INNTAG</span>
            </div>
            {template.badge_text && (
              <span 
                className="text-xs font-bold px-2 py-1 rounded"
                style={{ backgroundColor: template.accent_color, color: template.text_color }}
              >
                {template.badge_text}
              </span>
            )}
          </div>

          {/* Main Content */}
          <div className={`flex-1 flex flex-col ${
            template.layout_style === 'centered' ? 'items-center justify-center text-center' :
            template.layout_style === 'quote' ? 'items-center justify-center' :
            template.layout_style === 'stats' ? 'items-center justify-center' :
            'justify-center'
          }`}>
            {template.layout_style === 'quote' && (
              <div className="text-6xl leading-none mb-2" style={{ color: template.accent_color }}>"</div>
            )}
            
            <h2 
              className={`font-bold mb-3 ${
                template.font_style === 'bold' ? 'text-3xl tracking-tight' :
                template.font_style === 'elegant' ? 'text-2xl font-light tracking-wide' :
                template.font_style === 'technical' ? 'text-xl font-mono' :
                template.font_style === 'minimal' ? 'text-2xl font-light' :
                'text-2xl'
              }`}
              style={{ color: template.text_color }}
            >
              Título do seu post aqui
            </h2>
            
            <p 
              className="text-sm max-w-[280px] leading-relaxed"
              style={{ color: template.secondary_text_color || template.text_color, opacity: 0.7 }}
            >
              Descrição ou conteúdo principal do post com informações relevantes para seu público.
            </p>

            {template.layout_style === 'stats' && (
              <div className="flex gap-8 mt-6">
                {[
                  { value: '17+', label: 'Anos' },
                  { value: '1000+', label: 'Projetos' },
                  { value: '24h', label: 'Suporte' }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold" style={{ color: template.accent_color }}>{stat.value}</div>
                    <div className="text-xs" style={{ color: template.text_color, opacity: 0.5 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="w-10 h-1.5 rounded-full" style={{ backgroundColor: template.accent_color }} />
            <span className="text-[10px] font-medium tracking-wider" style={{ color: template.text_color, opacity: 0.4 }}>
              inntag.com.br
            </span>
          </div>
        </div>

        {/* Template info */}
        <div className="mt-4 text-center">
          <h3 className="text-white font-medium">{template.name}</h3>
          <p className="text-white/50 text-sm mt-1">
            {POST_TYPES.find(t => t.value === template.template_type)?.label || template.template_type}
          </p>
        </div>
      </div>
    </div>
  );
}

// Calendar View Component
function CalendarView({ posts, onEditPost }: { posts: SocialPost[]; onEditPost: (post: SocialPost) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const getPostsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(post => post.scheduled_at?.startsWith(dateStr));
  };
  
  const scheduledPosts = posts.filter(p => p.status === 'scheduled' || p.scheduled_at);
  const readyPosts = posts.filter(p => p.status === 'ready' && !p.scheduled_at);
  
  const days = [];
  for (let i = 0; i < startPadding; i++) {
    days.push(<div key={`empty-${i}`} className="h-28 bg-neutral-50" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayPosts = getPostsForDay(day);
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
    days.push(
      <div 
        key={day} 
        className={`h-28 border-t border-l border-neutral-200 p-1.5 ${
          isToday ? 'bg-orange-50' : 'bg-white hover:bg-neutral-50'
        }`}
      >
        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-orange-600' : 'text-neutral-500'}`}>
          {day}
        </div>
        <div className="space-y-1 overflow-auto max-h-20">
          {dayPosts.map(post => (
            <button
              key={post.id}
              onClick={() => onEditPost(post)}
              className={`w-full text-left px-1.5 py-1 rounded text-[10px] truncate ${
                post.status === 'published' 
                  ? 'bg-green-100 text-green-700' 
                  : post.status === 'scheduled'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {post.title || 'Sem título'}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-neutral-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-neutral-900 w-48 text-center">
              {monthNames[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-neutral-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
              <span className="text-neutral-600">Agendado ({scheduledPosts.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
              <span className="text-neutral-600">Pronto ({readyPosts.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
              <span className="text-neutral-600">Publicado</span>
            </div>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-neutral-100">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center text-xs font-medium text-neutral-600">
                {day}
              </div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 border-b border-r border-neutral-200">
            {days}
          </div>
        </div>
        
        {/* Quick Schedule Section */}
        {readyPosts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Posts prontos para agendar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {readyPosts.slice(0, 6).map(post => (
                <button
                  key={post.id}
                  onClick={() => onEditPost(post)}
                  className="flex items-start gap-3 p-3 bg-white border border-neutral-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-neutral-900 truncate">{post.title || 'Sem título'}</h4>
                    <p className="text-xs text-neutral-500 truncate">{post.content?.slice(0, 50)}...</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfigSocial() {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [designTemplates, setDesignTemplates] = useState<DesignTemplate[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Template filter
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<DesignTemplate | null>(null);
  
  // Generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedDesignTemplate, setSelectedDesignTemplate] = useState<DesignTemplate | null>(null);
  const [genForm, setGenForm] = useState({
    post_type: 'product',
    template_id: '',
    product_id: '',
    project_id: '',
    standard_id: '',
    custom_topic: '',
    platform: 'instagram'
  });
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    content: string;
    hashtags: string;
    image_prompt: string;
  } | null>(null);
  
  // Edit state
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    hashtags: '',
    image_prompt: '',
    status: 'draft',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchData();
    
    // Check for Meta OAuth callback params
    const metaConnected = searchParams.get('meta_connected');
    const metaError = searchParams.get('meta_error');
    
    if (metaConnected) {
      alert(`${metaConnected} conta(s) conectada(s) com sucesso!`);
      searchParams.delete('meta_connected');
      setSearchParams(searchParams);
    } else if (metaError) {
      const errorMessages: Record<string, string> = {
        'no_code': 'Autorização cancelada pelo usuário',
        'no_pages': 'Nenhuma página com Instagram Business encontrada',
        'missing_credentials': 'Credenciais Meta não configuradas',
        'token_error': 'Erro ao obter token de acesso'
      };
      alert(errorMessages[metaError] || metaError);
      searchParams.delete('meta_error');
      setSearchParams(searchParams);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, templatesRes, designRes, productsRes, projectsRes, standardsRes] = await Promise.all([
        fetch('/api/admin/social/posts'),
        fetch('/api/admin/social/templates'),
        fetch('/api/admin/social/design-templates'),
        fetch('/api/admin/products'),
        fetch('/api/admin/projects'),
        fetch('/api/admin/standards')
      ]);
      
      setPosts(await postsRes.json());
      setTemplates(await templatesRes.json());
      setDesignTemplates(await designRes.json());
      setProducts(await productsRes.json());
      setProjects(await projectsRes.json());
      setStandards(await standardsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedContent(null);
    
    try {
      const res = await fetch('/api/admin/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genForm)
      });
      
      const data = await res.json();
      if (data.success) {
        setGeneratedContent({
          title: data.title,
          content: data.content,
          hashtags: data.hashtags,
          image_prompt: data.image_prompt
        });
      } else {
        alert(data.error || 'Erro ao gerar conteúdo');
      }
    } catch (error) {
      console.error('Error generating:', error);
      alert('Erro ao gerar conteúdo');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedContent) return;
    setSaving(true);
    
    try {
      const res = await fetch('/api/admin/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: genForm.post_type,
          platform: genForm.platform,
          product_id: genForm.product_id || null,
          project_id: genForm.project_id || null,
          standard_id: genForm.standard_id || null,
          status: 'draft',
          ...generatedContent
        })
      });
      
      if (res.ok) {
        setShowGenerator(false);
        setGeneratedContent(null);
        setSelectedDesignTemplate(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!selectedPost) return;
    setSaving(true);
    
    try {
      await fetch(`/api/admin/social/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      setSelectedPost(null);
      fetchData();
    } catch (error) {
      console.error('Error updating:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Excluir este post?')) return;
    
    try {
      await fetch(`/api/admin/social/posts/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const selectPost = (post: SocialPost) => {
    setSelectedPost(post);
    setEditForm({
      title: post.title || '',
      content: post.content || '',
      hashtags: post.hashtags || '',
      image_prompt: post.image_prompt || '',
      status: post.status || 'draft',
      notes: ''
    });
  };

  const filteredTemplates = templates.filter(t => t.post_type === genForm.post_type);
  
  const filteredDesignTemplates = designTemplates.filter(t => 
    templateFilter === 'all' || t.template_type === templateFilter
  );

  const openGeneratorWithTemplate = (template: DesignTemplate) => {
    setSelectedDesignTemplate(template);
    setGenForm(prev => ({ ...prev, post_type: template.template_type }));
    setShowGenerator(true);
  };

  return (
    <ConfigLayout>
      <div className="h-full flex flex-col bg-neutral-50">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Redes Sociais</h1>
              <p className="text-sm text-neutral-500">Crie conteúdo profissional com IA e templates de design</p>
            </div>
            <button
              onClick={() => setShowGenerator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              Gerar Conteúdo
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'posts' ? (
          <div className="flex-1 overflow-hidden flex">
            {/* Posts List */}
            <div className={`${selectedPost ? 'w-1/2' : 'w-full'} border-r border-neutral-200 overflow-auto`}>
              {loading ? (
                <div className="p-8 text-center text-neutral-500">Carregando...</div>
              ) : posts.length === 0 ? (
                <div className="p-8 text-center">
                  <Instagram className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                  <p className="text-neutral-500 mb-4">Nenhum post criado</p>
                  <button
                    onClick={() => setShowGenerator(true)}
                    className="text-orange-600 hover:underline"
                  >
                    Gerar primeiro conteúdo
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {posts.map(post => {
                    const typeInfo = POST_TYPES.find(t => t.value === post.post_type);
                    const statusInfo = STATUS_OPTIONS.find(s => s.value === post.status);
                    const TypeIcon = typeInfo?.icon || FileText;
                    
                    return (
                      <div
                        key={post.id}
                        onClick={() => selectPost(post)}
                        className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                          selectedPost?.id === post.id ? 'bg-orange-50 border-l-2 border-orange-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                            <TypeIcon className="w-5 h-5 text-neutral-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-neutral-900 truncate">
                                {post.title || 'Sem título'}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo?.color || 'bg-neutral-100'}`}>
                                {statusInfo?.label || post.status}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-600 line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                              <span className="flex items-center gap-1">
                                <Instagram className="w-3 h-3" />
                                {post.platform || 'Instagram'}
                              </span>
                              <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-neutral-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Post Detail Panel */}
            {selectedPost && (
              <div className="w-1/2 bg-white overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-neutral-900">Editar Post</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeletePost(selectedPost.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedPost(null)}
                        className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Título</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-neutral-700">Conteúdo</label>
                        <button
                          onClick={() => copyToClipboard(editForm.content)}
                          className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copiar
                        </button>
                      </div>
                      <textarea
                        value={editForm.content}
                        onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                        rows={8}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                      <p className="text-xs text-neutral-400 mt-1">{editForm.content.length}/2200 caracteres</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-neutral-700">Hashtags</label>
                        <button
                          onClick={() => copyToClipboard(editForm.hashtags)}
                          className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copiar
                        </button>
                      </div>
                      <textarea
                        value={editForm.hashtags}
                        onChange={e => setEditForm({ ...editForm, hashtags: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-neutral-700 mb-1 block">Prompt para Imagem</label>
                      <textarea
                        value={editForm.image_prompt}
                        onChange={e => setEditForm({ ...editForm, image_prompt: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        placeholder="Descrição para gerar imagem com IA..."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-neutral-700 mb-1 block">Status</label>
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleUpdatePost}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                      >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'templates' ? (
          /* Templates Tab */
          <div className="flex-1 overflow-auto p-6">
            {/* Filter */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-neutral-500">Filtrar:</span>
              <button
                onClick={() => setTemplateFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  templateFilter === 'all' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 hover:bg-neutral-200'
                }`}
              >
                Todos
              </button>
              {POST_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setTemplateFilter(type.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    templateFilter === type.value ? 'bg-neutral-900 text-white' : 'bg-neutral-100 hover:bg-neutral-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredDesignTemplates.map(template => (
                <div key={template.id} className="group">
                  <TemplatePreview
                    template={template}
                    selected={selectedDesignTemplate?.id === template.id}
                    onClick={() => setPreviewTemplate(template)}
                  />
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-neutral-900 truncate">{template.name}</h4>
                    <p className="text-xs text-neutral-500">
                      {POST_TYPES.find(t => t.value === template.template_type)?.label}
                    </p>
                  </div>
                  <button
                    onClick={() => openGeneratorWithTemplate(template)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-orange-500 hover:text-white text-neutral-700 text-xs rounded-lg transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    Usar template
                  </button>
                </div>
              ))}
            </div>

            {filteredDesignTemplates.length === 0 && (
              <div className="text-center py-12">
                <Layout className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                <p className="text-neutral-500">Nenhum template encontrado</p>
              </div>
            )}
          </div>
        ) : activeTab === 'calendar' ? (
          /* Calendar Tab */
          <CalendarView posts={posts} onEditPost={(post) => { setSelectedPost(post); setActiveTab('posts'); }} />
        ) : activeTab === 'accounts' ? (
          /* Accounts Tab - Meta Integration */
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl mx-auto text-center py-12">
              <Link2 className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Conexão com Redes Sociais</h3>
              <p className="text-neutral-500 mb-6">
                Em breve você poderá conectar suas contas do Instagram e Facebook para publicar diretamente.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                Aguardando configuração da API Meta Business
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal 
          template={previewTemplate} 
          onClose={() => setPreviewTemplate(null)} 
        />
      )}

      {/* Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Gerar Conteúdo com IA</h2>
                  <p className="text-sm text-neutral-500">
                    {selectedDesignTemplate 
                      ? `Template: ${selectedDesignTemplate.name}` 
                      : 'Selecione o tipo e a IA criará o post'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowGenerator(false); setGeneratedContent(null); setSelectedDesignTemplate(null); }}
                className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Configuration */}
                <div className="space-y-4">
                  {/* Selected Design Template Preview */}
                  {selectedDesignTemplate && (
                    <div className="bg-neutral-50 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <TemplatePreview 
                          template={selectedDesignTemplate} 
                          selected={false} 
                          onClick={() => {}} 
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-900">{selectedDesignTemplate.name}</h4>
                        <p className="text-sm text-neutral-500">Template de design selecionado</p>
                      </div>
                      <button
                        onClick={() => setSelectedDesignTemplate(null)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Tipo de Conteúdo</label>
                    <div className="grid grid-cols-2 gap-2">
                      {POST_TYPES.map(type => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() => setGenForm({ ...genForm, post_type: type.value, template_id: '', product_id: '', project_id: '', standard_id: '' })}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                              genForm.post_type === type.value
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {filteredTemplates.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Template de Texto</label>
                      <select
                        value={genForm.template_id}
                        onChange={e => setGenForm({ ...genForm, template_id: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Selecione um template...</option>
                        {filteredTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {genForm.post_type === 'product' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Produto</label>
                      <select
                        value={genForm.product_id}
                        onChange={e => setGenForm({ ...genForm, product_id: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Selecione um produto...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {genForm.post_type === 'project' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Projeto</label>
                      <select
                        value={genForm.project_id}
                        onChange={e => setGenForm({ ...genForm, project_id: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Selecione um projeto...</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name} {p.year ? `(${p.year})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {genForm.post_type === 'standard' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Norma Técnica</label>
                      <select
                        value={genForm.standard_id}
                        onChange={e => setGenForm({ ...genForm, standard_id: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Selecione uma norma...</option>
                        {standards.map(s => (
                          <option key={s.id} value={s.id}>{s.code} - {s.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(genForm.post_type === 'tip' || genForm.post_type === 'company') && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Tema</label>
                      <input
                        type="text"
                        value={genForm.custom_topic}
                        onChange={e => setGenForm({ ...genForm, custom_topic: e.target.value })}
                        placeholder="Ex: Manutenção preventiva em painéis elétricos"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Gerar Conteúdo
                      </>
                    )}
                  </button>
                </div>

                {/* Right: Preview */}
                <div className="bg-neutral-50 rounded-xl p-4">
                  {generatedContent ? (
                    <div className="space-y-4">
                      {/* Visual Preview with Design Template */}
                      <div 
                        className="aspect-square rounded-xl p-6 flex flex-col justify-between overflow-hidden"
                        style={selectedDesignTemplate ? {
                          background: selectedDesignTemplate.background_type === 'gradient'
                            ? `linear-gradient(135deg, ${selectedDesignTemplate.gradient_start}, ${selectedDesignTemplate.gradient_end})`
                            : selectedDesignTemplate.background_color || '#1a1a1a'
                        } : { background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)' }}
                      >
                        <div className="flex justify-between items-start">
                          <div 
                            className="w-10 h-3 rounded"
                            style={{ backgroundColor: selectedDesignTemplate?.accent_color || '#EF4444' }}
                          />
                          {selectedDesignTemplate?.badge_text && (
                            <span 
                              className="text-[10px] font-bold px-2 py-1 rounded"
                              style={{ 
                                backgroundColor: selectedDesignTemplate.accent_color,
                                color: selectedDesignTemplate.text_color 
                              }}
                            >
                              {selectedDesignTemplate.badge_text}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center">
                          <h3 
                            className="text-lg font-bold mb-2"
                            style={{ color: selectedDesignTemplate?.text_color || '#fff' }}
                          >
                            {generatedContent.title}
                          </h3>
                          <p 
                            className="text-xs line-clamp-4"
                            style={{ color: selectedDesignTemplate?.text_color || '#fff', opacity: 0.8 }}
                          >
                            {generatedContent.content.substring(0, 150)}...
                          </p>
                        </div>

                        <div 
                          className="w-8 h-1 rounded-full"
                          style={{ backgroundColor: selectedDesignTemplate?.accent_color || '#EF4444' }}
                        />
                      </div>

                      {/* Content Details */}
                      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-neutral-500">CONTEÚDO</span>
                            <button
                              onClick={() => copyToClipboard(generatedContent.content)}
                              className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              Copiar
                            </button>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{generatedContent.content}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-neutral-500">HASHTAGS</span>
                          <p className="text-sm text-blue-600 mt-1">{generatedContent.hashtags}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-medium text-neutral-500">PROMPT PARA IMAGEM</span>
                        <p className="text-xs text-neutral-600 mt-1">{generatedContent.image_prompt}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleGenerate}
                          disabled={generating}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-sm"
                        >
                          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                          Regenerar
                        </button>
                        <button
                          onClick={handleSaveGenerated}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                        >
                          <Save className="w-4 h-4" />
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                      <Sparkles className="w-12 h-12 mb-3" />
                      <p className="text-sm">O conteúdo gerado aparecerá aqui</p>
                      {!selectedDesignTemplate && (
                        <p className="text-xs mt-2 text-center max-w-[200px]">
                          Dica: Vá para a aba Templates para escolher um visual
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfigLayout>
  );
}
