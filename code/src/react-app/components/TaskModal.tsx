import { useState, useEffect } from 'react';
import { X, Calendar, Flag } from 'lucide-react';
import { ScheduleTask } from './GanttChart';

interface TaskModalProps {
  task?: ScheduleTask | null;
  onSave: (task: Partial<ScheduleTask>) => void;
  onClose: () => void;
  parentTasks?: ScheduleTask[];
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'delayed', label: 'Atrasado' },
];

const COLOR_OPTIONS = [
  { value: '', label: 'Padrão (por status)' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#6b7280', label: 'Cinza' },
];

export default function TaskModal({ task, onSave, onClose, parentTasks = [] }: TaskModalProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    duration_days: '',
    progress: '0',
    status: 'pending',
    is_milestone: false,
    color: '',
    assigned_to: '',
    notes: '',
    parent_task_id: '',
  });

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name || '',
        description: task.description || '',
        start_date: task.start_date || '',
        end_date: task.end_date || '',
        duration_days: task.duration_days?.toString() || '',
        progress: task.progress?.toString() || '0',
        status: task.status || 'pending',
        is_milestone: task.is_milestone || false,
        color: task.color || '',
        assigned_to: task.assigned_to || '',
        notes: task.notes || '',
        parent_task_id: task.parent_task_id?.toString() || '',
      });
    }
  }, [task]);

  // Auto-calculate end date when start date and duration change
  useEffect(() => {
    if (form.start_date && form.duration_days && !form.end_date) {
      const start = new Date(form.start_date);
      start.setDate(start.getDate() + parseInt(form.duration_days));
      setForm(prev => ({ ...prev, end_date: start.toISOString().split('T')[0] }));
    }
  }, [form.start_date, form.duration_days]);

  // Auto-calculate duration when start and end dates change
  useEffect(() => {
    if (form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        setForm(prev => ({ ...prev, duration_days: days.toString() }));
      }
    }
  }, [form.start_date, form.end_date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      name: form.name,
      description: form.description || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      duration_days: form.duration_days ? parseInt(form.duration_days) : undefined,
      progress: parseInt(form.progress) || 0,
      status: form.status as ScheduleTask['status'],
      is_milestone: form.is_milestone,
      color: form.color || undefined,
      assigned_to: form.assigned_to || undefined,
      notes: form.notes || undefined,
      parent_task_id: form.parent_task_id ? parseInt(form.parent_task_id) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-neutral-600" />
            <h2 className="text-lg font-semibold text-neutral-900">
              {task ? 'Editar Etapa' : 'Nova Etapa'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Nome da Etapa *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Ex: Fabricação de painéis"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={2}
              placeholder="Detalhes da etapa..."
            />
          </div>

          {/* Date row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Data Início
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Data Fim
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Duração (dias)
              </label>
              <input
                type="number"
                min="1"
                value={form.duration_days}
                onChange={e => setForm(prev => ({ ...prev, duration_days: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="7"
              />
            </div>
          </div>

          {/* Status and Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Progresso: {form.progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={form.progress}
                onChange={e => setForm(prev => ({ ...prev, progress: e.target.value }))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
          </div>

          {/* Parent task and Color */}
          <div className="grid grid-cols-2 gap-4">
            {parentTasks.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Etapa Pai (opcional)
                </label>
                <select
                  value={form.parent_task_id}
                  onChange={e => setForm(prev => ({ ...prev, parent_task_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Nenhuma (etapa raiz)</option>
                  {parentTasks.filter(t => t.id !== task?.id).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Cor da Barra
              </label>
              <select
                value={form.color}
                onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {COLOR_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Milestone toggle */}
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <input
              type="checkbox"
              id="is_milestone"
              checked={form.is_milestone}
              onChange={e => setForm(prev => ({ ...prev, is_milestone: e.target.checked }))}
              className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="is_milestone" className="flex items-center gap-2 cursor-pointer">
              <Flag className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-neutral-700">Marcar como Marco de Monitoramento</span>
            </label>
          </div>

          {/* Assigned to */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Responsável
            </label>
            <input
              type="text"
              value={form.assigned_to}
              onChange={e => setForm(prev => ({ ...prev, assigned_to: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Nome do responsável"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Observações
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={2}
              placeholder="Notas adicionais..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              {task ? 'Salvar Alterações' : 'Criar Etapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
