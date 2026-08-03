import { useEffect, useState } from 'react';
import { FolderKanban, Building2, FileText, Users } from 'lucide-react';

interface Stats {
  projects: number;
  clients: number;
  users: number;
}

export default function ConfigDashboard() {
  const [stats, setStats] = useState<Stats>({ projects: 0, clients: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [projectsRes, clientsRes, usersRes] = await Promise.all([
          fetch('/api/admin/projects'),
          fetch('/api/admin/clients'),
          fetch('/api/admin/users'),
        ]);

        const projects = await projectsRes.json();
        const clients = await clientsRes.json();
        const users = await usersRes.json();

        setStats({
          projects: Array.isArray(projects) ? projects.length : 0,
          clients: Array.isArray(clients) ? clients.length : 0,
          users: Array.isArray(users) ? users.length : 0,
        });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Projetos', value: stats.projects, icon: FolderKanban, color: 'bg-blue-500' },
    { label: 'Clientes', value: stats.clients, icon: Building2, color: 'bg-green-500' },
    { label: 'Administradores', value: stats.users, icon: Users, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
        <p className="text-neutral-500">Visão geral do sistema de configuração</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-neutral-500 text-sm">{card.label}</p>
                      <p className="text-3xl font-bold text-neutral-900">{card.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Bem-vindo ao Painel Administrativo</h2>
            <p className="text-neutral-500 mb-4">
              Use o menu lateral para navegar pelas seções de configuração:
            </p>
            <ul className="space-y-3 text-neutral-700">
              <li className="flex items-center gap-3">
                <FolderKanban className="w-5 h-5 text-orange-500" />
                <span><strong>Projetos:</strong> Gerencie projetos com fotos, documentos e informações</span>
              </li>
              <li className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-orange-500" />
                <span><strong>Clientes:</strong> Cadastre e gerencie clientes com logos</span>
              </li>
              <li className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-500" />
                <span><strong>Conteúdo:</strong> Edite todos os textos do site</span>
              </li>
              <li className="flex items-center gap-3">
                <Users className="w-5 h-5 text-orange-500" />
                <span><strong>Usuários:</strong> Gerencie administradores e acesso de clientes</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
