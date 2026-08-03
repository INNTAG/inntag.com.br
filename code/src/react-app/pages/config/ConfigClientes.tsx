import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Loader2, Image, Eye, Building2, FileText, MapPin, Calendar, ExternalLink } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  logo_key?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: number;
}

interface ProjectFile {
  id: number;
  file_key: string;
  file_name: string;
  file_type: string;
}

interface Project {
  id: number;
  title: string;
  description?: string;
  location?: string;
  os_number?: string;
  status: string;
  created_at: string;
  files: ProjectFile[];
}

export default function ConfigClientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [form, setForm] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    logo_key: '',
  });

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setForm({
        name: client.name,
        contact_email: client.contact_email || '',
        contact_phone: client.contact_phone || '',
        logo_key: client.logo_key || '',
      });
    } else {
      setEditingClient(null);
      setForm({ name: '', contact_email: '', contact_phone: '', logo_key: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingClient) {
        await fetch(`/api/admin/clients/${editingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/admin/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este cliente?')) return;

    try {
      await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' });
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoUpload = async (clientId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(clientId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/logo`, {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
    setUploading(null);
  };

  const handleViewClientPortal = async (client: Client) => {
    setViewingClient(client);
    setLoadingProjects(true);
    try {
      const token = sessionStorage.getItem('admin_session');
      const res = await fetch(`/api/admin/clients/${client.id}/projects`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setClientProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setClientProjects([]);
    }
    setLoadingProjects(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Clientes</h1>
          <p className="text-neutral-500">Gerencie clientes e seus dados</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-neutral-200 text-center shadow-sm">
          <p className="text-neutral-500">Nenhum cliente cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm"
            >
              {/* Logo area - full width */}
              <label className="relative cursor-pointer group block mb-4">
                <div className="w-full aspect-[2/1] bg-white rounded-xl flex items-center justify-center overflow-hidden">
                  {uploading === client.id ? (
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  ) : client.logo_key ? (
                    <img
                      src={`/api/files/${client.logo_key}`}
                      alt={client.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-neutral-300">
                      {client.name.charAt(0)}
                    </span>
                  )}
                </div>
                {/* Upload overlay */}
                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(client.id, e)}
                  disabled={uploading === client.id}
                />
              </label>
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">{client.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewClientPortal(client)}
                    className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors"
                    title="Ver como cliente"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal(client)}
                    className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 rounded-lg bg-neutral-100 hover:bg-red-100 text-neutral-600 hover:text-red-500 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {client.contact_email && (
                <p className="text-sm text-neutral-500">{client.contact_email}</p>
              )}
              {client.contact_phone && (
                <p className="text-sm text-neutral-500">{client.contact_phone}</p>
              )}
              {!client.logo_key && (
                <p className="text-xs text-neutral-400 mt-3 flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  Clique na área acima para adicionar logo
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md border border-neutral-200 shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Email de Contato</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                >
                  {editingClient ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Portal View Modal */}
      {viewingClient && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-100 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header - mimics Portal header */}
            <div className="bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {viewingClient.logo_key ? (
                    <img src={`/api/files/${viewingClient.logo_key}`} alt="" className="h-10 object-contain" />
                  ) : (
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-orange-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-neutral-900">{viewingClient.name}</p>
                    <p className="text-xs text-neutral-500">Portal do Cliente</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                  Visualização de Suporte
                </span>
                <button 
                  onClick={() => setViewingClient(null)} 
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - mimics Portal dashboard */}
            <div className="flex-1 overflow-auto p-6 bg-neutral-100">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">Meus Projetos</h2>
                <p className="text-neutral-600 mt-1">Acompanhe o status dos seus projetos</p>
              </div>

              {loadingProjects ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : clientProjects.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200">
                  <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">Nenhum projeto associado a este cliente</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {clientProjects.map((project) => (
                    <div key={project.id} className="bg-white rounded-2xl p-6 border border-neutral-200">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          {project.os_number && (
                            <span className="text-xs font-medium bg-orange-100 text-orange-600 px-2 py-1 rounded-full mb-2 inline-block">
                              OS: {project.os_number}
                            </span>
                          )}
                          <h3 className="text-lg font-semibold text-neutral-900">{project.title}</h3>
                          {project.description && (
                            <p className="text-neutral-600 text-sm mt-1">{project.description}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'concluido' ? 'bg-green-100 text-green-700' :
                          project.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          {project.status === 'concluido' ? 'Concluído' :
                           project.status === 'em_andamento' ? 'Em Andamento' :
                           project.status === 'planejamento' ? 'Planejamento' : project.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                        {project.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {project.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(project.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {project.files && project.files.length > 0 && (
                        <div className="border-t border-neutral-100 pt-4">
                          <p className="text-sm font-medium text-neutral-700 mb-2">Arquivos ({project.files.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {project.files.map((file) => (
                              <a
                                key={file.id}
                                href={`/api/files/${file.file_key}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 px-3 py-2 rounded-lg text-sm text-neutral-700 transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                                <span className="max-w-[150px] truncate">{file.file_name}</span>
                                <ExternalLink className="w-3 h-3 text-neutral-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
