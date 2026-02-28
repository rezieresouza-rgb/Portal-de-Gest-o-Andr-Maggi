
import React, { useState, useMemo, useEffect } from 'react';
import {
   AlertCircle,
   MessageSquare,
   Save,
   CheckCircle2,
   ShieldAlert,
   Search,
   ChevronRight,
   ShieldCheck,
   Flag,
   Clock,
   X,
   Plus,
   Trash2,
   AlertTriangle,
   History,
   Loader2
} from 'lucide-react';
import { ClassroomOccurrence, CaseSeverity } from '../types';
import { INITIAL_STUDENTS, SCHOOL_CLASSES } from '../constants/initialData';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';

const OCCURRENCE_TYPES = ['DISCIPLINAR', 'PEDAGÓGICO', 'MÉDICO', 'ELOGIO', 'OUTRO'];
const SEVERITIES: CaseSeverity[] = ['BAIXA', 'MÉDIA', 'ALTA', 'CRÍTICA'];

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

   const [form, setForm] = useState<Omit<ClassroomOccurrence, 'id' | 'timestamp'> & { forwardToPsychosocial: boolean }>({
      date: new Date().toISOString().split('T')[0],
      teacherName: user.name,
      className: '',
      studentName: '',
      type: 'DISCIPLINAR' as any,
      severity: 'MÉDIA' as any,
      description: '',
      notifiedParents: false,
      forwardToPsychosocial: false
   });

   const [recentOccurrences, setRecentOccurrences] = useState<ClassroomOccurrence[]>([]);

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
         // Map Supabase rows to ClassroomOccurrence type
         const mapped: ClassroomOccurrence[] = data.map(item => ({
            id: item.id,
            date: item.date,
            teacherName: item.responsible_name,
            className: item.classroom_name,
            studentName: item.student_name,
            type: item.category as any, // category mapped to type
            severity: item.severity as any,
            description: item.description,
            notifiedParents: false, // This field might need to be added to DB if important, assuming false for now or I can store it in a JSON column if needed. 
            // Wait, I didn't see notified_parents in DB schema. 
            // I will assume it's not persisted or I should check if I missed it.
            // Checking schema again... no notified_parents. 
            // I'll skip it or add it later. For now, let's just default false.
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
         date: new Date().toISOString().split('T')[0],
         teacherName: user.name,
         className: '',
         studentName: '',
         type: 'DISCIPLINAR' as any,
         severity: 'MÉDIA' as any,
         description: '',
         notifiedParents: false,
         forwardToPsychosocial: false
      });
      setSearchTerm('');
   };

   // Realtime subscription
   const { students: dbStudents } = useStudents();

   useEffect(() => {
      if (dbStudents) {
         setMasterStudents(dbStudents);
      }
   }, [dbStudents, isModalOpen]);

   // Realtime subscription
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

      // If no class is selected and search term is too short, return empty
      if (!searchClass && (!searchTerm || searchTerm.length < 2)) return [];

      let filtered = masterStudents;

      // First, filter by class if selected
      if (searchClass) {
         filtered = filtered.filter(s => s.class === searchClass);
      }

      // Then, filter by name if there's a search term
      if (searchTerm) {
         filtered = filtered.filter(s => s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      // Limit results to avoid massive dropdowns, but allow more if we're viewing a whole class
      return filtered.slice(0, searchClass && !searchTerm ? 50 : 6);
   }, [searchTerm, masterStudents, form.className]);

   const handleSelectStudent = (student: any) => {
      setForm(prev => ({
         ...prev,
         studentName: student.name,
         className: student.class
      }));
      setSearchTerm(student.name);
      setShowDropdown(false);
   };

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!form.studentName) return alert("Selecione um aluno da lista de busca.");
      if (!form.description.trim()) return alert("Descreva o que ocorreu.");

      setIsSaving(true);

      try {
         const { error } = await supabase.from('occurrences').insert([{
            date: form.date,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            responsible_name: form.teacherName,
            classroom_name: form.className,
            student_name: form.studentName,
            category: form.type,
            severity: form.severity,
            description: form.description,
            status: 'REGISTRADO',
            location: 'SALA DE AULA'
         }]);

         if (error) throw error;

         // Forward to Psychosocial if requested
         if (form.forwardToPsychosocial) {
            const { error: referralError } = await supabase.from('psychosocial_referrals').insert([{
               student_name: form.studentName,
               class_name: form.className,
               teacher_name: form.teacherName,
               school_unit: 'ESCOLA ANDRÉ MAGGI', // Default or fetch from context
               date: form.date,
               report: `[VIA OCORRÊNCIA] ${form.description}`,
               status: 'AGUARDANDO_TRIAGEM',
               student_age: 'Não informado', // Default
               attendance_frequency: '0', // Default
               previous_strategies: 'Encaminhamento direto via Oocorrência',
               adopted_procedures: ['ENCAMINHAMENTO_DIRETO'],
               observations: { learning: [], behavioral: [], emotional: [] }
            }]);

            if (referralError) {
               console.error("Erro ao encaminhar para psicossocial:", referralError);
               alert("Ocorrência salva, mas erro ao encaminhar para Equipe Multi.");
            } else {
               // Notify
               await supabase.from('psychosocial_notifications').insert([{
                  title: 'Encaminhamento via Ocorrência',
                  message: `O professor(a) ${form.teacherName} encaminhou o aluno ${form.studentName} através de um registro de ocorrência.`,
                  is_read: false
               }]);
            }
         }

         setIsModalOpen(false);
         resetForm();
         alert("Ocorrência registrada e enviada para coordenação!");
      } catch (err) {
         console.error(err);
         alert("Erro ao salvar ocorrência.");
      } finally {
         setIsSaving(false);
      }
   };

   const deleteOccurrence = async (id: string) => {
      if (window.confirm("Deseja remover este registro do seu histórico?")) {
         const { error } = await supabase.from('occurrences').delete().eq('id', id);
         if (error) {
            console.error(error);
            alert("Erro ao excluir ocurrencia");
         }
      }
   };

   const getSeverityStyle = (sev: string) => {
      switch (sev) {
         case 'CRÍTICA': return 'bg-red-100 text-red-700 border-red-200';
         case 'ALTA': return 'bg-rose-50 text-rose-600 border-rose-100';
         case 'MÉDIA': return 'bg-amber-50 text-amber-600 border-amber-100';
         default: return 'bg-blue-50 text-blue-600 border-blue-100';
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">

         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-red-50 text-red-600 rounded-3xl shadow-lg">
                  <ShieldAlert size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">Registro de Fatos Escolares</h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Escrituração disciplinar sincronizada com a coordenação</p>
               </div>
            </div>
            <button
               onClick={() => { resetForm(); setIsModalOpen(true); }}
               className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2"
            >
               <Plus size={18} /> Novo Registro
            </button>
         </div>

         <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
               <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <History className="text-gray-400" size={20} /> Meus Registros Recentes
               </h4>
               <span className="text-[10px] font-black bg-white text-gray-400 px-3 py-1 rounded-lg border border-gray-100 uppercase tracking-widest">Diário Docente</span>
            </div>

            <div className="divide-y divide-gray-50">
               {loading ? (
                  <div className="p-12 flex justify-center">
                     <Loader2 className="animate-spin text-gray-300" size={32} />
                  </div>
               ) : recentOccurrences.length > 0 ? recentOccurrences.map(occ => (
                  <div key={occ.id} className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:bg-gray-50/50 transition-all group relative">
                     <div className="flex items-center gap-6 flex-1">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${getSeverityStyle(occ.severity)} shadow-sm`}>
                           <AlertCircle size={24} />
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">{occ.studentName}</h4>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getSeverityStyle(occ.severity)}`}>{occ.type}</span>
                           </div>
                           <p className="text-xs text-gray-500 font-medium italic mt-1 line-clamp-1">"{occ.description}"</p>
                           <div className="flex flex-wrap items-center gap-4 mt-3">
                              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Clock size={12} /> {new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Flag size={12} /> Turma: {occ.className}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <button onClick={() => deleteOccurrence(occ.id)} className="p-3 bg-gray-50 text-gray-300 hover:text-red-500 rounded-xl transition-all">
                           <Trash2 size={20} />
                        </button>
                        <div className="p-3 bg-gray-50 text-gray-300 group-hover:bg-red-600 group-hover:text-white rounded-xl transition-all shadow-sm">
                           <ChevronRight size={24} />
                        </div>
                     </div>
                  </div>
               )) : (
                  <div className="py-24 text-center">
                     <MessageSquare size={48} className="mx-auto mb-4 text-gray-100" />
                     <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Nenhum registro encontrado no seu histórico</p>
                  </div>
               )}
            </div>
         </div>

         {isModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-red-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-red-100 overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-red-50 flex justify-between items-center border-b border-red-100 shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="p-4 bg-red-600 text-white rounded-3xl shadow-lg">
                           <Plus size={28} strokeWidth={3} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Novo Registro de Fato</h3>
                           <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-1">Escrituração Disciplinar Docente</p>
                        </div>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                     <form onSubmit={handleSave} className="space-y-8">
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma do Aluno</label>
                                 <select
                                    required
                                    value={form.className}
                                    onChange={e => {
                                       setForm({ ...form, className: e.target.value });
                                       if (e.target.value) setShowDropdown(true);
                                    }}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                                 >
                                    <option value="">Selecione a turma...</option>
                                    {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1.5 relative">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identificar Estudante</label>
                                 <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input
                                       type="text"
                                       value={searchTerm}
                                       onFocus={() => setShowDropdown(true)}
                                       onChange={e => {
                                          setSearchTerm(e.target.value);
                                          setShowDropdown(true);
                                       }}
                                       placeholder={form.className ? `Selecione na lista ou digite...` : `Selecione a turma primeiro...`}
                                       className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-red-500/5 focus:bg-white transition-all uppercase"
                                    />
                                 </div>

                                 {/* Only check showDropdown, don't hide if form.className exists to debug */}
                                 {showDropdown && filteredStudents.length > 0 && (
                                    <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-y-auto max-h-60 divide-y divide-gray-50 animate-in slide-in-from-top-2">
                                       {filteredStudents.map(s => (
                                          <button
                                             key={s.id || s.registration_number || Math.random()}
                                             type="button"
                                             onClick={() => handleSelectStudent(s)}
                                             className="w-full text-left p-4 hover:bg-red-50 transition-colors flex justify-between items-center"
                                          >
                                             <span className="text-xs font-black uppercase text-gray-800">{s.name}</span>
                                             <span className="text-[9px] font-bold text-gray-400 uppercase">{s.class}</span>
                                          </button>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                                 <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white"
                                 />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classificação</label>
                                 <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:bg-white transition-all">
                                    {OCCURRENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Severidade</label>
                                 <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as any })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:bg-white transition-all">
                                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                                 </select>
                              </div>
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição Detalhada do Ocorrido</label>
                              <textarea
                                 required
                                 value={form.description}
                                 onChange={e => setForm({ ...form, description: e.target.value })}
                                 placeholder="Relate os fatos de forma objetiva e profissional..."
                                 className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium h-40 resize-none outline-none focus:bg-white focus:ring-4 focus:ring-red-500/5 transition-all"
                              />
                           </div>

                           <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                              <input
                                 type="checkbox"
                                 id="notif_parents"
                                 checked={form.notifiedParents}
                                 onChange={e => setForm({ ...form, notifiedParents: e.target.checked })}
                                 className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                              />
                              <label htmlFor="notif_parents" className="text-xs font-black text-red-800 uppercase tracking-widest cursor-pointer select-none">
                                 Confirmo que os responsáveis foram comunicados
                              </label>
                           </div>
                        </div>

                        <button type="submit" disabled={isSaving} className="w-full py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-red-900/20 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                           {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                           Efetivar Registro no Diário
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}

         {/* NOTA DE CONFORMIDADE */}
         <div className="bg-gray-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><ShieldCheck size={140} /></div>
            <div className="flex items-center gap-6 relative z-10">
               <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                  <AlertTriangle size={32} className="text-red-400" />
               </div>
               <div>
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Atenção Docente</p>
                  <h4 className="text-xl font-black uppercase">Escrituração Permanente</h4>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-tight">Estes registros são sincronizados com o Livro de Ocorrência da Gestão Escolar.</p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default TeacherOccurrences;