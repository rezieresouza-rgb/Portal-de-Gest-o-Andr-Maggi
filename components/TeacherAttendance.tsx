import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Users,
  Save,
  Check,
  X,
  Loader2,
  AlertTriangle,
  History,
  Trash2,
  Calendar,
  Clock,
  ArrowLeft,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Percent,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { Shift, User as UserType } from '../types';
import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES } from '../constants/initialData';

const CLASSES = SCHOOL_CLASSES;

const SUBJECTS = [
  "MATEMÁTICA", "LÍNGUA PORTUGUESA", "CIÊNCIAS", "HISTÓRIA", "GEOGRAFIA",
  "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA", "APA"
];

interface TeacherAttendanceProps {
  user: UserType;
  initialViewMode?: 'form' | 'history';
}

const TeacherAttendance: React.FC<TeacherAttendanceProps> = ({ user, initialViewMode = 'form' }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedShift, setSelectedShift] = useState<Shift>('MATUTINO');
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [isSaving, setIsSaving] = useState(false);
  const [existingRecordIds, setExistingRecordIds] = useState<Record<number, string>>({});
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  // Histórico
  const [viewMode, setViewMode] = useState<'form' | 'history'>(initialViewMode);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([1]); // Default 1st period

  const [students, setStudents] = useState<any[]>([]);
  // Record<studentId, Record<period, isPresent>>
  const [attendance, setAttendance] = useState<Record<string, Record<number, boolean>>>({});

  const [otherAttendance, setOtherAttendance] = useState<Record<string, { subject: string, isPresent: boolean, teacher: string }[]>>({});
  const [riskStats, setRiskStats] = useState<Record<string, { total: number, absences: number, percentage: number }>>({});
  const [studentMovements, setStudentMovements] = useState<Record<string, any[]>>({});
  const [selectedPaedeStudent, setSelectedPaedeStudent] = useState<any | null>(null);

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
      if (initialViewMode === 'history') {
        fetchHistory();
      }
    }
  }, [initialViewMode]);

  // Reset attendance when periods change
  useEffect(() => {
    if (students.length > 0) {
      const initialAttendance: Record<string, Record<number, boolean>> = {};
      students.forEach(s => {
        initialAttendance[s.CodigoAluno] = { ...(attendance[s.CodigoAluno] || {}) };
        selectedPeriods.forEach(p => {
          if (initialAttendance[s.CodigoAluno][p] === undefined) {
            initialAttendance[s.CodigoAluno][p] = true; // Default present for newly selected periods
          }
        });
      });
      setAttendance(initialAttendance);
    }
  }, [selectedPeriods, students]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsAndAttendance();
    } else {
      setStudents([]);
      setOtherAttendance({});
      setRiskStats({});
      setExistingRecordIds({});
    }
  }, [selectedClass, date, selectedSubject]);

  const fetchStudentsAndAttendance = async () => {
    const loadedStudents = await fetchStudentsFromDB(selectedClass);
    if (loadedStudents && loadedStudents.length > 0) {
      await loadExistingAttendance(loadedStudents);
      fetchRiskStats(selectedClass);
    }
  };

  const fetchHistory = async () => {
    setIsFetchingHistory(true);
    try {
      let query = supabase
        .from('class_attendance_records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // Se não for perfil de gestão/coordenação geral, filtra pelo professor logado
      if (user?.name && user?.role !== 'ADMIN' && user?.role !== 'GESTAO' && user?.role !== 'COORDENACAO') {
        query = query.eq('teacher_name', user.name);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAttendanceHistory(data || []);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'history') {
      fetchHistory();
    }
  }, [viewMode, user?.name]);

  const loadExistingAttendance = async (studentList: any[]) => {
    setIsLoadingExisting(true);
    try {
      const recordsMap: Record<number, string> = {};
      const attendanceState: Record<string, Record<number, boolean>> = {};

      studentList.forEach(s => {
        attendanceState[s.CodigoAluno] = {};
        [1, 2, 3, 4, 5].forEach(p => {
          attendanceState[s.CodigoAluno][p] = true;
        });
      });

      const { data: records, error } = await supabase
        .from('class_attendance_records')
        .select(`
          id,
          subject,
          class_attendance_students (
            student_id,
            is_present
          )
        `)
        .eq('classroom_name', selectedClass)
        .eq('date', date)
        .ilike('subject', `${selectedSubject}%`);

      if (error) throw error;

      if (records && records.length > 0) {
        records.forEach((record: any) => {
          const match = record.subject.match(/(\d+)ª Aula/);
          if (match) {
            const periodNum = parseInt(match[1]);
            recordsMap[periodNum] = record.id;

            if (record.class_attendance_students) {
              record.class_attendance_students.forEach((st: any) => {
                if (attendanceState[st.student_id]) {
                  attendanceState[st.student_id][periodNum] = st.is_present;
                }
              });
            }
          }
        });
      }

      setExistingRecordIds(recordsMap);
      setAttendance(attendanceState);

    } catch (err) {
      console.error("Error checking existing attendance:", err);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const fetchStudentsFromDB = async (className: string) => {
    try {
      const { data: classData, error: classError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('name', className)
        .maybeSingle();

      if (classError) throw classError;

      if (!classData) {
        setStudents([]);
        return [];
      }

      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          status,
          adjustment_date,
          students (
            id,
            name,
            registration_number,
            paed,
            school_transport
          )
        `)
        .eq('classroom_id', classData.id);

      if (enrollError) throw enrollError;

      if (enrollments) {
        const mappedStudents = enrollments.map((e: any) => ({
          CodigoAluno: e.students.registration_number,
          Nome: e.students.name,
          Turma: className,
          id: e.students.id,
          status: e.status || 'ATIVO',
          adjustment_date: e.adjustment_date,
          PAED: e.students.paed ? 'Sim' : 'Não',
          TransporteEscolar: e.students.school_transport ? 'Sim' : 'Não'
        })).sort((a: any, b: any) => a.Nome.localeCompare(b.Nome));

        setStudents(mappedStudents);
        fetchCrossAttendance(className, date);
        fetchStudentsMovements(mappedStudents.map(s => s.id));
        return mappedStudents;
      }
      return [];
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Erro ao buscar alunos da turma. Verifique a conexão.');
      return [];
    }
  };

  const fetchRiskStats = async (classroom: string) => {
    const { data } = await supabase
      .from('class_attendance_students')
      .select('student_id, is_present, class_attendance_records!inner(classroom_name)')
      .eq('class_attendance_records.classroom_name', classroom);

    if (data) {
      const stats: Record<string, { total: number, present: number }> = {};
      data.forEach((r: any) => {
        if (!stats[r.student_id]) stats[r.student_id] = { total: 0, present: 0 };
        stats[r.student_id].total++;
        if (r.is_present) stats[r.student_id].present++;
      });

      const risks: Record<string, any> = {};
      Object.keys(stats).forEach(sid => {
        const s = stats[sid];
        const pct = (s.present / s.total) * 100;
        if (pct < 85) {
          risks[sid] = { total: s.total, absences: s.total - s.present, percentage: pct };
        }
      });
      setRiskStats(risks);
    }
  };

  const fetchStudentsMovements = async (studentIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('student_movements')
        .select('*')
        .in('student_id', studentIds);

      if (error) throw error;

      const movementMap: Record<string, any[]> = {};
      data?.forEach(mov => {
        if (!movementMap[mov.student_id]) movementMap[mov.student_id] = [];
        movementMap[mov.student_id].push(mov);
      });
      setStudentMovements(movementMap);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const fetchCrossAttendance = async (classroom: string, selectedDate: string) => {
    const { data: records } = await supabase
      .from('class_attendance_records')
      .select(`
        id,
        subject,
        teacher_name,
        class_attendance_students (
          student_id,
          is_present
        )
      `)
      .eq('classroom_name', classroom)
      .eq('date', selectedDate);

    if (records) {
      const map: Record<string, { subject: string, isPresent: boolean, teacher: string }[]> = {};

      records.forEach((rec: any) => {
        rec.class_attendance_students.forEach((s: any) => {
          if (!map[s.student_id]) map[s.student_id] = [];
          map[s.student_id].push({
            subject: rec.subject,
            teacher: rec.teacher_name,
            isPresent: s.is_present
          });
        });
      });
      setOtherAttendance(map);
    }
  };

  const togglePeriodSelection = (period: number) => {
    setSelectedPeriods(prev =>
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period].sort()
    );
  };

  const toggleAttendance = (id: string, period: number) => {
    if (!selectedPeriods.includes(period)) return; 
    
    const student = students.find(st => st.CodigoAluno === id);
    if (student && student.status !== 'ATIVO') return;

    setAttendance(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [period]: !(prev[id]?.[period] ?? true)
      }
    }));
  };

  const markAll = (status: boolean) => {
    const updated = { ...attendance };
    students.forEach(s => {
      if (s.status === 'ATIVO') {
        selectedPeriods.forEach(p => {
          if (!updated[s.CodigoAluno]) updated[s.CodigoAluno] = {};
          updated[s.CodigoAluno][p] = status;
        });
      }
    });
    setAttendance(updated);
  };

  const invertAll = () => {
    const updated = { ...attendance };
    students.forEach(s => {
      if (s.status === 'ATIVO') {
        selectedPeriods.forEach(p => {
          if (!updated[s.CodigoAluno]) updated[s.CodigoAluno] = {};
          updated[s.CodigoAluno][p] = !(updated[s.CodigoAluno][p] ?? true);
        });
      }
    });
    setAttendance(updated);
  };

  const liveAttendanceStats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'ATIVO');
    const totalSlots = activeStudents.length * (selectedPeriods.length || 1);
    if (totalSlots === 0) return { presents: 0, absences: 0, percentage: 100, activeCount: 0 };

    let totalPresents = 0;
    activeStudents.forEach(s => {
      selectedPeriods.forEach(p => {
        if (attendance[s.CodigoAluno]?.[p] ?? true) totalPresents++;
      });
    });

    const totalAbsences = totalSlots - totalPresents;
    const percentage = totalSlots > 0 ? Math.round((totalPresents / totalSlots) * 100) : 100;

    return {
      presents: totalPresents,
      absences: totalAbsences,
      percentage,
      activeCount: activeStudents.length
    };
  }, [students, selectedPeriods, attendance]);

  const handleSave = async () => {
    if (!selectedClass) return alert("Selecione uma turma.");
    if (selectedPeriods.length === 0) return alert("Selecione pelo menos uma aula que você ministrou.");
    setIsSaving(true);

    try {
      for (const period of selectedPeriods) {
        const periodSubject = `${selectedSubject} - ${period}ª Aula`;
        let recordId = existingRecordIds[period];

        if (!recordId) {
          const { data: existing } = await supabase
            .from('class_attendance_records')
            .select('id')
            .eq('classroom_name', selectedClass)
            .eq('date', date)
            .eq('subject', periodSubject)
            .maybeSingle();

          if (existing) {
            recordId = existing.id;
          } else {
            const { data: recordData, error: recordError } = await supabase
              .from('class_attendance_records')
              .insert([
                {
                  classroom_name: selectedClass,
                  teacher_name: user.name,
                  date: date,
                  shift: selectedShift,
                  subject: periodSubject
                }
              ])
              .select()
              .single();

            if (recordError) throw recordError;
            recordId = recordData.id;
          }
        }

        const activeStudentsToSave = students.filter(s => {
          const studentStatus = s.status || '';
          const adjDate = s.adjustment_date;
          const isBlocked = studentStatus !== 'ATIVO' && (!adjDate || date >= adjDate);
          return !isBlocked;
        });

        const studentRecords = activeStudentsToSave.map(s => ({
          attendance_record_id: recordId,
          student_id: s.CodigoAluno,
          student_name: s.Nome,
          is_present: attendance[s.CodigoAluno]?.[period] ?? true
        }));

        if (studentRecords.length > 0) {
          const { error: studentsError } = await supabase
            .from('class_attendance_students')
            .upsert(studentRecords, { onConflict: 'attendance_record_id, student_id' });

          if (studentsError) throw studentsError;
        }
      }

      alert(Object.keys(existingRecordIds).length > 0
        ? "Diário de Presença atualizado com sucesso!"
        : "Chamada realizada e sincronizada com a Coordenação!"
      );
      fetchStudentsAndAttendance();

    } catch (error) {
      console.error('Erro ao salvar chamada:', error);
      alert("Erro ao salvar chamada. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (recordIds: string[]) => {
    if (!window.confirm("Deseja realmente excluir este diário de chamada?")) return;
    try {
      for (const id of recordIds) {
        await supabase.from('class_attendance_students').delete().eq('attendance_record_id', id);
        await supabase.from('class_attendance_records').delete().eq('id', id);
      }
      alert("Registro excluído com sucesso.");
      fetchHistory();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir registro.");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 no-print">
      
      {/* HEADER PRINCIPAL COM ALTERNADOR DE MODO */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UserCheck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">Diário Eletrônico SEDUC</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">Presença & Frequência</h2>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setViewMode('form')}
            className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              viewMode === 'form' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <UserCheck size={16} /> Fazer Chamada
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              viewMode === 'history' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <History size={16} /> Histórico de Chamadas
          </button>
        </div>
      </div>

      {viewMode === 'form' ? (
        <>
          {/* BARRA DE SELEÇÃO DE TURMA E AULAS */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turma Escolar</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Selecione a Turma...</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Componente Curricular</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data da Aula</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turno</label>
                <select
                  value={selectedShift}
                  onChange={e => setSelectedShift(e.target.value as Shift)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="MATUTINO">Matutino</option>
                  <option value="VESPERTINO">Vespertino</option>
                </select>
              </div>
            </div>

            {/* SELETOR DE AULAS MINISTRADAS E BOTÃO SALVAR */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-t border-slate-100 pt-6">
              <div className="space-y-2 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Aulas Ministradas Hoje:
                  </span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-bold">
                    {selectedPeriods.length} selecionada(s)
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(period => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => togglePeriodSelection(period)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        selectedPeriods.includes(period)
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {period}ª Aula
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || students.length === 0 || isLoadingExisting}
                className={`w-full lg:w-auto px-8 py-4 ${
                  Object.keys(existingRecordIds).length > 0 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/20'
                } text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 shrink-0`}
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : (Object.keys(existingRecordIds).length > 0 ? <Check size={18} /> : <Save size={18} />)}
                {isLoadingExisting ? 'Carregando...' : (Object.keys(existingRecordIds).length > 0 ? 'Atualizar Diário' : 'Salvar Diário de Presença')}
              </button>
            </div>
          </div>

          {/* LISTA DE ALUNOS DA TURMA */}
          {students.length > 0 ? (
            <div className="space-y-4">
              
              {/* LIVE STATS BAR DA TURMA */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alunos Ativos</span>
                    <p className="text-xl font-black text-slate-900">{liveAttendanceStats.activeCount}</p>
                  </div>
                  <div className="border-l border-slate-200 pl-6">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Presentes</span>
                    <p className="text-xl font-black text-emerald-600">{liveAttendanceStats.presents}</p>
                  </div>
                  <div className="border-l border-slate-200 pl-6">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Faltas</span>
                    <p className="text-xl font-black text-rose-600">{liveAttendanceStats.absences}</p>
                  </div>
                  <div className="border-l border-slate-200 pl-6">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Frequência da Aula</span>
                    <p className="text-xl font-black text-blue-600">{liveAttendanceStats.percentage}%</p>
                  </div>
                </div>

                {/* BOTÕES DE MARCAÇÃO EM LOTE */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => markAll(true)} 
                    className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black uppercase hover:bg-emerald-100 transition-all flex items-center gap-1.5 flex-1 md:flex-none justify-center"
                  >
                    <Check size={14} strokeWidth={3} />
                    Todos Presentes
                  </button>
                  <button 
                    onClick={() => markAll(false)} 
                    className="px-4 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase hover:bg-rose-100 transition-all flex items-center gap-1.5 flex-1 md:flex-none justify-center"
                  >
                    <X size={14} strokeWidth={3} />
                    Todos Ausentes
                  </button>
                  <button 
                    onClick={invertAll} 
                    className="px-3.5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all flex items-center gap-1.5"
                    title="Inverter Presenças e Faltas"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* LISTA DOS ESTUDANTES */}
              <div className="bg-white rounded-[3rem] border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
                {students.map((student, idx) => {
                  const movements = studentMovements[student.id] || [];
                  const studentStatus = student.status || '';
                  const adjDate = student.adjustment_date;
                  const isBlocked = studentStatus !== 'ATIVO' && (!adjDate || date >= adjDate);
                  
                  const hasMedicalCertificate = movements.some(m =>
                    m.movement_type === 'ATESTADO' && m.movement_date === date
                  );

                  const paedeMovement = movements.find(m => m.movement_type === 'PAEDE_LAUDO');
                  const isPaede = student.PAED === 'Sim' || Boolean(paedeMovement);
                  const paedePathology = paedeMovement?.description || 'Educação Especial';
                  const paedeCid = paedeMovement?.cid_code;
                  const hasCaregiver = paedeMovement?.doctor_name === 'COM CUIDADOR';
                  const attendsAee = paedeMovement?.responsible_name === 'FREQUENTA AEE';
                  const pedagogicalGuidelines = paedeMovement?.destination_school || '';
                  const studentRisk = riskStats[student.CodigoAluno];
                  const isAtRisk = Boolean(studentRisk && studentRisk.percentage < 75);

                  return (
                    <div 
                      key={student.CodigoAluno} 
                      className={`p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-all ${
                        isBlocked ? 'opacity-40 grayscale select-none bg-slate-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="w-8 text-center text-xs font-black text-slate-300">
                          #{idx + 1}
                        </span>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-sm md:text-base font-black uppercase tracking-tight ${
                              isBlocked ? 'text-slate-400 line-through' : 'text-slate-900'
                            }`}>
                              {student.Nome}
                            </h4>

                            {isBlocked && (
                              <span className="px-2 py-0.5 bg-slate-700 text-white rounded text-[8px] font-black uppercase tracking-wider">
                                {studentStatus}
                              </span>
                            )}

                            {hasMedicalCertificate && (
                              <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-wider">
                                Atestado Médico
                              </span>
                            )}

                            {/* BADGE DE ALUNO PAEDE / EDUCAÇÃO ESPECIAL */}
                            {isPaede && (
                              <button
                                type="button"
                                onClick={() => setSelectedPaedeStudent({
                                  name: student.Nome,
                                  class: student.Turma,
                                  registration: student.CodigoAluno,
                                  pathology: paedePathology,
                                  cid: paedeCid,
                                  hasCaregiver,
                                  attendsAee,
                                  guidelines: pedagogicalGuidelines
                                })}
                                className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-[9px] uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all border border-amber-500"
                                title="Clique para ver laudo e orientações de acessibilidade para a aula"
                              >
                                <span>♿</span>
                                <span>PAEDE: {paedePathology.length > 28 ? paedePathology.substring(0, 28) + '...' : paedePathology}</span>
                              </button>
                            )}

                            {/* SENTINELA SEDUC: ALERTA DE INFREQUÊNCIA */}
                            {isAtRisk && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[8px] font-black uppercase tracking-wider border border-rose-200 animate-pulse">
                                <AlertTriangle size={10} /> Risco Evasão ({Math.round(riskStats[student.CodigoAluno].percentage)}% Freq.)
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Matrícula: {student.CodigoAluno}</span>
                            {student.TransporteEscolar === 'Sim' && <span>• Transporte Escolar</span>}
                            {hasCaregiver && <span className="text-amber-700 font-black">• Possui Cuidador</span>}
                            {attendsAee && <span className="text-blue-600 font-black">• Sala Recursos (AEE)</span>}
                          </div>

                          {/* OUTRAS AULAS DO MESMO DIA */}
                          {otherAttendance[student.CodigoAluno] && otherAttendance[student.CodigoAluno].length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Hoje:</span>
                              {otherAttendance[student.CodigoAluno].map((rec, i) => (
                                <span 
                                  key={i} 
                                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 border ${
                                    rec.isPresent 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  {rec.subject.substring(0, 3)}: {rec.isPresent ? 'P' : 'F'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* BOTÕES DE MARCAÇÃO POR PERÍODO */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {[1, 2, 3, 4, 5].map(period => {
                          const isSelected = selectedPeriods.includes(period);
                          const isPresent = attendance[student.CodigoAluno]?.[period] ?? true;

                          return (
                            <div key={period} className="flex flex-col items-center gap-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase">{period}ª</span>
                              <button
                                type="button"
                                onClick={() => !isBlocked && toggleAttendance(student.CodigoAluno, period)}
                                disabled={isBlocked || !isSelected}
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                                  !isSelected
                                    ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-40'
                                    : isBlocked
                                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                      : (isPresent
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-600 scale-105'
                                        : 'bg-rose-500 text-white shadow-md shadow-rose-500/25 hover:bg-rose-600 scale-105')
                                }`}
                                title={!isSelected ? 'Aula não selecionada' : isPresent ? 'Presente (Clique para dar Falta)' : 'Ausente (Clique para dar Presença)'}
                              >
                                {!isSelected || isBlocked ? (
                                  <span className="text-[9px] font-bold text-slate-300">—</span>
                                ) : isPresent ? (
                                  <Check size={20} strokeWidth={3} />
                                ) : (
                                  <X size={20} strokeWidth={3} />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-28 text-center bg-white rounded-[3rem] border border-slate-200/80 shadow-sm flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <UserCheck size={32} />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Nenhuma Turma Selecionada</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-sm">
                Selecione a turma e o componente curricular no topo para abrir a lista de presença.
              </p>
            </div>
          )}
        </>
      ) : (
        /* VISUALIZAÇÃO DE HISTÓRICO */
        <div className="bg-white rounded-[3rem] border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Histórico de Chamadas</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Aulas registradas pelo docente {user.name}</p>
              </div>
            </div>
            
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar por turma..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          <div className="p-6 md:p-8">
            {isFetchingHistory ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 size={36} className="animate-spin text-blue-600" />
                <p className="text-xs font-bold uppercase tracking-widest">Carregando registros...</p>
              </div>
            ) : attendanceHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(
                  attendanceHistory
                    .filter(h => h.classroom_name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .reduce((acc: any, record) => {
                      const baseSubject = record.subject.split(' - ')[0];
                      const key = `${record.date}|${record.classroom_name}|${record.shift}|${baseSubject}`;
                      
                      if (!acc[key]) {
                        acc[key] = {
                          id: record.id,
                          date: record.date,
                          classroom_name: record.classroom_name,
                          shift: record.shift,
                          baseSubject: baseSubject,
                          periods: [],
                          recordIds: []
                        };
                      }
                      
                      const match = record.subject.match(/(\d+)ª Aula/);
                      if (match) {
                        acc[key].periods.push(parseInt(match[1]));
                      }
                      acc[key].recordIds.push(record.id);
                      
                      return acc;
                    }, {})
                )
                  .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((group: any) => (
                  <div key={group.id} className="bg-white border border-slate-200/80 rounded-[2rem] p-6 hover:shadow-xl hover:border-blue-200 transition-all relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Data da Aula</p>
                          <p className="text-sm font-black text-slate-900">
                            {new Date(group.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteRecord(group.recordIds)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Excluir Diário"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-400 uppercase">Turma:</span>
                        <span className="font-black text-slate-900 uppercase">{group.classroom_name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-400 uppercase">Turno:</span>
                        <span className="font-black text-slate-900 uppercase">{group.shift}</span>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase truncate">
                          {group.baseSubject} ({group.periods.sort().join(', ')}ª Aula)
                        </p>
                        <button 
                          onClick={() => {
                            setSelectedClass(group.classroom_name);
                            setDate(group.date);
                            setSelectedShift(group.shift as Shift);
                            setSelectedPeriods(group.periods);
                            setSelectedSubject(group.baseSubject);
                            setViewMode('form');
                          }}
                          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <History size={48} className="opacity-20 mb-2" />
                <p className="text-xs font-black uppercase tracking-widest">Nenhum diário registrado ainda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL FICHA DE ACESSIBILIDADE & INCLUSÃO (PAEDE) */}
      {selectedPaedeStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="p-8 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-950 text-amber-400 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
                  ♿
                </div>
                <div>
                  <span className="px-2.5 py-0.5 bg-slate-950/20 text-slate-950 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Educação Especial • SEDUC-MT
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-tight mt-0.5">
                    Ficha de Acessibilidade (PAEDE)
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPaedeStudent(null)}
                className="w-10 h-10 rounded-full bg-slate-950/10 hover:bg-slate-950/20 flex items-center justify-center text-slate-950 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* CONTEÚDO DA FICHA */}
            <div className="p-8 space-y-6">
              
              {/* DADOS DO ESTUDANTE */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudante</p>
                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  {selectedPaedeStudent.name}
                </h4>
                <p className="text-xs font-bold text-slate-500 uppercase">
                  Turma: {selectedPaedeStudent.class} • Matrícula: {selectedPaedeStudent.registration}
                </p>
              </div>

              {/* DIAGNÓSTICO E PATOLOGIA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Patologia / Diagnóstico</p>
                  <p className="text-sm font-black text-amber-950 uppercase mt-1">
                    {selectedPaedeStudent.pathology}
                  </p>
                  {selectedPaedeStudent.cid && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded text-[9px] font-mono font-black uppercase">
                      CID: {selectedPaedeStudent.cid}
                    </span>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                  <div>
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Apoio Escolar</p>
                    <p className="text-xs font-black text-blue-950 mt-0.5">
                      {selectedPaedeStudent.hasCaregiver ? '✅ Possui Cuidador em Sala' : '❌ Sem Cuidador'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-blue-200/60">
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Sala de Recursos (AEE)</p>
                    <p className="text-xs font-black text-blue-950 mt-0.5">
                      {selectedPaedeStudent.attendsAee ? '✅ Frequenta Sala AEE' : '❌ Não Frequenta'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ORIENTAÇÕES PEDAGÓGICAS PARA O PROFESSOR */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Sparkles size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Orientações para os Professores em Sala</p>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                  {selectedPaedeStudent.guidelines || "Aluno com necessidade de acompanhamento pedagógico individualizado (PEI) e flexibilização de tempo/avaliações conforme diretrizes da Educação Especial."}
                </p>
              </div>

            </div>

            {/* RODAPÉ DO MODAL */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPaedeStudent(null)}
                className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md"
              >
                Fechar Ficha
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherAttendance;
