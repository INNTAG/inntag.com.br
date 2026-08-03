import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { ASSETS } from '@/react-app/data/content';
import { LayoutDashboard, FolderKanban, Building2, FileText, Users, Shield, LogOut, ChevronRight, Package, Cog, Newspaper, Wrench, MapPin, Search, Image, Clock, BookOpen, Instagram, Zap } from 'lucide-react';

const navItems = [
  { path: '/config/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { path: '/config/destaques', label: 'Destaques', icon: Newspaper, permission: 'destaques' },
  { path: '/config/produtos', label: 'Produtos', icon: Package, permission: 'produtos' },
  { path: '/config/maquinas', label: 'Máquinas', icon: Cog, permission: 'maquinas' },
  { path: '/config/servicos', label: 'Serviços', icon: Wrench, permission: 'servicos' },
  { path: '/config/unifilar', label: 'Diagrama Unifilar', icon: Zap, permission: 'conteudo' },
  { path: '/config/landing-pages', label: 'Landing Pages', icon: MapPin, permission: 'conteudo' },
  { path: '/config/seo', label: 'SEO', icon: Search, permission: 'conteudo' },
  { path: '/config/projetos', label: 'Projetos', icon: FolderKanban, permission: 'projetos' },
  { path: '/config/empresas', label: 'Empresas', icon: Building2, permission: 'clientes' },
  { path: '/config/conteudo', label: 'Conteúdo', icon: FileText, permission: 'conteudo' },
  { path: '/config/backgrounds', label: 'Imagens de Fundo', icon: Image, permission: 'conteudo' },
  { path: '/config/timeline', label: 'Timeline', icon: Clock, permission: 'conteudo' },
  { path: '/config/normas', label: 'Normas Técnicas', icon: BookOpen, permission: 'conteudo' },
  { path: '/config/social', label: 'Redes Sociais', icon: Instagram, permission: 'conteudo' },
  { path: '/config/usuarios', label: 'Usuários', icon: Users, permission: 'usuarios' },
  { path: '/config/seguranca', label: 'Segurança', icon: Shield, permission: 'seguranca' },
];

interface AdminUser {
  email: string;
  name: string;
  permissions: string;
}

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('admin_session');
      
      if (!token) {
        navigate('/config');
        return;
      }

      try {
        const res = await fetch('/api/admin/verify', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!res.ok) {
          sessionStorage.removeItem('admin_session');
          navigate('/config');
          return;
        }
        
        const data = await res.json();
        setAdminUser({
          email: data.email,
          name: data.name || 'Administrador',
          permissions: data.permissions || 'all'
        });
      } catch (err) {
        sessionStorage.removeItem('admin_session');
        navigate('/config');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    const token = sessionStorage.getItem('admin_session');
    
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
    } catch (err) {
      // Ignore
    }
    
    sessionStorage.removeItem('admin_session');
    navigate('/config');
  };

  // Check if user is the MASTER (logged in via master password, not admin_users table)
  const isMaster = adminUser?.email === 'master@inntag.com.br' && adminUser?.name === 'Master';

  // Check if user has permission for a specific area
  const hasPermission = (permission: string): boolean => {
    if (!adminUser) return false;
    
    // 'seguranca' is MASTER ONLY - regular admins NEVER have access
    if (permission === 'seguranca') {
      return isMaster;
    }
    
    if (adminUser.permissions === 'all') return true;
    
    const userPermissions = adminUser.permissions.split(',').map(p => p.trim());
    return userPermissions.includes(permission);
  };

  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter(item => hasPermission(item.permission));

  // Check if current page is allowed
  useEffect(() => {
    if (!isLoading && adminUser) {
      const currentItem = navItems.find(item => item.path === location.pathname);
      if (currentItem && !hasPermission(currentItem.permission)) {
        // Redirect to first allowed page
        if (filteredNavItems.length > 0) {
          navigate(filteredNavItems[0].path);
        } else {
          // No permissions at all, logout
          handleLogout();
        }
      }
    }
  }, [location.pathname, adminUser, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <Link to="/" className="block">
            <img src={ASSETS.logo} alt="INNTAG" className="h-8" />
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 text-sm font-medium">
                {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-neutral-900 text-sm font-medium truncate">
                {adminUser?.name || 'Administrador'}
              </p>
              <p className="text-neutral-500 text-xs truncate">
                {adminUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
