import { useState, useEffect } from 'react';
import { Plus, Trash2, Image, FileText, Video, X, GripVertical, Upload, Save, Loader2 } from 'lucide-react';

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
  product_id: number;
  spec_value: string;
  display_order: number;
}

interface ProductFeature {
  id: number;
  product_id: number;
  feature_text: string;
  display_order: number;
}

interface ProductDoc {
  id: number;
  product_id: number;
  doc_type: string;
  doc_title: string;
  file_key: string | null;
  external_url: string | null;
}

interface ProductGalleryItem {
  id: number;
  product_id: number;
  image_key: string;
  caption: string | null;
  display_order: number;
}

interface FullProduct extends Product {
  specs: ProductSpec[];
  features: ProductFeature[];
  docs: ProductDoc[];
  gallery: ProductGalleryItem[];
}

export default function ConfigProdutos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<FullProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    subtitle: '',
    short_description: '',
    full_description: '',
    display_order: 0,
    is_active: true,
  });

  const token = sessionStorage.getItem('admin_session');
  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', { headers });
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
    setIsLoading(false);
  };

  const fetchProductDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { headers });
      const data = await res.json();
      setSelectedProduct(data);
    } catch (err) {
      console.error('Error fetching product details:', err);
    }
  };

  const handleCreate = () => {
    setFormData({
      slug: '',
      title: '',
      subtitle: '',
      short_description: '',
      full_description: '',
      display_order: products.length,
      is_active: true,
    });
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      slug: product.slug,
      title: product.title,
      subtitle: product.subtitle || '',
      short_description: product.short_description || '',
      full_description: product.full_description || '',
      display_order: product.display_order,
      is_active: product.is_active === 1,
    });
    fetchProductDetails(product.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = selectedProduct
        ? `/api/admin/products/${selectedProduct.id}`
        : '/api/admin/products';
      const method = selectedProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        const product = await res.json();
        if (!selectedProduct) {
          setSelectedProduct({ ...product, specs: [], features: [], docs: [], gallery: [] });
        } else {
          setSelectedProduct({ ...selectedProduct, ...product });
        }
        fetchProducts();
      }
    } catch (err) {
      console.error('Error saving product:', err);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers });
      fetchProducts();
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
        setShowForm(false);
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProduct || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo: 10MB');
      return;
    }
    
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        // Refresh the full product data from server
        const productRes = await fetch(`/api/admin/products/${selectedProduct.id}`, { headers });
        if (productRes.ok) {
          const updatedProduct = await productRes.json();
          setSelectedProduct(updatedProduct);
        }
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao fazer upload');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Erro de conexão ao fazer upload');
    }
    setIsUploadingImage(false);
    e.target.value = '';
  };

  // Specs management
  const [newSpec, setNewSpec] = useState('');
  const handleAddSpec = async () => {
    if (!selectedProduct || !newSpec.trim()) return;
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/specs`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec_value: newSpec, display_order: selectedProduct.specs.length }),
      });
      if (res.ok) {
        const spec = await res.json();
        setSelectedProduct({ ...selectedProduct, specs: [...selectedProduct.specs, spec] });
        setNewSpec('');
      }
    } catch (err) {
      console.error('Error adding spec:', err);
    }
  };

  const handleDeleteSpec = async (specId: number) => {
    if (!selectedProduct) return;
    try {
      await fetch(`/api/admin/products/specs/${specId}`, { method: 'DELETE', headers });
      setSelectedProduct({
        ...selectedProduct,
        specs: selectedProduct.specs.filter(s => s.id !== specId),
      });
    } catch (err) {
      console.error('Error deleting spec:', err);
    }
  };

  // Features management
  const [newFeature, setNewFeature] = useState('');
  const handleAddFeature = async () => {
    if (!selectedProduct || !newFeature.trim()) return;
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/features`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_text: newFeature, display_order: selectedProduct.features.length }),
      });
      if (res.ok) {
        const feature = await res.json();
        setSelectedProduct({ ...selectedProduct, features: [...selectedProduct.features, feature] });
        setNewFeature('');
      }
    } catch (err) {
      console.error('Error adding feature:', err);
    }
  };

  const handleDeleteFeature = async (featureId: number) => {
    if (!selectedProduct) return;
    try {
      await fetch(`/api/admin/products/features/${featureId}`, { method: 'DELETE', headers });
      setSelectedProduct({
        ...selectedProduct,
        features: selectedProduct.features.filter(f => f.id !== featureId),
      });
    } catch (err) {
      console.error('Error deleting feature:', err);
    }
  };

  // Docs management
  const [docForm, setDocForm] = useState({ type: 'pdf', title: '', url: '' });
  const handleAddDoc = async () => {
    if (!selectedProduct || !docForm.title.trim()) return;
    const formData = new FormData();
    formData.append('doc_type', docForm.type);
    formData.append('doc_title', docForm.title);
    if (docForm.url) formData.append('external_url', docForm.url);
    
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/docs`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (res.ok) {
        const doc = await res.json();
        setSelectedProduct({ ...selectedProduct, docs: [...selectedProduct.docs, doc] });
        setDocForm({ type: 'pdf', title: '', url: '' });
      }
    } catch (err) {
      console.error('Error adding doc:', err);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!selectedProduct) return;
    try {
      await fetch(`/api/admin/products/docs/${docId}`, { method: 'DELETE', headers });
      setSelectedProduct({
        ...selectedProduct,
        docs: selectedProduct.docs.filter(d => d.id !== docId),
      });
    } catch (err) {
      console.error('Error deleting doc:', err);
    }
  };

  // Gallery management - supports multiple files at once
  const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProduct || !e.target.files?.length) return;
    const files = Array.from(e.target.files);
    
    // Validate all file sizes (max 10MB each)
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Arquivo "${file.name}" muito grande. Máximo: 10MB por arquivo`);
        return;
      }
    }
    
    setIsUploadingGallery(true);
    const newImages: any[] = [];
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`/api/admin/products/${selectedProduct.id}/gallery`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          const img = await res.json();
          newImages.push(img);
        } else {
          const err = await res.json();
          alert(`Erro ao adicionar "${file.name}": ${err.error || 'Erro desconhecido'}`);
        }
      }
      
      if (newImages.length > 0) {
        setSelectedProduct({ 
          ...selectedProduct, 
          gallery: [...selectedProduct.gallery, ...newImages] 
        });
      }
    } catch (err) {
      console.error('Error adding gallery images:', err);
      alert('Erro de conexão');
    }
    setIsUploadingGallery(false);
    e.target.value = '';
  };

  const handleDeleteGalleryImage = async (imageId: number) => {
    if (!selectedProduct) return;
    try {
      await fetch(`/api/admin/products/gallery/${imageId}`, { method: 'DELETE', headers });
      setSelectedProduct({
        ...selectedProduct,
        gallery: selectedProduct.gallery.filter(g => g.id !== imageId),
      });
    } catch (err) {
      console.error('Error deleting gallery image:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Produtos</h1>
          <p className="text-neutral-500 mt-1">Gerencie os produtos e suas especificações</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products list */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-900">Lista de Produtos</h2>
          </div>
          <div className="divide-y divide-neutral-200 max-h-[600px] overflow-auto">
            {products.length === 0 ? (
              <p className="p-4 text-neutral-500 text-center">Nenhum produto cadastrado</p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                    selectedProduct?.id === product.id ? 'bg-neutral-50' : ''
                  }`}
                  onClick={() => handleEdit(product)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-neutral-400" />
                      <div>
                        <h3 className="font-medium text-neutral-900">{product.title}</h3>
                        <p className="text-sm text-neutral-500">{product.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                        className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Product form */}
        {showForm && (
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
              <h2 className="font-semibold text-neutral-900 mb-4">Informações Básicas</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                    placeholder="ex: cubiculos"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-600 mb-1">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: Cubículos de Média Tensão"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-600 mb-1">Subtítulo</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: Soluções para distribuição de energia"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-600 mb-1">Descrição Curta</label>
                  <textarea
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500 resize-none"
                    placeholder="Breve descrição para a listagem"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-600 mb-1">Descrição Completa</label>
                  <textarea
                    value={formData.full_description}
                    onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500 resize-none"
                    placeholder="Descrição detalhada do produto"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                  <span className="text-sm text-neutral-600">Produto ativo (visível no site)</span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>

            {/* Only show additional sections if product is saved */}
            {selectedProduct && (
              <>
                {/* Image */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                  <h2 className="font-semibold text-neutral-900 mb-4">Imagem Principal</h2>
                  <div className="flex items-start gap-4">
                    {selectedProduct.image_key ? (
                      <img
                        src={`/api/files/${selectedProduct.image_key}`}
                        alt={selectedProduct.title}
                        className="w-40 h-40 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <Image className="w-10 h-10 text-neutral-600" />
                      </div>
                    )}
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${isUploadingImage ? 'bg-neutral-200 text-neutral-500' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
                      {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {isUploadingImage ? 'Enviando...' : 'Upload Imagem'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
                    </label>
                  </div>
                </div>

                {/* Specs */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                  <h2 className="font-semibold text-neutral-900 mb-4">Especificações Técnicas</h2>
                  <div className="space-y-2 mb-4">
                    {selectedProduct.specs.map((spec) => (
                      <div key={spec.id} className="flex items-center gap-2 bg-neutral-100 rounded-lg px-4 py-2">
                        <span className="flex-1 text-neutral-900">{spec.spec_value}</span>
                        <button
                          onClick={() => handleDeleteSpec(spec.id)}
                          className="text-neutral-500 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSpec}
                      onChange={(e) => setNewSpec(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSpec()}
                      className="flex-1 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                      placeholder="Ex: Tensão: 15kV / 24kV / 36kV"
                    />
                    <button
                      onClick={handleAddSpec}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                  <h2 className="font-semibold text-neutral-900 mb-4">Características</h2>
                  <div className="space-y-2 mb-4">
                    {selectedProduct.features.map((feature) => (
                      <div key={feature.id} className="flex items-center gap-2 bg-neutral-100 rounded-lg px-4 py-2">
                        <span className="flex-1 text-neutral-900">{feature.feature_text}</span>
                        <button
                          onClick={() => handleDeleteFeature(feature.id)}
                          className="text-neutral-500 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                      className="flex-1 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                      placeholder="Ex: Sistema de intertravamento mecânico"
                    />
                    <button
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Docs */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                  <h2 className="font-semibold text-neutral-900 mb-4">Documentação</h2>
                  <div className="space-y-2 mb-4">
                    {selectedProduct.docs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 bg-neutral-100 rounded-lg px-4 py-3">
                        {doc.doc_type === 'pdf' ? (
                          <FileText className="w-5 h-5 text-red-400" />
                        ) : (
                          <Video className="w-5 h-5 text-blue-400" />
                        )}
                        <span className="flex-1 text-neutral-900">{doc.doc_title}</span>
                        <span className="text-xs text-neutral-500 uppercase">{doc.doc_type}</span>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="text-neutral-500 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={docForm.type}
                      onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                      className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                    >
                      <option value="pdf">PDF</option>
                      <option value="video">Vídeo</option>
                    </select>
                    <input
                      type="text"
                      value={docForm.title}
                      onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                      className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                      placeholder="Título do documento"
                    />
                    <input
                      type="text"
                      value={docForm.url}
                      onChange={(e) => setDocForm({ ...docForm, url: e.target.value })}
                      className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                      placeholder="URL (YouTube, Drive, etc)"
                    />
                  </div>
                  <button
                    onClick={handleAddDoc}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Documento
                  </button>
                </div>

                {/* Gallery */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                  <h2 className="font-semibold text-neutral-900 mb-4">Galeria de Imagens</h2>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {selectedProduct.gallery.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={`/api/files/${img.image_key}`}
                          alt=""
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleDeleteGalleryImage(img.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <label className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${isUploadingGallery ? 'bg-neutral-200' : 'bg-neutral-100 hover:bg-neutral-200'}`}>
                      {isUploadingGallery ? <Loader2 className="w-8 h-8 text-neutral-500 mb-2 animate-spin" /> : <Upload className="w-8 h-8 text-neutral-500 mb-2" />}
                      <span className="text-sm text-neutral-500">{isUploadingGallery ? 'Enviando...' : 'Adicionar'}</span>
                      <input type="file" accept="image/*" onChange={handleAddGalleryImage} className="hidden" disabled={isUploadingGallery} multiple />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
