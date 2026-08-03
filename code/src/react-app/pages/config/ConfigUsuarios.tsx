import { useEffect, useState } from 'react';
import { Plus, Trash2, X, UserCheck, Building2, Key, Eye, EyeOff, Pencil, Shield, Check } from 'lucide-react';

interface AdminUser {
  id: number;
  user_id: string;
  email: string;
  name?: string;
  role: string;
  permissions?: string;
  has_password?: boolean;
  saved_password?: string;
  is_active: number;
}

interface ClientUser {
  id: number;
  username: string;
  email?: string;
  name?: string;
  client_id: number;
  client_name: string;
  is_active: number;
}

interface Client {
  id: number;
  name: string;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', description: 'Visualizar painel inicial' },
  { key: 'projetos', label: 'Projetos', description: 'Gerenciar projetos' },
  { key: 'clientes', label: 'Clientes', description: 'Gerenciar clientes' },
  { key: 'produtos', label: 'Produtos', description: 'Gerenciar produtos' },
  { key: 'maquinas', label: 'Máquinas', description: 'Gerenciar máquinas' },
  { key: 'servicos', label: 'Serviços', description: 'Gerenciar serviços' },
  { key: 'destaques', label: 'Destaques', description: 'Gerenciar artigos e notícias' },
  { key: 'conteudo', label: 'Conteúdo', description: 'Editar conteúdo do site' },
  { key: 'usuarios', label: 'Usuários', description: 'Gerenciar usuários' },
  { key: 'seguranca', label: 'Segurança', description: 'Alterar senha master' },
];

export default function ConfigUsuarios() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedClientUser, setSelectedClientUser] = useState<ClientUser | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [adminForm, setAdminForm] = useState({ 
    email: '', 
    name: '', 
    role: 'Administrador',
    password: '',
    permissions: 'all' as string
  });
  const [clientForm, setClientForm] = useState({ username: '', password: '', email: '', name: '', client_id: '' });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [clientError, setClientError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async () => {
    try {
      const [adminsRes, clientUsersRes, clientsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/client-users'),
        fetch('/api/admin/clients'),
      ]);

      const admins = await adminsRes.json();
      const cUsers = await clientUsersRes.json();
      const cls = await clientsRes.json();

      setAdminUsers(Array.isArray(admins) ? admins : []);
      setClientUsers(Array.isArray(cUsers) ? cUsers : []);
      setClients(Array.isArray(cls) ? cls : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parsePermissions = (perms: string | undefined): string[] => {
    if (!perms || perms === 'all') return AVAILABLE_PERMISSIONS.map(p => p.key);
    return perms.split(',').filter(Boolean);
  };

  const openEditAdmin = (user: AdminUser) => {
    setEditingAdmin(user);
    setAdminForm({
      email: user.email,
      name: user.name || '',
      role: user.role || 'Administrador',
      password: '',
      permissions: user.permissions || 'all'
    });
    setShowAdminModal(true);
    setError('');
  };

  const openNewAdmin = () => {
    setEditingAdmin(null);
    setAdminForm({ 
      email: '', 
      name: '', 
      role: 'Administrador',
      password: '',
      permissions: 'all'
    });
    setShowAdminModal(true);
    setError('');
  };

  const togglePermission = (key: string) => {
    const currentPerms = parsePermissions(adminForm.permissions);
    
    if (adminForm.permissions === 'all') {
      // Se está em "all", remover essa permissão específica
      const newPerms = AVAILABLE_PERMISSIONS.map(p => p.key).filter(k => k !== key);
      setAdminForm({ ...adminForm, permissions: newPerms.join(',') });
    } else if (currentPerms.includes(key)) {
      // Remover permissão
      const newPerms = currentPerms.filter(p => p !== key);
      setAdminForm({ ...adminForm, permissions: newPerms.join(',') || '' });
    } else {
      // Adicionar permissão
      const newPerms = [...currentPerms, key];
      // Se todas estão selecionadas, usar "all"
      if (newPerms.length === AVAILABLE_PERMISSIONS.length) {
        setAdminForm({ ...adminForm, permissions: 'all' });
      } else {
        setAdminForm({ ...adminForm, permissions: newPerms.join(',') });
      }
    }
  };

  const selectAllPermissions = () => {
    setAdminForm({ ...adminForm, permissions: 'all' });
  };

  const clearAllPermissions = () => {
    setAdminForm({ ...adminForm, permissions: '' });
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!adminForm.email.endsWith('@inntag.com.br')) {
      setError('Email deve ser @inntag.com.br');
      return;
    }

    if (!editingAdmin && !adminForm.password) {
      setError('Senha é obrigatória para novo administrador');
      return;
    }

    try {
      const url = editingAdmin 
        ? `/api/admin/users/${editingAdmin.id}` 
        : '/api/admin/users';
      
      const method = editingAdmin ? 'PUT' : 'POST';

      const payload: any = {
        email: adminForm.email,
        name: adminForm.name,
        role: adminForm.role,
        permissions: adminForm.permissions || 'all',
      };
      
      // Only include password if it was entered
      if (adminForm.password && adminForm.password.trim().length > 0) {
        payload.password = adminForm.password.trim();
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Erro ao salvar');
        return;
      }

      // Show success message
      if (data.password_updated) {
        setSuccessMessage('✓ Senha salva com sucesso!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else if (editingAdmin) {
        setSuccessMessage('✓ Administrador atualizado!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setSuccessMessage('✓ Administrador criado!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }

      setShowAdminModal(false);
      setEditingAdmin(null);
      setAdminForm({ email: '', name: '', role: 'Administrador', password: '', permissions: 'all' });
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar administrador');
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    if (!confirm('Deseja remover este administrador?')) return;

    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddClientUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');

    if (!clientForm.username || !clientForm.password) {
      setClientError('Usuário e senha são obrigatórios');
      return;
    }

    if (clientForm.password.length < 4) {
      setClientError('Senha deve ter pelo menos 4 caracteres');
      return;
    }

    try {
      const res = await fetch('/api/admin/client-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: clientForm.username,
          password: clientForm.password,
          email: clientForm.email,
          name: clientForm.name,
          client_id: parseInt(clientForm.client_id),
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setClientError(data.error || 'Erro ao cadastrar');
        return;
      }
      
      setShowClientModal(false);
      setClientForm({ username: '', password: '', email: '', name: '', client_id: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      setClientError('Erro ao cadastrar usuário');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientUser || !newPassword) return;

    try {
      const res = await fetch(`/api/admin/client-users/${selectedClientUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      
      if (res.ok) {
        setShowPasswordModal(false);
        setSelectedClientUser(null);
        setNewPassword('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openPasswordModal = (user: ClientUser) => {
    setSelectedClientUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleDeleteClientUser = async (id: number) => {
    if (!confirm('Deseja remover este acesso?')) return;

    try {
      await fetch(`/api/admin/client-users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getPermissionLabel = (perms: string | undefined): string => {
    if (!perms || perms === 'all') return 'Acesso total';
    const permList = perms.split(',').filter(Boolean);
    if (permList.length === 0) return 'Sem permissões';
    if (permList.length <= 3) {
      return permList.map(p => AVAILABLE_PERMISSIONS.find(ap => ap.key === p)?.label || p).join(', ');
    }
    return `${permList.length} permissões`;
  };

  const currentPermissions = parsePermissions(adminForm.permissions);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Usuários</h1>
        <p className="text-neutral-600">Gerencie administradores e acessos de clientes</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 font-medium flex items-center gap-2">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Admin Users */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Administradores</h2>
                  <p className="text-sm text-neutral-500">Usuários com acesso ao painel</p>
                </div>
              </div>
              <button
                onClick={openNewAdmin}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo Administrador
              </button>
            </div>

            {adminUsers.length === 0 ? (
              <p className="text-neutral-500">Nenhum administrador cadastrado</p>
            ) : (
              <div className="space-y-3">
                {adminUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200"
                  >
                    <div>
                      <p className="text-neutral-900 font-medium">{user.name || 'Sem nome'}</p>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-neutral-400" />
                          <span className="text-xs text-neutral-400">{getPermissionLabel(user.permissions)}</span>
                        </div>
                        {user.has_password ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            Senha configurada
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                            <X className="w-3 h-3" />
                            Sem senha
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm">
                        {user.role}
                      </span>
                      <button
                        onClick={() => openEditAdmin(user)}
                        className="p-2 rounded-lg hover:bg-purple-100 text-neutral-400 hover:text-purple-600 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(user.id)}
                        className="p-2 rounded-lg hover:bg-red-100 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Users */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Acesso de Clientes</h2>
                  <p className="text-sm text-neutral-500">Usuários externos vinculados a clientes</p>
                </div>
              </div>
              <button
                onClick={() => setShowClientModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo Acesso
              </button>
            </div>

            {clientUsers.length === 0 ? (
              <p className="text-neutral-500">Nenhum acesso de cliente cadastrado</p>
            ) : (
              <div className="space-y-3">
                {clientUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200"
                  >
                    <div>
                      <p className="text-neutral-900 font-medium">{user.name || user.username}</p>
                      <p className="text-sm text-neutral-500">Usuário: <span className="font-mono text-orange-600">{user.username}</span></p>
                      {user.email && <p className="text-xs text-neutral-400">{user.email}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
                        {user.client_name}
                      </span>
                      <button
                        onClick={() => openPasswordModal(user)}
                        className="p-2 rounded-lg hover:bg-orange-100 text-neutral-400 hover:text-orange-600 transition-colors"
                        title="Alterar senha"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClientUser(user.id)}
                        className="p-2 rounded-lg hover:bg-red-100 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-neutral-500 mt-4">
              * Clientes acessam o portal em <span className="font-mono text-orange-600">/portal</span> usando usuário e senha
            </p>
          </div>
        </div>
      )}

      {/* Add/Edit Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-neutral-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">
                {editingAdmin ? 'Editar Administrador' : 'Novo Administrador'}
              </h2>
              <button onClick={() => { setShowAdminModal(false); setEditingAdmin(null); setError(''); }} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveAdmin} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Nome *</label>
                <input
                  type="text"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Email *</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="usuario@inntag.com.br"
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  required
                />
                <p className="text-xs text-neutral-400 mt-1">Deve ser um email @inntag.com.br</p>
              </div>
              
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Cargo *</label>
                <input
                  type="text"
                  value={adminForm.role}
                  onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                  placeholder="Ex: Diretor, Gerente, Engenheiro..."
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-600 mb-2">
                  {editingAdmin ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
                </label>
                
                {/* Show Current Saved Password */}
                {editingAdmin && editingAdmin.saved_password && (
                  <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">Senha atual salva:</p>
                    <p className="font-mono text-lg text-blue-800 bg-white px-3 py-2 rounded border border-blue-200">
                      {editingAdmin.saved_password}
                    </p>
                  </div>
                )}
                
                {/* Password Status Indicator */}
                {editingAdmin && !editingAdmin.saved_password && (
                  <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600">
                    <X className="w-4 h-4" />
                    <span>Este usuário ainda não possui senha - defina uma abaixo</span>
                  </div>
                )}
                
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder={editingAdmin ? 'Digite para alterar a senha atual' : 'Mínimo 4 caracteres'}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 pr-12 text-neutral-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    required={!editingAdmin}
                    minLength={editingAdmin ? 0 : 4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {editingAdmin?.saved_password && (
                  <p className="text-xs text-neutral-500 mt-1">Deixe vazio para manter a senha atual, ou digite uma nova para substituir</p>
                )}
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-neutral-600">Permissões de Acesso</label>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={selectAllPermissions}
                      className="text-xs text-purple-600 hover:underline"
                    >
                      Selecionar todas
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button 
                      type="button" 
                      onClick={clearAllPermissions}
                      className="text-xs text-neutral-500 hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        currentPermissions.includes(perm.key)
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={currentPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        className="mt-0.5 rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{perm.label}</p>
                        <p className="text-xs text-neutral-500">{perm.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => { setShowAdminModal(false); setEditingAdmin(null); setError(''); }}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                >
                  {editingAdmin ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client User Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md border border-neutral-200 shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">Novo Acesso de Cliente</h2>
              <button onClick={() => { setShowClientModal(false); setClientError(''); }} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddClientUser} className="p-6 space-y-4">
              {clientError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                  {clientError}
                </div>
              )}
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Nome de Usuário *</label>
                <input
                  type="text"
                  value={clientForm.username}
                  onChange={(e) => setClientForm({ ...clientForm, username: e.target.value })}
                  placeholder="Ex: petrobras_joao"
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Senha *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={clientForm.password}
                    onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 pr-12 text-neutral-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Email (opcional)</label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Cliente *</label>
                <select
                  value={clientForm.client_id}
                  onChange={(e) => setClientForm({ ...clientForm, client_id: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowClientModal(false); setClientError(''); }}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                >
                  Criar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedClientUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md border border-neutral-200 shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">Alterar Senha</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <p className="text-neutral-600">
                Alterar senha do usuário <span className="font-mono text-orange-600">{selectedClientUser.username}</span>
              </p>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 pr-12 text-neutral-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    required
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                >
                  Salvar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
