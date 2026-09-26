
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
            
                {activeSubTab === 'diario' && (
                    <div className="p-8 max-w-5xl mx-auto space-y-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <CalendarCheck size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 uppercase">Diário de Bordo TaRL</h2>
                                    <p className="text-sm font-medium text-gray-400">Registre a frequência e a intervenção do agrupamento.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Data do Encontro</label>
                                    <input 
                                        type="date" 
                                        value={logDate}
                                        onChange={e => setLogDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nível de Proficiência (Agrupamento)</label>
                                    <select 
                                        value={selectedLevel}
                                        onChange={e => setSelectedLevel(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-gray-700"
                                    >
                                        {LITERACY_LEVELS.map(lvl => (
                                            <option key={lvl} value={lvl}>{lvl} ({groupedStudents[lvl]?.length || 0} alunos)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Lista de Frequência do Grupo</label>
                                <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                                    {(!groupedStudents[selectedLevel] || groupedStudents[selectedLevel].length === 0) ? (
                                        <div className="p-6 text-center text-gray-400 font-bold text-sm">Nenhum aluno neste agrupamento.</div>
                                    ) : (
                                        <div className="divide-y divide-gray-200">
                                            {groupedStudents[selectedLevel].map((student: any) => (
                                                <div key={student.student_name} className="flex justify-between items-center p-4 bg-white">
                                                    <span className="font-bold text-sm text-gray-700 uppercase">{student.student_name}</span>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => setAttendance({...attendance, [student.student_name]: true})}
                                                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${attendance[student.student_name] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                        >
                                                            Presente
                                                        </button>
                                                        <button 
                                                            onClick={() => setAttendance({...attendance, [student.student_name]: false})}
                                                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${!attendance[student.student_name] ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                        >
                                                            Falta
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sequência Didática / Intervenção Pedagógica</label>
                                <textarea 
                                    rows={4}
                                    value={intervention}
                                    onChange={e => setIntervention(e.target.value)}
                                    placeholder="Descreva as atividades, habilidades trabalhadas e metodologias utilizadas no laboratório APA de hoje..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-medium text-gray-700 resize-none"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveLog}
                                    disabled={!groupedStudents[selectedLevel] || groupedStudents[selectedLevel].length === 0}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={18} /> Salvar Diário
                                </button>
                            </div>
                        </div>

                        {/* Histórico Recente */}
                        <div className="mt-8">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Histórico de Atendimentos</h3>
                            <div className="space-y-4">
                                {logs.map(log => (
                                    <div key={log.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase">{new Date(log.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                                            <span className="text-lg font-black text-indigo-600 leading-none">{new Date(log.date).getDate()}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-black uppercase">{log.level}</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600 line-clamp-2">{log.intervention}</p>
                                        </div>
                                        <div className="flex flex-col sm:items-end flex-shrink-0 text-left sm:text-right">
                                            <span className="text-xs font-black text-gray-900">{Object.values(log.attendance).filter(Boolean).length} Presentes</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Prof: {log.teacherName}</span>
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <p className="text-center text-sm font-medium text-gray-400 py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        Nenhum diário registrado ainda.
                                    </p>
                                )}
                            </div>
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
