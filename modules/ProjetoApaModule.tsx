
import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Plus,
    Search,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import LearningAssessmentForm from '../components/LearningAssessmentForm';
import TeacherOccurrences from '../components/TeacherOccurrences';

interface ProjetoApaModuleProps {
    user: any;
    onExit: () => void;
}

const ProjetoApaModule: React.FC<ProjetoApaModuleProps> = ({ user, onExit }) => {
    const [activeSubTab, setActiveSubTab] = useState<'sondagem' | 'occurrences'>('sondagem');
    const [assessmentRecords, setAssessmentRecords] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const fetchRecords = async () => {
        if (activeSubTab !== 'sondagem') return;
        try {
            const { data, error } = await supabase
                .from('learning_assessment_records')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAssessmentRecords(data || []);
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
                                Projeto APA (SEDUC)
                            </h1>
                            <p className="text-sm font-medium text-gray-400 mt-1">
                                Acompanhamento Personalizado da Aprendizagem - Metodologia TaRL
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white border-b border-gray-100">
                <div className="flex gap-8 px-8 max-w-7xl mx-auto">
                    <button
                        onClick={() => setActiveSubTab('sondagem')}
                        className={`pb-4 pt-5 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeSubTab === 'sondagem'
                                ? 'text-orange-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Avaliações Diagnósticas
                        {activeSubTab === 'sondagem' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full" />
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
                {activeSubTab === 'occurrences' ? (
                    <div className="h-full">
                        <TeacherOccurrences user={user} />
                    </div>
                ) : (
                    <div className="p-8 max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <div className="relative flex-1 max-w-md w-full">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar avaliação por aluno..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 transition-all font-medium text-gray-600 placeholder-gray-400 shadow-sm"
                                />
                            </div>
                            <button
                                onClick={handleNew}
                                className="w-full sm:w-auto bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> <span className="hidden sm:inline">Nova Avaliação</span>
                            </button>
                        </div>

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
                    </div>
                )}
            </main>

            {isModalOpen && activeSubTab === 'sondagem' && (
                <LearningAssessmentForm
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => { setIsModalOpen(false); fetchRecords(); }}
                    initialData={editingRecord}
                />
            )}
        </div>
    );
};

export default ProjetoApaModule;
