import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Users,
  Search,
  Filter,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  Phone,
  Printer,
  ChevronRight,
  Shield,
  Clock,
  Eye,
  FileText,
  UserX,
  Award,
  Loader2,
  X,
  ArrowRight,
  Music,
  Send,
  AlertCircle,
  HelpCircle,
  School,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { supabase } from '../supabaseClient';
import { User as UserType } from '../types';
import { SCHOOL_CLASSES, INITIAL_STUDENTS } from '../constants/initialData';
import { generateCoordinationClassCouncilWithAI, analyzeIndividualStudentWithAI } from '../geminiService';

interface CoordinationRiskRadarProps {
  user?: UserType;
  onNavigateTab?: (tab: string) => void;
}

const PROFICIENCY_COLORS = {
  'AVANÇADO': '#10B981', // Verde
  'ADEQUADO': '#3B82F6', // Azul
  'BÁSICO': '#F59E0B',   // Âmbar
  'ABAIXO': '#EF4444'    // Vermelho
};

const CoordinationRiskRadar: React.FC<CoordinationRiskRadarProps> = ({ user, onNavigateTab }) => {
  const [selectedClass, setSelectedClass] = useState<string>('TODAS');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'GRADES' | 'ATTENDANCE' | 'PAEDE' | 'EDUCARTE' | 'EVOLVING' | 'DECLINING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [classBottlenecks, setClassBottlenecks] = useState<{ subject: string; failingCount: number; percentage: number }[]>([]);
  const [classEvolution, setClassEvolution] = useState<{ b1: number | null; b2: number | null; b3: number | null }>({ b1: null, b2: null, b3: null });
  const [loading, setLoading] = useState(false);

  // Modal Ficha 360° do Aluno
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [aiStudentOpinion, setAiStudentOpinion] = useState<string | null>(null);
  const [loadingAiStudent, setLoadingAiStudent] = useState(false);

  // Modal Conselho de Classe com IA
  const [isCouncilModalOpen, setIsCouncilModalOpen] = useState(false);
  const [aiCouncilReport, setAiCouncilReport] = useState<string | null>(null);
  const [loadingAiCouncil, setLoadingAiCouncil] = useState(false);

  // Modal Plano de Intervenção Pedagógica (PIP)
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [interventionSuccess, setInterventionSuccess] = useState(false);
  const [interventionData, setInterventionData] = useState({
    actionPlan: '',
    referTo: 'NENHUM', // 'PSICOSSOCIAL' | 'MEDIACAO' | 'SALA_RECURSOS' | 'BUSCA_ATIVA' | 'NENHUM'
    deadline: new Date(Date.now() + 15 * 86400000).toLocaleDateString('sv-SE')
  });

  // Carregar turmas e dados consolidados reais do Supabase
  const loadConsolidatedData = async () => {
    setLoading(true);
    try {
      // 1. Carregar turmas ativas do banco
      const { data: dbClasses } = await supabase
        .from('classrooms')
        .select('id, name, shift, room_number')
        .order('name');

      const classNames = dbClasses && dbClasses.length > 0 
        ? dbClasses.map(c => c.name) 
        : SCHOOL_CLASSES;
      setAvailableClasses(classNames);

      // 2. Carregar integrantes do Educarte
      let educarteMembers: any[] = [];
      try {
        const saved = localStorage.getItem('educarte_members_v1');
        if (saved) educarteMembers = JSON.parse(saved);
      } catch (e) { }
      const educarteMap = new Map(educarteMembers.map(m => [(m.name || '').toUpperCase().trim(), m]));

      // 3. Carregar estudantes e enturmações ativas
      const { data: dbStudents } = await supabase
        .from('students')
        .select(`
          id,
          name,
          registration_number,
          paed,
          contact_phone,
          guardian_name,
          status,
          enrollments (
            status,
            classroom_id,
            classrooms (id, name, shift)
          )
        `)
        .eq('status', 'ATIVO')
        .order('name', { ascending: true });

      // 4. Carregar avaliações oficiais bimestrais
      const { data: dbAssessments } = await supabase
        .from('assessments')
        .select('id, classroom_id, subject, bimestre')
        .eq('type', 'AVALIACAO_BIMESTRAL');

      const assessMap = new Map((dbAssessments || []).map(a => [a.id, a]));

      // 5. Carregar notas bimestrais oficiais
      // Se tiver uma turma selecionada, carregar com filtro específico de avaliações da turma
      let targetAssessmentIds: string[] = [];
      if (selectedClass !== 'TODAS' && dbClasses) {
        const targetClass = dbClasses.find(c => c.name === selectedClass);
        if (targetClass) {
          targetAssessmentIds = (dbAssessments || []).filter(a => a.classroom_id === targetClass.id).map(a => a.id);
        }
      }

      let gradesQuery = supabase
        .from('grades')
        .select('assessment_id, student_id, student_code, score');

      if (targetAssessmentIds.length > 0) {
        gradesQuery = gradesQuery.in('assessment_id', targetAssessmentIds);
      } else {
        gradesQuery = gradesQuery.limit(5000);
      }

      const { data: dbGrades } = await gradesQuery;

      // Mapear notas por estudante
      const gradesByStudent = new Map<string, any[]>();
      if (dbGrades && dbGrades.length > 0) {
        for (const g of dbGrades) {
          if (g.score === null || isNaN(g.score)) continue;
          const sId = g.student_id;
          if (!sId) continue;
          if (!gradesByStudent.has(sId)) gradesByStudent.set(sId, []);
          const a = assessMap.get(g.assessment_id);
          if (a) {
            gradesByStudent.get(sId)!.push({
              subject: a.subject,
              bimestre: a.bimestre,
              score: Number(g.score)
            });
          }
        }
      }

      // 6. Carregar frequência oficial
      const { data: attData } = await supabase
        .from('class_attendance_students')
        .select('student_id, is_present');

      const attendanceByCode = new Map<string, { total: number; present: number }>();
      if (attData && attData.length > 0) {
        for (const row of attData) {
          const code = row.student_id;
          if (!code) continue;
          if (!attendanceByCode.has(code)) attendanceByCode.set(code, { total: 0, present: 0 });
          const curr = attendanceByCode.get(code)!;
          curr.total += 1;
          if (row.is_present) curr.present += 1;
        }
      }

      // 7. Construir perfis consolidados de cada estudante
      const baseList = (dbStudents && dbStudents.length > 0)
        ? dbStudents.map((s: any) => {
            const activeEnrollment = s.enrollments?.find((e: any) => e.status === 'ATIVO') || s.enrollments?.[0];
            const className = activeEnrollment?.classrooms?.name || 'Sem Turma';
            const shift = activeEnrollment?.classrooms?.shift || 'MATUTINO';
            const isPaed = s.paed === true;
            const educarte = educarteMap.get((s.name || '').toUpperCase().trim());

            // Notas do estudante
            const studentGrades = gradesByStudent.get(s.id) || [];
            
            // Frequência real
            const att = s.registration_number ? attendanceByCode.get(s.registration_number) : null;
            let presenceRate = 90;
            let absences = 2;
            if (att && att.total > 0) {
              presenceRate = Math.round((att.present / att.total) * 100);
              absences = att.total - att.present;
            }

            // Histórico e médias por disciplina
            const subjectMap = new Map<string, { b1: number | null; b2: number | null; b3: number | null }>();
            for (const g of studentGrades) {
              if (!subjectMap.has(g.subject)) {
                subjectMap.set(g.subject, { b1: null, b2: null, b3: null });
              }
              const entry = subjectMap.get(g.subject)!;
              if (g.bimestre === '1º BIMESTRE') entry.b1 = g.score;
              else if (g.bimestre === '2º BIMESTRE') entry.b2 = g.score;
              else if (g.bimestre === '3º BIMESTRE') entry.b3 = g.score;
            }

            const gradesHistory: { subject: string; b1: number | null; b2: number | null; b3: number | null; score: number }[] = [];
            const failingSubjects: { subject: string; score: number }[] = [];

            subjectMap.forEach((bims, subject) => {
              const validScores = [bims.b1, bims.b2, bims.b3].filter((v): v is number => v !== null);
              const subjectAvg = validScores.length > 0 
                ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1))
                : 0;

              gradesHistory.push({
                subject,
                b1: bims.b1,
                b2: bims.b2,
                b3: bims.b3,
                score: subjectAvg
              });

              if (subjectAvg > 0 && subjectAvg < 6.0) {
                failingSubjects.push({ subject, score: subjectAvg });
              }
            });

            // Médias bimestrais gerais do aluno
            const b1List = studentGrades.filter(g => g.bimestre === '1º BIMESTRE').map(g => g.score);
            const b2List = studentGrades.filter(g => g.bimestre === '2º BIMESTRE').map(g => g.score);
            const b3List = studentGrades.filter(g => g.bimestre === '3º BIMESTRE').map(g => g.score);

            const avgB1 = b1List.length > 0 ? Number((b1List.reduce((a, b) => a + b, 0) / b1List.length).toFixed(1)) : null;
            const avgB2 = b2List.length > 0 ? Number((b2List.reduce((a, b) => a + b, 0) / b2List.length).toFixed(1)) : null;
            const avgB3 = b3List.length > 0 ? Number((b3List.reduce((a, b) => a + b, 0) / b3List.length).toFixed(1)) : null;

            const allScores = studentGrades.map(g => g.score);
            const overallAverage = allScores.length > 0
              ? Number((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1))
              : (isPaed ? 7.0 : 6.5);

            // Trajetória de Evolução
            let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
            if (avgB3 !== null && avgB2 !== null) {
              if (avgB3 >= avgB2 + 0.3) trend = 'UP';
              else if (avgB3 <= avgB2 - 0.3) trend = 'DOWN';
            } else if (avgB2 !== null && avgB1 !== null) {
              if (avgB2 >= avgB1 + 0.3) trend = 'UP';
              else if (avgB2 <= avgB1 - 0.3) trend = 'DOWN';
            }

            // Nível de Risco Oficial
            let riskLevel: 'CRITICO' | 'ALERTA' | 'REGULAR' | 'BOM' = 'BOM';
            if (overallAverage < 5.0 || failingSubjects.length >= 3 || presenceRate < 75) {
              riskLevel = 'CRITICO';
            } else if (overallAverage < 6.0 || failingSubjects.length >= 1 || presenceRate < 85 || trend === 'DOWN') {
              riskLevel = 'ALERTA';
            } else if (overallAverage < 7.0) {
              riskLevel = 'REGULAR';
            }

            return {
              id: s.id,
              name: (s.name || '').trim(),
              registration: s.registration_number,
              className,
              shift,
              phone: s.contact_phone || '(66) 99999-0000',
              guardianName: s.guardian_name || 'Responsável',
              isPaed,
              paedDiagnosis: isPaed ? 'Adaptação Curricular / Laudo PAEDE - AEE' : '',
              paedCid: isPaed ? 'CID F84 / F90' : '',
              paedHasCarer: false,
              educarte,
              averageGrade: overallAverage,
              avgB1,
              avgB2,
              avgB3,
              presenceRate,
              absencesCount: absences,
              occurrencesCount: 0,
              riskLevel,
              trend,
              gradesHistory,
              failingSubjects
            };
          })
        : [];

      setStudents(baseList);

      // 8. Calcular gargalos da turma e médias da classe
      const activeClassStudents = selectedClass === 'TODAS'
        ? baseList
        : baseList.filter(s => s.className === selectedClass);

      if (activeClassStudents.length > 0) {
        // Médias bimestrais da turma
        const classB1 = activeClassStudents.map(s => s.avgB1).filter((v): v is number => v !== null);
        const classB2 = activeClassStudents.map(s => s.avgB2).filter((v): v is number => v !== null);
        const classB3 = activeClassStudents.map(s => s.avgB3).filter((v): v is number => v !== null);

        setClassEvolution({
          b1: classB1.length > 0 ? Number((classB1.reduce((a, b) => a + b, 0) / classB1.length).toFixed(1)) : null,
          b2: classB2.length > 0 ? Number((classB2.reduce((a, b) => a + b, 0) / classB2.length).toFixed(1)) : null,
          b3: classB3.length > 0 ? Number((classB3.reduce((a, b) => a + b, 0) / classB3.length).toFixed(1)) : null,
        });

        // Contagem de insucessos por disciplina na turma
        const failCountBySubject: Record<string, number> = {};
        activeClassStudents.forEach(st => {
          st.failingSubjects.forEach((f: any) => {
            failCountBySubject[f.subject] = (failCountBySubject[f.subject] || 0) + 1;
          });
        });

        const bottlenecks = Object.entries(failCountBySubject)
          .map(([subject, count]) => ({
            subject,
            failingCount: count,
            percentage: Math.round((count / activeClassStudents.length) * 100)
          }))
          .sort((a, b) => b.failingCount - a.failingCount)
          .slice(0, 5);

        setClassBottlenecks(bottlenecks);
      } else {
        setClassBottlenecks([]);
        setClassEvolution({ b1: null, b2: null, b3: null });
      }

    } catch (e) {
      console.error("Error loading consolidated pedagogical data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsolidatedData();
  }, [selectedClass]);

  // Filtragem dos Alunos
  const filteredStudents = useMemo(() => {
    return students
      .filter(s => selectedClass === 'TODAS' || s.className === selectedClass)
      .filter(s => {
        if (riskFilter === 'CRITICAL') return s.riskLevel === 'CRITICO';
        if (riskFilter === 'GRADES') return s.averageGrade < 6.0;
        if (riskFilter === 'ATTENDANCE') return s.presenceRate < 85;
        if (riskFilter === 'PAEDE') return s.isPaed === true;
        if (riskFilter === 'EDUCARTE') return !!s.educarte;
        if (riskFilter === 'EVOLVING') return s.trend === 'UP';
        if (riskFilter === 'DECLINING') return s.trend === 'DOWN';
        return true;
      })
      .filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.educarte?.instrument || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [students, selectedClass, riskFilter, searchTerm]);

  // Indicadores Globais
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    if (total === 0) {
      return { total: 0, critical: 0, lowGrades: 0, lowAttendance: 0, paedCount: 0, educarteCount: 0, evolvingCount: 0, decliningCount: 0, avgSchoolGrade: '0.0', avgSchoolPresence: '0.0' };
    }

    const critical = filteredStudents.filter(s => s.riskLevel === 'CRITICO').length;
    const lowGrades = filteredStudents.filter(s => s.averageGrade < 6.0).length;
    const lowAttendance = filteredStudents.filter(s => s.presenceRate < 85).length;
    const paedCount = filteredStudents.filter(s => s.isPaed).length;
    const educarteCount = filteredStudents.filter(s => !!s.educarte).length;
    const evolvingCount = filteredStudents.filter(s => s.trend === 'UP').length;
    const decliningCount = filteredStudents.filter(s => s.trend === 'DOWN').length;

    const sumGrade = filteredStudents.reduce((acc, s) => acc + s.averageGrade, 0);
    const sumPres = filteredStudents.reduce((acc, s) => acc + s.presenceRate, 0);

    return {
      total,
      critical,
      lowGrades,
      lowAttendance,
      paedCount,
      educarteCount,
      evolvingCount,
      decliningCount,
      avgSchoolGrade: (sumGrade / total).toFixed(1),
      avgSchoolPresence: (sumPres / total).toFixed(1)
    };
  }, [filteredStudents]);

  // Pirâmide de Proficiência
  const proficiencyData = useMemo(() => {
    const total = filteredStudents.length || 1;
    const av = filteredStudents.filter(s => s.averageGrade >= 8.0).length;
    const ad = filteredStudents.filter(s => s.averageGrade >= 6.0 && s.averageGrade < 8.0).length;
    const bs = filteredStudents.filter(s => s.averageGrade >= 4.0 && s.averageGrade < 6.0).length;
    const ab = filteredStudents.filter(s => s.averageGrade < 4.0).length;

    return [
      { name: 'Avançado (≥8)', count: av, percentage: Math.round((av / total) * 100), color: PROFICIENCY_COLORS['AVANÇADO'] },
      { name: 'Adequado (6-7.9)', count: ad, percentage: Math.round((ad / total) * 100), color: PROFICIENCY_COLORS['ADEQUADO'] },
      { name: 'Básico (4-5.9)', count: bs, percentage: Math.round((bs / total) * 100), color: PROFICIENCY_COLORS['BÁSICO'] },
      { name: 'Abaixo (<4)', count: ab, percentage: Math.round((ab / total) * 100), color: PROFICIENCY_COLORS['ABAIXO'] }
    ];
  }, [filteredStudents]);

  // Gerar Parecer Individual com IA
  const handleGenerateStudentAiOpinion = async (student: any) => {
    setLoadingAiStudent(true);
    setAiStudentOpinion(null);
    try {
      const failingText = student.failingSubjects.length > 0
        ? student.failingSubjects.map((f: any) => `${f.subject} (média ${f.score})`).join(', ')
        : 'Nenhuma disciplina abaixo da média.';

      const trendText = student.trend === 'UP' ? 'Em trajetória ascendente (melhora nas notas)' :
        student.trend === 'DOWN' ? 'Alerta: Em queda de rendimento do 2º para o 3º bimestre' : 'Rendimento estável';

      const report = await analyzeIndividualStudentWithAI({
        studentName: student.name,
        className: student.className,
        bimestre: '3º Bimestre Letivo',
        averageGrade: student.averageGrade,
        presenceRate: student.presenceRate,
        absencesCount: student.absencesCount,
        isPaed: student.isPaed,
        gradesHistory: student.gradesHistory.map((g: any) => ({
          subject: g.subject,
          score: g.score,
          details: `1º: ${g.b1 ?? '-'}, 2º: ${g.b2 ?? '-'}, 3º: ${g.b3 ?? '-'}`
        })),
        occurrences: [
          `Trajetória: ${trendText}`,
          `Disciplinas em risco de recomposição: ${failingText}`
        ]
      });
      setAiStudentOpinion(report);
    } catch (e) {
      setAiStudentOpinion("Erro ao gerar parecer individual com IA. Verifique a conexão com a API do Gemini.");
    } finally {
      setLoadingAiStudent(false);
    }
  };

  // Salvar Plano de Intervenção Pedagógica (PIP)
  const handleSaveIntervention = () => {
    if (!selectedStudent || !interventionData.actionPlan) return;
    try {
      const existing = JSON.parse(localStorage.getItem('pedagogical_interventions_v1') || '[]');
      const newIntervention = {
        id: crypto.randomUUID(),
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        className: selectedStudent.className,
        actionPlan: interventionData.actionPlan,
        referTo: interventionData.referTo,
        deadline: interventionData.deadline,
        createdAt: new Date().toISOString(),
        createdBy: user?.name || 'Coordenação / Secretaria'
      };
      localStorage.setItem('pedagogical_interventions_v1', JSON.stringify([newIntervention, ...existing]));
      setInterventionSuccess(true);
      setTimeout(() => {
        setInterventionSuccess(false);
        setIsInterventionModalOpen(false);
      }, 1500);
    } catch (e) {
      console.error("Erro ao salvar intervenção:", e);
    }
  };

  // Gerar Síntese de Conselho de Classe com IA
  const handleOpenCouncilModal = async () => {
    setIsCouncilModalOpen(true);
    setLoadingAiCouncil(true);
    setAiCouncilReport(null);

    const currentClass = selectedClass !== 'TODAS' ? selectedClass : 'Escola Geral (Conselho Integrado)';
    const criticalList = filteredStudents
      .filter(s => s.riskLevel === 'CRITICO' || s.averageGrade < 6.0)
      .slice(0, 10)
      .map(s => ({
        name: s.name,
        avg: s.averageGrade,
        pres: s.presenceRate,
        occurrences: s.failingSubjects.length,
        isPaed: s.isPaed
      }));

    try {
      const summary = await generateCoordinationClassCouncilWithAI({
        className: currentClass,
        bimestre: '3º Bimestre Letivo',
        averageGrade: Number(stats.avgSchoolGrade),
        presenceRate: Number(stats.avgSchoolPresence),
        totalStudents: stats.total,
        riskCount: stats.critical,
        paedCount: stats.paedCount,
        disciplinesSummary: classBottlenecks.map(b => ({
          subject: b.subject,
          average: 5.5,
          failingCount: b.failingCount
        })),
        criticalStudents: criticalList
      });
      setAiCouncilReport(summary);
    } catch (e) {
      setAiCouncilReport("Erro ao gerar síntese de conselho de classe.");
    } finally {
      setLoadingAiCouncil(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO INTEGRADO COM KPIs E ANÁLISE DE EVOLUÇÃO */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-1.5">
                <Activity size={12} className="text-indigo-600 animate-pulse" /> Gestão Estratégica & Inteligência Pedagógica
              </span>
              {selectedClass !== 'TODAS' && (
                <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase">
                  {selectedClass}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
              <AlertTriangle className="text-amber-500" size={26} /> Análise 360° de Turmas, Evolução & Matriz de Risco
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Cruzamento de Notas Oficiais SEDUC-MT, Trajetória Bimestral, Faltas e Inclusão PAEDE
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenCouncilModal}
              className="px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles size={16} /> Ata do Conselho de Classe (IA)
            </button>

            <button
              onClick={() => window.print()}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2"
            >
              <Printer size={16} /> Imprimir Relatório
            </button>
          </div>
        </div>

        {/* CARDS DE KPIS E TRAJETÓRIA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudantes</p>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>

          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 space-y-1">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
              <UserX size={12} /> Risco Crítico
            </p>
            <p className="text-2xl font-black text-rose-700">{stats.critical}</p>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-1">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
              <TrendingDown size={12} /> Média &lt; 6.0
            </p>
            <p className="text-2xl font-black text-amber-900">{stats.lowGrades}</p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-1">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
              <ArrowUpRight size={12} /> ↗️ Em Evolução
            </p>
            <p className="text-2xl font-black text-emerald-800">{stats.evolvingCount}</p>
          </div>

          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 space-y-1">
            <p className="text-[10px] font-black text-red-700 uppercase tracking-widest flex items-center gap-1">
              <ArrowDownRight size={12} /> ↘️ Em Queda
            </p>
            <p className="text-2xl font-black text-red-800">{stats.decliningCount}</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-1">
            <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest flex items-center gap-1">
              <Clock size={12} /> Freq. &lt; 85%
            </p>
            <p className="text-2xl font-black text-orange-900">{stats.lowAttendance}</p>
          </div>

          <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 space-y-1">
            <p className="text-[10px] font-black text-pink-700 uppercase tracking-widest flex items-center gap-1">
              ♿ PAEDE / AEE
            </p>
            <p className="text-2xl font-black text-pink-900">{stats.paedCount}</p>
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-1">
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1">
              Média Geral
            </p>
            <p className="text-2xl font-black text-indigo-900">{stats.avgSchoolGrade}</p>
          </div>
        </div>

        {/* COMPARATIVO DE EVOLUÇÃO DA TURMA (1º ➔ 2º ➔ 3º BIMESTRE) */}
        {selectedClass !== 'TODAS' && (
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl">
                <TrendingUp size={22} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Evolução Histórica da Turma ({selectedClass})</p>
                <h4 className="text-sm font-black uppercase text-white">Trajetória Média dos Bimestres</h4>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">1º Bimestre</span>
                <p className="text-lg font-black text-white">{classEvolution.b1 ? classEvolution.b1.toFixed(1) : '-'}</p>
              </div>
              <ArrowRight size={16} className="text-slate-500" />
              <div className="text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">2º Bimestre</span>
                <p className="text-lg font-black text-white">{classEvolution.b2 ? classEvolution.b2.toFixed(1) : '-'}</p>
              </div>
              <ArrowRight size={16} className="text-slate-500" />
              <div className="text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">3º Bimestre</span>
                <p className="text-lg font-black text-emerald-400 font-mono">{classEvolution.b3 ? classEvolution.b3.toFixed(1) : '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PIRÂMIDE DE PROFICIÊNCIA & DISCIPLINAS GARGALO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO DE PROFICIÊNCIA */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Award size={18} className="text-indigo-600" /> Pirâmide de Proficiência
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase">Média Geral: {stats.avgSchoolGrade}</span>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={proficiencyData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 'bold' }} width={110} />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [`${val} alunos (${item.payload.percentage}%)`, 'Quantidade']}
                  contentStyle={{ borderRadius: '1rem', background: '#0F172A', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {proficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DISCIPLINAS GARGALO / MAIOR ÍNDICE DE RECUPERAÇÃO */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600" /> Disciplinas Gargalo (Atenção)
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase">Notas &lt; 6.0</span>
          </div>

          {classBottlenecks.length > 0 ? (
            <div className="space-y-2.5">
              {classBottlenecks.map(b => (
                <div key={b.subject} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-black uppercase">
                    <span className="text-slate-800">{b.subject}</span>
                    <span className="text-rose-600">{b.failingCount} alunos ({b.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400 text-xs font-bold uppercase">
              <CheckCircle2 size={32} className="text-emerald-500 mb-2 opacity-60" />
              Nenhuma disciplina com alerta crítico nesta turma
            </div>
          )}
        </div>

        {/* PAINEL DE FILTROS AVANÇADOS */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-3">
              <Filter size={18} className="text-blue-600" /> Filtros de Análise Pedagógica
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Turma Escolar:</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
                >
                  <option value="TODAS">TODAS AS TURMAS DA ESCOLA</option>
                  {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foco Pedagógico:</label>
                <select
                  value={riskFilter}
                  onChange={e => setRiskFilter(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer text-indigo-900"
                >
                  <option value="ALL">TODOS OS ESTUDANTES</option>
                  <option value="EVOLVING">↗️ EM EVOLUÇÃO (Melhora nas notas)</option>
                  <option value="DECLINING">↘️ EM QUEDA DE RENDIMENTO</option>
                  <option value="CRITICAL">⚠️ RISCO CRÍTICO (Notas &lt; 5.0 ou 3+ reprovações)</option>
                  <option value="GRADES">📉 BAIXO RENDIMENTO (Média &lt; 6.0)</option>
                  <option value="ATTENDANCE">⏰ ALERTA DE INFREQUÊNCIA (&lt; 85%)</option>
                  <option value="PAEDE">♿ ALUNOS COM LAUDO PAEDE / AEE</option>
                  <option value="EDUCARTE">🎺 INTEGRANTES DA BANDA EDUCARTE</option>
                </select>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Pesquisar por nome do estudante ou turma..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
            />
          </div>
        </div>

      </div>

      {/* TABELA / GRADE 360° DE ESTUDANTES */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Users className="text-blue-600" size={20} /> Matriz de Acompanhamento Individual ({filteredStudents.length} Alunos)
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase">Clique em "Ver Ficha 360°" para emitir parecer com IA ou registrar plano de intervenção</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4 pl-6">Estudante</th>
                <th className="p-4">Turma</th>
                <th className="p-4 text-center">Média Geral</th>
                <th className="p-4 text-center">Trajetória</th>
                <th className="p-4 text-center">Disciplinas em Alerta</th>
                <th className="p-4 text-center">Assiduidade</th>
                <th className="p-4 text-center">Inclusão</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                          student.riskLevel === 'CRITICO' ? 'bg-rose-100 text-rose-700' :
                          student.riskLevel === 'ALERTA' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase flex items-center gap-1.5">
                            {student.name}
                            {student.isPaed && <span className="text-xs" title="PAEDE / AEE">♿</span>}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{student.guardianName} • {student.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-slate-700 uppercase">
                      {student.className}
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                        student.averageGrade >= 8 ? 'bg-emerald-100 text-emerald-800' :
                        student.averageGrade >= 6 ? 'bg-blue-100 text-blue-800' :
                        student.averageGrade >= 5 ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {student.averageGrade.toFixed(1)}
                      </span>
                    </td>

                    {/* TRAJETÓRIA / EVOLUÇÃO */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        student.trend === 'UP' ? 'bg-emerald-100 text-emerald-800' :
                        student.trend === 'DOWN' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {student.trend === 'UP' && <ArrowUpRight size={12} />}
                        {student.trend === 'DOWN' && <ArrowDownRight size={12} />}
                        {student.trend === 'STABLE' && <Minus size={12} />}
                        {student.trend === 'UP' ? 'Evoluindo' : student.trend === 'DOWN' ? 'Em Queda' : 'Estável'}
                      </span>
                    </td>

                    {/* DISCIPLINAS EM ALERTA */}
                    <td className="p-4 text-center">
                      {student.failingSubjects.length > 0 ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] font-black uppercase">
                            {student.failingSubjects.length} disciplina(s)
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold mt-0.5 truncate max-w-[140px]">
                            {student.failingSubjects.map((f: any) => f.subject).slice(0, 2).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-black">NENHUMA (&ge; 6.0)</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-black text-xs ${
                          student.presenceRate >= 85 ? 'text-emerald-700' : 'text-rose-600 font-black'
                        }`}>
                          {student.presenceRate}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">({student.absencesCount} faltas)</span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {student.isPaed && (
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded-md text-[9px] font-black uppercase">
                            ♿ PAEDE
                          </span>
                        )}
                        {student.educarte && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                            <Music size={10} /> Banda
                          </span>
                        )}
                        {!student.isPaed && !student.educarte && (
                          <span className="text-[10px] text-slate-300 font-bold">REGULAR</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        student.riskLevel === 'CRITICO' ? 'bg-rose-100 text-rose-800' :
                        student.riskLevel === 'ALERTA' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {student.riskLevel === 'CRITICO' ? '⚠️ CRÍTICO' : student.riskLevel === 'ALERTA' ? '⚡ ALERTA' : '✓ OK'}
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setAiStudentOpinion(null);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all flex items-center gap-1 ml-auto"
                      >
                        Ver Ficha 360° <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    {loading ? 'Carregando dados pedagógicos...' : 'Nenhum estudante encontrado com os filtros selecionados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FICHA 360° DO ESTUDANTE COM HISTÓRICO COMPLETO */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3.5rem] p-8 md:p-12 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 my-8">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
                  {selectedStudent.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedStudent.name}</h3>
                    {selectedStudent.isPaed && <span className="text-xs bg-pink-100 text-pink-800 font-bold px-2 py-0.5 rounded-md">♿ PAEDE</span>}
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Turma: {selectedStudent.className} • Turno: {selectedStudent.shift} • Matrícula: {selectedStudent.registration}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* SEÇÃO 1: MÉTRICAS & DADOS DE CONTATO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Média Geral</span>
                <p className="text-xl font-black text-slate-900">{selectedStudent.averageGrade.toFixed(1)}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Trajetória</span>
                <p className={`text-sm font-black uppercase flex items-center gap-1 ${
                  selectedStudent.trend === 'UP' ? 'text-emerald-700' :
                  selectedStudent.trend === 'DOWN' ? 'text-rose-700' : 'text-slate-700'
                }`}>
                  {selectedStudent.trend === 'UP' ? '↗️ Em Evolução' : selectedStudent.trend === 'DOWN' ? '↘️ Em Queda' : '➡️ Estável'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Responsável</span>
                <p className="text-xs font-black text-slate-800 uppercase truncate">{selectedStudent.guardianName}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Contato / WhatsApp</span>
                <a href={`https://wa.me/55${selectedStudent.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-black text-emerald-700 hover:underline flex items-center gap-1">
                  <Phone size={12} /> {selectedStudent.phone}
                </a>
              </div>
            </div>

            {/* SEÇÃO 2: HISTÓRICO BIMESTRAL REAL POR DISCIPLINA */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-indigo-600" /> Histórico Bimestral Oficial por Disciplina
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-200">
                      <th className="p-3">Componente Curricular</th>
                      <th className="p-3 text-center">1º Bim</th>
                      <th className="p-3 text-center">2º Bim</th>
                      <th className="p-3 text-center">3º Bim</th>
                      <th className="p-3 text-center bg-indigo-50/50 text-indigo-900">Média Parcial</th>
                      <th className="p-3 text-center">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStudent.gradesHistory && selectedStudent.gradesHistory.length > 0 ? (
                      selectedStudent.gradesHistory.map((g: any) => (
                        <tr key={g.subject} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800 uppercase">{g.subject}</td>
                          <td className="p-3 text-center font-black">{g.b1 !== null ? Number(g.b1).toFixed(1) : '-'}</td>
                          <td className="p-3 text-center font-black">{g.b2 !== null ? Number(g.b2).toFixed(1) : '-'}</td>
                          <td className="p-3 text-center font-black">{g.b3 !== null ? Number(g.b3).toFixed(1) : '-'}</td>
                          <td className="p-3 text-center font-black bg-indigo-50/50 text-indigo-950">{g.score.toFixed(1)}</td>
                          <td className="p-3 text-center font-black">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase ${
                              g.score >= 6.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {g.score >= 6.0 ? 'Apto' : 'Recuperação'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400 font-bold uppercase text-[10px]">
                          Nenhuma nota bimestral lançada para este aluno ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO 3: PARECER PEDAGÓGICO COM IA */}
            <div className="p-6 bg-indigo-50/60 border border-indigo-100 rounded-3xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-600" /> Parecer Pedagógico Individual (IA Gemini)
                </h4>
                <button
                  type="button"
                  onClick={() => handleGenerateStudentAiOpinion(selectedStudent)}
                  disabled={loadingAiStudent}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  {loadingAiStudent ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {loadingAiStudent ? 'Gerando...' : aiStudentOpinion ? 'Regerar Parecer' : 'Gerar Parecer com IA'}
                </button>
              </div>

              {aiStudentOpinion ? (
                <div className="p-4 bg-white rounded-2xl border border-indigo-100 text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line max-h-56 overflow-y-auto custom-scrollbar">
                  {aiStudentOpinion}
                </div>
              ) : (
                <p className="text-[11px] text-indigo-900/60 font-medium italic">
                  Clique no botão acima para a IA analisar o histórico de notas, assiduidade e inclusão deste aluno e emitir um parecer pedagógico descritivo.
                </p>
              )}
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInterventionModalOpen(true)}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <AlertCircle size={14} /> Registrar Plano de Intervenção (PIP)
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center gap-2"
                >
                  <Printer size={14} /> Imprimir Ficha
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs"
                >
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PLANO DE INTERVENÇÃO PEDAGÓGICA (PIP) */}
      {isInterventionModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl text-[10px] font-black uppercase tracking-wider">
                  Intervenção & Acompanhamento
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                  Plano de Intervenção: {selectedStudent.name}
                </h3>
              </div>
              <button onClick={() => setIsInterventionModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                <X size={18} />
              </button>
            </div>

            {interventionSuccess ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                <h4 className="text-base font-black text-slate-900 uppercase">Plano Registrado com Sucesso!</h4>
                <p className="text-xs text-slate-500 font-bold uppercase">Encaminhamento gravado no sistema integrado de gestão.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-700">Ações Pedagógicas Propostas (Recomposição / Reforço / Prazos):</label>
                  <textarea
                    rows={4}
                    value={interventionData.actionPlan}
                    onChange={e => setInterventionData({ ...interventionData, actionPlan: e.target.value })}
                    placeholder="Descreva as medidas de recuperação contínua, convocação de responsáveis ou tutoria entre pares..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">Encaminhar Alerta Imediato Para:</label>
                    <select
                      value={interventionData.referTo}
                      onChange={e => setInterventionData({ ...interventionData, referTo: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white"
                    >
                      <option value="NENHUM">Nenhum (Apenas Acompanhamento Interno)</option>
                      <option value="BUSCA_ATIVA">🚨 Busca Ativa Escolar (Risco de Evasão)</option>
                      <option value="PSICOSSOCIAL">🧠 Equipe Psicossocial Escolar</option>
                      <option value="MEDIACAO">⚖️ Núcleo de Mediação Escolar</option>
                      <option value="SALA_RECURSOS">♿ Sala de Recursos Multifuncionais (AEE)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">Prazo de Reavaliação:</label>
                    <input
                      type="date"
                      value={interventionData.deadline}
                      onChange={e => setInterventionData({ ...interventionData, deadline: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsInterventionModalOpen(false)}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveIntervention}
                    disabled={!interventionData.actionPlan}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    Salvar e Registrar Intervenção
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SÍNTESE DE CONSELHO DE CLASSE COM IA */}
      {isCouncilModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3.5rem] p-8 md:p-12 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="text-violet-600" size={24} /> Síntese Estratégica para o Conselho de Classe
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  {selectedClass !== 'TODAS' ? `Turma: ${selectedClass}` : 'Consolidação de Todas as Turmas'} • E.E. André Antônio Maggi
                </p>
              </div>

              <button
                onClick={() => setIsCouncilModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {loadingAiCouncil ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 size={36} className="animate-spin text-violet-600 mx-auto" />
                <p className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  A IA Gemini está analisando as notas reais, evolução bimestral, alunos PAEDE e disciplinas gargalo...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line max-h-96 overflow-y-auto custom-scrollbar">
                  {aiCouncilReport || "Não foi possível carregar a síntese."}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center gap-2"
                  >
                    <Printer size={14} /> Imprimir Ata do Conselho
                  </button>
                  <button
                    onClick={() => setIsCouncilModalOpen(false)}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default CoordinationRiskRadar;
