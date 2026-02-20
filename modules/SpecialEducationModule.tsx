
import React, { useState, useEffect } from 'react';
import {
    Users,
    ArrowLeft,
    Plus,
    Search,
    FileText,
    Brain,
    CalendarCheck,
    ClipboardList,
    TrendingUp,
    Info
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import SpecialEducationForm from '../components/SpecialEducationForm';
import LearningAssessmentForm from '../components/LearningAssessmentForm';

interface SpecialEducationModuleProps {
    onExit: () => void;
}

const SpecialEducationModule: React.FC<SpecialEducationModuleProps> = ({ onExit }) => {
    const [activeSubTab, setActiveSubTab] = useState<'pei' | 'sondagem'>('pei');
    const [peiRecords, setPeiRecords] = useState<any[]>([]);
    const [assessmentRecords, setAssessmentRecords] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const fetchRecords = async () => {
        try {
            const table = activeSubTab === 'pei' ? 'pei_records' : 'learning_assessment_records';
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (activeSubTab === 'pei') {
                setPeiRecords(data || []);
            } else {
                setAssessmentRecords(data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar registros:', error);
        }
    };

    useEffect(() => {
        fetchRecords();
        const table = activeSubTab === 'pei' ? 'pei_records' : 'learning_assessment_records';
        const sub = supabase.channel(`${table}_changes`)
            .on('postgres_changes', { event: '*', schema: 'public', table: table }, fetchRecords)
            .subscribe();
        return () => { sub.unsubscribe() };
    }, [activeSubTab]);

    const handleEdit = (record: any) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingRecord(null);
        setIsModalOpen(true);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
            {/* Sidebar */}
            <aside className="w-72 bg-indigo-950 text-white flex flex-col no-print shadow-2xl relative z-10">
                <div className="p-8 bg-indigo-900/50">
                    <h1 className="text-xl font-black flex items-center gap-3">
                        <span className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">🧠</span>
                        Sala de Recursos
                    </h1>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-2 ml-11">Portal André Maggi</p>
                </div>

                <div className="flex-1 mt-8 px-4 space-y-2">
                    <button
                        onClick={() => setActiveSubTab('pei')}
                        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'pei'
                            ? 'bg-white text-indigo-900 shadow-xl shadow-white/5'
                            : 'text-indigo-300 hover:bg-white/5'
                            }`}
                    >
                        <FileText size={18} /> Plano (PEI)
                    </button>
                    <button
                        onClick={() => setActiveSubTab('sondagem')}
                        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'sondagem'
                            ? 'bg-white text-indigo-900 shadow-xl shadow-white/5'
                            : 'text-indigo-300 hover:bg-white/5'
                            }`}
                    >
                        <TrendingUp size={18} /> Sondagem / APA
                    </button>
                </div>

                {/* Descrição Oficial */}
                <div className="mx-4 mb-6 p-5 bg-indigo-900/40 rounded-[2rem] border border-indigo-800/50">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <Info size={14} /> Sobre o Módulo
                    </h4>
                    <p className="text-[10px] text-indigo-200 leading-relaxed font-medium">
                        Acompanhamento personalizado para Sala de Recursos e APA. Registra PEI, sondagem de leitura, escrita e progresso do nível de alfabetização.
                    </p>
                </div>

                <div className="p-6 border-t border-indigo-900/50">
                    <button onClick={onExit} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-indigo-200">
                        <ArrowLeft size={16} /> Hub de Gestão
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-white">
                <header className="h-24 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${activeSubTab === 'pei' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {activeSubTab === 'pei' ? <ClipboardList size={22} /> : <TrendingUp size={22} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                                {activeSubTab === 'pei' ? 'Gestão de PEIs' : 'Sondagem de Aprendizagem (APA)'}
                            </h2>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                {activeSubTab === 'pei' ? 'Resolução Normativa nº 010/2023/CEE-MT' : 'Avaliação da Psicogênese da Língua Escrita'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input
                                type="text"
                                placeholder={`Buscar em ${activeSubTab === 'pei' ? 'PEIs' : 'Avaliações'}...`}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-[1.25rem] text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100 w-80 transition-all"
                            />
                        </div>
                        <button
                            onClick={handleAddNew}
                            className={`px-8 py-3.5 ${activeSubTab === 'pei' ? 'bg-indigo-600' : 'bg-emerald-600'} text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 hover:scale-105 active:scale-95`}
                        >
                            <Plus size={16} /> {activeSubTab === 'pei' ? 'Novo PEI' : 'Nova Avaliação'}
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {activeSubTab === 'pei' ? (
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
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 font-sans">
                            {assessmentRecords.filter(s => s.student_name.toLowerCase().includes(searchTerm.toLowerCase())).map(reg => (
                                <div key={reg.id} className="bg-white p-7 rounded-[3rem] border border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-2xl transition-all group cursor-pointer relative" onClick={() => handleEdit(reg)}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center font-black text-xl">
                                            {reg.student_name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[16px] font-black text-emerald-600 leading-none">{reg.total_score}</span>
                                            <span className="text-[8px] font-black text-emerald-300 uppercase">PTS</span>
                                        </div>
                                    </div>

                                    <h3 className="font-black text-gray-900 uppercase text-xs mb-1 line-clamp-1 tracking-tight">{reg.student_name}</h3>
                                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-6">{reg.literacy_level}</p>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-gray-50 p-2 rounded-xl text-center">
                                            <p className="text-[8px] font-black text-gray-400 uppercase">Leitura</p>
                                            <p className="text-xs font-black text-gray-700">{reg.reading_score}</p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-xl text-center">
                                            <p className="text-[8px] font-black text-gray-400 uppercase">Escrita</p>
                                            <p className="text-xs font-black text-gray-700">{reg.writing_score}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-[9px] text-gray-300 font-black uppercase">
                                            {new Date(reg.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                        <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                                            <TrendingUp size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {isModalOpen && (
                activeSubTab === 'pei' ? (
                    <SpecialEducationForm
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={() => { setIsModalOpen(false); fetchRecords(); }}
                        initialData={editingRecord}
                    />
                ) : (
                    <LearningAssessmentForm
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={() => { setIsModalOpen(false); fetchRecords(); }}
                        initialData={editingRecord}
                    />
                )
            )}
        </div>
    );
};

export default SpecialEducationModule;
