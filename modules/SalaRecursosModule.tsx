
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
