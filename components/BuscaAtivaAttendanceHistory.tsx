
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    Search,
    Calendar,
    Users,
    BookOpen,
    UserX,
    UserCheck,
    Clock,
    Loader2,
    ChevronRight,
    Filter,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ShieldAlert
} from 'lucide-react';
import { SCHOOL_CLASSES } from '../constants/initialData';

interface AttendanceRecord {
    id: string;
    classroom_name: string;
    teacher_name: string;
    subject: string;
    date: string;
    shift: string;
    students: {
        student_id: string;
        student_name: string;
        is_present: boolean;
    }[];
}

const BuscaAtivaAttendanceHistory: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('');
    const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

    const fetchRecords = async () => {
        if (!selectedDate && !selectedClass) return;
        setLoading(true);
        try {
            let query = supabase
                .from('class_attendance_records')
                .select(`
          id,
          classroom_name,
          teacher_name,
          subject,
          date,
          shift,
          class_attendance_students (
            student_id,
            student_name,
            is_present
          )
        `)
                .eq('date', selectedDate);

            if (selectedClass) {
                query = query.eq('classroom_name', selectedClass);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;

            if (data) {
                const mapped: AttendanceRecord[] = data.map((r: any) => ({
                    id: r.id,
                    classroom_name: r.classroom_name,
                    teacher_name: r.teacher_name,
                    subject: r.subject,
                    date: r.date,
                    shift: r.shift,
                    students: r.class_attendance_students.sort((a: any, b: any) => a.student_name.localeCompare(b.student_name))
                }));
                setRecords(mapped);
            }
        } catch (error) {
            console.error('Erro ao buscar chamadas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('busca-ativa-attendance-audit-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'class_attendance_records' },
                () => {
                    console.log('Daily records changed, refreshing...');
                    fetchRecords();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'class_attendance_students' },
                () => {
                    console.log('Attendance students changed, refreshing...');
                    fetchRecords();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedDate, selectedClass]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* FILTER HEADER */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-end gap-6">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Calendar size={12} /> Data da Chamada
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Users size={12} /> Turma
                        </label>
                        <select
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                        >
                            <option value="">Todas as Turmas</option>
                            {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <button
                    onClick={fetchRecords}
                    className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center shrink-0"
                >
                    <Search size={24} />
                </button>
            </div>

            {/* RESULTS AREA */}
            <div className="space-y-6">
                {loading ? (
                    <div className="py-24 text-center">
                        <Loader2 className="animate-spin text-emerald-600 mx-auto" size={40} />
                        <p className="mt-4 text-gray-400 font-black uppercase text-[10px] tracking-widest">Sincronizando Diários...</p>
                    </div>
                ) : records.length > 0 ? (
                    records.map(record => {
                        const absences = record.students.filter(s => !s.is_present);
                        const presents = record.students.filter(s => s.is_present);
                        const isExpanded = expandedRecord === record.id;

                        return (
                            <div key={record.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all border-l-8 border-l-emerald-500">
                                <div
                                    className="p-8 flex flex-col lg:flex-row items-center justify-between gap-6 cursor-pointer"
                                    onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                                >
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                                            <BookOpen size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">{record.subject}</h4>
                                            <div className="flex flex-wrap items-center gap-4 mt-3">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                    <Users size={12} /> {record.classroom_name}
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                    <Clock size={12} /> {record.shift}
                                                </span>
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                                    <CheckCircle2 size={12} /> {record.teacher_name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 shrink-0">
                                        <div className="flex gap-3">
                                            <div className="text-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                                                <p className="text-lg font-black leading-none">{presents.length}</p>
                                                <p className="text-[7px] uppercase font-black mt-1">Presentes</p>
                                            </div>
                                            <div className={`text-center px-4 py-2 rounded-2xl border ${absences.length > 0 ? 'bg-red-50 text-red-700 border-red-100 animate-pulse' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                <p className="text-lg font-black leading-none">{absences.length}</p>
                                                <p className="text-[7px] uppercase font-black mt-1">Faltas</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={24} className={`text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>

                                {/* DETAILED STUDENT LIST */}
                                {isExpanded && (
                                    <div className="px-8 pb-8 animate-in slide-in-from-top duration-300">
                                        <div className="pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {record.students.map(s => (
                                                <div
                                                    key={s.student_id}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border ${s.is_present
                                                        ? 'bg-emerald-50/50 border-emerald-100/50'
                                                        : 'bg-red-50 border-red-100 shadow-sm'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-xl ${s.is_present ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                            {s.is_present ? <UserCheck size={14} /> : <UserX size={14} />}
                                                        </div>
                                                        <p className={`text-[11px] font-black uppercase ${s.is_present ? 'text-emerald-800' : 'text-red-800'}`}>
                                                            {s.student_name}
                                                        </p>
                                                    </div>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${s.is_present ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                                                        {s.is_present ? 'PRESENTE' : 'FALTA'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                        <Filter size={64} className="mx-auto mb-4 text-emerald-50" />
                        <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma chamada encontrada para este dia/turma</p>
                        <p className="text-[10px] text-gray-300 font-bold uppercase mt-2">Os dados aparecem aqui assim que os professores salvam no diário</p>
                    </div>
                )}
            </div>

            {/* FOOTER TIPS */}
            <div className="bg-emerald-950 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldAlert size={120} /></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-white/10 rounded-2xl"><AlertCircle className="text-emerald-400" /></div>
                    <div>
                        <h5 className="text-sm font-black uppercase tracking-tight">Dica de Auditoria</h5>
                        <p className="text-xs text-emerald-100/60 font-medium">Faltas em vermelho piscante indicam registros que exigem atenção imediata da Busca Ativa.</p>
                    </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 relative z-10">
                    Tempo Real Ativado
                </div>
            </div>

        </div>
    );
};

export default BuscaAtivaAttendanceHistory;
