import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, Building2, MapPin, FileText, Maximize2, Minimize2, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import GanttChart, { ScheduleTask } from '@/react-app/components/GanttChart';

interface Project {
  id: number;
  title: string;
  description?: string;
  os_number?: string;
  project_year?: number;
  status?: string;
  unit_name?: string;
  group_name?: string;
  group_logo?: string;
  location?: string;
}

interface Panel {
  id: number;
  tag: string;
  modelo?: string;
  status?: string;
}

interface Service {
  id: number;
  os_number: string;
  description?: string;
  status?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'Pendente', color: 'bg-neutral-100 text-neutral-600', icon: Clock },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  delayed: { label: 'Atrasado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function ProjetoFullScreen() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'gantt' | 'lista'>('gantt');

  const getToken = () => sessionStorage.getItem('admin_token') || sessionStorage.getItem('master_token') || '';

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      // Fetch project details
      const projRes = await fetch(`/api/admin/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (projRes.ok) {
        const data = await projRes.json();
        setProject(data);
      }

      // Fetch panels
      const panelsRes = await fetch(`/api/admin/projects/${projectId}/panels`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (panelsRes.ok) {
        const data = await panelsRes.json();
        setPanels(data);
      }

      // Fetch services
      const servicesRes = await fetch(`/api/admin/projects/${projectId}/services`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data);
      }

      // Fetch schedule tasks
      const tasksRes = await fetch(`/api/admin/projects/${projectId}/schedule`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        // Flatten all tasks from the structured response
        const allTasks: ScheduleTask[] = [];
        if (data.projectTasks) allTasks.push(...data.projectTasks);
        if (data.panelTasks) {
          data.panelTasks.forEach((pt: any) => {
            if (pt.tasks) allTasks.push(...pt.tasks);
          });
        }
        if (data.serviceTasks) {
          data.serviceTasks.forEach((st: any) => {
            if (st.tasks) allTasks.push(...st.tasks);
          });
        }
        setTasks(allTasks);
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const delayedTasks = tasks.filter(t => t.status === 'delayed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Projeto não encontrado</p>
          <button onClick={() => navigate('/config/empresas')} className="text-orange-500 hover:underline">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/config/empresas')}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600" />
              </button>
              
              {project.group_logo && (
                <img src={project.group_logo} alt="" className="h-10 w-auto object-contain" />
              )}
              
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-neutral-900">{project.title}</h1>
                  {project.os_number && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-sm font-medium rounded">
                      OS {project.os_number}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                  {project.group_name && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {project.group_name} {project.unit_name && `• ${project.unit_name}`}
                    </span>
                  )}
                  {project.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {project.location}
                    </span>
                  )}
                  {project.project_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {project.project_year}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats */}
              <div className="hidden lg:flex items-center gap-6 mr-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">{panels.length}</div>
                  <div className="text-xs text-neutral-500">Painéis</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">{services.length}</div>
                  <div className="text-xs text-neutral-500">Serviços</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{progressPercent}%</div>
                  <div className="text-xs text-neutral-500">Progresso</div>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center bg-neutral-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('gantt')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'gantt' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Gantt
                </button>
                <button
                  onClick={() => setActiveTab('lista')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'lista' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Lista
                </button>
              </div>

              <button
                onClick={toggleFullScreen}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title={isFullScreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {isFullScreen ? (
                  <Minimize2 className="w-5 h-5 text-neutral-600" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-neutral-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-[1920px] mx-auto px-6 py-3">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-neutral-700">Progresso Geral</span>
                <span className="text-sm text-neutral-500">{completedTasks} de {tasks.length} tarefas</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-neutral-600">{completedTasks} Concluídas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-neutral-600">{inProgressTasks} Em Andamento</span>
              </div>
              {delayedTasks > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-neutral-600">{delayedTasks} Atrasadas</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[1920px] mx-auto p-6">
        {activeTab === 'gantt' ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <GanttChart
              tasks={tasks}
              onAddTask={() => {}}
              onEditTask={() => {}}
              onDeleteTask={() => {}}
              onUpdateProgress={() => {}}
              title={`Cronograma - ${project.title}`}
              readOnly={true}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Task list view */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-neutral-600" />
                  <h2 className="font-semibold text-neutral-900">Lista de Tarefas</h2>
                  <span className="text-sm text-neutral-500">({tasks.length} itens)</span>
                </div>
              </div>
              
              {tasks.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p>Nenhuma tarefa cadastrada para este projeto</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {tasks.sort((a, b) => a.sort_order - b.sort_order).map(task => {
                    const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div key={task.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${statusConfig.color}`}>
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-medium text-neutral-900">{task.name}</h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-neutral-500 mb-2">{task.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-neutral-400">
                              {task.start_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Início: {new Date(task.start_date).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                              {task.end_date && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Prazo: {new Date(task.end_date).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                              {task.assigned_to && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {task.assigned_to}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Progress */}
                          <div className="w-20 text-right">
                            <div className="text-lg font-bold text-neutral-900">{task.progress}%</div>
                            <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-orange-500 transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
