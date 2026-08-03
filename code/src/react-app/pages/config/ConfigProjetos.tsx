import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Plus, Pencil, Trash2, X, Image, FileText, Loader2, ExternalLink, Filter, Calendar, Building2, Eye, RefreshCw } from 'lucide-react';



interface UnitWithGroup {
  id: number;
  group_id: number;
  group_name: string;
  group_sector: string;
  name: string;
  city?: string;
  state?: string;
}

interface Product {
  id: number;
  title: string;
  slug: string;
}

interface Project {
  id: number;
  client_id?: number;
  client_name?: string;
  unit_id?: number;
  unit_name?: string;
  group_id?: number;
  group_name?: string;
  group_logo_key?: string;
  product_id?: number;
  product_name?: string;
  os_number?: string;
  project_year?: number;
  responsible_person?: string;
  title: string;
  description?: string;
  location?: string;
  status: string;
  is_featured: number;
  is_public: number;
  created_at: string;
  files?: ProjectFile[];
}

interface ProjectFile {
  id: number;
  project_id: number;
  file_key: string;
  file_name: string;
  file_type: string;
  category: string;
}

interface Filters {
  group_id: string;
  product_id: string;
  responsible_person: string;
  os_number: string;
  year: string;
}

export default function ConfigProjetos() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<UnitWithGroup[]>([]);
  
  // Extract unique groups from units
  const groups = units.reduce((acc: { id: number; name: string }[], unit) => {
    if (unit.group_id && unit.group_name && !acc.find(g => g.id === unit.group_id)) {
      acc.push({ id: unit.group_id, name: unit.group_name });
    }
    return acc;
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    group_id: '',
    product_id: '',
    responsible_person: '',
    os_number: '',
    year: '',
  });

  const [form, setForm] = useState({
    unit_id: '',
    product_id: '',
    os_number: '',
    project_year: '',
    responsible_person: '',
    title: '',
    description: '',
    location: '',
    is_featured: false,
    is_public: false,
    status: 'active',
  });

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/admin/projects');
      const data = await res.json();
      const projectsList = Array.isArray(data) ? data : [];
      
      const projectsWithFiles = await Promise.all(
        projectsList.map(async (project: Project) => {
          try {
            const filesRes = await fetch(`/api/admin/projects/${project.id}/files`);
            const filesData = await filesRes.json();
            return { ...project, files: Array.isArray(filesData) ? filesData : [] };
          } catch {
            return { ...project, files: [] };
          }
        })
      );
      
      setProjects(projectsWithFiles);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };



  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/admin/units-with-groups');
      const data = await res.json();
      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUnits();
    fetchProducts();
  }, []);

  // Extract unique values for filter dropdowns
  const uniquePersons = useMemo(() => {
    const persons = projects
      .map((p) => p.responsible_person)
      .filter((p): p is string => !!p);
    return [...new Set(persons)].sort();
  }, [projects]);

  const uniqueYears = useMemo(() => {
    const years = projects
      .map((p) => p.project_year)
      .filter((y): y is number => !!y);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [projects]);

  const uniqueOsNumbers = useMemo(() => {
    const osNumbers = projects
      .map((p) => p.os_number)
      .filter((os): os is string => !!os);
    return [...new Set(osNumbers)].sort();
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Filter by group (through unit)
      if (filters.group_id) {
        const unit = units.find(u => u.id === project.unit_id);
        if (!unit || unit.group_id?.toString() !== filters.group_id) return false;
      }
      if (filters.product_id && project.product_id?.toString() !== filters.product_id) return false;
      if (filters.responsible_person && project.responsible_person !== filters.responsible_person) return false;
      if (filters.os_number && project.os_number !== filters.os_number) return false;
      if (filters.year && project.project_year?.toString() !== filters.year) return false;
      return true;
    });
  }, [projects, filters]);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ group_id: '', product_id: '', responsible_person: '', os_number: '', year: '' });
  };

  const openModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setForm({
        unit_id: project.unit_id?.toString() || '',
        product_id: project.product_id?.toString() || '',
        os_number: project.os_number || '',
        project_year: project.project_year?.toString() || '',
        responsible_person: project.responsible_person || '',
        title: project.title,
        description: project.description || '',
        location: project.location || '',
        is_featured: !!project.is_featured,
        is_public: !!project.is_public,
        status: project.status || 'active',
      });
    } else {
      setEditingProject(null);
      setForm({
        unit_id: '',
        product_id: '',
        os_number: '',
        project_year: new Date().getFullYear().toString(),
        responsible_person: '',
        title: '',
        description: '',
        location: '',
        is_featured: false,
        is_public: false,
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      unit_id: form.unit_id ? parseInt(form.unit_id) : null,
      product_id: form.product_id ? parseInt(form.product_id) : null,
      project_year: form.project_year ? parseInt(form.project_year) : null,
    };

    try {
      if (editingProject) {
        await fetch(`/api/admin/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/admin/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este projeto?')) return;

    try {
      await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const openFilesModal = async (project: Project) => {
    setSelectedProject(project);
    setShowFilesModal(true);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/files`);
      const data = await res.json();
      setProjectFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedProject) return;

    setUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('category', category);
        
        await fetch(`/api/admin/projects/${selectedProject.id}/files`, {
          method: 'POST',
          body: formData,
        });
      }
      
      const res = await fetch(`/api/admin/projects/${selectedProject.id}/files`);
      const data = await res.json();
      setProjectFiles(Array.isArray(data) ? data : []);
      // Also refresh main projects list to update thumbnails
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Deseja excluir este arquivo?')) return;

    try {
      await fetch(`/api/admin/files/${fileId}`, { method: 'DELETE' });
      setProjectFiles(projectFiles.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Projetos</h1>
          <p className="text-neutral-600">Gerencie projetos com fotos e documentos</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-orange-100 text-orange-600 border border-orange-300'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
            )}
          </button>
          <button
            onClick={() => openModal()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-neutral-900 font-medium">Filtrar Projetos</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-orange-500 hover:text-orange-600"
              >
                Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Grupo</label>
              <select
                value={filters.group_id}
                onChange={(e) => setFilters({ ...filters, group_id: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Todos</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Produto</label>
              <select
                value={filters.product_id}
                onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Todos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Responsável</label>
              <select
                value={filters.responsible_person}
                onChange={(e) => setFilters({ ...filters, responsible_person: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Todos</option>
                {uniquePersons.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Nº da OS</label>
              <select
                value={filters.os_number}
                onChange={(e) => setFilters({ ...filters, os_number: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Todos</option>
                {uniqueOsNumbers.map((os) => (
                  <option key={os} value={os}>{os}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Ano</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Todos</option>
                {uniqueYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-neutral-200 shadow-sm text-center">
          <p className="text-neutral-500">
            {projects.length === 0 ? 'Nenhum projeto cadastrado' : 'Nenhum projeto encontrado com os filtros aplicados'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-6 py-4 text-neutral-600 font-medium">Projeto</th>
                <th className="text-left px-6 py-4 text-neutral-600 font-medium">Cliente / Produto</th>
                <th className="text-left px-6 py-4 text-neutral-600 font-medium">Responsável</th>
                <th className="text-left px-6 py-4 text-neutral-600 font-medium">Ano</th>
                <th className="text-left px-6 py-4 text-neutral-600 font-medium">Cadastro</th>
                <th className="text-right px-6 py-4 text-neutral-600 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const photos = project.files?.filter((f) => f.category === 'photo') || [];
                const documents = project.files?.filter((f) => f.category === 'document') || [];
                
                return (
                <tr key={project.id} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {project.os_number && (
                          <span className="text-xs font-mono bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                            {project.os_number}
                          </span>
                        )}
                        {project.project_year && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                            {project.project_year}
                          </span>
                        )}
                      </div>
                      <Link to={`/config/projeto/${project.id}`} className="text-neutral-900 font-medium hover:text-orange-500 transition-colors">
                        {project.title}
                      </Link>
                      {project.location && (
                        <p className="text-sm text-neutral-500">{project.location}</p>
                      )}
                      <div className="flex gap-1 mt-1">
                        {project.is_featured ? (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">Destaque</span>
                        ) : null}
                        {project.is_public ? (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">Público</span>
                        ) : null}
                      </div>
                      
                      {(photos.length > 0 || documents.length > 0) && (
                        <div className="mt-3 space-y-2">
                          {photos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {photos.slice(0, 4).map((file) => (
                                <a
                                  key={file.id}
                                  href={`/api/files/${file.file_key}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 hover:border-orange-500 transition-colors"
                                >
                                  <img
                                    src={`/api/files/${file.file_key}`}
                                    alt={file.file_name}
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ))}
                              {photos.length > 4 && (
                                <span className="text-xs text-neutral-500 self-center">+{photos.length - 4}</span>
                              )}
                            </div>
                          )}
                          {documents.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {documents.map((file) => (
                                <a
                                  key={file.id}
                                  href={`/api/files/${file.file_key}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span className="max-w-[100px] truncate">{file.file_name}</span>
                                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {project.group_logo_key ? (
                        <img 
                          src={`/api/files/${project.group_logo_key}`} 
                          alt={project.group_name || ''} 
                          className="w-12 h-12 object-contain rounded-lg border border-neutral-200 bg-white p-1 flex-shrink-0"
                        />
                      ) : project.group_name ? (
                        <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-neutral-400" />
                        </div>
                      ) : null}
                      <div>
                        {project.group_name ? (
                          <>
                            <p className="text-neutral-900 font-semibold">{project.group_name}</p>
                            {project.unit_name && (
                              <p className="text-xs text-neutral-500">{project.unit_name}</p>
                            )}
                          </>
                        ) : project.client_name ? (
                          <p className="text-neutral-700">{project.client_name} <span className="text-xs text-neutral-400">(legado)</span></p>
                        ) : (
                          <p className="text-neutral-400">-</p>
                        )}
                        {project.product_name && (
                          <p className="text-xs text-orange-600 mt-1">{project.product_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-700">{project.responsible_person || '-'}</td>
                  <td className="px-6 py-4 text-neutral-700">{project.project_year || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {project.is_public === 1 && (
                        <a
                          href={`/portfolio/${project.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors"
                          title="Ver como cliente"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => openFilesModal(project)}
                        className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                        title="Arquivos"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(project)}
                        className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-2 rounded-lg bg-neutral-100 hover:bg-red-100 text-neutral-700 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {/* Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-neutral-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-neutral-900">
                {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-600 mb-2">Título *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-2">Nº da OS</label>
                  <input
                    type="text"
                    value={form.os_number}
                    onChange={(e) => setForm({ ...form, os_number: e.target.value })}
                    placeholder="Ex: OS-2024-001"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-600 mb-2">Ano do Projeto</label>
                  <input
                    type="number"
                    value={form.project_year}
                    onChange={(e) => setForm({ ...form, project_year: e.target.value })}
                    min="1990"
                    max="2100"
                    placeholder="Ex: 2024"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-2">Responsável</label>
                  <input
                    type="text"
                    value={form.responsible_person}
                    onChange={(e) => setForm({ ...form, responsible_person: e.target.value })}
                    placeholder="Nome do responsável"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Grupo / Unidade
                </label>
                <select
                  value={form.unit_id}
                  onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="">Selecione uma unidade</option>
                  {(() => {
                    const grouped = units.reduce((acc, unit) => {
                      if (!acc[unit.group_name]) acc[unit.group_name] = [];
                      acc[unit.group_name].push(unit);
                      return acc;
                    }, {} as Record<string, UnitWithGroup[]>);
                    return Object.entries(grouped).map(([groupName, groupUnits]) => (
                      <optgroup key={groupName} label={groupName}>
                        {groupUnits.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name} {unit.city && unit.state ? `(${unit.city}/${unit.state})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Produto</label>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500 h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Localização</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-5 h-5 rounded bg-white border-neutral-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-neutral-900">Destaque</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_public}
                    onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                    className="w-5 h-5 rounded bg-white border-neutral-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-neutral-900">Público no Portfólio</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
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
                  {editingProject ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Files Modal */}
      {showFilesModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-neutral-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Arquivos do Projeto</h2>
                <p className="text-neutral-600 text-sm">{selectedProject.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openFilesModal(selectedProject)} 
                  className="p-2 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button onClick={() => setShowFilesModal(false)} className="text-neutral-400 hover:text-neutral-900">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 flex-1 overflow-auto">
              <div className="flex gap-4 mb-6">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-neutral-300 hover:border-orange-500 transition-colors">
                    <Image className="w-5 h-5 text-neutral-500" />
                    <span className="text-neutral-600">Upload Fotos</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                    disabled={uploading}
                  />
                </label>
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-neutral-300 hover:border-orange-500 transition-colors">
                    <FileText className="w-5 h-5 text-neutral-500" />
                    <span className="text-neutral-600">Upload Documentos</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'document')}
                    disabled={uploading}
                  />
                </label>
              </div>

              {uploading && (
                <div className="flex items-center justify-center gap-2 py-4 text-orange-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando arquivo...</span>
                </div>
              )}

              {projectFiles.length === 0 ? (
                <p className="text-center text-neutral-500 py-8">Nenhum arquivo</p>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-neutral-600">Fotos</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {projectFiles
                      .filter((f) => f.category === 'photo')
                      .map((file) => (
                        <div key={file.id} className="relative group">
                          <img
                            src={`/api/files/${file.file_key}`}
                            alt={file.file_name}
                            className="w-full aspect-square object-cover rounded-xl"
                          />
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="absolute top-2 right-2 p-1 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>

                  <h3 className="text-sm font-medium text-neutral-600 mt-6">Documentos</h3>
                  <div className="space-y-2">
                    {projectFiles
                      .filter((f) => f.category === 'document')
                      .map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-neutral-100 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-neutral-500" />
                            <span className="text-neutral-900">{file.file_name}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1 rounded-lg hover:bg-red-100 text-neutral-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
