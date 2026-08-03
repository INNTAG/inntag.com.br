import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff, Image, Search, X, FileText, Tag } from 'lucide-react';

interface Article {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string | null;
  category: string;
  image_key: string | null;
  author_name: string | null;
  author_role: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  schema_type: string | null;
  is_published: number;
  is_featured: number;
  published_at: string | null;
  view_count: number;
  tags?: string[];
}

const CATEGORIES = [
  { value: 'noticia', label: 'Notícia' },
  { value: 'artigo', label: 'Artigo Técnico' },
  { value: 'case', label: 'Case de Sucesso' },
  { value: 'release', label: 'Press Release' },
];

export default function ConfigDestaques() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    excerpt: '',
    content: '',
    category: 'noticia',
    author_name: '',
    author_role: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    schema_type: 'Article',
    is_published: false,
    is_featured: false,
    tags: '',
  });

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      const res = await fetch('/api/admin/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      subtitle: '',
      excerpt: '',
      content: '',
      category: 'noticia',
      author_name: '',
      author_role: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      schema_type: 'Article',
      is_published: false,
      is_featured: false,
      tags: '',
    });
    setEditingArticle(null);
    setShowForm(false);
  }

  async function handleEdit(article: Article) {
    const res = await fetch(`/api/admin/articles/${article.id}`);
    if (res.ok) {
      const data = await res.json();
      setFormData({
        title: data.title || '',
        subtitle: data.subtitle || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        category: data.category || 'noticia',
        author_name: data.author_name || '',
        author_role: data.author_role || '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        meta_keywords: data.meta_keywords || '',
        og_title: data.og_title || '',
        og_description: data.og_description || '',
        schema_type: data.schema_type || 'Article',
        is_published: !!data.is_published,
        is_featured: !!data.is_featured,
        tags: data.tags?.join(', ') || '',
      });
      setEditingArticle(data);
      setShowForm(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    
    const url = editingArticle 
      ? `/api/admin/articles/${editingArticle.id}` 
      : '/api/admin/articles';
    const method = editingArticle ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (res.ok) {
      loadArticles();
      resetForm();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return;
    
    const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadArticles();
    }
  }

  async function togglePublish(article: Article) {
    const res = await fetch(`/api/admin/articles/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...article, is_published: !article.is_published }),
    });
    if (res.ok) loadArticles();
  }

  async function toggleFeatured(article: Article) {
    const res = await fetch(`/api/admin/articles/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...article, is_featured: !article.is_featured }),
    });
    if (res.ok) loadArticles();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, articleId: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`/api/admin/articles/${articleId}/image`, {
      method: 'POST',
      body: formData,
    });
    
    if (res.ok) loadArticles();
  }

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const seoScore = (article: Article) => {
    let score = 0;
    if (article.meta_title) score += 20;
    if (article.meta_description) score += 20;
    if (article.meta_keywords) score += 15;
    if (article.og_title) score += 15;
    if (article.og_description) score += 15;
    if (article.image_key) score += 15;
    return score;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Destaques & Artigos</h1>
          <p className="text-neutral-600 mt-1">Gerencie notícias, artigos técnicos e cases</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus size={18} />
          Novo Artigo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar artigos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded-lg pl-10 pr-4 py-2 text-neutral-900 placeholder:text-neutral-400"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Articles List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left text-neutral-600 text-sm font-medium px-4 py-3">Artigo</th>
              <th className="text-left text-neutral-600 text-sm font-medium px-4 py-3 hidden md:table-cell">Categoria</th>
              <th className="text-center text-neutral-600 text-sm font-medium px-4 py-3 hidden lg:table-cell">SEO</th>
              <th className="text-center text-neutral-600 text-sm font-medium px-4 py-3">Status</th>
              <th className="text-right text-neutral-600 text-sm font-medium px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredArticles.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-neutral-500 py-12">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  Nenhum artigo encontrado
                </td>
              </tr>
            ) : (
              filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {article.image_key ? (
                        <img 
                          src={`/api/files/${article.image_key}`} 
                          alt="" 
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center">
                          <Image size={20} className="text-neutral-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-neutral-900 font-medium">{article.title}</div>
                        <div className="text-neutral-500 text-sm">{article.excerpt?.slice(0, 60)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                      {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center justify-center">
                      <div className={`text-sm font-medium ${seoScore(article) >= 80 ? 'text-green-500' : seoScore(article) >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {seoScore(article)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => togglePublish(article)}
                        className={`p-1.5 rounded-lg transition-colors ${article.is_published ? 'bg-green-500/20 text-green-600' : 'bg-neutral-100 text-neutral-500'}`}
                        title={article.is_published ? 'Publicado' : 'Rascunho'}
                      >
                        {article.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => toggleFeatured(article)}
                        className={`p-1.5 rounded-lg transition-colors ${article.is_featured ? 'bg-orange-500/20 text-orange-500' : 'bg-neutral-100 text-neutral-500'}`}
                        title={article.is_featured ? 'Destaque' : 'Normal'}
                      >
                        {article.is_featured ? <Star size={16} /> : <StarOff size={16} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <label className="p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 cursor-pointer transition-colors">
                        <Image size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, article.id)}
                        />
                      </label>
                      <button
                        onClick={() => handleEdit(article)}
                        className="p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-2 rounded-lg bg-neutral-100 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingArticle ? 'Editar Artigo' : 'Novo Artigo'}
              </h2>
              <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-900">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <FileText size={18} className="text-orange-500" />
                  Informações Básicas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-neutral-600 mb-1">Título *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-neutral-600 mb-1">Subtítulo</label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">
                      <Tag size={14} className="inline mr-1" />
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="painéis, CCM, indústria"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Resumo / Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Conteúdo</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900 font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Autor</label>
                    <input
                      type="text"
                      value={formData.author_name}
                      onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Cargo do Autor</label>
                    <input
                      type="text"
                      value={formData.author_role}
                      onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                      placeholder="Engenheiro Eletricista"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div className="space-y-4 pt-4 border-t border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <Search size={18} className="text-green-500" />
                  Otimização SEO
                </h3>
                
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">
                    Meta Title <span className="text-neutral-400">(recomendado: 50-60 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                  />
                  <div className="text-xs text-neutral-500 mt-1">{formData.meta_title.length}/60 caracteres</div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-600 mb-1">
                    Meta Description <span className="text-neutral-400">(recomendado: 150-160 caracteres)</span>
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={2}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                  />
                  <div className="text-xs text-neutral-500 mt-1">{formData.meta_description.length}/160 caracteres</div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-600 mb-1">
                    Meta Keywords <span className="text-neutral-400">(separadas por vírgula)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    placeholder="painéis elétricos, CCM, manutenção industrial"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">OG Title (redes sociais)</label>
                    <input
                      type="text"
                      value={formData.og_title}
                      onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Schema Type</label>
                    <select
                      value={formData.schema_type}
                      onChange={(e) => setFormData({ ...formData, schema_type: e.target.value })}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                    >
                      <option value="Article">Article</option>
                      <option value="NewsArticle">NewsArticle</option>
                      <option value="TechArticle">TechArticle</option>
                      <option value="BlogPosting">BlogPosting</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-600 mb-1">OG Description</label>
                  <textarea
                    value={formData.og_description}
                    onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                    rows={2}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900"
                  />
                </div>
              </div>

              {/* Publishing Options */}
              <div className="flex items-center gap-6 pt-4 border-t border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 bg-white text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-neutral-900">Publicar imediatamente</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 bg-white text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-neutral-900">Marcar como destaque</span>
                </label>
              </div>
            </form>

            <div className="flex justify-end gap-3 p-6 border-t border-neutral-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
              >
                {editingArticle ? 'Salvar Alterações' : 'Criar Artigo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
