import { useState, useEffect } from 'react';
import ConfigLayout from './ConfigLayout';
import { Button } from '@/react-app/components/ui/button';
import { Plus, Trash2, Search, Save, X, BookOpen, FileText, Zap, ChevronRight, Edit2, CheckCircle, XCircle } from 'lucide-react';

interface TechnicalStandard {
  id: number;
  code: string;
  title: string;
  category: string | null;
  description: string | null;
  key_points: string | null;
  application_areas: string | null;
  related_products: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  'Painéis BT',
  'Painéis MT',
  'Proteção',
  'Componentes',
  'Instalações',
  'Segurança',
  'Máquinas',
  'Transformadores',
  'EMC'
];

const PRODUCTS = [
  { id: 'qgbt', label: 'QGBT' },
  { id: 'ccm', label: 'CCM' },
  { id: 'qdf', label: 'QDF' },
  { id: 'cubiculos-mt', label: 'Cubículos MT' },
  { id: 'paineis-protecao', label: 'Painéis de Proteção' },
  { id: 'paineis-excitacao', label: 'Painéis de Excitação' },
  { id: 'quadros-auxiliares', label: 'Quadros Auxiliares' }
];

export default function ConfigNormas() {
  const [standards, setStandards] = useState<TechnicalStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStandard, setSelectedStandard] = useState<TechnicalStandard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    code: '',
    title: '',
    category: '',
    description: '',
    key_points: '',
    application_areas: '',
    related_products: [] as string[],
    is_active: 1
  });

  useEffect(() => {
    fetchStandards();
  }, []);

  async function fetchStandards() {
    try {
      const res = await fetch('/api/admin/standards');
      const data = await res.json();
      setStandards(data);
    } catch (err) {
      console.error('Error fetching standards:', err);
    } finally {
      setLoading(false);
    }
  }

  function selectStandard(standard: TechnicalStandard) {
    setSelectedStandard(standard);
    setForm({
      code: standard.code,
      title: standard.title,
      category: standard.category || '',
      description: standard.description || '',
      key_points: standard.key_points || '',
      application_areas: standard.application_areas || '',
      related_products: standard.related_products ? standard.related_products.split(',') : [],
      is_active: standard.is_active
    });
    setIsEditing(false);
  }

  function startNew() {
    setSelectedStandard(null);
    setForm({
      code: '',
      title: '',
      category: '',
      description: '',
      key_points: '',
      application_areas: '',
      related_products: [],
      is_active: 1
    });
    setIsEditing(true);
  }

  async function handleSave() {
    if (!form.code || !form.title) {
      alert('Código e título são obrigatórios');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        ...form,
        related_products: form.related_products.join(',')
      };
      
      if (selectedStandard) {
        await fetch(`/api/admin/standards/${selectedStandard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        const res = await fetch('/api/admin/standards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.id) {
          setSelectedStandard({ ...payload, id: data.id } as TechnicalStandard);
        }
      }
      
      await fetchStandards();
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving standard:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir esta norma?')) return;
    
    try {
      await fetch(`/api/admin/standards/${id}`, { method: 'DELETE' });
      await fetchStandards();
      if (selectedStandard?.id === id) {
        setSelectedStandard(null);
      }
    } catch (err) {
      console.error('Error deleting standard:', err);
    }
  }

  function toggleProduct(productId: string) {
    setForm(prev => ({
      ...prev,
      related_products: prev.related_products.includes(productId)
        ? prev.related_products.filter(p => p !== productId)
        : [...prev.related_products, productId]
    }));
  }

  const filteredStandards = standards.filter(s => {
    const matchesSearch = !searchTerm || 
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedStandards = filteredStandards.reduce((acc, s) => {
    const cat = s.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, TechnicalStandard[]>);

  return (
    <ConfigLayout>
      <div className="h-full flex">
        {/* Left Panel - Standards List */}
        <div className="w-80 border-r border-neutral-200 bg-neutral-50 flex flex-col">
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-neutral-900">Normas Técnicas</h2>
              <Button size="sm" onClick={startNew}>
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            </div>
            
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar norma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="">Todas as categorias</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : Object.keys(groupedStandards).length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma norma encontrada</p>
              </div>
            ) : (
              Object.entries(groupedStandards).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2 mb-1">
                    {category}
                  </h3>
                  {items.map(standard => (
                    <button
                      key={standard.id}
                      onClick={() => selectStandard(standard)}
                      className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors flex items-center gap-2 ${
                        selectedStandard?.id === standard.id
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <FileText className={`w-4 h-4 flex-shrink-0 ${
                        standard.is_active ? 'text-green-500' : 'text-neutral-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{standard.code}</div>
                        <div className="text-xs text-neutral-500 truncate">{standard.title}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-300" />
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 border-t border-neutral-200 bg-white">
            <div className="text-xs text-neutral-500 text-center">
              {standards.length} normas cadastradas
            </div>
          </div>
        </div>
        
        {/* Right Panel - Standard Detail */}
        <div className="flex-1 flex flex-col bg-white">
          {!selectedStandard && !isEditing ? (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecione uma norma para visualizar</p>
                <p className="text-sm mt-1">ou clique em "Nova" para adicionar</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isEditing ? 'bg-amber-100' : 'bg-red-50'
                  }`}>
                    {isEditing ? (
                      <Edit2 className="w-5 h-5 text-amber-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-900">
                      {isEditing ? (selectedStandard ? 'Editar Norma' : 'Nova Norma') : form.code}
                    </h2>
                    {!isEditing && <p className="text-sm text-neutral-500">{form.category}</p>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => {
                        if (selectedStandard) {
                          selectStandard(selectedStandard);
                        } else {
                          setIsEditing(false);
                          setSelectedStandard(null);
                        }
                      }}>
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      {selectedStandard && (
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(selectedStandard.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Código *</label>
                      <input
                        type="text"
                        value={form.code}
                        onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Ex: IEC 61439"
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-neutral-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Categoria</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-neutral-50"
                      >
                        <option value="">Selecione...</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Título *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Nome completo da norma"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-neutral-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Descrição</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Descrição resumida da norma e seu propósito"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-neutral-50 resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Pontos-chave
                      <span className="text-neutral-400 font-normal ml-2">Separe com | (pipe)</span>
                    </label>
                    <textarea
                      value={form.key_points}
                      onChange={(e) => setForm(prev => ({ ...prev, key_points: e.target.value }))}
                      disabled={!isEditing}
                      rows={4}
                      placeholder="Requisito 1|Requisito 2|Requisito 3"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-neutral-50 resize-none font-mono text-sm"
                    />
                    {form.key_points && !isEditing && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.key_points.split('|').map((point, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs">
                            <Zap className="w-3 h-3 text-amber-500" />
                            {point.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Áreas de Aplicação</label>
                    <textarea
                      value={form.application_areas}
                      onChange={(e) => setForm(prev => ({ ...prev, application_areas: e.target.value }))}
                      disabled={!isEditing}
                      rows={2}
                      placeholder="QGBT, CCM, Subestações, etc."
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-neutral-50 resize-none"
                    />
                  </div>
                  
                  {/* Related Products */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Produtos Relacionados</label>
                    <div className="flex flex-wrap gap-2">
                      {PRODUCTS.map(product => (
                        <button
                          key={product.id}
                          onClick={() => isEditing && toggleProduct(product.id)}
                          disabled={!isEditing}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            form.related_products.includes(product.id)
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          } ${isEditing ? 'cursor-pointer hover:bg-red-50' : 'cursor-default'}`}
                        >
                          {product.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex items-center gap-3">
                      {form.is_active ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-neutral-400" />
                      )}
                      <div>
                        <div className="font-medium text-neutral-900">Status</div>
                        <div className="text-sm text-neutral-500">
                          {form.is_active ? 'Ativa - disponível para geração de conteúdo' : 'Inativa'}
                        </div>
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => setForm(prev => ({ ...prev, is_active: prev.is_active ? 0 : 1 }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          form.is_active ? 'bg-green-500' : 'bg-neutral-300'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          form.is_active ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ConfigLayout>
  );
}
