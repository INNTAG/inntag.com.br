import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';

interface ContentItem {
  id: number;
  page: string;
  section: string;
  content_key: string;
  content_value: string;
  content_type: string;
}

const PAGES = [
  { id: 'rodape', label: 'Rodapé' },
  { id: 'home', label: 'Página Inicial' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'empresa', label: 'Empresa' },
  { id: 'contato', label: 'Contato' },
];

const DEFAULT_CONTENT: { page: string; section: string; key: string; label: string; type: string; placeholder?: string }[] = [
  // Rodapé (Footer)
  { page: 'rodape', section: 'contato', key: 'email', label: 'E-mail', type: 'text', placeholder: 'contato@inntag.com.br' },
  { page: 'rodape', section: 'contato', key: 'phone', label: 'Telefone', type: 'text', placeholder: '+55 (21) 3500-0000' },
  { page: 'rodape', section: 'contato', key: 'whatsapp', label: 'WhatsApp', type: 'text', placeholder: '+55 (21) 99999-9999' },
  { page: 'rodape', section: 'contato', key: 'address', label: 'Endereço', type: 'text', placeholder: 'Rio de Janeiro, RJ - Brasil' },
  { page: 'rodape', section: 'empresa', key: 'cnpj', label: 'CNPJ', type: 'text', placeholder: 'CNPJ: 00.000.000/0001-00' },
  { page: 'rodape', section: 'social', key: 'linkedin', label: 'LinkedIn URL', type: 'text', placeholder: 'https://linkedin.com/company/inntag' },
  { page: 'rodape', section: 'social', key: 'instagram', label: 'Instagram URL', type: 'text', placeholder: 'https://instagram.com/grupoinntag' },
  { page: 'rodape', section: 'social', key: 'facebook', label: 'Facebook URL', type: 'text', placeholder: 'https://facebook.com/grupoinntag' },
  
  // Home
  { page: 'home', section: 'hero', key: 'title', label: 'Título Principal', type: 'text' },
  { page: 'home', section: 'hero', key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
  { page: 'home', section: 'stats', key: 'anos', label: 'Anos de Experiência', type: 'text' },
  { page: 'home', section: 'stats', key: 'projetos', label: 'Projetos Executados', type: 'text' },
  { page: 'home', section: 'stats', key: 'clientes', label: 'Clientes Atendidos', type: 'text' },
  { page: 'home', section: 'about', key: 'title', label: 'Título Sobre Nós', type: 'text' },
  { page: 'home', section: 'about', key: 'description', label: 'Descrição Sobre Nós', type: 'textarea' },
  // Empresa
  { page: 'empresa', section: 'mission', key: 'title', label: 'Título Missão', type: 'text' },
  { page: 'empresa', section: 'mission', key: 'description', label: 'Descrição Missão', type: 'textarea' },
  { page: 'empresa', section: 'vision', key: 'title', label: 'Título Visão', type: 'text' },
  { page: 'empresa', section: 'vision', key: 'description', label: 'Descrição Visão', type: 'textarea' },
  { page: 'empresa', section: 'values', key: 'title', label: 'Título Valores', type: 'text' },
  { page: 'empresa', section: 'values', key: 'description', label: 'Descrição Valores', type: 'textarea' },
  // Contato
  { page: 'contato', section: 'info', key: 'address', label: 'Endereço', type: 'textarea' },
  { page: 'contato', section: 'info', key: 'phone', label: 'Telefone', type: 'text' },
  { page: 'contato', section: 'info', key: 'email', label: 'Email', type: 'text' },
];

export default function ConfigConteudo() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activePage, setActivePage] = useState('rodape');
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const fetchContent = async () => {
    try {
      const token = sessionStorage.getItem('admin_session');
      const res = await fetch('/api/admin/content', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setContent(Array.isArray(data) ? data : []);
      
      // Initialize local values
      const values: Record<string, string> = {};
      if (Array.isArray(data)) {
        data.forEach((item: ContentItem) => {
          values[`${item.page}-${item.section}-${item.content_key}`] = item.content_value;
        });
      }
      setLocalValues(values);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const getValue = (page: string, section: string, key: string) => {
    const localKey = `${page}-${section}-${key}`;
    if (localValues[localKey] !== undefined) return localValues[localKey];
    
    const item = content.find(
      (c) => c.page === page && c.section === section && c.content_key === key
    );
    return item?.content_value || '';
  };

  const handleChange = (page: string, section: string, key: string, value: string) => {
    setLocalValues({
      ...localValues,
      [`${page}-${section}-${key}`]: value,
    });
  };

  const handleSave = async (page: string, section: string, key: string) => {
    const saveKey = `${page}-${section}-${key}`;
    setSaving(saveKey);

    try {
      const token = sessionStorage.getItem('admin_session');
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          page,
          section,
          content_key: key,
          content_value: localValues[saveKey] || '',
          content_type: 'text',
        }),
      });
      await fetchContent();
    } catch (err) {
      console.error(err);
    }
    setSaving(null);
  };

  const filteredContent = DEFAULT_CONTENT.filter((c) => c.page === activePage);
  const groupedContent: Record<string, typeof DEFAULT_CONTENT> = {};
  filteredContent.forEach((item) => {
    if (!groupedContent[item.section]) {
      groupedContent[item.section] = [];
    }
    groupedContent[item.section].push(item);
  });

  const sectionLabels: Record<string, string> = {
    contato: 'Informações de Contato',
    empresa: 'Dados da Empresa',
    social: 'Redes Sociais',
    hero: 'Hero',
    stats: 'Estatísticas',
    about: 'Sobre',
    mission: 'Missão',
    vision: 'Visão',
    values: 'Valores',
    info: 'Informações',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Conteúdo do Site</h1>
        <p className="text-neutral-600">Edite os textos de todas as páginas</p>
      </div>

      {/* Page tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {PAGES.map((page) => (
          <button
            key={page.id}
            onClick={() => setActivePage(page.id)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              activePage === page.id
                ? 'bg-orange-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedContent).map(([section, items]) => (
            <div key={section} className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">{sectionLabels[section] || section}</h2>
              <div className="space-y-4">
                {items.map((item) => {
                  const saveKey = `${item.page}-${item.section}-${item.key}`;
                  const isSaving = saving === saveKey;
                  
                  return (
                    <div key={saveKey}>
                      <label className="block text-sm text-neutral-600 mb-2">{item.label}</label>
                      <div className="flex gap-3">
                        {item.type === 'textarea' ? (
                          <textarea
                            value={getValue(item.page, item.section, item.key)}
                            onChange={(e) => handleChange(item.page, item.section, item.key, e.target.value)}
                            placeholder={item.placeholder}
                            className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 h-24 resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={getValue(item.page, item.section, item.key)}
                            onChange={(e) => handleChange(item.page, item.section, item.key, e.target.value)}
                            placeholder={item.placeholder}
                            className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500"
                          />
                        )}
                        <button
                          onClick={() => handleSave(item.page, item.section, item.key)}
                          disabled={isSaving}
                          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Save className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(groupedContent).length === 0 && (
            <div className="bg-white rounded-2xl p-12 border border-neutral-200 shadow-sm text-center">
              <p className="text-neutral-500">Nenhum campo configurado para esta página</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
