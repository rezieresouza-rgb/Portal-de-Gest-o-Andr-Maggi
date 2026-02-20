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
   Lightbulb
} from 'lucide-react';
import { useToast } from './Toast';
import { Assessment, StudentGrade } from '../types';
import { extractAssessmentResults, generatePedagogicalIntervention } from '../geminiService';
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

const SYSTEMS = ['CAED', 'SISTEMA ESTRUTURADO'];
const SUBJECTS = ["MATEMÁTICA", "LÍNGUA PORTUGUESA", "CIÊNCIAS", "HISTÓRIA", "GEOGRAFIA", "LÍNGUA INGLESA"];
const PROFICIENCY_LEVELS = [
   { label: 'Muito Baixo', value: 'MUITO_BAIXO', color: 'text-red-600 bg-red-50' },
   { label: 'Baixo', value: 'BAIXO', color: 'text-orange-600 bg-orange-50' },
   { label: 'Médio', value: 'MÉDIO', color: 'text-amber-600 bg-amber-50' },
   { label: 'Alto', value: 'ALTO', color: 'text-emerald-600 bg-emerald-50' },
];

const CoordinationExternalGrades: React.FC = () => {
   const { addToast } = useToast();
   const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
   const [isImporting, setIsImporting] = useState(false);
   const [isLoadingStudents, setIsLoadingStudents] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const [externalAssessments, setExternalAssessments] = useState<Assessment[]>([]);
   const [students, setStudents] = useState<{ id: string, name: string }[]>([]);
   const [classrooms, setClassrooms] = useState<string[]>([]);

   // AI Modal State
   const [selectedAssessmentForAI, setSelectedAssessmentForAI] = useState<Assessment | null>(null);
   const [aiReport, setAiReport] = useState<any | null>(null);
   const [loadingAI, setLoadingAI] = useState(false);

   // Analytics State
   const [selectedSubjectChart, setSelectedSubjectChart] = useState<string>(SUBJECTS[0]);

   // Form State
   const [form, setForm] = useState<Omit<Assessment, 'id' | 'timestamp'>>({
      date: new Date().toISOString().split('T')[0],
      bimestre: '1º BIMESTRE',
      className: '',
      subject: SUBJECTS[0],
      teacherName: 'COORDENAÇÃO',
      type: 'CAED',
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
        grades (score, proficiency_level, students(name)),
        classrooms (name)
      `)
         .in('type', ['CAED', 'SISTEMA ESTRUTURADO'])
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
               studentId: 'N/A', // We don't need ID for display list usually, or we can't easily map back if we don't fetch it
               studentName: g.students?.name || 'Aluno',
               score: g.score,
               proficiencyLevel: g.proficiency_level
            })),
            timestamp: new Date(a.date).getTime()
         }));
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
      const filtered = externalAssessments.filter(a => a.subject === selectedSubjectChart);

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
      externalAssessments.filter(a => a.subject === selectedSubjectChart).forEach(a => classes.add(a.className));
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
   const handleGenerateAIReport = async (assessment: Assessment) => {
      setSelectedAssessmentForAI(assessment);
      setLoadingAI(true);
      setAiReport(null);

      const avg = assessment.grades.reduce((acc, g) => acc + g.score, 0) / (assessment.grades.length || 1);
      const lowPerformers = assessment.grades
         .filter(g => g.score < 60)
         .map(g => `${g.studentName} (${g.score}%)`);

      const payload = {
         subject: assessment.subject,
         className: assessment.className,
         bimestre: assessment.bimestre,
         averageScore: avg.toFixed(1),
         lowPerformers: lowPerformers
      };

      const result = await generatePedagogicalIntervention(payload);
      setAiReport(result);
      setLoadingAI(false);
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500">
         {viewMode === 'list' ? (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                     <h2 className="text-3xl font-black text-white uppercase tracking-tight">Avaliações de Sistema</h2>
                     <p className="text-white/60 font-bold text-xs uppercase tracking-widest">Resultados CAED / Sistema Estruturado</p>
                  </div>
                  <button
                     onClick={() => setViewMode('form')}
                     className="px-8 py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center gap-2 border border-violet-500/20"
                  >
                     <Plus size={18} /> Lançar Resultados
                  </button>
               </div>

               {/* GRAPH SECTION */}
               <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <TrendingUp size={20} className="text-violet-400" /> Evolução Bimestral
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
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                           <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
                           <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
                           <Tooltip
                              contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', backgroundColor: '#1e1b4b', color: '#fff' }}
                              itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ccc' }}
                              labelStyle={{ fontSize: '10px', fontWeight: '900', color: '#fff', marginBottom: '4px', textTransform: 'uppercase' }}
                           />
                           <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px', color: '#fff' }} />
                           {activeClasses.map((cls, idx) => (
                              <Line
                                 key={cls}
                                 type="monotone"
                                 dataKey={cls}
                                 stroke={COLORS[idx % COLORS.length]}
                                 strokeWidth={3}
                                 dot={{ r: 4, strokeWidth: 2, fill: '#1e1b4b' }}
                                 activeDot={{ r: 6 }}
                              />
                           ))}
                        </LineChart>
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
                                 <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${ass.type === 'CAED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{ass.type}</span>
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
                              <button onClick={() => deleteRecord(ass.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                              <button
                                 onClick={() => handleGenerateAIReport(ass)}
                                 className="px-3 py-2 bg-violet-500/10 text-violet-300 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-violet-500/20 transition-all flex items-center gap-2 border border-violet-500/20"
                              >
                                 <Sparkles size={12} />
                                 Plano de Ação (IA)
                              </button>
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

                  <div className="p-10 overflow-y-auto custom-scrollbar space-y-8 flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
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
                                 <p className="text-amber-200 font-bold text-sm">{aiReport.skillsToReinforce}</p>
                              </div>
                           </div>

                           <div>
                              <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> Metodologias Ativas Sugeridas</h4>
                              <div className="space-y-3">
                                 {aiReport.actions?.map((action: string, idx: number) => (
                                    <div key={idx} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-transparent hover:border-white/10 transition-all">
                                       <div className="w-6 h-6 rounded-full bg-violet-600/50 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-violet-500/30">{idx + 1}</div>
                                       <p className="text-white/80 text-sm font-medium">{action}</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
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
      </div>
   );
};

export default CoordinationExternalGrades;
