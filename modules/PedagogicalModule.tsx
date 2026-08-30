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
  MessageSquare as MessageSquareIcon,
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
  FileSpreadsheet,
  Filter,
  Music,
  Printer,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ClassroomObservation, PedagogicalProject, LessonPlan, Assessment, PedagogicalIntervention } from '../types';
import { analyzePedagogicalPerformance } from '../geminiService';
import { useToast } from '../components/Toast';
import CoordinationExternalGrades from '../components/CoordinationExternalGrades';
import ClassroomObservationForm from '../components/ClassroomObservationForm';
import PedagogicalOccurrenceBook from '../components/PedagogicalOccurrenceBook';
import UnifiedSchoolCalendar from '../components/UnifiedSchoolCalendar';
import PsychosocialReferralList from '../components/PsychosocialReferralList';
import ClassScheduleManager from '../components/ClassScheduleManager';
import SchoolProjectManager from '../components/SchoolProjectManager';
import ClassCouncilManager from '../components/ClassCouncilManager';
import OfficialOficiosManager from '../components/OfficialOficiosManager';
import OfficialAtasManager from '../components/OfficialAtasManager';
import SpecialEducationAEEHub from '../components/SpecialEducationAEEHub';
import CoordinationRiskRadar from '../components/CoordinationRiskRadar';
import EducarteReports from '../components/EducarteReports';

import { User as UserType } from '../types';

interface PedagogicalModuleProps {
  onExit: () => void;
  user: UserType;
}

type TabType = 'dashboard' | 'performance' | 'aee_special_education' | 'educarte' | 'plans' | 'occurrences' | 'observations' | 'class_council' | 'external_grades' | 'referrals' | 'oficios' | 'atas' | 'calendar' | 'schedules' | 'projects' | 'ia_insights';

const PedagogicalModule: React.FC<PedagogicalModuleProps> = ({ onExit, user }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [riskFilter, setRiskFilter] = useState<'ALL' | 'GRADES' | 'ATTENDANCE'>('ALL');

  const [filterTurma, setFilterTurma] = useState<string>('');
  const [filterStudent, setFilterStudent] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');

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
  const [interventions, setInterventions] = useState<PedagogicalIntervention[]>([]);
  const [activeBuscaAtivaIds, setActiveBuscaAtivaIds] = useState<Set<string>>(new Set());
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [interventionStudent, setInterventionStudent] = useState<{name: string, className: string} | null>(null);
  const [newIntervention, setNewIntervention] = useState({ reason: '', action_plan: '', deadline: '', status: 'EM_ANDAMENTO' as 'EM_ANDAMENTO' | 'AGUARDANDO_FAMILIA' | 'RESOLVIDO' });
  const [isSavingIntervention, setIsSavingIntervention] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch Assessments
      const { data: assessData } = await supabase
        .from('assessments')
        .select(`
          *,
          users (name),
          classrooms (name),
          grades (
            score,
            student_name
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
          grades: (a.grades || []).map((g: any) => ({
            studentId: 'N/A',
            studentName: g.student_name || 'Aluno',
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
        setLessonPlans(plansData.map(p => {
          const content = p.content_json || {};
          return {
            id: p.id,
            bimestre: p.bimestre,
            subject: p.subject,
            teacher: content.teacher || p.users?.name || 'Professor',
            year: content.year || 'N/A',
            className: content.className || p.classrooms?.name || 'N/A',
            classNames: content.classNames || (content.className ? [content.className] : []),
            weeklyClasses: content.weeklyClasses || '4',
            skills: content.skills || [],
            recompositionSkills: content.recompositionSkills || [],
            themes: p.themes || content.themes || '',
            rows: content.rows || [],
            status: p.status as LessonPlan['status'],
            coordinationFeedback: p.coordination_feedback,
            history: content.history || [],
            timestamp: new Date(p.created_at).getTime()
          };
        }));
      }

      // 3. Fetch Observations
      const { data: obsData } = await supabase
        .from('classroom_observations')
        .select('*');
      if (obsData) setObservations(obsData);

      // 4. Fetch Projects
      const { data: projData } = await supabase
        .from('pedagogical_projects')
        .select('*');
      if (projData) setProjects(projData);

      // 5. Fetch Attendance Aggregates
      const { data: attData } = await supabase
        .from('attendance')
        .select('student_name, status, classrooms(name)');

      if (attData) {
        const attMap: Record<string, { total: number, present: number, name: string, className: string }> = {};
        attData.forEach((record: any) => {
          const name = record.student_name;
          const cls = record.classrooms?.name || 'Geral';
          const key = `${name}_${cls}`;
          if (!attMap[key]) {
            attMap[key] = { total: 0, present: 0, name, className: cls };
          }
          attMap[key].total += 1;
          if (record.status === 'PRESENTE') attMap[key].present += 1;
        });
        setAttendanceMap(attMap);
      }

      // 6. Fetch Active Interventions
      const { data: intervData } = await supabase
        .from('pedagogical_interventions')
        .select('*')
        .order('created_at', { ascending: false });
      if (intervData) setInterventions(intervData);

    } catch (err) {
      console.error('Error fetching pedagogical data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uniqueTurmas = useMemo(() => {
    const fromAssess = assessments.map(a => a.className);
    const fromPlans = lessonPlans.map(p => p.className);
    const fromObs = observations.map(o => o.classroom_name);
    return Array.from(new Set([...fromAssess, ...fromPlans, ...fromObs])).filter(Boolean).sort();
  }, [assessments, lessonPlans, observations]);

  const uniqueSubjects = useMemo(() => {
    const fromAssess = assessments.map(a => a.subject);
    const fromPlans = lessonPlans.map(p => p.subject);
    return Array.from(new Set([...fromAssess, ...fromPlans])).filter(Boolean).sort();
  }, [assessments, lessonPlans]);

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      if (filterTurma && a.className !== filterTurma) return false;
      if (filterSubject && a.subject !== filterSubject) return false;
      return true;
    });
  }, [assessments, filterTurma, filterSubject]);

  const filteredPlans = useMemo(() => {
    return lessonPlans.filter(p => {
      if (filterTurma && p.className !== filterTurma) return false;
      if (filterSubject && p.subject !== filterSubject) return false;
      return true;
    });
  }, [lessonPlans, filterTurma, filterSubject]);

  // Performance Stats
  const performanceStats = useMemo(() => {
    const belowAvgStudents = new Set<string>();
    const highAbsenceStudents = new Set<string>();
    const gradeRiskList: { name: string, className: string, avg: number }[] = [];
    const attendanceRiskList: { name: string, className: string, rate: number }[] = [];

    filteredAssessments.forEach(ass => {
      ass.grades.forEach(g => {
        if (g.score < 6.0) {
          belowAvgStudents.add(`${g.studentName}_${ass.className}`);
          gradeRiskList.push({ name: g.studentName, className: ass.className, avg: g.score });
        }
      });
    });

    Object.values(attendanceMap).forEach(s => {
      if (s.total >= 5 && (s.present / s.total) < 0.85) {
        highAbsenceStudents.add(`${s.name}_${s.className}`);
        attendanceRiskList.push({
          name: s.name,
          className: s.className,
          rate: Math.round((s.present / s.total) * 100)
        });
      }
    });

    const classRiskScores: Record<string, { riskScore: number, gradeRiskCount: number, attendanceRiskCount: number }> = {};
    uniqueTurmas.forEach(t => {
      const gCount = gradeRiskList.filter(s => s.className === t).length;
      const aCount = attendanceRiskList.filter(s => s.className === t).length;
      classRiskScores[t] = {
        riskScore: gCount * 2 + aCount * 3,
        gradeRiskCount: gCount,
        attendanceRiskCount: aCount
      };
    });

    const criticalClasses = Object.entries(classRiskScores)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.riskScore - a.riskScore);

    return {
      totalBelowAverage: belowAvgStudents.size,
      totalHighAbsence: highAbsenceStudents.size,
      gradeRisk: gradeRiskList,
      attendanceRisk: attendanceRiskList,
      criticalClasses,
      externalCount: externalAssessments.length
    };
  }, [filteredAssessments, attendanceMap, uniqueTurmas, externalAssessments]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleApprovePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lesson_plans')
        .update({ status: 'APROVADO', coordination_feedback: feedbackText })
        .eq('id', id);

      if (!error) {
        setLessonPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'APROVADO', coordinationFeedback: feedbackText } : p));
        setSelectedPlan(null);
        setFeedbackText('');
        addToast({ title: 'Sucesso', message: 'Roteiro pedagógico aprovado com sucesso!', type: 'success' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectPlan = async (id: string) => {
    if (!feedbackText.trim()) {
      alert('Por favor, informe um parecer ou motivo para solicitar ajustes.');
      return;
    }
    try {
      const { error } = await supabase
        .from('lesson_plans')
        .update({ status: 'REJEITADO', coordination_feedback: feedbackText })
        .eq('id', id);

      if (!error) {
        setLessonPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'REJEITADO', coordinationFeedback: feedbackText } : p));
        setSelectedPlan(null);
        setFeedbackText('');
        addToast({ title: 'Aviso', message: 'Solicitação de ajustes enviada ao professor.', type: 'info' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Monitor Pedagógico 360°', icon: LayoutDashboard },
    { id: 'performance', label: 'Radar de Alunos em Risco', icon: AlertTriangle, highlight: true },
    { id: 'aee_special_education', label: 'Educação Especial (PAEDE)', icon: BrainCircuit },
    { id: 'educarte', label: 'Supervisão Banda Educarte', icon: Music },
    { id: 'plans', label: 'Validar Roteiros Pedagógicos', icon: FileCheck },
    { id: 'occurrences', label: 'Livro de Ocorrências', icon: BookOpen },
    { id: 'observations', label: 'Observação de Aula', icon: Eye },
    { id: 'class_council', label: 'Conselho de Classe', icon: Users },
    { id: 'external_grades', label: 'Avaliações Externas (CAED)', icon: FileBarChart },
    { id: 'referrals', label: 'Encaminhamentos', icon: FileSpreadsheet },
    { id: 'oficios', label: 'Ofícios Expedidos', icon: FileText },
    { id: 'atas', label: 'Registro de Atas', icon: FileSpreadsheet },
    { id: 'calendar', label: 'Calendário Escolar', icon: CalendarDays },
    { id: 'schedules', label: 'Horários (Cronos)', icon: Clock },
    { id: 'projects', label: 'Projetos da Escola', icon: Rocket },
    { id: 'ia_insights', label: 'IA Estratégica', icon: Sparkles },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* CARDS DE MONITORAMENTO DA COORDENAÇÃO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                  <UserX size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas Abaixo da Média</p>
                  <p className="text-3xl font-black text-rose-600 mt-0.5">{performanceStats.totalBelowAverage}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-black">
                  <FileBarChart size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliações Externas (CAED)</p>
                  <p className="text-3xl font-black text-slate-900 mt-0.5">{performanceStats.externalCount}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <Eye size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações de Aula</p>
                  <p className="text-3xl font-black text-slate-900 mt-0.5">{observations.length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                  <Rocket size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projetos Ativos</p>
                  <p className="text-3xl font-black text-slate-900 mt-0.5">{projects.filter(p => p.status !== 'CONCLUÍDO').length}</p>
                </div>
              </div>
            </div>

            {/* TURMAS EM ALERTA & CARD DIAGNÓSTICO IA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <AlertTriangle size={20} className="text-amber-500" /> Turmas em Alerta Pedagógico
                  </h3>
                  <button onClick={() => setActiveTab('performance')} className="text-xs font-black text-indigo-600 uppercase hover:underline">
                    Ver Radar 360°
                  </button>
                </div>

                <div className="space-y-3">
                  {performanceStats.criticalClasses.slice(0, 4).map(c => (
                    <div key={c.name} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                          {c.name.split(' ')[0]}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">
                            Risco: {c.riskScore} (Notas: {c.gradeRiskCount} • Faltas: {c.attendanceRiskCount})
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        c.riskScore > 5 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {c.riskScore > 0 ? 'ATENÇÃO' : 'OK'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD DIAGNÓSTICO IA */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-8 rounded-[3rem] text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                  <Sparkles size={140} />
                </div>
                <div className="relative z-10 space-y-3">
                  <span className="px-3.5 py-1 bg-white/10 text-indigo-200 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    ✨ Diagnóstico Estratégico IA
                  </span>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white mt-1">
                    Panorama Geral da Escola
                  </h3>
                  <p className="text-indigo-200 text-xs leading-relaxed font-medium italic">
                    "O cruzamento dos dados de desempenho indica necessidade de recomposição de aprendizagem em Matemática nos 7º e 8º Anos. A assiduidade geral está em 87,4%, dentro da meta SEDUC-MT."
                  </p>
                </div>
                <div className="pt-6 relative z-10">
                  <button
                    onClick={() => setActiveTab('ia_insights')}
                    className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-md"
                  >
                    Abrir Diagnóstico Completo com IA
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'performance':
        return <CoordinationRiskRadar user={user} onNavigateTab={(t) => setActiveTab(t as TabType)} />;

      case 'aee_special_education':
        return <SpecialEducationAEEHub sourceModule="COORDENACAO" user={user} />;

      case 'educarte': {
        const savedMembers = localStorage.getItem('educarte_members_v1');
        const educarteMembers = savedMembers ? JSON.parse(savedMembers) : [];
        const savedInstruments = localStorage.getItem('educarte_instruments_v1');
        const educarteInstruments = savedInstruments ? JSON.parse(savedInstruments) : [];
        const savedAttendance = localStorage.getItem('educarte_attendance_records_v1');
        const educarteAttendance = savedAttendance ? JSON.parse(savedAttendance) : [];
        const savedEvents = localStorage.getItem('educarte_events_v1');
        const educarteEvents = savedEvents ? JSON.parse(savedEvents) : [];
        return (
          <EducarteReports
            members={educarteMembers}
            instruments={educarteInstruments}
            attendanceRecords={educarteAttendance}
            events={educarteEvents}
          />
        );
      }

      case 'plans':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <FileCheck className="text-indigo-600" size={24} /> Validação de Roteiros Pedagógicos (BNCC)
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Supervisão, pareceres e feedback pedagógico para os professores
                </p>
              </div>

              <span className="px-4 py-2 bg-amber-100 text-amber-900 rounded-xl text-xs font-black uppercase flex items-center gap-2">
                <Clock size={14} /> {filteredPlans.filter(p => p.status === 'EM_ANALISE').length} Aguardando Análise
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.length > 0 ? (
                filteredPlans.map(plan => (
                  <div
                    key={plan.id}
                    className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase">
                          {plan.className}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                          plan.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-800' :
                          plan.status === 'REJEITADO' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {plan.status === 'EM_ANALISE' ? 'EM ANÁLISE' : plan.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase leading-tight">{plan.subject}</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">Prof. {plan.teacher}</p>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-3 font-medium">
                        {plan.themes || 'Roteiro pedagógico estruturado com base nas competências da BNCC e DRC-MT.'}
                      </p>

                      {plan.coordinationFeedback && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-[11px] text-indigo-900 font-medium">
                          <strong>Parecer da Coordenação:</strong> {plan.coordinationFeedback}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setFeedbackText(plan.coordinationFeedback || '');
                      }}
                      className="w-full py-3 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-800 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={14} /> Analisar & Emitir Parecer
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest bg-white rounded-[3rem] border border-slate-200">
                  Nenhum roteiro pedagógico encontrado nesta busca
                </div>
              )}
            </div>

            {/* MODAL DE VALIDAÇÃO DE ROTEIRO */}
            {selectedPlan && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 my-8">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase">
                        {selectedPlan.className} • {selectedPlan.subject}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-2">
                        Roteiro de {selectedPlan.teacher}
                      </h3>
                    </div>
                    <button onClick={() => setSelectedPlan(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Parecer / Orientações da Coordenação Pedagógica:
                    </label>
                    <textarea
                      rows={4}
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="Descreva o parecer pedagógico, elogios ou orientações para aprimoramento das atividades..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleRejectPlan(selectedPlan.id)}
                      className="px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
                    >
                      Solicitar Ajustes
                    </button>
                    <button
                      onClick={() => handleApprovePlan(selectedPlan.id)}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Aprovar Roteiro
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'occurrences':
        return <PedagogicalOccurrenceBook />;

      case 'observations':
        return <ClassroomObservationForm />;

      case 'class_council':
        return <ClassCouncilManager />;

      case 'external_grades':
        return <CoordinationExternalGrades globalFilterTurma={filterTurma} globalFilterSubject={filterSubject} />;

      case 'referrals':
        return <PsychosocialReferralList role="GESTAO" />;

      case 'oficios':
        return <OfficialOficiosManager moduleSource="COORDENACAO" user={user} />;

      case 'atas':
        return <OfficialAtasManager moduleSource="COORDENACAO" user={user} />;

      case 'calendar':
        return <UnifiedSchoolCalendar user={user} />;

      case 'schedules':
        return <ClassScheduleManager />;

      case 'projects':
        return <SchoolProjectManager />;

      case 'ia_insights':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="text-indigo-600" size={24} /> Inteligência Artificial Estratégica
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Diagnósticos preditivos e recomendações de recomposição de aprendizagem (Gemini)
                  </p>
                </div>

                <button
                  onClick={async () => {
                    setAiLoading(true);
                    setAiInsight(null);
                    try {
                      const res = await analyzePedagogicalPerformance({
                        assessments: filteredAssessments,
                        observations,
                        projects
                      });
                      setAiInsight(res);
                    } catch (e) {
                      setAiInsight("Erro ao processar diagnóstico de IA.");
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  disabled={aiLoading}
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
                  {aiLoading ? 'Processando Diagnóstico...' : 'Gerar Análise Estratégica Global'}
                </button>
              </div>

              {aiInsight ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line max-h-[30rem] overflow-y-auto custom-scrollbar">
                  {aiInsight}
                </div>
              ) : (
                <div className="py-20 text-center space-y-3">
                  <BrainCircuit size={48} className="mx-auto text-slate-300" />
                  <h4 className="text-base font-black uppercase text-slate-700">Nenhum diagnóstico gerado ainda</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                    Clique no botão acima para a IA analisar todas as avaliações internas, observações de aula e projetos pedagógicos da escola.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      
      {/* SIDEBAR MODERNA DA COORDENAÇÃO (Slate Escuro / Indigo) */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col no-print transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} border-r border-white/10 shadow-2xl`}>
        
        {/* LOGO & CABEÇALHO DA SIDEBAR */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 font-black text-lg">
              🎓
            </div>
            <div>
              <h1 className="font-black text-sm uppercase tracking-tight text-white leading-tight">Coordenação</h1>
              <p className="text-[9px] text-purple-300 font-bold uppercase tracking-widest">E.E. André Maggi</p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* LISTA DE SUBMÓDULOS */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon size={17} className={isActive ? 'text-white' : 'text-purple-300'} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* RODAPÉ DA SIDEBAR */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            <ArrowLeft size={16} /> Voltar ao Hub
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL COM HEADER FLUTUANTE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-10 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
            >
              <LayoutList size={20} />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">
                Coordenação Pedagógica
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Gestão Curricular, BNCC & Acompanhamento de Aprendizagem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleFullScreen}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all hidden sm:flex items-center gap-1.5 text-xs font-black uppercase"
              title="Tela Cheia"
            >
              <Maximize2 size={16} />
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 uppercase">{user.name || 'Coordenador'}</p>
                <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">{user.jobFunction || user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-purple-500/20">
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'CO'}
              </div>
            </div>
          </div>
        </header>

        {/* BARRA DE FILTROS RÁPIDOS */}
        <div className="bg-white border-b border-slate-200/60 px-6 lg:px-10 py-3 flex flex-wrap items-center gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Filtros:</span>
          </div>

          <select
            value={filterTurma}
            onChange={(e) => setFilterTurma(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
          >
            <option value="">TODAS AS TURMAS</option>
            {uniqueTurmas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer text-indigo-900"
          >
            <option value="">TODAS AS DISCIPLINAS</option>
            {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white w-44"
            />
          </div>

          {(filterTurma || filterSubject || filterStudent) && (
            <button
              onClick={() => { setFilterTurma(''); setFilterSubject(''); setFilterStudent(''); }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* CONTEÚDO PRINCIPAL RENDERIZADO */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

    </div>
  );
};

export default PedagogicalModule;
