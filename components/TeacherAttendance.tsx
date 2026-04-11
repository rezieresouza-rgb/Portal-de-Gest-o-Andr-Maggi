
import React, { useState, useEffect } from 'react';
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
  Search
} from 'lucide-react';
import { AttendanceRecord, Shift, User as UserType } from '../types';

import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES } from '../constants/initialData';

const CLASSES = SCHOOL_CLASSES;

const SUBJECTS = [
  "MATEMÁTICA", "LÍNGUA PORTUGUESA", "CIÊNCIAS", "HISTÓRIA", "GEOGRAFIA",
  "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA"
];

const TeacherAttendance: React.FC<{ user: UserType }> = ({ user }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedShift, setSelectedShift] = useState<Shift>('MATUTINO');
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [isSaving, setIsSaving] = useState(false);
  const [existingRecordIds, setExistingRecordIds] = useState<Record<number, string>>({});
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  // Histórico
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
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
    if (!user?.name) return;
    setIsFetchingHistory(true);
    try {
      const { data, error } = await supabase
        .from('class_attendance_records')
        .select('*')
        .eq('teacher_name', user.name)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttendanceHistory(data || []);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'history') {
      fetchHistory();
    }
  }, [viewMode]);

  const handleDeleteRecord = async (recordIds: string[]) => {
    if (!window.confirm("Deseja realmente excluir este(s) registro(s) permanentemente?")) return;

    try {
      // O Supabase deve lidar com o cascade delete na tabela class_attendance_students
      // se a FK estiver configurada com ON DELETE CASCADE.
      const { error } = await supabase
        .from('class_attendance_records')
        .delete()
        .in('id', recordIds);

      if (error) throw error;

      setAttendanceHistory(prev => prev.filter(r => !recordIds.includes(r.id)));
      alert("Registro(s) excluído(s) com sucesso.");
    } catch (err) {
      console.error("Erro ao excluir registro:", err);
      alert("Erro ao excluir o registro. Tente novamente.");
    }
  };

  const loadExistingAttendance = async (currentStudents: any[]) => {
    if (!selectedClass || !selectedSubject || !date || currentStudents.length === 0) return;
    setIsLoadingExisting(true);

    try {
      const newExistingRecordIds: Record<number, string> = {};
      const newAttendance: Record<string, Record<number, boolean>> = {};

      // Initialize with default values first
      currentStudents.forEach(s => {
        newAttendance[s.CodigoAluno] = {};
        selectedPeriods.forEach(p => {
          newAttendance[s.CodigoAluno][p] = true;
        });
      });

      for (const period of selectedPeriods) {
        const periodSubject = `${selectedSubject} - ${period}ª Aula`;
        const { data: record } = await supabase
          .from('class_attendance_records')
          .select('id')
          .eq('classroom_name', selectedClass)
          .eq('date', date)
          .eq('subject', periodSubject)
          .maybeSingle();

        if (record) {
          newExistingRecordIds[period] = record.id;

          const { data: studentAttendance } = await supabase
            .from('class_attendance_students')
            .select('student_id, is_present')
            .eq('attendance_record_id', record.id);

          if (studentAttendance) {
            studentAttendance.forEach((sa: any) => {
              if (newAttendance[sa.student_id]) {
                newAttendance[sa.student_id][period] = sa.is_present;
              }
            });
          }
        }
      }
      setExistingRecordIds(newExistingRecordIds);
      setAttendance(newAttendance);
    } catch (error) {
      console.error('Error loading existing attendance:', error);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const fetchStudentsFromDB = async (className: string) => {
    try {
      // 1. Get Classroom ID
      const { data: classData, error: classError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('name', className)
        .single();

      if (classError || !classData) {
        setStudents([]);
        return [];
      }

      // 2. Get Students enrolled in this class
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          status,
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
          id: e.students.id, // Keep Supabase ID for future use
          status: e.status || 'ATIVO',
          PAED: e.students.paed ? 'Sim' : 'Não',
          TransporteEscolar: e.students.school_transport ? 'Sim' : 'Não'
        })).sort((a: any, b: any) => a.Nome.localeCompare(b.Nome));

        setStudents(mappedStudents);

        // Fetch cross attendance after loading students
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
    // Calculate evasion risk based on frequency
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
        if (pct < 85) { // Threshold for risk
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
    // Fetch all attendance records for this class on this date
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
        // Skip current session if needed, but showing it as "Saved" might be good too.
        // Let's show everything to be comprehensive.

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
    
    // Buscar o aluno para checar o status
    const student = students.find(st => st.CodigoAluno === id);
    if (student && student.status !== 'ATIVO') return; // Bloqueia se não for ATIVO

    setAttendance(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [period]: !prev[id]?.[period]
      }
    }));
  };

  const markAll = (status: boolean) => {
    const updated = { ...attendance };
    students.forEach(s => {
      // APENAS para alunos ativos
      if (s.status === 'ATIVO') {
        selectedPeriods.forEach(p => {
          if (!updated[s.CodigoAluno]) updated[s.CodigoAluno] = {};
          updated[s.CodigoAluno][p] = status;
        });
      }
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    if (!selectedClass) return alert("Selecione uma turma.");
    if (selectedPeriods.length === 0) return alert("Selecione pelo menos uma aula que você ministrou.");
    setIsSaving(true);

    try {
      for (const period of selectedPeriods) {
        const periodSubject = `${selectedSubject} - ${period}ª Aula`;
        let recordId = existingRecordIds[period];

        if (!recordId) {
          // Check if it already exists in DB to prevent duplicates if state is stale
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
            // 1. Insert Record for this period
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

        // 2. Insert/Update Students for this period record
        const studentRecords = students.map(s => ({
          attendance_record_id: recordId,
          student_id: s.CodigoAluno,
          student_name: s.Nome,
          is_present: attendance[s.CodigoAluno]?.[period] ?? false
        }));

        const { error: studentsError } = await supabase
          .from('class_attendance_students')
          .upsert(studentRecords, { onConflict: 'attendance_record_id, student_id' });

        if (studentsError) throw studentsError;
      }

      alert(Object.keys(existingRecordIds).length > 0
        ? "Chamada atualizada com sucesso!"
        : "Chamada realizada e salva com sucesso!"
      );
      setSelectedClass('');
      setExistingRecordIds({});
      setSelectedPeriods([1]); // Reset periods

    } catch (error) {
      console.error('Erro ao salvar chamada:', error);
      alert("Erro ao salvar chamada. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header com Toggle de Visualização */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Presença & Frequência</h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Gestão de Aula | {SCHOOL_CLASSES[0].split(' ')[0]}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setViewMode('form')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${viewMode === 'form' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
          >
            <UserCheck size={16} /> Fazer Chamada
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${viewMode === 'history' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
          >
            <History size={16} /> Ver Histórico
          </button>
        </div>
      </div>

      {viewMode === 'form' ? (
        <>
          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all"
                >
                  <option value="">Selecionar Turma...</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turno</label>
                <select
                  value={selectedShift}
                  onChange={e => setSelectedShift(e.target.value as Shift)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none"
                >
                  <option value="MATUTINO">Matutino</option>
                  <option value="VESPERTINO">Vespertino</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-gray-50 pt-6">
              <div className="space-y-2 w-full md:w-auto">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  Quais aulas você ministrou hoje? <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px]">Obrigatório</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(period => (
                    <button
                      key={period}
                      onClick={() => togglePeriodSelection(period)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${selectedPeriods.includes(period)
                        ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
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
                className={`w-full md:w-auto px-8 py-4 ${Object.keys(existingRecordIds).length > 0 ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'} text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0`}
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : (Object.keys(existingRecordIds).length > 0 ? <Check size={18} /> : <Save size={18} />)}
                {isLoadingExisting ? 'Carregando...' : (Object.keys(existingRecordIds).length > 0 ? 'Atualizar Diário' : 'Salvar Diário')}
              </button>
            </div>
          </div>

          {students.length > 0 ? (
            <div className="bg-white rounded-3xl md:rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-amber-50 text-amber-600 rounded-xl shadow-sm">
                    <Users size={20} />
                  </div>
                  <h3 className="text-sm md:text-lg font-black text-gray-900 uppercase tracking-tight">{selectedClass} — <span className="text-amber-600">{students.length} Estudantes</span></h3>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => markAll(true)} className="flex-1 md:flex-none px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-100 transition-all">Presente Todos</button>
                  <button onClick={() => markAll(false)} className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-700 rounded-xl text-[9px] font-black uppercase hover:bg-red-100 transition-all">Falta Todos</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100">
                {students.map((student, idx) => {
                  const movements = studentMovements[student.id] || [];
                  const studentStatus = student.status || '';
                  // Bloqueia qualquer status que não seja ATIVO (Reclassificado, Transferidos, etc.)
                  const isBlocked = studentStatus !== 'ATIVO';
                  const hasMedicalCertificate = movements.some(m =>
                    m.movement_type === 'ATESTADO' && m.movement_date === date
                  );

                  return (
                    <div key={student.CodigoAluno} className={`bg-white p-6 flex items-center justify-between hover:bg-gray-50 transition-all group ${isBlocked ? 'opacity-50 grayscale select-none' : ''}`}>
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] font-black text-gray-200 group-hover:text-amber-600 transition-colors">#{idx + 1}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-black uppercase leading-none ${isBlocked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{student.Nome}</p>

                            {isBlocked && (
                              <div className="px-1.5 py-0.5 bg-gray-600 text-white rounded text-[7px] font-black uppercase tracking-wider border border-gray-700">
                                {studentStatus}
                              </div>
                            )}

                            {hasMedicalCertificate && (
                              <div className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[7px] font-black uppercase tracking-wider border border-indigo-700">
                                Atestado Médico
                              </div>
                            )}

                            {riskStats[student.CodigoAluno] && !isBlocked && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[7px] font-black uppercase tracking-wider animate-pulse border border-red-200">
                                <AlertTriangle size={8} /> Risco Evasão
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase mt-1.5">Matrícula: {student.CodigoAluno}</p>

                          {/* Cross-Attendance Badges */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {otherAttendance[student.CodigoAluno]?.map((rec, i) => (
                              <div key={i} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[7px] font-black uppercase tracking-wider ${rec.isPresent ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
                                }`}>
                                <span>{rec.subject.substring(0, 3)}</span>
                                {rec.isPresent ? <Check size={8} strokeWidth={3} /> : <X size={8} strokeWidth={3} />}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 mt-4 sm:mt-0">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(period => {
                            const isSelected = selectedPeriods.includes(period);
                            const isPresent = attendance[student.CodigoAluno]?.[period] ?? false;

                            return (
                              <div key={period} className="flex flex-col items-center gap-1">
                                <span className="text-[8px] font-black text-gray-400 uppercase">{period}ª</span>
                                <button
                                  onClick={() => !isBlocked && toggleAttendance(student.CodigoAluno, period)}
                                  disabled={isBlocked || !isSelected}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!isSelected
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed border outline-dashed outline-1 outline-gray-200 outline-offset-1'
                                    : isBlocked
                                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                      : (isPresent
                                        ? 'bg-emerald-50 text-emerald-600 shadow-inner border border-emerald-100'
                                        : 'bg-red-50 text-red-600 shadow-inner border border-red-100')
                                    }`}
                                >
                                  {!isSelected || isBlocked ? <X size={20} className="opacity-50" strokeWidth={2} /> : (isPresent ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />)}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <UserCheck size={64} className="mx-auto mb-4 text-gray-100" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Selecione uma turma para iniciar a chamada</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-600/20">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Histórico de Chamadas</h3>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Suas aulas registradas</p>
              </div>
            </div>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar por turma..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all"
              />
            </div>
          </div>

          <div className="p-8">
            {isFetchingHistory ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-300 gap-4">
                <Loader2 size={40} className="animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Carregando seus registros...</p>
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
                  <div key={group.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-xl hover:border-amber-100 transition-all card-group relative overflow-hidden">
                    {/* Indicador de Status lateral */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/20 card-group-hover:bg-amber-500 transition-colors"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Data da Aula</p>
                          <p className="text-sm font-black text-gray-900 tracking-tight">
                            {new Date(group.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteRecord(group.recordIds)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir Registro(s)"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turma</span>
                        </div>
                        <span className="text-xs font-black text-gray-900 uppercase">{group.classroom_name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turno</span>
                        </div>
                        <span className="text-xs font-black text-gray-900 uppercase">{group.shift}</span>
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Clock size={12} className="text-gray-300 shrink-0" />
                          <p className="text-[10px] font-bold text-gray-500 uppercase truncate">
                            {group.baseSubject} - {group.periods.sort().join(', ')}ª Aulas
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedClass(group.classroom_name);
                            setDate(group.date);
                            setSelectedShift(group.shift as Shift);
                            setSelectedPeriods(group.periods);
                            setSelectedSubject(group.baseSubject);
                            setViewMode('form');
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-amber-100 hover:text-amber-700 text-gray-600 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-gray-200 gap-4">
                <History size={64} className="opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro encontrado.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;
