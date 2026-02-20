import React, { useState, useEffect } from 'react';
import {
    Rocket,
    Plus,
    X,
    Calendar,
    User,
    Target,
    FileText,
    Trash2,
    Edit2,
    CheckCircle2,
    AlertCircle,
    Clock,
    ChevronRight,
    Filter
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { PedagogicalProject } from '../types';

export default function SchoolProjectManager() {
    const [projects, setProjects] = useState<PedagogicalProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<PedagogicalProject | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        coordinator_name: '',
        bimestre: '1º BIMESTRE',
        status: 'PLANEJAMENTO',
        impact_level: 'MÉDIO',
        description: ''
    });

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pedagogical_projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setProjects(data.map(p => ({
                    id: p.id,
                    name: p.name,
                    coordinator: p.coordinator_name,
                    bimestre: p.bimestre,
                    status: p.status,
                    impactLevel: p.impact_level,
                    description: p.description
                })));
            }
        } catch (error) {
            console.error('Erro ao buscar projetos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProject) {
                const { error } = await supabase
                    .from('pedagogical_projects')
                    .update({
                        name: formData.name,
                        coordinator_name: formData.coordinator_name,
                        bimestre: formData.bimestre,
                        status: formData.status,
                        impact_level: formData.impact_level,
                        description: formData.description
                    })
                    .eq('id', editingProject.id);

                if (error) throw error;
                alert('Projeto atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('pedagogical_projects')
                    .insert([{
                        name: formData.name,
                        coordinator_name: formData.coordinator_name,
                        bimestre: formData.bimestre,
                        status: formData.status,
                        impact_level: formData.impact_level,
                        description: formData.description
                    }]);

                if (error) throw error;
                alert('Projeto criado com sucesso!');
            }

            setIsModalOpen(false);
            resetForm();
            fetchProjects();
        } catch (error) {
            console.error('Erro ao salvar projeto:', error);
            alert('Erro ao salvar o projeto. Verifique os dados e tente novamente.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este projeto?')) return;

        try {
            const { error } = await supabase
                .from('pedagogical_projects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchProjects();
        } catch (error) {
            console.error('Erro ao excluir projeto:', error);
        }
    };

    const openEditModal = (project: PedagogicalProject) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            coordinator_name: project.coordinator,
            bimestre: project.bimestre,
            status: project.status,
            impact_level: project.impactLevel,
            description: project.description || ''
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingProject(null);
        setFormData({
            name: '',
            coordinator_name: '',
            bimestre: '1º BIMESTRE',
            status: 'PLANEJAMENTO',
            impact_level: 'MÉDIO',
            description: ''
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONCLUÍDO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'EM_ANDAMENTO': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    const getImpactColor = (level: string) => {
        switch (level) {
            case 'ALTO': return 'bg-red-50 text-red-700 border-red-100';
            case 'BAIXO': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-violet-50 text-violet-700 border-violet-100';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Projetos Institucionais</h3>
                    <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Planejamento e Acompanhamento de Impacto</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="px-8 py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center gap-2 border border-white/10"
                >
                    <Plus size={18} /> Novo Projeto
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="text-center py-20 text-white/40">Carregando projetos...</div>
                ) : projects.length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/5">
                        <Rocket size={48} className="mx-auto mb-4 text-violet-400/50" />
                        <p className="text-white/30 font-black uppercase text-xs tracking-widest">Nenhum projeto cadastrado</p>
                    </div>
                ) : (
                    projects.map(project => (
                        <div key={project.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/10 hover:border-violet-500/30 hover:bg-white/10 hover:shadow-lg transition-all group backdrop-blur-sm">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-16 h-16 bg-violet-500/10 text-violet-400 rounded-2xl flex items-center justify-center shrink-0 border border-violet-500/20">
                                    <Rocket size={32} />
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-black text-white uppercase">{project.name}</h4>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${getStatusColor(project.status).replace('bg-', 'bg-opacity-10 bg-').replace('text-', 'text-').replace('border-', 'border-opacity-20 border-')}`}>
                                                    {project.status.replace('_', ' ')}
                                                </span>
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${getImpactColor(project.impactLevel).replace('bg-', 'bg-opacity-10 bg-').replace('text-', 'text-').replace('border-', 'border-opacity-20 border-')}`}>
                                                    Impacto {project.impactLevel}
                                                </span>
                                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white/60 uppercase flex items-center gap-1">
                                                    <User size={10} /> {project.coordinator}
                                                </span>
                                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white/60 uppercase flex items-center gap-1">
                                                    <Calendar size={10} /> {project.bimestre}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(project)}
                                                className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project.id)}
                                                className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-xs text-white/70 font-medium leading-relaxed">
                                            {project.description || "Sem descrição detalhada."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0f172a] rounded-[3rem] w-full max-w-2xl shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-10 pt-10 pb-6 flex justify-between items-center bg-[#0f172a] shrink-0 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-violet-600 text-white rounded-3xl shadow-xl shadow-violet-600/20">
                                    <Rocket size={28} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                                        {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                                    </h3>
                                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
                                        {editingProject ? 'Atualize os dados do projeto' : 'Cadastre uma nova iniciativa'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-3 bg-white/5 text-white/40 hover:text-red-400 rounded-2xl transition-all border border-white/5"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 pb-10 space-y-6 custom-scrollbar pt-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5 step-1">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        <Target size={12} /> Título do Projeto
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                        placeholder="EX: FEIRA DE CIÊNCIAS 2024"
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white placeholder-white/20 outline-none focus:bg-white/10 focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1">
                                            <User size={12} /> Coordenador
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.coordinator_name}
                                            onChange={e => setFormData({ ...formData, coordinator_name: e.target.value.toUpperCase() })}
                                            placeholder="NOME DO RESPONSÁVEL"
                                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white placeholder-white/20 outline-none focus:bg-white/10 focus:ring-2 focus:ring-violet-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1">
                                            <Calendar size={12} /> Período
                                        </label>
                                        <select
                                            value={formData.bimestre}
                                            onChange={e => setFormData({ ...formData, bimestre: e.target.value })}
                                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none [&>option]:bg-gray-900"
                                        >
                                            <option value="1º BIMESTRE">1º BIMESTRE</option>
                                            <option value="2º BIMESTRE">2º BIMESTRE</option>
                                            <option value="3º BIMESTRE">3º BIMESTRE</option>
                                            <option value="4º BIMESTRE">4º BIMESTRE</option>
                                            <option value="ANUAL">ANUAL</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Status</label>
                                        <div className="flex gap-2">
                                            {['PLANEJAMENTO', 'EM_ANDAMENTO', 'CONCLUÍDO'].map(status => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status })}
                                                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${formData.status === status
                                                        ? 'bg-violet-600 text-white border-violet-600 shadow-lg'
                                                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    {status.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Impacto</label>
                                        <div className="flex gap-2">
                                            {['BAIXO', 'MÉDIO', 'ALTO'].map(level => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, impact_level: level })}
                                                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${formData.impact_level === level
                                                        ? 'bg-violet-600 text-white border-violet-600 shadow-lg'
                                                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        <FileText size={12} /> Detalhes do Projeto
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Descreva os objetivos, metodologia e recursos necessários..."
                                        rows={6}
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-medium text-sm text-white placeholder-white/20 outline-none focus:bg-white/10 focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-violet-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-violet-700 transition-all border border-white/10"
                            >
                                {editingProject ? 'Salvar Alterações' : 'Lançar Projeto'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
