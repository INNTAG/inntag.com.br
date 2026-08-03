import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router';
import { Plus, Pencil, Trash2, X, Upload, Loader2, Building2, MapPin, Search, Users, FolderKanban, User, AlertCircle, ChevronRight, Phone, Mail, FileText, Eye, Calendar, CheckCircle, GanttChartSquare, Clock, ExternalLink, RefreshCw, Maximize2 } from 'lucide-react';
import { formatCNPJ, formatPhone, formatCEP, isValidEmail } from '@/react-app/utils/formatters';

// Schedule Task interface
interface ScheduleTask {
  id: number;
  project_id: number;
  panel_id?: number;
  service_id?: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  progress: number;
  assigned_to: string;
  notes: string; // stores priority
  sort_order: number;
}

const TASK_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente', color: 'bg-gray-100 text-gray-600' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-blue-100 text-blue-600' },
  { value: 'completed', label: 'Concluída', color: 'bg-green-100 text-green-600' },
  { value: 'blocked', label: 'Bloqueada', color: 'bg-red-100 text-red-600' }
];

const TASK_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-600' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-600' }
];

const SETORES = [
  'Energia e Utilities', 'Petróleo e Gás', 'Mineração', 'Siderurgia e Metalurgia',
  'Papel e Celulose', 'Química e Petroquímica', 'Sucroalcooleiro', 'Agronegócio',
  'Alimentos e Bebidas', 'Automotivo', 'Infraestrutura', 'Saneamento',
  'Cimento e Construção', 'Portuário e Logística', 'Farmacêutico', 'Têxtil', 'Outros',
];

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const CARGOS = [
  'Diretor', 'Diretor Industrial', 'Diretor de Operações', 'Diretor Técnico',
  'Gerente', 'Gerente de Manutenção', 'Gerente de Projetos', 'Gerente Industrial', 'Gerente de Engenharia',
  'Coordenador', 'Coordenador de Manutenção', 'Coordenador de Projetos', 'Coordenador Elétrico',
  'Supervisor', 'Supervisor de Manutenção', 'Supervisor Elétrico',
  'Engenheiro', 'Engenheiro Eletricista', 'Engenheiro de Manutenção', 'Engenheiro de Projetos',
  'Técnico', 'Técnico Eletricista', 'Técnico de Manutenção',
  'Comprador', 'Analista de Compras', 'Gerente de Compras', 'Gerente de Suprimentos',
  'Contato Principal', 'Contato Comercial', 'Contato Técnico',
  'Outro',
];

interface ClientGroup { id: number; name: string; logo_key?: string; sector?: string; notes?: string; is_active: number; units_count?: number; projects_count?: number; }
interface ClientUnit { id: number; group_id: number; name: string; cnpj?: string; address?: string; city?: string; state?: string; postal_code?: string; contact_name?: string; contact_email?: string; contact_phone?: string; projects_count?: number; }
interface UnitContact { id: number; unit_id: number; name: string; role?: string; email?: string; phone?: string; is_primary: number; }
interface Project { id: number; title: string; description?: string; os_number?: string; status: string; location?: string; project_year?: number; responsible_person?: string; is_featured: number; is_public: number; product_id?: number; product_name?: string; }
interface Product { id: number; title: string; }
interface ProjectFile { id: number; project_id: number; file_key: string; file_name: string; file_type: string; category: string; }
interface Panel { id: number; project_id: number; tag: string; serial_number?: string; description?: string; status: string; modelo?: string; fabricante?: string; potencia?: string; tensao?: string; corrente_nominal?: string; grau_ip?: string; data_fabricacao?: string; data_instalacao?: string; garantia_ate?: string; norma?: string; localizacao?: string; }
interface PanelDocument { id: number; panel_id: number; file_key: string; file_name: string; file_type: string; category: string; is_client_visible: number; created_at?: string; }
interface Service { id: number; project_id: number; os_number: string; description?: string; status: string; start_date?: string; end_date?: string; tipo_servico?: string; responsavel?: string; responsavel_telefone?: string; responsavel_email?: string; prioridade?: string; valor?: number; horas_trabalhadas?: number; equipamento?: string; local?: string; observacoes?: string; proxima_manutencao?: string; }
interface ServiceDocument { id: number; service_id: number; file_key: string; file_name: string; file_type: string; category: string; is_client_visible: number; notes?: string; created_at?: string; }

// Document categories - same for panels and services
const DOC_CATEGORIES = [
  { value: 'docs_cliente', label: 'Docs Cliente' },
  { value: 'proposta_tecnica', label: 'Proposta Técnica' },
  { value: 'proposta_comercial', label: 'Proposta Comercial' },
  { value: 'pedido', label: 'Pedido' },
  { value: 'projetos', label: 'Projetos' },
  { value: 'aprovacao_projeto', label: 'Aprovação de Projeto' },
  { value: 'cronograma', label: 'Cronograma' },
  { value: 'taf', label: 'TAF' },
  { value: 'nfe', label: 'NFe' },
];

// Helper to format timestamp
const formatDocTimestamp = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function ConfigEmpresas() {
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [units, setUnits] = useState<ClientUnit[]>([]);
  const [contacts, setContacts] = useState<UnitContact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedGroup, setSelectedGroup] = useState<ClientGroup | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<ClientUnit | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailTab, setDetailTab] = useState<'pessoas' | 'projetos'>('pessoas');
  
  const [loading, setLoading] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [searchGroups, setSearchGroups] = useState('');
  const [searchUnits, setSearchUnits] = useState('');
  
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ClientGroup | null>(null);
  const [editingUnit, setEditingUnit] = useState<ClientUnit | null>(null);
  const [editingContact, setEditingContact] = useState<UnitContact | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [groupForm, setGroupForm] = useState({ name: '', sector: '', notes: '' });
  const [unitForm, setUnitForm] = useState({ name: '', cnpj: '', address: '', city: '', state: '', postal_code: '', contact_name: '', contact_email: '', contact_phone: '' });
  const [contactForm, setContactForm] = useState({ name: '', role: '', email: '', phone: '', is_primary: 0 });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', os_number: '', location: '', project_year: new Date().getFullYear(), responsible_person: '', status: 'active', is_featured: 0, is_public: 0, product_id: '' });
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Panels & Services state
  const [projectDetailTab, setProjectDetailTab] = useState<'info' | 'paineis' | 'servicos' | 'cronograma'>('info');
  const [panels, setPanels] = useState<Panel[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [panelDocuments, setPanelDocuments] = useState<PanelDocument[]>([]);
  const [serviceDocuments, setServiceDocuments] = useState<ServiceDocument[]>([]);
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [panelForm, setPanelForm] = useState({ tag: '', serial_number: '', description: '', status: 'active', modelo: '', fabricante: '', potencia: '', tensao: '', corrente_nominal: '', grau_ip: '', data_fabricacao: '', data_instalacao: '', garantia_ate: '', norma: '', localizacao: '' });
  const [serviceForm, setServiceForm] = useState({ os_number: '', description: '', status: 'active', start_date: '', end_date: '', tipo_servico: '', responsavel: '', responsavel_telefone: '', responsavel_email: '', prioridade: '', valor: '', horas_trabalhadas: '', equipamento: '', local: '', observacoes: '', proxima_manutencao: '' });
  const [uploadingPanelDoc, setUploadingPanelDoc] = useState(false);
  const [uploadingServiceDoc, setUploadingServiceDoc] = useState(false);
  const [docCategory, setDocCategory] = useState('docs_cliente');
  const [docClientVisible, setDocClientVisible] = useState(true);
  
  // Schedule/Gantt state
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);
  const [taskContext, setTaskContext] = useState<{ projectId?: number; panelId?: number; serviceId?: number }>({});
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'pending', priority: 'medium', start_date: '', due_date: '', assigned_to: '', estimated_hours: '', actual_hours: '' });
  
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [contactEmailError, setContactEmailError] = useState('');

  const getToken = () => sessionStorage.getItem('admin_session');

  // Fetch cities from IBGE
  const fetchCitiesByState = useCallback(async (uf: string) => {
    if (!uf) { setCitiesList([]); return; }
    setLoadingCities(true);
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      const data = await res.json();
      setCitiesList(data.map((m: { nome: string }) => m.nome));
    } catch { setCitiesList([]); }
    setLoadingCities(false);
  }, []);

  useEffect(() => {
    if (unitForm.state) {
      fetchCitiesByState(unitForm.state);
      setCitySearch('');
    } else setCitiesList([]);
  }, [unitForm.state, fetchCitiesByState]);

  const filteredCities = citiesList.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 8);

  // Data fetching
  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/client-groups', { headers: { Authorization: `Bearer ${getToken()}` } });
      setGroups(await res.json());
    } catch { setGroups([]); }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${getToken()}` } });
      setProducts(await res.json());
    } catch { setProducts([]); }
  };

  const fetchUnits = async (groupId: number) => {
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/admin/client-groups/${groupId}/units`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setUnits(await res.json());
    } catch { setUnits([]); }
    setLoadingUnits(false);
  };

  const fetchUnitDetail = async (unitId: number) => {
    setLoadingDetail(true);
    try {
      const [contactsRes, projectsRes] = await Promise.all([
        fetch(`/api/admin/client-units/${unitId}/contacts`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`/api/admin/client-units/${unitId}/projects`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      setContacts(await contactsRes.json());
      setProjects(await projectsRes.json());
    } catch { setContacts([]); setProjects([]); }
    setLoadingDetail(false);
  };

  useEffect(() => { fetchGroups(); fetchProducts(); }, []);
  useEffect(() => { if (selectedGroup) fetchUnits(selectedGroup.id); }, [selectedGroup]);
  useEffect(() => { if (selectedUnit) fetchUnitDetail(selectedUnit.id); }, [selectedUnit]);

  // Selection handlers
  const selectGroup = (g: ClientGroup) => {
    setSelectedGroup(g);
    setSelectedUnit(null);
    setSearchUnits('');
  };

  const selectUnit = (u: ClientUnit) => {
    setSelectedUnit(u);
    setDetailTab('pessoas');
  };

  // CRUD handlers
  const openGroupModal = (g?: ClientGroup) => {
    setEditingGroup(g || null);
    setGroupForm(g ? { name: g.name, sector: g.sector || '', notes: g.notes || '' } : { name: '', sector: '', notes: '' });
    setShowGroupModal(true);
  };

  const openUnitModal = (u?: ClientUnit) => {
    setEditingUnit(u || null);
    setUnitForm(u ? {
      name: u.name, cnpj: u.cnpj || '', address: u.address || '', city: u.city || '',
      state: u.state || '', postal_code: u.postal_code || '', contact_name: u.contact_name || '',
      contact_email: u.contact_email || '', contact_phone: u.contact_phone || ''
    } : { name: '', cnpj: '', address: '', city: '', state: '', postal_code: '', contact_name: '', contact_email: '', contact_phone: '' });
    setShowUnitModal(true);
  };

  const openContactModal = (c?: UnitContact) => {
    setEditingContact(c || null);
    setContactForm(c ? { name: c.name, role: c.role || '', email: c.email || '', phone: c.phone || '', is_primary: c.is_primary } : { name: '', role: '', email: '', phone: '', is_primary: 0 });
    setShowContactModal(true);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingGroup ? `/api/admin/client-groups/${editingGroup.id}` : '/api/admin/client-groups';
    await fetch(url, { method: editingGroup ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(groupForm) });
    setShowGroupModal(false);
    fetchGroups();
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    const url = editingUnit ? `/api/admin/client-units/${editingUnit.id}` : `/api/admin/client-groups/${selectedGroup.id}/units`;
    await fetch(url, { method: editingUnit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(unitForm) });
    setShowUnitModal(false);
    fetchUnits(selectedGroup.id);
    fetchGroups();
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    const url = editingContact ? `/api/admin/unit-contacts/${editingContact.id}` : `/api/admin/client-units/${selectedUnit.id}/contacts`;
    await fetch(url, { method: editingContact ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(contactForm) });
    setShowContactModal(false);
    fetchUnitDetail(selectedUnit.id);
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Excluir grupo e todas as unidades?')) return;
    await fetch(`/api/admin/client-groups/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (selectedGroup?.id === id) { setSelectedGroup(null); setSelectedUnit(null); }
    fetchGroups();
  };

  const handleDeleteUnit = async (id: number) => {
    if (!confirm('Excluir unidade?')) return;
    await fetch(`/api/admin/client-units/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (selectedUnit?.id === id) setSelectedUnit(null);
    if (selectedGroup) fetchUnits(selectedGroup.id);
    fetchGroups();
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Excluir contato?')) return;
    await fetch(`/api/admin/unit-contacts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (selectedUnit) fetchUnitDetail(selectedUnit.id);
  };

  // Open project detail view
  const openProjectDetail = async (project: Project) => {
    setSelectedProject(project);
    setProjectDetailTab('info');
    setSelectedPanel(null);
    setSelectedService(null);
    // Fetch panels
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/panels`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setPanels(await res.json());
      else setPanels([]);
    } catch { setPanels([]); }
    // Fetch services
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/services`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setServices(await res.json());
      else setServices([]);
    } catch { setServices([]); }
    // Fetch schedule tasks
    fetchScheduleTasks(project.id);
  };

  const closeProjectDetail = () => {
    setSelectedProject(null);
    setPanels([]);
    setServices([]);
    setScheduleTasks([]);
    setSelectedPanel(null);
    setSelectedService(null);
    setProjectDetailTab('info');
  };

  // Panel CRUD
  const openPanelModal = (panel?: Panel) => {
    setEditingPanel(panel || null);
    setPanelForm(panel ? { 
      tag: panel.tag, serial_number: panel.serial_number || '', description: panel.description || '', status: panel.status,
      modelo: panel.modelo || '', fabricante: panel.fabricante || '', potencia: panel.potencia || '', tensao: panel.tensao || '',
      corrente_nominal: panel.corrente_nominal || '', grau_ip: panel.grau_ip || '', data_fabricacao: panel.data_fabricacao || '',
      data_instalacao: panel.data_instalacao || '', garantia_ate: panel.garantia_ate || '', norma: panel.norma || '', localizacao: panel.localizacao || ''
    } : { tag: '', serial_number: '', description: '', status: 'active', modelo: '', fabricante: '', potencia: '', tensao: '', corrente_nominal: '', grau_ip: '', data_fabricacao: '', data_instalacao: '', garantia_ate: '', norma: '', localizacao: '' });
    setShowPanelModal(true);
  };

  const handlePanelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    const url = editingPanel ? `/api/admin/panels/${editingPanel.id}` : '/api/admin/panels';
    const body = editingPanel ? panelForm : { ...panelForm, project_id: selectedProject.id };
    await fetch(url, { method: editingPanel ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body) });
    setShowPanelModal(false);
    // Refresh panels
    const res = await fetch(`/api/admin/projects/${selectedProject.id}/panels`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) setPanels(await res.json());
  };

  const handleDeletePanel = async (id: number) => {
    if (!confirm('Excluir painel e todos os documentos?')) return;
    await fetch(`/api/admin/panels/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (selectedPanel?.id === id) { setSelectedPanel(null); setPanelDocuments([]); }
    if (selectedProject) {
      const res = await fetch(`/api/admin/projects/${selectedProject.id}/panels`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setPanels(await res.json());
    }
  };

  const selectPanel = async (panel: Panel) => {
    setSelectedPanel(panel);
    try {
      const res = await fetch(`/api/admin/panels/${panel.id}/documents`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setPanelDocuments(await res.json());
      else setPanelDocuments([]);
    } catch { setPanelDocuments([]); }
  };

  const handlePanelDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPanel || !e.target.files?.[0]) return;
    setUploadingPanelDoc(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('category', docCategory);
    formData.append('is_client_visible', docClientVisible ? '1' : '0');
    await fetch(`/api/admin/panels/${selectedPanel.id}/documents`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
    const res = await fetch(`/api/admin/panels/${selectedPanel.id}/documents`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) setPanelDocuments(await res.json());
    setUploadingPanelDoc(false);
    e.target.value = '';
  };

  const handleDeletePanelDoc = async (id: number) => {
    if (!confirm('Excluir documento?')) return;
    await fetch(`/api/admin/panel-documents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (selectedPanel) {
      const res = await fetch(`/api/admin/panels/${selectedPanel.id}/documents`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setPanelDocuments(await res.json());
    }
  };

  const togglePanelDocVisibility = async (doc: PanelDocument) => {
    await fetch(`/api/admin/panel-documents/${doc.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ is_client_visible: doc.is_client_visible ? 0 : 1, category: doc.category }) });
    if (selectedPanel) {
      const res = await fetch(`/api/admin/panels/${selectedPanel.id}/documents`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setPanelDocuments(await res.json());
    }
  };

  // Service CRUD
  const openServiceModal = (service?: Service) => {
    setEditingService(service || null);
    setServiceForm(service ? { 
      os_number: service.os_number, description: service.description || '', status: service.status, 
      start_date: service.start_date || '', end_date: service.end_date || '', tipo_servico: service.tipo_servico || '',
      responsavel: service.responsavel || '', responsavel_telefone: service.responsavel_telefone || '', responsavel_email: service.responsavel_email || '',
      prioridade: service.prioridade || '', valor: service.valor?.toString() || '', horas_trabalhadas: service.horas_trabalhadas?.toString() || '',
      equipamento: service.equipamento || '', local: service.local || '', observacoes: service.observacoes || '', proxima_manutencao: service.proxima_manutencao || ''
    } : { os_number: '', description: '', status: 'active', start_date: '', end_date: '', tipo_servico: '', responsavel: '', responsavel_telefone: '', responsavel_email: '', prioridade: '', valor: '', horas_trabalhadas: '', equipamento: '', local: '', observacoes: '', proxima_manutencao: '' });
    setShowServiceModal(true);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
    const body = editingService ? serviceForm : { ...serviceForm, project_id: selectedProject.id };
    await fetch(url, { method: editingService ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body) });
    setShowServiceModal(false);
    // Refresh services
    const res = await fetch(`/api/admin/projects/${selectedProject.id}/services`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) setServices(await res.json());
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Excluir serviço e todos os documentos?')) return;
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (selectedService?.id === id) { setSelectedService(null); setServiceDocuments([]); }
    if (selectedProject) {
      const res = await fetch(`/api/admin/projects/${selectedProject.id}/services`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setServices(await res.json());
    }
  };

  const selectService = async (service: Service) => {
    setSelectedService(service);
    try {
      const res = await fetch(`/api/admin/services/${service.id}/documents`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setServiceDocuments(await res.json());
      else setServiceDocuments([]);
    } catch { setServiceDocuments([]); }
  };

  const handleServiceDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedService || !e.target.files?.[0]) return;
    setUploadingServiceDoc(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('category', docCategory);
    formData.append('is_client_visible', docClientVisible ? '1' : '0');
    await fetch(`/api/admin/services/${selectedService.id}/documents`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
    const res = await fetch(`/api/admin/services/${selectedService.id}/documents`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) setServiceDocuments(await res.json());
    setUploadingServiceDoc(false);
    e.target.value = '';
  };

  const handleDeleteServiceDoc = async (id: number) => {
    if (!confirm('Excluir documento?')) return;
    await fetch(`/api/admin/service-documents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (selectedService) {
      const res = await fetch(`/api/admin/services/${selectedService.id}/documents`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setServiceDocuments(await res.json());
    }
  };

  const toggleServiceDocVisibility = async (doc: ServiceDocument) => {
    await fetch(`/api/admin/service-documents/${doc.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ is_client_visible: doc.is_client_visible ? 0 : 1, category: doc.category, notes: doc.notes }) });
    if (selectedService) {
      const res = await fetch(`/api/admin/services/${selectedService.id}/documents`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setServiceDocuments(await res.json());
    }
  };

  // Schedule/Gantt CRUD
  const fetchScheduleTasks = async (projectId: number) => {
    try {
      const res = await fetch(`/api/admin/schedule-tasks?project_id=${projectId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setScheduleTasks(await res.json());
      else setScheduleTasks([]);
    } catch { setScheduleTasks([]); }
  };

  const openTaskModal = (task?: ScheduleTask, context?: { projectId?: number; panelId?: number; serviceId?: number }) => {
    if (task) {
      setTaskForm({
        title: task.name || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.notes || 'medium',
        start_date: task.start_date || '',
        due_date: task.end_date || '',
        assigned_to: task.assigned_to || '',
        estimated_hours: task.duration_days ? String(task.duration_days) : '',
        actual_hours: ''
      });
    } else {
      setTaskForm({ title: '', description: '', status: 'pending', priority: 'medium', start_date: '', due_date: '', assigned_to: '', estimated_hours: '', actual_hours: '' });
    }
    setEditingTask(task || null);
    setTaskContext(context || { projectId: selectedProject?.id });
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (taskData: Partial<ScheduleTask>) => {
    const url = editingTask ? `/api/admin/schedule-tasks/${editingTask.id}` : '/api/admin/schedule-tasks';
    const body = editingTask ? taskData : { ...taskData, project_id: taskContext.projectId, panel_id: taskContext.panelId, service_id: taskContext.serviceId };
    await fetch(url, { method: editingTask ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body) });
    setShowTaskModal(false);
    setEditingTask(null);
    if (selectedProject) fetchScheduleTasks(selectedProject.id);
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Excluir esta tarefa do cronograma?')) return;
    await fetch(`/api/admin/schedule-tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (selectedProject) fetchScheduleTasks(selectedProject.id);
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    await fetch(`/api/admin/schedule-tasks/${taskId}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, 
      body: JSON.stringify({ status: newStatus }) 
    });
    if (selectedProject) fetchScheduleTasks(selectedProject.id);
  };

  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  
  const handleGenerateSchedule = async () => {
    if (!selectedProject) return;
    setGeneratingSchedule(true);
    try {
      const res = await fetch(`/api/admin/projects/${selectedProject.id}/generate-schedule`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.created > 0) {
          fetchScheduleTasks(selectedProject.id);
        } else {
          alert('Nenhuma tarefa foi criada. Adicione painéis ou serviços primeiro.');
        }
      }
    } catch (err) {
      console.error('Error generating schedule:', err);
      alert('Erro ao gerar cronograma');
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const handleTaskFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleTaskSubmit({
      name: taskForm.title, // DB uses 'name' field
      description: taskForm.description,
      status: taskForm.status,
      notes: taskForm.priority, // Store priority in notes for now
      start_date: taskForm.start_date,
      end_date: taskForm.due_date, // DB uses 'end_date' field
      assigned_to: taskForm.assigned_to,
      duration_days: taskForm.estimated_hours ? Number(taskForm.estimated_hours) : undefined
    });
    setTaskForm({ title: '', description: '', status: 'pending', priority: 'medium', start_date: '', due_date: '', assigned_to: '', estimated_hours: '', actual_hours: '' });
  };

  // Project CRUD
  const openProjectModal = async (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({ 
        title: project.title, 
        description: project.description || '', 
        os_number: project.os_number || '', 
        location: project.location || '', 
        project_year: project.project_year || new Date().getFullYear(), 
        responsible_person: project.responsible_person || '', 
        status: project.status || 'active',
        is_featured: project.is_featured,
        is_public: project.is_public,
        product_id: project.product_id?.toString() || ''
      });
      // Fetch project files
      const res = await fetch(`/api/admin/projects/${project.id}/files`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setProjectFiles(await res.json());
    } else {
      setEditingProject(null);
      setProjectForm({ title: '', description: '', os_number: '', location: '', project_year: new Date().getFullYear(), responsible_person: '', status: 'active', is_featured: 0, is_public: 0, product_id: '' });
      setProjectFiles([]);
    }
    setShowProjectModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !editingProject) return;
    setUploadingFile(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'photo');
    const res = await fetch(`/api/admin/projects/${editingProject.id}/files`, { 
      method: 'POST', 
      headers: { Authorization: `Bearer ${getToken()}` }, 
      body: formData 
    });
    if (res.ok) {
      const newFile = await res.json();
      setProjectFiles(prev => [newFile, ...prev]);
    }
    setUploadingFile(false);
    e.target.value = '';
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Excluir esta foto?')) return;
    await fetch(`/api/admin/files/${fileId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    setProjectFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSaveProject = async () => {
    if (!selectedUnit) return;
    const payload = { 
      ...projectForm, 
      unit_id: selectedUnit.id,
      product_id: projectForm.product_id ? parseInt(projectForm.product_id) : null 
    };
    const url = editingProject ? `/api/admin/projects/${editingProject.id}` : '/api/admin/projects';
    const method = editingProject ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(payload) });
    setShowProjectModal(false);
    fetchUnitDetail(selectedUnit.id);
    fetchGroups();
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Excluir projeto?')) return;
    await fetch(`/api/admin/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (selectedUnit) fetchUnitDetail(selectedUnit.id);
    fetchGroups();
  };

  const handleLogoUpload = async (groupId: number, file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/admin/client-groups/${groupId}/logo`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
    if (res.ok) {
      fetchGroups();
      if (selectedGroup?.id === groupId) {
        const updated = await res.json();
        setSelectedGroup(prev => prev ? { ...prev, logo_key: updated.logo_key } : null);
      }
    }
    setUploading(false);
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchGroups.toLowerCase()));
  const filteredUnits = units.filter(u => u.name.toLowerCase().includes(searchUnits.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-1">
      {/* PANEL 1: Groups */}
      <div className="w-64 flex-shrink-0 bg-white border border-neutral-200 rounded-xl flex flex-col">
        <div className="p-3 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Grupos</span>
            <button onClick={() => openGroupModal()} className="p-1 hover:bg-orange-100 rounded text-orange-600"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={searchGroups} onChange={e => setSearchGroups(e.target.value)} placeholder="Buscar..." className="w-full pl-8 pr-3 py-1.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-orange-400" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filteredGroups.length === 0 ? (
            <div className="p-4 text-center text-sm text-neutral-400">Nenhum grupo</div>
          ) : (
            filteredGroups.map(g => (
              <div key={g.id} onClick={() => selectGroup(g)}
                className={`p-2.5 border-b border-neutral-50 cursor-pointer transition-colors ${selectedGroup?.id === g.id ? 'bg-orange-50 border-l-2 border-l-orange-500' : 'hover:bg-neutral-50'}`}>
                <div className="flex items-center gap-2">
                  {g.logo_key ? (
                    <img src={`/api/files/${g.logo_key}`} className="w-8 h-8 object-contain rounded" />
                  ) : (
                    <div className="w-8 h-8 bg-neutral-100 rounded flex items-center justify-center"><Building2 className="w-4 h-4 text-neutral-400" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-800 truncate">{g.name}</div>
                    <div className="text-xs text-neutral-400 truncate">{g.sector || 'Sem setor'}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-neutral-300 ${selectedGroup?.id === g.id ? 'text-orange-500' : ''}`} />
                </div>
                <div className="flex gap-3 mt-1.5 text-xs text-neutral-400">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{g.units_count || 0}</span>
                  <span className="flex items-center gap-1"><FolderKanban className="w-3 h-3" />{g.projects_count || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PANEL 2: Units (shows when group selected) */}
      {selectedGroup && (
        <div className="w-72 flex-shrink-0 bg-white border border-neutral-200 rounded-xl flex flex-col">
          <div className="p-3 border-b border-neutral-100">
            <div className="flex items-center gap-2 mb-2">
              {selectedGroup.logo_key ? (
                <img src={`/api/files/${selectedGroup.logo_key}`} className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center"><Building2 className="w-4 h-4 text-orange-600" /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-neutral-800 truncate">{selectedGroup.name}</div>
                <div className="text-xs text-neutral-400">{selectedGroup.sector}</div>
              </div>
              <div className="flex gap-1">
                <a href={`/portal?view_group=${selectedGroup.id}&admin_token=${getToken()}`} target="_blank" rel="noopener noreferrer" title="Ver Portal do Cliente" className="p-1 hover:bg-blue-100 rounded text-blue-500"><ExternalLink className="w-3.5 h-3.5" /></a>
                <label className="cursor-pointer p-1 hover:bg-neutral-100 rounded text-neutral-500">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleLogoUpload(selectedGroup.id, e.target.files[0]); }} />
                </label>
                <button onClick={() => openGroupModal(selectedGroup)} className="p-1 hover:bg-neutral-100 rounded text-neutral-500"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDeleteGroup(selectedGroup.id)} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Unidades</span>
              <button onClick={() => openUnitModal()} className="p-1 hover:bg-orange-100 rounded text-orange-600"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={searchUnits} onChange={e => setSearchUnits(e.target.value)} placeholder="Buscar unidade..." className="w-full pl-8 pr-3 py-1.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {loadingUnits ? (
              <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-orange-500" /></div>
            ) : filteredUnits.length === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-400">Nenhuma unidade</div>
            ) : (
              filteredUnits.map(u => (
                <div key={u.id} onClick={() => selectUnit(u)}
                  className={`p-2.5 border-b border-neutral-50 cursor-pointer transition-colors ${selectedUnit?.id === u.id ? 'bg-orange-50 border-l-2 border-l-orange-500' : 'hover:bg-neutral-50'}`}>
                  <div className="text-sm font-medium text-neutral-800">{u.name}</div>
                  {u.city && <div className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{u.city}/{u.state}</div>}
                  {u.cnpj && <div className="text-xs text-neutral-400 mt-0.5">{u.cnpj}</div>}
                  <div className="flex gap-3 mt-1.5 text-xs text-neutral-400">
                    <span className="flex items-center gap-1"><FolderKanban className="w-3 h-3" />{u.projects_count || 0} projetos</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PANEL 3: Unit Detail (shows when unit selected) */}
      {selectedUnit && (
        <div className="flex-1 bg-white border border-neutral-200 rounded-xl flex flex-col min-w-0">
          <div className="p-3 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-neutral-800">{selectedUnit.name}</div>
                <div className="text-xs text-neutral-400">{selectedGroup?.name}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openUnitModal(selectedUnit)} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteUnit(selectedUnit.id)} className="p-1.5 hover:bg-red-100 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {/* Unit info row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500">
              {selectedUnit.cnpj && <span><strong>CNPJ:</strong> {selectedUnit.cnpj}</span>}
              {selectedUnit.city && <span><MapPin className="w-3 h-3 inline mr-0.5" />{selectedUnit.city}/{selectedUnit.state}</span>}
              {selectedUnit.postal_code && <span>CEP: {selectedUnit.postal_code}</span>}
            </div>
            {selectedUnit.address && <div className="text-xs text-neutral-400 mt-1">{selectedUnit.address}</div>}
            {(selectedUnit.contact_name || selectedUnit.contact_email || selectedUnit.contact_phone) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-neutral-600 bg-neutral-50 p-2 rounded-lg">
                {selectedUnit.contact_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{selectedUnit.contact_name}</span>}
                {selectedUnit.contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selectedUnit.contact_email}</span>}
                {selectedUnit.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedUnit.contact_phone}</span>}
              </div>
            )}
            {/* Tabs */}
            <div className="flex gap-1 mt-3">
              <button onClick={() => setDetailTab('pessoas')} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${detailTab === 'pessoas' ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                <Users className="w-4 h-4 inline mr-1" />Pessoas ({contacts.length})
              </button>
              <button onClick={() => setDetailTab('projetos')} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${detailTab === 'projetos' ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                <FolderKanban className="w-4 h-4 inline mr-1" />Projetos ({projects.length})
              </button>
              {detailTab === 'pessoas' && (
                <button onClick={() => openContactModal()} className="ml-auto px-3 py-1.5 text-sm bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-lg">
                  <Plus className="w-4 h-4 inline mr-1" />Pessoa
                </button>
              )}
              {detailTab === 'projetos' && (
                <button onClick={() => openProjectModal()} className="ml-auto px-3 py-1.5 text-sm bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-lg">
                  <Plus className="w-4 h-4 inline mr-1" />Projeto
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {loadingDetail ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
            ) : detailTab === 'pessoas' ? (
              contacts.length === 0 ? (
                <div className="text-center py-8 text-sm text-neutral-400">Nenhuma pessoa cadastrada</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {contacts.map(c => (
                    <div key={c.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-neutral-800 flex items-center gap-2">
                            {c.name}
                            {c.is_primary === 1 && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">Principal</span>}
                          </div>
                          {c.role && <div className="text-xs text-neutral-500">{c.role}</div>}
                        </div>
                        <div className="flex gap-0.5">
                          <button onClick={() => openContactModal(c)} className="p-1 hover:bg-white rounded text-neutral-400 hover:text-neutral-600"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteContact(c.id)} className="p-1 hover:bg-white rounded text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="mt-2 space-y-0.5 text-xs text-neutral-500">
                        {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</div>}
                        {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              projects.length === 0 ? (
                <div className="text-center py-8 text-sm text-neutral-400">Nenhum projeto vinculado<br/><span className="text-xs">Clique em "+ Projeto" para adicionar</span></div>
              ) : (
                <div className="space-y-2">
                  {projects.map(p => (
                    <div key={p.id} onClick={() => openProjectDetail(p)} className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 hover:border-orange-300 hover:bg-orange-50/30 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <FolderKanban className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-neutral-800 flex items-center gap-2 flex-wrap">
                            {p.title}
                            {p.is_featured === 1 && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">Destaque</span>}
                            {p.is_public === 1 && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />Público</span>}
                          </div>
                          <div className="text-xs text-neutral-500 flex flex-wrap gap-3 mt-1">
                            {p.os_number && <span className="text-orange-600 font-semibold">OS {p.os_number}</span>}
                            {p.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.location}</span>}
                            {p.project_year && <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{p.project_year}</span>}
                            {p.product_name && <span className="text-neutral-400">{p.product_name}</span>}
                          </div>
                          {p.description && <div className="text-xs text-neutral-400 mt-1 line-clamp-2">{p.description}</div>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <span className={`px-2 py-0.5 text-xs rounded ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'}`}>
                            {p.status === 'completed' ? 'Concluído' : p.status === 'in_progress' ? 'Em andamento' : 'Ativo'}
                          </span>
                          {p.is_public === 1 && (
                            <button onClick={() => window.open(`/portfolio/${p.id}`, '_blank')} className="p-1.5 hover:bg-white rounded text-neutral-400 hover:text-blue-600" title="Ver no Portfólio">
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => openProjectModal(p)} className="p-1.5 hover:bg-white rounded text-neutral-400 hover:text-neutral-600" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProject(p.id)} className="p-1.5 hover:bg-white rounded text-neutral-400 hover:text-red-500" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* PROJECT DETAIL PANEL */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/40 z-40 flex justify-end" onClick={closeProjectDetail}>
          <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={closeProjectDetail} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="font-semibold text-neutral-800">{selectedProject.title}</h2>
                  {selectedProject.os_number && <span className="text-sm text-orange-600 font-semibold">OS {selectedProject.os_number}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                {selectedProject.is_public === 1 && (
                  <button onClick={() => window.open(`/portfolio/${selectedProject.id}`, '_blank')} className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 flex items-center gap-1">
                    <Eye className="w-4 h-4" /> Ver Público
                  </button>
                )}
                <button onClick={() => { openProjectModal(selectedProject); closeProjectDetail(); }} className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1">
                  <Pencil className="w-4 h-4" /> Editar
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 flex border-b border-neutral-200 bg-neutral-50">
              <button onClick={() => setProjectDetailTab('info')} className={`flex-1 py-3 text-sm font-medium transition-colors ${projectDetailTab === 'info' ? 'text-orange-600 border-b-2 border-orange-500 bg-white' : 'text-neutral-500 hover:text-neutral-700'}`}>
                Informações
              </button>
              <button onClick={() => setProjectDetailTab('paineis')} className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${projectDetailTab === 'paineis' ? 'text-orange-600 border-b-2 border-orange-500 bg-white' : 'text-neutral-500 hover:text-neutral-700'}`}>
                Painéis <span className="text-xs bg-neutral-200 px-1.5 rounded">{panels.length}</span>
              </button>
              <button onClick={() => setProjectDetailTab('servicos')} className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${projectDetailTab === 'servicos' ? 'text-orange-600 border-b-2 border-orange-500 bg-white' : 'text-neutral-500 hover:text-neutral-700'}`}>
                Serviços <span className="text-xs bg-neutral-200 px-1.5 rounded">{services.length}</span>
              </button>
              <button onClick={() => setProjectDetailTab('cronograma')} className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${projectDetailTab === 'cronograma' ? 'text-orange-600 border-b-2 border-orange-500 bg-white' : 'text-neutral-500 hover:text-neutral-700'}`}>
                <GanttChartSquare className="w-4 h-4" /> Cronograma
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {/* INFO TAB */}
              {projectDetailTab === 'info' && (
                <div className="p-6 space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 text-sm rounded-full ${selectedProject.status === 'completed' ? 'bg-green-100 text-green-700' : selectedProject.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'}`}>
                      {selectedProject.status === 'completed' ? 'Concluído' : selectedProject.status === 'in_progress' ? 'Em andamento' : 'Ativo'}
                    </span>
                    {selectedProject.is_featured === 1 && <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">Destaque</span>}
                    {selectedProject.is_public === 1 && <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-1"><CheckCircle className="w-4 h-4" />Público</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProject.location && (<div className="bg-neutral-50 rounded-lg p-3"><div className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Localização</div><div className="text-sm font-medium text-neutral-800">{selectedProject.location}</div></div>)}
                    {selectedProject.project_year && (<div className="bg-neutral-50 rounded-lg p-3"><div className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Ano</div><div className="text-sm font-medium text-neutral-800">{selectedProject.project_year}</div></div>)}
                    {selectedProject.product_name && (<div className="bg-neutral-50 rounded-lg p-3"><div className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><FolderKanban className="w-3 h-3" /> Produto</div><div className="text-sm font-medium text-neutral-800">{selectedProject.product_name}</div></div>)}
                    {selectedProject.responsible_person && (<div className="bg-neutral-50 rounded-lg p-3"><div className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Responsável</div><div className="text-sm font-medium text-neutral-800">{selectedProject.responsible_person}</div></div>)}
                  </div>
                  {selectedProject.description && (<div><h3 className="text-sm font-medium text-neutral-700 mb-2">Descrição</h3><p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{selectedProject.description}</p></div>)}

                  {selectedUnit && (<div className="border-t border-neutral-200 pt-4"><h3 className="text-sm font-medium text-neutral-700 mb-2">Empresa</h3><div className="bg-neutral-50 rounded-lg p-3"><div className="font-medium text-neutral-800">{selectedGroup?.name}</div><div className="text-sm text-neutral-500">{selectedUnit.name}</div>{selectedUnit.city && selectedUnit.state && (<div className="text-xs text-neutral-400 mt-1">{selectedUnit.city}/{selectedUnit.state}</div>)}</div></div>)}
                </div>
              )}

              {/* PAINÉIS TAB */}
              {projectDetailTab === 'paineis' && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-neutral-700">Painéis do Projeto</h3>
                    <button onClick={() => openPanelModal()} className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1"><Plus className="w-4 h-4" /> Novo Painel</button>
                  </div>
                  {panels.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 rounded-lg text-sm text-neutral-400">Nenhum painel cadastrado<br/><span className="text-xs">Clique em "Novo Painel" para adicionar</span></div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {panels.map(panel => (
                        <div key={panel.id} onClick={() => selectPanel(panel)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedPanel?.id === panel.id ? 'border-orange-400 bg-orange-50' : 'border-neutral-200 bg-white hover:border-orange-300'}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <Link to={`/config/painel/${panel.id}`} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="font-semibold text-sm text-neutral-800 hover:text-orange-500 transition-colors">{panel.tag}</Link>
                              {panel.serial_number && <div className="text-xs text-neutral-500">S/N: {panel.serial_number}</div>}
                            </div>
                            <span className={`px-2 py-0.5 text-xs rounded ${panel.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>{panel.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                          </div>
                          {panel.description && <div className="text-xs text-neutral-400 mt-2 line-clamp-2">{panel.description}</div>}
                          <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openPanelModal(panel)} className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeletePanel(panel.id)} className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Panel Documents */}
                  {selectedPanel && (
                    <div className="mt-6 pt-4 border-t border-neutral-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-neutral-700">Documentos: {selectedPanel.tag}</h4>
                          <button onClick={() => selectedPanel && selectPanel(selectedPanel)} className="p-1 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors" title="Atualizar">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <select value={docCategory} onChange={e => setDocCategory(e.target.value)} className="px-2 py-1 text-xs border border-neutral-200 rounded-lg bg-white">
                            {DOC_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                          </select>
                          <label className="flex items-center gap-1 text-xs text-neutral-600">
                            <input type="checkbox" checked={docClientVisible} onChange={e => setDocClientVisible(e.target.checked)} className="rounded" />
                            Visível Cliente
                          </label>
                          <label className="px-3 py-1.5 text-xs bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 cursor-pointer flex items-center gap-1">
                            {uploadingPanelDoc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload
                            <input type="file" className="hidden" onChange={handlePanelDocUpload} disabled={uploadingPanelDoc} />
                          </label>
                        </div>
                      </div>
                      {/* Group documents by category */}
                      {DOC_CATEGORIES.map(cat => {
                        const catDocs = panelDocuments.filter(d => d.category === cat.value);
                        if (catDocs.length === 0) return null;
                        return (
                          <div key={cat.value} className="mb-4">
                            <h5 className="text-xs font-medium text-neutral-500 mb-2">{cat.label} ({catDocs.length})</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {catDocs.map(doc => (
                                <div key={doc.id} className="relative group rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
                                  {doc.file_type.startsWith('image/') ? (
                                    <img src={`/api/files/${doc.file_key}`} alt={doc.file_name} className="w-full aspect-square object-cover cursor-pointer" onClick={() => window.open(`/api/files/${doc.file_key}`, '_blank')} />
                                  ) : (
                                    <div className="w-full aspect-square flex items-center justify-center cursor-pointer" onClick={() => window.open(`/api/files/${doc.file_key}`, '_blank')}>
                                      <FileText className="w-8 h-8 text-neutral-300" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => togglePanelDocVisibility(doc)} className={`p-1.5 rounded ${doc.is_client_visible ? 'bg-green-500' : 'bg-neutral-500'} text-white`} title={doc.is_client_visible ? 'Visível ao cliente' : 'Oculto do cliente'}>
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeletePanelDoc(doc.id)} className="p-1.5 rounded bg-red-500 text-white"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                  <div className="p-1.5">
                                    <div className="text-xs text-neutral-600 truncate flex items-center gap-1">
                                      {doc.is_client_visible ? <Eye className="w-3 h-3 text-green-500 flex-shrink-0" /> : null}
                                      {doc.file_name}
                                    </div>
                                    <div className="text-[10px] text-neutral-400">{formatDocTimestamp(doc.created_at)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {panelDocuments.length === 0 && <div className="text-center py-6 bg-neutral-50 rounded-lg text-xs text-neutral-400">Nenhum documento</div>}
                    </div>
                  )}
                </div>
              )}

              {/* SERVIÇOS TAB */}
              {projectDetailTab === 'servicos' && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-neutral-700">Serviços do Projeto</h3>
                    <button onClick={() => openServiceModal()} className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1"><Plus className="w-4 h-4" /> Novo Serviço</button>
                  </div>
                  {services.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 rounded-lg text-sm text-neutral-400">Nenhum serviço cadastrado<br/><span className="text-xs">Clique em "Novo Serviço" para adicionar</span></div>
                  ) : (
                    <div className="space-y-3">
                      {services.map(service => (
                        <div key={service.id} onClick={() => selectService(service)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedService?.id === service.id ? 'border-orange-400 bg-orange-50' : 'border-neutral-200 bg-white hover:border-orange-300'}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <Link to={`/config/servico/${service.id}`} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="font-semibold text-sm text-orange-600 hover:text-orange-700 transition-colors">OS {service.os_number}</Link>
                              {service.description && <div className="text-sm text-neutral-600 mt-1">{service.description}</div>}
                              <div className="flex gap-3 mt-2 text-xs text-neutral-400">
                                {service.start_date && <span>Início: {service.start_date}</span>}
                                {service.end_date && <span>Fim: {service.end_date}</span>}
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 text-xs rounded ${service.status === 'completed' ? 'bg-green-100 text-green-700' : service.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-500'}`}>
                              {service.status === 'completed' ? 'Concluído' : service.status === 'in_progress' ? 'Em andamento' : 'Ativo'}
                            </span>
                          </div>
                          <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openServiceModal(service)} className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteService(service.id)} className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Service Documents */}
                  {selectedService && (
                    <div className="mt-6 pt-4 border-t border-neutral-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-neutral-700">Documentos: OS {selectedService.os_number}</h4>
                          <button onClick={() => selectedService && selectService(selectedService)} className="p-1 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors" title="Atualizar">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <select value={docCategory} onChange={e => setDocCategory(e.target.value)} className="px-2 py-1 text-xs border border-neutral-200 rounded-lg bg-white">
                            {DOC_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                          </select>
                          <label className="flex items-center gap-1 text-xs text-neutral-600">
                            <input type="checkbox" checked={docClientVisible} onChange={e => setDocClientVisible(e.target.checked)} className="rounded" />
                            Visível Cliente
                          </label>
                          <label className="px-3 py-1.5 text-xs bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 cursor-pointer flex items-center gap-1">
                            {uploadingServiceDoc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload
                            <input type="file" className="hidden" onChange={handleServiceDocUpload} disabled={uploadingServiceDoc} />
                          </label>
                        </div>
                      </div>
                      {/* Group documents by category */}
                      {DOC_CATEGORIES.map(cat => {
                        const catDocs = serviceDocuments.filter(d => d.category === cat.value);
                        if (catDocs.length === 0) return null;
                        return (
                          <div key={cat.value} className="mb-4">
                            <h5 className="text-xs font-medium text-neutral-500 mb-2">{cat.label} ({catDocs.length})</h5>
                            <div className="grid grid-cols-4 gap-2">
                              {catDocs.map(doc => (
                                <div key={doc.id} className="relative group rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
                                  {doc.file_type.startsWith('image/') ? (
                                    <img src={`/api/files/${doc.file_key}`} alt={doc.file_name} className="w-full aspect-square object-cover cursor-pointer" onClick={() => window.open(`/api/files/${doc.file_key}`, '_blank')} />
                                  ) : (
                                    <div className="w-full aspect-square flex items-center justify-center cursor-pointer" onClick={() => window.open(`/api/files/${doc.file_key}`, '_blank')}>
                                      <FileText className="w-6 h-6 text-neutral-300" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <button onClick={() => toggleServiceDocVisibility(doc)} className={`p-1 rounded ${doc.is_client_visible ? 'bg-green-500' : 'bg-neutral-500'} text-white`} title={doc.is_client_visible ? 'Visível ao cliente' : 'Oculto do cliente'}>
                                      <Eye className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => handleDeleteServiceDoc(doc.id)} className="p-1 rounded bg-red-500 text-white"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                  <div className="p-1.5">
                                    <div className="text-xs text-neutral-600 truncate flex items-center gap-1">
                                      {doc.is_client_visible ? <Eye className="w-3 h-3 text-green-500 flex-shrink-0" /> : null}
                                      {doc.file_name}
                                    </div>
                                    <div className="text-[10px] text-neutral-400">{formatDocTimestamp(doc.created_at)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {serviceDocuments.length === 0 && <div className="text-center py-6 bg-neutral-50 rounded-lg text-xs text-neutral-400">Nenhum documento</div>}
                    </div>
                  )}
                </div>
              )}

              {/* CRONOGRAMA TAB */}
              {projectDetailTab === 'cronograma' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-neutral-800">Cronograma do Projeto</h3>
                      <p className="text-sm text-neutral-500">Gerencie as etapas e tarefas do projeto</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href={`/config/projeto/${selectedProject.id}`}
                        target="_blank"
                        className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm hover:bg-neutral-900 flex items-center gap-2"
                      >
                        <Maximize2 className="w-4 h-4" /> Abrir Tela Cheia
                      </a>
                      <button onClick={() => openTaskModal()} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nova Tarefa
                      </button>
                    </div>
                  </div>
                  
                  {scheduleTasks.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                      <GanttChartSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 mb-2">Nenhuma tarefa cadastrada</p>
                      <p className="text-sm text-neutral-400 mb-4">
                        {panels.length > 0 || services.length > 0 
                          ? 'Gere automaticamente as tarefas a partir dos painéis e serviços existentes'
                          : 'Adicione painéis ou serviços para gerar o cronograma automaticamente'
                        }
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        {(panels.length > 0 || services.length > 0) && (
                          <button 
                            onClick={handleGenerateSchedule} 
                            disabled={generatingSchedule}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 inline-flex items-center gap-2"
                          >
                            {generatingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                            {generatingSchedule ? 'Gerando...' : 'Gerar Cronograma'}
                          </button>
                        )}
                        <button onClick={() => openTaskModal()} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 inline-flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Adicionar Tarefa Manual
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scheduleTasks.sort((a, b) => a.sort_order - b.sort_order).map(task => {
                        const statusConfig = TASK_STATUS_OPTIONS.find(s => s.value === task.status) || TASK_STATUS_OPTIONS[0];
                        const priorityConfig = TASK_PRIORITY_OPTIONS.find(p => p.value === task.notes) || TASK_PRIORITY_OPTIONS[1];
                        const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed';
                        return (
                          <div key={task.id} className={`bg-white border rounded-xl p-4 hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-neutral-200'}`}>
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 pt-1">
                                <button onClick={() => { if (task.status !== 'completed') handleUpdateTaskStatus(task.id, 'completed'); else handleUpdateTaskStatus(task.id, 'pending'); }} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-neutral-300 hover:border-orange-400'}`}>
                                  {task.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={`font-medium ${task.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>{task.name}</h4>
                                  <span className={`px-2 py-0.5 rounded text-xs ${statusConfig.color}`}>{statusConfig.label}</span>
                                  {task.notes && <span className={`px-2 py-0.5 rounded text-xs ${priorityConfig.color}`}>{priorityConfig.label}</span>}
                                </div>
                                {task.description && <p className="text-sm text-neutral-500 mb-2">{task.description}</p>}
                                <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
                                  {task.assigned_to && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {task.assigned_to}</span>}
                                  {task.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Início: {new Date(task.start_date).toLocaleDateString('pt-BR')}</span>}
                                  {task.end_date && <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}><Clock className="w-3 h-3" /> Prazo: {new Date(task.end_date).toLocaleDateString('pt-BR')}</span>}
                                  {task.duration_days && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.duration_days} dias</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => openTaskModal(task)} className="p-2 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PANEL MODAL */}
      {showPanelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="font-semibold text-neutral-800">{editingPanel ? 'Editar Painel' : 'Novo Painel'}</h2>
              <button onClick={() => setShowPanelModal(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handlePanelSubmit} className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">TAG *</label>
                    <input type="text" value={panelForm.tag} onChange={e => setPanelForm({...panelForm, tag: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: CCM-01" required />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Número de Série</label>
                    <input type="text" value={panelForm.serial_number} onChange={e => setPanelForm({...panelForm, serial_number: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: SN-2024-001" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Modelo</label>
                    <input type="text" value={panelForm.modelo} onChange={e => setPanelForm({...panelForm, modelo: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: CCM 400A" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Fabricante</label>
                    <input type="text" value={panelForm.fabricante} onChange={e => setPanelForm({...panelForm, fabricante: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: INNTAG" />
                  </div>
                </div>
                {/* Electrical Specs */}
                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Especificações Elétricas</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Potência</label>
                      <input type="text" value={panelForm.potencia} onChange={e => setPanelForm({...panelForm, potencia: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: 500kVA" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Tensão</label>
                      <input type="text" value={panelForm.tensao} onChange={e => setPanelForm({...panelForm, tensao: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: 440V" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Corrente Nominal</label>
                      <input type="text" value={panelForm.corrente_nominal} onChange={e => setPanelForm({...panelForm, corrente_nominal: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: 630A" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Grau IP</label>
                      <input type="text" value={panelForm.grau_ip} onChange={e => setPanelForm({...panelForm, grau_ip: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: IP54" />
                    </div>
                  </div>
                </div>
                {/* Dates & Warranty */}
                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Datas e Garantia</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Data Fabricação</label>
                      <input type="date" value={panelForm.data_fabricacao} onChange={e => setPanelForm({...panelForm, data_fabricacao: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Data Instalação</label>
                      <input type="date" value={panelForm.data_instalacao} onChange={e => setPanelForm({...panelForm, data_instalacao: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Garantia Até</label>
                      <input type="date" value={panelForm.garantia_ate} onChange={e => setPanelForm({...panelForm, garantia_ate: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
                {/* Other Info */}
                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Outros</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Norma Aplicável</label>
                      <input type="text" value={panelForm.norma} onChange={e => setPanelForm({...panelForm, norma: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: IEC 61439-1" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Localização</label>
                      <input type="text" value={panelForm.localizacao} onChange={e => setPanelForm({...panelForm, localizacao: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: Sala Elétrica 01" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-neutral-600 mb-1">Status</label>
                    <select value={panelForm.status} onChange={e => setPanelForm({...panelForm, status: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Descrição</label>
                  <textarea value={panelForm.description} onChange={e => setPanelForm({...panelForm, description: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" rows={2} placeholder="Descrição do painel..." />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                <button type="button" onClick={() => setShowPanelModal(false)} className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="font-semibold text-neutral-800">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button onClick={() => setShowServiceModal(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleServiceSubmit} className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Número OS *</label>
                    <input type="text" value={serviceForm.os_number} onChange={e => setServiceForm({...serviceForm, os_number: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: 2024-001" required />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Tipo de Serviço</label>
                    <select value={serviceForm.tipo_servico} onChange={e => setServiceForm({...serviceForm, tipo_servico: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                      <option value="">Selecione...</option>
                      <option value="instalacao">Instalação</option>
                      <option value="manutencao_preventiva">Manutenção Preventiva</option>
                      <option value="manutencao_corretiva">Manutenção Corretiva</option>
                      <option value="comissionamento">Comissionamento</option>
                      <option value="retrofit">Retrofit</option>
                      <option value="inspecao">Inspeção</option>
                      <option value="consultoria">Consultoria</option>
                      <option value="treinamento">Treinamento</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Prioridade</label>
                    <select value={serviceForm.prioridade} onChange={e => setServiceForm({...serviceForm, prioridade: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                      <option value="">Normal</option>
                      <option value="baixa">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Descrição</label>
                  <textarea value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" rows={2} placeholder="Descrição do serviço..." />
                </div>
                {/* Dates */}
                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Datas</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Data Início</label>
                      <input type="date" value={serviceForm.start_date} onChange={e => setServiceForm({...serviceForm, start_date: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Data Fim</label>
                      <input type="date" value={serviceForm.end_date} onChange={e => setServiceForm({...serviceForm, end_date: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Próxima Manutenção</label>
                      <input type="date" value={serviceForm.proxima_manutencao} onChange={e => setServiceForm({...serviceForm, proxima_manutencao: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
                {/* Responsible */}
                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Responsável Técnico</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Nome</label>
                      <input type="text" value={serviceForm.responsavel} onChange={e => setServiceForm({...serviceForm, responsavel: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Nome do responsável" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Telefone</label>
                      <input type="text" value={serviceForm.responsavel_telefone} onChange={e => setServiceForm({...serviceForm, responsavel_telefone: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">E-mail</label>
                      <input type="email" value={serviceForm.responsavel_email} onChange={e => setServiceForm({...serviceForm, responsavel_email: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="email@inntag.com.br" />
                    </div>
                  </div>
                </div>
                {/* Location & Equipment */}
                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Local e Equipamento</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Local</label>
                      <input type="text" value={serviceForm.local} onChange={e => setServiceForm({...serviceForm, local: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: Sala Elétrica 02" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Equipamento</label>
                      <input type="text" value={serviceForm.equipamento} onChange={e => setServiceForm({...serviceForm, equipamento: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: CCM-01" />
                    </div>
                  </div>
                </div>
                {/* Costs & Hours */}
                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Custos e Horas</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Valor (R$)</label>
                      <input type="number" step="0.01" value={serviceForm.valor} onChange={e => setServiceForm({...serviceForm, valor: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="0,00" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Horas Trabalhadas</label>
                      <input type="number" step="0.5" value={serviceForm.horas_trabalhadas} onChange={e => setServiceForm({...serviceForm, horas_trabalhadas: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Status</label>
                      <select value={serviceForm.status} onChange={e => setServiceForm({...serviceForm, status: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                        <option value="active">Ativo</option>
                        <option value="in_progress">Em andamento</option>
                        <option value="completed">Concluído</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* Notes */}
                <div className="border-t pt-4">
                  <label className="block text-sm text-neutral-600 mb-1">Observações</label>
                  <textarea value={serviceForm.observacoes} onChange={e => setServiceForm({...serviceForm, observacoes: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" rows={2} placeholder="Observações adicionais..." />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                <button type="button" onClick={() => setShowServiceModal(false)} className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty state when no group selected */}
      {!selectedGroup && (
        <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-center">
          <div className="text-center text-neutral-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <div className="text-sm">Selecione um grupo para ver as unidades</div>
          </div>
        </div>
      )}

      {/* Empty state when group selected but no unit */}
      {selectedGroup && !selectedUnit && (
        <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-center">
          <div className="text-center text-neutral-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <div className="text-sm">Selecione uma unidade para ver detalhes</div>
          </div>
        </div>
      )}

      {/* GROUP MODAL */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-neutral-800">{editingGroup ? 'Editar Grupo' : 'Novo Grupo'}</h2>
              <button onClick={() => setShowGroupModal(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleGroupSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Nome *</label>
                <input type="text" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="Ex: Vale, Petrobras..." className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" required />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Setor *</label>
                <select value={groupForm.sector} onChange={e => setGroupForm({ ...groupForm, sector: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" required>
                  <option value="">Selecione...</option>
                  {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Observações</label>
                <textarea value={groupForm.notes} onChange={e => setGroupForm({ ...groupForm, notes: e.target.value })} rows={2}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowGroupModal(false)} className="px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg">{editingGroup ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNIT MODAL */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold text-neutral-800">{editingUnit ? 'Editar Unidade' : 'Nova Unidade'}</h2>
              <button onClick={() => setShowUnitModal(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (!emailError) handleUnitSubmit(e); }} className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Nome *</label>
                <input type="text" value={unitForm.name} onChange={e => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="Ex: Usina Piracicaba" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">CNPJ</label>
                  <input type="text" value={unitForm.cnpj} onChange={e => setUnitForm({ ...unitForm, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">CEP</label>
                  <input type="text" value={unitForm.postal_code} onChange={e => setUnitForm({ ...unitForm, postal_code: formatCEP(e.target.value) })}
                    placeholder="00000-000" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Endereço</label>
                <input type="text" value={unitForm.address} onChange={e => setUnitForm({ ...unitForm, address: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Estado</label>
                  <select value={unitForm.state} onChange={e => setUnitForm({ ...unitForm, state: e.target.value, city: '' })}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                    <option value="">UF</option>
                    {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div className="col-span-2 relative">
                  <label className="block text-sm text-neutral-600 mb-1">Cidade {loadingCities && <Loader2 className="w-3 h-3 animate-spin inline ml-1" />}</label>
                  <input type="text" value={unitForm.city || citySearch}
                    onChange={e => { setCitySearch(e.target.value); setUnitForm({ ...unitForm, city: '' }); setShowCityDropdown(true); }}
                    onFocus={() => unitForm.state && setShowCityDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                    placeholder={unitForm.state ? "Buscar..." : "Selecione UF"}
                    disabled={!unitForm.state}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 disabled:opacity-50" />
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-40 overflow-auto">
                      {filteredCities.map(city => (
                        <button key={city} type="button" onClick={() => { setUnitForm({ ...unitForm, city }); setCitySearch(''); setShowCityDropdown(false); }}
                          className="w-full text-left px-3 py-1.5 hover:bg-orange-50 text-sm">{city}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="text-sm font-medium text-neutral-700 mb-2">Contato Principal</div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Nome</label>
                    <input type="text" value={unitForm.contact_name} onChange={e => setUnitForm({ ...unitForm, contact_name: e.target.value })}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Email</label>
                      <input type="email" value={unitForm.contact_email}
                        onChange={e => { setUnitForm({ ...unitForm, contact_email: e.target.value }); setEmailError(e.target.value && !isValidEmail(e.target.value) ? 'Email inválido' : ''); }}
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${emailError ? 'border-red-400' : 'border-neutral-200 focus:border-orange-400'}`} />
                      {emailError && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{emailError}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Telefone</label>
                      <input type="tel" value={unitForm.contact_phone} onChange={e => setUnitForm({ ...unitForm, contact_phone: formatPhone(e.target.value) })}
                        placeholder="(00) 00000-0000" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowUnitModal(false)} className="px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={!!emailError} className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50">{editingUnit ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-neutral-800">{editingContact ? 'Editar Pessoa' : 'Nova Pessoa'}</h2>
              <button onClick={() => setShowContactModal(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (!contactEmailError) handleContactSubmit(e); }} className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Nome *</label>
                <input type="text" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" required />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Cargo</label>
                <select value={contactForm.role} onChange={e => setContactForm({ ...contactForm, role: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                  <option value="">Selecione um cargo</option>
                  {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Email</label>
                  <input type="email" value={contactForm.email}
                    onChange={e => { setContactForm({ ...contactForm, email: e.target.value }); setContactEmailError(e.target.value && !isValidEmail(e.target.value) ? 'Email inválido' : ''); }}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${contactEmailError ? 'border-red-400' : 'border-neutral-200 focus:border-orange-400'}`} />
                  {contactEmailError && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{contactEmailError}</p>}
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Telefone</label>
                  <input type="tel" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_primary" checked={contactForm.is_primary === 1}
                  onChange={e => setContactForm({ ...contactForm, is_primary: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400" />
                <label htmlFor="is_primary" className="text-sm text-neutral-600">Contato principal</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowContactModal(false)} className="px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={!!contactEmailError} className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50">{editingContact ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold text-neutral-800">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h2>
              <button onClick={() => setShowProjectModal(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(); }} className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Título *</label>
                <input type="text" value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="Ex: Instalação de CCM - Planta Industrial" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" required />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Descrição</label>
                <textarea value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} rows={3}
                  placeholder="Descreva o escopo do projeto..." className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Número OS</label>
                  <input type="text" value={projectForm.os_number} onChange={e => setProjectForm({ ...projectForm, os_number: e.target.value })}
                    placeholder="Ex: 2024-001" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Ano</label>
                  <input type="number" value={projectForm.project_year} onChange={e => setProjectForm({ ...projectForm, project_year: parseInt(e.target.value) || new Date().getFullYear() })}
                    min="2000" max="2100" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Localização</label>
                  <input type="text" value={projectForm.location} onChange={e => setProjectForm({ ...projectForm, location: e.target.value })}
                    placeholder="Ex: São Paulo, SP" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Responsável</label>
                  <input type="text" value={projectForm.responsible_person} onChange={e => setProjectForm({ ...projectForm, responsible_person: e.target.value })}
                    placeholder="Nome do responsável" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Status</label>
                  <select value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                    <option value="active">Ativo</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="completed">Concluído</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Produto</label>
                  <select value={projectForm.product_id} onChange={e => setProjectForm({ ...projectForm, product_id: e.target.value })}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                    <option value="">Nenhum</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={projectForm.is_public === 1} onChange={e => setProjectForm({ ...projectForm, is_public: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400" />
                  <span className="text-sm text-neutral-600">Público no Portfólio</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={projectForm.is_featured === 1} onChange={e => setProjectForm({ ...projectForm, is_featured: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400" />
                  <span className="text-sm text-neutral-600">Destaque</span>
                </label>
              </div>
              
              {/* Photo Upload Section - Only when editing */}
              {editingProject ? (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-700">Fotos do Projeto</label>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploadingFile} />
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors">
                        {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {uploadingFile ? 'Enviando...' : 'Adicionar foto'}
                      </span>
                    </label>
                  </div>
                  {projectFiles.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {projectFiles.map(file => (
                        <div key={file.id} className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-200">
                          <img src={`/api/files/${file.file_key}`} alt={file.file_name} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => handleDeleteFile(file.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 text-center py-4 bg-neutral-50 rounded-lg">Nenhuma foto adicionada</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-neutral-400 italic pt-2 border-t mt-3">Salve o projeto primeiro para adicionar fotos.</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t mt-3">
                <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg">{editingProject ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-neutral-800">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleTaskFormSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Título *</label>
                <input type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Ex: Montagem do painel principal" required />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Descrição</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" rows={2} placeholder="Detalhes da tarefa..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    {TASK_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Prioridade</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    {TASK_PRIORITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Data Início</label>
                  <input type="date" value={taskForm.start_date} onChange={e => setTaskForm({...taskForm, start_date: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Prazo</label>
                  <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Responsável</label>
                <input type="text" value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Nome do responsável" />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Duração (dias)</label>
                <input type="number" value={taskForm.estimated_hours} onChange={e => setTaskForm({...taskForm, estimated_hours: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="0" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg">{editingTask ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
