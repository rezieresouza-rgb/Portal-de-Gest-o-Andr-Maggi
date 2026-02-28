import React, { useState, useEffect, useMemo } from 'react';
import {
    CalendarDays,
    Clock,
    Save,
    Trash2,
    Sparkles,
    Search,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Users,
    BrainCircuit
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { supabase } from '../supabaseClient';
import { Classroom, ClassSchedule, StaffMember } from '../types';
import { generateClassSchedule } from '../geminiService';

const getScheduleSettings = (className: string, shift: string) => {
    const is6or7 = className.includes('6º') || className.includes('7º') || className.includes('6') || className.includes('7');
    const isMorning = shift === 'MATUTINO';

    if (is6or7) {
        if (isMorning) {
            // 6º/7º Matutino: 07:00-11:10 | Break 08:30-08:50 (20m)
            return {
                slots: ['07:00 - 07:45', '07:45 - 08:30', '08:30 - 08:50 (Recreio)', '08:50 - 09:35', '09:35 - 10:20', '10:20 - 11:10'],
                breakIndex: 2
            };
        } else {
            // 6º/7º Vespertino: 13:00-17:10 | Break 14:30-14:50 (20m)
            return {
                slots: ['13:00 - 13:45', '13:45 - 14:30', '14:30 - 14:50 (Recreio)', '14:50 - 15:35', '15:35 - 16:20', '16:20 - 17:10'],
                breakIndex: 2
            };
        }
    } else {
        // 8º/9º Assumed
        if (isMorning) {
            // 8º/9º Matutino: Break 08:55-09:15
            return {
                slots: ['07:00 - 07:55', '07:55 - 08:55', '08:55 - 09:15 (Recreio)', '09:15 - 09:55', '09:55 - 10:35', '10:35 - 11:10'],
                breakIndex: 2
            };
        } else {
            // 8º/9º Vespertino: Break 14:55-15:15
            return {
                slots: ['13:00 - 13:55', '13:55 - 14:55', '14:55 - 15:15 (Recreio)', '15:15 - 15:55', '15:55 - 16:35', '16:35 - 17:10'],
                breakIndex: 2
            };
        }
    }
};

const WEEKDAYS = [
    { id: 1, label: 'Segunda-feira', short: 'Seg' },
    { id: 2, label: 'Terça-feira', short: 'Ter' },
    { id: 3, label: 'Quarta-feira', short: 'Qua' },
    { id: 4, label: 'Quinta-feira', short: 'Qui' },
    { id: 5, label: 'Sexta-feira', short: 'Sex' }
];

const SUBJECTS = [
    'PORTUGUÊS',
    'MATEMÁTICA',
    'HISTÓRIA',
    'GEOGRAFIA',
    'CIÊNCIAS',
    'ARTE',
    'ED. FÍSICA',
    'INGLÊS'
];

const ClassScheduleManager: React.FC = () => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
    const [teachers, setTeachers] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [activeMobileDay, setActiveMobileDay] = useState(1);
    const { addToast } = useToast();

    // Load initial data
    useEffect(() => {
        fetchClassrooms();
        fetchTeachers();
    }, []);

    // Load schedules when class changes
    useEffect(() => {
        if (selectedClassId) {
            fetchSchedules(selectedClassId);
        } else {
            setSchedules([]);
        }
    }, [selectedClassId]);

    const fetchClassrooms = async () => {
        const { data } = await supabase.from('classrooms').select('*').order('name');
        if (data) setClassrooms(data);
    };

    const fetchTeachers = async () => {
        const { data } = await supabase
            .from('staff')
            .select('*')
            .eq('role', 'PROFESSOR')
            .eq('status', 'EM_ATIVIDADE')
            .order('name');

        if (data) setTeachers(data as any);
    };

    const fetchSchedules = async (classId: string) => {
        setLoading(true);
        const { data } = await supabase
            .from('class_schedules')
            .select('*')
            .eq('classroom_id', classId);

        if (data) setSchedules(data);
        setLoading(false);
    };

    const selectedClass = classrooms.find(c => c.id === selectedClassId);

    // Memoize settings to avoid recalculating on every render
    const { slots: currentSlots, breakIndex } = useMemo(() => {
        if (!selectedClass) return { slots: [], breakIndex: -1 };
        return getScheduleSettings(selectedClass.name, selectedClass.shift);
    }, [selectedClass]);

    const handleUpdateSlot = (day: number, time: string, field: 'subject' | 'teacher_id', value: string) => {
        setSchedules(prev => {
            const existingIndex = prev.findIndex(s => s.day_of_week === day && s.time_slot === time);

            if (existingIndex >= 0) {
                // Update existing
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], [field]: value };
                return updated;
            } else {
                // Create new entry
                return [...prev, {
                    id: `temp-${Date.now()}`, // Temp ID
                    classroom_id: selectedClassId,
                    day_of_week: day,
                    time_slot: time,
                    subject: field === 'subject' ? value : '',
                    teacher_id: field === 'teacher_id' ? value : undefined,
                    teacher_name: '' // Will need mapping
                }];
            }
        });
    };

    const handleSave = async () => {
        if (!selectedClassId) return;
        setSaving(true);
        try {
            await supabase.from('class_schedules').delete().eq('classroom_id', selectedClassId);
            const payload = schedules.filter(s => s.subject || s.teacher_id).map(s => ({
                classroom_id: selectedClassId,
                day_of_week: s.day_of_week,
                time_slot: s.time_slot,
                subject: s.subject,
                teacher_id: s.teacher_id
            }));
            const { error } = await supabase.from('class_schedules').insert(payload);
            if (error) throw error;
            addToast('Horário salvo com sucesso!', 'success');
            fetchSchedules(selectedClassId);
        } catch (error) {
            console.error('Erro ao salvar horário:', error);
            addToast('Erro ao salvar horário.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!selectedClassId || !selectedClass) return;
        if (teachers.length === 0) {
            addToast("Aviso: Nenhum professor encontrado no sistema com status 'EM_ATIVIDADE' e função 'PROFESSOR'. A IA não conseguirá atribuir aulas.", 'warning');
        }
        setAiLoading(true);
        try {
            const aiResponse = await generateClassSchedule(
                selectedClass,
                teachers.map(t => ({ id: t.id, name: t.name, subjects: t.assignedSubjects })),
                currentSlots
            );

            if (aiResponse && Array.isArray(aiResponse.schedule) && aiResponse.schedule.length > 0) {
                const newSchedules: ClassSchedule[] = [];
                let matchCount = 0;

                aiResponse.schedule.forEach((item: any) => {
                    const matchedSlot = currentSlots.find(s =>
                        s === item.time ||
                        s.startsWith(item.time) || (item.time && item.time.startsWith(s.split(' ')[0]))
                    );

                    if (matchedSlot) {
                        newSchedules.push({
                            id: `ai-${Math.random()}`,
                            classroom_id: selectedClassId,
                            day_of_week: item.day,
                            time_slot: matchedSlot,
                            subject: item.subject?.toUpperCase(),
                            teacher_id: teachers.find(t =>
                                t.assignedSubjects?.some(s => s.toUpperCase() === item.subject?.toUpperCase())
                            )?.id || ''
                        });
                        matchCount++;
                    }
                });

                if (matchCount < 5) {
                    newSchedules.length = 0;
                    const validTeachingSlots = currentSlots.filter(s => !s.includes('Recreio'));
                    const itemsByDay: Record<number, any[]> = {};
                    aiResponse.schedule.forEach((item: any) => {
                        if (!itemsByDay[item.day]) itemsByDay[item.day] = [];
                        itemsByDay[item.day].push(item);
                    });

                    [1, 2, 3, 4, 5].forEach(day => {
                        const dayItems = itemsByDay[day] || [];
                        dayItems.forEach((item, index) => {
                            if (index < validTeachingSlots.length) {
                                newSchedules.push({
                                    id: `ai-seq-${Math.random()}`,
                                    classroom_id: selectedClassId,
                                    day_of_week: day,
                                    time_slot: validTeachingSlots[index],
                                    subject: item.subject?.toUpperCase(),
                                    teacher_id: teachers.find(t =>
                                        t.assignedSubjects?.some(s => s.toUpperCase() === item.subject?.toUpperCase())
                                    )?.id || ''
                                });
                            }
                        });
                    });
                }

                if (newSchedules.length > 0) {
                    setSchedules(newSchedules);
                    addToast(`Sugestão gerada com sucesso! (${newSchedules.length} aulas)`, 'success');
                } else {
                    addToast("A IA retornou dados, mas não foi possível mapear para a grade horária.", 'warning');
                }

            } else {
                addToast("A IA não retornou nenhuma sugestão. Verifique se há professores com disciplinas atribuídas.", 'warning');
            }

        } catch (error) {
            console.error("Erro na IA:", error);
            addToast("Erro ao comunicar com a IA.", 'error');
        } finally {
            setAiLoading(false);
        }
    };

    const getSlotData = (day: number, time: string) => {
        return schedules.find(s => s.day_of_week === day && s.time_slot === time);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* HEADER & CONTROLS */}
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md flex flex-col xl:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6 w-full xl:w-auto">
                    <div className="p-4 bg-violet-500/10 text-violet-400 rounded-3xl border border-violet-500/20">
                        <CalendarDays size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Grade Horária "Cronos"</h3>
                        <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão Inteligente de Aulas e Professores</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="relative w-full md:w-64">
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-violet-500/50 appearance-none uppercase [&>option]:bg-gray-900"
                        >
                            <option value="">Selecione uma Turma</option>
                            {classrooms.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.shift})</option>
                            ))}
                        </select>
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={handleGenerateAI}
                            disabled={!selectedClassId || aiLoading}
                            className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10 ${!selectedClassId ? 'bg-white/5 text-white/20 cursor-not-allowed' :
                                aiLoading ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-xl shadow-violet-600/20'
                                }`}
                        >
                            {aiLoading ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
                            {aiLoading ? 'Gerando...' : 'Sugestão IA'}
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={!selectedClassId || saving}
                            className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10 ${!selectedClassId ? 'bg-white/5 text-white/20 cursor-not-allowed' :
                                saving ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20'
                                }`}
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Salvar
                        </button>
                    </div>
                </div>
            </div>

            {selectedClassId ? (
                <>
                    {/* DESKTOP GRID */}
                    <div className="hidden lg:block overflow-x-auto pb-4 custom-scrollbar">
                        <div className="min-w-[1000px] bg-white/5 rounded-[2.5rem] border border-white/10 shadow-xl overflow-hidden backdrop-blur-md">
                            {/* GRID HEADER */}
                            <div className="grid grid-cols-6 bg-violet-900/80 text-white divide-x divide-white/10 border-b border-white/10">
                                <div className="p-6 flex items-center justify-center font-black uppercase text-xs tracking-widest">
                                    <Clock size={16} className="mr-2 opacity-50" /> Horário
                                </div>
                                {WEEKDAYS.map(day => (
                                    <div key={day.id} className="p-6 text-center">
                                        <span className="block font-black uppercase text-xs tracking-widest">{day.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* GRID BODY */}
                            <div className="divide-y divide-white/10">
                                {currentSlots.map((time, timeIdx) => {
                                    const isBreak = timeIdx === breakIndex;
                                    return (
                                        <div key={timeIdx} className={`grid grid-cols-6 divide-x divide-white/10 ${isBreak ? 'bg-amber-500/10' : 'hover:bg-white/5'}`}>

                                            {/* TIME COLUMN */}
                                            <div className="p-4 flex flex-col items-center justify-center text-center">
                                                <span className={`font-black text-xs uppercase ${isBreak ? 'text-amber-400' : 'text-white/60'}`}>{time}</span>
                                            </div>

                                            {/* DAYS COLUMNS */}
                                            {WEEKDAYS.map(day => {
                                                if (isBreak) {
                                                    return (
                                                        <div key={day.id} className="p-4 flex items-center justify-center">
                                                            <span className="text-[10px] font-black text-amber-400 tracking-[0.2em] uppercase">Intervalo</span>
                                                        </div>
                                                    );
                                                }
                                                const slotData = getSlotData(day.id, time);
                                                return (
                                                    <div key={day.id} className="p-2 space-y-2 relative group">
                                                        <select
                                                            value={slotData?.subject || ''}
                                                            onChange={(e) => handleUpdateSlot(day.id, time, 'subject', e.target.value)}
                                                            className="w-full text-[10px] font-black uppercase bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-300 focus:ring-1 focus:ring-violet-400 cursor-pointer outline-none [&>option]:bg-gray-900"
                                                        >
                                                            <option value="">- Disciplina -</option>
                                                            {SUBJECTS.map(subj => (
                                                                <option key={subj} value={subj}>{subj}</option>
                                                            ))}
                                                        </select>

                                                        <select
                                                            value={slotData?.teacher_id || ''}
                                                            onChange={(e) => handleUpdateSlot(day.id, time, 'teacher_id', e.target.value)}
                                                            className="w-full text-[9px] font-bold uppercase text-white/40 border-none bg-transparent focus:ring-0 cursor-pointer text-center outline-none [&>option]:bg-gray-900"
                                                        >
                                                            <option value="">- Professor -</option>
                                                            {teachers.map(t => (
                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* MOBILE LIST VIEW */}
                    <div className="lg:hidden space-y-6">
                        {/* Day Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-4 pt-2 no-scrollbar">
                            {WEEKDAYS.map(day => (
                                <button
                                    key={day.id}
                                    onClick={() => setActiveMobileDay(day.id)}
                                    className={`px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest whitespace-nowrap transition-all border ${activeMobileDay === day.id
                                        ? 'bg-violet-600 text-white border-violet-500 shadow-lg'
                                        : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>

                        {/* Selected Day Slots */}
                        <div className="space-y-4">
                            {currentSlots.map((time, timeIdx) => {
                                const isBreak = timeIdx === breakIndex;
                                const slotData = getSlotData(activeMobileDay, time);

                                if (isBreak) {
                                    return (
                                        <div key={timeIdx} className="p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center">
                                            <p className="text-amber-400 font-black uppercase tracking-widest text-xs mb-1">Intervalo</p>
                                            <p className="text-amber-400/60 text-[10px] font-bold uppercase">{time}</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={timeIdx} className="bg-white/5 p-5 rounded-3xl border border-white/10 backdrop-blur-md">
                                        <div className="flex items-center gap-3 mb-4 opacity-50">
                                            <Clock size={14} />
                                            <p className="text-xs font-black uppercase tracking-widest">{time}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <select
                                                value={slotData?.subject || ''}
                                                onChange={(e) => handleUpdateSlot(activeMobileDay, time, 'subject', e.target.value)}
                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-violet-500/50 [&>option]:bg-gray-900"
                                            >
                                                <option value="">- Selecione a Disciplina -</option>
                                                {SUBJECTS.map(subj => (
                                                    <option key={subj} value={subj}>{subj}</option>
                                                ))}
                                            </select>

                                            <select
                                                value={slotData?.teacher_id || ''}
                                                onChange={(e) => handleUpdateSlot(activeMobileDay, time, 'teacher_id', e.target.value)}
                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase text-white/60 outline-none focus:bg-white/10 focus:ring-2 focus:ring-violet-500/50 [&>option]:bg-gray-900"
                                            >
                                                <option value="">- Selecione o Professor -</option>
                                                {teachers.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            ) : (
                /* EMPTY STATE */
                <div className="py-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-white/20 border border-white/10">
                        <CalendarDays size={48} />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Nenhuma Turma Selecionada</h3>
                    <p className="text-white/40 text-xs mt-2 max-w-md">Selecione uma turma acima para visualizar ou editar a grade horária semanal.</p>
                </div>
            )}
        </div>
    );
};

export default ClassScheduleManager;
