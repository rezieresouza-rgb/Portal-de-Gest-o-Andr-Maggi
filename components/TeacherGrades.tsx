
import React, { useState, useEffect } from 'react';
import { GraduationCap, Award, Search, CheckCircle2, AlertTriangle, Loader2, ShieldCheck, FileEdit } from 'lucide-react';
import { INITIAL_STUDENTS, SCHOOL_CLASSES } from '../constants/initialData';
import { supabase } from '../supabaseClient';
import { User as UserType } from '../types';

const BIMESTRES = ['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'];
const CLASSES = SCHOOL_CLASSES;
const SUBJECTS = [
   "MATEMÁTICA", "LÍNGUA PORTUGUESA", "CIÊNCIAS", "HISTÓRIA", "GEOGRAFIA",
   "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA", "ENSINO RELIGIOSO"
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

   const [students, setStudents] = useState<any[]>([]);
   const [grades, setGrades] = useState<Record<string, number>>({});
   const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

   useEffect(() => {
      // Load Students (Mock for now, as full student migration is pending)
      const saved = localStorage.getItem('secretariat_detailed_students_v1');
      const allStudents = saved ? JSON.parse(saved) : INITIAL_STUDENTS;

      if (selectedClass) {
         const filtered = allStudents.filter((s: any) =>
            s.Turma.toUpperCase() === selectedClass.toUpperCase()
         );
         setStudents(filtered);

         // Load Grades if exists
         if (filtered.length > 0) {
            fetchGrades(selectedClass, selectedSubject, selectedBimestre, filtered);
         }
      } else {
         setStudents([]);
         setGrades({});
         setCurrentAssessmentId(null);
      }
   }, [selectedClass, selectedSubject, selectedBimestre]);

   const fetchGrades = async (className: string, subject: string, bimestre: string, studentList: any[]) => {
      setIsLoading(true);
      try {
         // Find matches in assessments table
         // We first need the classroom_id. 
         // If we can't find it, we can't fetch. 
         // Assuming classrooms are populated or we accept that we can't find anything yet.

         const { data: classroomData } = await supabase
            .from('classrooms')
            .select('id')
            .eq('name', className)
            .single();

         if (!classroomData) {
            // Classroom not found, so no grades exist yet in DB
            setGrades(initialGradesMap(studentList));
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
               .select('student_code, score')
               .eq('assessment_id', existingAssessment.id);

            const loadedGrades: Record<string, number> = {};
            studentList.forEach(s => loadedGrades[s.CodigoAluno] = 0); // Default

            if (gradeData) {
               gradeData.forEach((g: any) => {
                  if (g.student_code) {
                     loadedGrades[g.student_code] = g.score;
                  }
               });
            }
            setGrades(loadedGrades);
         } else {
            setCurrentAssessmentId(null);
            setGrades(initialGradesMap(studentList));
         }

      } catch (err) {
         console.error(err);
         setGrades(initialGradesMap(studentList));
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

   const getProficiency = (score: number) => {
      if (score >= 8) return 'ALTO';
      if (score >= 6) return 'MÉDIO';
      if (score >= 4) return 'BAIXO';
      return 'MUITO_BAIXO';
   };

   const handleSave = async () => {
      if (!selectedClass || students.length === 0) return;
      setIsSaving(true);

      try {
         // 1. Get/Create Classroom ID
         let classroomId = '';
         const { data: cls } = await supabase.from('classrooms').select('id').eq('name', selectedClass).single();
         if (cls) {
            classroomId = cls.id;
         } else {
            // Create if not exists (Lazy creation for migration continuity)
            const { data: newCls, error: clsErr } = await supabase
               .from('classrooms')
               .insert([{ name: selectedClass, year: new Date().getFullYear().toString(), shift: 'MATUTINO' }])
               .select('id')
               .single();
            if (clsErr) throw clsErr;
            classroomId = newCls.id;
         }

         // 2. Upsert Assessment
         let assId = currentAssessmentId;
         if (!assId) {
            // Double check existence
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
               type: 'AVALIACAO_BIMESTRAL', // Default type
               max_score: 10,
               teacher_id: user.id
            }]).select('id').single();

            if (assErr) throw assErr;
            assId = newAss.id;
            setCurrentAssessmentId(assId);
         }

         // 3. Upsert Grades
         // Prepare batch upsert
         const gradesToUpsert = students.map(s => ({
            assessment_id: assId,
            student_code: s.CodigoAluno,
            student_name: s.Nome,
            score: grades[s.CodigoAluno],
            proficiency_level: getProficiency(grades[s.CodigoAluno])
            // student_id is left null or we could try to map it if we had the map
         }));

         // We need to handle potential conflicts. 
         // There is no unique constraint on (assessment_id, student_code) in standard schema usually, unless we added it.
         // But we should delete old grades for this assessment and re-insert, or upsert if we have a PK.
         // `grades` usually has `id` PK.
         // Strategy: Delete all for this assessment and insert fresh. Simplest.

         const { error: delErr } = await supabase.from('grades').delete().eq('assessment_id', assId);
         if (delErr) throw delErr;

         const { error: insErr } = await supabase.from('grades').insert(gradesToUpsert);
         if (insErr) throw insErr;

         alert("Notas lançadas e sincronizadas com a coordenação!");

      } catch (err) {
         console.error("Error saving grades:", err);
         alert("Erro ao salvar notas. Tente novamente.");
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">

         <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma</label>
                  <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-amber-500/5 transition-all">
                     <option value="">Selecionar Turma...</option>
                     {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bimestre</label>
                  <select value={selectedBimestre} onChange={e => setSelectedBimestre(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none">
                     {BIMESTRES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Componente Curricular</label>
                  <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none">
                     {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
            </div>
            <button
               onClick={handleSave}
               disabled={isSaving || students.length === 0}
               className="w-full lg:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
               {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Award size={18} />}
               Finalizar Boletim
            </button>
         </div>

         {students.length > 0 ? (
            <div className="bg-white rounded-3xl md:rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
               {isLoading && (
                  <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
                     <Loader2 className="animate-spin text-indigo-600" size={32} />
                  </div>
               )}
               <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/50 gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                     <div className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm">
                        <FileEdit size={18} md:size={20} />
                     </div>
                     <h3 className="text-sm md:text-lg font-black text-gray-900 uppercase tracking-tight">Notas — <span className="text-indigo-600">{selectedSubject}</span></h3>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                     <ShieldCheck size={14} md:size={16} className="text-indigo-400" />
                     <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-nowrap">Base Auditada</span>
                  </div>
               </div>

               {/* Tabela para Desktop / Lista para Mobile */}
               <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                           <th className="px-8 py-4">Estudante</th>
                           <th className="px-8 py-4 text-center">Nota (0-10)</th>
                           <th className="px-8 py-4 text-center">Proficiência</th>
                           <th className="px-8 py-4 text-right">Ação</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {students.map((s) => {
                           const score = grades[s.CodigoAluno] || 0;
                           const prof = getProficiency(score);
                           return (
                              <tr key={s.CodigoAluno} className="hover:bg-gray-50 transition-all">
                                 <td className="px-8 py-6">
                                    <p className="text-sm font-black text-gray-900 uppercase leading-none">{s.Nome}</p>
                                    <p className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase tracking-tighter">Código: {s.CodigoAluno}</p>
                                 </td>
                                 <td className="px-8 py-6 text-center">
                                    <input
                                       type="number"
                                       step="0.1"
                                       min="0"
                                       max="10"
                                       value={grades[s.CodigoAluno] || ""}
                                       onChange={e => updateGrade(s.CodigoAluno, e.target.value)}
                                       className="w-20 p-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-center text-lg outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                       placeholder="0.0"
                                    />
                                 </td>
                                 <td className="px-8 py-6 text-center">
                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${prof === 'ALTO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                       prof === 'MÉDIO' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                          prof === 'BAIXO' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                             'bg-red-50 text-red-700 border-red-100'
                                       }`}>
                                       {prof.replace('_', ' ')}
                                    </span>
                                 </td>
                                 <td className="px-8 py-6 text-right">
                                    {score >= 6 ? <CheckCircle2 size={18} className="text-emerald-500 inline-block" /> : <AlertTriangle size={18} className="text-red-400 inline-block" />}
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>

               {/* Mobile List View */}
               <div className="md:hidden divide-y divide-gray-100">
                  {students.map((s) => {
                     const score = grades[s.CodigoAluno] || 0;
                     const prof = getProficiency(score);
                     return (
                        <div key={s.CodigoAluno} className="p-4 flex flex-col gap-4">
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="text-xs font-black text-gray-900 uppercase leading-tight">{s.Nome}</p>
                                 <p className="text-[8px] text-gray-400 font-bold mt-1 uppercase">Código: {s.CodigoAluno}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase border ${prof === 'ALTO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                 prof === 'MÉDIO' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    prof === 'BAIXO' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                       'bg-red-50 text-red-700 border-red-100'
                                 }`}>
                                 {prof.replace('_', ' ')}
                              </span>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="flex-1 relative">
                                 <label className="absolute -top-2 left-3 bg-white px-1 text-[7px] font-black text-gray-400 uppercase tracking-widest">Nota do Aluno</label>
                                 <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    value={grades[s.CodigoAluno] || ""}
                                    onChange={e => updateGrade(s.CodigoAluno, e.target.value)}
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-center text-xl outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                    placeholder="0.0"
                                 />
                              </div>
                              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                 {score >= 6 ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertTriangle size={18} className="text-red-400" />}
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         ) : (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
               <GraduationCap size={64} className="mx-auto mb-4 text-gray-100" />
               <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Selecione uma turma para carregar a lista de notas</p>
            </div>
         )}
      </div>
   );
};

export default TeacherGrades;
