
import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Plus,
    Search,
    FileText,
    Brain,
    CalendarCheck,
    Info,
    AlertCircle,
    BarChart,
    CheckCircle,
    XCircle,
    Download,
    Trash2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import SpecialEducationForm from '../components/SpecialEducationForm';
import TeacherOccurrences from '../components/TeacherOccurrences';

interface SalaRecursosModuleProps {
    user: any;
    onExit: () => void;
}

const SalaRecursosModule: React.FC<SalaRecursosModuleProps> = ({ user, onExit }) => {
    const [activeSubTab, setActiveSubTab] = useState<'pei' | 'censo' | 'occurrences'>('pei');
    const [peiRecords, setPeiRecords] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    
    // Censo Escolar AEE State
    const [censoStudents, setCensoStudents] = useState<any[]>(() => {
        const saved = localStorage.getItem('aee_censo_students');
        return saved ? JSON.parse(saved) : [];
    });
    const [showCensoForm, setShowCensoForm] = useState(false);
    const [censoForm, setCensoForm] = useState({ id: '', name: '', grade: '', cid: '', hasLaudo: 'Sim', hasPEI: 'Não', category: 'Transtorno do Espectro Autista (TEA)' });

    const handleSaveCensoStudent = () => {
        if (!censoForm.name.trim()) return alert('Nome é obrigatório');
        
        const newStudent = {
            ...censoForm,
            id: censoForm.id || Date.now().toString(),
            updatedAt: new Date().toISOString()
        };

        const updated = censoForm.id 
            ? censoStudents.map(s => s.id === censoForm.id ? newStudent : s)
            : [newStudent, ...censoStudents];
            
        setCensoStudents(updated);
        localStorage.setItem('aee_censo_students', JSON.stringify(updated));
        setShowCensoForm(false);
        setCensoForm({ id: '', name: '', grade: '', cid: '', hasLaudo: 'Sim', hasPEI: 'Não', category: 'Transtorno do Espectro Autista (TEA)' });
    };

    const handleDeleteCensoStudent = (id: string) => {
        if(!confirm('Remover aluno do Censo AEE?')) return;
        const updated = censoStudents.filter(s => s.id !== id);
        setCensoStudents(updated);
        localStorage.setItem('aee_censo_students', JSON.stringify(updated));
    };

const fetchRecords = async () => {
        if (activeSubTab !== 'pei') return;
        try {
            const { data, error } = await supabase
                .from('pei_records')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPeiRecords(data || []);
        } catch (error) {
            console.error('Erro ao buscar registros:', error);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [activeSubTab]);

    const handleEdit = (record: any) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEditingRecord(null);
        setIsModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-8 py-6">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onExit}
                            className="w-10 h-10 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 hover:text-gray-600 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                Sala de Recursos (AEE)
                            </h1>
                            <p className="text-sm font-medium text-gray-400 mt-1">
                                Gestão de Atendimento Educacional Especializado
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white border-b border-gray-100">
                <div className="flex gap-8 px-8 max-w-7xl mx-auto">
                    <button
                        onClick={() => setActiveSubTab('pei')}
                        className={`pb-4 pt-5 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeSubTab === 'pei'
                                ? 'text-indigo-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Planos (PEI)
                        {activeSubTab === 'pei' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveSubTab('censo')}
                        className={`pb-4 pt-5 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeSubTab === 'censo'
                                ? 'text-blue-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <BarChart size={16} />
                            Censo AEE
                        </div>
                        {activeSubTab === 'censo' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveSubTab('occurrences')}
                        className={`pb-4 pt-5 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeSubTab === 'occurrences'
                                ? 'text-pink-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Ocorrências
                        {activeSubTab === 'occurrences' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-600 rounded-t-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto">
                {activeSubTab === 'occurrences' && (
                    <div className="h-full">
                        <TeacherOccurrences user={user} />
                    </div>
                )}

                {activeSubTab === 'pei' && (
                    <div className="p-8 max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <div className="relative flex-1 max-w-md w-full">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar aluno por nome..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-gray-600 placeholder-gray-400 shadow-sm"
                                />
                            </div>
                            <button
                                onClick={handleNew}
                                className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> <span className="hidden sm:inline">Novo PEI</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {peiRecords.filter(s => s.student_name.toLowerCase().includes(searchTerm.toLowerCase())).map(pei => (
                                <div key={pei.id} className="bg-white p-6 rounded-[3rem] border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-2xl transition-all group cursor-pointer relative" onClick={() => handleEdit(pei)}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center font-black text-xl shadow-inner">
                                            {pei.student_name.charAt(0)}
                                        </div>
                                        <span className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest border border-indigo-100/50">
                                            {pei.school_team?.regent_teacher?.split(' ')[0] || 'S/ PROF'}
                                        </span>
                                    </div>

                                    <h3 className="font-black text-gray-900 uppercase text-xs mb-1 line-clamp-1 tracking-tight">{pei.student_name}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-6 line-clamp-1">{pei.diagnosis_condition || 'Sem Diagnóstico'}</p>

                                    <div className="space-y-3 bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100/50">
                                        <div className="flex items-center gap-3 text-[9px] uppercase font-black text-gray-500">
                                            <Brain size={14} className="text-gray-300" />
                                            <span>Planejamento: {pei.pedagogical_planning?.length || 0} Áreas</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[9px] uppercase font-black text-gray-500">
                                            <CalendarCheck size={14} className="text-gray-300" />
                                            <span>Revisão: {pei.pei_calendar?.review_date ? new Date(pei.pei_calendar.review_date).toLocaleDateString('pt-BR') : 'Pendente'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-[9px] text-gray-300 font-black uppercase tracking-[0.1em]">
                                            Rev. {new Date(pei.updated_at).toLocaleDateString('pt-BR')}
                                        </span>
                                        <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                            <FileText size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            
                {activeSubTab === 'censo' && (
                    <div className="p-8 max-w-7xl mx-auto space-y-8">
                        {/* Dashboard Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total AEE</p>
                                    <h3 className="text-3xl font-black text-gray-900">{censoStudents.length}</h3>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <Brain size={24} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Com Laudo</p>
                                    <h3 className="text-3xl font-black text-emerald-600">{censoStudents.filter(s => s.hasLaudo === 'Sim').length}</h3>
                                </div>
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <CheckCircle size={24} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sem Laudo</p>
                                    <h3 className="text-3xl font-black text-red-600">{censoStudents.filter(s => s.hasLaudo === 'Não').length}</h3>
                                </div>
                                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                                    <XCircle size={24} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">PEI Atualizado</p>
                                    <h3 className="text-3xl font-black text-purple-600">{censoStudents.filter(s => s.hasPEI === 'Sim').length}</h3>
                                </div>
                                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Listagem */}
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 uppercase">Lista do Censo Escolar</h2>
                                    <p className="text-sm font-medium text-gray-500">Mapeamento de estudantes para o Educacenso.</p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button 
                                        onClick={() => setShowCensoForm(true)}
                                        className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Novo Aluno
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudante / Turma</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">CID</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Laudo</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">PEI</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {censoStudents.map(student => (
                                            <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900 text-sm uppercase">{student.name}</p>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">{student.grade}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-black uppercase px-2 py-1 rounded">{student.category}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-gray-700">{student.cid || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-xs font-black uppercase ${student.hasLaudo === 'Sim' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {student.hasLaudo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-xs font-black uppercase ${student.hasPEI === 'Sim' ? 'text-purple-600' : 'text-gray-400'}`}>
                                                        {student.hasPEI}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => { setCensoForm(student); setShowCensoForm(true); }} className="text-gray-400 hover:text-blue-600 p-2">
                                                            <BarChart size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteCensoStudent(student.id)} className="text-gray-400 hover:text-red-600 p-2">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {censoStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                                                    Nenhum estudante AEE cadastrado no Censo local.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Censo Form Modal */}
                        {showCensoForm && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Registro do Estudante</h2>
                                            <p className="text-sm font-bold text-gray-400 uppercase mt-1">Dados para Censo AEE</p>
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label>
                                                <input type="text" value={censoForm.name} onChange={e => setCensoForm({...censoForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 font-bold text-gray-700 uppercase" placeholder="Ex: Maria Silva" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Turma / Ano</label>
                                                <input type="text" value={censoForm.grade} onChange={e => setCensoForm({...censoForm, grade: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 font-bold text-gray-700 uppercase" placeholder="Ex: 6º Ano A" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Categoria da Deficiência</label>
                                                <select value={censoForm.category} onChange={e => setCensoForm({...censoForm, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 font-bold text-gray-700">
                                                    <option value="Transtorno do Espectro Autista (TEA)">TEA</option>
                                                    <option value="Deficiência Intelectual">Deficiência Intelectual</option>
                                                    <option value="Deficiência Visual">Deficiência Visual</option>
                                                    <option value="Deficiência Auditiva / Surdez">Deficiência Auditiva / Surdez</option>
                                                    <option value="Deficiência Física">Deficiência Física</option>
                                                    <option value="Altas Habilidades / Superdotação">Altas Habilidades / Superdotação</option>
                                                    <option value="Múltiplas Deficiências">Múltiplas Deficiências</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Código CID (Opcional)</label>
                                                <input type="text" value={censoForm.cid} onChange={e => setCensoForm({...censoForm, cid: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 font-bold text-gray-700 uppercase" placeholder="Ex: F84.0" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                                                <span className="text-xs font-black text-gray-700 uppercase">Possui Laudo Médico?</span>
                                                <select value={censoForm.hasLaudo} onChange={e => setCensoForm({...censoForm, hasLaudo: e.target.value})} className="bg-white border border-gray-200 rounded-lg px-3 py-1 font-bold text-sm">
                                                    <option value="Sim">Sim</option>
                                                    <option value="Não">Não</option>
                                                </select>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                                                <span className="text-xs font-black text-gray-700 uppercase">Possui PEI Válido?</span>
                                                <select value={censoForm.hasPEI} onChange={e => setCensoForm({...censoForm, hasPEI: e.target.value})} className="bg-white border border-gray-200 rounded-lg px-3 py-1 font-bold text-sm">
                                                    <option value="Sim">Sim</option>
                                                    <option value="Não">Não</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                                        <button onClick={() => setShowCensoForm(false)} className="px-6 py-3 text-gray-500 font-bold text-sm uppercase tracking-widest hover:bg-gray-200 rounded-xl transition-all">Cancelar</button>
                                        <button onClick={handleSaveCensoStudent} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">Salvar Estudante</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </main>

            {isModalOpen && activeSubTab === 'pei' && (
                <SpecialEducationForm
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => { setIsModalOpen(false); fetchRecords(); }}
                    initialData={editingRecord}
                />
            )}
        </div>
    );
};

export default SalaRecursosModule;
