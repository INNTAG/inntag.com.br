import { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ExternalLink, 
  TrendingUp, FileText, Globe, Zap, BarChart3, Wand2, 
  MapPin, FileCode, Link2, Copy, Check, Plus, Edit2, Trash2,
  ArrowUp, ArrowDown, Minus, Target, Award, History, Eye, X
} from 'lucide-react';

interface SEOAudit {
  id: number;
  page_url: string;
  page_type: string;
  score: number;
  issues: string;
  recommendations: string;
  audit_date: string;
}

interface SEOTerm {
  id: number;
  term: string;
  category: string;
  target_url: string;
  current_position: number | null;
  best_position: number | null;
  last_checked_at: string | null;
  trend: 'up' | 'down' | 'stable' | null;
  search_volume: string | null;
  difficulty: string | null;
  notes: string | null;
  is_active: number;
  slug: string | null;
  page_title: string | null;
  page_content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_page_published: number;
  published_at: string | null;
}

interface RankingHistory {
  id: number;
  term_id: number;
  position: number;
  checked_at: string;
  source: string;
}

// Função para gerar slug automaticamente a partir do termo
function generateSlug(term: string): string {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Espaços viram hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início/fim
}

// Gera a URL de destino baseada no termo e categoria
function generateTargetUrl(term: string, category: string): string {
  const slug = generateSlug(term);
  const basePath = category === 'produtos' ? '/produtos' : '/servicos';
  return `${basePath}/${slug}`;
}

interface PageToAudit {
  url: string;
  type: string;
  title: string;
}

interface SitemapInfo {
  sitemapUrl: string;
  robotsUrl: string;
  totalUrls: number;
  breakdown: {
    static: number;
    products: number;
    services: number;
    machines: number;
    landingPages: number;
    articles: number;
  };
  lastGenerated: string;
}

interface SEOStats {
  totalPages: number;
  indexedPages: number;
  landingPages: number;
  avgScore: number;
  criticalIssues: number;
  warnings: number;
  lastAudit: string | null;
}

export default function ConfigSEO() {
  const [audits, setAudits] = useState<SEOAudit[]>([]);
  const [pages, setPages] = useState<PageToAudit[]>([]);
  const [stats, setStats] = useState<SEOStats | null>(null);
  const [sitemapInfo, setSitemapInfo] = useState<SitemapInfo | null>(null);
  const [terms, setTerms] = useState<SEOTerm[]>([]);
  const [selectedTermHistory, setSelectedTermHistory] = useState<RankingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isFixing, setIsFixing] = useState<number | null>(null);
  const [auditProgress, setAuditProgress] = useState<{ current: number; total: number; page: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScore, setFilterScore] = useState<'all' | 'good' | 'warning' | 'bad'>('all');
  const [selectedAudit, setSelectedAudit] = useState<SEOAudit | null>(null);
  const [activeTab, setActiveTab] = useState<'ranking' | 'audits' | 'sitemap' | 'tools'>('ranking');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  // Term management
  const [termCategory, setTermCategory] = useState<'all' | 'produtos' | 'servicos'>('all');
  const [termSearch, setTermSearch] = useState('');
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<SEOTerm | null>(null);
  const [termForm, setTermForm] = useState({ term: '', category: 'produtos', target_url: '/', current_position: '', search_volume: '', difficulty: '', notes: '' });
  const [showHistoryModal, setShowHistoryModal] = useState<SEOTerm | null>(null);
  
  // Content generation
  const [generatingContentId, setGeneratingContentId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [previewTerm, setPreviewTerm] = useState<SEOTerm | null>(null);
  
  // Main pages indexing
  const [indexingPage, setIndexingPage] = useState<string | null>(null);
  const [indexingAllPages, setIndexingAllPages] = useState(false);
  const [pageIndexStatus, setPageIndexStatus] = useState<Record<string, 'success' | 'error' | 'pending'>>({});

  const MAIN_PAGES = [
    { path: '/', title: 'Home', description: 'Página inicial' },
    { path: '/produtos', title: 'Produtos', description: 'Catálogo de produtos' },
    { path: '/servicos', title: 'Serviços', description: 'Field Service' },
    { path: '/maquinas', title: 'Máquinas', description: 'Máquinas especiais' },
    { path: '/clientes', title: 'Clientes', description: 'Nossos clientes' },
    { path: '/portfolio', title: 'Portfolio', description: 'Projetos realizados' },
    { path: '/destaques', title: 'Destaques', description: 'Artigos e notícias' },
    { path: '/contato', title: 'Contato', description: 'Fale conosco' },
  ];

  const token = sessionStorage.getItem('admin_session');
  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [auditsRes, pagesRes, statsRes, sitemapRes, termsRes] = await Promise.all([
        fetch('/api/admin/seo/audits', { headers }),
        fetch('/api/admin/seo/pages', { headers }),
        fetch('/api/admin/seo/stats', { headers }),
        fetch('/api/admin/seo/sitemap-info', { headers }),
        fetch('/api/admin/seo/terms', { headers }),
      ]);
      
      if (auditsRes.ok) setAudits(await auditsRes.json());
      if (pagesRes.ok) setPages(await pagesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (sitemapRes.ok) setSitemapInfo(await sitemapRes.json());
      if (termsRes.ok) setTerms(await termsRes.json());
    } catch (err) {
      console.error('Error fetching SEO data:', err);
    }
    setIsLoading(false);
  };

  const fetchTermHistory = async (termId: number) => {
    try {
      const res = await fetch(`/api/admin/seo/terms/${termId}/history`, { headers });
      if (res.ok) setSelectedTermHistory(await res.json());
    } catch (err) {
      console.error('Error fetching term history:', err);
    }
  };

  const handleSaveTerm = async () => {
    try {
      const url = editingTerm ? `/api/admin/seo/terms/${editingTerm.id}` : '/api/admin/seo/terms';
      const method = editingTerm ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...termForm,
          current_position: termForm.current_position ? parseInt(termForm.current_position) : null,
          is_active: 1
        }),
      });
      
      setShowTermModal(false);
      setEditingTerm(null);
      setTermForm({ term: '', category: 'produtos', target_url: '/', current_position: '', search_volume: '', difficulty: '', notes: '' });
      await fetchData();
    } catch (err) {
      console.error('Error saving term:', err);
    }
  };

  const handleDeleteTerm = async (id: number) => {
    if (!confirm('Excluir este termo?')) return;
    try {
      await fetch(`/api/admin/seo/terms/${id}`, { method: 'DELETE', headers });
      await fetchData();
    } catch (err) {
      console.error('Error deleting term:', err);
    }
  };

  const openEditTerm = (term: SEOTerm) => {
    setEditingTerm(term);
    setTermForm({
      term: term.term,
      category: term.category || 'produtos',
      target_url: term.target_url || '/',
      current_position: term.current_position?.toString() || '',
      search_volume: term.search_volume || '',
      difficulty: term.difficulty || '',
      notes: term.notes || ''
    });
    setShowTermModal(true);
  };

  const openHistoryModal = async (term: SEOTerm) => {
    setShowHistoryModal(term);
    await fetchTermHistory(term.id);
  };

  const searchOnGoogle = (term: string) => {
    window.open(`https://www.google.com.br/search?q=${encodeURIComponent(term)}`, '_blank');
  };

  const handleGenerateContent = async (term: SEOTerm) => {
    setGeneratingContentId(term.id);
    try {
      const res = await fetch(`/api/admin/seo/terms/${term.id}/generate-content`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        await fetchData();
        // Find updated term and show preview
        const updatedTerms = await fetch('/api/admin/seo/terms', { headers }).then(r => r.json());
        const updated = updatedTerms.find((t: SEOTerm) => t.id === term.id);
        if (updated) setPreviewTerm(updated);
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao gerar conteúdo');
      }
    } catch (err) {
      console.error('Error generating content:', err);
      alert('Erro ao gerar conteúdo');
    }
    setGeneratingContentId(null);
  };

  const handlePublishTerm = async (term: SEOTerm) => {
    setPublishingId(term.id);
    try {
      const res = await fetch(`/api/admin/seo/terms/${term.id}/publish`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        await fetchData();
        setPreviewTerm(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao publicar');
      }
    } catch (err) {
      console.error('Error publishing:', err);
      alert('Erro ao publicar');
    }
    setPublishingId(null);
  };

  const filteredTerms = terms.filter(t => {
    const matchesCategory = termCategory === 'all' || t.category === termCategory;
    const matchesSearch = t.term.toLowerCase().includes(termSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const termStats = {
    total: terms.length,
    tracked: terms.filter(t => t.current_position).length,
    top10: terms.filter(t => t.current_position && t.current_position <= 10).length,
    top30: terms.filter(t => t.current_position && t.current_position <= 30).length,
    improving: terms.filter(t => t.trend === 'up').length,
    declining: terms.filter(t => t.trend === 'down').length,
  };

  const runAudit = async (url: string, type: string) => {
    try {
      const res = await fetch('/api/admin/seo/audit', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type }),
      });
      
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error running audit:', err);
    }
  };

  const runFullAudit = async () => {
    setIsAuditing(true);
    setAuditProgress({ current: 0, total: pages.length, page: '' });
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      setAuditProgress({ current: i + 1, total: pages.length, page: page.title });
      await runAudit(page.url, page.type);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setAuditProgress(null);
    setIsAuditing(false);
  };

  // Index a single main page
  const handleIndexMainPage = async (pagePath: string) => {
    const fullUrl = `https://www.inntag.com.br${pagePath}`;
    setIndexingPage(pagePath);
    setPageIndexStatus(prev => ({ ...prev, [pagePath]: 'pending' }));
    
    try {
      const res = await fetch('/api/admin/seo/index-url', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl, action: 'URL_UPDATED' }),
      });
      
      const data = await res.json();
      setPageIndexStatus(prev => ({ 
        ...prev, 
        [pagePath]: data.success || data.queued ? 'success' : 'error' 
      }));
    } catch (err) {
      console.error('Error indexing page:', err);
      setPageIndexStatus(prev => ({ ...prev, [pagePath]: 'error' }));
    }
    setIndexingPage(null);
  };

  // Index all main pages
  const handleIndexAllMainPages = async () => {
    setIndexingAllPages(true);
    const urls = MAIN_PAGES.map(p => `https://www.inntag.com.br${p.path}`);
    
    try {
      const res = await fetch('/api/admin/seo/index-batch', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      
      const data = await res.json();
      if (data.success) {
        const newStatus: Record<string, 'success' | 'error' | 'pending'> = {};
        MAIN_PAGES.forEach((p, i) => {
          const result = data.results?.[i];
          newStatus[p.path] = result?.success || result?.queued ? 'success' : 'error';
        });
        setPageIndexStatus(newStatus);
      }
    } catch (err) {
      console.error('Error batch indexing:', err);
    }
    setIndexingAllPages(false);
  };

  const runAutoFix = async (audit: SEOAudit) => {
    setIsFixing(audit.id);
    
    try {
      const issues = audit.issues ? JSON.parse(audit.issues) : [];
      const recommendations = audit.recommendations ? JSON.parse(audit.recommendations) : [];
      
      const res = await fetch('/api/admin/seo/auto-fix', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pageUrl: audit.page_url, 
          pageType: audit.page_type, 
          issues,
          recommendations,
          score: audit.score
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.fixes && data.fixes.length > 0) {
          alert(`✅ Correções aplicadas:\n\n${data.fixes.join('\n')}`);
          await runAudit(audit.page_url, audit.page_type);
        } else if (data.error) {
          alert(`❌ Erro: ${data.error}`);
        } else {
          alert('Nenhuma correção automática disponível para esta página.');
        }
      } else {
        alert('Erro ao aplicar correções');
      }
    } catch (err) {
      console.error('Error auto-fixing:', err);
      alert('Erro ao aplicar correções automáticas');
    }
    
    setIsFixing(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (score >= 50) return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.page_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.page_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterScore === 'good') matchesFilter = audit.score >= 80;
    else if (filterScore === 'warning') matchesFilter = audit.score >= 50 && audit.score < 80;
    else if (filterScore === 'bad') matchesFilter = audit.score < 50;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestão de SEO</h1>
          <p className="text-neutral-500 mt-1">Otimize seu site para os motores de busca</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/sitemap.xml"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
          >
            <FileCode className="w-4 h-4" />
            Ver Sitemap
          </a>
          <button
            onClick={runFullAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isAuditing ? 'animate-spin' : ''}`} />
            {isAuditing ? 'Auditando...' : 'Auditar Todas'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {auditProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-700 font-medium">Auditando: {auditProgress.page}</span>
            <span className="text-blue-600 text-sm">{auditProgress.current}/{auditProgress.total}</span>
          </div>
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(auditProgress.current / auditProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-neutral-500 text-sm">Score Médio</span>
          </div>
          <p className={`text-2xl font-bold ${(stats?.avgScore || 0) >= 80 ? 'text-green-600' : (stats?.avgScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {stats?.avgScore || 0}
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Globe className="w-4 h-4 text-neutral-600" />
            </div>
            <span className="text-neutral-500 text-sm">Total Páginas</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{stats?.totalPages || 0}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-neutral-500 text-sm">Landing Pages</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats?.landingPages || 0}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-neutral-500 text-sm">Auditadas</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats?.indexedPages || 0}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-neutral-500 text-sm">Avisos</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats?.warnings || 0}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-neutral-500 text-sm">Críticos</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats?.criticalIssues || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        {[
          { id: 'ranking', label: 'Ranking de Termos', icon: Target },
          { id: 'audits', label: 'Auditorias', icon: BarChart3 },
          { id: 'sitemap', label: 'Sitemap & Robots', icon: FileCode },
          { id: 'tools', label: 'Ferramentas Google', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Ranking Tab */}
      {activeTab === 'ranking' && (
        <div className="space-y-6">
          {/* Ranking Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-5 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-neutral-500 text-sm">Total Termos</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{termStats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-neutral-500 text-sm">Monitorados</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{termStats.tracked}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                  <Award className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-neutral-500 text-sm">Top 10</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{termStats.top10}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-neutral-500 text-sm">Top 30</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{termStats.top30}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ArrowUp className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-neutral-500 text-sm">Subindo</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{termStats.improving}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-neutral-500 text-sm">Caindo</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{termStats.declining}</p>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar termos..."
                value={termSearch}
                onChange={(e) => setTermSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {['all', 'produtos', 'servicos'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTermCategory(cat as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    termCategory === cat
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat === 'produtos' ? 'Produtos' : 'Serviços'}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/seo/terms/fix-slugs', { method: 'POST' });
                    const data = await res.json();
                    if (data.success) {
                      alert(`${data.fixed} slugs corrigidos!`);
                      fetchData();
                    }
                  } catch (e) {
                    alert('Erro ao corrigir slugs');
                  }
                }}
                className="flex items-center gap-2 px-4 py-3 text-neutral-600 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Corrigir Slugs
              </button>
              
              <button
                onClick={() => {
                  setEditingTerm(null);
                  setTermForm({ term: '', category: 'produtos', target_url: '/', current_position: '', search_volume: '', difficulty: '', notes: '' });
                  setShowTermModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo Termo
              </button>
            </div>
          </div>

          {/* Terms Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Termo de Busca</th>
                  <th className="text-left px-4 py-4 text-sm font-semibold text-neutral-700">Categoria</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-700">Status</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-700">Posição</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-700">Melhor</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-700">Tendência</th>
                  <th className="text-left px-4 py-4 text-sm font-semibold text-neutral-700">Volume</th>
                  <th className="text-left px-4 py-4 text-sm font-semibold text-neutral-700">Última Verif.</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredTerms.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                      <div className="flex flex-col items-center gap-3">
                        <Target className="w-12 h-12 text-neutral-300" />
                        <p>Nenhum termo encontrado</p>
                        <p className="text-sm">Adicione termos para monitorar seu ranking</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTerms.map((term) => (
                    <tr key={term.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900">{term.term}</div>
                        <div className="text-sm text-neutral-500">{term.target_url}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          term.category === 'produtos' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {term.category === 'produtos' ? 'Produto' : 'Serviço'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {term.is_page_published ? (
                          <span className="flex items-center justify-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Publicado
                          </span>
                        ) : term.page_content ? (
                          <span className="flex items-center justify-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            <FileText className="w-3 h-3" />
                            Rascunho
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-500 rounded-full text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Sem página
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {term.current_position ? (
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                            term.current_position <= 10 ? 'bg-green-100 text-green-700' :
                            term.current_position <= 30 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            #{term.current_position}
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {term.best_position ? (
                          <span className="text-green-600 font-medium">#{term.best_position}</span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {term.trend === 'up' && <ArrowUp className="w-5 h-5 text-green-500 mx-auto" />}
                        {term.trend === 'down' && <ArrowDown className="w-5 h-5 text-red-500 mx-auto" />}
                        {term.trend === 'stable' && <Minus className="w-5 h-5 text-neutral-400 mx-auto" />}
                        {!term.trend && <span className="text-neutral-400">-</span>}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        {term.search_volume || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-500">
                        {term.last_checked_at ? new Date(term.last_checked_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Generate Content Button */}
                          {!term.page_content ? (
                            <button
                              onClick={() => handleGenerateContent(term)}
                              disabled={generatingContentId === term.id}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Gerar Conteúdo com IA"
                            >
                              {generatingContentId === term.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Wand2 className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => setPreviewTerm(term)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Ver Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {/* Publish Button */}
                          {term.page_content && (
                            <button
                              onClick={() => handlePublishTerm(term)}
                              disabled={publishingId === term.id}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                term.is_page_published 
                                  ? 'text-green-600 bg-green-50' 
                                  : 'text-orange-600 hover:bg-orange-50'
                              }`}
                              title={term.is_page_published ? 'Despublicar' : 'Publicar'}
                            >
                              {publishingId === term.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Globe className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => searchOnGoogle(term.term)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Verificar no Google"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openHistoryModal(term)}
                            className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Ver histórico"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditTerm(term)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTerm(term.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Help Card */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-3">Estratégia de Autoridade SEO</h3>
            <p className="text-sm text-white/80 mb-4">
              Este sistema ajuda a INNTAG a se posicionar como autoridade técnica no setor elétrico através de conteúdo educativo e informativo.
            </p>
            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Adicione termos:</strong> Digite palavras-chave que clientes pesquisam - o slug é gerado automaticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Dificuldade:</strong> Fácil = pouca concorrência (comece por esses), Difícil = muito disputado (invista depois)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Crie conteúdo:</strong> Use Landing Pages e Destaques para criar páginas informativas sobre cada termo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Monitore posições:</strong> Verifique no Google e atualize para acompanhar a evolução do ranking</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'audits' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar páginas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {['all', 'good', 'warning', 'bad'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterScore(filter as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterScore === filter
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                  }`}
                >
                  {filter === 'all' ? 'Todas' : filter === 'good' ? 'Bom' : filter === 'warning' ? 'Atenção' : 'Crítico'}
                </button>
              ))}
            </div>
          </div>

          {/* Audits Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Página</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Tipo</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-700">Score</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Data</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                      {audits.length === 0 ? (
                        <div className="flex flex-col items-center gap-3">
                          <TrendingUp className="w-12 h-12 text-neutral-300" />
                          <p>Nenhuma auditoria realizada ainda</p>
                          <p className="text-sm">Clique em "Auditar Todas" para começar</p>
                        </div>
                      ) : (
                        'Nenhum resultado encontrado'
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-neutral-400" />
                          <span className="text-neutral-900 font-medium">{audit.page_url}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm">
                          {audit.page_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {getScoreIcon(audit.score)}
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(audit.score)}`}>
                            {audit.score}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 text-sm">
                        {new Date(audit.audit_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedAudit(audit)}
                            className="px-3 py-1.5 text-orange-600 hover:bg-orange-50 rounded-lg text-sm font-medium transition-colors"
                          >
                            Detalhes
                          </button>
                          <button
                            onClick={() => runAutoFix(audit)}
                            disabled={isFixing === audit.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Auto-corrigir com IA"
                          >
                            {isFixing === audit.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Wand2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => runAudit(audit.page_url, audit.page_type)}
                            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Re-auditar"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <a
                            href={audit.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'sitemap' && sitemapInfo && (
        <div className="space-y-6">
          {/* URLs for Google */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">URLs para Indexação</h3>
            <p className="text-neutral-500 text-sm mb-4">
              Envie estas URLs para o Google Search Console para indexação mais rápida.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
                <FileCode className="w-5 h-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700">Sitemap XML</p>
                  <p className="text-neutral-500 text-sm">{sitemapInfo.sitemapUrl}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(sitemapInfo.sitemapUrl)}
                  className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  {copiedUrl === sitemapInfo.sitemapUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={sitemapInfo.sitemapUrl}
                  target="_blank"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Abrir
                </a>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
                <FileText className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700">Robots.txt</p>
                  <p className="text-neutral-500 text-sm">{sitemapInfo.robotsUrl}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(sitemapInfo.robotsUrl)}
                  className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  {copiedUrl === sitemapInfo.robotsUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={sitemapInfo.robotsUrl}
                  target="_blank"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Abrir
                </a>
              </div>
            </div>
          </div>

          {/* Sitemap Stats */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">URLs no Sitemap</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-neutral-50 rounded-xl">
                <p className="text-3xl font-bold text-neutral-900">{sitemapInfo.totalUrls}</p>
                <p className="text-sm text-neutral-500">Total</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{sitemapInfo.breakdown.static}</p>
                <p className="text-sm text-blue-600">Estáticas</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{sitemapInfo.breakdown.products}</p>
                <p className="text-sm text-green-600">Produtos</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{sitemapInfo.breakdown.services}</p>
                <p className="text-sm text-purple-600">Serviços</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <p className="text-3xl font-bold text-orange-600">{sitemapInfo.breakdown.landingPages}</p>
                <p className="text-sm text-orange-600">Landing Pages</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <p className="text-3xl font-bold text-amber-600">{sitemapInfo.breakdown.articles}</p>
                <p className="text-sm text-amber-600">Artigos</p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-3">Dicas para Ranking</h3>
            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Submeta o sitemap.xml no Google Search Console</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Crie landing pages para todas as cidades onde atua</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Publique artigos regularmente em Destaques</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Mantenha score de auditoria acima de 80 em todas as páginas</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="space-y-6">
          {/* Index Main Pages */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Indexar Páginas Principais</h3>
                <p className="text-neutral-500 text-sm mt-1">
                  Solicite ao Google para indexar as páginas principais do site
                </p>
              </div>
              <button
                onClick={handleIndexAllMainPages}
                disabled={indexingAllPages}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {indexingAllPages ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                Indexar Todas
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MAIN_PAGES.map((page) => (
                <div 
                  key={page.path}
                  className="flex items-center gap-3 p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">{page.title}</p>
                    <p className="text-sm text-neutral-500">{page.description}</p>
                    <p className="text-xs text-neutral-400 mt-1">inntag.com.br{page.path}</p>
                  </div>
                  
                  {pageIndexStatus[page.path] === 'success' && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Enviado
                    </span>
                  )}
                  {pageIndexStatus[page.path] === 'error' && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                      <XCircle className="w-3 h-3" />
                      Erro
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleIndexMainPage(page.path)}
                    disabled={indexingPage === page.path || indexingAllPages}
                    className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {indexingPage === page.path ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    Indexar
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> O Google pode levar alguns dias para processar as solicitações de indexação. 
                Use o Search Console para acompanhar o status.
              </p>
            </div>
          </div>

          {/* Google Tools */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Ferramentas do Google</h3>
            <p className="text-neutral-500 text-sm mb-6">
              Use estas ferramentas para monitorar e melhorar seu ranking no Google.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">Google Search Console</p>
                  <p className="text-sm text-neutral-500">Monitore indexação e performance</p>
                </div>
                <ExternalLink className="w-5 h-5 text-neutral-400" />
              </a>
              
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">Google Analytics</p>
                  <p className="text-sm text-neutral-500">Acompanhe visitantes e conversões</p>
                </div>
                <ExternalLink className="w-5 h-5 text-neutral-400" />
              </a>
              
              <a
                href="https://pagespeed.web.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">PageSpeed Insights</p>
                  <p className="text-sm text-neutral-500">Teste velocidade de carregamento</p>
                </div>
                <ExternalLink className="w-5 h-5 text-neutral-400" />
              </a>
              
              <a
                href="https://business.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">Google Meu Negócio</p>
                  <p className="text-sm text-neutral-500">Apareça no Google Maps</p>
                </div>
                <ExternalLink className="w-5 h-5 text-neutral-400" />
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Links Úteis</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Link2 className="w-5 h-5 text-neutral-500" />
                <span className="flex-1 text-sm text-neutral-600">Testar URL no Google:</span>
                <a
                  href={`https://search.google.com/test/rich-results?url=${encodeURIComponent('https://www.inntag.com.br')}`}
                  target="_blank"
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  Testar Rich Results
                </a>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Link2 className="w-5 h-5 text-neutral-500" />
                <span className="flex-1 text-sm text-neutral-600">Verificar indexação:</span>
                <a
                  href="https://www.google.com/search?q=site:inntag.com.br"
                  target="_blank"
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  Ver páginas indexadas
                </a>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Link2 className="w-5 h-5 text-neutral-500" />
                <span className="flex-1 text-sm text-neutral-600">Validar sitemap:</span>
                <a
                  href="https://www.xml-sitemaps.com/validate-xml-sitemap.html"
                  target="_blank"
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  Validar XML
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Detalhes da Auditoria</h2>
                <p className="text-neutral-500 text-sm mt-1">{selectedAudit.page_url}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(selectedAudit.score)}`}>
                {selectedAudit.score}/100
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Problemas Encontrados
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  {selectedAudit.issues && JSON.parse(selectedAudit.issues).length > 0 ? (
                    <ul className="space-y-2">
                      {JSON.parse(selectedAudit.issues).map((issue: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-amber-800">
                          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-amber-700">Nenhum problema crítico encontrado</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Recomendações
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  {selectedAudit.recommendations && JSON.parse(selectedAudit.recommendations).length > 0 ? (
                    <ul className="space-y-2">
                      {JSON.parse(selectedAudit.recommendations).map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-blue-800">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-blue-700">Página bem otimizada!</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  runAutoFix(selectedAudit);
                  setSelectedAudit(null);
                }}
                className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Auto-corrigir
              </button>
              <button
                onClick={() => runAudit(selectedAudit.page_url, selectedAudit.page_type)}
                className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors"
              >
                Re-auditar
              </button>
              <button
                onClick={() => setSelectedAudit(null)}
                className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Term Modal */}
      {showTermModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingTerm ? 'Editar Termo' : 'Novo Termo'}
              </h2>
              <button onClick={() => setShowTermModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Termo de Busca *</label>
                <input
                  type="text"
                  value={termForm.term}
                  onChange={(e) => {
                    const newTerm = e.target.value;
                    const newUrl = newTerm ? generateTargetUrl(newTerm, termForm.category) : '/';
                    setTermForm({ ...termForm, term: newTerm, target_url: newUrl });
                  }}
                  placeholder="Ex: painéis elétricos industriais"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <p className="text-xs text-neutral-400 mt-1">O slug será gerado automaticamente</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Categoria</label>
                  <select
                    value={termForm.category}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      const newUrl = termForm.term ? generateTargetUrl(termForm.term, newCategory) : '/';
                      setTermForm({ ...termForm, category: newCategory, target_url: newUrl });
                    }}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="produtos">Produtos</option>
                    <option value="servicos">Serviços</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Posição Atual</label>
                  <input
                    type="number"
                    value={termForm.current_position}
                    onChange={(e) => setTermForm({ ...termForm, current_position: e.target.value })}
                    placeholder="Ex: 15"
                    min="1"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">URL de Destino (gerada automaticamente)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={termForm.target_url}
                    readOnly
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-600"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-1">URL será: inntag.com.br{termForm.target_url}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Volume de Busca</label>
                  <input
                    type="text"
                    value={termForm.search_volume}
                    onChange={(e) => setTermForm({ ...termForm, search_volume: e.target.value })}
                    placeholder="Ex: 1.2K/mês"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Dificuldade</label>
                  <select
                    value={termForm.difficulty}
                    onChange={(e) => setTermForm({ ...termForm, difficulty: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="">Selecione</option>
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Observações</label>
                <textarea
                  value={termForm.notes}
                  onChange={(e) => setTermForm({ ...termForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Notas sobre este termo..."
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setShowTermModal(false)}
                className="px-6 py-2.5 text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTerm}
                disabled={!termForm.term}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {editingTerm ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Histórico de Posições</h2>
                <p className="text-sm text-neutral-500 mt-1">{showHistoryModal.term}</p>
              </div>
              <button onClick={() => setShowHistoryModal(null)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-80 overflow-y-auto">
              {selectedTermHistory.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p>Nenhum histórico registrado</p>
                  <p className="text-sm mt-1">Atualize a posição do termo para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTermHistory.map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                      <div>
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          h.position <= 10 ? 'bg-green-100 text-green-700' :
                          h.position <= 30 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          #{h.position}
                        </span>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {new Date(h.checked_at).toLocaleDateString('pt-BR', { 
                          day: '2-digit', month: 'short', year: 'numeric' 
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-neutral-200">
              <button
                onClick={() => setShowHistoryModal(null)}
                className="w-full px-6 py-2.5 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Preview Modal */}
      {previewTerm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-8">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Preview do Conteúdo</h2>
                <p className="text-sm text-neutral-500 mt-1">{previewTerm.term}</p>
              </div>
              <div className="flex items-center gap-3">
                {previewTerm.is_page_published ? (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Publicado
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    Rascunho
                  </span>
                )}
                <button onClick={() => setPreviewTerm(null)} className="p-2 hover:bg-neutral-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* SEO Preview */}
            <div className="p-6 border-b border-neutral-100 bg-neutral-50">
              <h3 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Preview no Google
              </h3>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
                <p className="text-blue-600 text-lg font-medium hover:underline cursor-pointer truncate">
                  {previewTerm.meta_title || previewTerm.page_title || previewTerm.term}
                </p>
                <p className="text-green-700 text-sm mt-1">
                  www.inntag.com.br/termo/{previewTerm.category}/{previewTerm.slug || generateSlug(previewTerm.term)}
                </p>
                <p className="text-neutral-600 text-sm mt-2 line-clamp-2">
                  {previewTerm.meta_description || 'Descrição não configurada...'}
                </p>
              </div>
            </div>
            
            {/* Content Preview */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <h3 className="text-sm font-semibold text-neutral-600 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Conteúdo da Página
              </h3>
              
              {/* Page Title */}
              <h1 className="text-3xl font-bold text-neutral-900 mb-6">
                {previewTerm.page_title || previewTerm.term}
              </h1>
              
              {/* Content */}
              <div 
                className="prose prose-neutral max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h3:text-lg prose-p:text-neutral-600 prose-p:leading-relaxed prose-li:text-neutral-600"
                dangerouslySetInnerHTML={{ __html: previewTerm.page_content || '<p class="text-neutral-400 italic">Conteúdo não gerado ainda...</p>' }}
              />
            </div>
            
            {/* Actions */}
            <div className="p-6 border-t border-neutral-200 flex items-center justify-between sticky bottom-0 bg-white rounded-b-2xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleGenerateContent(previewTerm)}
                  disabled={generatingContentId === previewTerm.id}
                  className="flex items-center gap-2 px-4 py-2.5 text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {generatingContentId === previewTerm.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Regenerar
                </button>
                {previewTerm.is_page_published && previewTerm.slug && (
                  <a
                    href={`/termo/${previewTerm.category}/${previewTerm.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Página
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewTerm(null)}
                  className="px-6 py-2.5 text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handlePublishTerm(previewTerm)}
                  disabled={publishingId === previewTerm.id}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 ${
                    previewTerm.is_page_published
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {publishingId === previewTerm.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  {previewTerm.is_page_published ? 'Despublicar' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
