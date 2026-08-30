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
            return {
                slots: ['07:00 - 07:45', '07:45 - 08:30', '08:30 - 08:50 (Recreio)', '08:50 - 09:35', '09:35 - 10:20', '10:20 - 11:10'],
                breakIndex: 2
            };
        } else {
            return {
                slots: ['13:00 - 13:45', '13:45 - 14:30', '14:30 - 14:50 (Recreio)', '14:50 - 15:35', '15:35 - 16:20', '16:20 - 17:10'],
                breakIndex: 2
            };
        }
    } else {
        if (isMorning) {
            return {
                slots: ['07:00 - 07:55', '07:55 - 08:55', '08:55 - 09:15 (Recreio)', '09:15 - 09:55', '09:55 - 10:35', '10:35 - 11:10'],
                breakIndex: 2
            };
        } else {
            return {
                slots: ['13:00 - 13:55', '13:55 - 14:55', '14:55 - 15:15 (Recreio)', '15:15 - 15:55', '15:55 - 16:35', '16:35 - 17:10'],
                breakIndex: 2
            };
        }
    }
};

const WEEKDAYS = [
    { id: 'SEGUNDA', label: 'Segunda-Feira' },
    { id: 'TERCA', label: 'Terça-Feira' },
    { id: 'QUARTA', label: 'Quarta-Feira' },
    { id: 'QUINTA', label: 'Quinta-Feira' },
    { id: 'SEXTA', label: 'Sexta-Feira' },
];

const SUBJECTS = [
    'LÍNGUA PORTUGUESA',
    'MATEMÁTICA',
    'CIÊNCIAS',
    'HISTÓRIA',
    'GEOGRAFIA',
    'ARTE',
    'EDUCAÇÃO FÍSICA',
    'LÍNGUA INGLESA',
    'PROJETO DE VIDA',
    'TECNOLOGIA E ROBÓTICA',
    'ELETIVA'
];

const ClassScheduleManager: React.FC = () => {
    const { addToast } = useToast();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [teachers, setTeachers] = useState<StaffMember[]>([]);
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [generatingAI, setGeneratingAI] = useState<boolean>(false);
    const [activeMobileDay, setActiveMobileDay] = useState<string>('SEGUNDA');

    const selectedClassroom = useMemo(() => {
        return classrooms.find(c => c.id === selectedClassId);
    }, [classrooms, selectedClassId]);

    const { slots: currentSlots, breakIndex } = useMemo(() => {
        if (!selectedClassroom) return { slots: [], breakIndex: -1 };
        return getScheduleSettings(selectedClassroom.name, selectedClassroom.shift);
    }, [selectedClassroom]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const { data: classData } = await supabase.from('classrooms').select('*').order('name');
                if (classData && classData.length > 0) {
                    setClassrooms(classData);
                    setSelectedClassId(classData[0].id);
                }

                const { data: staffData } = await supabase.from('staff').select('*').order('name');
                if (staffData) {
                    setTeachers(staffData.filter(s => s.role === 'PROFESSOR' || s.role === 'PROFESSOR_SUBSTITUTO'));
                }
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedClassId) return;

        const fetchSchedules = async () => {
            const { data, error } = await supabase
                .from('class_schedules')
                .select('*')
                .eq('classroom_id', selectedClassId);

            if (error) {
                console.error("Erro ao carregar horário:", error);
            } else if (data) {
                setSchedules(data);
            }
        };

        fetchSchedules();
    }, [selectedClassId]);

    const handleUpdateSlot = (day: string, timeSlot: string, field: 'subject' | 'teacher_id', value: string) => {
        setSchedules(prev => {
            const existingIndex = prev.findIndex(s => s.weekday === day && s.time_slot === timeSlot);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    [field]: value
                };
                return updated;
            } else {
                return [...prev, {
                    classroom_id: selectedClassId,
                    weekday: day,
                    time_slot: timeSlot,
                    subject: field === 'subject' ? value : '',
                    teacher_id: field === 'teacher_id' ? value : ''
                }];
            }
        });
    };

    const handleSaveSchedule = async () => {
        if (!selectedClassId) return;
        setSaving(true);
        try {
            await supabase.from('class_schedules').delete().eq('classroom_id', selectedClassId);

            const validSchedules = schedules
                .filter(s => s.classroom_id === selectedClassId && (s.subject || s.teacher_id))
                .map(s => ({
                    classroom_id: selectedClassId,
                    weekday: s.weekday,
                    time_slot: s.time_slot,
                    subject: s.subject || '',
                    teacher_id: s.teacher_id || null
                }));

            if (validSchedules.length > 0) {
                const { error } = await supabase.from('class_schedules').insert(validSchedules);
                if (error) throw error;
            }

            addToast("Quadro de horários salvo com sucesso!", "success");
        } catch (err) {
            console.error("Erro ao salvar horário:", err);
            addToast("Erro ao salvar quadro de horários.", "error");
        } finally {
            setSaving(false);
        }
    };

    const getSlotData = (day: string, timeSlot: string) => {
        return schedules.find(s => s.weekday === day && s.time_slot === timeSlot);
    };

    if (loading) {
        return (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Carregando quadro de horários...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* HEADER CONTROLS */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-100 text-indigo-700 rounded-2xl">
                        <Clock size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Quadro de Horários (Cronos)</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">Gestão da Matriz Semanal de Aulas</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white cursor-pointer"
                    >
                        {classrooms.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({c.shift})
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleSaveSchedule}
                        disabled={saving}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        {saving ? 'Salvando...' : 'Salvar Grade'}
                    </button>
                </div>
            </div>

            {selectedClassroom ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="hidden lg:block overflow-x-auto">
                        <div className="min-w-[900px]">
                            {/* GRID HEADER */}
                            <div className="grid grid-cols-6 bg-slate-900 text-white divide-x divide-slate-800">
                                <div className="p-4 text-center">
                                    <span className="block font-black uppercase text-xs tracking-wider">Horário</span>
                                </div>
                                {WEEKDAYS.map(day => (
                                    <div key={day.id} className="p-4 text-center">
                                        <span className="block font-black uppercase text-xs tracking-wider">{day.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* GRID BODY */}
                            <div className="divide-y divide-slate-200">
                                {currentSlots.map((time, timeIdx) => {
                                    const isBreak = timeIdx === breakIndex;
                                    return (
                                        <div key={timeIdx} className={`grid grid-cols-6 divide-x divide-slate-200 ${isBreak ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                                            {/* TIME COLUMN */}
                                            <div className="p-3 flex items-center justify-center text-center">
                                                <span className={`font-black text-xs uppercase ${isBreak ? 'text-amber-800' : 'text-slate-700'}`}>{time}</span>
                                            </div>

                                            {/* DAYS COLUMNS */}
                                            {WEEKDAYS.map(day => {
                                                if (isBreak) {
                                                    return (
                                                        <div key={day.id} className="p-3 flex items-center justify-center">
                                                            <span className="text-[10px] font-black text-amber-800 tracking-wider uppercase">Intervalo</span>
                                                        </div>
                                                    );
                                                }
                                                const slotData = getSlotData(day.id, time);
                                                return (
                                                    <div key={day.id} className="p-2 space-y-1.5">
                                                        <select
                                                            value={slotData?.subject || ''}
                                                            onChange={(e) => handleUpdateSlot(day.id, time, 'subject', e.target.value)}
                                                            className="w-full text-[10px] font-black uppercase bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 outline-none p-1.5 cursor-pointer"
                                                        >
                                                            <option value="">- Disciplina -</option>
                                                            {SUBJECTS.map(subj => (
                                                                <option key={subj} value={subj}>{subj}</option>
                                                            ))}
                                                        </select>

                                                        <select
                                                            value={slotData?.teacher_id || ''}
                                                            onChange={(e) => handleUpdateSlot(day.id, time, 'teacher_id', e.target.value)}
                                                            className="w-full text-[9px] font-bold uppercase text-slate-500 border border-slate-200 bg-white rounded-lg p-1 text-center outline-none cursor-pointer"
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
                </div>
            ) : null}
        </div>
    );
};

export default ClassScheduleManager;
