import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, ExternalLink, MapPin, Eye, EyeOff, Save, X, FileText, Package, Wrench, Cog, Sparkles, Loader2, Zap, CheckCircle2, Building2, Globe, Anchor, Pickaxe, Wheat, Factory, Car, FlaskConical, Bolt, UtensilsCrossed, ChevronRight, Edit2, Send, BarChart3, Clock, AlertCircle, RefreshCw } from 'lucide-react';

type Vertical = 'paineis' | 'field_service' | 'maquinas' | 'cidades';

const VERTICALS: Record<Vertical, { label: string; icon: React.ElementType; color: string; bg: string; description: string }> = {
  paineis: { label: 'Painéis', icon: Package, color: '#3b82f6', bg: 'bg-blue-500', description: 'Painéis elétricos, CCM, QGBT, Cubículos' },
  field_service: { label: 'Field Service', icon: Wrench, color: '#22c55e', bg: 'bg-green-500', description: 'Serviços de campo e manutenção' },
  maquinas: { label: 'Máquinas', icon: Cog, color: '#a855f7', bg: 'bg-purple-500', description: 'Equipamentos e máquinas industriais' },
  cidades: { label: 'Cidades', icon: Globe, color: '#f97316', bg: 'bg-orange-500', description: 'Banco de cidades para LPs' },
};

interface City {
  id: number; name: string; slug: string; state: string; state_abbr: string; population: number | null;
  is_capital: number; has_oil_platform: number; region: string | null;
  has_port: number | null; has_mining: number | null; has_agro: number | null; has_steel: number | null;
  has_automotive: number | null; has_petrochemical: number | null; has_energy: number | null; has_food_industry: number | null;
}

interface LandingPage {
  id: number; city_id: number | null; slug: string; page_type: string; vertical: string; title: string;
  meta_title: string | null; meta_description: string | null; meta_keywords: string | null;
  h1_title: string | null; intro_text: string | null; custom_content: string | null; hero_image: string | null;
  is_active: number; view_count: number; template: string | null; city_name?: string; state_abbr?: string;
  seo_score?: number | null; google_indexed?: number | null; indexing_status?: string | null; last_indexed_at?: string | null;
}

interface Product { id: number; title: string; slug: string; }
interface Service { id: number; title: string; }
interface Machine { id: number; name: string; title?: string; }
interface LPLink { id: number; product_id?: number; service_id?: number; machine_id?: number; }

export default function ConfigLandingPages() {
  const [activeTab, setActiveTab] = useState<Vertical>('paineis');
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLP, setSelectedLP] = useState<LandingPage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSelectedCities, setBulkSelectedCities] = useState<number[]>([]);
  const [bulkProgress, setBulkProgress] = useState<{ total: number; current: number; currentCity: string } | null>(null);
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [linkedProducts, setLinkedProducts] = useState<LPLink[]>([]);
  const [linkedServices, setLinkedServices] = useState<LPLink[]>([]);
  const [linkedMachines, setLinkedMachines] = useState<LPLink[]>([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [cityFormData, setCityFormData] = useState({
    name: '', state: '', state_abbr: '', population: '', region: '',
    is_capital: false, has_oil_platform: false, has_port: false, has_mining: false,
    has_agro: false, has_steel: false, has_automotive: false, has_petrochemical: false,
    has_energy: false, has_food_industry: false,
  });
  
  // SEO state
  const [indexingId, setIndexingId] = useState<number | null>(null);
  const [showSeoDashboard, setShowSeoDashboard] = useState(false);
  const [seoDashboard, setSeoDashboard] = useState<{ total_lps: number; indexed: number; pending: number; avg_score: number; recent_indexing: any[] } | null>(null);
  const [batchIndexing, setBatchIndexing] = useState(false);

  const [formData, setFormData] = useState({
    city_id: '', slug: '', page_type: 'city', vertical: 'paineis', title: '',
    meta_title: '', meta_description: '', meta_keywords: '', h1_title: '', intro_text: '',
    custom_content: '', is_active: true, template: 'default',
  });

  const token = sessionStorage.getItem('admin_session');
  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [lpRes, citiesRes, productsRes, servicesRes, machinesRes] = await Promise.all([
        fetch('/api/admin/landing-pages', { headers }), fetch('/api/admin/cities', { headers }),
        fetch('/api/admin/products', { headers }), fetch('/api/admin/services', { headers }),
        fetch('/api/admin/machines', { headers }),
      ]);
      const [lpData, citiesData, productsData, servicesData, machinesData] = await Promise.all([
        lpRes.json(), citiesRes.json(), productsRes.json(), servicesRes.json(), machinesRes.json(),
      ]);
      setLandingPages(lpData); setCities(citiesData); setProducts(productsData);
      setServices(servicesData); setMachines(machinesData);
    } catch (err) { console.error('Error fetching data:', err); }
    setIsLoading(false);
  };

  const fetchLPDetails = async (id: number) => {
    try {
      const [productsRes, servicesRes, machinesRes] = await Promise.all([
        fetch(`/api/admin/landing-pages/${id}/products`, { headers }),
        fetch(`/api/admin/landing-pages/${id}/services`, { headers }),
        fetch(`/api/admin/landing-pages/${id}/machines`, { headers }),
      ]);
      setLinkedProducts(await productsRes.json());
      setLinkedServices(await servicesRes.json());
      setLinkedMachines(await machinesRes.json());
    } catch (err) { console.error('Error fetching LP details:', err); }
  };

  const getVerticalTitle = (vertical: Vertical, cityName?: string, stateAbbr?: string) => {
    const location = cityName && stateAbbr ? ` em ${cityName}/${stateAbbr}` : '';
    const titles: Record<Vertical, string> = {
      paineis: `Painéis Elétricos${location}`, field_service: `Field Service${location}`,
      maquinas: `Máquinas Industriais${location}`, cidades: `Landing Page${location}`,
    };
    return titles[vertical];
  };

  const handleCreate = () => {
    setFormData({
      city_id: '', slug: '', page_type: 'city', vertical: activeTab === 'cidades' ? 'paineis' : activeTab,
      title: '', meta_title: '', meta_description: '', meta_keywords: '', h1_title: '', intro_text: '',
      custom_content: '', is_active: true, template: 'default',
    });
    setSelectedLP(null); setLinkedProducts([]); setLinkedServices([]); setLinkedMachines([]);
  };

  const handleEdit = (lp: LandingPage) => {
    setFormData({
      city_id: lp.city_id?.toString() || '', slug: lp.slug, page_type: lp.page_type || 'city',
      vertical: lp.vertical || 'paineis', title: lp.title, meta_title: lp.meta_title || '',
      meta_description: lp.meta_description || '', meta_keywords: lp.meta_keywords || '',
      h1_title: lp.h1_title || '', intro_text: lp.intro_text || '', custom_content: lp.custom_content || '',
      is_active: lp.is_active === 1, template: lp.template || 'default',
    });
    setSelectedLP(lp); fetchLPDetails(lp.id);
  };

  const handleCityChange = async (cityId: string) => {
    setFormData(prev => ({ ...prev, city_id: cityId }));
    if (!cityId) return;
    const city = cities.find(c => c.id === parseInt(cityId));
    if (!city) return;
    const vertical = formData.vertical as Vertical;
    const verticalSlug = vertical === 'field_service' ? 'field-service' : vertical;
    const slug = `${verticalSlug}-${city.slug}-${city.state_abbr.toLowerCase()}`;
    const title = getVerticalTitle(vertical, city.name, city.state_abbr);
    setFormData(prev => ({ ...prev, city_id: cityId, slug, title, h1_title: title }));
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/landing-pages/generate-content', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_name: city.name, state_abbr: city.state_abbr, vertical: formData.vertical, products: [], services: [], page_type: formData.page_type }),
      });
      if (res.ok) {
        const content = await res.json();
        setFormData(prev => ({
          ...prev, meta_title: content.meta_title || `${title} - INNTAG`,
          meta_description: content.meta_description || `Soluções em ${VERTICALS[vertical].description.toLowerCase()} para ${city.name}/${city.state_abbr}.`,
          meta_keywords: content.meta_keywords || `${vertical} ${city.name}, INNTAG`, h1_title: content.h1_title || title, intro_text: content.intro_text || '',
        }));
      }
    } catch (err) { console.error('Error generating content:', err); }
    setIsGenerating(false);
  };

  const handleGenerateContent = async () => {
    const city = formData.city_id ? cities.find(c => c.id === parseInt(formData.city_id)) : null;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/landing-pages/generate-content', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_name: city?.name || null, state_abbr: city?.state_abbr || null, vertical: formData.vertical, products: [], services: [], page_type: formData.page_type }),
      });
      if (res.ok) {
        const content = await res.json();
        setFormData(prev => ({
          ...prev, meta_title: content.meta_title || prev.meta_title, meta_description: content.meta_description || prev.meta_description,
          meta_keywords: content.meta_keywords || prev.meta_keywords, h1_title: content.h1_title || prev.h1_title, intro_text: content.intro_text || prev.intro_text,
        }));
      }
    } catch (err) { console.error('Error generating content:', err); alert('Erro ao gerar conteúdo.'); }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = selectedLP ? `/api/admin/landing-pages/${selectedLP.id}` : '/api/admin/landing-pages';
      const res = await fetch(url, {
        method: selectedLP ? 'PUT' : 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, city_id: formData.city_id ? parseInt(formData.city_id) : null, is_active: formData.is_active ? 1 : 0 }),
      });
      if (res.ok) { const lp = await res.json(); setSelectedLP(lp); fetchData(); }
    } catch (err) { console.error('Error saving:', err); }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta landing page?')) return;
    try {
      await fetch(`/api/admin/landing-pages/${id}`, { method: 'DELETE', headers });
      fetchData(); if (selectedLP?.id === id) { setSelectedLP(null); }
    } catch (err) { console.error('Error deleting:', err); }
  };

  const handleToggleActive = async (lp: LandingPage) => {
    try {
      await fetch(`/api/admin/landing-pages/${lp.id}`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: lp.is_active ? 0 : 1 }),
      });
      fetchData();
    } catch (err) { console.error('Error toggling:', err); }
  };

  // Smart template selection based on city characteristics
  const selectTemplateForCity = (city: City, index: number): string => {
    // Match template to city's primary industry
    if (city.has_oil_platform === 1 || city.has_petrochemical === 1) return 'petroleo';
    if (city.has_mining === 1) return 'mineracao';
    if (city.has_port === 1) return 'naval';
    if (city.has_steel === 1) return 'siderurgia';
    if (city.has_automotive === 1) return 'automotivo';
    if (city.has_agro === 1) return index % 2 === 0 ? 'agro' : 'sucro';
    if (city.has_food_industry === 1) return 'alimentos';
    if (city.has_energy === 1) return 'energia';
    if (city.is_capital === 1) return 'corporativo';
    if (city.population && city.population > 1000000) return 'corporativo';
    
    // Rotate through remaining templates for variety
    const templates = ['default', 'industrial', 'energia', 'infra', 'quimico', 'saneamento'];
    return templates[index % templates.length];
  };

  const handleBulkGenerate = async () => {
    if (bulkSelectedCities.length === 0) return;
    const currentVertical = activeTab === 'cidades' ? 'paineis' : activeTab;
    setBulkProgress({ total: bulkSelectedCities.length, current: 0, currentCity: '' });
    for (let i = 0; i < bulkSelectedCities.length; i++) {
      const city = cities.find(c => c.id === bulkSelectedCities[i]);
      if (!city) continue;
      setBulkProgress({ total: bulkSelectedCities.length, current: i, currentCity: city.name });
      try {
        const title = getVerticalTitle(currentVertical as Vertical, city.name, city.state_abbr);
        // Select template based on city characteristics
        const selectedTemplate = selectTemplateForCity(city, i);
        const contentRes = await fetch('/api/admin/landing-pages/generate-content', {
          method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            city_name: city.name, 
            state_abbr: city.state_abbr, 
            vertical: currentVertical, 
            products: [], 
            services: [], 
            page_type: 'city',
            // Pass city data for unique content generation
            city_data: {
              population: city.population,
              region: city.region,
              is_capital: city.is_capital,
              has_oil_platform: city.has_oil_platform,
              has_port: city.has_port,
              has_mining: city.has_mining,
              has_agro: city.has_agro,
              has_steel: city.has_steel,
              has_automotive: city.has_automotive,
              has_petrochemical: city.has_petrochemical,
              has_energy: city.has_energy,
              has_food_industry: city.has_food_industry,
            }
          }),
        });
        let content = { meta_title: `${title} - INNTAG`, meta_description: `Soluções em ${VERTICALS[currentVertical as Vertical].description.toLowerCase()} para ${city.name}/${city.state_abbr}.`, meta_keywords: `${currentVertical} ${city.name}`, h1_title: title, intro_text: '' };
        if (contentRes.ok) { const aiContent = await contentRes.json(); content = { ...content, ...aiContent }; }
        const verticalSlug = currentVertical === 'field_service' ? 'field-service' : currentVertical;
        await fetch('/api/admin/landing-pages', {
          method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            city_id: city.id, 
            slug: `${verticalSlug}-${city.slug}-${city.state_abbr.toLowerCase()}`, 
            page_type: 'city', 
            vertical: currentVertical, 
            title, 
            ...content, 
            is_active: 1,
            template: selectedTemplate 
          }),
        });
        await new Promise(resolve => setTimeout(resolve, 400));
      } catch (err) { console.error(`Error creating LP for ${city.name}:`, err); }
    }
    setBulkProgress(null); setBulkSelectedCities([]); setShowBulkModal(false); fetchData();
  };

  const handleLink = async (type: 'product' | 'service' | 'machine', id: number) => {
    if (!selectedLP) return;
    const endpoint = type === 'product' ? 'products' : type === 'service' ? 'services' : 'machines';
    const key = `${type}_id`;
    try {
      await fetch(`/api/admin/landing-pages/${selectedLP.id}/${endpoint}`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: id, position: 0 }),
      });
      fetchLPDetails(selectedLP.id);
    } catch (err) { console.error('Error linking:', err); }
  };

  const handleUnlink = async (type: 'products' | 'services' | 'machines', linkId: number) => {
    try {
      await fetch(`/api/admin/landing-pages/${type}/${linkId}`, { method: 'DELETE', headers });
      if (selectedLP) fetchLPDetails(selectedLP.id);
    } catch (err) { console.error('Error unlinking:', err); }
  };

  // City CRUD functions
  const handleCreateCity = () => {
    setCityFormData({ name: '', state: '', state_abbr: '', population: '', region: '', is_capital: false, has_oil_platform: false, has_port: false, has_mining: false, has_agro: false, has_steel: false, has_automotive: false, has_petrochemical: false, has_energy: false, has_food_industry: false });
    setSelectedCity(null);
    setShowCityModal(true);
  };

  const handleEditCity = (city: City) => {
    setCityFormData({
      name: city.name, state: city.state || '', state_abbr: city.state_abbr, population: city.population?.toString() || '', region: city.region || '',
      is_capital: city.is_capital === 1, has_oil_platform: city.has_oil_platform === 1, has_port: city.has_port === 1, has_mining: city.has_mining === 1,
      has_agro: city.has_agro === 1, has_steel: city.has_steel === 1, has_automotive: city.has_automotive === 1, has_petrochemical: city.has_petrochemical === 1,
      has_energy: city.has_energy === 1, has_food_industry: city.has_food_industry === 1,
    });
    setSelectedCity(city);
    setShowCityModal(true);
  };

  const handleSaveCity = async () => {
    if (!cityFormData.name || !cityFormData.state_abbr) { alert('Nome e UF são obrigatórios'); return; }
    setIsSavingCity(true);
    try {
      const url = selectedCity ? `/api/admin/cities/${selectedCity.id}` : '/api/admin/cities';
      const res = await fetch(url, {
        method: selectedCity ? 'PUT' : 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cityFormData, population: cityFormData.population ? parseInt(cityFormData.population) : null }),
      });
      if (res.ok) { setShowCityModal(false); fetchData(); }
    } catch (err) { console.error('Error saving city:', err); }
    setIsSavingCity(false);
  };

  const handleDeleteCity = async (city: City) => {
    const cityLPs = landingPages.filter(lp => lp.city_id === city.id);
    if (cityLPs.length > 0) { alert(`Esta cidade possui ${cityLPs.length} landing page(s) vinculadas. Remova-as antes de excluir.`); return; }
    if (!confirm(`Excluir a cidade ${city.name}/${city.state_abbr}?`)) return;
    try {
      await fetch(`/api/admin/cities/${city.id}`, { method: 'DELETE', headers });
      fetchData();
    } catch (err) { console.error('Error deleting city:', err); }
  };

  // SEO & Google Indexing functions
  const handleIndexLP = async (lp: LandingPage) => {
    setIndexingId(lp.id);
    try {
      const res = await fetch(`/api/admin/seo/auto-index-lp/${lp.id}`, { method: 'POST', headers });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Enviado ao Google para indexação!');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao indexar');
      }
    } catch (err) { console.error('Error indexing:', err); alert('Erro ao enviar para indexação'); }
    setIndexingId(null);
  };

  const handleBatchIndex = async () => {
    const activeLPs = landingPages.filter(lp => lp.is_active === 1 && lp.indexing_status !== 'indexed');
    if (activeLPs.length === 0) { alert('Todas as LPs ativas já foram indexadas.'); return; }
    if (!confirm(`Enviar ${activeLPs.length} landing pages ativas para indexação no Google?`)) return;
    setBatchIndexing(true);
    try {
      const urls = activeLPs.map(lp => `https://www.inntag.com.br/lp/${lp.slug}`);
      const res = await fetch('/api/admin/seo/index-batch', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Enviadas ${data.results?.length || 0} URLs para indexação!`);
        fetchData();
      }
    } catch (err) { console.error('Error batch indexing:', err); }
    setBatchIndexing(false);
  };

  const fetchSeoDashboard = async () => {
    try {
      const res = await fetch('/api/admin/seo/dashboard', { headers });
      if (res.ok) { setSeoDashboard(await res.json()); }
    } catch (err) { console.error('Error fetching dashboard:', err); }
  };

  const getSeoStatusColor = (status: string | null | undefined) => {
    if (status === 'indexed') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (status === 'error') return 'bg-red-100 text-red-700';
    return 'bg-neutral-100 text-neutral-500';
  };

  const getSeoStatusIcon = (status: string | null | undefined) => {
    if (status === 'indexed') return <CheckCircle2 className="w-3 h-3" />;
    if (status === 'pending') return <Clock className="w-3 h-3" />;
    if (status === 'error') return <AlertCircle className="w-3 h-3" />;
    return null;
  };

  const filteredLPs = landingPages.filter(lp => {
    const matchesSearch = lp.title.toLowerCase().includes(searchTerm.toLowerCase()) || lp.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVertical = activeTab === 'cidades' || (lp.vertical || 'paineis') === activeTab;
    return matchesSearch && matchesVertical;
  });

  const filteredCities = cities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.state_abbr.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (cityFilter === 'capitals') return c.is_capital === 1;
    if (cityFilter === 'oil') return c.has_oil_platform === 1;
    if (cityFilter === 'port') return c.has_port === 1;
    if (cityFilter === 'mining') return c.has_mining === 1;
    if (cityFilter === 'agro') return c.has_agro === 1;
    return true;
  });

  const getStats = (v: string) => {
    const vLPs = landingPages.filter(lp => (lp.vertical || 'paineis') === v);
    return { total: vLPs.length, active: vLPs.filter(lp => lp.is_active).length, views: vLPs.reduce((acc, lp) => acc + (lp.view_count || 0), 0) };
  };

  const getAvailableCities = () => {
    const v = activeTab === 'cidades' ? 'paineis' : activeTab;
    const existingIds = landingPages.filter(lp => lp.vertical === v).map(lp => lp.city_id).filter(Boolean);
    return cities.filter(c => !existingIds.includes(c.id));
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  const stats = getStats(activeTab);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-neutral-900">Landing Pages</h1>
          {activeTab !== 'cidades' && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-neutral-500"><strong className="text-neutral-900">{stats.total}</strong> LPs</span>
              <span className="text-neutral-500"><strong className="text-green-600">{stats.active}</strong> ativas</span>
              <span className="text-neutral-500"><strong className="text-orange-600">{stats.views}</strong> views</span>
            </div>
          )}
        </div>
        {activeTab !== 'cidades' && (
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowSeoDashboard(true); fetchSeoDashboard(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-700 text-sm rounded-lg hover:bg-neutral-200">
              <BarChart3 className="w-4 h-4" />SEO
            </button>
            <button onClick={handleBatchIndex} disabled={batchIndexing} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {batchIndexing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Indexar Ativas
            </button>
            <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              <Zap className="w-4 h-4" />Gerar em Massa
            </button>
            <button onClick={handleCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600">
              <Plus className="w-4 h-4" />Nova LP
            </button>
          </div>
        )}
        {activeTab === 'cidades' && (
          <button onClick={handleCreateCity} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600">
            <Plus className="w-4 h-4" />Nova Cidade
          </button>
        )}
      </div>

      {/* Vertical Tabs - Compact */}
      <div className="bg-white rounded-lg border border-neutral-200 p-1 flex gap-1 mb-3">
        {(Object.keys(VERTICALS) as Vertical[]).map((key) => {
          const v = VERTICALS[key]; const Icon = v.icon; const isActive = activeTab === key;
          return (
            <button key={key} onClick={() => { setActiveTab(key); setSelectedLP(null); setSearchTerm(''); }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${isActive ? 'text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-50'}`}
              style={isActive ? { backgroundColor: v.color } : {}}>
              <Icon className="w-4 h-4" /><span className="font-medium">{v.label}</span>
              {key !== 'cidades' && <span className={`text-xs px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20' : 'bg-neutral-100'}`}>{getStats(key).total}</span>}
            </button>
          );
        })}
      </div>

      {/* Main Content - Full Height */}
      <div className="flex-1 min-h-0 flex gap-3">
        {activeTab === 'cidades' ? (
          /* Cities Table - Full Width */
          <div className="flex-1 bg-white rounded-lg border border-neutral-200 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-neutral-200 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar cidade..."
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-1">
                {[{ k: 'all', l: 'Todas', c: cities.length }, { k: 'capitals', l: 'Capitais', c: cities.filter(c => c.is_capital === 1).length, icon: Building2 },
                  { k: 'oil', l: 'Petróleo', c: cities.filter(c => c.has_oil_platform === 1).length, icon: FlaskConical },
                  { k: 'port', l: 'Porto', c: cities.filter(c => c.has_port === 1).length, icon: Anchor },
                  { k: 'mining', l: 'Mineração', c: cities.filter(c => c.has_mining === 1).length, icon: Pickaxe },
                  { k: 'agro', l: 'Agro', c: cities.filter(c => c.has_agro === 1).length, icon: Wheat },
                ].map(f => (
                  <button key={f.k} onClick={() => setCityFilter(f.k)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${cityFilter === f.k ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                    {f.icon && <f.icon className="w-3 h-3" />}{f.l}<span className="opacity-70">({f.c})</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 sticky top-0">
                  <tr className="text-left text-neutral-500">
                    <th className="px-3 py-2 font-medium">Cidade</th>
                    <th className="px-3 py-2 font-medium w-16">UF</th>
                    <th className="px-3 py-2 font-medium w-24">População</th>
                    <th className="px-3 py-2 font-medium">Setores</th>
                    <th className="px-3 py-2 font-medium w-24 text-center">LPs</th>
                    <th className="px-3 py-2 font-medium w-20 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredCities.map(city => {
                    const cityLPs = landingPages.filter(lp => lp.city_id === city.id);
                    return (
                      <tr key={city.id} className="hover:bg-neutral-50">
                        <td className="px-3 py-2 font-medium text-neutral-900">{city.name}</td>
                        <td className="px-3 py-2 text-neutral-600">{city.state_abbr}</td>
                        <td className="px-3 py-2 text-neutral-600">{city.population ? (city.population / 1000).toFixed(0) + 'k' : '-'}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-0.5">
                            {city.is_capital === 1 && <span className="w-5 h-5 rounded bg-yellow-100 text-yellow-700 flex items-center justify-center" title="Capital"><Building2 className="w-3 h-3" /></span>}
                            {city.has_oil_platform === 1 && <span className="w-5 h-5 rounded bg-orange-100 text-orange-700 flex items-center justify-center" title="Petróleo"><FlaskConical className="w-3 h-3" /></span>}
                            {city.has_port === 1 && <span className="w-5 h-5 rounded bg-cyan-100 text-cyan-700 flex items-center justify-center" title="Porto"><Anchor className="w-3 h-3" /></span>}
                            {city.has_mining === 1 && <span className="w-5 h-5 rounded bg-amber-100 text-amber-700 flex items-center justify-center" title="Mineração"><Pickaxe className="w-3 h-3" /></span>}
                            {city.has_agro === 1 && <span className="w-5 h-5 rounded bg-lime-100 text-lime-700 flex items-center justify-center" title="Agro"><Wheat className="w-3 h-3" /></span>}
                            {city.has_steel === 1 && <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center" title="Siderurgia"><Factory className="w-3 h-3" /></span>}
                            {city.has_automotive === 1 && <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center" title="Auto"><Car className="w-3 h-3" /></span>}
                            {city.has_petrochemical === 1 && <span className="w-5 h-5 rounded bg-purple-100 text-purple-700 flex items-center justify-center" title="Petroquímica"><FlaskConical className="w-3 h-3" /></span>}
                            {city.has_energy === 1 && <span className="w-5 h-5 rounded bg-red-100 text-red-700 flex items-center justify-center" title="Energia"><Bolt className="w-3 h-3" /></span>}
                            {city.has_food_industry === 1 && <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center" title="Alimentos"><UtensilsCrossed className="w-3 h-3" /></span>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-0.5">
                            {cityLPs.length > 0 ? (
                              <>
                                {cityLPs.some(lp => lp.vertical === 'paineis') && <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center"><Package className="w-3 h-3" /></span>}
                                {cityLPs.some(lp => lp.vertical === 'field_service') && <span className="w-5 h-5 rounded bg-green-100 text-green-700 flex items-center justify-center"><Wrench className="w-3 h-3" /></span>}
                                {cityLPs.some(lp => lp.vertical === 'maquinas') && <span className="w-5 h-5 rounded bg-purple-100 text-purple-700 flex items-center justify-center"><Cog className="w-3 h-3" /></span>}
                              </>
                            ) : <span className="text-neutral-300">—</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEditCity(city)} className="p-1 text-neutral-400 hover:text-blue-600" title="Editar"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteCity(city)} className="p-1 text-neutral-400 hover:text-red-600" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* LP Management - Split View */
          <>
            {/* List Panel */}
            <div className="w-80 flex-shrink-0 bg-white rounded-lg border border-neutral-200 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-neutral-200">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..."
                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {filteredLPs.length === 0 ? (
                  <div className="p-6 text-center">
                    <Building2 className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">Nenhuma LP</p>
                    <button onClick={handleCreate} className="mt-2 text-orange-500 hover:text-orange-600 text-sm font-medium">Criar primeira</button>
                  </div>
                ) : filteredLPs.map((lp) => (
                  <div key={lp.id} onClick={() => handleEdit(lp)}
                    className={`px-3 py-2.5 cursor-pointer border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${selectedLP?.id === lp.id ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          <span className="font-medium text-neutral-900 text-sm truncate">{lp.title}</span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5 truncate">/{lp.slug}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${lp.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                            {lp.is_active ? 'Ativa' : 'Inativa'}
                          </span>
                          {lp.indexing_status && (
                            <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5 ${getSeoStatusColor(lp.indexing_status)}`}>
                              {getSeoStatusIcon(lp.indexing_status)}
                              {lp.indexing_status === 'indexed' ? 'Google' : lp.indexing_status === 'pending' ? 'Pendente' : 'Erro'}
                            </span>
                          )}
                          {lp.view_count > 0 && <span className="text-xs text-neutral-400 flex items-center gap-0.5"><Eye className="w-3 h-3" />{lp.view_count}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {lp.is_active === 1 && lp.indexing_status !== 'indexed' && (
                          <button onClick={(e) => { e.stopPropagation(); handleIndexLP(lp); }}
                            disabled={indexingId === lp.id}
                            className="p-1 text-neutral-400 hover:text-emerald-600 rounded hover:bg-emerald-50"
                            title="Enviar ao Google">
                            {indexingId === lp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        )}
                        <ChevronRight className={`w-4 h-4 text-neutral-300 flex-shrink-0 ${selectedLP?.id === lp.id ? 'text-orange-500' : ''}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="flex-1 bg-white rounded-lg border border-neutral-200 flex flex-col overflow-hidden">
              {selectedLP || formData.slug ? (
                <>
                  <div className="p-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-neutral-900">{selectedLP ? 'Editar LP' : 'Nova LP'}</span>
                      {selectedLP && (
                        <a href={`/lp/${selectedLP.slug}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700">
                          <ExternalLink className="w-3 h-3" />Ver LP
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleGenerateContent} disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs rounded hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50">
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {isGenerating ? 'Gerando...' : 'IA'}
                      </button>
                      {selectedLP && (
                        <>
                          <button onClick={() => handleToggleActive(selectedLP)} className="p-1.5 text-neutral-400 hover:text-orange-500 rounded hover:bg-neutral-100">
                            {selectedLP.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(selectedLP.id)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded hover:bg-neutral-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button onClick={handleSave} disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50">
                        <Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Cidade</label>
                        <select value={formData.city_id} onChange={(e) => handleCityChange(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-orange-500">
                          <option value="">Selecione...</option>
                          {cities.map(c => <option key={c.id} value={c.id}>{c.name}/{c.state_abbr}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Slug</label>
                        <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Template</label>
                        <select value={formData.template} onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-orange-500">
                          <option value="default">Padrão (Vermelho)</option>
                          <option value="industrial">Industrial (Âmbar)</option>
                          <option value="corporativo">Corporativo (Azul)</option>
                          <option value="energia">Energia (Vermelho Vibrante)</option>
                          <option value="petroleo">Petróleo & Gás (Dourado)</option>
                          <option value="mineracao">Mineração (Laranja)</option>
                          <option value="agro">Agronegócio (Verde)</option>
                          <option value="naval">Naval & Portuário (Ciano)</option>
                          <option value="siderurgia">Siderurgia (Metálico)</option>
                          <option value="quimico">Químico (Roxo)</option>
                          <option value="automotivo">Automotivo (Premium)</option>
                          <option value="saneamento">Saneamento (Azul Claro)</option>
                          <option value="alimentos">Alimentos (Laranja Quente)</option>
                          <option value="sucro">Sucroalcooleiro (Lima)</option>
                          <option value="infra">Infraestrutura (Slate)</option>
                          <option value="auto">Automático (baseado na cidade)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Título</label>
                        <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">H1</label>
                        <input type="text" value={formData.h1_title} onChange={(e) => setFormData({ ...formData, h1_title: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Meta Title <span className="text-neutral-400">({formData.meta_title.length}/60)</span></label>
                        <input type="text" value={formData.meta_title} maxLength={60} onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Keywords</label>
                        <input type="text" value={formData.meta_keywords} onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs text-neutral-500 mb-1">Meta Description <span className="text-neutral-400">({formData.meta_description.length}/160)</span></label>
                      <textarea value={formData.meta_description} maxLength={160} rows={2} onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-orange-500 resize-none" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs text-neutral-500 mb-1">Texto Introdutório</label>
                      <textarea value={formData.intro_text} rows={3} onChange={(e) => setFormData({ ...formData, intro_text: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-orange-500 resize-none" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="sr-only peer" />
                        <div className="w-9 h-5 bg-neutral-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                      <span className="text-sm text-neutral-600">Ativa</span>
                    </div>
                    
                    {/* Vínculos Section */}
                    {selectedLP && (
                      <div className="border-t border-neutral-200 pt-4">
                        <h3 className="text-sm font-medium text-neutral-900 mb-3">Vínculos</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {activeTab === 'paineis' && (
                            <div>
                              <label className="block text-xs text-neutral-500 mb-2 flex items-center gap-1"><Package className="w-3 h-3" />Produtos</label>
                              <div className="space-y-1 mb-2 max-h-32 overflow-auto">
                                {linkedProducts.map(link => {
                                  const p = products.find(pr => pr.id === link.product_id);
                                  return (
                                    <div key={link.id} className="flex items-center justify-between bg-neutral-50 rounded px-2 py-1 text-xs">
                                      <span className="truncate">{p?.title || '?'}</span>
                                      <button onClick={() => handleUnlink('products', link.id)} className="text-neutral-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </div>
                                  );
                                })}
                              </div>
                              <select onChange={(e) => { if (e.target.value) { handleLink('product', parseInt(e.target.value)); e.target.value = ''; } }}
                                className="w-full px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs">
                                <option value="">+ Adicionar</option>
                                {products.filter(p => !linkedProducts.some(lp => lp.product_id === p.id)).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                              </select>
                            </div>
                          )}
                          {activeTab === 'field_service' && (
                            <div>
                              <label className="block text-xs text-neutral-500 mb-2 flex items-center gap-1"><Wrench className="w-3 h-3" />Serviços</label>
                              <div className="space-y-1 mb-2 max-h-32 overflow-auto">
                                {linkedServices.map(link => {
                                  const s = services.find(sv => sv.id === link.service_id);
                                  return (
                                    <div key={link.id} className="flex items-center justify-between bg-neutral-50 rounded px-2 py-1 text-xs">
                                      <span className="truncate">{s?.title || '?'}</span>
                                      <button onClick={() => handleUnlink('services', link.id)} className="text-neutral-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </div>
                                  );
                                })}
                              </div>
                              <select onChange={(e) => { if (e.target.value) { handleLink('service', parseInt(e.target.value)); e.target.value = ''; } }}
                                className="w-full px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs">
                                <option value="">+ Adicionar</option>
                                {services.filter(s => !linkedServices.some(ls => ls.service_id === s.id)).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                              </select>
                            </div>
                          )}
                          {activeTab === 'maquinas' && (
                            <div>
                              <label className="block text-xs text-neutral-500 mb-2 flex items-center gap-1"><Cog className="w-3 h-3" />Máquinas</label>
                              <div className="space-y-1 mb-2 max-h-32 overflow-auto">
                                {linkedMachines.map(link => {
                                  const m = machines.find(mc => mc.id === link.machine_id);
                                  return (
                                    <div key={link.id} className="flex items-center justify-between bg-neutral-50 rounded px-2 py-1 text-xs">
                                      <span className="truncate">{m?.title || m?.name || '?'}</span>
                                      <button onClick={() => handleUnlink('machines', link.id)} className="text-neutral-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </div>
                                  );
                                })}
                              </div>
                              <select onChange={(e) => { if (e.target.value) { handleLink('machine', parseInt(e.target.value)); e.target.value = ''; } }}
                                className="w-full px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs">
                                <option value="">+ Adicionar</option>
                                {machines.filter(m => !linkedMachines.some(lm => lm.machine_id === m.id)).map(m => <option key={m.id} value={m.id}>{m.title || m.name}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-neutral-400">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Selecione uma LP ou crie uma nova</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[70vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-neutral-900">Gerar LPs em Massa</h2>
                <p className="text-sm text-neutral-500">{VERTICALS[activeTab === 'cidades' ? 'paineis' : activeTab].label}</p>
              </div>
              <button onClick={() => { setShowBulkModal(false); setBulkSelectedCities([]); }} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
            </div>
            {bulkProgress ? (
              <div className="p-8 text-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="font-medium text-neutral-900 mb-1">Processando: {bulkProgress.currentCity}</p>
                <div className="w-full bg-neutral-200 rounded-full h-2 mb-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((bulkProgress.current + 1) / bulkProgress.total) * 100}%` }} /></div>
                <p className="text-sm text-neutral-500">{bulkProgress.current + 1}/{bulkProgress.total}</p>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-neutral-200 flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{getAvailableCities().length} cidades disponíveis</span>
                  <button onClick={() => setBulkSelectedCities(bulkSelectedCities.length === getAvailableCities().length ? [] : getAvailableCities().map(c => c.id))}
                    className="text-sm text-blue-600 hover:text-blue-700">{bulkSelectedCities.length === getAvailableCities().length ? 'Desmarcar' : 'Selecionar'} Todas</button>
                </div>
                <div className="flex-1 overflow-auto p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {getAvailableCities().map(city => (
                      <label key={city.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-sm ${bulkSelectedCities.includes(city.id) ? 'bg-blue-50 border-blue-300' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                        <input type="checkbox" checked={bulkSelectedCities.includes(city.id)} onChange={(e) => setBulkSelectedCities(e.target.checked ? [...bulkSelectedCities, city.id] : bulkSelectedCities.filter(id => id !== city.id))} className="w-4 h-4" />
                        <span className="truncate">{city.name}/{city.state_abbr}</span>
                      </label>
                    ))}
                  </div>
                  {getAvailableCities().length === 0 && (
                    <div className="text-center py-6"><CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" /><p className="text-neutral-500 text-sm">Todas as cidades já possuem LP!</p></div>
                  )}
                </div>
                <div className="p-3 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
                  <span className="text-sm"><strong className="text-blue-600">{bulkSelectedCities.length}</strong> selecionadas</span>
                  <button onClick={handleBulkGenerate} disabled={bulkSelectedCities.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                    <Sparkles className="w-4 h-4" />Gerar {bulkSelectedCities.length} LPs
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="font-bold text-neutral-900">{selectedCity ? 'Editar Cidade' : 'Nova Cidade'}</h2>
              <button onClick={() => setShowCityModal(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nome *</label>
                  <input type="text" value={cityFormData.name} onChange={(e) => setCityFormData({ ...cityFormData, name: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm" placeholder="Ex: São Paulo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">UF *</label>
                  <input type="text" value={cityFormData.state_abbr} onChange={(e) => setCityFormData({ ...cityFormData, state_abbr: e.target.value.toUpperCase().slice(0, 2) })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm" placeholder="SP" maxLength={2} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Estado</label>
                  <input type="text" value={cityFormData.state} onChange={(e) => setCityFormData({ ...cityFormData, state: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm" placeholder="São Paulo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">População</label>
                  <input type="number" value={cityFormData.population} onChange={(e) => setCityFormData({ ...cityFormData, population: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm" placeholder="12000000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Região</label>
                <select value={cityFormData.region} onChange={(e) => setCityFormData({ ...cityFormData, region: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm">
                  <option value="">Selecione</option>
                  <option value="Norte">Norte</option>
                  <option value="Nordeste">Nordeste</option>
                  <option value="Centro-Oeste">Centro-Oeste</option>
                  <option value="Sudeste">Sudeste</option>
                  <option value="Sul">Sul</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Características</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" checked={cityFormData.is_capital} onChange={(e) => setCityFormData({ ...cityFormData, is_capital: e.target.checked })} className="w-4 h-4" />
                    <Building2 className="w-4 h-4 text-yellow-600" /><span className="text-sm">Capital</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" checked={cityFormData.has_oil_platform} onChange={(e) => setCityFormData({ ...cityFormData, has_oil_platform: e.target.checked })} className="w-4 h-4" />
                    <FlaskConical className="w-4 h-4 text-orange-600" /><span className="text-sm">Petróleo</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" checked={cityFormData.has_port} onChange={(e) => setCityFormData({ ...cityFormData, has_port: e.target.checked })} className="w-4 h-4" />
                    <Anchor className="w-4 h-4 text-cyan-600" /><span className="text-sm">Porto</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" checked={cityFormData.has_mining} onChange={(e) => setCityFormData({ ...cityFormData, has_mining: e.target.checked })} className="w-4 h-4" />
                    <Pickaxe className="w-4 h-4 text-amber-600" /><span className="text-sm">Mineração</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" checked={cityFormData.has_agro} onChange={(e) => setCityFormData({ ...cityFormData, has_agro: e.target.checked })} className="w-4 h-4" />
                    <Wheat className="w-4 h-4 text-lime-600" /><span className="text-sm">Agro</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" checked={cityFormData.has_steel} onChange={(e) => setCityFormData({ ...cityFormData, has_steel: e.target.checked })} className="w-4 h-4" />
                    <Factory className="w-4 h-4 text-slate-600" /><span className="text-sm">Siderurgia</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" checked={cityFormData.has_automotive} onChange={(e) => setCityFormData({ ...cityFormData, has_automotive: e.target.checked })} className="w-4 h-4" />
                    <Car className="w-4 h-4 text-blue-600" /><span className="text-sm">Automotivo</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" checked={cityFormData.has_petrochemical} onChange={(e) => setCityFormData({ ...cityFormData, has_petrochemical: e.target.checked })} className="w-4 h-4" />
                    <FlaskConical className="w-4 h-4 text-purple-600" /><span className="text-sm">Petroquímica</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" checked={cityFormData.has_energy} onChange={(e) => setCityFormData({ ...cityFormData, has_energy: e.target.checked })} className="w-4 h-4" />
                    <Bolt className="w-4 h-4 text-red-600" /><span className="text-sm">Energia</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" checked={cityFormData.has_food_industry} onChange={(e) => setCityFormData({ ...cityFormData, has_food_industry: e.target.checked })} className="w-4 h-4" />
                    <UtensilsCrossed className="w-4 h-4 text-emerald-600" /><span className="text-sm">Alimentos</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-2 bg-neutral-50">
              <button onClick={() => setShowCityModal(false)} className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 text-sm">Cancelar</button>
              <button onClick={handleSaveCity} disabled={isSavingCity} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm">
                {isSavingCity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEO Dashboard Modal */}
      {showSeoDashboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-lg text-neutral-900">Dashboard SEO</h2>
              </div>
              <button onClick={() => setShowSeoDashboard(false)} className="p-1 hover:bg-neutral-200 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(80vh-120px)]">
              {seoDashboard ? (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-neutral-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-neutral-900">{seoDashboard.total_lps}</div>
                      <div className="text-xs text-neutral-500">Total LPs</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{seoDashboard.indexed}</div>
                      <div className="text-xs text-green-600">Indexadas</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{seoDashboard.pending}</div>
                      <div className="text-xs text-yellow-600">Pendentes</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{seoDashboard.avg_score?.toFixed(0) || '-'}</div>
                      <div className="text-xs text-orange-600">Score Médio</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-700">Progresso de Indexação</span>
                      <span className="text-sm text-neutral-500">{seoDashboard.total_lps > 0 ? Math.round((seoDashboard.indexed / seoDashboard.total_lps) * 100) : 0}%</span>
                    </div>
                    <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all" style={{ width: `${seoDashboard.total_lps > 0 ? (seoDashboard.indexed / seoDashboard.total_lps) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {seoDashboard.recent_indexing && seoDashboard.recent_indexing.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-700 mb-3">Atividade Recente</h3>
                      <div className="space-y-2">
                        {seoDashboard.recent_indexing.slice(0, 5).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              {item.status === 'indexed' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-yellow-500" />}
                              <span className="text-sm text-neutral-700 truncate max-w-xs">{item.url}</span>
                            </div>
                            <span className="text-xs text-neutral-400">{item.last_indexed_at ? new Date(item.last_indexed_at).toLocaleDateString('pt-BR') : '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-between items-center bg-neutral-50">
              <button onClick={fetchSeoDashboard} className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm">
                <RefreshCw className="w-4 h-4" />Atualizar
              </button>
              <button onClick={() => setShowSeoDashboard(false)} className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 text-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
