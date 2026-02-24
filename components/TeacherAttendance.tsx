
import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Users,
  Save,
  Check,
  X,

  Loader2,
  AlertTriangle
} from 'lucide-react';
import { AttendanceRecord, Shift, User as UserType } from '../types';

import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES } from '../constants/initialData';

const CLASSES = SCHOOL_CLASSES;

const SUBJECTS = [
  "MATEMÁTICA", "LÍNGUA PORTUGUESA", "CIÊNCIAS", "HISTÓRIA", "GEOGRAFIA",
  "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA", "ENSINO RELIGIOSO"
];

const TeacherAttendance: React.FC<{ user: UserType }> = ({ user }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedShift, setSelectedShift] = useState<Shift>('MATUTINO');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const [otherAttendance, setOtherAttendance] = useState<Record<string, { subject: string, isPresent: boolean, teacher: string }[]>>({});
  const [riskStats, setRiskStats] = useState<Record<string, { total: number, absences: number, percentage: number }>>({});
  const [studentMovements, setStudentMovements] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsFromDB(selectedClass);
      fetchRiskStats(selectedClass);
    } else {
      setStudents([]);
      setOtherAttendance({});
      setRiskStats({});
    }
  }, [selectedClass, date]);

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
        return;
      }

      // 2. Get Students enrolled in this class
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
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
          PAED: e.students.paed ? 'Sim' : 'Não',
          TransporteEscolar: e.students.school_transport ? 'Sim' : 'Não'
        })).sort((a: any, b: any) => a.Nome.localeCompare(b.Nome));

        setStudents(mappedStudents);

        // Initialize attendance state for new students
        const initialAttendance: Record<string, boolean> = {};
        mappedStudents.forEach((s: any) => {
          initialAttendance[s.CodigoAluno] = true;
        });
        setAttendance(initialAttendance);

        // Fetch cross attendance after loading students
        fetchCrossAttendance(className, date);
        fetchStudentsMovements(mappedStudents.map(s => s.id));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Erro ao buscar alunos da turma. Verifique a conexão.');
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

  const toggleAttendance = (id: string) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const markAll = (status: boolean) => {
    const updated = { ...attendance };
    students.forEach(s => {
      updated[s.CodigoAluno] = status;
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    if (!selectedClass) return alert("Selecione uma turma.");
    setIsSaving(true);

    try {
      // 1. Insert Record
      const { data: recordData, error: recordError } = await supabase
        .from('class_attendance_records')
        .insert([
          {
            classroom_name: selectedClass,
            teacher_name: user.name,
            date: date,
            shift: selectedShift,
            subject: selectedSubject
          }
        ])
        .select()
        .single();

      if (recordError) throw recordError;

      // 2. Insert Students
      const studentRecords = students.map(s => ({
        attendance_record_id: recordData.id,
        student_id: s.CodigoAluno,
        student_name: s.Nome,
        is_present: attendance[s.CodigoAluno]
      }));

      const { error: studentsError } = await supabase
        .from('class_attendance_students')
        .insert(studentRecords);

      if (studentsError) throw studentsError;

      alert("Chamada realizada e salva com sucesso!");
      setSelectedClass('');

    } catch (error) {
      console.error('Erro ao salvar chamada:', error);
      alert("Erro ao salvar chamada. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
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
        <button
          onClick={handleSave}
          disabled={isSaving || students.length === 0}
          className="w-full lg:w-auto px-8 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-600/20 hover:bg-amber-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Salvar Diário
        </button>
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
              const isTransferred = movements.some(m => m.movement_type === 'TRANSFERENCIA');
              const hasMedicalCertificate = movements.some(m =>
                m.movement_type === 'ATESTADO' && m.movement_date === date
              );

              return (
                <div key={student.CodigoAluno} className={`bg-white p-6 flex items-center justify-between hover:bg-gray-50 transition-all group ${isTransferred ? 'opacity-50 grayscale select-none' : ''}`}>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-gray-200 group-hover:text-amber-600 transition-colors">#{idx + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-black uppercase leading-none ${isTransferred ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{student.Nome}</p>

                        {isTransferred && (
                          <div className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[7px] font-black uppercase tracking-wider border border-red-700">
                            Transferido
                          </div>
                        )}

                        {hasMedicalCertificate && (
                          <div className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[7px] font-black uppercase tracking-wider border border-indigo-700">
                            Atestado Médico
                          </div>
                        )}

                        {riskStats[student.CodigoAluno] && !isTransferred && (
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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => !isTransferred && toggleAttendance(student.CodigoAluno)}
                      disabled={isTransferred}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isTransferred ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
                        (attendance[student.CodigoAluno]
                          ? 'bg-emerald-50 text-emerald-600 shadow-inner'
                          : 'bg-red-50 text-red-600 shadow-inner')
                        }`}
                    >
                      {isTransferred ? <X size={24} strokeWidth={2} /> : (attendance[student.CodigoAluno] ? <Check size={24} strokeWidth={3} /> : <X size={24} strokeWidth={3} />)}
                    </button>
                    <div className="text-right w-16">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isTransferred ? 'text-gray-300' :
                        (attendance[student.CodigoAluno] ? 'text-emerald-500' : 'text-red-500')
                        }`}>
                        {isTransferred ? 'Inativo' : (attendance[student.CodigoAluno] ? 'Presente' : 'Ausente')}
                      </span>
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
    </div>
  );
};

export default TeacherAttendance;
