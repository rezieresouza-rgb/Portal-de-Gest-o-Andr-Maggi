import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Printer, Calendar, Users, BookOpen, AlertTriangle } from 'lucide-react';
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

const SecretariatAttendanceHistory: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [uniqueTeachers, setUniqueTeachers] = useState<string[]>([]);

    // Filters
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7); // Default to last 7 days
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterClass, setFilterClass] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterSubject, setFilterSubject] = useState('');

    // Print State
    const [printingRecord, setPrintingRecord] = useState<AttendanceRecord | null>(null);
    const [printingBatch, setPrintingBatch] = useState(false);

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
                    students: r.class_attendance_students.sort((a: any, b: any) => a.student_name.localeCompare(b.student_name))
                }));
                setRecords(mapped);

                // Extract unique teachers from the fetched records for the dropdown
                const teachers = Array.from(new Set(mapped.map(r => r.teacher_name))).filter(Boolean).sort();
                setUniqueTeachers(prev => {
                    // Merge existing list with fetched ones to maintain list even if filtered out
                    return Array.from(new Set([...prev, ...teachers])).sort();
                });
            }
        } catch (error) {
            console.error('Erro ao buscar histórico de chamadas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and fetch on filter blur/enter
    useEffect(() => {
        fetchRecords();
    }, [startDate, endDate, filterClass]);

    const handlePrint = (record: AttendanceRecord) => {
        setPrintingRecord(record);
        setPrintingBatch(false);
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const handlePrintAll = () => {
        if (records.length === 0) return;
        setPrintingRecord(null);
        setPrintingBatch(true);
        setTimeout(() => {
            window.print();
        }, 500);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-indigo-900 uppercase tracking-tight">Histórico de Chamadas</h2>
                    <p className="text-sm text-gray-500 font-medium">Consulte e imprima os diários de presença lançados pelos professores</p>
                </div>
                <button
                    onClick={handlePrintAll}
                    disabled={records.length === 0 || loading}
                    className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Printer size={16} />
                    Imprimir Filtradas
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Inicial</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Final</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma</label>
                    <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs uppercase outline-none"
                    >
                        <option value="">Todas</option>
                        {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professor</label>
                    <select
                        value={filterTeacher}
                        onChange={e => setFilterTeacher(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs uppercase outline-none"
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
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs uppercase outline-none"
                        >
                            <option value="">Todas</option>
                            {SCHOOL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            <option value="1ª Aula">Filtrar por: 1ª Aula</option>
                            <option value="2ª Aula">Filtrar por: 2ª Aula</option>
                            <option value="3ª Aula">Filtrar por: 3ª Aula</option>
                            <option value="4ª Aula">Filtrar por: 4ª Aula</option>
                            <option value="5ª Aula">Filtrar por: 5ª Aula</option>
                        </select>
                        <button
                            onClick={fetchRecords}
                            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            <Search size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="bg-white border flex-1 border-gray-100 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-indigo-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                        <Search size={48} className="mb-4 text-gray-200" />
                        <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Nenhuma chamada encontrada</p>
                        <p className="text-xs mt-2">Ajuste os filtros de data, turma ou professor.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Turma</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Professor / Disciplina</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Frequência</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(r => {
                                    const presentCount = r.students.filter(s => s.is_present).length;
                                    const absentCount = r.students.length - presentCount;

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
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-black">
                                                        {presentCount} P
                                                    </div>
                                                    <div className="px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-black">
                                                        {absentCount} F
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handlePrint(r)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors inline-flex"
                                                    title="Imprimir Diário"
                                                >
                                                    <Printer size={16} />
                                                </button>
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
            {(printingRecord || printingBatch) && (
                <div className="print-area hidden">
                    {(printingBatch ? records : printingRecord ? [printingRecord] : []).map((record, rIndex) => (
                        <div key={record.id} className="pdf-page p-8" style={{ fontFamily: 'Arial, sans-serif', pageBreakAfter: 'always' }}>
                            {/* Cabecalho Oficial */}
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
                    ))}
                </div>
            )}

            {/* CSS For Print */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />
        </div>
    );
};

export default SecretariatAttendanceHistory;
