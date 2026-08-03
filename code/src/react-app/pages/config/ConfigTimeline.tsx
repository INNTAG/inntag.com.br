import { useState, useEffect, useRef } from 'react';
import { Plus, Save, Trash2, Upload, Image, Calendar, X, GripVertical, Eye, EyeOff, Loader2 } from 'lucide-react';

interface TimelineEvent {
  id: number;
  year: number;
  title: string;
  description: string;
  highlight?: string;
  background_image?: string;
  stat1_value?: string;
  stat1_label?: string;
  stat2_value?: string;
  stat2_label?: string;
  sort_order: number;
  is_published: number;
}

interface TimelinePhoto {
  id: number;
  event_id: number;
  file_key: string;
  caption?: string;
  sort_order: number;
}

export default function ConfigTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [photos, setPhotos] = useState<TimelinePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const bgInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    title: '',
    description: '',
    highlight: '',
    stat1_value: '',
    stat1_label: '',
    stat2_value: '',
    stat2_label: '',
    is_published: 1,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setForm({
        year: selectedEvent.year,
        title: selectedEvent.title,
        description: selectedEvent.description || '',
        highlight: selectedEvent.highlight || '',
        stat1_value: selectedEvent.stat1_value || '',
        stat1_label: selectedEvent.stat1_label || '',
        stat2_value: selectedEvent.stat2_value || '',
        stat2_label: selectedEvent.stat2_label || '',
        is_published: selectedEvent.is_published,
      });
      fetchPhotos(selectedEvent.id);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/timeline');
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchPhotos = async (eventId: number) => {
    try {
      const res = await fetch(`/api/admin/timeline/${eventId}/photos`);
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPhotos([]);
    }
  };

  const handleCreate = async () => {
    const newEvent = {
      year: new Date().getFullYear(),
      title: 'Novo Marco',
      description: 'Descrição do evento...',
      sort_order: events.length + 1,
      is_published: 0,
    };

    try {
      const res = await fetch('/api/admin/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (data.id) {
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!selectedEvent) return;
    setSaving(true);

    try {
      await fetch(`/api/admin/timeline/${selectedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sort_order: selectedEvent.sort_order,
          background_image: selectedEvent.background_image,
        }),
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este evento da timeline?')) return;

    try {
      await fetch(`/api/admin/timeline/${id}`, { method: 'DELETE' });
      if (selectedEvent?.id === id) {
        setSelectedEvent(null);
        setPhotos([]);
      }
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEvent || !e.target.files?.[0]) return;
    setUploadingBg(true);

    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await fetch(`/api/admin/timeline/${selectedEvent.id}/background`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setSelectedEvent({ ...selectedEvent, background_image: data.url });
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
    setUploadingBg(false);
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEvent || !e.target.files?.[0]) return;
    setUploadingPhoto(true);

    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await fetch(`/api/admin/timeline/${selectedEvent.id}/photos`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchPhotos(selectedEvent.id);
      }
    } catch (err) {
      console.error(err);
    }
    setUploadingPhoto(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Excluir esta foto?')) return;

    try {
      await fetch(`/api/admin/timeline/photos/${photoId}`, { method: 'DELETE' });
      if (selectedEvent) {
        fetchPhotos(selectedEvent.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Timeline</h1>
        <p className="text-neutral-500">Gerencie a história da INNTAG no Portfólio</p>
      </div>
    
    <div className="flex h-[calc(100vh-220px)] gap-6">
        {/* Events List */}
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">Eventos</h3>
            <button
              onClick={handleCreate}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                Nenhum evento cadastrado
              </div>
            ) : (
              <div className="space-y-1">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full p-3 rounded-xl text-left transition-colors flex items-center gap-3 ${
                      selectedEvent?.id === event.id
                        ? 'bg-red-50 border border-red-200'
                        : 'hover:bg-neutral-50 border border-transparent'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-neutral-300" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-red-500">{event.year}</span>
                        {!event.is_published && (
                          <EyeOff className="w-3 h-3 text-neutral-400" />
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 truncate">{event.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Editor */}
        <div className="flex-1 bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col">
          {!selectedEvent ? (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecione um evento para editar</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-red-500">{form.year}</span>
                  <span className="text-neutral-400">•</span>
                  <span className="font-medium text-neutral-700">{form.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(selectedEvent.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Ano</label>
                      <input
                        type="number"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Destaque (badge)</label>
                      <input
                        type="text"
                        value={form.highlight}
                        onChange={(e) => setForm({ ...form, highlight: e.target.value })}
                        placeholder="Ex: Fundação, Certificação, 10 Anos..."
                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Título</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Descrição</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                    />
                  </div>

                  {/* Stats */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">Estatísticas</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-neutral-50 rounded-xl">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={form.stat1_value}
                            onChange={(e) => setForm({ ...form, stat1_value: e.target.value })}
                            placeholder="Valor (ex: 100+)"
                            className="px-3 py-2 border border-neutral-200 rounded-lg text-center text-xl font-bold"
                          />
                          <input
                            type="text"
                            value={form.stat1_label}
                            onChange={(e) => setForm({ ...form, stat1_label: e.target.value })}
                            placeholder="Label (ex: Projetos)"
                            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-neutral-50 rounded-xl">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={form.stat2_value}
                            onChange={(e) => setForm({ ...form, stat2_value: e.target.value })}
                            placeholder="Valor (ex: 100%)"
                            className="px-3 py-2 border border-neutral-200 rounded-lg text-center text-xl font-bold"
                          />
                          <input
                            type="text"
                            value={form.stat2_label}
                            onChange={(e) => setForm({ ...form, stat2_label: e.target.value })}
                            placeholder="Label (ex: Entregas)"
                            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setForm({ ...form, is_published: form.is_published ? 0 : 1 })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        form.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {form.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {form.is_published ? 'Publicado' : 'Oculto'}
                    </button>
                  </div>

                  {/* Background Image */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">Imagem de Fundo</label>
                    <div className="relative aspect-video bg-neutral-100 rounded-xl overflow-hidden border-2 border-dashed border-neutral-300">
                      {selectedEvent.background_image ? (
                        <img
                          src={selectedEvent.background_image}
                          alt="Background"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                          <Image className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => bgInputRef.current?.click()}
                          disabled={uploadingBg}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 rounded-lg font-medium"
                        >
                          {uploadingBg ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {selectedEvent.background_image ? 'Trocar Imagem' : 'Enviar Imagem'}
                        </button>
                      </div>
                    </div>
                    <input
                      ref={bgInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadBackground}
                      className="hidden"
                    />
                  </div>

                  {/* Photo Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-neutral-700">Galeria de Fotos</label>
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-sm hover:bg-neutral-200 transition-colors"
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Adicionar Foto
                      </button>
                    </div>

                    {photos.length === 0 ? (
                      <div className="p-8 bg-neutral-50 rounded-xl text-center text-neutral-500 text-sm border-2 border-dashed border-neutral-200">
                        Nenhuma foto na galeria deste evento
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {photos.map((photo) => (
                          <div key={photo.id} className="group relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                            <img
                              src={photo.file_key}
                              alt={photo.caption || 'Foto'}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPhoto}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
