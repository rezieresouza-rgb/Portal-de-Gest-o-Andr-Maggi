
import React, { useState, useEffect, useMemo } from 'react';
import {
    Users,
    Search,
    CheckCircle,
    XCircle,
    Shield,
    Filter,
    Loader2,
    Mail,
    User,
    ShieldCheck,
    ShieldAlert,
    Trash2,
    Lock,
    Unlock,
    MoreVertical,
    ArrowRightLeft,
    UserPlus,
    Save
} from 'lucide-react';
import { User as AuthUser, UserRole } from '../types';
import { supabase } from '../supabaseClient';

const SecretariatUserManager: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDENTE' | 'ATIVO' | 'BLOQUEADO'>('TODOS');
    const [roleFilter, setRoleFilter] = useState<string>('TODOS');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUserForm, setNewUserForm] = useState({
        name: '',
        login: '',
        email: '',
        password: '',
        role: 'USUARIO_COMUM' as UserRole
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            alert("Erro ao carregar lista de usuários.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateStatus = async (userId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ status: newStatus })
                .eq('id', userId);

            if (error) throw error;

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));

            const actionLabel = newStatus === 'ATIVO' ? 'aprovado' : newStatus === 'BLOQUEADO' ? 'bloqueado' : 'atualizado';
            alert(`Usuário ${actionLabel} com sucesso!`);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status do usuário.");
        }
    };

    const handleUpdateRole = async (userId: string, newRole: UserRole) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            alert(`Nível de acesso atualizado para ${newRole}!`);
        } catch (error) {
            console.error("Erro ao atualizar cargo:", error);
            alert("Erro ao atualizar nível de acesso.");
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Verificar duplicidade
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .or(`login.eq.${newUserForm.login.toLowerCase()},email.eq.${newUserForm.email.toLowerCase()}`)
                .maybeSingle();

            if (existingUser) {
                return alert("Este login ou email já está em uso.");
            }

            const newUser = {
                name: newUserForm.name.toUpperCase(),
                login: newUserForm.login.toLowerCase(),
                email: newUserForm.email.toLowerCase(),
                role: newUserForm.role,
                password_hash: newUserForm.password,
                status: 'ATIVO'
            };

            const { data, error } = await supabase
                .from('users')
                .insert([newUser])
                .select();

            if (error) throw error;

            setUsers(prev => [data[0], ...prev]);
            alert("Usuário criado com sucesso!");
            setIsCreateModalOpen(false);
            setNewUserForm({ name: '', login: '', email: '', password: '', role: 'USUARIO_COMUM' });
        } catch (error: any) {
            console.error("Erro ao criar usuário:", error);
            alert("Erro ao criar usuário: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const generateLogin = () => {
        const nameParts = newUserForm.name.trim().split(' ');
        if (nameParts.length >= 2) {
            const first = nameParts[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const last = nameParts[nameParts.length - 1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            setNewUserForm(prev => ({ ...prev, login: `${first}.${last}` }));
        } else if (nameParts.length === 1 && nameParts[0] !== '') {
            const first = nameParts[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            setNewUserForm(prev => ({ ...prev, login: first }));
        }
    };

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let pass = "";
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewUserForm(prev => ({ ...prev, password: pass }));
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch =
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'TODOS' || u.status === statusFilter;
            const matchesRole = roleFilter === 'TODOS' || u.role === roleFilter;

            return matchesSearch && matchesStatus && matchesRole;
        });
    }, [users, searchTerm, statusFilter, roleFilter]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            pendentes: users.filter(u => u.status === 'PENDENTE').length,
            ativos: users.filter(u => u.status === 'ATIVO').length,
            bloqueados: users.filter(u => u.status === 'BLOQUEADO').length,
        };
    }, [users]);

    if (loading && users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 size={40} className="animate-spin text-indigo-600" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Carregando usuários...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Header & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">Gestão de Acessos</h3>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Auditoria e Controle de Usuários</p>
                    </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex flex-col justify-between">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Solicitações Pendentes</p>
                    <div className="flex items-end justify-between mt-2">
                        <h4 className="text-3xl font-black text-amber-700">{stats.pendentes}</h4>
                        <div className="p-2 bg-white rounded-xl text-amber-600 shadow-sm"><Users size={16} /></div>
                    </div>
                </div>

                <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col justify-between">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Usuários Ativos</p>
                    <div className="flex items-end justify-between mt-2">
                        <h4 className="text-3xl font-black text-emerald-700">{stats.ativos}</h4>
                        <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm"><Shield size={16} /></div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, e-mail ou login..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <UserPlus size={16} /> Novo Usuário
                    </button>
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                        <Filter size={14} className="text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className="bg-transparent text-[9px] font-black uppercase outline-none text-gray-600"
                        >
                            <option value="TODOS">Todos Status</option>
                            <option value="PENDENTE">Pendentes</option>
                            <option value="ATIVO">Ativos</option>
                            <option value="BLOQUEADO">Bloqueados</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                        <Shield size={14} className="text-gray-400" />
                        <select
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                            className="bg-transparent text-[9px] font-black uppercase outline-none text-gray-600"
                        >
                            <option value="TODOS">Todos Níveis</option>
                            <option value="ADMINISTRADOR">Admin</option>
                            <option value="GESTAO">Gestão</option>
                            <option value="SECRETARIA">Secretaria</option>
                            <option value="PROFESSOR">Professor</option>
                            <option value="AAE">AAE</option>
                            <option value="TAE">TAE</option>
                            <option value="PSICOSSOCIAL">Mediação</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <th className="px-8 py-5">Usuário / Identificação</th>
                                <th className="px-8 py-5 text-center">Nível de Acesso</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-right">Ações de Controle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm uppercase shadow-inner ${user.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' :
                                                user.status === 'BLOQUEADO' ? 'bg-red-100 text-red-700' :
                                                    'bg-indigo-100 text-indigo-700'
                                                }`}>
                                                {user.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-gray-900 uppercase leading-none">{user.name}</h4>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><User size={10} /> {user.login}</span>
                                                    {user.email && <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Mail size={10} /> {user.email}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all outline-none ${(user.role === 'ADMINISTRADOR' || user.role === 'GESTAO') ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}
                                        >
                                            <option value="USUARIO_COMUM">Comum</option>
                                            <option value="PROFESSOR">Professor</option>
                                            <option value="AAE">AAE</option>
                                            <option value="TAE">TAE</option>
                                            <option value="PSICOSSOCIAL">Mediação</option>
                                            <option value="SECRETARIA">Secretaria</option>
                                            <option value="GESTAO">Gestão</option>
                                            <option value="ADMINISTRADOR">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${user.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                            user.status === 'BLOQUEADO' ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-emerald-100 text-emerald-700 border-emerald-200'
                                            }`}>
                                            {user.status || 'ATIVO'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.status === 'PENDENTE' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(user.id, 'ATIVO')}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                                                >
                                                    <CheckCircle size={14} /> Aprovar
                                                </button>
                                            )}

                                            {user.status === 'ATIVO' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(user.id, 'BLOQUEADO')}
                                                    className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                                    title="Bloquear Acesso"
                                                >
                                                    <Lock size={16} />
                                                </button>
                                            )}

                                            {user.status === 'BLOQUEADO' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(user.id, 'ATIVO')}
                                                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl transition-all border border-emerald-100"
                                                    title="Desbloquear Acesso"
                                                >
                                                    <Unlock size={16} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleUpdateStatus(user.id, 'PENDENTE')}
                                                className="p-2.5 bg-gray-50 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100"
                                                title="Mover para Pendente"
                                            >
                                                <ArrowRightLeft size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <ShieldAlert size={64} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhum usuário encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Novo Usuário */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-indigo-600 p-8 text-white relative">
                            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all">
                                <XCircle size={20} />
                            </button>
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                    <UserPlus size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Novo Usuário</h2>
                                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-2">Cadastro Manual Administrativo</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-8 space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUserForm.name}
                                        onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        placeholder="Ex: JOÃO DA SILVA"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Login</label>
                                            <button
                                                type="button"
                                                onClick={generateLogin}
                                                className="text-[8px] font-black text-indigo-600 uppercase hover:underline"
                                            >
                                                Gerar Sugestão
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={newUserForm.login}
                                            onChange={e => setNewUserForm({ ...newUserForm, login: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                            placeholder="nome.login"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">E-mail (Opcional)</label>
                                        <input
                                            type="email"
                                            value={newUserForm.email}
                                            onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                            placeholder="exemplo@edu.br"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Senha Provisória</label>
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            className="text-[8px] font-black text-indigo-600 uppercase hover:underline"
                                        >
                                            Gerar Senha Aleatória
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={newUserForm.password}
                                        onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        placeholder="Defina a senha do usuário"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nível de Acesso</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['PROFESSOR', 'GESTAO', 'SECRETARIA', 'AAE', 'TAE', 'PSICOSSOCIAL'].map(r => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setNewUserForm({ ...newUserForm, role: r as UserRole })}
                                                className={`py-2.5 rounded-xl text-[8px] font-black uppercase transition-all border-2 ${newUserForm.role === r ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                                            >
                                                {r === 'GESTAO' ? 'Gestão' : r === 'PSICOSSOCIAL' ? 'Mediação' : r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Criar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecretariatUserManager;
