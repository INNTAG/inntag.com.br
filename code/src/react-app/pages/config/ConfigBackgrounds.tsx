import { useState, useEffect, useRef } from 'react';
import { Image, Upload, Loader2, Check, RefreshCw } from 'lucide-react';
import ConfigLayout from './ConfigLayout';

interface Background {
  id: number;
  page_key: string;
  section_key: string;
  label: string;
  image_url: string | null;
  fallback_url: string;
  is_active: number;
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  produtos: 'Produtos',
  servicos: 'Serviços',
  maquinas: 'Máquinas',
  clientes: 'Clientes',
  portfolio: 'Portfolio',
  contato: 'Contato',
  destaques: 'Destaques',
};

export default function ConfigBackgrounds() {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [success, setSuccess] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchBackgrounds = async () => {
    try {
      const token = sessionStorage.getItem('admin_session');
      const res = await fetch('/api/admin/backgrounds', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBackgrounds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch backgrounds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const handleFileSelect = async (bg: Background, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    setUploading(bg.id);
    try {
      const token = sessionStorage.getItem('admin_session');
      
      // Upload to R2
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'backgrounds');
      
      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();
      
      // Update background
      await fetch(`/api/admin/backgrounds/${bg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_url: url }),
      });
      
      setBackgrounds(prev => prev.map(b => 
        b.id === bg.id ? { ...b, image_url: url } : b
      ));
      
      setSuccess(bg.id);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(null);
    }
  };

  const handleReset = async (bg: Background) => {
    try {
      const token = sessionStorage.getItem('admin_session');
      await fetch(`/api/admin/backgrounds/${bg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_url: null }),
      });
      
      setBackgrounds(prev => prev.map(b => 
        b.id === bg.id ? { ...b, image_url: null } : b
      ));
    } catch (err) {
      console.error('Error resetting:', err);
    }
  };

  // Group by page
  const groupedBackgrounds = backgrounds.reduce((acc, bg) => {
    if (!acc[bg.page_key]) acc[bg.page_key] = [];
    acc[bg.page_key].push(bg);
    return acc;
  }, {} as Record<string, Background[]>);

  if (loading) {
    return (
      <ConfigLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </ConfigLayout>
    );
  }

  return (
    <ConfigLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Imagens de Fundo</h1>
            <p className="text-neutral-500 mt-1">
              Gerencie as imagens de fundo de cada página do site
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-sm">
            <strong>Como funciona:</strong> Cada página possui uma imagem de fundo padrão (fallback). 
            Você pode sobrepor essa imagem fazendo upload de uma nova. Para voltar ao padrão, 
            clique no botão de resetar.
          </p>
        </div>

        {/* Background Cards by Page */}
        <div className="space-y-8">
          {Object.entries(groupedBackgrounds).map(([pageKey, bgs]) => (
            <div key={pageKey}>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 border-b border-neutral-200 pb-2">
                {PAGE_LABELS[pageKey] || pageKey}
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bgs.map((bg) => {
                  const currentImage = bg.image_url || bg.fallback_url;
                  const isCustom = !!bg.image_url;
                  const isUploading = uploading === bg.id;
                  const isSuccess = success === bg.id;
                  
                  return (
                    <div 
                      key={bg.id} 
                      className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
                    >
                      {/* Preview */}
                      <div className="relative aspect-video bg-neutral-100">
                        <img 
                          src={currentImage} 
                          alt={bg.label}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Overlay badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isCustom 
                              ? 'bg-green-500 text-white' 
                              : 'bg-neutral-800/70 text-white'
                          }`}>
                            {isCustom ? 'Personalizada' : 'Padrão'}
                          </span>
                        </div>

                        {/* Upload overlay */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                              <span className="text-sm font-medium">Enviando...</span>
                            </div>
                          </div>
                        )}

                        {/* Success overlay */}
                        {isSuccess && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <div className="bg-green-500 text-white rounded-full p-3">
                              <Check className="w-6 h-6" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info & Actions */}
                      <div className="p-4">
                        <h3 className="font-medium text-neutral-900">{bg.label}</h3>
                        <p className="text-xs text-neutral-500 mt-1">
                          {bg.page_key} / {bg.section_key}
                        </p>

                        <div className="flex gap-2 mt-4">
                          {/* Upload button */}
                          <input
                            ref={(el) => { fileInputRefs.current[bg.id] = el; }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(bg, file);
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRefs.current[bg.id]?.click()}
                            disabled={isUploading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4" />
                            <span className="text-sm font-medium">Trocar Imagem</span>
                          </button>

                          {/* Reset button (only if custom) */}
                          {isCustom && (
                            <button
                              onClick={() => handleReset(bg)}
                              className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
                              title="Voltar ao padrão"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {backgrounds.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma imagem de fundo cadastrada</p>
          </div>
        )}
      </div>
    </ConfigLayout>
  );
}
