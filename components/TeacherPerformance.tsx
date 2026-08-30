import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Flag,
  Calendar,
  Sparkles,
  TrendingDown,
  Loader2,
  Shield,
  HeartHandshake,
  BookOpen,
  Check,
  Printer,
  FileSpreadsheet,
  BrainCircuit,
  Award,
  UserCheck,
  UserX,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
  Search,
  User,
  X,
  ChevronRight,
  FileText
} from 'lucide-react';
import { AttendanceRecord, ClassroomOccurrence, User as UserType } from '../types';
import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES } from '../constants/initialData';
import { analyzeClassroomPerformanceWithAI, analyzeIndividualStudentWithAI } from '../geminiService';

interface TeacherPerformanceProps {
  user: UserType;
}

const CLASSES = SCHOOL_CLASSES;
const BIMESTRES = ["1º BIMESTRE", "2º BIMESTRE", "3º BIMESTRE", "4º BIMESTRE"];
const SUBJECTS = [
  "TODAS DISCIPLINAS",
  "MATEMÁTICA", "LÍNGUA PORTUGUESA", "CIÊNCIAS", "HISTÓRIA", "GEOGRAFIA",
  "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA", "APA"
];

const TeacherPerformance: React.FC<TeacherPerformanceProps> = ({ user }) => {
  // Filtros
  const [selectedClass, setSelectedClass] = useState(CLASSES[0] || '6º ANO A');
  const [selectedBimestre, setSelectedBimestre] = useState(BIMESTRES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('TODOS');

  // Estados de Dados
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de IA
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar dados completos da turma
  const fetchData = async () => {
    setLoading(true);
    setAiInsight(null);
    try {
      // 1. Alunos da Turma
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id,
          name,
          registration_number,
          paed,
          status,
          enrollments!inner (
            status,
            classrooms!inner (
              name
            )
          )
        `)
        .eq('enrollments.classrooms.name', selectedClass)
        .eq('enrollments.status', 'ATIVO');

      const classStudents = (studentsData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        registration: s.registration_number,
        paed: s.paed === true,
        className: selectedClass
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));

      setStudents(classStudents);

      // 2. Frequência / Presenças da Turma
      let attQuery = supabase
        .from('class_attendance_records')
        .select(`
          id,
          date,
          shift,
          classroom_name,
          teacher_name,
          subject,
          created_at,
          presences:class_attendance_students(
            student_id,
            is_present
          )
        `)
        .eq('classroom_name', selectedClass)
        .order('date', { ascending: true });

      if (selectedSubject !== 'TODAS DISCIPLINAS') {
        attQuery = attQuery.ilike('subject', `%${selectedSubject}%`);
      }

      const { data: attData } = await attQuery;
      setAttendanceRecords(attData || []);

      // 3. Notas e Avaliações da Turma
      let gradeQuery = supabase
        .from('grades')
        .select(`
          id,
          score,
          recovery_score,
          student_id,
          student_name,
          assessments!inner (
            id,
            name,
            subject,
            bimestre,
            date,
            classrooms!inner (
              name
            )
          )
        `)
        .eq('assessments.classrooms.name', selectedClass)
        .eq('assessments.bimestre', selectedBimestre);

      if (selectedSubject !== 'TODAS DISCIPLINAS') {
        gradeQuery = gradeQuery.eq('assessments.subject', selectedSubject);
      }

      const { data: grData } = await gradeQuery;
      setGradesData(grData || []);

      // 4. Ocorrências da Turma
      const { data: occData } = await supabase
        .from('occurrences')
        .select('*')
        .eq('classroom_name', selectedClass)
        .order('date', { ascending: false });

      setOccurrences(occData || []);

    } catch (error) {
      console.error('Error fetching performance intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedStudentId('TODOS');
  }, [selectedClass, selectedBimestre, selectedSubject]);

  // Cálculos Estatísticos 360°
  const analytics = useMemo(() => {
    // 1. Estatísticas de Notas
    const studentGradesMap: Record<string, { name: string; finalScores: number[]; regularScores: number[]; isPaed: boolean; details: any[] }> = {};
    students.forEach(s => {
      studentGradesMap[s.id] = {
        name: s.name,
        finalScores: [],
        regularScores: [],
        isPaed: s.paed,
        details: []
      };
    });

    gradesData.forEach(g => {
      const sid = g.student_id;
      if (studentGradesMap[sid]) {
        const reg = Number(g.score) || 0;
        const rec = g.recovery_score !== null && g.recovery_score !== undefined ? Number(g.recovery_score) : null;
        const finalScore = rec !== null ? Math.max(reg, rec) : reg;
        studentGradesMap[sid].regularScores.push(reg);
        studentGradesMap[sid].finalScores.push(finalScore);
        studentGradesMap[sid].details.push({
          subject: g.assessments?.subject || 'Geral',
          assessmentName: g.assessments?.name || 'Avaliação',
          date: g.assessments?.date,
          score: reg,
          recoveryScore: rec,
          finalScore
        });
      }
    });

    let totalScoresSum = 0;
    let totalScoresCount = 0;
    let approvedCount = 0;
    let totalEvaluatedStudents = 0;

    // 2. Estatísticas de Presença por Aluno
    const studentAttendanceMap: Record<string, { present: number; total: number; days: { date: string; subject: string; isPresent: boolean }[] }> = {};
    students.forEach(s => {
      studentAttendanceMap[s.id] = { present: 0, total: 0, days: [] };
    });

    let totalAttendanceSlots = 0;
    let totalPresentsSlots = 0;

    attendanceRecords.forEach(rec => {
      (rec.presences || []).forEach((p: any) => {
        if (studentAttendanceMap[p.student_id]) {
          studentAttendanceMap[p.student_id].total++;
          totalAttendanceSlots++;
          if (p.is_present) {
            studentAttendanceMap[p.student_id].present++;
            totalPresentsSlots++;
          }
          studentAttendanceMap[p.student_id].days.push({
            date: rec.date,
            subject: rec.subject,
            isPresent: p.is_present
          });
        }
      });
    });

    // 3. Contagem de Ocorrências por Aluno e por Tipo
    const occByStudent: Record<string, any[]> = {};
    const occByType: Record<string, number> = {};
    occurrences.forEach(occ => {
      const sName = occ.student_name?.toUpperCase() || 'OUTROS';
      if (!occByStudent[sName]) occByStudent[sName] = [];
      occByStudent[sName].push(occ);

      const type = occ.category || occ.type || 'GERAL';
      occByType[type] = (occByType[type] || 0) + 1;
    });

    const studentSummary: {
      id: string;
      name: string;
      registration: string;
      average: number;
      presenceRate: number;
      absences: number;
      presentsCount: number;
      totalClasses: number;
      isPaed: boolean;
      occurrencesCount: number;
      gradesDetails: any[];
      attendanceDays: any[];
      occurrencesList: any[];
    }[] = [];

    // Consolidar Aluno a Aluno
    students.forEach(s => {
      const gInfo = studentGradesMap[s.id];
      const avg = gInfo && gInfo.finalScores.length > 0
        ? gInfo.finalScores.reduce((a, b) => a + b, 0) / gInfo.finalScores.length
        : 0;

      if (gInfo && gInfo.finalScores.length > 0) {
        totalScoresSum += avg;
        totalScoresCount++;
        totalEvaluatedStudents++;
        if (avg >= 6.0) approvedCount++;
      }

      const aInfo = studentAttendanceMap[s.id] || { present: 0, total: 0, days: [] };
      const presenceRate = aInfo.total > 0 ? (aInfo.present / aInfo.total) * 100 : 100;
      const absences = aInfo.total - aInfo.present;
      const studentOccs = occByStudent[s.name.toUpperCase()] || [];

      studentSummary.push({
        id: s.id,
        name: s.name,
        registration: s.registration,
        average: avg,
        presenceRate,
        absences,
        presentsCount: aInfo.present,
        totalClasses: aInfo.total,
        isPaed: s.paed,
        occurrencesCount: studentOccs.length,
        gradesDetails: gInfo?.details || [],
        attendanceDays: aInfo.days || [],
        occurrencesList: studentOccs
      });
    });

    const averageGrade = totalScoresCount > 0 ? totalScoresSum / totalScoresCount : 0;
    const approvalRate = totalEvaluatedStudents > 0 ? (approvedCount / totalEvaluatedStudents) * 100 : 0;
    const overallPresenceRate = totalAttendanceSlots > 0 ? (totalPresentsSlots / totalAttendanceSlots) * 100 : 100;

    // Pirâmide de Proficiência
    const proficiency = {
      avancado: studentSummary.filter(s => s.average >= 8.0).length,
      adequado: studentSummary.filter(s => s.average >= 6.0 && s.average < 8.0).length,
      basico: studentSummary.filter(s => s.average >= 4.0 && s.average < 6.0).length,
      abaixoBasico: studentSummary.filter(s => s.average > 0 && s.average < 4.0).length,
      semNota: studentSummary.filter(s => s.average === 0).length
    };

    const proficiencyChartData = [
      { name: 'Avançado (≥ 8.0)', value: proficiency.avancado, fill: '#10b981' },
      { name: 'Adequado (6.0 - 7.9)', value: proficiency.adequado, fill: '#2563eb' },
      { name: 'Básico (4.0 - 5.9)', value: proficiency.basico, fill: '#f59e0b' },
      { name: 'Abaixo Básico (< 4.0)', value: proficiency.abaixoBasico, fill: '#ef4444' },
    ].filter(p => p.value > 0);

    // Alunos Destaque vs. Alunos em Risco
    const topStudents = [...studentSummary]
      .filter(s => s.average >= 7.5 && s.presenceRate >= 85)
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);

    const atRiskStudents = [...studentSummary]
      .filter(s => (s.average > 0 && s.average < 6.0) || s.presenceRate < 85 || s.occurrencesCount > 0)
      .sort((a, b) => {
        return (a.average + (a.presenceRate / 20)) - (b.average + (b.presenceRate / 20));
      });

    // Evolução da Frequência no tempo
    const attendanceTimelineMap: Record<string, { date: string; present: number; total: number }> = {};
    attendanceRecords.forEach(rec => {
      const d = rec.date;
      if (!attendanceTimelineMap[d]) {
        attendanceTimelineMap[d] = { date: new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), present: 0, total: 0 };
      }
      (rec.presences || []).forEach((p: any) => {
        attendanceTimelineMap[d].total++;
        if (p.is_present) attendanceTimelineMap[d].present++;
      });
    });

    const attendanceTimelineData = Object.values(attendanceTimelineMap).map(d => ({
      date: d.date,
      frequencia: d.total > 0 ? Math.round((d.present / d.total) * 100) : 100
    }));

    return {
      totalStudents: students.length,
      averageGrade,
      approvalRate,
      overallPresenceRate,
      totalOccurrences: occurrences.length,
      proficiency,
      proficiencyChartData,
      topStudents,
      atRiskStudents,
      attendanceTimelineData,
      studentSummary,
      occByType
    };
  }, [students, gradesData, attendanceRecords, occurrences]);

  // Aluno Selecionado Individualmente
  const selectedStudentData = useMemo(() => {
    if (selectedStudentId === 'TODOS' || !analytics) return null;
    return analytics.studentSummary.find(s => s.id === selectedStudentId) || null;
  }, [selectedStudentId, analytics]);

  // Disparar Diagnóstico com IA Gemini (Turma ou Individual)
  const handleGenerateAI = async () => {
    if (!analytics) return;
    setAiLoading(true);
    try {
      if (selectedStudentData) {
        // Diagnóstico Individual
        const payload = {
          studentName: selectedStudentData.name,
          className: selectedClass,
          bimestre: selectedBimestre,
          averageGrade: selectedStudentData.average,
          presenceRate: selectedStudentData.presenceRate,
          absencesCount: selectedStudentData.absences,
          isPaed: selectedStudentData.isPaed,
          gradesHistory: selectedStudentData.gradesDetails.map(g => ({
            subject: g.subject,
            score: g.score,
            recoveryScore: g.recoveryScore
          })),
          occurrences: selectedStudentData.occurrencesList.map(o => ({
            date: o.date,
            category: o.category || o.type || 'Geral',
            description: o.description || ''
          }))
        };

        const result = await analyzeIndividualStudentWithAI(payload);
        setAiInsight(result);
      } else {
        // Diagnóstico da Turma
        const payload = {
          className: selectedClass,
          bimestre: selectedBimestre,
          subject: selectedSubject,
          averageGrade: analytics.averageGrade,
          approvalRate: analytics.approvalRate,
          presenceRate: analytics.overallPresenceRate,
          totalOccurrences: analytics.totalOccurrences,
          atRiskStudentsCount: analytics.atRiskStudents.length,
          topStudents: analytics.topStudents.map(s => s.name),
          strugglingStudents: analytics.atRiskStudents.slice(0, 6).map(s => ({
            name: s.name,
            grade: Number(s.average.toFixed(1)),
            presenceRate: Number(s.presenceRate.toFixed(0))
          })),
          occurrenceTypes: analytics.occByType
        };

        const result = await analyzeClassroomPerformanceWithAI(payload);
        setAiInsight(result);
      }
    } catch (e) {
      console.error(e);
      setAiInsight("Erro ao processar diagnóstico com Inteligência Artificial.");
    } finally {
      setAiLoading(false);
    }
  };

  const filteredRiskStudents = useMemo(() => {
    if (!analytics) return [];
    return analytics.atRiskStudents.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [analytics, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 no-print">

      {/* CABEÇALHO & SELETORES GLOBAIS COM SELETOR DE ESTUDANTE */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          
          {/* SELETOR 1: TURMA */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turma Escolar</label>
            <select
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                setSelectedStudentId('TODOS');
              }}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
            >
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* SELETOR 2: ESTUDANTE (INDIVIDUAL OU TODOS) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
              <User size={10} /> Estudante da Turma
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className={`w-full px-4 py-3.5 border rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 transition-all appearance-none cursor-pointer ${
                selectedStudentId !== 'TODOS' 
                  ? 'bg-blue-50/80 border-blue-300 text-blue-900 focus:ring-blue-500/20' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-blue-500/10'
              }`}
            >
              <option value="TODOS">👥 TODOS OS ALUNOS ({students.length})</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.isPaed ? '♿ ' : ''}{s.name}
                </option>
              ))}
            </select>
          </div>

          {/* SELETOR 3: BIMESTRE */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bimestre Letivo</label>
            <select
              value={selectedBimestre}
              onChange={e => setSelectedBimestre(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer text-indigo-700"
            >
              {BIMESTRES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* SELETOR 4: DISCIPLINA */}
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

        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
          {selectedStudentId !== 'TODOS' && (
            <button
              onClick={() => setSelectedStudentId('TODOS')}
              className="px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-1.5"
              title="Voltar para a visão panorâmica da turma"
            >
              <X size={16} /> Visão Turma
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Printer size={16} /> Imprimir Ficha
          </button>
          
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading || loading}
            className="px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {aiLoading ? 'Processando IA...' : selectedStudentId !== 'TODOS' ? 'Parecer do Aluno (IA)' : 'Diagnóstico da Turma (IA)'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 size={40} className="animate-spin text-blue-600" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Compilando inteligência pedagógica...</p>
        </div>
      ) : selectedStudentData ? (
        
        /* =========================================================================
           MODO 1: FICHA INDIVIDUAL 360° DO ESTUDANTE SELECIONADO
           ========================================================================= */
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* BANNER PERFIL DO ALUNO */}
          <div className="p-8 md:p-10 rounded-[3rem] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-white/10 relative overflow-hidden">
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-500/30">
                {selectedStudentData.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{selectedStudentData.name}</h2>
                  {selectedStudentData.isPaed && (
                    <span className="px-3 py-1 bg-amber-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <span>♿</span> PAEDE / AEE
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">
                  Turma: {selectedClass} • Matrícula: {selectedStudentData.registration} • {selectedBimestre}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedStudentId('TODOS')}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-white/10 relative z-10"
            >
              ← Voltar para Todos os Alunos
            </button>
          </div>

          {/* KPIS DO ALUNO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* MÉDIA DO ALUNO */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${selectedStudentData.average >= 6.0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <TrendingUp size={22} />
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedStudentData.average >= 6.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {selectedStudentData.average >= 6.0 ? 'Aprovado' : 'Em Recuperação'}
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média do Aluno</p>
              <p className={`text-4xl font-black mt-1 ${selectedStudentData.average >= 6.0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {selectedStudentData.average > 0 ? selectedStudentData.average.toFixed(1) : 'S/N'}
              </p>
              <p className="text-xs font-bold text-slate-400 mt-2">
                Média da Turma: {analytics.averageGrade.toFixed(1)} ({selectedStudentData.average >= analytics.averageGrade ? '+' : ''}{(selectedStudentData.average - analytics.averageGrade).toFixed(1)})
              </p>
            </div>

            {/* FREQUÊNCIA DO ALUNO */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${selectedStudentData.presenceRate >= 85 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                  <UserCheck size={22} />
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedStudentData.presenceRate >= 85 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                  {selectedStudentData.presenceRate >= 85 ? 'Regular' : 'Infrequente'}
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assiduidade do Aluno</p>
              <p className={`text-4xl font-black mt-1 ${selectedStudentData.presenceRate >= 85 ? 'text-slate-900' : 'text-amber-600'}`}>
                {selectedStudentData.presenceRate.toFixed(0)}%
              </p>
              <p className="text-xs font-bold text-slate-400 mt-2">
                {selectedStudentData.presentsCount} Presenças • {selectedStudentData.absences} Faltas
              </p>
            </div>

            {/* AVALIAÇÕES REALIZADAS */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Award size={22} />
                </div>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-800">
                  Bimestral
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliações Feitas</p>
              <p className="text-4xl font-black text-slate-900 mt-1">
                {selectedStudentData.gradesDetails.length}
              </p>
              <p className="text-xs font-bold text-slate-400 mt-2">
                {selectedStudentData.gradesDetails.filter(g => g.recoveryScore !== null).length} com Recuperação
              </p>
            </div>

            {/* OCORRÊNCIAS DO ALUNO */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
                  <AlertTriangle size={22} />
                </div>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-700">
                  Registros
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocorrências</p>
              <p className="text-4xl font-black text-slate-900 mt-1">
                {selectedStudentData.occurrencesCount}
              </p>
              <p className="text-xs font-bold text-slate-400 mt-2">
                Pedagógico, Militar e Mediação
              </p>
            </div>

          </div>

          {/* PAINEL DE PARECER COM IA GEMINI DO ALUNO */}
          {aiInsight && (
            <div className="bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 p-8 md:p-12 rounded-[3.5rem] text-white shadow-2xl border border-violet-500/30 animate-in zoom-in-95 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <Sparkles size={200} />
              </div>
              <div className="flex items-center gap-3 text-violet-400 font-black uppercase text-xs tracking-widest mb-6">
                <BrainCircuit size={20} />
                Parecer Descritivo e Plano de Acompanhamento (IA Gemini)
              </div>
              <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-line font-medium">
                {aiInsight}
              </div>
            </div>
          )}

          {/* DETALHAMENTO DE NOTAS & FREQUÊNCIA DO ALUNO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* HISTÓRICO DE NOTAS DO ALUNO */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Avaliações & Notas</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Detalhamento das notas do estudante</p>
                </div>
              </div>

              {selectedStudentData.gradesDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-4 py-3">Disciplina / Avaliação</th>
                        <th className="px-4 py-3 text-center">Nota Regular</th>
                        <th className="px-4 py-3 text-center">Recuperação</th>
                        <th className="px-4 py-3 text-center">Nota Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold">
                      {selectedStudentData.gradesDetails.map((g, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-all">
                          <td className="px-4 py-3">
                            <p className="font-black text-slate-900 uppercase">{g.subject}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{g.assessmentName}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-black text-slate-700">
                            {g.score.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-center font-black text-indigo-600">
                            {g.recoveryScore !== null ? g.recoveryScore.toFixed(1) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${g.finalScore >= 6.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {g.finalScore.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Nenhuma avaliação registrada para este aluno no bimestre
                </div>
              )}
            </div>

            {/* HISTÓRICO DE FREQUÊNCIA DIÁRIA */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Presenças & Faltas</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aulas registradas no diário</p>
                </div>
              </div>

              {selectedStudentData.attendanceDays.length > 0 ? (
                <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                  {selectedStudentData.attendanceDays.map((d, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-black text-slate-900">
                          {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-slate-400 font-medium ml-2">({d.subject})</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${d.isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {d.isPresent ? '✅ Presente' : '❌ Falta'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Nenhum registro de presença para este aluno
                </div>
              )}
            </div>

          </div>

          {/* OCORRÊNCIAS DO ALUNO SE HOUVER */}
          {selectedStudentData.occurrencesList.length > 0 && (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <AlertTriangle className="text-rose-600" size={18} /> Registros de Ocorrências e Encaminhamentos
              </h3>
              <div className="space-y-3">
                {selectedStudentData.occurrencesList.map((occ, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-rose-700 uppercase">{occ.category || occ.type}</span>
                      <span className="text-slate-400 font-bold">{new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{occ.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      ) : (

        /* =========================================================================
           MODO 2: VISÃO PANORÂMICA DE TODA A TURMA
           ========================================================================= */
        <>
          {/* CARDS DE KPIS DA TURMA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1: MÉDIA GERAL */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${analytics.averageGrade >= 6.0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <TrendingUp size={22} />
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${analytics.averageGrade >= 6.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {analytics.averageGrade >= 6.0 ? 'Meta Superada' : 'Em Recuperação'}
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média da Turma</p>
              <p className={`text-4xl font-black mt-1 ${analytics.averageGrade >= 6.0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {analytics.averageGrade.toFixed(1)}
              </p>
              <p className="text-xs font-bold text-slate-400 mt-2">
                Escala de 0.0 a 10.0 (Média 6.0)
              </p>
            </div>

            {/* KPI 2: FREQUÊNCIA GERAL */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${analytics.overallPresenceRate >= 85 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                  <UserCheck size={22} />
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${analytics.overallPresenceRate >= 85 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                  Meta SEDUC 85%
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assiduidade / Presença</p>
              <p className={`text-4xl font-black mt-1 ${analytics.overallPresenceRate >= 85 ? 'text-slate-900' : 'text-amber-600'}`}>
                {analytics.overallPresenceRate.toFixed(0)}%
              </p>
              <p className="text-xs font-bold text-slate-400 mt-2">
                {analytics.overallPresenceRate >= 85 ? 'Excelente assiduidade' : 'Atenção com faltas'}
              </p>
            </div>

            {/* KPI 3: TAXA DE APROVAÇÃO */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Award size={22} />
                </div>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-800">
                  {analytics.totalStudents} Alunos
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Aprovação</p>
              <p className="text-4xl font-black text-slate-900 mt-1">
                {analytics.approvalRate.toFixed(0)}%
              </p>
              <p className="text-xs font-bold text-slate-400 mt-2">
                Notas $\ge 6,0$ na avaliação/recuperação
              </p>
            </div>

            {/* KPI 4: OCORRÊNCIAS & CLIMA */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
                  <AlertTriangle size={22} />
                </div>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-700">
                  Convivência
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocorrências da Turma</p>
              <p className="text-4xl font-black text-slate-900 mt-1">
                {analytics.totalOccurrences}
              </p>
              <p className="text-xs font-bold text-slate-400 mt-2">
                Pedagógico, Militar e Mediação
              </p>
            </div>

          </div>

          {/* PAINEL DE DIAGNÓSTICO COM IA GEMINI DA TURMA */}
          {aiInsight && (
            <div className="bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 p-8 md:p-12 rounded-[3.5rem] text-white shadow-2xl border border-violet-500/30 animate-in zoom-in-95 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <Sparkles size={200} />
              </div>
              <div className="flex items-center gap-3 text-violet-400 font-black uppercase text-xs tracking-widest mb-6">
                <BrainCircuit size={20} />
                Diagnóstico Pedagógico com Inteligência Artificial • SEDUC-MT
              </div>
              <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-line font-medium">
                {aiInsight}
              </div>
            </div>
          )}

          {/* GRÁFICOS: PIRÂMIDE DE PROFICIÊNCIA & EVOLUÇÃO DE FREQUÊNCIA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* GRÁFICO 1: DISTRIBUIÇÃO DE NOTAS / PROFICIÊNCIA */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <FileSpreadsheet className="text-blue-600" size={18} /> Pirâmide de Proficiência (Notas)
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Distribuição dos estudantes por faixas de rendimento
                </p>
              </div>

              <div className="h-64 w-full">
                {analytics.proficiencyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.proficiencyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" name="Estudantes" radius={[10, 10, 0, 0]}>
                        {analytics.proficiencyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Sem notas lançadas neste bimestre
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <p className="text-[9px] font-black text-emerald-800 uppercase">Avançado</p>
                  <p className="text-lg font-black text-emerald-700">{analytics.proficiency.avancado}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-[9px] font-black text-blue-800 uppercase">Adequado</p>
                  <p className="text-lg font-black text-blue-700">{analytics.proficiency.adequado}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <p className="text-[9px] font-black text-amber-800 uppercase">Básico</p>
                  <p className="text-lg font-black text-amber-700">{analytics.proficiency.basico}</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl text-center">
                  <p className="text-[9px] font-black text-rose-800 uppercase">Abaixo Básico</p>
                  <p className="text-lg font-black text-rose-700">{analytics.proficiency.abaixoBasico}</p>
                </div>
              </div>
            </div>

            {/* GRÁFICO 2: EVOLUÇÃO TEMPORAL DA FREQUÊNCIA */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Calendar className="text-indigo-600" size={18} /> Assiduidade ao Longo das Aulas
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  % de Presença diária da turma em relação à meta legal (85%)
                </p>
              </div>

              <div className="h-64 w-full">
                {analytics.attendanceTimelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.attendanceTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="presenceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => [`${val}%`, 'Frequência']}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="frequencia" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#presenceGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Sem diários de presença no período selecionado
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Meta Legal SEDUC-MT: <strong>≥ 85% de frequência</strong></span>
                <span className={analytics.overallPresenceRate >= 85 ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>
                  {analytics.overallPresenceRate >= 85 ? '✅ Turma Atingindo a Meta' : '⚠️ Turma Abaixo da Meta'}
                </span>
              </div>
            </div>

          </div>

          {/* TABELAS: DESTAQUES & RADAR DE ALUNOS EM RISCO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUNA 1: QUADRO DE MÉRITO & DESTAQUES */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Quadro de Mérito</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Clique no aluno para abrir perfil</p>
                </div>
              </div>

              <div className="space-y-3">
                {analytics.topStudents.length > 0 ? (
                  analytics.topStudents.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className="w-full p-4 bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/60 rounded-2xl flex items-center justify-between gap-3 text-left transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[130px] group-hover:text-amber-900">{s.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Presença: {s.presenceRate.toFixed(0)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                          {s.average.toFixed(1)}
                        </span>
                        <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 font-medium py-6 text-center">Nenhum aluno atingiu a faixa de destaque ainda.</p>
                )}
              </div>
            </div>

            {/* COLUNA 2 e 3: RADAR DE ALUNOS EM RISCO / INTERVENÇÃO */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6 lg:col-span-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Radar de Alunos em Risco</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Clique no aluno para abrir a Ficha Individual
                    </p>
                  </div>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar aluno..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-4 py-3">Estudante</th>
                      <th className="px-4 py-3 text-center">Média</th>
                      <th className="px-4 py-3 text-center">Frequência</th>
                      <th className="px-4 py-3 text-center">Ocorrências</th>
                      <th className="px-4 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRiskStudents.length > 0 ? (
                      filteredRiskStudents.map(s => {
                        const isGradeRisk = s.average > 0 && s.average < 6.0;
                        const isPresenceRisk = s.presenceRate < 85;
                        const isOccRisk = s.occurrencesCount > 0;

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70 transition-all group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 uppercase">{s.name}</span>
                                {s.isPaed && (
                                  <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[8px] uppercase">
                                    ♿ PAEDE
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-center font-black">
                              <span className={isGradeRisk ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg' : 'text-slate-900'}>
                                {s.average > 0 ? s.average.toFixed(1) : 'S/N'}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-center font-black">
                              <span className={isPresenceRisk ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg' : 'text-slate-900'}>
                                {s.presenceRate.toFixed(0)}% ({s.absences} Faltas)
                              </span>
                            </td>

                            <td className="px-4 py-3 text-center font-black">
                              <span className={isOccRisk ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg' : 'text-slate-400'}>
                                {s.occurrencesCount}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setSelectedStudentId(s.id)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                Ver Ficha 360°
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                          Nenhum estudante em situação de risco nesta turma! Parabéns!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default TeacherPerformance;
