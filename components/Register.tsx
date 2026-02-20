
import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  ShieldCheck,
  X,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { User as AuthUser, UserRole } from '../types';
import { supabase } from '../supabaseClient';

interface RegisterProps {
  onBack: () => void;
  onSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    login: '',
    password: '',
    role: 'USUARIO_COMUM' as UserRole
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validações da Senha
  const passwordCriteria = useMemo(() => ({
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[@$!%*?&]/.test(formData.password),
  }), [formData.password]);

  const isFormValid = useMemo(() => {
    return (
      formData.fullName.trim() !== '' &&
      formData.email.includes('@') &&
      formData.login.trim().length >= 3 &&
      Object.values(passwordCriteria).every(v => v)
    );
  }, [formData, passwordCriteria]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      // Verificar duplicidade
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`login.eq.${formData.login.toLowerCase()},email.eq.${formData.email.toLowerCase()}`)
        .maybeSingle();

      if (existingUser) {
        return setError("Este login ou email já está em uso.");
      }

      const newUser = {
        name: formData.fullName.toUpperCase(),
        login: formData.login.toLowerCase(),
        email: formData.email.toLowerCase(),
        role: formData.role,
        password_hash: formData.password
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert([newUser]);

      if (insertError) throw insertError;

      alert("Usuário cadastrado com sucesso!");
      onSuccess();
    } catch (err) {
      console.error("Erro ao registrar:", err);
      setError("Erro ao salvar usuário no banco de dados.");
    }
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 w-full animate-in slide-in-from-right-4 duration-500">
      <div className="p-10 pb-6 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
          <UserPlus size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Novo Cadastro</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Crie sua conta de acesso ao portal</p>
      </div>

      <form onSubmit={handleRegister} className="px-10 pb-10 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase animate-bounce">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600" size={16} />
            <input
              required
              type="text"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
              placeholder="Ex: João da Silva"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600" size={16} />
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                placeholder="exemplo@edu.br"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Login</label>
            <input
              required
              type="text"
              value={formData.login}
              onChange={e => setFormData({ ...formData, login: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
              placeholder="nome.login"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600" size={16} />
            <input
              required
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-indigo-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Indicadores de Requisitos da Senha */}
          <div className="grid grid-cols-2 gap-2 mt-3 px-1">
            {[
              { label: '8+ Caracteres', met: passwordCriteria.length },
              { label: 'Maiúscula', met: passwordCriteria.uppercase },
              { label: 'Número', met: passwordCriteria.number },
              { label: 'Especial (@#$)', met: passwordCriteria.special },
            ].map(c => (
              <div key={c.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full flex items-center justify-center ${c.met ? 'bg-emerald-500' : 'bg-gray-100'}`}>
                  {c.met && <CheckCircle2 size={8} className="text-white" />}
                </div>
                <span className={`text-[8px] font-black uppercase ${c.met ? 'text-emerald-600' : 'text-gray-300'}`}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nível de Acesso</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'PROFESSOR', label: 'Professor' },
              { id: 'AAE', label: 'AAE' },
              { id: 'TAE', label: 'TAE' },
              { id: 'PSICOSSOCIAL', label: 'Mediação' }
            ].map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => setFormData({ ...formData, role: role.id as UserRole })}
                className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${formData.role === role.id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-50 bg-gray-50 text-gray-400'
                  }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 mt-4 ${isFormValid
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20 active:scale-95'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
        >
          Cadastrar Usuário <ChevronRight size={16} />
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
        >
          Já tenho conta? Voltar ao Login
        </button>
      </form>
    </div>
  );
};

export default Register;
