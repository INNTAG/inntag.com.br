import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Pencil, Wrench, Image as ImageIcon } from 'lucide-react';

interface Service {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  image_url: string;
  features: string;
  is_active: number;
  display_order: number;
}

export default function ConfigServicos() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    image_url: '',
    features: '',
    is_active: true,
    display_order: 0
  });
  const [error, setError] = useState('');

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const openNewService = () => {
    setEditingService(null);
    setForm({
      title: '',
      slug: '',
      subtitle: '',
      description: '',
      image_url: '',
      features: '',
      is_active: true,
      display_order: services.length
    });
    setShowModal(true);
    setError('');
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setForm({
      title: service.title,
      slug: service.slug,
      subtitle: service.subtitle || '',
      description: service.description || '',
      image_url: service.image_url || '',
      features: service.features || '',
      is_active: service.is_active === 1,
      display_order: service.display_order || 0
    });
    setShowModal(true);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title) {
      setError('Título é obrigatório');
      return;
    }

    try {
      const url = editingService 
        ? `/api/admin/services/${editingService.id}` 
        : '/api/admin/services';
      
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slug: form.slug || generateSlug(form.title),
          is_active: form.is_active ? 1 : 0
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Erro ao salvar');
        return;
      }

      setShowModal(false);
      setEditingService(null);
      fetchServices();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar serviço');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este serviço?')) return;

    try {
      await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Serviços</h1>
        <p className="text-neutral-600">Gerencie os serviços oferecidos pela INNTAG</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Serviços Cadastrados</h2>
                <p className="text-sm text-neutral-500">{services.length} serviço(s)</p>
              </div>
            </div>
            <button
              onClick={openNewService}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Serviço
            </button>
          </div>

          {services.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">Nenhum serviço cadastrado</p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200"
                >
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-neutral-200 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-neutral-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-neutral-900 font-medium">{service.title}</p>
                      {service.is_active === 0 && (
                        <span className="px-2 py-0.5 bg-neutral-200 text-neutral-500 text-xs rounded">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500">{service.subtitle}</p>
                    <p className="text-xs text-neutral-400 mt-1">/{service.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditService(service)}
                      className="p-2 rounded-lg hover:bg-blue-100 text-neutral-400 hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 rounded-lg hover:bg-red-100 text-neutral-400 hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-neutral-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-600 mb-2">Título *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Manutenção Preventiva"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-2">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="manutencao-preventiva"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">Subtítulo</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Breve descrição do serviço"
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrição completa do serviço..."
                  rows={4}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">URL da Imagem</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">Características (uma por linha)</label>
                <textarea
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="Equipe especializada&#10;Disponibilidade imediata&#10;Relatórios técnicos"
                  rows={4}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm text-neutral-600 mb-2">Ordem</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    className="w-24 bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer mt-6">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-neutral-700">Serviço ativo</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                >
                  {editingService ? 'Salvar' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
