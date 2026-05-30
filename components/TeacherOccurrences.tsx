import React, { useState, useMemo, useEffect } from 'react';
import {
   AlertCircle,
   Save,
   Search,
   History,
   Loader2,
   Plus,
   FileText,
   Trash2,
   X,
   ShieldCheck
} from 'lucide-react';
import { ClassroomOccurrence } from '../types';
import { SCHOOL_CLASSES, INITIAL_STUDENTS } from '../constants/initialData';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import { User as UserType } from '../types';

interface TeacherOccurrencesProps {
   user: UserType;
}

const TeacherOccurrences: React.FC<TeacherOccurrencesProps> = ({ user }) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');
   const [showDropdown, setShowDropdown] = useState(false);
   const [masterStudents, setMasterStudents] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [selectedStudents, setSelectedStudents] = useState<{ name: string; class: string }[]>([]);

   const [form, setForm] = useState({
      date: new Date().toLocaleDateString('sv-SE'),
      teacherName: user.name,
      className: '',
      discipline: '',
      description: '',
      forwardToPsychosocial: false
   });

   const [recentOccurrences, setRecentOccurrences] = useState<ClassroomOccurrence[]>([]);
   const [filterClass, setFilterClass] = useState('');
   const [filterStudent, setFilterStudent] = useState('');

   const filteredOccurrences = useMemo(() => {
      return recentOccurrences.filter(occ => {
         const matchesClass = !filterClass || occ.className === filterClass;
         const matchesStudent = !filterStudent || occ.studentName.toLowerCase().includes(filterStudent.toLowerCase());
         return matchesClass && matchesStudent;
      });
   }, [recentOccurrences, filterClass, filterStudent]);

   const fetchOccurrences = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('occurrences')
         .select('*')
         .eq('responsible_name', user.name)
         .order('date', { ascending: false });

      if (error) {
         console.error('Error fetching occurrences:', error);
      } else {
         const mapped: ClassroomOccurrence[] = data.map(item => ({
            id: item.id,
            date: item.date,
            teacherName: item.responsible_name,
            className: item.classroom_name,
            studentName: item.student_name,
            type: item.category as any,
            severity: item.severity as any,
            description: item.description,
            notifiedParents: false,
            timestamp: new Date(item.created_at || item.date).getTime()
         }));
         setRecentOccurrences(mapped);
      }
      setLoading(false);
   };

   useEffect(() => {
      fetchOccurrences();
   }, []);

   const resetForm = () => {
      setForm({
         date: new Date().toLocaleDateString('sv-SE'),
         teacherName: user.name,
         className: '',
         discipline: '',
         description: '',
         forwardToPsychosocial: false
      });
      setSearchTerm('');
      setSelectedStudents([]);
   };

   const { students: dbStudents } = useStudents();

   useEffect(() => {
      if (dbStudents) {
         setMasterStudents(dbStudents);
      }
   }, [dbStudents]);

   useEffect(() => {
      const subscription = supabase
         .channel('occurrences_changes')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, () => {
            fetchOccurrences();
         })
         .subscribe();

      return () => {
         subscription.unsubscribe();
      };
   }, []);

   const filteredStudents = useMemo(() => {
      const searchClass = form.className;
      if (!searchClass && (!searchTerm || searchTerm.length < 2)) return [];
      let filtered = masterStudents;
      if (searchClass) {
         filtered = filtered.filter(s => s.class === searchClass);
      }
      if (searchTerm) {
         filtered = filtered.filter(s => s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      return filtered
         .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
         .slice(0, searchClass && !searchTerm ? 50 : 6);
   }, [searchTerm, masterStudents, form.className]);

   const handleSelectStudent = (student: any) => {
      if (selectedStudents.some(s => s.name === student.name)) {
         setShowDropdown(false);
         setSearchTerm('');
         return;
      }
      setSelectedStudents(prev => [...prev, { name: student.name, class: student.class }]);
      if (selectedStudents.length === 0) {
         setForm(prev => ({ ...prev, className: student.class }));
      }
      setSearchTerm('');
      setShowDropdown(false);
   };

   const handleRemoveStudent = (name: string) => {
      setSelectedStudents(prev => prev.filter(s => s.name !== name));
   };

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();

      if (selectedStudents.length === 0) return alert("Selecione ao menos um aluno.");
      if (!form.description.trim()) return alert("Descreva o que ocorreu no campo de Achado.");

      setIsSaving(true);
      const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      try {
         for (const student of selectedStudents) {
            const payload = {
               date: form.date,
               time,
               responsible_name: form.teacherName,
               classroom_name: student.class,
               student_name: student.name,
               category: 'FATO OBSERVADO',
               severity: 'MÉDIA',
               description: form.description,
               status: 'REGISTRADO',
               location: 'SALA DE AULA'
            };
            const { data, error } = await supabase.from('occurrences').insert([payload]).select();
            if (error) throw error;

            // Inject into Cívico-Militar documents
            const savedDocs = localStorage.getItem('civico_militar_documentos_v1');
            let docsList = [];
            if (savedDocs) {
               try {
                  docsList = JSON.parse(savedDocs);
               } catch (e) {}
            }
            docsList.unshift({
               id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
               studentId: 'AUTO_GEK',
               studentName: student.name,
               className: student.class,
               shiftName: 'MATUTINO/VESPERTINO',
               template: 'fato_observado',
               templateLabel: 'Relatório de Fato Observado',
               date: form.date,
               fields: {
                  date: form.date,
                  recebidoDate: '',
                  teacher: form.teacherName,
                  monitor: '',
                  series: student.class,
                  discipline: form.discipline || 'MÚLTIPLAS',
                  achado: form.description,
                  city: 'Colíder - MT'
               },
               timestamp: Date.now()
            });
            localStorage.setItem('civico_militar_documentos_v1', JSON.stringify(docsList));

            // Forward to Psychosocial if requested
            if (form.forwardToPsychosocial) {
               const { error: referralError } = await supabase.from('psychosocial_referrals').insert([{
                  student_name: student.name,
                  class_name: student.class,
                  teacher_name: form.teacherName,
                  school_unit: 'ESCOLA ANDRÉ MAGGI',
                  date: form.date,
                  report: `[VIA FATO OBSERVADO] ${form.description}`,
                  status: 'AGUARDANDO_TRIAGEM',
                  student_age: 'Não informado',
                  attendance_frequency: '0',
                  previous_strategies: 'Encaminhamento via Fato Observado',
                  adopted_procedures: ['ENCAMINHAMENTO_DIRETO'],
                  observations: { learning: [], behavioral: [], emotional: [] }
               }]);

               if (!referralError) {
                  await supabase.from('psychosocial_notifications').insert([{
                     title: 'Encaminhamento Psicossocial',
                     message: `O professor(a) ${form.teacherName} encaminhou o aluno ${student.name} junto ao Fato Observado.`,
                     is_read: false
                  }]);
               }
            }
         }

         setIsModalOpen(false);
         resetForm();
         const count = selectedStudents.length;
         alert(count > 1 ? `${count} Relatórios enviados com sucesso!` : 'Relatório de Fato Observado enviado com sucesso para a Coordenação Cívico-Militar!');
      } catch (err) {
         console.error(err);
         alert('Erro ao enviar relatório.');
      } finally {
         setIsSaving(false);
      }
   };

   const deleteOccurrence = async (id: string) => {
      if (window.confirm("Deseja remover este registro do seu histórico?")) {
         const { error } = await supabase.from('occurrences').delete().eq('id', id);
         if (error) {
            console.error(error);
            alert("Erro ao excluir registro.");
         }
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20 no-print">
         
         {/* CABEÇALHO */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <FileText size={40} strokeWidth={2.5} />
               </div>
               <div>
                  <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">Fato Observado</h1>
                  <div className="flex items-center gap-3">
                     <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">Área do Professor</span>
                     <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                     <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none">Relatos e Encaminhamentos</span>
                  </div>
               </div>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="px-8 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center gap-4 group">
               <Plus size={20} strokeWidth={3} className="text-blue-500 group-hover:rotate-90 transition-transform duration-500" />
               Novo Relatório
            </button>
         </div>

         {/* HISTÓRICO */}
         <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-gray-50 bg-gray-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
               <div className="flex items-center gap-5">
                  <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100">
                     <History size={28} className="text-gray-400" />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Meus Relatórios Enviados</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sincronizado com a gestão cívico-militar</p>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row items-center gap-3">
                  <div className="relative w-full md:w-80">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                     <input
                        type="text"
                        placeholder="BUSCAR PELO NOME..."
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-[10px] uppercase outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                        value={filterStudent}
                        onChange={(e) => setFilterStudent(e.target.value)}
                     />
                  </div>
                  <select
                     value={filterClass}
                     onChange={(e) => setFilterClass(e.target.value)}
                     className="w-full md:w-48 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer"
                  >
                     <option value="">TODAS AS TURMAS</option>
                     {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
            </div>

            <div className="divide-y divide-gray-50">
               {loading ? (
                  <div className="p-12 flex justify-center">
                     <Loader2 className="animate-spin text-gray-300" size={32} />
                  </div>
               ) : filteredOccurrences.length > 0 ? filteredOccurrences.map(occ => (
                  <div key={occ.id} className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:bg-gray-50/50 transition-all group relative">
                     <div className="flex items-center gap-6 flex-1">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 bg-blue-50 text-blue-600 border-blue-100 shadow-sm">
                           <FileText size={24} />
                        </div>
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-black text-gray-900 uppercase tracking-tight text-lg">{occ.studentName}</h4>
                           </div>
                           <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{occ.className}</span>
                              <span className="text-blue-500">{new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                              {occ.category && <span>• {occ.category}</span>}
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <button 
                           onClick={() => deleteOccurrence(occ.id)}
                           className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
               )) : (
                  <div className="p-20 text-center flex flex-col items-center justify-center">
                     <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <FileText size={40} className="text-gray-300" />
                     </div>
                     <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhum relatório encontrado</p>
                  </div>
               )}
            </div>
         </div>

         {/* MODAL DE NOVO RELATÓRIO */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
               
               <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                  
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-[3rem]">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                           <FileText size={24} />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Relatório de Fato Observado</h2>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Preenchimento Oficial</p>
                        </div>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 hover:bg-gray-100 transition-colors">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-8 overflow-y-auto custom-scrollbar">
                     <form id="fatoForm" onSubmit={handleSave} className="space-y-6">
                        
                        <div className="space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative z-20">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma do Aluno</label>
                                 <select
                                    value={form.className}
                                    onChange={e => {
                                       setForm({ ...form, className: e.target.value });
                                       setSearchTerm('');
                                    }}
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer"
                                 >
                                    <option value="">Selecione a Turma</option>
                                    {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data do Fato</label>
                                 <input
                                    type="date"
                                    required
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                                 />
                              </div>
                           </div>

                           <div className="space-y-1.5 relative">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aluno(s) Envolvido(s)</label>
                              
                              {selectedStudents.length > 0 && (
                                 <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedStudents.map(student => (
                                       <span key={student.name} className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-xs font-bold uppercase flex items-center gap-2">
                                          {student.name}
                                          <button type="button" onClick={() => handleRemoveStudent(student.name)} className="hover:bg-blue-200 p-0.5 rounded-full transition-colors"><X size={12} /></button>
                                       </span>
                                    ))}
                                 </div>
                              )}

                              <div className="relative">
                                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                 <input
                                    type="text"
                                    placeholder="Buscar e adicionar aluno..."
                                    value={searchTerm}
                                    onFocus={() => setShowDropdown(true)}
                                    onChange={(e) => {
                                       setSearchTerm(e.target.value);
                                       setShowDropdown(true);
                                    }}
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                                 />
                                 
                                 {showDropdown && (searchTerm.length >= 2 || form.className) && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                                       {filteredStudents.length > 0 ? (
                                          filteredStudents.map(student => (
                                             <button
                                                key={student.CodigoAluno}
                                                type="button"
                                                onClick={() => handleSelectStudent(student)}
                                                className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center"
                                             >
                                                <span className="font-bold text-gray-700 uppercase text-xs">{student.name}</span>
                                                <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase tracking-widest">{student.class}</span>
                                             </button>
                                          ))
                                       ) : (
                                          <div className="px-6 py-8 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                                             Nenhum aluno encontrado
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                           </div>
                           
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina / Matéria</label>
                              <input
                                 type="text"
                                 required
                                 value={form.discipline}
                                 onChange={e => setForm({ ...form, discipline: e.target.value })}
                                 placeholder="Ex: Matemática, História..."
                                 className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all uppercase"
                              />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Achado (Relato Descritivo)</label>
                              <textarea
                                 required
                                 value={form.description}
                                 onChange={e => setForm({ ...form, description: e.target.value })}
                                 placeholder="Relate os fatos de forma objetiva e profissional..."
                                 className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium h-40 resize-none outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                              />
                           </div>

                           <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <input
                                 type="checkbox"
                                 id="forward_psycho"
                                 checked={form.forwardToPsychosocial}
                                 onChange={e => setForm({ ...form, forwardToPsychosocial: e.target.checked })}
                                 className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor="forward_psycho" className="text-xs font-black text-gray-600 uppercase tracking-widest cursor-pointer select-none">
                                 Também encaminhar cópia para o Setor Psicossocial
                              </label>
                           </div>
                        </div>

                     </form>
                  </div>

                  <div className="p-8 border-t border-gray-100 bg-gray-50/50 rounded-b-[3rem]">
                     <button type="submit" form="fatoForm" disabled={isSaving} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-blue-900/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                        Gerar e Enviar Relatório
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default TeacherOccurrences;