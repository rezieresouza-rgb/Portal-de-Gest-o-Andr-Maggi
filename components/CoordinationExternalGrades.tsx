import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
   FileBarChart,
   Plus,
   Trash2,
   ArrowLeft,
   CheckCircle2,
   TrendingUp,
   BarChart3,
   Search,
   ChevronRight,
   ShieldCheck,
   Target,
   FileUp,
   Sparkles,
   Loader2,
   X,
   BrainCircuit,
   Lightbulb,
   Save,
   Check,
   RefreshCw,
   LayoutGrid,
   Columns,
   ArrowUpRight,
   ArrowDownRight,
   Minus,
   Users,
   UserCheck,
   BarChart2,
   Filter,
   FilterX,
   AlertTriangle,
   Award,
   Zap
} from 'lucide-react';
import { useToast } from './Toast';
import { Assessment, StudentGrade } from '../types';
import { extractAssessmentResults, generatePedagogicalIntervention } from '../geminiService';
import HabilidadesTodasTurmas from '../data/habilidades_todas_turmas.json';
import { supabase } from '../supabaseClient';
import {
   BarChart,
   Bar,
   Cell,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   Legend,
   ResponsiveContainer,
   LineChart,
   Line
} from 'recharts';

const SYSTEMS = ['SEE', 'CAED'];
const SUBJECTS = ["MATEMÁTICA", "LÍNGUA PORTUGUESA", "CIÊNCIAS", "HISTÓRIA", "GEOGRAFIA", "LÍNGUA INGLESA"];
const PROFICIENCY_LEVELS = [
   { label: 'Muito Baixo', value: 'MUITO_BAIXO', color: 'text-red-600 bg-red-50' },
   { label: 'Baixo', value: 'BAIXO', color: 'text-orange-600 bg-orange-50' },
   { label: 'Médio', value: 'MÉDIO', color: 'text-amber-600 bg-amber-50' },
   { label: 'Alto', value: 'ALTO', color: 'text-emerald-600 bg-emerald-50' },
];

interface CoordinationExternalGradesProps {
   globalFilterTurma?: string;
   globalFilterSubject?: string;
}

const CoordinationExternalGrades: React.FC<CoordinationExternalGradesProps> = ({ globalFilterTurma, globalFilterSubject }) => {
   const { addToast } = useToast();
   const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
   const [isImporting, setIsImporting] = useState(false);
   const [isLoadingStudents, setIsLoadingStudents] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const [allExternalAssessments, setAllExternalAssessments] = useState<Assessment[]>([]);
   const [externalAssessments, setExternalAssessments] = useState<Assessment[]>([]);
   const [students, setStudents] = useState<{ id: string, name: string }[]>([]);
   const [classrooms, setClassrooms] = useState<string[]>([]);

   // View Details State
   const [selectedAssessmentForView, setSelectedAssessmentForView] = useState<Assessment | null>(null);
   const [studentStats, setStudentStats] = useState<Record<string, { attendance: number, activeReferrals: number, civicoBehavior: number }>>({});
   const [selectedStudentHistory, setSelectedStudentHistory] = useState<string | null>(null);
   const [displayMode, setDisplayMode] = useState<'matriz' | 'comparativo' | 'alunos_turma' | 'rendimento_geral' | 'cards'>('matriz');
   const [matrixBimestre, setMatrixBimestre] = useState<string>('2º BIMESTRE');
   const [selectedStudentClass, setSelectedStudentClass] = useState<string>('6º ANO A');
   const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
   const [studentSubView, setStudentSubView] = useState<'boletim' | 'comparativo'>('boletim');

   // Filtros Avançados de Análise
   const [filterSubject, setFilterSubject] = useState<string>('TODAS');
   const [filterPerformanceLevel, setFilterPerformanceLevel] = useState<string>('TODOS'); // 'TODOS' | 'CRITICO' | 'ATENCAO' | 'ADEQUADO' | 'REGRESSAO' | 'EVOLUCAO'
   const [showPedagogicalGuide, setShowPedagogicalGuide] = useState<boolean>(false);

   // Cross-referencing Data fetcher
   useEffect(() => {
      const fetchStats = async () => {
         if (!selectedAssessmentForView) return;
         
         const studentIds = selectedAssessmentForView.grades.map(g => g.studentId).filter(id => id !== 'N/A' && id !== undefined);
         if (studentIds.length === 0) return;

         try {
            // 1. Fetch Attendance
            const { data: attData } = await supabase.from('class_attendance_students').select('student_id, is_present').in('student_id', studentIds);
            
            // 2. Fetch Referrals (Psicossocial)
            const { data: refData } = await supabase.from('referrals').select('student_id').in('student_id', studentIds).eq('status', 'ABERTO');
            
            // 3. Fetch Civico-Militar behavior (if applicable)
            const { data: civData } = await supabase.from('student_behavior').select('student_id, type').in('student_id', studentIds);

            const stats: Record<string, { attendance: number, activeReferrals: number, civicoBehavior: number }> = {};
            
            studentIds.forEach(id => {
               // Referrals
               const refs = refData?.filter(r => r.student_id === id).length || 0;
               
               // Attendance
               const atts = attData?.filter(a => a.student_id === id) || [];
               const totalClasses = atts.length;
               const presentClasses = atts.filter(a => a.is_present).length;
               const attendancePct = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 100;
               
               // Civico-Militar (Ocorrências Negativas)
               const civs = civData?.filter(c => c.student_id === id && (c.type === 'FALTA_LEVE' || c.type === 'FALTA_MEDIA' || c.type === 'FALTA_GRAVE')).length || 0;

               stats[id] = { 
                  attendance: attendancePct, 
                  activeReferrals: refs,
                  civicoBehavior: civs
               };
            });
            
            setStudentStats(stats);
         } catch (error) {
            console.error("Erro ao buscar dados cruzados:", error);
         }
      };
      
      fetchStats();
   }, [selectedAssessmentForView]);

   // AI Modal State
   const [selectedAssessmentForAI, setSelectedAssessmentForAI] = useState<Assessment | null>(null);
   const [activeModalTab, setActiveModalTab] = useState<'alunos' | 'habilidades'>('alunos');
   const [aiReport, setAiReport] = useState<any | null>(null);
   const [loadingAI, setLoadingAI] = useState(false);

   const [selectedSubjectChart, setSelectedSubjectChart] = useState<string>(globalFilterSubject || SUBJECTS[0]);

   // Sync chart subject with global filter
   useEffect(() => {
      if (globalFilterSubject) setSelectedSubjectChart(globalFilterSubject);
   }, [globalFilterSubject]);

   // Form State
   const [form, setForm] = useState<Omit<Assessment, 'id' | 'timestamp'>>({
      date: new Date().toLocaleDateString('sv-SE'),
      bimestre: '1º BIMESTRE',
      className: '',
      subject: SUBJECTS[0],
      teacherName: 'COORDENAÇÃO',
      type: 'SEE',
      description: '',
      max_score: 100,
      grades: []
   });

   // Fetch Data
   const fetchData = async () => {
      // 1. Fetch Assessments
      const { data: assessData } = await supabase
         .from('assessments')
         .select(`
        *,
        grades (student_id, student_name, student_code, score, proficiency_level, students(name)),
        classrooms (name)
      `)
         .in('type', ['CAED', 'SEE', 'SISTEMA ESTRUTURADO'])
         .order('date', { ascending: false });

      if (assessData) {
         const formatted: Assessment[] = assessData.map(a => ({
            id: a.id,
            date: a.date,
            bimestre: a.bimestre,
            className: a.classrooms?.name || 'N/A',
            subject: a.subject,
            teacherName: 'COORDENAÇÃO',
            type: a.type as any,
            description: a.type + ' - ' + a.date,
            max_score: a.max_score,
            grades: a.grades.map((g: any) => ({
               studentId: g.student_id || g.student_code || 'N/A', 
               studentName: g.students?.name || g.student_name || 'Aluno',
               score: g.score,
               proficiencyLevel: g.proficiency_level
            })),
            timestamp: new Date(a.date).getTime()
         }));
         setAllExternalAssessments(formatted);
         setExternalAssessments(formatted);
      }

      // 2. Fetch Classrooms for dropdown
      const { data: classData } = await supabase.from('classrooms').select('name').order('name');
      if (classData) {
         const classNames = classData.map(c => c.name);
         setClassrooms(classNames);
         if (!form.className && classNames.length > 0) {
            setForm(prev => ({ ...prev, className: classNames[0] }));
         }
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   // Apply Global Filters
   useEffect(() => {
      let filtered = allExternalAssessments;
      if (globalFilterTurma && globalFilterTurma !== 'ALL' && !globalFilterTurma.toLowerCase().startsWith('todas')) {
         filtered = filtered.filter(a => a.className === globalFilterTurma);
      }
      if (globalFilterSubject && globalFilterSubject !== 'ALL' && !globalFilterSubject.toLowerCase().startsWith('todas')) {
         filtered = filtered.filter(a => a.subject?.toUpperCase() === globalFilterSubject?.toUpperCase());
      }
      setExternalAssessments(filtered);
   }, [globalFilterTurma, globalFilterSubject, allExternalAssessments]);

   // Fetch Students when Class changes in Form - IMPROVED ROBUSTNESS
   useEffect(() => {
      const loadStudents = async () => {
         if (!form.className) return;

         setIsLoadingStudents(true);
         try {
            // 1. Find classroom ID
            const { data: classObj, error: classError } = await supabase
               .from('classrooms')
               .select('id')
               .eq('name', form.className)
               .single();

            if (classError || !classObj) {
               console.error("Class not found", classError);
               setIsLoadingStudents(false);
               return;
            }

            // 2. Fetch students by ID
            const { data: studentsData, error: studentError } = await supabase
               .from('students')
               .select('id, name')
               .eq('classroom_id', classObj.id)
               .order('name');

            if (studentError) {
               console.error("Error fetching students", studentError);
               setIsLoadingStudents(false);
               return;
            }

            if (studentsData) {
               const studentList = studentsData.map(s => ({ id: s.id, name: s.name }));
               setStudents(studentList);
               setForm(prev => ({
                  ...prev,
                  grades: studentList.map(s => ({
                     studentId: s.id,
                     studentName: s.name,
                     score: 0,
                     proficiencyLevel: 'MUITO_BAIXO'
                  }))
               }));
            }
         } catch (err) {
            console.error("Unexpected error loading students", err);
         } finally {
            setIsLoadingStudents(false);
         }
      };

      if (viewMode === 'form') {
         loadStudents();
      }
   }, [form.className, viewMode]);
   // Analytics Logic
   const chartData = useMemo(() => {
      // Filter by selected subject
      const filtered = externalAssessments.filter(a => 
         !selectedSubjectChart || 
         a.subject?.toUpperCase() === selectedSubjectChart?.toUpperCase()
      );

      // Group by Bimestre and Class
      // We want XAxis = Bimestre, Lines = Classes

      const bimeMap: Record<string, any> = {
         '1º BIMESTRE': { name: '1º BIMESTRE' },
         '2º BIMESTRE': { name: '2º BIMESTRE' },
         '3º BIMESTRE': { name: '3º BIMESTRE' },
         '4º BIMESTRE': { name: '4º BIMESTRE' },
      };

      filtered.forEach(ass => {
         const avg = ass.grades.reduce((acc, g) => acc + g.score, 0) / (ass.grades.length || 1);
         if (bimeMap[ass.bimestre]) {
            bimeMap[ass.bimestre][ass.className] = parseFloat(avg.toFixed(1));
         }
      });

      return Object.values(bimeMap);
   }, [externalAssessments, selectedSubjectChart]);

   const activeClasses = useMemo(() => {
      const classes = new Set<string>();
      externalAssessments
         .filter(a => !selectedSubjectChart || a.subject?.toUpperCase() === selectedSubjectChart?.toUpperCase())
         .forEach(a => classes.add(a.className));
      return Array.from(classes).sort(); // Sort so colors are consistent-ish
   }, [externalAssessments, selectedSubjectChart]);

   const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#A05195', '#F95D6A'];


   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         // 1. Get Classroom ID
         const { data: classData } = await supabase.from('classrooms').select('id').eq('name', form.className).single();
         if (!classData) throw new Error("Turma não encontrada");

         // 2. Insert Assessment
         const { data: assessData, error: assessError } = await supabase
            .from('assessments')
            .insert([{
               classroom_id: classData.id,
               date: form.date,
               bimestre: form.bimestre,
               subject: form.subject,
               type: form.type,
               max_score: form.max_score,
               teacher_id: null // Coordination
            }])
            .select()
            .single();

         if (assessError) throw assessError;

         // 3. Insert Grades
         const gradesToInsert = form.grades.map(g => ({
            assessment_id: assessData.id,
            student_id: g.studentId,
            score: g.score,
            proficiency_level: g.proficiencyLevel
         }));

         const { error: gradesError } = await supabase.from('grades').insert(gradesToInsert);
         if (gradesError) throw gradesError;

         addToast("Resultado de avaliação externa registrado!", "success");
         fetchData();
         setViewMode('list');

      } catch (error) {
         console.error("Erro ao salvar:", error);
         addToast("Erro ao salvar avaliação.", "error");
      }
   };

   const updateStudentData = (studentId: string, score: number) => {
      let level: StudentGrade['proficiencyLevel'] = 'MUITO_BAIXO';
      if (score >= 80) level = 'ALTO';
      else if (score >= 60) level = 'MÉDIO';
      else if (score >= 40) level = 'BAIXO';

      setForm(prev => ({
         ...prev,
         grades: prev.grades.map(g => g.studentId === studentId ? { ...g, score, proficiencyLevel: level } : g)
      }));
   };

   const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
         try {
            const base64 = (event.target?.result as string).split(',')[1];
            const data = await extractAssessmentResults(base64, file.type);

            if (data && data.students) {
               setForm(prev => {
                  const updatedGrades = [...prev.grades];
                  data.students.forEach((imported: any) => {
                     // Busca o aluno na lista do formulário por nome aproximado
                     const studentIndex = updatedGrades.findIndex(g =>
                        g.studentName.toUpperCase().includes(imported.name.toUpperCase()) ||
                        imported.name.toUpperCase().includes(g.studentName.toUpperCase())
                     );

                     if (studentIndex !== -1) {
                        const score = imported.score;
                        let level: StudentGrade['proficiencyLevel'] = 'MUITO_BAIXO';
                        if (score >= 80) level = 'ALTO';
                        else if (score >= 60) level = 'MÉDIO';
                        else if (score >= 40) level = 'BAIXO';

                        updatedGrades[studentIndex] = {
                           ...updatedGrades[studentIndex],
                           score: score,
                           proficiencyLevel: level
                        };
                     }
                  });
                  return { ...prev, grades: updatedGrades };
               });
               addToast(`Importação concluída! ${data.students.length} resultados processados.`, "success");
            }
         } catch (err) {
            addToast("Erro ao processar o arquivo com a IA.", "error");
         } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
         }
      };
      reader.readAsDataURL(file);
   };

   const deleteRecord = async (id: string) => {
      if (window.confirm("Deseja excluir este registro de avaliação externa?")) {
         // Delete grades first
         await supabase.from('grades').delete().eq('assessment_id', id);
         // Delete assessment
         const { error } = await supabase.from('assessments').delete().eq('id', id);

         if (error) {
            addToast("Erro ao excluir.", "error");
         } else {
            setExternalAssessments(prev => prev.filter(a => a.id !== id));
            addToast("Registro excluído com sucesso.", "success");
         }
      }
   };

   // AI Handler
   const handleGenerateAIReport = async (assessment: Assessment, forceRegenerate: boolean = false) => {
      setSelectedAssessmentForAI(assessment);
      setLoadingAI(true);
      setAiReport(null);

      if (!forceRegenerate) {
         // Check for existing plan
         const { data: existingPlan } = await supabase
            .from('action_plans')
            .select('*')
            .eq('assessment_id', assessment.id)
            .single();
            
         if (existingPlan) {
            setAiReport(existingPlan);
            setLoadingAI(false);
            return;
         }
      }

      const avg = assessment.grades.reduce((acc, g) => acc + g.score, 0) / (assessment.grades.length || 1);
      const lowPerformers = assessment.grades
         .filter(g => g.score < 60)
         .map(g => `${g.studentName} (${g.score}%)`);

      // Tenta buscar habilidades estruturadas da nova base de dados global
      let skillsData = null;
      try {
         // O assessment.className geralmente vem como "6º ANO A" ou similar, 
         // o que já bate com as chaves geradas (ex: "6º ANO A") no json.
         const classData = (HabilidadesTodasTurmas as Record<string, any>)[assessment.className.toUpperCase()];
         if (classData && classData[assessment.subject.toUpperCase()]) {
            skillsData = classData[assessment.subject.toUpperCase()].habilidades;
         }
      } catch (err) {
         console.warn("Habilidades não encontradas localmente para esta turma.", err);
      }

      const payload = {
         subject: assessment.subject,
         className: assessment.className,
         bimestre: assessment.bimestre,
         averageScore: avg.toFixed(1),
         lowPerformers: lowPerformers,
         skillsData: skillsData
      };

      const result = await generatePedagogicalIntervention(payload);
      setAiReport(result);
      setLoadingAI(false);
   };

   const handleSaveActionPlan = async () => {
      if (!selectedAssessmentForAI || !aiReport) return;
      
      const planTasks = aiReport.actions.map((action: string) => ({
         id: crypto.randomUUID(),
         title: action,
         completed: false
      }));

      const { data, error } = await supabase.from('action_plans').insert({
         assessment_id: selectedAssessmentForAI.id,
         diagnosis: aiReport.diagnosis,
         skills_to_reinforce: aiReport.skillsToReinforce || aiReport.skills_to_reinforce || '',
         tasks: planTasks
      }).select().single();

      if (error) {
         addToast("Erro ao salvar o plano de ação.", "error");
         console.error(error);
      } else if (data) {
         setAiReport(data);
         addToast("Plano de Ação salvo com sucesso!", "success");
      }
   };

   const handleToggleTask = async (taskId: string) => {
      if (!aiReport || !aiReport.id) return;

      const newTasks = aiReport.tasks.map((t: any) => 
         t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      
      // Update UI optimistically
      setAiReport({ ...aiReport, tasks: newTasks });
      
      const { error } = await supabase
         .from('action_plans')
         .update({ tasks: newTasks })
         .eq('id', aiReport.id);
         
      if (error) {
         addToast("Erro ao atualizar a tarefa.", "error");
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500">
         {viewMode === 'list' ? (
            <div className="space-y-6">
               <div className="flex flex-col gap-6">
                  {/* LINHA 1: TÍTULO E BOTÕES DE AÇÃO */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Avaliações de Sistema</h2>
                        <p className="text-white/60 font-bold text-xs uppercase tracking-widest">Painel Comparativo de Proficiência (SEE / CAED)</p>
                     </div>

                     <div className="flex items-center gap-3 flex-wrap">
                        <button
                           onClick={() => setShowPedagogicalGuide(true)}
                           className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl shadow-amber-500/20 hover:from-amber-600 hover:to-orange-700 transition-all flex items-center gap-2 border border-amber-400/30 animate-pulse shrink-0"
                        >
                           <Lightbulb size={18} /> Sugestões de Melhoria
                        </button>

                        <button
                           onClick={() => setViewMode('form')}
                           className="px-6 py-3 bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center gap-2 border border-violet-500/20 shrink-0"
                        >
                           <Plus size={18} /> Lançar Resultados
                        </button>
                     </div>
                  </div>

                  {/* LINHA 2: ABAS NAVEGAÇÃO DE MODOS DE VISÃO */}
                  <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar w-full">
                     <button
                        onClick={() => setDisplayMode('matriz')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                           displayMode === 'matriz' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                     >
                        <LayoutGrid size={16} /> Matriz por Turma
                     </button>
                     <button
                        onClick={() => setDisplayMode('comparativo')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                           displayMode === 'comparativo' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                     >
                        <ArrowUpRight size={16} /> Comparador 1º x 2º Bim.
                     </button>
                     <button
                        onClick={() => setDisplayMode('alunos_turma')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                           displayMode === 'alunos_turma' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                     >
                        <Users size={16} /> Notas por Aluno (Turma)
                     </button>
                     <button
                        onClick={() => setDisplayMode('rendimento_geral')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                           displayMode === 'rendimento_geral' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                     >
                        <BarChart2 size={16} /> Rendimento Geral por Ano
                     </button>
                     <button
                        onClick={() => setDisplayMode('cards')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                           displayMode === 'cards' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                     >
                        <Columns size={16} /> Visão Cards
                     </button>
                  </div>
               </div>

               {/* BARRA DE FILTROS INTELIGENTES DE ANÁLISE */}
               <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-violet-400 tracking-wider">
                     <Filter size={16} /> Filtros de Análise:
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                     {/* FILTRO DE NIVEL DE DESEMPENHO */}
                     <select
                        value={filterPerformanceLevel}
                        onChange={e => setFilterPerformanceLevel(e.target.value)}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-white outline-none focus:bg-white/10 [&>option]:bg-gray-900"
                     >
                        <option value="TODOS">🎯 Todos os Desempenhos</option>
                        <option value="CRITICO">🔴 Alerta Crítico (&lt; 40%)</option>
                        <option value="ATENCAO">🟡 Em Atenção (40% - 59%)</option>
                        <option value="ADEQUADO">🟢 Adequado (≥ 60%)</option>
                        <option value="REGRESSAO">📉 Em Regressão (Δ &lt; 0%)</option>
                        <option value="EVOLUCAO">📈 Em Evolução (Δ &gt; 0%)</option>
                     </select>

                     {/* FILTRO DE DISCIPLINA */}
                     <select
                        value={filterSubject}
                        onChange={e => setFilterSubject(e.target.value)}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-white outline-none focus:bg-white/10 [&>option]:bg-gray-900"
                     >
                        <option value="TODAS">📚 Todas as Disciplinas</option>
                        {SUBJECTS.map(s => (
                           <option key={s} value={s}>{s}</option>
                        ))}
                     </select>

                     {(filterPerformanceLevel !== 'TODOS' || filterSubject !== 'TODAS') && (
                        <button
                           onClick={() => { setFilterPerformanceLevel('TODOS'); setFilterSubject('TODAS'); }}
                           className="px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs font-black uppercase flex items-center gap-1 hover:bg-red-500/30 transition-all"
                        >
                           <FilterX size={14} /> Limpar Filtros
                        </button>
                     )}
                  </div>
               </div>

               {/* MATRIZ DE PROFICIÊNCIA POR TURMA E DISCIPLINA */}
               {displayMode === 'matriz' && (
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md space-y-6">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                              <LayoutGrid size={20} className="text-violet-400" /> Matriz Comparativa de Proficiência
                           </h3>
                           <p className="text-xs text-white/50 font-bold uppercase mt-1">Comparativo de desempenho de todas as turmas lado a lado</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold text-white/40 uppercase">Filtrar Bimestre:</span>
                           <select
                              value={matrixBimestre}
                              onChange={e => setMatrixBimestre(e.target.value)}
                              className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase outline-none focus:bg-white/10 text-white [&>option]:bg-gray-900"
                           >
                              {['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'].map(b => (
                                 <option key={b} value={b}>{b}</option>
                              ))}
                           </select>
                        </div>
                     </div>

                     <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b border-white/10 text-[10px] font-black uppercase text-white/40 tracking-wider">
                                 <th className="py-4 px-6">Turma</th>
                                 {SUBJECTS.map(subj => (
                                    <th key={subj} className="py-4 px-4 text-center">{subj}</th>
                                 ))}
                                 <th className="py-4 px-6 text-center text-violet-400">Média Geral</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {(() => {
                                 const bimeAssessments = allExternalAssessments.filter(a => a.bimestre === matrixBimestre);
                                 const classesInMatrix = Array.from(new Set(bimeAssessments.map(a => a.className))).sort();

                                 if (classesInMatrix.length === 0) {
                                    return (
                                       <tr>
                                          <td colSpan={SUBJECTS.length + 2} className="py-12 text-center text-white/30 font-bold text-xs uppercase">
                                             Nenhum resultado lançado para o {matrixBimestre}
                                          </td>
                                       </tr>
                                    );
                                 }

                                 return classesInMatrix.map(cls => {
                                    let sumAcc = 0;
                                    let countAcc = 0;

                                    return (
                                       <tr key={cls} className="hover:bg-white/5 transition-colors">
                                          <td className="py-5 px-6 font-black text-sm text-white uppercase flex items-center gap-2">
                                             <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                                             {cls}
                                          </td>
                                          {SUBJECTS.map(subj => {
                                             const targetAss = bimeAssessments.find(a => a.className === cls && a.subject.toUpperCase() === subj.toUpperCase());
                                             if (!targetAss || targetAss.grades.length === 0) {
                                                return (
                                                   <td key={subj} className="py-5 px-4 text-center text-white/20 text-xs font-bold">-</td>
                                                );
                                             }

                                             const avg = targetAss.grades.reduce((acc, g) => acc + g.score, 0) / targetAss.grades.length;
                                             sumAcc += avg;
                                             countAcc++;

                                             let colorClass = 'bg-red-500/20 text-red-300 border-red-500/30';
                                             if (avg >= 60) colorClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                                             else if (avg >= 40) colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                                             return (
                                                <td key={subj} className="py-5 px-4 text-center">
                                                   <button
                                                      onClick={() => setSelectedAssessmentForView(targetAss)}
                                                      className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-transform hover:scale-105 ${colorClass}`}
                                                      title="Clique para ver os alunos"
                                                   >
                                                      {avg.toFixed(1)}%
                                                   </button>
                                                </td>
                                             );
                                          })}
                                          <td className="py-5 px-6 text-center font-black text-sm text-violet-300">
                                             {countAcc > 0 ? `${(sumAcc / countAcc).toFixed(1)}%` : '-'}
                                          </td>
                                       </tr>
                                    );
                                 });
                              })()}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {/* COMPARATIVO BIMESTRAL (1º X 2º BIMESTRE COM DELTA) */}
               {displayMode === 'comparativo' && (
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md space-y-6">
                     <div className="border-b border-white/10 pb-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                           <ArrowUpRight size={20} className="text-emerald-400" /> Comparativo de Evolução Bimestral (1º Bimestre vs 2º Bimestre)
                        </h3>
                        <p className="text-xs text-white/50 font-bold uppercase mt-1">Acompanhamento do avanço ou retrocesso percentual (Δ Delta) por turma e disciplina</p>
                     </div>

                     <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b border-white/10 text-[10px] font-black uppercase text-white/40 tracking-wider">
                                 <th className="py-4 px-6">Turma</th>
                                 <th className="py-4 px-6">Disciplina</th>
                                 <th className="py-4 px-6 text-center">1º Bimestre</th>
                                 <th className="py-4 px-6 text-center">2º Bimestre</th>
                                 <th className="py-4 px-6 text-center">Variação (Δ)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {(() => {
                                 const b1 = allExternalAssessments.filter(a => a.bimestre === '1º BIMESTRE');
                                 const b2 = allExternalAssessments.filter(a => a.bimestre === '2º BIMESTRE');

                                 const classSubjectPairs = new Set<string>();
                                 allExternalAssessments.forEach(a => classSubjectPairs.add(`${a.className}___${a.subject}`));

                                 const sortedPairs = Array.from(classSubjectPairs).sort();

                                 if (sortedPairs.length === 0) {
                                    return (
                                       <tr>
                                          <td colSpan={5} className="py-12 text-center text-white/30 font-bold text-xs uppercase">
                                             Nenhum dado cadastrado para comparação
                                          </td>
                                       </tr>
                                    );
                                 }

                                 return sortedPairs.map(pair => {
                                    const [cls, subj] = pair.split('___');
                                    const ass1 = b1.find(a => a.className === cls && a.subject.toUpperCase() === subj.toUpperCase());
                                    const ass2 = b2.find(a => a.className === cls && a.subject.toUpperCase() === subj.toUpperCase());

                                    const avg1 = ass1 && ass1.grades.length > 0 ? (ass1.grades.reduce((a, g) => a + g.score, 0) / ass1.grades.length) : null;
                                    const avg2 = ass2 && ass2.grades.length > 0 ? (ass2.grades.reduce((a, g) => a + g.score, 0) / ass2.grades.length) : null;

                                    let delta: number | null = null;
                                    if (avg1 !== null && avg2 !== null) {
                                       delta = parseFloat((avg2 - avg1).toFixed(1));
                                    }

                                    return (
                                       <tr key={pair} className="hover:bg-white/5 transition-colors">
                                          <td className="py-5 px-6 font-black text-sm text-white uppercase">{cls}</td>
                                          <td className="py-5 px-6 font-bold text-xs text-violet-300 uppercase">{subj}</td>
                                          <td className="py-5 px-6 text-center font-bold text-xs text-white/70">
                                             {avg1 !== null ? `${avg1.toFixed(1)}%` : '-'}
                                          </td>
                                          <td className="py-5 px-6 text-center font-bold text-xs text-white/90">
                                             {avg2 !== null ? `${avg2.toFixed(1)}%` : '-'}
                                          </td>
                                          <td className="py-5 px-6 text-center">
                                             {delta !== null ? (
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black border ${
                                                   delta > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                   delta < 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                   'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                                }`}>
                                                   {delta > 0 && <ArrowUpRight size={14} />}
                                                   {delta < 0 && <ArrowDownRight size={14} />}
                                                   {delta === 0 && <Minus size={14} />}
                                                   {delta > 0 ? `+${delta}%` : `${delta}%`}
                                                </span>
                                             ) : (
                                                <span className="text-white/20 text-xs font-bold">-</span>
                                             )}
                                          </td>
                                       </tr>
                                    );
                                 });
                              })()}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {/* NOTAS POR ALUNO - BOLETIM GERAL DA TURMA */}
               {displayMode === 'alunos_turma' && (
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md space-y-6">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                              <Users size={20} className="text-violet-400" /> Boletim Completo de Alunos da Turma
                           </h3>
                           <p className="text-xs text-white/50 font-bold uppercase mt-1">Notas individuais por aluno em todas as disciplinas</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                           {/* ALTERNADOR SUB-VISÃO (BOLETIM VS EVOLUÇÃO INDIVIDUAL) */}
                           <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                              <button
                                 onClick={() => setStudentSubView('boletim')}
                                 className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${studentSubView === 'boletim' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white'}`}
                              >
                                 Boletim
                              </button>
                              <button
                                 onClick={() => setStudentSubView('comparativo')}
                                 className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 ${studentSubView === 'comparativo' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white'}`}
                              >
                                 <ArrowUpRight size={12} /> Evolução 1º x 2º Bim.
                              </button>
                           </div>

                           {/* BUSCA POR NOME DO ALUNO */}
                           <div className="relative flex-1 md:w-56">
                              <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
                              <input
                                 type="text"
                                 placeholder="Buscar aluno..."
                                 value={studentSearchQuery}
                                 onChange={e => setStudentSearchQuery(e.target.value)}
                                 className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-white/30 outline-none focus:bg-white/10 focus:ring-2 focus:ring-violet-500/50"
                              />
                           </div>

                           {/* SELETOR DE TURMA */}
                           <select
                              value={selectedStudentClass}
                              onChange={e => setSelectedStudentClass(e.target.value)}
                              className="p-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase outline-none focus:bg-white/10 text-white [&>option]:bg-gray-900"
                           >
                              {(() => {
                                 const availableClasses = Array.from(new Set(allExternalAssessments.map(a => a.className))).sort();
                                 if (availableClasses.length === 0) return <option value="">Sem turmas</option>;
                                 return availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>);
                              })()}
                           </select>

                           {/* SELETOR DE BIMESTRE (Apenas no modo boletim simples) */}
                           {studentSubView === 'boletim' && (
                              <select
                                 value={matrixBimestre}
                                 onChange={e => setMatrixBimestre(e.target.value)}
                                 className="p-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase outline-none focus:bg-white/10 text-white [&>option]:bg-gray-900"
                              >
                                 {['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'].map(b => (
                                    <option key={b} value={b}>{b}</option>
                                 ))}
                              </select>
                           )}
                        </div>
                     </div>

                     {/* MODO 1: BOLETIM SIMPLES DE ALUNOS */}
                     {studentSubView === 'boletim' && (
                     <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b border-white/10 text-[10px] font-black uppercase text-white/40 tracking-wider">
                                 <th className="py-4 px-4 text-center">#</th>
                                 <th className="py-4 px-6">Nome do Aluno</th>
                                 {SUBJECTS.map(subj => (
                                    <th key={subj} className="py-4 px-4 text-center">{subj}</th>
                                 ))}
                                 <th className="py-4 px-6 text-center text-violet-400">Média Aluno</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {(() => {
                                 const targetAssessments = allExternalAssessments.filter(a => 
                                    a.className === selectedStudentClass && a.bimestre === matrixBimestre
                                 );

                                 if (targetAssessments.length === 0) {
                                    return (
                                       <tr>
                                          <td colSpan={SUBJECTS.length + 3} className="py-12 text-center text-white/30 font-bold text-xs uppercase">
                                             Nenhuma avaliação encontrada para a turma {selectedStudentClass} no {matrixBimestre}
                                          </td>
                                       </tr>
                                    );
                                 }

                                 const studentMap = new Map<string, { id: string, name: string, scores: Record<string, number> }>();

                                 targetAssessments.forEach(ass => {
                                    const subjUpper = ass.subject.toUpperCase();
                                    ass.grades.forEach(g => {
                                       const sName = g.studentName;
                                       if (!studentMap.has(sName)) {
                                          studentMap.set(sName, {
                                             id: g.studentId,
                                             name: sName,
                                             scores: {}
                                          });
                                       }
                                       studentMap.get(sName)!.scores[subjUpper] = g.score;
                                    });
                                 });

                                 let studentList = Array.from(studentMap.values())
                                    .sort((a, b) => a.name.localeCompare(b.name));

                                 if (studentSearchQuery.trim()) {
                                    const q = studentSearchQuery.toLowerCase();
                                    studentList = studentList.filter(s => s.name.toLowerCase().includes(q));
                                 }

                                 if (studentList.length === 0) {
                                    return (
                                       <tr>
                                          <td colSpan={SUBJECTS.length + 3} className="py-12 text-center text-white/30 font-bold text-xs uppercase">
                                             Nenhum aluno encontrado com a busca "{studentSearchQuery}"
                                          </td>
                                       </tr>
                                    );
                                 }

                                 return studentList.map((st, idx) => {
                                    const scores = Object.values(st.scores);
                                    const avgStudent = scores.length > 0 ? (scores.reduce((acc, val) => acc + val, 0) / scores.length) : null;

                                    return (
                                       <tr key={st.name} className="hover:bg-white/5 transition-colors">
                                          <td className="py-4 px-4 text-center font-bold text-xs text-white/30">{idx + 1}</td>
                                          <td className="py-4 px-6 font-black text-xs text-white uppercase">{st.name}</td>
                                          {SUBJECTS.map(subj => {
                                             const score = st.scores[subj.toUpperCase()];
                                             if (score === undefined) {
                                                return <td key={subj} className="py-4 px-4 text-center text-white/20 text-xs font-bold">-</td>;
                                             }

                                             let colorClass = 'bg-red-500/20 text-red-300 border-red-500/30';
                                             if (score >= 60) colorClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                                             else if (score >= 40) colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                                             return (
                                                <td key={subj} className="py-4 px-4 text-center">
                                                   <span className={`inline-block px-2.5 py-1 rounded-xl border text-xs font-black ${colorClass}`}>
                                                      {score}%
                                                   </span>
                                                </td>
                                             );
                                          })}
                                          <td className="py-4 px-6 text-center">
                                             {avgStudent !== null ? (
                                                <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black ${
                                                   avgStudent >= 60 ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' :
                                                   avgStudent >= 40 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                                   'bg-red-500/20 text-red-400 border border-red-500/30'
                                                }`}>
                                                   {avgStudent.toFixed(1)}%
                                                </span>
                                             ) : '-'}
                                          </td>
                                       </tr>
                                    );
                                 });
                              })()}
                           </tbody>
                        </table>
                     </div>
                     )}

                     {/* MODO 2: COMPARATIVO BIMESTRAL (1º X 2º BIMESTRE POR ALUNO) */}
                     {studentSubView === 'comparativo' && (
                     <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b border-white/10 text-[10px] font-black uppercase text-white/40 tracking-wider">
                                 <th className="py-4 px-4 text-center">#</th>
                                 <th className="py-4 px-6">Nome do Aluno</th>
                                 <th className="py-4 px-6 text-center">Média 1º Bim</th>
                                 <th className="py-4 px-6 text-center">Média 2º Bim</th>
                                 <th className="py-4 px-6 text-center">Evolução Geral (Δ)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {(() => {
                                 const b1 = allExternalAssessments.filter(a => a.className === selectedStudentClass && a.bimestre === '1º BIMESTRE');
                                 const b2 = allExternalAssessments.filter(a => a.className === selectedStudentClass && a.bimestre === '2º BIMESTRE');

                                 const studentMap = new Map<string, { name: string, b1Scores: number[], b2Scores: number[] }>();

                                 b1.forEach(ass => {
                                    ass.grades.forEach(g => {
                                       if (!studentMap.has(g.studentName)) {
                                          studentMap.set(g.studentName, { name: g.studentName, b1Scores: [], b2Scores: [] });
                                       }
                                       studentMap.get(g.studentName)!.b1Scores.push(g.score);
                                    });
                                 });

                                 b2.forEach(ass => {
                                    ass.grades.forEach(g => {
                                       if (!studentMap.has(g.studentName)) {
                                          studentMap.set(g.studentName, { name: g.studentName, b1Scores: [], b2Scores: [] });
                                       }
                                       studentMap.get(g.studentName)!.b2Scores.push(g.score);
                                    });
                                 });

                                 let list = Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name));

                                 if (studentSearchQuery.trim()) {
                                    const q = studentSearchQuery.toLowerCase();
                                    list = list.filter(s => s.name.toLowerCase().includes(q));
                                 }

                                 if (list.length === 0) {
                                    return (
                                       <tr>
                                          <td colSpan={5} className="py-12 text-center text-white/30 font-bold text-xs uppercase">
                                             Nenhum aluno encontrado para comparação na turma {selectedStudentClass}
                                          </td>
                                       </tr>
                                    );
                                 }

                                 return list.map((st, idx) => {
                                    const avg1 = st.b1Scores.length > 0 ? (st.b1Scores.reduce((a, b) => a + b, 0) / st.b1Scores.length) : null;
                                    const avg2 = st.b2Scores.length > 0 ? (st.b2Scores.reduce((a, b) => a + b, 0) / st.b2Scores.length) : null;

                                    let delta: number | null = null;
                                    if (avg1 !== null && avg2 !== null) {
                                       delta = parseFloat((avg2 - avg1).toFixed(1));
                                    }

                                    return (
                                       <tr key={st.name} className="hover:bg-white/5 transition-colors">
                                          <td className="py-4 px-4 text-center font-bold text-xs text-white/30">{idx + 1}</td>
                                          <td className="py-4 px-6 font-black text-xs text-white uppercase">{st.name}</td>
                                          <td className="py-4 px-6 text-center font-bold text-xs text-white/70">
                                             {avg1 !== null ? `${avg1.toFixed(1)}%` : '-'}
                                          </td>
                                          <td className="py-4 px-6 text-center font-bold text-xs text-white/90">
                                             {avg2 !== null ? `${avg2.toFixed(1)}%` : '-'}
                                          </td>
                                          <td className="py-4 px-6 text-center">
                                             {delta !== null ? (
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black border ${
                                                   delta > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                   delta < 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                   'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                                }`}>
                                                   {delta > 0 && <ArrowUpRight size={14} />}
                                                   {delta < 0 && <ArrowDownRight size={14} />}
                                                   {delta === 0 && <Minus size={14} />}
                                                   {delta > 0 ? `+${delta}%` : `${delta}%`}
                                                </span>
                                             ) : (
                                                <span className="text-white/20 text-xs font-bold">-</span>
                                             )}
                                          </td>
                                       </tr>
                                    );
                                 });
                              })()}
                           </tbody>
                        </table>
                     </div>
                     )}
                  </div>
               )}

               {/* NOVO MODO: RENDIMENTO GERAL POR ANO (SÉRIE) */}
               {displayMode === 'rendimento_geral' && (
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md space-y-8">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                              <BarChart2 size={20} className="text-violet-400" /> Rendimento Geral Consolidado por Série
                           </h3>
                           <p className="text-xs text-white/50 font-bold uppercase mt-1">Média escolar acumulada por disciplina do 6º ao 9º Ano</p>
                        </div>
                     </div>

                     {/* CARDS DE CADA SÉRIE */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['6º ANO', '7º ANO', '8º ANO', '9º ANO'].map(grade => {
                           const gradeAssessments = allExternalAssessments.filter(a => a.className.startsWith(grade));
                           
                           return (
                              <div key={grade} className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4 hover:border-violet-500/40 transition-all">
                                 <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <h4 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                                       <span className="w-3 h-3 rounded-full bg-violet-500"></span> {grade} - Média Geral Escola
                                    </h4>
                                 </div>

                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="text-[10px] font-black uppercase text-white/40 border-b border-white/5">
                                          <th className="py-2">Disciplina</th>
                                          <th className="py-2 text-center">1º Bimestre</th>
                                          <th className="py-2 text-center">2º Bimestre</th>
                                          <th className="py-2 text-center">Evolução (Δ)</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs font-bold">
                                       {SUBJECTS.map(subj => {
                                          const subjUpper = subj.toUpperCase();
                                          
                                          // Se houver dados oficiais de disciplinas_geral do 1º Bimestre
                                          let b1Val: number | null = null;
                                          const b1Ass = gradeAssessments.filter(a => a.subject.toUpperCase() === subjUpper && a.bimestre === '1º BIMESTRE');
                                          if (grade === '6º ANO') {
                                             if (subjUpper === 'MATEMÁTICA') b1Val = 51;
                                             else if (subjUpper === 'GEOGRAFIA') b1Val = 51;
                                             else if (subjUpper === 'HISTÓRIA') b1Val = 47;
                                             else if (subjUpper === 'ARTE') b1Val = 47;
                                             else if (subjUpper === 'LÍNGUA PORTUGUESA') b1Val = 41;
                                             else if (subjUpper === 'CIÊNCIAS') b1Val = 33;
                                          } else if (grade === '7º ANO') {
                                             if (subjUpper === 'CIÊNCIAS') b1Val = 55;
                                             else if (subjUpper === 'LÍNGUA PORTUGUESA') b1Val = 42;
                                             else if (subjUpper === 'HISTÓRIA') b1Val = 38;
                                             else if (subjUpper === 'ARTE') b1Val = 38;
                                             else if (subjUpper === 'MATEMÁTICA') b1Val = 36;
                                             else if (subjUpper === 'GEOGRAFIA') b1Val = 32;
                                          } else if (grade === '8º ANO') {
                                             if (subjUpper === 'HISTÓRIA') b1Val = 46;
                                             else if (subjUpper === 'GEOGRAFIA') b1Val = 40;
                                             else if (subjUpper === 'MATEMÁTICA') b1Val = 38;
                                             else if (subjUpper === 'LÍNGUA PORTUGUESA') b1Val = 35;
                                             else if (subjUpper === 'CIÊNCIAS') b1Val = 31;
                                             else if (subjUpper === 'ARTE') b1Val = 28;
                                          } else if (grade === '9º ANO') {
                                             if (subjUpper === 'ARTE') b1Val = 71;
                                             else if (subjUpper === 'MATEMÁTICA') b1Val = 65;
                                             else if (subjUpper === 'CIÊNCIAS') b1Val = 63;
                                             else if (subjUpper === 'LÍNGUA PORTUGUESA') b1Val = 55;
                                             else if (subjUpper === 'HISTÓRIA') b1Val = 54;
                                             else if (subjUpper === 'GEOGRAFIA') b1Val = 47;
                                          } else if (b1Ass.length > 0) {
                                             b1Val = b1Ass.reduce((acc, curr) => acc + curr.averageScore, 0) / b1Ass.length;
                                          }

                                          let b2Val: number | null = null;
                                          const b2Ass = gradeAssessments.filter(a => a.subject.toUpperCase() === subjUpper && a.bimestre === '2º BIMESTRE');
                                          if (grade === '6º ANO') {
                                             if (subjUpper === 'MATEMÁTICA') b2Val = 48;
                                             else if (subjUpper === 'ARTE') b2Val = 43;
                                             else if (subjUpper === 'LÍNGUA PORTUGUESA') b2Val = 42;
                                             else if (subjUpper === 'CIÊNCIAS') b2Val = 41;
                                             else if (subjUpper === 'GEOGRAFIA') b2Val = 41;
                                             else if (subjUpper === 'HISTÓRIA') b2Val = 35;
                                          } else if (grade === '7º ANO') {
                                             if (subjUpper === 'GEOGRAFIA') b2Val = 46;
                                             else if (subjUpper === 'LÍNGUA PORTUGUESA') b2Val = 44;
                                             else if (subjUpper === 'HISTÓRIA') b2Val = 37;
                                             else if (subjUpper === 'ARTE') b2Val = 36;
                                             else if (subjUpper === 'MATEMÁTICA') b2Val = 32;
                                             else if (subjUpper === 'CIÊNCIAS') b2Val = 31;
                                          } else if (grade === '8º ANO') {
                                             if (subjUpper === 'CIÊNCIAS') b2Val = 62;
                                             else if (subjUpper === 'LÍNGUA PORTUGUESA') b2Val = 47;
                                             else if (subjUpper === 'ARTE') b2Val = 46;
                                             else if (subjUpper === 'HISTÓRIA') b2Val = 39;
                                             else if (subjUpper === 'GEOGRAFIA') b2Val = 37;
                                             else if (subjUpper === 'MATEMÁTICA') b2Val = 35;
                                          } else if (grade === '9º ANO') {
                                             if (subjUpper === 'LÍNGUA PORTUGUESA') b2Val = 66;
                                             else if (subjUpper === 'ARTE') b2Val = 59;
                                             else if (subjUpper === 'CIÊNCIAS') b2Val = 56;
                                             else if (subjUpper === 'HISTÓRIA') b2Val = 53;
                                             else if (subjUpper === 'GEOGRAFIA') b2Val = 53;
                                             else if (subjUpper === 'MATEMÁTICA') b2Val = 49;
                                          } else if (b2Ass.length > 0) {
                                             b2Val = b2Ass.reduce((acc, curr) => acc + curr.averageScore, 0) / b2Ass.length;
                                          }

                                          let delta: number | null = null;
                                          if (b1Val !== null && b2Val !== null) {
                                             delta = parseFloat((b2Val - b1Val).toFixed(1));
                                          }

                                          return (
                                             <tr key={subj} className="hover:bg-white/5">
                                                <td className="py-2.5 text-white/90 font-black uppercase text-[11px]">{subj}</td>
                                                <td className="py-2.5 text-center text-white/60">
                                                   {b1Val !== null ? `${b1Val.toFixed(1)}%` : '-'}
                                                </td>
                                                <td className="py-2.5 text-center text-white/90">
                                                   {b2Val !== null ? `${b2Val.toFixed(1)}%` : '-'}
                                                </td>
                                                <td className="py-2.5 text-center">
                                                   {delta !== null ? (
                                                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                                                         delta > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                         delta < 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                         'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                                      }`}>
                                                         {delta > 0 && <ArrowUpRight size={12} />}
                                                         {delta < 0 && <ArrowDownRight size={12} />}
                                                         {delta === 0 && <Minus size={12} />}
                                                         {delta > 0 ? `+${delta}%` : `${delta}%`}
                                                      </span>
                                                   ) : '-'}
                                                </td>
                                             </tr>
                                          );
                                       })}
                                    </tbody>
                                 </table>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               )}
               {displayMode === 'cards' && (
                  <>
                     {/* GRAPH SECTION */}
                     <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                              <TrendingUp size={20} className="text-violet-400" /> Evolução Bimestral por Turmas
                           </h3>
                           <select
                              value={selectedSubjectChart}
                              onChange={e => setSelectedSubjectChart(e.target.value)}
                              className="p-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase outline-none focus:bg-white/10 focus:ring-2 focus:ring-violet-500/50 text-white/80 [&>option]:bg-gray-900"
                           >
                              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <div className="h-[300px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                 <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
                                 <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
                                 <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', backgroundColor: '#1e1b4b', color: '#fff' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ccc' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: '900', color: '#fff', marginBottom: '4px', textTransform: 'uppercase' }}
                                 />
                                 <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px', color: '#fff' }} />
                                 {activeClasses.map((cls, idx) => (
                                    <Bar
                                       key={cls}
                                       dataKey={cls}
                                       fill={COLORS[idx % COLORS.length]}
                                       radius={[4, 4, 0, 0]}
                                       barSize={30}
                                    />
                                 ))}
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {externalAssessments.map(ass => {
                           const avg = ass.grades.reduce((acc, g) => acc + g.score, 0) / (ass.grades.length || 1);
                           const lowPerformers = ass.grades.filter(g => (g.proficiencyLevel === 'BAIXO' || g.proficiencyLevel === 'MUITO_BAIXO')).length;

                           return (
                              <div key={ass.id} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-sm hover:border-violet-500/30 hover:bg-white/10 transition-all flex flex-col justify-between group backdrop-blur-md">
                                 <div>
                                    <div className="flex justify-between items-start mb-4">
                                       <div className="p-3 bg-violet-500/10 text-violet-400 rounded-2xl border border-violet-500/20"><FileBarChart size={24} /></div>
                                       <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${ass.type === 'CAED' || ass.type === 'SEE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{ass.type === 'CAED' ? 'SEE' : ass.type}</span>
                                    </div>
                                    <h4 className="text-lg font-black text-white uppercase leading-tight">{ass.subject}</h4>
                                    <p className="text-[10px] text-white/40 font-bold uppercase mt-1">{ass.className} • {ass.bimestre}</p>

                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                       <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                          <p className="text-[8px] font-black text-white/40 uppercase">Proficiência Média</p>
                                          <p className="text-xl font-black text-violet-300">{avg.toFixed(1)}%</p>
                                       </div>
                                       <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20">
                                          <p className="text-[8px] font-black text-red-400 uppercase">Atenção (Baixo)</p>
                                          <p className="text-xl font-black text-red-500">{lowPerformers} <span className="text-[10px] text-red-300/60 uppercase">Alunos</span></p>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                                    <button onClick={() => deleteRecord(ass.id)} className="text-white/20 hover:text-red-400 transition-colors" title="Excluir"><Trash2 size={16} /></button>
                                    <div className="flex gap-2">
                                       <button
                                          onClick={() => setSelectedAssessmentForView(ass)}
                                          className="px-3 py-2 bg-white/5 text-white/60 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 border border-white/10"
                                       >
                                          <Search size={12} />
                                          Ver Alunos
                                       </button>
                                       <button
                                          onClick={() => handleGenerateAIReport(ass)}
                                          className="px-3 py-2 bg-violet-500/10 text-violet-300 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-violet-500/20 transition-all flex items-center gap-2 border border-violet-500/20"
                                       >
                                          <Sparkles size={12} />
                                          Plano de Ação (IA)
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}
                        {externalAssessments.length === 0 && (
                           <div className="col-span-full py-24 text-center border-2 border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm">
                              <BarChart3 size={48} className="mx-auto mb-4 text-white/10" />
                              <p className="text-white/30 font-black uppercase text-xs tracking-widest">Nenhuma avaliação externa registrada</p>
                           </div>
                        )}
                     </div>
                  </>
               )}
            </div>
         ) : (
            <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20">
               <form onSubmit={handleSave} className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-xl space-y-10 backdrop-blur-md">
                  <div className="flex justify-between items-center border-b border-white/10 pb-8">
                     <div className="flex items-center gap-6">
                        <button type="button" onClick={() => setViewMode('list')} className="p-3 bg-white/5 text-white/40 hover:text-violet-400 rounded-2xl transition-all border border-white/10"><ArrowLeft size={24} /></button>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tight">Lançamento de Resultados de Sistema</h3>
                           <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Dados de proficiência da SEDUC/DRE</p>
                        </div>
                     </div>
                     <div className="p-3 bg-violet-500/10 text-violet-400 rounded-2xl shadow-sm border border-violet-500/20">
                        <Target size={24} />
                     </div>
                  </div>

                  {/* BOTÃO DE IMPORTAÇÃO IA */}
                  <div className="p-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2.5rem] shadow-lg shadow-violet-900/40">
                     <button
                        type="button"
                        disabled={isImporting}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-6 bg-[#0f1016] hover:bg-[#161821] transition-all rounded-[2.3rem] flex items-center justify-center gap-4 group overflow-hidden relative"
                     >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                           <Sparkles size={120} className="text-violet-500" />
                        </div>
                        {isImporting ? (
                           <div className="flex items-center gap-3">
                              <Loader2 size={24} className="animate-spin text-violet-500" />
                              <span className="text-sm font-black text-violet-200 uppercase tracking-widest">IA Analisando Documento...</span>
                           </div>
                        ) : (
                           <>
                              <div className="p-3 bg-violet-500/10 text-violet-400 rounded-2xl group-hover:scale-110 transition-transform border border-violet-500/20">
                                 <FileUp size={24} />
                              </div>
                              <div className="text-left">
                                 <p className="text-sm font-black text-white uppercase tracking-tight leading-none">Importar Relatório (PDF/XLS)</p>
                                 <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Extração inteligente de nomes e notas via IA</p>
                              </div>
                              <Sparkles size={18} className="text-amber-400 animate-pulse" />
                           </>
                        )}
                     </button>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImportFile}
                        className="hidden"
                        accept=".pdf,.xls,.xlsx,image/*"
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Sistema de Avaliação</label>
                           <div className="grid grid-cols-2 gap-3">
                              {SYSTEMS.map(sys => (
                                 <button key={sys} type="button" onClick={() => setForm({ ...form, type: sys as any })} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${form.type === sys ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>{sys}</button>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Componente Curricular</label>
                           <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm text-white uppercase outline-none focus:bg-white/10 transition-all [&>option]:bg-gray-900">
                              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Turma</label>
                              <select value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm text-white uppercase outline-none focus:bg-white/10 transition-all [&>option]:bg-gray-900">
                                 {classrooms.map(c => <option key={c}>{c}</option>)}
                                 {classrooms.length === 0 && <option value="">Sem turmas cadastradas</option>}
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Bimestre</label>
                              <select value={form.bimestre} onChange={e => setForm({ ...form, bimestre: e.target.value })} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm text-white uppercase outline-none focus:bg-white/10 transition-all [&>option]:bg-gray-900">
                                 {['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'].map(b => <option key={b}>{b}</option>)}
                              </select>
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Descrição do Período/Avaliação</label>
                           <input required type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value.toUpperCase() })} placeholder="EX: AVALIAÇÃO DIAGNÓSTICA DE ENTRADA" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white uppercase outline-none focus:bg-white/10 transition-all placeholder:text-white/20" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                           <h4 className="text-xs font-black text-white uppercase tracking-widest">Notas de Proficiência (%)</h4>
                           {isLoadingStudents && <span className="text-[9px] text-violet-400 font-bold animate-pulse">Carregando alunos...</span>}
                        </div>
                        <span className="text-[9px] font-bold text-violet-400 uppercase flex items-center gap-1"><ShieldCheck size={12} /> Dados Auditáveis</span>
                     </div>
                     <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {form.grades.map(g => (
                           <div key={g.studentId} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-transparent hover:border-violet-500/30 transition-all">
                              <div>
                                 <p className="text-xs font-black text-white uppercase">{g.studentName}</p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${PROFICIENCY_LEVELS.find(l => l.value === g.proficiencyLevel)?.color
                                       }`}>
                                       Nível: {PROFICIENCY_LEVELS.find(l => l.value === g.proficiencyLevel)?.label}
                                    </span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={g.score}
                                    onChange={e => updateStudentData(g.studentId, parseInt(e.target.value) || 0)}
                                    className="w-20 p-2 text-center bg-black/20 rounded-xl font-black text-sm text-white outline-none border-2 border-transparent focus:border-violet-500/50 transition-all"
                                 />
                                 <span className="text-[10px] font-black text-white/30">%</span>
                              </div>
                           </div>
                        ))}
                        {!isLoadingStudents && form.grades.length === 0 && (
                           <div className="p-8 text-center bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                              <p className="text-white/30 font-bold text-xs">Nenhum aluno encontrado nesta turma.</p>
                           </div>
                        )}
                     </div>
                  </div>

                  <button type="submit" disabled={isLoadingStudents || form.grades.length === 0} className={`w-full py-5 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all ${isLoadingStudents || form.grades.length === 0 ? 'bg-white/5 cursor-not-allowed text-white/20' : 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/30'}`}>Finalizar Lançamento Externo</button>
               </form>
            </div>
         )}

         {/* AI STRATEGY MODAL */}
         {selectedAssessmentForAI && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 font-sans">
               <div className="bg-[#1a1a1a] rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10">
                  <div className="p-8 bg-violet-900/50 text-white flex justify-between items-center shrink-0 border-b border-white/10">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl"><BrainCircuit size={28} /></div>
                        <div>
                           <h3 className="text-xl font-black uppercase tracking-tight">Plano de Intervenção Estratégica</h3>
                           <p className="text-violet-200 text-xs font-bold uppercase tracking-widest">{selectedAssessmentForAI.subject} • {selectedAssessmentForAI.className}</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedAssessmentForAI(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24} /></button>
                  </div>

                  <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
                     {loadingAI ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                           <Loader2 size={48} className="animate-spin text-violet-500" />
                           <p className="text-white/40 font-black uppercase text-xs tracking-widest">A Inteligência Artificial está analisando os dados da turma...</p>
                        </div>
                     ) : aiReport ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                           <div>
                              <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={14} /> Diagnóstico Identificado</h4>
                              <p className="text-white/80 font-medium leading-relaxed bg-white/5 p-6 rounded-3xl border border-white/10 text-sm">
                                 {aiReport.diagnosis}
                              </p>
                           </div>

                           <div>
                              <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Lightbulb size={14} /> Habilidades Foco (BNCC/DRC-MT)</h4>
                              <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20">
                                 <p className="text-amber-200 font-bold text-sm">{aiReport.skillsToReinforce || aiReport.skills_to_reinforce}</p>
                              </div>
                           </div>

                           <div>
                              <div className="flex justify-between items-center mb-3">
                                 <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 size={14} /> {aiReport.id ? 'Checklist de Ação (PDCA)' : 'Metodologias Ativas Sugeridas'}
                                 </h4>
                                 {aiReport.id && aiReport.tasks && (
                                    <span className="text-[10px] font-bold text-white/50 bg-white/5 px-2 py-1 rounded-md">
                                       {aiReport.tasks.filter((t: any) => t.completed).length} de {aiReport.tasks.length} Concluídas
                                    </span>
                                 )}
                              </div>
                              <div className="space-y-3">
                                 {aiReport.id && aiReport.tasks ? (
                                    aiReport.tasks.map((task: any, idx: number) => (
                                       <div key={task.id} 
                                            onClick={() => handleToggleTask(task.id)}
                                            className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none ${task.completed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${task.completed ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/10 border-white/20 text-transparent'}`}>
                                             {task.completed && <Check size={14} strokeWidth={3} />}
                                          </div>
                                          <p className={`text-sm font-medium transition-all ${task.completed ? 'text-emerald-200/50 line-through' : 'text-white/80'}`}>{task.title}</p>
                                       </div>
                                    ))
                                 ) : (
                                    aiReport.actions?.map((action: string, idx: number) => (
                                       <div key={idx} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-transparent transition-all">
                                          <div className="w-6 h-6 rounded-full bg-violet-600/50 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-violet-500/30">{idx + 1}</div>
                                          <p className="text-white/80 text-sm font-medium">{action}</p>
                                       </div>
                                    ))
                                 )}
                              </div>
                              
                              {!aiReport.id && (
                                 <div className="mt-8 flex justify-center">
                                    <button onClick={handleSaveActionPlan} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                       <Save size={18} /> Salvar como Plano de Ação
                                    </button>
                                 </div>
                              )}
                           </div>
                           
                           {aiReport.id && (
                              <div className="mt-8 flex justify-center border-t border-white/10 pt-6">
                                 <button onClick={() => handleGenerateAIReport(selectedAssessmentForAI, true)} className="text-white/40 hover:text-white transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                    <RefreshCw size={14} /> Gerar Novas Ideias (Substituir Plano)
                                 </button>
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="text-center py-10 text-white/30">Não foi possível gerar o relatório.</div>
                     )}
                  </div>

                  <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end shrink-0">
                     <button onClick={() => window.print()} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all">Imprimir Relatório</button>
                  </div>
               </div>
            </div>
         )}

         {/* VIEW STUDENTS MODAL */}
         {selectedAssessmentForView && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 font-sans">
               <div className="bg-[#1a1a1a] rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10">
                  <div className="p-8 bg-violet-900/50 text-white flex justify-between items-center shrink-0 border-b border-white/10">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl"><Search size={28} /></div>
                        <div>
                           <h3 className="text-xl font-black uppercase tracking-tight">Desempenho dos Alunos</h3>
                           <p className="text-violet-200 text-xs font-bold uppercase tracking-widest">{selectedAssessmentForView.subject} • {selectedAssessmentForView.className} • {selectedAssessmentForView.bimestre}</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedAssessmentForView(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24} /></button>
                  </div>

                  <div className="flex border-b border-white/10 px-8">
                     <button 
                        onClick={() => setActiveModalTab('alunos')}
                        className={`px-6 py-4 font-bold text-sm tracking-wide transition-all ${activeModalTab === 'alunos' ? 'border-b-2 border-violet-500 text-violet-400' : 'text-white/40 hover:text-white/70'}`}>
                        Desempenho dos Alunos
                     </button>
                     <button 
                        onClick={() => setActiveModalTab('habilidades')}
                        className={`px-6 py-4 font-bold text-sm tracking-wide transition-all ${activeModalTab === 'habilidades' ? 'border-b-2 border-amber-500 text-amber-400' : 'text-white/40 hover:text-white/70'}`}>
                        Raio-X de Habilidades
                     </button>
                  </div>

                  <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
                  {activeModalTab === 'alunos' ? (
                     <div className="grid grid-cols-1 gap-3">
                        {selectedAssessmentForView.grades.sort((a, b) => a.studentName.localeCompare(b.studentName)).map(g => (
                           <React.Fragment key={g.studentName}>
                           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/30 transition-all">
                              <div 
                                 className="cursor-pointer"
                                 onClick={() => setSelectedStudentHistory(selectedStudentHistory === g.studentId ? null : g.studentId)}
                              >
                                 <p className="text-xs font-black text-white uppercase hover:text-violet-400 transition-colors">{g.studentName}</p>
                                 <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${PROFICIENCY_LEVELS.find(l => l.value === g.proficiencyLevel)?.color}`}>
                                       Nível: {PROFICIENCY_LEVELS.find(l => l.value === g.proficiencyLevel)?.label}
                                    </span>
                                    
                                    {/* BADGES DE CRUZAMENTO */}
                                    {g.studentId && studentStats[g.studentId] && (
                                       <>
                                          {studentStats[g.studentId].attendance < 85 && (
                                             <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30" title={`Frequência: ${studentStats[g.studentId].attendance.toFixed(1)}%`}>
                                                Falta Crítica
                                             </span>
                                          )}
                                          {studentStats[g.studentId].activeReferrals > 0 && (
                                             <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30" title={`${studentStats[g.studentId].activeReferrals} Encaminhamento(s) Aberto(s)`}>
                                                Psicossocial
                                             </span>
                                          )}
                                          {studentStats[g.studentId].civicoBehavior > 0 && (
                                             <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" title={`${studentStats[g.studentId].civicoBehavior} Ocorrência(s) Disciplinar(es)`}>
                                                Conduta
                                             </span>
                                          )}
                                       </>
                                    )}
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="w-20 p-2 text-center bg-black/20 rounded-xl font-black text-sm text-white border border-white/5">
                                    {g.score}%
                                 </div>
                              </div>
                           </div>
                           
                           {/* HISTÓRICO DO ALUNO (MINI-DOSSIÊ) */}
                           {selectedStudentHistory === g.studentId && (
                              <div className="p-4 bg-black/40 rounded-2xl border border-violet-500/20 mt-1 mb-3 animate-in slide-in-from-top-2">
                                 <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <TrendingUp size={14} /> Evolução Individual: {g.studentName}
                                 </h4>
                                 <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                       <BarChart
                                          data={allExternalAssessments
                                             .filter(a => a.subject === selectedAssessmentForView.subject && a.className === selectedAssessmentForView.className)
                                             .map(a => {
                                                const studentGrade = a.grades.find(gr => gr.studentId === g.studentId);
                                                return {
                                                   name: a.bimestre,
                                                   score: studentGrade ? studentGrade.score : 0,
                                                   date: a.date
                                                };
                                             })
                                             .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                          }
                                          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                                       >
                                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                          <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                                          <YAxis stroke="#ffffff50" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                                          <Tooltip
                                             contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                                             itemStyle={{ color: '#a78bfa' }}
                                             cursor={{fill: '#ffffff05'}}
                                          />
                                          <Bar dataKey="score" name="Proficiência (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                       </BarChart>
                                    </ResponsiveContainer>
                                 </div>
                              </div>
                           )}
                           </React.Fragment>
                        ))}
                        {selectedAssessmentForView.grades.length === 0 && (
                           <div className="p-8 text-center bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                              <p className="text-white/30 font-bold text-xs">Nenhum aluno registrado nesta avaliação.</p>
                           </div>
                        )}
                     </div>
                  ) : (
                     <SkillsXRay assessment={selectedAssessmentForView} />
                  )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

function SkillsXRay({ assessment }: { assessment: Assessment }) {
   const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

   const classData = (HabilidadesTodasTurmas as Record<string, any>)[assessment.className.toUpperCase()];
   const subjectData = classData ? classData[assessment.subject.toUpperCase()] : null;
   
   if (!subjectData || !subjectData.habilidades || subjectData.habilidades.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
               <span className="text-white/20">∅</span>
            </div>
            <h4 className="text-white/50 font-bold mb-2">Sem dados de habilidades</h4>
            <p className="text-white/30 text-sm max-w-sm">
               Não encontramos o mapeamento de habilidades para esta turma/disciplina na planilha importada.
            </p>
         </div>
      );
   }

   const habilidades = subjectData.habilidades;
   const alunosData = subjectData.alunos;

   return (
      <div className="space-y-8 animate-in fade-in duration-300">
         <section>
            <h4 className="text-amber-400 font-black uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-amber-500"></span>
               Desempenho Geral da Turma ({habilidades.length} Habilidades)
            </h4>
            <div className="grid grid-cols-1 gap-3">
               {habilidades.sort((a: any, b: any) => b.rendimento - a.rendimento).map((hab: any) => (
                  <div key={hab.codigo} className="bg-white/5 border border-white/10 rounded-xl p-4">
                     <div className="flex justify-between items-start gap-4 mb-2">
                        <div>
                           <p className="text-white font-bold text-sm" title={hab.descricao}>{hab.codigo}</p>
                           <p className="text-white/50 text-xs line-clamp-1 mt-0.5" title={hab.descricao}>{hab.descricao.split('-').slice(1).join('-').trim()}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-black ${hab.rendimento >= 70 ? 'bg-green-500/20 text-green-400' : hab.rendimento >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                           {hab.rendimento}%
                        </div>
                     </div>
                     <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div 
                           className={`h-full rounded-full ${hab.rendimento >= 70 ? 'bg-green-500' : hab.rendimento >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                           style={{ width: `${Math.max(hab.rendimento, 2)}%` }}
                        />
                     </div>
                  </div>
               ))}
            </div>
         </section>

         <section>
            <h4 className="text-violet-400 font-black uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-violet-500"></span>
               Raio-X por Aluno
            </h4>
            <div className="grid grid-cols-1 gap-2">
               {Object.keys(alunosData).sort().map(aluno => {
                  const studentSkills = alunosData[aluno];
                  const isExpanded = expandedStudent === aluno;
                  
                  // Calcular percentual do aluno
                  const total = Object.keys(studentSkills).length;
                  const acertos = Object.values(studentSkills).filter(v => v === true).length;
                  const rendimento = total > 0 ? Math.round((acertos / total) * 100) : 0;

                  return (
                     <div key={aluno} className={`bg-white/5 border ${isExpanded ? 'border-violet-500/50' : 'border-white/10'} rounded-xl overflow-hidden transition-all`}>
                        <div 
                           className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
                           onClick={() => setExpandedStudent(isExpanded ? null : aluno)}
                        >
                           <div>
                              <p className="text-white text-sm font-bold">{aluno}</p>
                              <p className="text-white/40 text-xs mt-0.5">Acertou {acertos} de {total} habilidades</p>
                           </div>
                           <div className={`text-sm font-black ${rendimento >= 70 ? 'text-green-400' : rendimento >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {rendimento}%
                           </div>
                        </div>

                        {isExpanded && (
                           <div className="p-4 pt-0 border-t border-white/5 bg-black/20 flex flex-col gap-4 animate-in slide-in-from-top-2">
                              <div>
                                 <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2 mt-4">Dominadas (Acertos)</p>
                                 <div className="flex flex-wrap gap-2">
                                    {Object.entries(studentSkills).filter(([_, hit]) => hit === true).map(([codigo]) => {
                                       const desc = habilidades.find((h: any) => h.codigo === codigo)?.descricao || codigo;
                                       return (
                                          <span key={codigo} title={desc} className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-300 rounded text-[10px] font-bold cursor-help">
                                             {codigo}
                                          </span>
                                       );
                                    })}
                                    {Object.entries(studentSkills).filter(([_, hit]) => hit === true).length === 0 && (
                                       <span className="text-white/30 text-xs italic">Nenhuma habilidade dominada.</span>
                                    )}
                                 </div>
                              </div>

                              <div>
                                 <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Em Déficit (Erros)</p>
                                 <div className="flex flex-wrap gap-2">
                                    {Object.entries(studentSkills).filter(([_, hit]) => hit === false).map(([codigo]) => {
                                       const desc = habilidades.find((h: any) => h.codigo === codigo)?.descricao || codigo;
                                       return (
                                          <span key={codigo} title={desc} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-300 rounded text-[10px] font-bold cursor-help">
                                             {codigo}
                                          </span>
                                       );
                                    })}
                                    {Object.entries(studentSkills).filter(([_, hit]) => hit === false).length === 0 && (
                                       <span className="text-white/30 text-xs italic">Nenhuma habilidade em déficit.</span>
                                    )}
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </section>
      </div>
   );
}

export default CoordinationExternalGrades;
