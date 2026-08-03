import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, FileText, Upload, Loader2, Trash2, Calendar, Settings, Shield, Eye } from 'lucide-react';

interface Panel {
  id: number;
  project_id: number;
  tag: string;
  serial_number: string | null;
  description: string | null;
  status: string;
  modelo: string | null;
  fabricante: string | null;
  potencia: string | null;
  tensao: string | null;
  corrente_nominal: string | null;
  grau_ip: string | null;
  data_fabricacao: string | null;
  data_instalacao: string | null;
  garantia_ate: string | null;
  norma: string | null;
  localizacao: string | null;
}

interface Document {
  id: number;
  panel_id: number;
  file_name: string;
  file_key: string;
  file_size: number;
  file_type: string;
  category: string | null;
  is_client_visible: number;
  created_at: string;
}

const DOC_CATEGORIES = [
  { key: 'docs_cliente', label: 'Docs Cliente' },
  { key: 'proposta_tecnica', label: 'Proposta Técnica' },
  { key: 'proposta_comercial', label: 'Proposta Comercial' },
  { key: 'pedido', label: 'Pedido' },
  { key: 'projetos', label: 'Projetos' },
  { key: 'aprovacao', label: 'Aprovação de Projeto' },
  { key: 'cronograma', label: 'Cronograma' },
  { key: 'taf', label: 'TAF' },
  { key: 'nfe', label: 'NFe' },
];

export default function PainelDetail() {
  const { panelId } = useParams();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('docs_cliente');

  useEffect(() => {
    if (panelId) {
      fetchPanel();
      fetchDocuments();
    }
  }, [panelId]);

  const fetchPanel = async () => {
    try {
      const res = await fetch(`/api/admin/panels/${panelId}`);
      if (res.ok) {
        const data = await res.json();
        setPanel(data);
      }
    } catch (error) {
      console.error('Error fetching panel:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/admin/panels/${panelId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !panelId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', selectedCategory);
    formData.append('is_client_visible', '0');

    try {
      const res = await fetch(`/api/admin/panels/${panelId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Excluir documento?')) return;
    try {
      await fetch(`/api/admin/panel-documents/${docId}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const toggleVisibility = async (doc: Document) => {
    try {
      await fetch(`/api/admin/panel-documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_client_visible: doc.is_client_visible ? 0 : 1 }),
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-500">Painel não encontrado</div>
      </div>
    );
  }

  const groupedDocs = DOC_CATEGORIES.map(cat => ({
    ...cat,
    docs: documents.filter(d => d.category === cat.key)
  }));

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/config/empresas" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </Link>
            <div>
              <div className="text-sm text-neutral-500">Painel</div>
              <h1 className="text-xl font-semibold text-neutral-900">{panel.tag}</h1>
            </div>
            <span className={`ml-auto px-3 py-1 text-sm rounded-full ${panel.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
              {panel.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {panel.serial_number && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Número de Série</div>
              <div className="font-semibold text-neutral-900">{panel.serial_number}</div>
            </div>
          )}
          {panel.modelo && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Modelo</div>
              <div className="font-semibold text-neutral-900">{panel.modelo}</div>
            </div>
          )}
          {panel.fabricante && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Fabricante</div>
              <div className="font-semibold text-neutral-900">{panel.fabricante}</div>
            </div>
          )}
        </div>

        {/* Technical Specs */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            Especificações Técnicas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-neutral-500 mb-1">Potência</div>
              <div className="font-medium text-neutral-800">{panel.potencia || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Tensão</div>
              <div className="font-medium text-neutral-800">{panel.tensao || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Corrente Nominal</div>
              <div className="font-medium text-neutral-800">{panel.corrente_nominal || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Grau IP</div>
              <div className="font-medium text-neutral-800">{panel.grau_ip || '-'}</div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Datas
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Fabricação</span>
                <span className="font-medium text-neutral-800">{formatDate(panel.data_fabricacao)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Instalação</span>
                <span className="font-medium text-neutral-800">{formatDate(panel.data_instalacao)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Garantia até</span>
                <span className="font-medium text-neutral-800">{formatDate(panel.garantia_ate)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Conformidade
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Norma</span>
                <span className="font-medium text-neutral-800">{panel.norma || '-'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-neutral-500">Localização</span>
                <span className="font-medium text-neutral-800 text-right">{panel.localizacao || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {panel.description && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Descrição</h2>
            <p className="text-neutral-600">{panel.description}</p>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Documentos
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-neutral-300 rounded-lg px-3 py-2"
              >
                {DOC_CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="text-sm">Upload</span>
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {groupedDocs.filter(g => g.docs.length > 0).length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              Nenhum documento cadastrado
            </div>
          ) : (
            <div className="space-y-6">
              {groupedDocs.filter(g => g.docs.length > 0).map(group => (
                <div key={group.key}>
                  <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-3">{group.label}</h3>
                  <div className="space-y-2">
                    {group.docs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-neutral-400" />
                          <div>
                            <div className="text-sm font-medium text-neutral-800">{doc.file_name}</div>
                            <div className="text-xs text-neutral-400">{formatFileSize(doc.file_size)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleVisibility(doc)}
                            className={`p-1.5 rounded ${doc.is_client_visible ? 'text-green-600 bg-green-50' : 'text-neutral-400 hover:bg-neutral-100'}`}
                            title={doc.is_client_visible ? 'Visível para cliente' : 'Não visível para cliente'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={`/api/files/${doc.file_key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
