import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Printer, Calendar, Users, BookOpen, AlertTriangle, Trash2, User, UserCheck, Percent, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { SCHOOL_CLASSES, SCHOOL_SUBJECTS } from '../constants/initialData';

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

interface ConsolidatedGroup {
    date: string;
    classroom_name: string;
    records: AttendanceRecord[];
}

const SecretariatAttendanceHistory: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [uniqueTeachers, setUniqueTeachers] = useState<string[]>([]);
    const [uniqueStudents, setUniqueStudents] = useState<string[]>([]);

    // Filters
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30); // Default to last 30 days for better attendance view
        return d.toLocaleDateString('sv-SE');
    });
    const [endDate, setEndDate] = useState(new Date().toLocaleDateString('sv-SE'));
    const [filterClass, setFilterClass] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterStudent, setFilterStudent] = useState('');

    // Print State
    const [printingRecord, setPrintingRecord] = useState<AttendanceRecord | null>(null);
    const [printingBatch, setPrintingBatch] = useState(false);
    const [printingConsolidated, setPrintingConsolidated] = useState(false);
    const [printingSummary, setPrintingSummary] = useState(false);
    const [printingStudentReport, setPrintingStudentReport] = useState(false);

    const fetchRecords = async () => {
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
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (filterClass) query = query.eq('classroom_name', filterClass);
            if (filterTeacher) query = query.ilike('teacher_name', `%${filterTeacher}%`);
            if (filterSubject) query = query.ilike('subject', `%${filterSubject}%`);

            const { data, error } = await query;
            if (error) throw error;

            if (data) {
                const mapped: AttendanceRecord[] = data.map((r: any) => ({
                    id: r.id,
                    classroom_name: r.classroom_name,
                    teacher_name: r.teacher_name,
                    subject: r.subject,
                    date: r.date,
                    shift: r.shift,
                    students: (r.class_attendance_students || []).sort((a: any, b: any) => a.student_name.localeCompare(b.student_name))
                }));
                setRecords(mapped);

                // Extract unique teachers
                const teachers = Array.from(new Set(mapped.map(r => r.teacher_name))).filter(Boolean).sort();
                setUniqueTeachers(prev => Array.from(new Set([...prev, ...teachers])).sort());

                // Extract unique students
                const studentsSet = new Set<string>();
                mapped.forEach(r => {
                    r.students.forEach(s => {
                        if (s.student_name) studentsSet.add(s.student_name);
                    });
                });
                setUniqueStudents(Array.from(studentsSet).sort());
            }
        } catch (error) {
            console.error('Erro ao buscar histórico de chamadas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [startDate, endDate, filterClass]);

    const handleDelete = async (record: AttendanceRecord) => {
        const confirmDelete = window.confirm(
            `Tem certeza que deseja EXCLUIR permanentemente a chamada de ${record.classroom_name} - ${record.subject} do dia ${record.date.split('-').reverse().join('/')}?\n\nEsta ação permitirá que o professor realize o lançamento novamente.`
        );

        if (!confirmDelete) return;

        setLoading(true);
        try {
            const { error: studentError } = await supabase
                .from('class_attendance_students')
                .delete()
                .eq('attendance_record_id', record.id);

            if (studentError) throw studentError;

            const { error: recordError } = await supabase
                .from('class_attendance_records')
                .delete()
                .eq('id', record.id);

            if (recordError) throw recordError;

            alert('Chamada excluída com sucesso!');
            fetchRecords();
        } catch (error: any) {
            console.error('Erro ao excluir chamada:', error);
            alert('Erro ao excluir chamada: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (record: AttendanceRecord) => {
        setPrintingRecord(record);
        setPrintingBatch(false);
        setPrintingConsolidated(false);
        setPrintingSummary(false);
        setPrintingStudentReport(false);
        setTimeout(() => window.print(), 500);
    };

    const handlePrintAll = () => {
        if (records.length === 0) return;
        setPrintingRecord(null);
        setPrintingBatch(true);
        setPrintingConsolidated(false);
        setPrintingSummary(false);
        setPrintingStudentReport(false);
        setTimeout(() => window.print(), 500);
    };

    const handlePrintConsolidated = () => {
        if (records.length === 0) return;
        setPrintingRecord(null);
        setPrintingBatch(false);
        setPrintingConsolidated(true);
        setPrintingSummary(false);
        setPrintingStudentReport(false);
        setTimeout(() => window.print(), 500);
    };

    const handlePrintSummary = () => {
        if (records.length === 0) return;
        setPrintingRecord(null);
        setPrintingBatch(false);
        setPrintingConsolidated(false);
        setPrintingSummary(true);
        setPrintingStudentReport(false);
        setTimeout(() => window.print(), 500);
    };

    const handlePrintStudentReport = () => {
        if (!filterStudent || studentAttendanceReport.lessons.length === 0) return;
        setPrintingRecord(null);
        setPrintingBatch(false);
        setPrintingConsolidated(false);
        setPrintingSummary(false);
        setPrintingStudentReport(true);
        setTimeout(() => window.print(), 500);
    };

    // Filter records by Student search term
    const filteredRecords = useMemo(() => {
        if (!filterStudent.trim()) return records;
        const term = filterStudent.toLowerCase().trim();
        return records.filter(r => 
            r.students.some(s => 
                s.student_name.toLowerCase().includes(term) || 
                String(s.student_id).includes(term)
            )
        );
    }, [records, filterStudent]);

    // Student Specific Attendance Report Calculation
    const studentAttendanceReport = useMemo(() => {
        if (!filterStudent.trim()) {
            return { name: '', total: 0, presences: 0, absences: 0, percentage: '0.0', lessons: [], className: '' };
        }

        const term = filterStudent.toLowerCase().trim();
        let exactName = '';
        let className = '';
        const lessons: Array<{
            id: string;
            date: string;
            classroom_name: string;
            teacher_name: string;
            subject: string;
            is_present: boolean;
        }> = [];

        let presences = 0;
        let absences = 0;

        records.forEach(r => {
            const studentMatch = r.students.find(s => 
                s.student_name.toLowerCase().includes(term) || 
                String(s.student_id).includes(term)
            );

            if (studentMatch) {
                if (!exactName) exactName = studentMatch.student_name;
                if (!className) className = r.classroom_name;
                if (studentMatch.is_present) presences++;
                else absences++;

                lessons.push({
                    id: r.id,
                    date: r.date,
                    classroom_name: r.classroom_name,
                    teacher_name: r.teacher_name,
                    subject: r.subject,
                    is_present: studentMatch.is_present
                });
            }
        });

        const total = presences + absences;
        const percentage = total > 0 ? ((presences / total) * 100).toFixed(1) : '100.0';

        return {
            name: exactName || filterStudent,
            total,
            presences,
            absences,
            percentage,
            lessons: lessons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            className
        };
    }, [records, filterStudent]);

    // Calculate consolidated groups
    const consolidatedGroups: ConsolidatedGroup[] = Object.values(filteredRecords.reduce((acc, r) => {
        const key = `${r.date}-${r.classroom_name}`;
        if (!acc[key]) {
            acc[key] = { date: r.date, classroom_name: r.classroom_name, records: [] };
        }
        acc[key].records.push(r);
        return acc;
    }, {} as Record<string, ConsolidatedGroup>));

    return (
        <div className="space-y-6">
            {/* Header and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-indigo-900 uppercase tracking-tight">Histórico de Chamadas</h2>
                    <p className="text-sm text-gray-500 font-medium">Consulte e imprima os diários de presença lançados pelos professores</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {filterStudent.trim() && studentAttendanceReport.lessons.length > 0 && (
                        <button
                            onClick={handlePrintStudentReport}
                            disabled={loading}
                            className="flex-1 md:flex-none px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Printer size={16} />
                            Relatório do Aluno (PDF)
                        </button>
                    )}

                    <button
                        onClick={handlePrintSummary}
                        disabled={filteredRecords.length === 0 || loading}
                        className="flex-1 md:flex-none px-4 py-3 bg-white border border-indigo-100 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Printer size={14} />
                        Relatório Geral
                    </button>
                    <button
                        onClick={handlePrintAll}
                        disabled={filteredRecords.length === 0 || loading}
                        className="flex-1 md:flex-none px-4 py-3 bg-white border border-indigo-100 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Printer size={14} />
                        Imprimir Listagem
                    </button>
                    <button
                        onClick={handlePrintConsolidated}
                        disabled={filteredRecords.length === 0 || loading}
                        className="flex-1 md:flex-none px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Printer size={16} />
                        Diário Consolidado
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Inicial</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Final</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma</label>
                    <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs uppercase outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="">Todas as Turmas</option>
                        {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                
                {/* Novo Filtro de Aluno */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <User size={12} /> Aluno (Nome / Código)
                    </label>
                    <input
                        type="text"
                        placeholder="Digite o nome do aluno..."
                        value={filterStudent}
                        onChange={e => setFilterStudent(e.target.value)}
                        className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200 text-indigo-950 placeholder-indigo-300"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professor</label>
                    <select
                        value={filterTeacher}
                        onChange={e => setFilterTeacher(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs uppercase outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="">Todos os Professores</option>
                        {uniqueTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina / Aula</label>
                    <div className="flex gap-2">
                        <select
                            value={filterSubject}
                            onChange={e => setFilterSubject(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs uppercase outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="">Todas</option>
                            {SCHOOL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            <option value="1ª Aula">1ª Aula</option>
                            <option value="2ª Aula">2ª Aula</option>
                            <option value="3ª Aula">3ª Aula</option>
                            <option value="4ª Aula">4ª Aula</option>
                            <option value="5ª Aula">5ª Aula</option>
                        </select>
                        <button
                            onClick={fetchRecords}
                            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shrink-0"
                            title="Buscar"
                        >
                            <Search size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Painel do Aluno Filtrado */}
            {filterStudent.trim() && (
                <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-md border border-indigo-800 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-800/80 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-700 border border-indigo-600 flex items-center justify-center font-black text-lg">
                                {studentAttendanceReport.name ? studentAttendanceReport.name.substring(0, 2) : 'AL'}
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Relatório de Presença por Estudante</span>
                                <h3 className="text-xl font-black uppercase text-white tracking-tight">{studentAttendanceReport.name}</h3>
                                {studentAttendanceReport.className && (
                                    <p className="text-xs font-bold text-indigo-300 uppercase mt-0.5">Turma: {studentAttendanceReport.className}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrintStudentReport}
                                disabled={studentAttendanceReport.lessons.length === 0}
                                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                <Printer size={16} /> Emitir Relatório (PDF)
                            </button>
                            <button
                                onClick={() => setFilterStudent('')}
                                className="px-4 py-3 bg-indigo-800/60 hover:bg-indigo-800 text-indigo-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
                            >
                                Limpar Aluno
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-800/60 text-center">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Aulas Ministradas</p>
                            <p className="text-2xl font-black text-white mt-1">{studentAttendanceReport.total}</p>
                        </div>
                        <div className="bg-emerald-950/60 p-4 rounded-xl border border-emerald-800/60 text-center">
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Presenças (P)</p>
                            <p className="text-2xl font-black text-emerald-400 mt-1">{studentAttendanceReport.presences}</p>
                        </div>
                        <div className="bg-red-950/60 p-4 rounded-xl border border-red-800/60 text-center">
                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Faltas (F)</p>
                            <p className="text-2xl font-black text-red-400 mt-1">{studentAttendanceReport.absences}</p>
                        </div>
                        <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-800/60 text-center">
                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Frequência (%)</p>
                            <p className="text-2xl font-black text-white mt-1">{studentAttendanceReport.percentage}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Table */}
            <div className="bg-white border flex-1 border-gray-100 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-indigo-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                        <Search size={48} className="mb-4 text-gray-200" />
                        <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Nenhuma chamada encontrada</p>
                        <p className="text-xs mt-2">Ajuste os filtros de data, turma, aluno ou professor.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Turma</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Professor / Disciplina</th>
                                    {filterStudent.trim() ? (
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status do Aluno</th>
                                    ) : (
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Frequência</th>
                                    )}
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map(r => {
                                    const presentCount = r.students.filter(s => s.is_present).length;
                                    const absentCount = r.students.length - presentCount;

                                    const studentMatch = filterStudent.trim() 
                                        ? r.students.find(s => s.student_name.toLowerCase().includes(filterStudent.toLowerCase().trim()))
                                        : null;

                                    return (
                                        <tr key={r.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-indigo-400" />
                                                    <span className="text-xs font-bold text-gray-700">{r.date.split('-').reverse().join('/')}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Users size={14} className="text-indigo-400" />
                                                    <span className="text-xs font-bold text-gray-900 uppercase">{r.classroom_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-bold text-gray-900 uppercase">{r.teacher_name}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 flex items-center gap-1">
                                                    <BookOpen size={10} /> {r.subject}
                                                </p>
                                            </td>

                                            <td className="p-4">
                                                {studentMatch ? (
                                                    <div className="flex justify-center">
                                                        {studentMatch.is_present ? (
                                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                                                <CheckCircle2 size={12} /> Presente
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                                                <XCircle size={12} /> Faltou
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-black">
                                                            {presentCount} P
                                                        </div>
                                                        <div className="px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-black">
                                                            {absentCount} F
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handlePrint(r)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors inline-flex"
                                                        title="Imprimir Diário"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(r)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                                                        title="Excluir Lançamento"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- HIDDEN PRINT AREA --- */}
            {(printingRecord || printingBatch || printingConsolidated || printingSummary || printingStudentReport) && (
                <div className="print-area">
                    {/* IMPRESSÃO DO RELATÓRIO DO ALUNO */}
                    {printingStudentReport ? (
                        <div className="pdf-page p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {/* Cabecalho Oficial */}
                            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                                <img src="/logo-escola.png" alt="Escola André Maggi" className="h-20 object-contain" />
                                <div className="text-center flex-1 mx-4">
                                    <h1 className="text-lg font-bold uppercase tracking-tight">Escola Estadual André Antônio Maggi</h1>
                                    <h2 className="text-sm font-bold uppercase text-indigo-900 mt-1">Relatório Individual de Frequência do Estudante</h2>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Secretaria Escolar • SEDUC-MT • Colíder - MT</p>
                                </div>
                                <img src="/SEDUC 2.jpg" alt="Seduc MT" className="h-20 object-contain" />
                            </div>

                            {/* Ficha do Aluno */}
                            <div className="grid grid-cols-2 gap-4 mb-6 text-xs border-2 border-black p-4 bg-gray-50">
                                <div>
                                    <p><strong>Nome do Estudante:</strong> <span className="uppercase font-bold">{studentAttendanceReport.name}</span></p>
                                    <p className="mt-2"><strong>Turma / Ano:</strong> <span className="uppercase font-bold">{studentAttendanceReport.className || filterClass || 'Geral'}</span></p>
                                </div>
                                <div>
                                    <p><strong>Período Consultado:</strong> {startDate.split('-').reverse().join('/')} a {endDate.split('-').reverse().join('/')}</p>
                                    <p className="mt-2"><strong>Índice de Frequência Global:</strong> <span className="font-black text-sm">{studentAttendanceReport.percentage}%</span></p>
                                </div>
                            </div>

                            {/* KPI Resumo */}
                            <div className="grid grid-cols-3 gap-4 mb-6 text-center text-xs">
                                <div className="border border-black p-2 bg-gray-100">
                                    <p className="font-bold text-gray-600 uppercase text-[9px]">Aulas Ministradas</p>
                                    <p className="text-lg font-black">{studentAttendanceReport.total}</p>
                                </div>
                                <div className="border border-black p-2 bg-emerald-50">
                                    <p className="font-bold text-emerald-800 uppercase text-[9px]">Total de Presenças (P)</p>
                                    <p className="text-lg font-black text-emerald-800">{studentAttendanceReport.presences}</p>
                                </div>
                                <div className="border border-black p-2 bg-red-50">
                                    <p className="font-bold text-red-800 uppercase text-[9px]">Total de Faltas (F)</p>
                                    <p className="text-lg font-black text-red-800">{studentAttendanceReport.absences}</p>
                                </div>
                            </div>

                            {/* Tabela de Aulas do Aluno */}
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">
                                Detalhamento Diário de Aulas e Presença
                            </h3>

                            <table className="w-full border-collapse border border-black text-[10px]">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-black p-2 text-center w-8">Nº</th>
                                        <th className="border border-black p-2 text-left">Data</th>
                                        <th className="border border-black p-2 text-left">Turma</th>
                                        <th className="border border-black p-2 text-left">Componente Curricular</th>
                                        <th className="border border-black p-2 text-left">Professor(a)</th>
                                        <th className="border border-black p-2 text-center w-24">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentAttendanceReport.lessons.map((lesson, idx) => (
                                        <tr key={lesson.id + idx}>
                                            <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                                            <td className="border border-black p-1.5 font-bold">{lesson.date.split('-').reverse().join('/')}</td>
                                            <td className="border border-black p-1.5 uppercase font-bold">{lesson.classroom_name}</td>
                                            <td className="border border-black p-1.5 uppercase">{lesson.subject}</td>
                                            <td className="border border-black p-1.5 uppercase">{lesson.teacher_name}</td>
                                            <td className="border border-black p-1.5 text-center font-black">
                                                {lesson.is_present ? (
                                                    <span className="text-emerald-800">PRESENTE (P)</span>
                                                ) : (
                                                    <span className="text-red-800">FALTA (F)</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Assinaturas */}
                            <div className="mt-12 pt-8 grid grid-cols-2 gap-16 text-center text-xs">
                                <div>
                                    <div className="border-t border-black pt-2 mx-8">
                                        <p className="font-bold uppercase">Secretaria Escolar</p>
                                        <p className="text-[9px] text-gray-600 uppercase mt-1">EE André Antônio Maggi</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="border-t border-black pt-2 mx-8">
                                        <p className="font-bold uppercase">Responsável Legal pelo Estudante</p>
                                        <p className="text-[9px] text-gray-600 uppercase mt-1">Ciente do Histórico de Frequência</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-center text-[9px] text-gray-500 uppercase tracking-widest border-t border-gray-300 pt-2">
                                Relatório de Frequência Individual emitido pelo Portal Gestão Escolar — André Antônio Maggi
                            </div>
                        </div>
                    ) : printingSummary ? (
                        <div className="pdf-page p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
                            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                                <img src="/logo-escola-oficial.png" alt="Escola André Maggi" className="h-20 object-contain" />
                                <div className="text-center flex-1 mx-4">
                                    <h1 className="text-xl font-bold uppercase tracking-widest border-black inline-block pb-1 px-8">Relatório Geral de Chamadas</h1>
                                    <p className="text-sm mt-2 font-bold text-gray-600">Período: {startDate.split('-').reverse().join('/')} a {endDate.split('-').reverse().join('/')}</p>
                                </div>
                                <img src="/SEDUC 2.jpg" alt="Seduc MT" className="h-20 object-contain" />
                            </div>

                            <table className="w-full border-collapse border border-black text-xs">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-black p-2 text-left uppercase">Data</th>
                                        <th className="border border-black p-2 text-left uppercase">Turma</th>
                                        <th className="border border-black p-2 text-left uppercase">Professor</th>
                                        <th className="border border-black p-2 text-left uppercase">Disciplina</th>
                                        <th className="border border-black p-2 text-center uppercase">P</th>
                                        <th className="border border-black p-2 text-center uppercase">F</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(r => {
                                        const presentCount = r.students.filter(s => s.is_present).length;
                                        const absentCount = r.students.length - presentCount;
                                        return (
                                            <tr key={r.id}>
                                                <td className="border border-black p-2 font-bold">{r.date.split('-').reverse().join('/')}</td>
                                                <td className="border border-black p-2 uppercase font-bold">{r.classroom_name}</td>
                                                <td className="border border-black p-2 uppercase">{r.teacher_name}</td>
                                                <td className="border border-black p-2 uppercase text-gray-600">{r.subject}</td>
                                                <td className="border border-black p-2 text-center text-emerald-700 font-black">{presentCount}</td>
                                                <td className="border border-black p-2 text-center text-red-700 font-black">{absentCount}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="mt-8 text-center text-[10px] text-gray-500 uppercase tracking-widest border-t border-gray-300 pt-4">
                                Documento gerado eletronicamente pelo Portal Gestão Escolar — André Antônio Maggi
                            </div>
                        </div>
                    ) : printingConsolidated ? (
                        // CONSOLIDATED PRINT LAYOUT
                        consolidatedGroups.map((group, gIdx) => {
                            const studentMap: Record<string, { name: string, status: Record<number, boolean | null> }> = {};
                            const periods = [1, 2, 3, 4, 5];

                            group.records.forEach(record => {
                                const lessonMatch = record.subject.match(/(\d+)ª Aula/);
                                const period = lessonMatch ? parseInt(lessonMatch[1]) : null;

                                record.students.forEach(s => {
                                    if (!studentMap[s.student_id]) {
                                        studentMap[s.student_id] = { name: s.student_name, status: {} };
                                    }
                                    if (period) {
                                        studentMap[s.student_id].status[period] = s.is_present;
                                    }
                                });
                            });

                            const students = Object.entries(studentMap)
                                .map(([id, data]) => ({ id, ...data }))
                                .sort((a, b) => a.name.localeCompare(b.name));

                            return (
                                <div key={gIdx} className="pdf-page p-8" style={{ fontFamily: 'Arial, sans-serif', pageBreakAfter: 'always' }}>
                                    <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                                        <img src="/logo-escola.png" alt="Escola André Maggi" className="h-20 object-contain" />
                                        <div className="text-center flex-1 mx-4">
                                            <img src="/dados escola.jpeg" alt="Dados Escola" className="max-h-24 mx-auto mix-blend-multiply" />
                                        </div>
                                        <img src="/SEDUC 2.jpg" alt="Seduc MT" className="h-20 object-contain" />
                                    </div>

                                    <div className="text-center mb-6">
                                        <h1 className="text-xl font-bold uppercase tracking-widest border-b border-black inline-block pb-1 px-8">Diário de Controle de Frequência Consolidado</h1>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-2 border-black p-4 bg-gray-50">
                                        <p><strong>Turma:</strong> {group.classroom_name}</p>
                                        <p className="mt-2"><strong>Unidade Escolar:</strong> E.E. ANDRÉ ANTÔNIO MAGGI</p>
                                        <div>
                                            <p><strong>Data:</strong> {group.date.split('-').reverse().join('/')}</p>
                                            <p className="mt-2"><strong>Professor(a):</strong> <span className="uppercase">{group.records[0]?.teacher_name}</span></p>
                                        </div>
                                    </div>

                                    <table className="w-full border-collapse border border-black text-[10px]">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border border-black p-2 text-center w-8" rowSpan={2}>Nº</th>
                                                <th className="border border-black p-2 text-left" rowSpan={2}>NOME DO ESTUDANTE</th>
                                                <th className="border border-black p-1 text-center" colSpan={5}>AULAS DO DIA</th>
                                            </tr>
                                            <tr>
                                                {periods.map(p => (
                                                    <th key={p} className="border border-black p-1 text-center w-8">{p}ª</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student, idx) => (
                                                <tr key={student.id}>
                                                    <td className="border border-black p-1 text-center font-bold text-gray-600">{idx + 1}</td>
                                                    <td className="border border-black p-1 uppercase font-medium">{student.name}</td>
                                                    {periods.map(p => (
                                                        <td key={p} className="border border-black p-1 text-center font-bold">
                                                            {student.status[p] === true ? 'P' : student.status[p] === false ? 'F' : '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="mt-10 pt-6 grid grid-cols-2 gap-16 text-center text-sm">
                                        <div>
                                            <div className="border-t border-black pt-2 mx-8">
                                                <p className="font-bold uppercase">Secretaria Escolar</p>
                                                <p className="text-[10px] text-gray-600 uppercase mt-1">Conferência</p>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="border-t border-black pt-2 mx-8">
                                                <p className="font-bold uppercase">Visto da Coordenação</p>
                                                <p className="text-[10px] text-gray-600 uppercase mt-1">Assinatura</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 text-center text-[9px] text-gray-500 uppercase tracking-widest border-t border-gray-300 pt-2">
                                        Relatório Consolidado de Frequência Diária — Portal André Maggi
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        (printingBatch ? filteredRecords : printingRecord ? [printingRecord] : []).map((record, rIndex) => (
                            <div key={record.id} className="pdf-page p-8" style={{ fontFamily: 'Arial, sans-serif', pageBreakAfter: 'always' }}>
                                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                                    <img src="/logo-escola.png" alt="Escola André Maggi" className="h-20 object-contain" />
                                    <div className="text-center flex-1 mx-4">
                                        <img src="/dados escola.jpeg" alt="Dados Escola" className="max-h-24 mx-auto mix-blend-multiply" />
                                    </div>
                                    <img src="/SEDUC 2.jpg" alt="Seduc MT" className="h-20 object-contain" />
                                </div>

                                <div className="text-center mb-8">
                                    <h1 className="text-xl font-bold uppercase tracking-widest border-b border-black inline-block pb-1 px-8">Diário de Controle de Frequência</h1>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8 text-sm border-2 border-black p-4 bg-gray-50">
                                    <div>
                                        <p><strong>Turma:</strong> {record.classroom_name}</p>
                                        <p className="mt-2"><strong>Professor(a):</strong> <span className="uppercase">{record.teacher_name}</span></p>
                                    </div>
                                    <div>
                                        <p><strong>Data da Aula:</strong> {record.date.split('-').reverse().join('/')}</p>
                                        <p className="mt-2"><strong>Componente Curricular:</strong> <span className="uppercase">{record.subject}</span></p>
                                    </div>
                                </div>

                                <table className="w-full border-collapse border border-black text-xs">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-black p-2 text-center w-12">Nº</th>
                                            <th className="border border-black p-2 text-left">NOME DO ESTUDANTE</th>
                                            <th className="border border-black p-2 text-center w-24">PRESENTE</th>
                                            <th className="border border-black p-2 text-center w-24">FALTA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {record.students.map((student, idx) => (
                                            <tr key={student.student_id}>
                                                <td className="border border-black p-1.5 text-center font-bold text-gray-600">{idx + 1}</td>
                                                <td className="border border-black p-1.5 uppercase font-medium">{student.student_name}</td>
                                                <td className="border border-black p-1.5 text-center font-bold text-lg leading-none">
                                                    {student.is_present ? 'X' : ''}
                                                </td>
                                                <td className="border border-black p-1.5 text-center font-bold text-lg leading-none">
                                                    {!student.is_present ? 'X' : ''}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="mt-12 pt-8 grid grid-cols-2 gap-16 text-center text-sm">
                                    <div>
                                        <div className="border-t border-black pt-2 mx-8">
                                            <p className="font-bold uppercase">{record.teacher_name}</p>
                                            <p className="text-xs text-gray-600 uppercase mt-1">Professor(a) Responsável</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="border-t border-black pt-2 mx-8">
                                            <p className="font-bold uppercase">Secretaria Escolar</p>
                                            <p className="text-xs text-gray-600 uppercase mt-1">Visto / Conferência</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 text-center text-[10px] text-gray-500 uppercase tracking-widest border-t border-gray-300 pt-4">
                                    Documento gerado eletronicamente pelo Portal Gestão Escolar — André Antônio Maggi
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* CSS For Print */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media screen {
          .print-area { display: none !important; }
        }
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            display: block !important;
            background: white !important;
          }
          .no-print { display: none !important; }
          
          .pdf-page { 
            page-break-after: always !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
        }
      `}} />
        </div>
    );
};

export default SecretariatAttendanceHistory;
