import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  Award, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ShieldCheck, 
  FileEdit,
  Printer,
  TrendingUp,
  Percent,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { SCHOOL_CLASSES } from '../constants/initialData';
import { supabase } from '../supabaseClient';
import { User as UserType } from '../types';
import { useStudents } from '../hooks/useStudents';

const BIMESTRES = ['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'];
const CLASSES = SCHOOL_CLASSES;
const SUBJECTS = [
   "MATEMÁTICA", "LÍNGUA PORTUGUESA", "CIÊNCIAS", "HISTÓRIA", "GEOGRAFIA",
   "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA", "APA"
];

interface TeacherGradesProps {
   user: UserType;
}

const TeacherGrades: React.FC<TeacherGradesProps> = ({ user }) => {
   const [selectedClass, setSelectedClass] = useState('');
   const [selectedBimestre, setSelectedBimestre] = useState(BIMESTRES[0]);
   const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
   const [isSaving, setIsSaving] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const { students: allDbStudents, loading: loadingStudents } = useStudents();

   const [students, setStudents] = useState<any[]>([]);
   const [grades, setGrades] = useState<Record<string, number>>({});
   const [recoveryGrades, setRecoveryGrades] = useState<Record<string, number | null>>({});
   const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [isPrintingAta, setIsPrintingAta] = useState(false);

   useEffect(() => {
      if (selectedClass && !loadingStudents) {
         const filtered = allDbStudents.filter((s: any) =>
            s.class.toUpperCase() === selectedClass.toUpperCase() && (s.status === 'ATIVO' || s.status === 'RECLASSIFICADO')
         ).map(s => ({
            ...s,
            CodigoAluno: s.registration_number,
            Nome: s.name,
            paed: s.paed || false
         }));

         setStudents(filtered);
         if (filtered.length > 0) {
            fetchGrades(selectedClass, selectedSubject, selectedBimestre, filtered);
         }
      } else if (!selectedClass) {
         setStudents([]);
         setGrades({});
         setRecoveryGrades({});
         setCurrentAssessmentId(null);
      }
   }, [selectedClass, selectedSubject, selectedBimestre, allDbStudents, loadingStudents]);

   const fetchGrades = async (className: string, subject: string, bimestre: string, studentList: any[]) => {
      setIsLoading(true);
      try {
         const { data: classroomData } = await supabase
            .from('classrooms')
            .select('id')
            .eq('name', className)
            .single();

         if (!classroomData) {
            setGrades(initialGradesMap(studentList));
            setRecoveryGrades({});
            setCurrentAssessmentId(null);
            return;
         }

         const classroomId = classroomData.id;

         const { data: existingAssessment } = await supabase
            .from('assessments')
            .select('id')
            .eq('classroom_id', classroomId)
            .eq('subject', subject)
            .eq('bimestre', bimestre)
            .single();

         if (existingAssessment) {
            setCurrentAssessmentId(existingAssessment.id);
            const { data: gradeData } = await supabase
               .from('grades')
               .select('student_code, score, observations')
               .eq('assessment_id', existingAssessment.id);

            const loadedGrades: Record<string, number> = {};
            const loadedRecovery: Record<string, number | null> = {};
            studentList.forEach(s => {
               loadedGrades[s.CodigoAluno] = 0;
               loadedRecovery[s.CodigoAluno] = null;
            });

            if (gradeData) {
               gradeData.forEach((g: any) => {
                  if (g.student_code) {
                     loadedGrades[g.student_code] = g.score || 0;
                     if (g.observations && g.observations.startsWith('REC:')) {
                        const recVal = parseFloat(g.observations.replace('REC:', ''));
                        if (!isNaN(recVal)) loadedRecovery[g.student_code] = recVal;
                     }
                  }
               });
            }
            setGrades(loadedGrades);
            setRecoveryGrades(loadedRecovery);
         } else {
            setCurrentAssessmentId(null);
            setGrades(initialGradesMap(studentList));
            setRecoveryGrades({});
         }

      } catch (err) {
         console.error(err);
         setGrades(initialGradesMap(studentList));
         setRecoveryGrades({});
      } finally {
         setIsLoading(false);
      }
   };

   const initialGradesMap = (list: any[]) => {
      const map: Record<string, number> = {};
      list.forEach(s => map[s.CodigoAluno] = 0);
      return map;
   };

   const updateGrade = (id: string, value: string) => {
      let num = parseFloat(value.replace(',', '.'));
      if (isNaN(num)) num = 0;
      if (num > 10) num = 10;
      if (num < 0) num = 0;
      setGrades(prev => ({ ...prev, [id]: num }));
   };

   const updateRecoveryGrade = (id: string, value: string) => {
      if (!value.trim()) {
         setRecoveryGrades(prev => ({ ...prev, [id]: null }));
         return;
      }
      let num = parseFloat(value.replace(',', '.'));
      if (isNaN(num)) num = 0;
      if (num > 10) num = 10;
      if (num < 0) num = 0;
      setRecoveryGrades(prev => ({ ...prev, [id]: num }));
   };

   const getFinalScore = (studentCode: string) => {
      const baseScore = grades[studentCode] ?? 0;
      const recScore = recoveryGrades[studentCode];
      if (recScore !== null && recScore !== undefined && recScore > baseScore) {
         return recScore;
      }
      return baseScore;
   };

   const getProficiency = (score: number) => {
      if (score >= 8) return 'ALTO';
      if (score >= 6) return 'MÉDIO';
      if (score >= 4) return 'BAIXO';
      return 'MUITO_BAIXO';
   };

   // Estatísticas da Turma em Tempo Real
   const classStats = useMemo(() => {
      if (students.length === 0) return { average: 0, approvalRate: 0, recoveryCount: 0, maxScore: 0, minScore: 0 };
      
      const scores = students.map(s => getFinalScore(s.CodigoAluno));
      const totalSum = scores.reduce((a, b) => a + b, 0);
      const average = parseFloat((totalSum / scores.length).toFixed(1));
      
      const approvedCount = scores.filter(s => s >= 6.0).length;
      const approvalRate = Math.round((approvedCount / scores.length) * 100);
      const recoveryCount = scores.filter(s => s < 6.0).length;

      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);

      return { average, approvalRate, recoveryCount, maxScore, minScore };
   }, [students, grades, recoveryGrades]);

   const filteredStudents = useMemo(() => {
      if (!searchTerm) return students;
      return students.filter(s => 
         s.Nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
         s.CodigoAluno.includes(searchTerm)
      );
   }, [students, searchTerm]);

   const handleSave = async () => {
      if (!selectedClass || students.length === 0) return;
      setIsSaving(true);

      try {
         let classroomId = '';
         const { data: cls } = await supabase.from('classrooms').select('id').eq('name', selectedClass).single();
         if (cls) {
            classroomId = cls.id;
         } else {
            const { data: newCls, error: clsErr } = await supabase
               .from('classrooms')
               .insert([{ name: selectedClass, year: new Date().getFullYear().toString(), shift: 'MATUTINO' }])
               .select('id')
               .single();
            if (clsErr) throw clsErr;
            classroomId = newCls.id;
         }

         let assId = currentAssessmentId;
         if (!assId) {
            const { data: existing } = await supabase
               .from('assessments')
               .select('id')
               .eq('classroom_id', classroomId)
               .eq('subject', selectedSubject)
               .eq('bimestre', selectedBimestre)
               .single();
            if (existing) assId = existing.id;
         }

         if (!assId) {
            const { data: newAss, error: assErr } = await supabase.from('assessments').insert([{
               classroom_id: classroomId,
               subject: selectedSubject,
               bimestre: selectedBimestre,
               date: new Date().toISOString(),
               type: 'AVALIACAO_BIMESTRAL',
               max_score: 10,
               teacher_id: user.id
            }]).select('id').single();

            if (assErr) throw assErr;
            assId = newAss.id;
            setCurrentAssessmentId(assId);
         }

         const gradesToUpsert = students.map(s => {
            const finalScore = getFinalScore(s.CodigoAluno);
            const recVal = recoveryGrades[s.CodigoAluno];
            return {
               assessment_id: assId,
               student_code: s.CodigoAluno,
               student_name: s.Nome,
               score: finalScore,
               proficiency_level: getProficiency(finalScore),
               observations: recVal !== null && recVal !== undefined ? `REC:${recVal}` : null
            };
         });

         const { error: delErr } = await supabase.from('grades').delete().eq('assessment_id', assId);
         if (delErr) throw delErr;

         const { error: insErr } = await supabase.from('grades').insert(gradesToUpsert);
         if (insErr) throw insErr;

         alert("Notas e recuperações paralelas salvas com sucesso no banco oficial da SEDUC!");

      } catch (err) {
         console.error("Error saving grades:", err);
         alert("Erro ao salvar notas. Tente novamente.");
      } finally {
         setIsSaving(false);
      }
   };

   const handlePrintAta = () => {
      window.print();
   };

   return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 no-print">

         {/* CABEÇALHO & SELETORES */}
         <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bimestre Letivo</label>
                  <select 
                     value={selectedBimestre} 
                     onChange={e => setSelectedBimestre(e.target.value)} 
                     className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer text-indigo-700"
                  >
                     {BIMESTRES.map(b => <option key={b} value={b}>{b}</option>)}
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
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
               <button
                  onClick={handlePrintAta}
                  disabled={students.length === 0}
                  className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40 flex-1 lg:flex-none"
                  title="Imprimir Ata de Notas"
               >
                  <Printer size={16} /> Imprimir Ata
               </button>

               <button
                  onClick={handleSave}
                  disabled={isSaving || students.length === 0}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 flex-1 lg:flex-none"
               >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar Boletim
               </button>
            </div>
         </div>

         {/* PAINEL DE MÉTRICAS E SEMÁFORO DA TURMA */}
         {students.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                     <span className="text-[10px] font-black uppercase tracking-widest">Média da Turma</span>
                     <TrendingUp size={16} className="text-blue-600" />
                  </div>
                  <p className={`text-2xl font-black ${classStats.average >= 6 ? 'text-blue-600' : 'text-rose-600'}`}>
                     {classStats.average.toFixed(1)}
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Média mínima: 6.0</span>
               </div>

               <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                     <span className="text-[10px] font-black uppercase tracking-widest">Taxa Rendimento</span>
                     <Percent size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-600">
                     {classStats.approvalRate}%
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Aprovados (&ge; 6.0)</span>
               </div>

               <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                     <span className="text-[10px] font-black uppercase tracking-widest">Em Recuperação</span>
                     <AlertTriangle size={16} className="text-rose-600" />
                  </div>
                  <p className={`text-2xl font-black ${classStats.recoveryCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                     {classStats.recoveryCount} aluno(s)
                  </p>
                  <span className="text-[9px] font-bold text-rose-500 uppercase">Nota abaixo de 6.0</span>
               </div>

               <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                     <span className="text-[10px] font-black uppercase tracking-widest">Total de Alunos</span>
                     <GraduationCap size={16} className="text-indigo-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                     {students.length}
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Enturmação ativa</span>
               </div>
            </div>
         )}

         {/* TABELA PRINCIPAL DE NOTAS COM SEMÁFORO */}
         {students.length > 0 ? (
            <div className="bg-white rounded-[3rem] border border-slate-200/80 shadow-sm overflow-hidden relative">
               {isLoading && (
                  <div className="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                     <Loader2 className="animate-spin text-blue-600" size={36} />
                     <p className="text-xs font-black uppercase tracking-widest text-slate-600">Carregando notas do bimestre...</p>
                  </div>
               )}

               <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                        <FileEdit size={22} />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                           Lançamento — <span className="text-blue-600">{selectedSubject}</span> ({selectedBimestre})
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                           {selectedClass} • Digite notas de 0.0 a 10.0
                        </p>
                     </div>
                  </div>

                  <div className="relative w-full md:w-64">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                     />
                  </div>
               </div>

               {/* TABELA DE ALUNOS */}
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                           <th className="px-6 py-4">Estudante</th>
                           <th className="px-6 py-4 text-center w-36">Nota Avaliação</th>
                           <th className="px-6 py-4 text-center w-36">Recuperação Paralela</th>
                           <th className="px-6 py-4 text-center w-32">Nota Final</th>
                           <th className="px-6 py-4 text-center">Status / Rendimento</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((s, idx) => {
                           const baseScore = grades[s.CodigoAluno] ?? 0;
                           const recScore = recoveryGrades[s.CodigoAluno];
                           const finalScore = getFinalScore(s.CodigoAluno);
                           const isApproved = finalScore >= 6.0;
                           const prof = getProficiency(finalScore);

                           return (
                              <tr key={s.CodigoAluno} className="hover:bg-slate-50/70 transition-all">
                                 <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                       <span className="w-6 text-center text-xs font-black text-slate-300">
                                          #{idx + 1}
                                       </span>
                                       <div>
                                          <div className="flex items-center gap-2">
                                             <p className="text-sm font-black text-slate-900 uppercase leading-none">{s.Nome}</p>
                                             {s.paed && (
                                                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded-md text-[8px] uppercase tracking-wider flex items-center gap-1 shadow-sm border border-amber-500" title="Estudante PAEDE / Educação Especial (Avaliação Adaptada - PEI)">
                                                   <span>♿</span>
                                                   <span>PAEDE</span>
                                                </span>
                                             )}
                                          </div>
                                          <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Matrícula: {s.CodigoAluno}</p>
                                       </div>
                                    </div>
                                 </td>

                                 {/* NOTA PRINCIPAL */}
                                 <td className="px-6 py-5 text-center">
                                    <input
                                       type="number"
                                       step="0.1"
                                       min="0"
                                       max="10"
                                       value={baseScore === 0 ? '' : baseScore}
                                       placeholder="0.0"
                                       onChange={e => updateGrade(s.CodigoAluno, e.target.value)}
                                       className={`w-24 text-center py-2.5 px-3 rounded-2xl font-black text-sm border outline-none transition-all ${
                                          baseScore >= 6 
                                             ? 'bg-blue-50/60 border-blue-200 text-blue-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10' 
                                             : 'bg-rose-50/60 border-rose-200 text-rose-900 focus:bg-white focus:ring-4 focus:ring-rose-500/10'
                                       }`}
                                    />
                                 </td>

                                 {/* RECUPERAÇÃO PARALELA */}
                                 <td className="px-6 py-5 text-center">
                                    <input
                                       type="number"
                                       step="0.1"
                                       min="0"
                                       max="10"
                                       value={recScore === null || recScore === undefined ? '' : recScore}
                                       placeholder="—"
                                       onChange={e => updateRecoveryGrade(s.CodigoAluno, e.target.value)}
                                       className={`w-24 text-center py-2.5 px-3 rounded-2xl font-black text-sm border outline-none transition-all ${
                                          recScore !== null && recScore !== undefined && recScore >= 6
                                             ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                             : 'bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10'
                                       }`}
                                    />
                                 </td>

                                 {/* NOTA FINAL */}
                                 <td className="px-6 py-5 text-center">
                                    <span className={`text-base font-black px-3.5 py-1 rounded-xl ${
                                       isApproved 
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                       {finalScore.toFixed(1)}
                                    </span>
                                 </td>

                                 {/* SEMÁFORO DE STATUS */}
                                 <td className="px-6 py-5 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                          prof === 'ALTO'
                                             ? 'bg-blue-100 text-blue-800'
                                             : prof === 'MÉDIO'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-rose-100 text-rose-800'
                                       }`}>
                                          <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                          {isApproved ? 'Aprovado' : 'Recuperação'}
                                       </span>
                                    </div>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
         ) : (
            <div className="py-28 text-center bg-white rounded-[3rem] border border-slate-200/80 shadow-sm flex flex-col items-center justify-center space-y-3">
               <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                  <GraduationCap size={32} />
               </div>
               <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Selecione uma Turma para Lançar Notas</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-sm">
                  Escolha a turma, o bimestre e a disciplina no topo para abrir a planilha de avaliações.
               </p>
            </div>
         )}

      </div>
   );
};

export default TeacherGrades;
