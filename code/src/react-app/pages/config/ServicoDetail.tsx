import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, FileText, Eye, Calendar, User, Phone, Mail, MapPin, Clock, DollarSign, AlertTriangle, ChevronRight, Download, Wrench } from 'lucide-react';

interface Service {
  id: number;
  project_id: number;
  os_number?: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  tipo_servico?: string;
  responsavel?: string;
  responsavel_telefone?: string;
  responsavel_email?: string;
  prioridade?: string;
  valor?: number;
  horas_trabalhadas?: number;
  equipamento?: string;
  local?: string;
  observacoes?: string;
  proxima_manutencao?: string;
  created_at: string;
}

interface ServiceDocument {
  id: number;
  service_id: number;
  file_key: string;
  file_name: string;
  file_type: string;
  category: string;
  is_client_visible: number;
  created_at: string;
}

interface Project {
  id: number;
  title: string;
  os_number?: string;
  unit_id?: number;
  unit_name?: string;
  group_name?: string;
  group_logo_key?: string;
}

const DOC_CATEGORIES = [
  { value: 'docs_cliente', label: 'DOCS CLIENTE' },
  { value: 'proposta_tecnica', label: 'PROPOSTA TÉCNICA' },
  { value: 'proposta_comercial', label: 'PROPOSTA COMERCIAL' },
  { value: 'pedido', label: 'PEDIDO' },
  { value: 'projetos', label: 'PROJETOS' },
  { value: 'aprovacao', label: 'APROVAÇÃO DE PROJETO' },
  { value: 'cronograma', label: 'CRONOGRAMA' },
  { value: 'taf', label: 'TAF' },
  { value: 'nfe', label: 'NFE' },
];

const PRIORITY_COLORS: Record<string, string> = {
  baixa: 'bg-green-100 text-green-700',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function ServicoDetail() {
  const { serviceId } = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [documents, setDocuments] = useState<ServiceDocument[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceId) {
      fetchServiceData();
    }
  }, [serviceId]);

  const fetchServiceData = async () => {
    try {
      // Fetch service
      const serviceRes = await fetch(`/api/admin/services/${serviceId}`);
      const serviceData = await serviceRes.json();
      setService(serviceData);

      // Fetch documents
      const docsRes = await fetch(`/api/admin/services/${serviceId}/documents`);
      const docsData = await docsRes.json();
      setDocuments(Array.isArray(docsData) ? docsData : []);

      // Fetch project info
      if (serviceData.project_id) {
        const projRes = await fetch(`/api/admin/projects/${serviceData.project_id}`);
        const projData = await projRes.json();
        setProject(projData);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Serviço não encontrado</p>
          <Link to="/config/empresas" className="text-orange-500 hover:underline">Voltar</Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[service.status] || { label: service.status, color: 'bg-neutral-100 text-neutral-600' };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/config/empresas" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                {project && (
                  <>
                    <Link to={`/config/projeto/${project.id}`} className="hover:text-orange-500">{project.title}</Link>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
                <span>Serviço</span>
              </div>
              <div className="flex items-center gap-3">
                {service.os_number && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 font-mono text-sm rounded-lg">{service.os_number}</span>
                )}
                <h1 className="text-2xl font-bold text-neutral-900">
                  {service.tipo_servico || 'Serviço'}
                </h1>
                <span className={`px-3 py-1 text-sm rounded-full ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                {service.prioridade && (
                  <span className={`px-3 py-1 text-sm rounded-full ${PRIORITY_COLORS[service.prioridade] || 'bg-neutral-100 text-neutral-600'}`}>
                    {service.prioridade.charAt(0).toUpperCase() + service.prioridade.slice(1)}
                  </span>
                )}
              </div>
            </div>
            {project?.group_logo_key && (
              <img src={`/api/files/${project.group_logo_key}`} alt="" className="h-12 object-contain" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">Informações do Serviço</h2>
              
              {service.description && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-neutral-700 mb-2">Descrição</div>
                  <p className="text-neutral-600 whitespace-pre-line bg-neutral-50 p-4 rounded-xl">{service.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {service.equipamento && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                      <Wrench className="w-3.5 h-3.5" />
                      Equipamento
                    </div>
                    <div className="text-sm font-medium text-neutral-800">{service.equipamento}</div>
                  </div>
                )}
                {service.local && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Local
                    </div>
                    <div className="text-sm font-medium text-neutral-800">{service.local}</div>
                  </div>
                )}
                {service.horas_trabalhadas !== undefined && service.horas_trabalhadas !== null && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      Horas Trabalhadas
                    </div>
                    <div className="text-sm font-medium text-neutral-800">{service.horas_trabalhadas}h</div>
                  </div>
                )}
                {service.valor !== undefined && service.valor !== null && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Valor
                    </div>
                    <div className="text-sm font-medium text-neutral-800">{formatCurrency(service.valor)}</div>
                  </div>
                )}
              </div>

              {service.observacoes && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Observações
                  </div>
                  <p className="text-amber-800 text-sm whitespace-pre-line">{service.observacoes}</p>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">Documentos ({documents.length})</h2>
              
              {documents.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum documento cadastrado</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {DOC_CATEGORIES.map(cat => {
                    const catDocs = documents.filter(d => d.category === cat.value);
                    if (catDocs.length === 0) return null;
                    return (
                      <div key={cat.value}>
                        <h3 className="text-sm font-medium text-neutral-600 mb-3 flex items-center gap-2">
                          {cat.label}
                          <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">{catDocs.length}</span>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {catDocs.map(doc => (
                            <a
                              key={doc.id}
                              href={`/api/files/${doc.file_key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative rounded-xl overflow-hidden border border-neutral-200 hover:border-orange-400 transition-colors"
                            >
                              {doc.file_type.startsWith('image/') ? (
                                <img src={`/api/files/${doc.file_key}`} alt={doc.file_name} className="w-full aspect-square object-cover" />
                              ) : (
                                <div className="w-full aspect-square bg-neutral-50 flex items-center justify-center">
                                  <FileText className="w-12 h-12 text-neutral-300" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                <div className="flex items-center gap-1 text-white text-xs">
                                  <Download className="w-3 h-3" />
                                  <span className="truncate">{doc.file_name}</span>
                                </div>
                              </div>
                              {doc.is_client_visible === 1 && (
                                <div className="absolute top-2 right-2 p-1 bg-green-500 rounded-full">
                                  <Eye className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dates Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h3 className="text-sm font-semibold text-neutral-800 mb-4">Datas</h3>
              <div className="space-y-3">
                {service.start_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Início</div>
                      <div className="text-sm font-medium text-neutral-800">{formatDate(service.start_date)}</div>
                    </div>
                  </div>
                )}
                {service.end_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Fim</div>
                      <div className="text-sm font-medium text-neutral-800">{formatDate(service.end_date)}</div>
                    </div>
                  </div>
                )}
                {service.proxima_manutencao && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Próxima Manutenção</div>
                      <div className="text-sm font-medium text-neutral-800">{formatDate(service.proxima_manutencao)}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Cadastrado em</div>
                    <div className="text-sm font-medium text-neutral-800">{formatDate(service.created_at)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Responsible Card */}
            {service.responsavel && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-sm font-semibold text-neutral-800 mb-4">Responsável</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-sm font-medium text-neutral-800">{service.responsavel}</div>
                  </div>
                  {service.responsavel_telefone && (
                    <a href={`tel:${service.responsavel_telefone}`} className="flex items-center gap-3 hover:bg-neutral-50 rounded-lg p-2 -mx-2 transition-colors">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-sm text-neutral-600">{service.responsavel_telefone}</div>
                    </a>
                  )}
                  {service.responsavel_email && (
                    <a href={`mailto:${service.responsavel_email}`} className="flex items-center gap-3 hover:bg-neutral-50 rounded-lg p-2 -mx-2 transition-colors">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="text-sm text-neutral-600 truncate">{service.responsavel_email}</div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Project Card */}
            {project && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-sm font-semibold text-neutral-800 mb-4">Projeto</h3>
                <Link to={`/config/projeto/${project.id}`} className="block p-4 bg-neutral-50 rounded-xl hover:bg-orange-50 transition-colors group">
                  {project.os_number && (
                    <div className="text-xs font-mono text-orange-600 mb-1">{project.os_number}</div>
                  )}
                  <div className="font-medium text-neutral-900 group-hover:text-orange-600 transition-colors">{project.title}</div>
                  {project.group_name && (
                    <div className="text-sm text-neutral-500 mt-1">{project.group_name}</div>
                  )}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
