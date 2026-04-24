
import React, { useState, useMemo, useEffect } from 'react';
import {
   AlertCircle,
   MessageSquare as MessageSquareIcon,
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
   Loader2,
   Edit3,
   Printer,
   ShieldCheck as ShieldCheckIcon
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
   const [editingOccurrenceId, setEditingOccurrenceId] = useState<string | null>(null);
   const [viewingOccurrence, setViewingOccurrence] = useState<ClassroomOccurrence | null>(null);
   const [printingOccurrence, setPrintingOccurrence] = useState<ClassroomOccurrence | null>(null);
   // Multi-student selection
   const [selectedStudents, setSelectedStudents] = useState<{ name: string; class: string }[]>([]);

   const [form, setForm] = useState<Omit<ClassroomOccurrence, 'id' | 'timestamp'> & { forwardToPsychosocial: boolean }>({
      date: new Date().toLocaleDateString('sv-SE'),
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
   const [filterClass, setFilterClass] = useState('');
   const [filterStudent, setFilterStudent] = useState('');
   const [filterType, setFilterType] = useState('');

   const filteredOccurrences = useMemo(() => {
      return recentOccurrences.filter(occ => {
         const matchesClass = !filterClass || occ.className === filterClass;
         const matchesStudent = !filterStudent || occ.studentName.toLowerCase().includes(filterStudent.toLowerCase());
         const matchesType = !filterType || occ.type === filterType;
         return matchesClass && matchesStudent && matchesType;
      });
   }, [recentOccurrences, filterClass, filterStudent, filterType]);

   const fetchOccurrences = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('occurrences')
         .select('*')
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
         studentName: '',
         type: 'DISCIPLINAR' as any,
         severity: 'MÉDIA' as any,
         description: '',
         notifiedParents: false,
         forwardToPsychosocial: false
      });
      setSearchTerm('');
      setSelectedStudents([]);
      setEditingOccurrenceId(null);
   };

   const handleEdit = (occ: ClassroomOccurrence) => {
      setForm({
         date: occ.date,
         teacherName: occ.teacherName,
         className: occ.className,
         studentName: occ.studentName,
         type: occ.type,
         severity: occ.severity,
         description: occ.description,
         notifiedParents: occ.notifiedParents || false,
         forwardToPsychosocial: false // Do not resend on edit
      });
      setSelectedStudents([{ name: occ.studentName, class: occ.className }]);
      setSearchTerm('');
      setEditingOccurrenceId(occ.id);
      setIsModalOpen(true);
   };

   const handlePrint = (occ: ClassroomOccurrence) => {
      setPrintingOccurrence(occ);
      setTimeout(() => {
         window.print();
      }, 500);
   };

   const handleViewDetails = (occ: ClassroomOccurrence) => {
      setViewingOccurrence(occ);
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
      // Avoid duplicates
      if (selectedStudents.some(s => s.name === student.name)) {
         setShowDropdown(false);
         setSearchTerm('');
         return;
      }
      setSelectedStudents(prev => [...prev, { name: student.name, class: student.class }]);
      // Set className from first selected student
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
      if (!form.description.trim()) return alert("Descreva o que ocorreu.");

      setIsSaving(true);
      const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      try {
         if (editingOccurrenceId) {
            // Editing: update single record
            const student = selectedStudents[0];
            const payload = {
               date: form.date,
               time,
               responsible_name: form.teacherName,
               classroom_name: student.class,
               student_name: student.name,
               category: form.type,
               severity: form.severity,
               description: form.description
            };
            const { error } = await supabase.from('occurrences').update(payload).eq('id', editingOccurrenceId);
            if (error) throw error;
         } else {
            // Creating: one occurrence per selected student
            for (const student of selectedStudents) {
               const payload = {
                  date: form.date,
                  time,
                  responsible_name: form.teacherName,
                  classroom_name: student.class,
                  student_name: student.name,
                  category: form.type,
                  severity: form.severity,
                  description: form.description,
                  status: 'REGISTRADO',
                  location: 'SALA DE AULA'
               };
               const { error } = await supabase.from('occurrences').insert([payload]);
               if (error) throw error;

               // Forward to Psychosocial if requested
               if (form.forwardToPsychosocial) {
                  const { error: referralError } = await supabase.from('psychosocial_referrals').insert([{
                     student_name: student.name,
                     class_name: student.class,
                     teacher_name: form.teacherName,
                     school_unit: 'ESCOLA ANDRÉ MAGGI',
                     date: form.date,
                     report: `[VIA OCORRÊNCIA] ${form.description}`,
                     status: 'AGUARDANDO_TRIAGEM',
                     student_age: 'Não informado',
                     attendance_frequency: '0',
                     previous_strategies: 'Encaminhamento direto via Ocorrência',
                     adopted_procedures: ['ENCAMINHAMENTO_DIRETO'],
                     observations: { learning: [], behavioral: [], emotional: [] }
                  }]);

                  if (!referralError) {
                     await supabase.from('psychosocial_notifications').insert([{
                        title: 'Encaminhamento via Ocorrência',
                        message: `O professor(a) ${form.teacherName} encaminhou o aluno ${student.name} através de um registro de ocorrência.`,
                        is_read: false
                     }]);
                  } else {
                     console.error('Erro ao encaminhar para psicossocial:', referralError);
                     alert(`Ocorrência salva, mas o encaminhamento falhou: ${referralError.message}. Verifique o Supabase.`);
                  }
               }
            }
         }

         setIsModalOpen(false);
         resetForm();
         const count = selectedStudents.length;
         alert(editingOccurrenceId
            ? 'Ocorrência atualizada com sucesso!'
            : count > 1
               ? `${count} ocorrências registradas com sucesso!`
               : 'Ocorrência registrada e enviada para coordenação!');
      } catch (err) {
         console.error(err);
         alert('Erro ao salvar ocorrência.');
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
      <>
         {/* CONTEÚDO PRINCIPAL (ANIMADO) */}
         <div className="space-y-8 animate-in fade-in duration-500 pb-20 no-print">
            
            {/* CABEÇALHO E BOTÃO DE AÇÃO */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-red-200 rotate-3 hover:rotate-0 transition-transform duration-500">
                     <AlertCircle size={40} strokeWidth={2.5} />
                  </div>
                  <div>
                     <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">Lançar Ocorrência</h1>
                     <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-100">Área do Professor</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none">Registro Pedagógico e Disciplinar</span>
                     </div>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(true)} className="px-8 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center gap-4 group">
                  <Plus size={20} strokeWidth={3} className="text-red-500 group-hover:rotate-90 transition-transform duration-500" />
                  Novo Registro de Fato
               </button>
            </div>

            {/* LISTA DE HISTÓRICO GLOBAL */}
            <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-10 border-b border-gray-50 bg-gray-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex items-center gap-5">
                     <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <History size={28} className="text-gray-400" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Histórico Global</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sincronizado com a coordenação</p>
                     </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-3">
                     <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input
                           type="text"
                           placeholder="BUSCAR PELO NOME..."
                           className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-[10px] uppercase outline-none focus:ring-4 focus:ring-red-500/5 transition-all"
                           value={filterStudent}
                           onChange={(e) => setFilterStudent(e.target.value)}
                        />
                     </div>
                     <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="w-full md:w-48 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:ring-4 focus:ring-red-500/5 transition-all appearance-none cursor-pointer"
                     >
                        <option value="">TODAS AS TURMAS</option>
                        {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                     <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full md:w-40 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:ring-4 focus:ring-red-500/5 transition-all appearance-none cursor-pointer"
                     >
                        <option value="">TIPO</option>
                        {OCCURRENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
                                 <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-gray-100">
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">Relator: {occ.teacherName}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                           <button onClick={() => handlePrint(occ)} className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Imprimir Ata Oficial">
                              <Printer size={20} />
                           </button>
                           {occ.teacherName === user.name && (
                              <>
                                 <button onClick={() => handleEdit(occ)} className="p-3 bg-gray-50 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all" title="Editar Registro">
                                    <Edit3 size={20} />
                                 </button>
                                 <button onClick={() => deleteOccurrence(occ.id)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Excluir Registro">
                                    <Trash2 size={20} />
                                 </button>
                              </>
                           )}
                           <button 
                              onClick={(e) => { e.stopPropagation(); handleViewDetails(occ); }}
                              className="p-3 bg-gray-50 text-gray-300 hover:scale-110 active:scale-95 group-hover:bg-red-600 group-hover:text-white rounded-xl transition-all shadow-sm hidden md:block relative z-10"
                              title="Ver Detalhes do Registro"
                           >
                              <ChevronRight size={24} />
                           </button>
                        </div>
                     </div>
                  )) : (
                     <div className="py-24 text-center">
                        <MessageSquareIcon size={48} className="mx-auto mb-4 text-gray-100" />
                        <p className="text-gray-300 font-black uppercase text-xs tracking-widest">
                           { (filterClass || filterStudent || filterType) 
                              ? 'Nenhum registro corresponde aos filtros selecionados' 
                              : 'Nenhum registro encontrado no histórico global' }
                        </p>
                     </div>
                  )}
               </div>
            </div>

            {/* NOTA DE CONFORMIDADE */}
            <div className="bg-gray-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><ShieldCheckIcon size={140} /></div>
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

         {/* MODAIS (FORA DO CONTAINER ANIMADO PARA GARANTIR POSICIONAMENTO FIXED) */}

         {/* MODAL DE NOVO REGISTRO / EDIÇÃO */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-red-950/40 backdrop-blur-sm animate-in fade-in duration-300 no-print">
               <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-red-100 overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-red-50 flex justify-between items-center border-b border-red-100 shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="p-4 bg-red-600 text-white rounded-3xl shadow-lg">
                           <Plus size={28} strokeWidth={3} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{editingOccurrenceId ? 'Editar Fato Pedagógico' : 'Novo Registro de Fato'}</h3>
                           <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-1">Escrituração Disciplinar Docente</p>
                        </div>
                     </div>
                     <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                     <form onSubmit={handleSave} className="space-y-8">
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma</label>
                                 <select
                                    value={form.className}
                                    onChange={e => {
                                       setForm({ ...form, className: e.target.value });
                                       if (!editingOccurrenceId) setSelectedStudents([]);
                                       if (e.target.value) setShowDropdown(true);
                                    }}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                                 >
                                    <option value="">Selecione a turma...</option>
                                    {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1.5 relative">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Estudante <span className="text-red-500">*</span>
                                 </label>
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
                                       placeholder={form.className ? 'Buscar aluno...' : 'Selecione a turma primeiro...'}
                                       className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-red-500/5 focus:bg-white transition-all uppercase"
                                    />
                                 </div>

                                 {showDropdown && filteredStudents.length > 0 && (
                                    <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-y-auto max-h-60 divide-y divide-gray-50 animate-in slide-in-from-top-2">
                                       {filteredStudents.map(s => (
                                          <button
                                             key={s.id || s.registration_number || s.name}
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
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Relato Descritivo</label>
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
                                 id="forward_psycho"
                                 checked={form.forwardToPsychosocial}
                                 onChange={e => setForm({ ...form, forwardToPsychosocial: e.target.checked })}
                                 className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                              />
                              <label htmlFor="forward_psycho" className="text-xs font-black text-red-800 uppercase tracking-widest cursor-pointer select-none">
                                 Encaminhar para o Setor Psicossocial / Mediação
                              </label>
                           </div>
                        </div>

                        <button type="submit" disabled={isSaving} className="w-full py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-red-900/20 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                           {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                           {editingOccurrenceId ? 'Salvar Alterações' : 'Efetivar Registro no Diário'}
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL DE VISUALIZAÇÃO DETALHADA */}
         {viewingOccurrence && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300 no-print pointer-events-auto">
               <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                  <div className="p-8 bg-gray-50 flex justify-between items-center border-b border-gray-100 shrink-0">
                     <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-3xl shadow-lg border-2 ${getSeverityStyle(viewingOccurrence.severity)}`}>
                           <ShieldAlert size={28} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter line-clamp-1">{viewingOccurrence.studentName}</h3>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Detalhes do Registro Escolar</p>
                        </div>
                     </div>
                     <button onClick={() => setViewingOccurrence(null)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Data</p>
                           <p className="text-xs font-black text-gray-900">{new Date(viewingOccurrence.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Turma</p>
                           <p className="text-xs font-black text-gray-900">{viewingOccurrence.className}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Natureza</p>
                           <p className="text-xs font-black text-gray-900">{viewingOccurrence.type}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Severidade</p>
                           <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border w-fit ${getSeverityStyle(viewingOccurrence.severity)}`}>
                              {viewingOccurrence.severity}
                           </p>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                           <MessageSquareIcon size={14} className="text-red-600" /> Relato Narrativo do Professor
                        </h4>
                        <div className="p-6 bg-red-50/30 border border-red-100 rounded-[2rem] text-sm font-medium leading-relaxed text-gray-800 italic">
                           "{viewingOccurrence.description}"
                        </div>
                     </div>

                     <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-black text-gray-500 text-xs">
                           {viewingOccurrence.teacherName.charAt(0)}
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Relator(a)</p>
                           <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">{viewingOccurrence.teacherName}</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                     <button 
                        onClick={() => { setViewingOccurrence(null); handlePrint(viewingOccurrence); }}
                        className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                     >
                        <Printer size={16} /> Imprimir PDF Oficial
                     </button>
                     {viewingOccurrence.teacherName === user.name && (
                        <button 
                           onClick={() => { handleEdit(viewingOccurrence); setViewingOccurrence(null); }}
                           className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                        >
                           <Edit3 size={16} /> Editar Registro
                        </button>
                     )}
                     <button 
                        onClick={() => setViewingOccurrence(null)}
                        className="py-4 px-8 bg-white text-gray-400 border border-gray-200 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all"
                     >
                        Fechar
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* ÁREA DE IMPRESSÃO (OCULTA NA TELA) */}
         {printingOccurrence && (
            <div className="print-area hidden">
               <div className="print-page bg-white text-black p-[20mm]">
                  <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
                     <div className="flex items-center justify-start w-1/4">
                        <img src="/logo-escola.png" alt="Escola Logo" className="h-20 w-auto object-contain" />
                     </div>
                     <div className="w-2/4 flex justify-center items-center">
                        <img src="/dados escola.jpeg" alt="Dados da Escola" className="h-24 w-auto object-contain max-w-full" />
                     </div>
                     <div className="flex items-center justify-end w-1/4">
                        <img src="/SEDUC 2.jpg" alt="SEDUC MT" className="h-16 w-auto object-contain" />
                     </div>
                  </div>

                  <div className="text-center mb-10 space-y-2">
                     <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 border-2 border-black py-3 rounded-xl bg-gray-50">
                        Ata Contínua de Registro Escolar
                     </h1>
                     <p className="text-xs font-bold uppercase tracking-widest text-gray-600">
                        Escrituração Oficial e Sincronizada Pelo Discente
                     </p>
                  </div>

                  <div className="border border-black rounded-lg overflow-hidden mb-8">
                     <table className="w-full text-sm font-medium">
                        <tbody>
                           <tr className="border-b border-black">
                              <td className="p-3 bg-gray-100 font-black uppercase w-1/4 border-r border-black">Estudante</td>
                              <td className="p-3 uppercase font-black text-base">{printingOccurrence.studentName}</td>
                           </tr>
                           <tr className="border-b border-black">
                              <td className="p-3 bg-gray-100 font-black uppercase border-r border-black">Turma Base</td>
                              <td className="p-3 uppercase font-black">{printingOccurrence.className}</td>
                           </tr>
                           <tr className="border-b border-black">
                              <td className="p-3 bg-gray-100 font-black uppercase border-r border-black">Data/Hora</td>
                              <td className="p-3">{new Date(printingOccurrence.date).toLocaleDateString('pt-BR')} às {printingOccurrence.time || '--:--'}</td>
                           </tr>
                           <tr className="border-b border-black">
                              <td className="p-3 bg-gray-100 font-black uppercase border-r border-black">Natureza Fato</td>
                              <td className="p-3 uppercase">{printingOccurrence.type}</td>
                           </tr>
                           <tr>
                              <td className="p-3 bg-gray-100 font-black uppercase border-r border-black">Severidade</td>
                              <td className="p-3 uppercase font-bold">{printingOccurrence.severity}</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>

                  <div className="mb-16">
                     <h4 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit mb-4">
                        Relato Narrativo
                     </h4>
                     <p className="text-base leading-relaxed text-justify p-6 border border-black rounded-lg min-h-[150px]">
                        "{printingOccurrence.description}"
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-16 mt-20 text-center">
                     <div className="border-t border-black pt-4">
                        <p className="text-xs font-black uppercase">{printingOccurrence.teacherName}</p>
                        <p className="text-[10px] uppercase text-gray-600 font-medium">Docente Relator</p>
                     </div>
                     <div className="border-t border-black pt-4">
                        <p className="text-xs font-black uppercase">Direção / Coordenação</p>
                        <p className="text-[10px] uppercase text-gray-600 font-medium">Ciente Organizacional em ___/___/___</p>
                     </div>
                  </div>

                  <div className="absolute bottom-10 left-0 w-full text-center opacity-40 flex items-center justify-center gap-2">
                     <ShieldCheckIcon size={14} />
                     <span className="text-[8px] font-black uppercase tracking-widest">
                        Documento Oficializado via Portal de Gestão André Maggi
                     </span>
                  </div>
               </div>
            </div>
         )}

         {/* ESTILOS DE IMPRESSÃO */}
         <style>{`
            @media print {
               @page { size: A4 portrait; margin: 0; }
               body, html { margin: 0; padding: 0; background: white; }
               .no-print { display: none !important; }
               .print-area { display: block !important; }
               .animate-in { animation: none !important; transition: none !important; }
               .print-page {
                  width: 210mm;
                  min-height: 297mm;
                  margin: 0 auto;
                  padding-top: 15mm !important;
                  background: white;
                  box-sizing: border-box;
                  position: absolute;
                  top: 0; left: 0; right: 0;
                  z-index: 99999;
               }
            }
         `}</style>
      </>
   );
};

export default TeacherOccurrences;