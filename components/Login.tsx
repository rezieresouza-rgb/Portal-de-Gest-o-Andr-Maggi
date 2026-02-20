
import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronRight,
  HelpCircle,
  UserPlus,
  GraduationCap
} from 'lucide-react';
import { User as AuthUser, AccessLog } from '../types';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);


  const [showForgotModal, setShowForgotModal] = useState(false);

  /* 
   * AUTENTICAÇÃO VIA SUPABASE
   * Migrado de Mock Local para Database Produção
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Limpar e preparar login (se for CPF, deixar só números)
      let cleanLogin = login.trim().toLowerCase();
      const isCpfMatch = cleanLogin.replace(/\D/g, '');
      if (isCpfMatch.length === 11) {
        cleanLogin = isCpfMatch;
      }

      // 2. Buscar usuário no Supabase
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .or(`login.eq.${cleanLogin},email.eq.${cleanLogin},cpf.eq.${cleanLogin}`)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        throw dbError;
      }

      // 3. Validar Senha
      const cleanPassword = password.trim();
      if (user && user.password_hash === cleanPassword) {
        // 3. Validar Status do Usuário
        if (user.status === 'PENDENTE') {
          setError("Seu acesso está em análise. Aguarde a aprovação da administração.");
          setIsLoading(false);
          return;
        }

        if (user.status === 'BLOQUEADO') {
          setError("Seu acesso foi bloqueado. Entre em contato com o suporte.");
          setIsLoading(false);
          return;
        }

        // Registrar login no banco (opcional/futuro) ou localStorage
        const sessionUser = {
          id: user.id,
          name: user.name,
          login: user.login,
          role: user.role,
          email: user.email,
          token: `sb_${user.id}_${Date.now()}`,
          lastLogin: new Date().toISOString()
        };

        // Manter compatibilidade com logs locais por enquanto
        const logs: AccessLog[] = JSON.parse(localStorage.getItem('access_logs_v1') || '[]');
        logs.unshift({
          id: `log-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          role: user.role,
          module: 'LOGIN',
          timestamp: Date.now(),
          action: 'LOGIN'
        });
        localStorage.setItem('access_logs_v1', JSON.stringify(logs.slice(0, 100)));

        onLogin(sessionUser);
      } else {
        // Usuário não encontrado ou senha incorreta
        handleFailedAttempt();
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= 5) {
      setIsLocked(true);
      setError("Múltiplas tentativas falhas. Acesso bloqueado por segurança.");
    } else {
      setError("Login ou senha incorretos. Verifique suas credenciais.");
    }
  };


  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* Background Animado Premium */}
      <div className="absolute inset-0 z-0">
        <img
          src="/frente_escola.jpeg"
          alt="Escola André Maggi"
          className="absolute inset-0 w-full h-full object-cover opacity-30 scale-105 animate-[pulse_10s_ease-in-out_infinite]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/80 to-purple-900/60 mix-blend-multiply"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/30 rounded-full blur-[100px] animate-[bounce_10s_infinite]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/30 rounded-full blur-[100px] animate-[bounce_12s_infinite_reverse]"></div>
      </div>

      <div className="w-full max-w-[400px] relative z-10 animate-in fade-in zoom-in-95 duration-1000">

        {/* Card Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden relative">

          {/* Efeito de brilho na borda superior */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

          <div className="p-8 pb-6 text-center relative">
            <div className="mx-auto mb-6 bg-white/90 p-4 rounded-3xl shadow-xl shadow-indigo-500/10 backdrop-blur-sm w-fit transform hover:scale-105 transition-transform duration-300">
              <img
                src="/logo-escola.png"
                alt="Logo Escola André Maggi"
                className="h-16 w-auto object-contain filter drop-shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] shadow-lg shadow-indigo-500/30 flex items-center justify-center mx-auto transform rotate-3 border border-white/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap drop-shadow-md"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    </div>
                  `;
                }}
              />
            </div>
            <h2 className="text-xs font-bold text-white/80 uppercase tracking-[0.2em] mb-2">Portal de Gestão</h2>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-sm">
              Escola André Maggi
            </h1>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.1em] mt-3">Colíder - MT</p>
          </div>

          <form onSubmit={handleLogin} className="px-8 pb-10 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/40 backdrop-blur-md rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="text-white shrink-0 mt-0.5 drop-shadow-sm" />
                <p className="text-[10px] font-bold text-white leading-tight uppercase tracking-wide">{error}</p>
              </div>
            )}

            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1 group-focus-within:text-white transition-colors">Usuário / Login</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  required
                  disabled={isLoading || isLocked}
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="CPF (somente números)"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white placeholder-white/20 outline-none focus:bg-white/10 focus:border-white/30 focus:ring-4 focus:ring-white/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1 group-focus-within:text-white transition-colors">Senha de Acesso</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading || isLocked}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white placeholder-white/20 outline-none focus:bg-white/10 focus:border-white/30 focus:ring-4 focus:ring-white/5 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative flex items-center gap-2">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Acessar Portal <ChevronRight size={16} /></>}
              </span>
            </button>

            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white hover:underline flex items-center justify-center gap-1 transition-colors"
                >
                  <HelpCircle size={12} /> Esqueci minha senha
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Esqueci Senha */}
        {showForgotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-600">
                  <Lock size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Esqueceu sua senha?</h3>
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">
                    Por motivos de segurança acadêmica, a redefinição de senha deve ser solicitada pessoalmente.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Instruções</p>
                    <p className="text-[11px] font-bold text-gray-700 leading-tight">
                      Dirija-se à <span className="text-indigo-600">Secretaria da Escola André Maggi</span> ou entre em contato com o administrador do sistema.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-black transition-all active:scale-95"
                >
                  Entendi, Voltar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center space-y-2">
          <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em]">Ambiente Seguro & Criptografado</p>
          <div className="flex justify-center gap-2 opacity-30">
            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
