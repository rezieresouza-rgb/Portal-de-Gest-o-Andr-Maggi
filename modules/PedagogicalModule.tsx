import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Maximize2,
  Lock,
  LayoutDashboard,
  Eye,
  Rocket,
  BrainCircuit,
  Users,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  Loader2,
  FileText,
  BarChart3,
  Lightbulb,
  X,
  FileCheck,
  AlertCircle,
  ThumbsUp,
  History,
  Clock,
  LayoutList,
  GraduationCap,
  TrendingUp,
  Target,
  AlertTriangle,
  UserX,
  FileBarChart,
  ClipboardCheck,
  BookOpen,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ClassroomObservation, PedagogicalProject, LessonPlan, Assessment } from '../types';
import { analyzePedagogicalPerformance } from '../geminiService';
import { useToast } from '../components/Toast';
import CoordinationExternalGrades from '../components/CoordinationExternalGrades';
import ClassroomObservationForm from '../components/ClassroomObservationForm';
import PedagogicalOccurrenceBook from '../components/PedagogicalOccurrenceBook';
import UnifiedSchoolCalendar from '../components/UnifiedSchoolCalendar';
import PsychosocialReferralList from '../components/PsychosocialReferralList';
import ClassScheduleManager from '../components/ClassScheduleManager';
import SchoolProjectManager from '../components/SchoolProjectManager';

import { User as UserType } from '../types';

interface PedagogicalModuleProps {
  onExit: () => void;
  user: UserType;
}

const PedagogicalModule: React.FC<PedagogicalModuleProps> = ({ onExit, user }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'performance' | 'external_grades' | 'observations' | 'plans' | 'projects' | 'ia_insights' | 'occurrences' | 'calendar' | 'referrals' | 'schedules'>('dashboard');

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [externalAssessments, setExternalAssessments] = useState<Assessment[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [observations, setObservations] = useState<any[]>([]);
  const [projects, setProjects] = useState<PedagogicalProject[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { total: number, present: number, name: string, className: string }>>({});

  const fetchData = async () => {
    try {
      // 1. Fetch Assessments (Internal & External)
      const { data: assessData, error: assessError } = await supabase
        .from('assessments')
        .select(`
          *,
          users (name),
          classrooms (name),
          grades (
            score,
            students (name, classroom_id, classrooms(name))
          )
        `);

      if (assessData) {
        const formattedAssessments: Assessment[] = assessData.map(a => ({
          id: a.id,
          date: a.date,
          bimestre: a.bimestre,
          className: a.classrooms?.name || 'N/A',
          subject: a.subject,
          teacherName: a.users?.name || 'N/A',
          type: a.type as Assessment['type'],
          description: a.type,
          max_score: a.max_score,
          grades: a.grades.map((g: any) => ({
            studentId: 'N/A', // Not used in UI display apparently
            studentName: g.students?.name || 'Aluno',
            score: g.score,
            proficiencyLevel: g.score < 6 ? 'BAIXO' : 'ALTO'
          })),
          timestamp: new Date(a.date).getTime()
        }));

        setAssessments(formattedAssessments.filter(a => !['CAED', 'SISTEMA ESTRUTURADO'].includes(a.type)));
        setExternalAssessments(formattedAssessments.filter(a => ['CAED', 'SISTEMA ESTRUTURADO'].includes(a.type)));
      }

      // 2. Fetch Lesson Plans
      const { data: plansData } = await supabase
        .from('lesson_plans')
        .select('*, users(name), classrooms(name)');

      if (plansData) {
        setLessonPlans(plansData.map(p => ({
          id: p.id,
          bimestre: p.bimestre,
          subject: p.subject,
          teacher: p.users?.name || 'Professor',
          year: p.classrooms?.name?.split(' ')[0] || 'N/A',
          className: p.classrooms?.name || 'N/A',
          weeklyClasses: '4', // Default
          skills: [], // Not stored in simple migration? Or in content_json? Assuming content_json has it if complex structure
          recompositionSkills: [],
          themes: p.themes,
          rows: p.content_json || [],
          status: p.status as LessonPlan['status'],
          coordinationFeedback: p.coordination_feedback,
          timestamp: new Date(p.created_at).getTime()
        })));
      }

      // 3. Fetch Observations
      const { data: obsData } = await supabase.from('classroom_observations').select('*');
      if (obsData) {
        setObservations(obsData.map(o => ({
          ...o,
          teacher: o.teacher_name,
          organizational: o.organizational_criteria,
          pedagogico: o.pedagogical_criteria,
          avaliacaoGeral: o.general_rating,
          timestamp: new Date(o.created_at).getTime()
        })));
      }

      // 4. Fetch Projects
      const { data: projData } = await supabase.from('pedagogical_projects').select('*');
      if (projData) {
        setProjects(projData.map(p => ({
          id: p.id,
          name: p.name,
          coordinator: p.coordinator_name,
          bimestre: p.bimestre,
          status: p.status as PedagogicalProject['status'],
          impactLevel: p.impact_level as PedagogicalProject['impactLevel'],
          description: p.description
        })));
      }

      // 5. Fetch Attendance for Risk Analysis
      const { data: attData } = await supabase
        .from('class_attendance_students')
        .select('student_id, is_present, students(name, classroom_id, classrooms(name))');

      const attStats: Record<string, { total: number, present: number, name: string, className: string }> = {};

      if (attData) {
        attData.forEach((r: any) => {
          const sid = r.student_id;
          if (!attStats[sid]) {
            attStats[sid] = {
              total: 0,
              present: 0,
              name: r.students?.name || 'Aluno',
              className: r.students?.classrooms?.name || 'N/A'
            };
          }
          attStats[sid].total++;
          if (r.is_present) attStats[sid].present++;
        });
      }
      setAttendanceMap(attStats);

    } catch (error) {
      console.error("Error fetching pedagogical data:", error);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to changes
    const subs = [
      supabase.channel('pedagogical_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_plans' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_observations' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedagogical_projects' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'class_attendance_students' }, fetchData)
        .subscribe()
    ];

    return () => { subs.forEach(s => s.unsubscribe()); };
  }, []);

  const performanceStats = useMemo(() => {
    const allInternal = assessments;
    let totalBelowAverage = 0; // Grades
    let totalHighAbsence = 0; // Attendance

    // Structure: ClassName -> { gradesCritical: Set<StudentId>, attendanceCritical: Set<StudentId> }
    const classRiskMap: Record<string, { name: string, gradeRiskCount: number, attendanceRiskCount: number, totalStudents: number }> = {};

    // 1. Analyze Grades
    allInternal.forEach(ass => {
      ass.grades.forEach(g => {
        if (!classRiskMap[ass.className]) {
          classRiskMap[ass.className] = { name: ass.className, gradeRiskCount: 0, attendanceRiskCount: 0, totalStudents: 0 };
        }
        // Very basic count strictly for the dashboard blocks
        if (g.score < 6) {
          totalBelowAverage++;
          classRiskMap[ass.className].gradeRiskCount++;
        }
      });
    });

    // 2. Analyze Attendance
    Object.values(attendanceMap).forEach((stat: any) => {
      const percent = stat.total > 0 ? (stat.present / stat.total) * 100 : 100;
      if (percent < 85) { // < 85% is critical
        totalHighAbsence++;
        if (stat.className && stat.className !== 'N/A') {
          if (!classRiskMap[stat.className]) {
            classRiskMap[stat.className] = { name: stat.className, gradeRiskCount: 0, attendanceRiskCount: 0, totalStudents: 0 };
          }
          classRiskMap[stat.className].attendanceRiskCount++;
        }
      }
    });

    // Sort classes by combined risk
    const criticalClasses = Object.values(classRiskMap)
      .map(c => ({
        ...c,
        riskScore: c.gradeRiskCount + c.attendanceRiskCount
      }))
      .sort((a, b) => b.riskScore - a.riskScore);

    return {
      totalBelowAverage,
      totalHighAbsence,
      criticalClasses,
      externalCount: externalAssessments.length
    };
  }, [assessments, externalAssessments, attendanceMap]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Erro ao tentar ativar modo tela cheia: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleUpdatePlanStatus = async (id: string, status: LessonPlan['status']) => {
    const { error } = await supabase
      .from('lesson_plans')
      .update({
        status: status,
        coordination_feedback: feedbackText
      })
      .eq('id', id);

    if (error) {
      addToast("Erro ao atualizar status do roteiro.", "error");
      return;
    }

    setLessonPlans(prev => prev.map(p => p.id === id ? {
      ...p,
      status,
      coordinationFeedback: feedbackText,
      timestamp: Date.now()
    } : p));
    setSelectedPlan(null);
    setFeedbackText('');
    addToast(status === 'VALIDADO' ? "Roteiro Validado!" : "Feedback enviado ao professor!", "success");
  };

  const generateIAInsights = async () => {
    setAiLoading(true);
    try {
      const payload = {
        observations: observations.slice(0, 5),
        stats: performanceStats,
        plansCount: lessonPlans.length,
        assessments: assessments.slice(0, 3),
        externalAssessments: externalAssessments.slice(0, 3)
      };
      const result = await analyzePedagogicalPerformance(payload);
      setAiInsight(result || 'Não foi possível gerar análise no momento.');
    } catch (e) {
      setAiInsight('Erro na comunicação com a Inteligência Artificial.');
    } finally {
      setAiLoading(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Monitor Pedagógico', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendário Escolar', icon: CalendarDays },
    { id: 'schedules', label: 'Horários (Cronos)', icon: Clock },
    { id: 'referrals', label: 'Encaminhamentos', icon: FileSpreadsheet },
    { id: 'performance', label: 'Alunos em Risco', icon: AlertTriangle },
    { id: 'external_grades', label: 'Avaliações Externas', icon: FileBarChart },
    { id: 'plans', label: 'Validar Roteiros', icon: FileCheck },
    { id: 'occurrences', label: 'Livro de Ocorrência', icon: BookOpen },
    { id: 'observations', label: 'Observação de Aula', icon: Eye },
    { id: 'projects', label: 'Projetos da Escola', icon: Rocket },
    { id: 'ia_insights', label: 'IA Estratégica', icon: BrainCircuit },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/20">
                  <UserX size={24} />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Notas Abaixo Média</p>
                <p className="text-3xl font-black text-red-500 mt-1">{performanceStats?.totalBelowAverage || 0}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-4 border border-violet-500/20">
                  <FileBarChart size={24} />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Avaliações de Sistema</p>
                <p className="text-3xl font-black text-white mt-1">{performanceStats?.externalCount || 0}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                  <Eye size={24} />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Observações Salvas</p>
                <p className="text-3xl font-black text-white mt-1">{observations.length}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                  <Rocket size={24} />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Projetos Ativos</p>
                <p className="text-3xl font-black text-white mt-1">{projects.filter(p => p.status !== 'CONCLUÍDO').length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" /> Turmas em Alerta
                  </h3>
                  <button onClick={() => setActiveTab('performance')} className="text-[10px] font-black text-blue-400 uppercase hover:underline">Ver tudo</button>
                </div>
                <div className="space-y-4">
                  {performanceStats?.criticalClasses.slice(0, 4).map(c => (
                    <div key={c.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-red-400 shadow-sm font-black text-xs border border-white/10">{c.name.split(' ')[0]}</div>
                        <div>
                          <p className="text-xs font-black text-white uppercase">{c.name}</p>
                          <p className="text-[9px] text-white/40 font-bold uppercase">Risco: {c.riskScore} (N:{c.gradeRiskCount} F:{c.attendanceRiskCount})</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${c.riskScore > 5 ? 'text-red-400' : 'text-amber-400'}`}>{c.riskScore > 0 ? 'ATENÇÃO' : 'OK'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-900/80 to-indigo-900/80 p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col justify-between shadow-2xl border border-white/10 backdrop-blur-md">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Sparkles size={160} /></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Diagnóstico IA</h3>
                  <p className="text-violet-200 text-sm leading-relaxed mb-8 italic">"Os resultados do CAED mostram uma divergência de 15% em relação às notas internas de Matemática no 9º Ano. Recomenda-se alinhamento de critérios avaliativos."</p>
                </div>
                <button className="relative z-10 w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/20 transition-all">Relatório IA Completo</button>
              </div>
            </div>
          </div>
        );
      case 'external_grades':
        return <CoordinationExternalGrades />;
      case 'calendar':
        return <UnifiedSchoolCalendar />;
      case 'referrals':
        return <PsychosocialReferralList role="GESTAO" />;
      case 'schedules':
        return <ClassScheduleManager />;
      case 'performance':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Monitoramento Integrado de Risco</h3>
                <p className="text-white/50 font-bold text-[10px] uppercase tracking-widest mt-1">Visão Unificada: Baixo Desempenho (Notas) + Infrequência (Faltas)</p>
              </div>
              <div className="flex gap-4">
                <div className="px-5 py-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl shadow-sm"><FileBarChart size={16} /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase leading-none opacity-60">Notas Críticas</p>
                    <p className="text-xl font-black">{performanceStats?.totalBelowAverage || 0}</p>
                  </div>
                </div>
                <div className="px-5 py-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20 flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl shadow-sm"><UserX size={16} /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase leading-none opacity-60">Infrequentes</p>
                    <p className="text-xl font-black">{performanceStats?.totalHighAbsence || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* 1. ATTENDANCE RISK SECTION */}
              {performanceStats.totalHighAbsence > 0 && (
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-orange-500/20 shadow-xl backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20"><UserX size={24} /></div>
                    <h4 className="text-lg font-black text-white uppercase">Alerta de Evasão (Frequência &lt; 85%)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                    {Object.values(attendanceMap).filter((s: any) => (s.present / s.total) < 0.85).map((student: any, idx) => (
                      <div key={idx} className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10 flex justify-between items-center hover:bg-orange-500/10 transition-all">
                        <div>
                          <p className="text-xs font-black text-white uppercase">{student.name}</p>
                          <p className="text-[10px] font-bold text-white/40 uppercase">{student.className}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-orange-400">{((student.present / student.total) * 100).toFixed(0)}%</p>
                          <p className="text-[8px] font-black text-orange-400/60 uppercase">Presença</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. GRADE RISK SECTION */}
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-red-500/20 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20"><TrendingUp size={24} /></div>
                  <h4 className="text-lg font-black text-white uppercase">Alerta de Desempenho (Notas &lt; 6.0)</h4>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {assessments.map(ass => {
                    const criticalStudents = ass.grades.filter(g => g.score < 6);
                    if (criticalStudents.length === 0) return null;

                    return (
                      <div key={ass.id} className="p-5 border border-white/5 rounded-3xl hover:bg-white/5 transition-all bg-white/5">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h5 className="text-sm font-black text-white uppercase">{ass.subject} <span className="text-white/20 mx-2">•</span> {ass.className}</h5>
                            <p className="text-[10px] font-bold text-white/40 uppercase">{ass.description}</p>
                          </div>
                          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase">{criticalStudents.length} Críticos</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {criticalStudents.map((s, i) => (
                            <span key={i} className="px-3 py-1 bg-red-500/5 border border-red-500/10 rounded-lg text-[10px] font-bold text-red-300 uppercase flex items-center gap-2">
                              {s.studentName} <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[9px] font-black border border-white/5">{s.score}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      case 'plans':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Validação de Roteiros Pedagógicos</h3>
                <p className="text-white/50 font-bold text-[10px] uppercase tracking-widest mt-1">Revisão e Feedback para Roteiros Docentes</p>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl text-[9px] font-black uppercase border border-amber-500/20 flex items-center gap-2">
                  <Clock size={12} /> {lessonPlans.filter(p => p.status === 'EM_ANALISE').length} Aguardando
                </span>
              </div>
            </div>

            {selectedPlan ? (
              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-xl space-y-8 animate-in zoom-in-95 duration-300 backdrop-blur-md">
                <div className="flex justify-between items-start border-b border-white/5 pb-6">
                  <div>
                    <button onClick={() => setSelectedPlan(null)} className="text-violet-400 font-black uppercase text-[9px] flex items-center gap-1 mb-4 hover:text-white transition-all"><ArrowLeft size={10} /> Voltar para lista</button>
                    <h3 className="text-2xl font-black text-white uppercase">{selectedPlan.subject}</h3>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">{selectedPlan.teacher} • {selectedPlan.className} • {selectedPlan.bimestre}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2"><LayoutList size={14} className="text-violet-500" /> Matriz de Habilidades</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {selectedPlan.skills.map(s => (
                          <div key={s.code} className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-[10px] font-black text-violet-400">{s.code}</p>
                            <p className="text-[10px] text-white/70 leading-relaxed">{s.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-violet-900/20 p-8 rounded-[2.5rem] border border-violet-500/20 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-600 text-white rounded-lg shadow-md"><MessageSquare size={18} /></div>
                      <h4 className="text-xs font-black text-violet-300 uppercase tracking-widest">Espaço de Feedback</h4>
                    </div>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="Escreva elogios ou aponte os ajustes necessários aqui..."
                      className="flex-1 w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-sm font-medium outline-none focus:ring-4 focus:ring-violet-600/20 transition-all resize-none text-white placeholder-white/20"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleUpdatePlanStatus(selectedPlan.id, 'VALIDADO')}
                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        <ThumbsUp size={16} /> Validar Roteiro
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {lessonPlans.filter(p => p.status === 'EM_ANALISE').length > 0 ? (
                  lessonPlans.filter(p => p.status === 'EM_ANALISE').map(plan => (
                    <div key={plan.id} onClick={() => setSelectedPlan(plan)} className="group bg-white/5 p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-amber-500/20">
                          <FileCheck size={32} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white uppercase">{plan.subject}</h4>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{plan.teacher} • Turma: {plan.className}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-white/40 uppercase">Enviado em</p>
                          <p className="text-[11px] font-bold text-white/80">{new Date(plan.timestamp).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <ChevronRight size={24} className="text-white/20 group-hover:text-violet-400 transition-all" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/5">
                    <ThumbsUp size={48} className="mx-auto mb-4 text-emerald-500/50" />
                    <p className="text-white/40 font-black uppercase text-xs tracking-widest">Nenhum roteiro aguardando validação</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'observations':
        return <ClassroomObservationForm user={user} />;
      case 'occurrences':
        return <PedagogicalOccurrenceBook />;
      case 'projects':
        return <SchoolProjectManager />;
      case 'ia_insights':
        return (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="bg-gradient-to-br from-violet-900/80 to-indigo-900/80 p-12 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md">
              <div className="absolute top-0 right-0 p-12 opacity-10"><BrainCircuit size={160} /></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/10">
                    <Sparkles size={32} className="text-violet-400" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">IA Coordenador Estratégico</h2>
                </div>
                <p className="text-violet-200 text-lg font-medium leading-relaxed max-w-2xl">Diagnóstico automatizado correlacionando notas internas e resultados do CAED/Estruturado para fortalecer a aprendizagem.</p>
                <button
                  onClick={generateIAInsights}
                  disabled={aiLoading}
                  className="px-10 py-5 bg-white/10 border border-white/20 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-white/20 active:scale-95 transition-all flex items-center gap-3"
                >
                  {aiLoading ? <Loader2 className="animate-spin" size={20} /> : <Lightbulb size={20} />} Gerar Plano de Intervenção Global
                </button>
              </div>
            </div>

            {aiInsight && (
              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-xl animate-in zoom-in-95 duration-500 backdrop-blur-md">
                <div className="flex items-center gap-3 text-violet-400 mb-8 font-black uppercase text-xs tracking-[0.2em]">
                  <CheckCircle2 size={18} /> Análise Pedagógica Multidimensional
                </div>
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-white/80 font-medium leading-relaxed">
                    {aiInsight}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans relative overflow-hidden text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2622&auto=format&fit=crop')] bg-cover bg-center opacity-20 fixed"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-violet-950 to-black fixed opacity-90"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite] fixed"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite] fixed"></div>
      </div>

      <div className="relative z-10 flex h-screen">
        <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col no-print">
          <div className="p-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-violet-500/20">🎓</span>
              Gestão Ped.
            </h1>
          </div>
          <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                  ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-violet-500/30'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-white/10 space-y-3">
            <button onClick={onExit} className="w-full flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all text-white/60">
              <ArrowLeft size={16} /> Voltar ao Hub
            </button>
            <div className="bg-violet-900/40 p-4 rounded-2xl border border-violet-500/20 backdrop-blur-sm">
              <p className="text-[10px] text-violet-300 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ShieldCheck size={10} /> Coordenação Ativa</p>
              <div className="text-xs font-black uppercase tracking-tight text-white/80">Padrão SEDUC-MT</div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-20 bg-transparent border-b border-white/10 flex items-center justify-between px-10 shrink-0 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 text-violet-400 rounded-lg border border-white/10"><Sparkles size={20} /></div>
              <h2 className="text-sm font-black text-white/80 uppercase tracking-tight leading-none">Módulo: Coordenação Pedagógica</h2>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={toggleFullScreen}
                className="p-2.5 text-white/40 hover:bg-white/10 hover:text-white rounded-xl transition-all group flex items-center gap-2"
                title="Alternar Tela Cheia"
              >
                <Maximize2 size={18} className="group-hover:text-violet-400" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Expandir</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-black text-white">Coordenador André</p>
                  <p className="text-[9px] text-violet-400 font-black uppercase tracking-widest">Gestão de Ensino</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-500/20 border border-white/10">CA</div>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {renderContent()}
          </div>
        </main>
        <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); }
      `}</style>
      </div>
    </div>
  );
};

export default PedagogicalModule;
