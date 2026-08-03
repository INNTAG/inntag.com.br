import { useState, useMemo } from 'react';
import { Plus, GripVertical, ChevronRight, ChevronDown, Flag, Edit2, Trash2, Calendar } from 'lucide-react';

export interface ScheduleTask {
  id: number;
  project_id?: number;
  panel_id?: number;
  service_id?: number;
  parent_task_id?: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  is_milestone: boolean;
  sort_order: number;
  color?: string;
  assigned_to?: string;
  notes?: string;
  level?: string;
}

interface GanttChartProps {
  tasks: ScheduleTask[];
  onAddTask: () => void;
  onEditTask: (task: ScheduleTask) => void;
  onDeleteTask: (taskId: number) => void;
  onUpdateProgress: (taskId: number, progress: number) => void;
  title?: string;
  readOnly?: boolean;
}

const STATUS_COLORS = {
  pending: 'bg-neutral-300',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  delayed: 'bg-red-500',
};

const STATUS_LABELS = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  delayed: 'Atrasado',
};

export default function GanttChart({ 
  tasks, 
  onAddTask, 
  onEditTask, 
  onDeleteTask,
  onUpdateProgress: _onUpdateProgress,
  title = 'Cronograma',
  readOnly = false 
}: GanttChartProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  // Calculate date range for the Gantt chart
  const { minDate, maxDate: _maxDate, totalDays, months } = useMemo(() => {
    const dates = tasks
      .filter(t => t.start_date || t.end_date)
      .flatMap(t => [t.start_date, t.end_date].filter(Boolean) as string[])
      .map(d => new Date(d));
    
    if (dates.length === 0) {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 2);
      return { 
        minDate: today, 
        maxDate: nextMonth, 
        totalDays: 60,
        months: generateMonths(today, nextMonth)
      };
    }
    
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 14);
    
    const days = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
    
    return { 
      minDate: min, 
      maxDate: max, 
      totalDays: Math.max(days, 30),
      months: generateMonths(min, max)
    };
  }, [tasks]);

  function generateMonths(start: Date, end: Date) {
    const months: { name: string; days: number; startOffset: number }[] = [];
    const current = new Date(start);
    current.setDate(1);
    
    while (current <= end) {
      const monthStart = new Date(current);
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      const startOffset = Math.max(0, Math.ceil((monthStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      
      months.push({
        name: current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        days: daysInMonth,
        startOffset
      });
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }

  function getTaskPosition(task: ScheduleTask) {
    if (!task.start_date) return { left: 0, width: 0 };
    
    const start = new Date(task.start_date);
    const end = task.end_date ? new Date(task.end_date) : new Date(start);
    if (!task.end_date) end.setDate(end.getDate() + (task.duration_days || 1));
    
    const startOffset = Math.max(0, (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100
    };
  }

  function toggleExpand(taskId: number) {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  }

  // Build tree structure
  const rootTasks = tasks.filter(t => !t.parent_task_id);
  const childTasksMap = tasks.reduce((acc, t) => {
    if (t.parent_task_id) {
      if (!acc[t.parent_task_id]) acc[t.parent_task_id] = [];
      acc[t.parent_task_id].push(t);
    }
    return acc;
  }, {} as Record<number, ScheduleTask[]>);

  function renderTask(task: ScheduleTask, depth = 0) {
    const children = childTasksMap[task.id] || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const position = getTaskPosition(task);

    return (
      <div key={task.id}>
        <div className="flex border-b border-neutral-100 hover:bg-neutral-50 group">
          {/* Task info - left side */}
          <div className="w-80 flex-shrink-0 flex items-center py-2 px-3 border-r border-neutral-200">
            <div style={{ paddingLeft: depth * 20 }} className="flex items-center gap-2 flex-1 min-w-0">
              {!readOnly && (
                <GripVertical className="w-4 h-4 text-neutral-300 cursor-grab opacity-0 group-hover:opacity-100" />
              )}
              
              {hasChildren ? (
                <button onClick={() => toggleExpand(task.id)} className="p-0.5">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
              ) : (
                <div className="w-5" />
              )}
              
              {task.is_milestone ? (
                <Flag className="w-4 h-4 text-orange-500 flex-shrink-0" />
              ) : (
                <div 
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${STATUS_COLORS[task.status]}`}
                  style={task.color ? { backgroundColor: task.color } : undefined}
                />
              )}
              
              <span className="text-sm font-medium truncate">{task.name}</span>
            </div>
            
            {!readOnly && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button 
                  onClick={() => onEditTask(task)}
                  className="p-1 hover:bg-neutral-200 rounded"
                >
                  <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                </button>
                <button 
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            )}
          </div>
          
          {/* Gantt bar - right side */}
          <div className="flex-1 relative py-2 min-h-[40px]">
            {task.start_date && position.width > 0 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer transition-all hover:brightness-110"
                style={{
                  left: `${position.left}%`,
                  width: `${Math.max(position.width, 1)}%`,
                  backgroundColor: task.is_milestone 
                    ? '#f97316' 
                    : task.color || (task.status === 'completed' ? '#22c55e' : task.status === 'delayed' ? '#ef4444' : '#3b82f6'),
                }}
                onClick={() => !readOnly && onEditTask(task)}
              >
                {/* Progress fill */}
                {!task.is_milestone && task.progress > 0 && (
                  <div 
                    className="absolute inset-y-0 left-0 bg-black/20 rounded-l"
                    style={{ width: `${task.progress}%` }}
                  />
                )}
                
                {/* Task name on bar */}
                {position.width > 5 && (
                  <span className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium truncate">
                    {task.name}
                  </span>
                )}
              </div>
            )}
            
            {/* Milestone diamond */}
            {task.is_milestone && task.start_date && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rotate-45"
                style={{ left: `${position.left}%` }}
              />
            )}
          </div>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && children.map(child => renderTask(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-neutral-600" />
          <h3 className="font-semibold text-neutral-900">{title}</h3>
          <span className="text-sm text-neutral-500">({tasks.length} {tasks.length === 1 ? 'item' : 'itens'})</span>
        </div>
        
        {!readOnly && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Etapa
          </button>
        )}
      </div>
      
      {/* Timeline header */}
      <div className="flex border-b border-neutral-200">
        <div className="w-80 flex-shrink-0 px-3 py-2 border-r border-neutral-200 bg-neutral-50">
          <span className="text-xs font-semibold text-neutral-600 uppercase">Etapas</span>
        </div>
        <div className="flex-1 flex bg-neutral-50 overflow-hidden">
          {months.map((month, i) => (
            <div 
              key={i} 
              className="text-center text-xs font-medium text-neutral-600 py-2 border-r border-neutral-100"
              style={{ flex: month.days }}
            >
              {month.name}
            </div>
          ))}
        </div>
      </div>
      
      {/* Tasks */}
      <div className="max-h-[500px] overflow-y-auto">
        {rootTasks.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
            <p className="text-sm">Nenhuma etapa cadastrada</p>
            {!readOnly && (
              <button
                onClick={onAddTask}
                className="mt-3 text-sm text-red-600 hover:underline"
              >
                Adicionar primeira etapa
              </button>
            )}
          </div>
        ) : (
          rootTasks.map(task => renderTask(task))
        )}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-6 px-4 py-2 border-t border-neutral-200 bg-neutral-50">
        <span className="text-xs font-medium text-neutral-500">Legenda:</span>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[key as keyof typeof STATUS_COLORS]}`} />
            <span className="text-xs text-neutral-600">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Flag className="w-3 h-3 text-orange-500" />
          <span className="text-xs text-neutral-600">Marco</span>
        </div>
      </div>
    </div>
  );
}
