import { useState, useEffect } from 'react';
import { Plus, Trash2, Image, X, GripVertical, Upload, Save } from 'lucide-react';

interface Machine {
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

interface MachineFeature {
  id: number;
  machine_id: number;
  feature_text: string;
  display_order: number;
}

interface MachineSpec {
  id: number;
  machine_id: number;
  spec_label: string;
  spec_value: string;
  display_order: number;
}

interface MachineBenefit {
  id: number;
  machine_id: number;
  benefit_title: string;
  benefit_description: string | null;
  icon_name: string | null;
  display_order: number;
}

interface FullMachine extends Machine {
  features: MachineFeature[];
  specs: MachineSpec[];
  benefits: MachineBenefit[];
}

export default function ConfigMaquinas() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<FullMachine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/admin/machines', { headers });
      const data = await res.json();
      setMachines(data);
    } catch (err) {
      console.error('Error fetching machines:', err);
    }
    setIsLoading(false);
  };

  const fetchMachineDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/machines/${id}`, { headers });
      const data = await res.json();
      setSelectedMachine(data);
    } catch (err) {
      console.error('Error fetching machine details:', err);
    }
  };

  const handleCreate = () => {
    setFormData({
      slug: '',
      title: '',
      subtitle: '',
      short_description: '',
      full_description: '',
      display_order: machines.length,
      is_active: true,
    });
    setSelectedMachine(null);
    setShowForm(true);
  };

  const handleEdit = (machine: Machine) => {
    setFormData({
      slug: machine.slug,
      title: machine.title,
      subtitle: machine.subtitle || '',
      short_description: machine.short_description || '',
      full_description: machine.full_description || '',
      display_order: machine.display_order,
      is_active: machine.is_active === 1,
    });
    fetchMachineDetails(machine.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = selectedMachine
        ? `/api/admin/machines/${selectedMachine.id}`
        : '/api/admin/machines';
      const method = selectedMachine ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        const machine = await res.json();
        if (!selectedMachine) {
          setSelectedMachine({ ...machine, features: [], specs: [], benefits: [] });
        } else {
          setSelectedMachine({ ...selectedMachine, ...machine });
        }
        fetchMachines();
      }
    } catch (err) {
      console.error('Error saving machine:', err);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      await fetch(`/api/admin/machines/${id}`, { method: 'DELETE', headers });
      fetchMachines();
      if (selectedMachine?.id === id) {
        setSelectedMachine(null);
        setShowForm(false);
      }
    } catch (err) {
      console.error('Error deleting machine:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedMachine || !e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    
    try {
      const res = await fetch(`/api/admin/machines/${selectedMachine.id}/image`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedMachine({ ...selectedMachine, image_key: data.image_key });
        fetchMachines();
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    }
  };

  // Features management
  const [newFeature, setNewFeature] = useState('');
  const handleAddFeature = async () => {
    if (!selectedMachine || !newFeature.trim()) return;
    try {
      const res = await fetch(`/api/admin/machines/${selectedMachine.id}/features`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_text: newFeature, display_order: selectedMachine.features.length }),
      });
      if (res.ok) {
        const feature = await res.json();
        setSelectedMachine({ ...selectedMachine, features: [...selectedMachine.features, feature] });
        setNewFeature('');
      }
    } catch (err) {
      console.error('Error adding feature:', err);
    }
  };

  const handleDeleteFeature = async (featureId: number) => {
    if (!selectedMachine) return;
    try {
      await fetch(`/api/admin/machines/features/${featureId}`, { method: 'DELETE', headers });
      setSelectedMachine({
        ...selectedMachine,
        features: selectedMachine.features.filter(f => f.id !== featureId),
      });
    } catch (err) {
      console.error('Error deleting feature:', err);
    }
  };

  // Specs management
  const [specForm, setSpecForm] = useState({ label: '', value: '' });
  const handleAddSpec = async () => {
    if (!selectedMachine || !specForm.label.trim() || !specForm.value.trim()) return;
    try {
      const res = await fetch(`/api/admin/machines/${selectedMachine.id}/specs`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          spec_label: specForm.label, 
          spec_value: specForm.value, 
          display_order: selectedMachine.specs.length 
        }),
      });
      if (res.ok) {
        const spec = await res.json();
        setSelectedMachine({ ...selectedMachine, specs: [...selectedMachine.specs, spec] });
        setSpecForm({ label: '', value: '' });
      }
    } catch (err) {
      console.error('Error adding spec:', err);
    }
  };

  const handleDeleteSpec = async (specId: number) => {
    if (!selectedMachine) return;
    try {
      await fetch(`/api/admin/machines/specs/${specId}`, { method: 'DELETE', headers });
      setSelectedMachine({
        ...selectedMachine,
        specs: selectedMachine.specs.filter(s => s.id !== specId),
      });
    } catch (err) {
      console.error('Error deleting spec:', err);
    }
  };

  // Benefits management
  const [benefitForm, setBenefitForm] = useState({ title: '', description: '' });
  const handleAddBenefit = async () => {
    if (!selectedMachine || !benefitForm.title.trim()) return;
    try {
      const res = await fetch(`/api/admin/machines/${selectedMachine.id}/benefits`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          benefit_title: benefitForm.title, 
          benefit_description: benefitForm.description,
          display_order: selectedMachine.benefits.length 
        }),
      });
      if (res.ok) {
        const benefit = await res.json();
        setSelectedMachine({ ...selectedMachine, benefits: [...selectedMachine.benefits, benefit] });
        setBenefitForm({ title: '', description: '' });
      }
    } catch (err) {
      console.error('Error adding benefit:', err);
    }
  };

  const handleDeleteBenefit = async (benefitId: number) => {
    if (!selectedMachine) return;
    try {
      await fetch(`/api/admin/machines/benefits/${benefitId}`, { method: 'DELETE', headers });
      setSelectedMachine({
        ...selectedMachine,
        benefits: selectedMachine.benefits.filter(b => b.id !== benefitId),
      });
    } catch (err) {
      console.error('Error deleting benefit:', err);
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
          <h1 className="text-2xl font-bold text-neutral-900">Máquinas</h1>
          <p className="text-neutral-600 mt-1">Gerencie os serviços de máquinas elétricas rotativas</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machines list */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-900">Serviços de Máquinas</h2>
          </div>
          <div className="divide-y divide-neutral-200 max-h-[600px] overflow-auto">
            {machines.length === 0 ? (
              <p className="p-4 text-neutral-500 text-center">Nenhum serviço cadastrado</p>
            ) : (
              machines.map((machine) => (
                <div
                  key={machine.id}
                  className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                    selectedMachine?.id === machine.id ? 'bg-orange-50' : ''
                  }`}
                  onClick={() => handleEdit(machine)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-neutral-400" />
                      <div>
                        <h3 className="font-medium text-neutral-900">{machine.title}</h3>
                        <p className="text-sm text-neutral-500">{machine.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        machine.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-600'
                      }`}>
                        {machine.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(machine.id); }}
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

        {/* Machine form */}
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
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                    placeholder="ex: motores-industriais"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-600 mb-1">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: Motores Industriais"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-600 mb-1">Subtítulo</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: Motores de grande porte"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-600 mb-1">Descrição Curta</label>
                  <textarea
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500 resize-none"
                    placeholder="Breve descrição para a listagem"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-600 mb-1">Descrição Completa</label>
                  <textarea
                    value={formData.full_description}
                    onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500 resize-none"
                    placeholder="Descrição detalhada do serviço"
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
                  <span className="text-sm text-neutral-600">Serviço ativo (visível no site)</span>
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

            {/* Only show additional sections if machine is saved */}
            {selectedMachine && (
              <>
                {/* Image */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                  <h2 className="font-semibold text-neutral-900 mb-4">Imagem</h2>
                  <div className="flex items-start gap-4">
                    {selectedMachine.image_key ? (
                      <img
                        src={`/api/files/${selectedMachine.image_key}`}
                        alt={selectedMachine.title}
                        className="w-40 h-40 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <Image className="w-10 h-10 text-neutral-400" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Upload Imagem
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                  <h2 className="font-semibold text-neutral-900 mb-4">Capacidades / Features</h2>
                  <div className="space-y-2 mb-4">
                    {selectedMachine.features.map((feature) => (
                      <div key={feature.id} className="flex items-center gap-2 bg-neutral-100 rounded-lg px-4 py-2">
                        <span className="flex-1 text-neutral-900">{feature.feature_text}</span>
                        <button
                          onClick={() => handleDeleteFeature(feature.id)}
                          className="text-neutral-400 hover:text-red-500 transition-colors"
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
                      className="flex-1 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                      placeholder="Ex: Motores de média tensão (até 13.8kV)"
                    />
                    <button
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Specs */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                  <h2 className="font-semibold text-neutral-900 mb-4">Especificações</h2>
                  <div className="space-y-2 mb-4">
                    {selectedMachine.specs.map((spec) => (
                      <div key={spec.id} className="flex items-center gap-2 bg-neutral-100 rounded-lg px-4 py-2">
                        <span className="text-orange-500 font-medium">{spec.spec_label}:</span>
                        <span className="flex-1 text-neutral-900">{spec.spec_value}</span>
                        <button
                          onClick={() => handleDeleteSpec(spec.id)}
                          className="text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={specForm.label}
                      onChange={(e) => setSpecForm({ ...specForm, label: e.target.value })}
                      className="w-1/3 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                      placeholder="Label (ex: Potência)"
                    />
                    <input
                      type="text"
                      value={specForm.value}
                      onChange={(e) => setSpecForm({ ...specForm, value: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSpec()}
                      className="flex-1 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                      placeholder="Valor (ex: Até 50.000 HP)"
                    />
                    <button
                      onClick={handleAddSpec}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                  <h2 className="font-semibold text-neutral-900 mb-4">Diferenciais / Benefícios</h2>
                  <div className="space-y-2 mb-4">
                    {selectedMachine.benefits.map((benefit) => (
                      <div key={benefit.id} className="flex items-start gap-2 bg-neutral-100 rounded-lg px-4 py-3">
                        <div className="flex-1">
                          <span className="font-medium text-neutral-900">{benefit.benefit_title}</span>
                          {benefit.benefit_description && (
                            <p className="text-sm text-neutral-600 mt-1">{benefit.benefit_description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteBenefit(benefit.id)}
                          className="text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={benefitForm.title}
                      onChange={(e) => setBenefitForm({ ...benefitForm, title: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                      placeholder="Título do diferencial (ex: Eficiência)"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={benefitForm.description}
                        onChange={(e) => setBenefitForm({ ...benefitForm, description: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddBenefit()}
                        className="flex-1 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500"
                        placeholder="Descrição (ex: Recuperação de até 98% da eficiência original)"
                      />
                      <button
                        onClick={handleAddBenefit}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
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
