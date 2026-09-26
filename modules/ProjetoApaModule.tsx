
import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    Plus,
    Search,
    TrendingUp,
    AlertCircle,
    LayoutGrid,
    BarChart3,
    BookOpen,
    Save,
    CalendarCheck
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import LearningAssessmentForm from '../components/LearningAssessmentForm';
import TeacherOccurrences from '../components/TeacherOccurrences';

interface ProjetoApaModuleProps {
    user: any;
    onExit: () => void;
}

const LITERACY_LEVELS = [
    'Pré-silábico',
    'Silábico sem valor sonoro',
    'Silábico com valor sonoro',
    'Silábico-alfabético',
    'Alfabético',
    'Alfabético consolidado'
];

const ProjetoApaModule: React.FC<ProjetoApaModuleProps> = ({ user, onExit }) => {
    const [activeSubTab, setActiveSubTab] = useState<'sondagem' | 'agrupamentos' | 'diario' | 'occurrences'>('sondagem');
    const [assessmentRecords, setAssessmentRecords] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    
    // Diário State
    const [selectedLevel, setSelectedLevel] = useState<string>(LITERACY_LEVELS[0]);
    const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [intervention, setIntervention] = useState('');
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [logs, setLogs] = useState<any[]>(() => {
        const saved = localStorage.getItem('apa_daily_logs');
        return saved ? JSON.parse(saved) : [];
    });

    // Populate attendance map when selected group changes
    useEffect(() => {
        const currentGroup = groupedStudents[selectedLevel] || [];
        const newAttendance: Record<string, boolean> = {};
        currentGroup.forEach((s: any) => {
            newAttendance[s.student_name] = true; // default presente
        });
        setAttendance(newAttendance);
    }, [selectedLevel, groupedStudents]);

    const handleSaveLog = () => {
        if (!intervention.trim()) {
            alert('Por favor, descreva a intervenção pedagógica.');
            return;
        }

        const newLog = {
            id: Date.now().toString(),
            date: logDate,
            level: selectedLevel,
            intervention,
            attendance,
            teacherName: user.name,
            createdAt: new Date().toISOString()
        };

        const updatedLogs = [newLog, ...logs];
        setLogs(updatedLogs);
        localStorage.setItem('apa_daily_logs', JSON.stringify(updatedLogs));
        
        setIntervention('');
        alert('Diário salvo com sucesso!');
    };
const fetchRecords = async () => {
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

    // Agrupar alunos pelo nível mais recente
    const groupedStudents = useMemo(() => {
        const groups: Record<string, any[]> = {};
        LITERACY_LEVELS.forEach(level => {
            groups[level] = [];
        });

        // Pegar apenas a avaliação mais recente de cada aluno
        const latestAssessments = new Map();
        assessmentRecords.forEach(record => {
            if (!latestAssessments.has(record.student_name)) {
                latestAssessments.set(record.student_name, record);
            }
        });

        Array.from(latestAssessments.values()).forEach(record => {
            if (groups[record.literacy_level]) {
                groups[record.literacy_level].push(record);
            } else {
                // Fallback se tiver algum nível fora do padrão
                if (!groups['Outros']) groups['Outros'] = [];
                groups['Outros'].push(record);
            }
        });

        return groups;
    }, [assessmentRecords]);

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
                        onClick={() => setActiveSubTab('agrupamentos')}
                        className={`pb-4 pt-5 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeSubTab === 'agrupamentos'
                                ? 'text-emerald-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={16} />
                            Farol & Agrupamentos
                        </div>
                        {activeSubTab === 'agrupamentos' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />
                        )}
                    </button>
                    
                    <button
                        onClick={() => setActiveSubTab('diario')}
                        className={`pb-4 pt-5 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeSubTab === 'diario'
                                ? 'text-indigo-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen size={16} />
                            Diário & Frequência
                        </div>
                        {activeSubTab === 'diario' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
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
                
                {activeSubTab === 'agrupamentos' && (
                    <div className="p-8 max-w-[1600px] mx-auto">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase">Matriz de Agrupamentos (TaRL)</h2>
                                <p className="text-sm font-medium text-gray-500 mt-1">Alunos agrupados automaticamente pela última sondagem registrada.</p>
                            </div>
                        </div>

                        <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar items-start">
                            {LITERACY_LEVELS.map((level, idx) => (
                                <div key={level} className="flex-shrink-0 w-80 bg-gray-50/80 border border-gray-200 rounded-[2rem] p-5 flex flex-col h-[70vh]">
                                    <div className="mb-5 px-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-black text-gray-800 text-sm uppercase leading-tight line-clamp-2">{level}</h3>
                                            <span className="bg-white text-gray-900 font-black text-xs px-2.5 py-1 rounded-xl shadow-sm border border-gray-100">
                                                {groupedStudents[level]?.length || 0}
                                            </span>
                                        </div>
                                        {/* Progress bar visual indicator */}
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full" 
                                                style={{ 
                                                    width: `${(idx + 1) * (100 / LITERACY_LEVELS.length)}%`,
                                                    backgroundColor: idx === 0 ? '#ef4444' : idx < 3 ? '#f59e0b' : idx < 5 ? '#3b82f6' : '#10b981'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                        {groupedStudents[level]?.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                                                    <LayoutGrid className="text-gray-300" size={20} />
                                                </div>
                                                <p className="text-xs font-bold text-gray-400 uppercase">Nenhum aluno neste nível</p>
                                            </div>
                                        ) : (
                                            groupedStudents[level]?.map((student: any) => (
                                                <div key={student.id} onClick={() => { setActiveSubTab('sondagem'); handleEdit(student); }} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all group">
                                                    <p className="font-black text-gray-800 text-xs uppercase mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                                        {student.student_name}
                                                    </p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase">
                                                            Score: {student.total_score} pts
                                                        </span>
                                                        <span className="text-[9px] font-black text-gray-300 uppercase">
                                                            {new Date(student.created_at).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSubTab === 'sondagem' && (
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
