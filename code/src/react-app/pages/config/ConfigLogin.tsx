import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ASSETS } from '@/react-app/data/content';
import { Lock, Mail, ArrowRight, AlertCircle, Shield, User } from 'lucide-react';

export default function ConfigLogin() {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState<'user' | 'master'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const body = loginMode === 'user' 
        ? { email, password }
        : { password };

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('admin_session', data.token);
        navigate('/config/dashboard');
      } else {
        setError(data.error || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm">
          <div className="text-center mb-8">
            <img 
              src={ASSETS.logo} 
              alt="INNTAG" 
              className="h-10 mx-auto mb-6"
            />
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
              Área de Configuração
            </h1>
            <p className="text-neutral-500 text-sm">
              Acesso restrito para administradores
            </p>
          </div>

          {/* Login mode tabs */}
          <div className="flex bg-neutral-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMode('user')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                loginMode === 'user'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <User className="w-4 h-4" />
              Usuário
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('master')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                loginMode === 'master'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              Master
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMode === 'user' && (
              <div>
                <label className="block text-sm text-neutral-600 mb-2">
                  E-mail ou Nome de Usuário
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com ou nome de usuário"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-3 pr-12 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                    required={loginMode === 'user'}
                    autoFocus
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-neutral-600 mb-2">
                {loginMode === 'user' ? 'Senha' : 'Senha Master'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-3 pr-12 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                  required
                  autoFocus={loginMode === 'master'}
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  {loginMode === 'user' ? <User className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                  Acessar Painel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-neutral-400 text-xs mt-6">
            {loginMode === 'user' 
              ? 'Use suas credenciais cadastradas pelo administrador'
              : 'Acesso total com senha master do sistema'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
