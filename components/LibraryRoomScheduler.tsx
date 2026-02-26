import React, { useState, useMemo, useEffect } from 'react';
import {
   BookOpen,
   Clock,
   Plus,
   ShieldCheck,
   History,
   X,
   CheckCircle2,
   Trash2,
   CalendarDays,
   ArrowLeft,
   Layers,
   Sparkles,
   MonitorPlay,
   Library
} from 'lucide-react';
import { LibraryRoomBooking, Shift, StaffMember } from '../types';
import { useStaff } from '../hooks/useStaff';
import { useClassrooms } from '../hooks/useClassrooms';
import { useSubjects } from '../hooks/useSubjects';
import { supabase } from '../supabaseClient';

const SHIFTS: Shift[] = ['MATUTINO', 'VESPERTINO'];
const AVAILABLE_CLASSES = ["1ª", "2ª", "3ª", "4ª", "5ª"];
const ACTIVITY_TYPES = ['Leitura Livre', 'Pesquisa Orientada', 'Contação de Histórias', 'Exposição', 'Outros'];

const LibraryRoomScheduler: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'status' | 'history'>('status');
   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
   const [bookings, setBookings] = useState<LibraryRoomBooking[]>([]);
   const { staff } = useStaff();
   const { classrooms } = useClassrooms();
   const { subjects } = useSubjects();
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newBooking, setNewBooking] = useState({
      shift: 'MATUTINO' as Shift,
      classes: [] as string[],
      teacherName: '',
      className: '',
      subject: '',
      activityType: 'Leitura Livre' as any,
      needsMediaProjector: false,
      observations: ''
   });

   const fetchBookings = async () => {
      try {
         const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('resource_type', 'LIBRARY_ROOM')
            .order('created_at', { ascending: false });

         if (error) throw error;

         if (data) {
            setBookings(data.map(b => ({
               id: b.id,
               date: b.date,
               shift: b.shift as Shift,
               classes: b.classes || [],
               teacherName: b.teacher_name,
               className: b.class_name,
               activityType: b.type || 'Outros',
               needsMediaProjector: b.needs_projector,
               observations: b.description || '',
               timestamp: new Date(b.created_at).getTime()
            })));
         }
      } catch (error) {
         console.error("Erro ao buscar agendamentos da Biblioteca:", error);
      }
   };

   useEffect(() => {
      fetchBookings();

      const channel = supabase.channel('library_room_bookings')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: "resource_type=eq.LIBRARY_ROOM" }, fetchBookings)
         .subscribe();

      return () => {
         channel.unsubscribe();
      };
   }, []);

   const currentBookings = useMemo(() => {
      return bookings.filter(b => b.date === selectedDate);
   }, [bookings, selectedDate]);

   const handleAddBooking = async (e: React.FormEvent) => {
      e.preventDefault();

      if (newBooking.classes.length === 0) {
         return alert("Por favor, selecione ao menos uma aula.");
      }

      if (!newBooking.teacherName || !newBooking.className) {
         return alert("Preencha todos os campos obrigatórios.");
      }

      const conflict = bookings.find(b =>
         b.date === selectedDate &&
         b.shift === newBooking.shift &&
         b.classes.some(cls => newBooking.classes.includes(cls))
      );

      if (conflict) {
         return alert(`ERRO: Conflito de horário! A Biblioteca já está reservada para as aulas (${conflict.classes.join(', ')}) no turno ${newBooking.shift} por ${conflict.teacherName}.`);
      }

      try {
         const { error } = await supabase.from('bookings').insert([{
            resource_type: 'LIBRARY_ROOM',
            date: selectedDate,
            shift: newBooking.shift,
            classes: newBooking.classes,
            teacher_name: newBooking.teacherName,
            class_name: newBooking.className,
            title: `[${newBooking.subject}] ${newBooking.activityType}`,
            needs_projector: newBooking.needsMediaProjector,
            description: newBooking.observations
         }]);

         if (error) throw error;

         setIsModalOpen(false);
         setNewBooking({ ...newBooking, classes: [], teacherName: '', className: '', subject: '', activityType: 'Leitura Livre', needsMediaProjector: false, observations: '' });
         alert("Agendamento realizado com sucesso!");
      } catch (error) {
         console.error("Erro ao agendar Biblioteca:", error);
         alert("Erro ao realizar agendamento.");
      }
   };

   const toggleClass = (cls: string) => {
      setNewBooking(prev => ({
         ...prev,
         classes: prev.classes.includes(cls)
            ? prev.classes.filter(c => c !== cls)
            : [...prev.classes, cls].sort()
      }));
   };

   const deleteBooking = async (id: string) => {
      if (window.confirm("Deseja cancelar esta reserva do espaço da biblioteca?")) {
         try {
            const { error } = await supabase.from('bookings').delete().eq('id', id);
            if (error) throw error;
         } catch (error) {
            console.error("Erro ao cancelar agendamento:", error);
            alert("Erro ao cancelar agendamento.");
         }
      }
   };

   const renderStatus = () => (
      <div className="space-y-8 animate-in fade-in duration-500">
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl">
                  <BookOpen size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Espaço Biblioteca</h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Agenda para Atividades Coletivas e Aulas</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
               />
               <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
               >
                  <Plus size={18} /> Reservar Espaço
               </button>
            </div>
         </div>

         <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-indigo-50/30 flex items-center gap-3">
               <Library className="text-indigo-600" />
               <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Ocupação do Dia: {new Date(selectedDate).toLocaleDateString('pt-BR')}</h4>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
               {SHIFTS.map(shift => {
                  const shiftBookings = currentBookings.filter(b => b.shift === shift);
                  return (
                     <div key={shift} className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{shift}</span>
                           <span className="text-[9px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-lg">{shiftBookings.length} Atividade(s)</span>
                        </div>
                        <div className="space-y-4">
                           {shiftBookings.length > 0 ? (
                              shiftBookings.map(sb => (
                                 <div key={sb.id} className="p-6 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:bg-white transition-all relative group shadow-sm">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                       <BookOpen size={60} className="text-indigo-900" />
                                    </div>
                                    <div className="relative z-10">
                                       <div className="flex justify-between items-start mb-4">
                                          <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-1 rounded-lg uppercase">Aulas: {sb.classes.join(', ')}</span>
                                          {sb.needsMediaProjector && <MonitorPlay size={14} className="text-indigo-500" />}
                                       </div>
                                       <p className="text-xs font-black text-gray-900 uppercase leading-tight mb-1">{sb.teacherName}</p>
                                       <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">{sb.className}</p>
                                       <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 w-fit px-3 py-1.5 rounded-full border border-indigo-100">
                                          <Sparkles size={10} /> {sb.activityType}
                                       </div>
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <div className="py-20 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300">
                                 <Clock size={32} className="mb-3 opacity-20" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Livre para Leitura</span>
                              </div>
                           )}
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         <button
            onClick={() => setActiveTab('history')}
            className="w-full py-4 bg-gray-100 rounded-3xl border border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
         >
            <History size={16} /> Relatório Permanente de Uso da Biblioteca
         </button>
      </div>
   );

   const renderHistory = () => (
      <div className="space-y-6">
         <button
            onClick={() => setActiveTab('status')}
            className="flex items-center gap-2 text-indigo-700 font-black uppercase text-xs tracking-widest hover:text-indigo-800 transition-colors group mb-4"
         >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar à Agenda
         </button>

         <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Histórico de Uso do Espaço Biblioteca</h3>
               <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado com Módulo Acervo</span>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-gray-50 text-gray-400">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Data / Turno</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Professor / Turma</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Tipo de Atividade</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Multimídia</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Ação</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                     {bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-8 py-6">
                              <p className="font-black text-gray-900">{new Date(b.date).toLocaleDateString('pt-BR')}</p>
                              <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest">{b.shift} • Aulas: {b.classes.join(', ')}</p>
                           </td>
                           <td className="px-8 py-6">
                              <p className="font-black text-gray-800 uppercase">{b.teacherName}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{b.className}</p>
                           </td>
                           <td className="px-8 py-6">
                              <p className="font-bold text-gray-600 uppercase italic line-clamp-1">{b.activityType}</p>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${b.needsMediaProjector ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                                 {b.needsMediaProjector ? 'SIM' : 'NÃO'}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <button onClick={() => deleteBooking(b.id)} className="p-3 text-gray-300 hover:text-red-500 transition-colors">
                                 <Trash2 size={18} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {bookings.length === 0 && (
                  <div className="py-24 text-center">
                     <History size={48} className="mx-auto mb-4 text-gray-200" />
                     <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Sem registros no sistema</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );

   return (
      <>
         <div className="max-w-7xl mx-auto">
            {activeTab === 'status' ? renderStatus() : renderHistory()}
         </div>

         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col h-full max-h-[90vh]">
                  <form onSubmit={handleAddBooking} className="flex flex-col h-full">
                     <div className="px-10 pt-10 pb-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-600/20"><Plus size={28} strokeWidth={3} /></div>
                           <div>
                              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Reservar Biblioteca</h3>
                              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Espaço Coletivo: {new Date(selectedDate).toLocaleDateString('pt-BR')}</p>
                           </div>
                        </div>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
                     </div>

                     <div className="px-10 pb-10 space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turno de Uso</label>
                           <select
                              required
                              value={newBooking.shift}
                              onChange={e => setNewBooking({ ...newBooking, shift: e.target.value as Shift })}
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                           >
                              {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <Layers size={14} className="text-indigo-600" /> Horários da Atividade
                           </label>
                           <div className="flex gap-2">
                              {AVAILABLE_CLASSES.map(cls => (
                                 <button
                                    key={cls}
                                    type="button"
                                    onClick={() => toggleClass(cls)}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border-2 ${newBooking.classes.includes(cls)
                                       ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg'
                                       : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-indigo-200'
                                       }`}
                                 >
                                    {cls}
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professor(a) Responsável</label>
                           <select
                              required
                              value={newBooking.teacherName}
                              onChange={e => setNewBooking({ ...newBooking, teacherName: e.target.value })}
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                           >
                              <option value="">Selecione o docente...</option>
                              {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                           </select>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma</label>
                              <select
                                 required
                                 value={newBooking.className}
                                 onChange={e => setNewBooking({ ...newBooking, className: e.target.value })}
                                 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                              >
                                 <option value="">Selecione a turma...</option>
                                 {classrooms.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina</label>
                              <select
                                 required
                                 value={newBooking.subject}
                                 onChange={e => setNewBooking({ ...newBooking, subject: e.target.value })}
                                 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                              >
                                 <option value="">Selecione...</option>
                                 {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Atividade</label>
                              <select
                                 value={newBooking.activityType}
                                 onChange={e => setNewBooking({ ...newBooking, activityType: e.target.value as any })}
                                 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white transition-all"
                              >
                                 {ACTIVITY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                           <input
                              type="checkbox"
                              id="needsMedia"
                              checked={newBooking.needsMediaProjector}
                              onChange={e => setNewBooking({ ...newBooking, needsMediaProjector: e.target.checked })}
                              className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                           />
                           <label htmlFor="needsMedia" className="text-xs font-black text-indigo-800 uppercase tracking-widest cursor-pointer select-none">
                              Solicitar DataShow / Equipamento de Projeção
                           </label>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações Adicionais</label>
                           <textarea
                              value={newBooking.observations}
                              onChange={e => setNewBooking({ ...newBooking, observations: e.target.value })}
                              placeholder="Ex: Necessário organizar cadeiras em círculo..."
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-sm outline-none focus:bg-white transition-all h-20 resize-none"
                           />
                        </div>

                        <div className="pt-2 flex gap-4">
                           <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all">Confirmar Agendamento</button>
                           <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 bg-gray-100 text-gray-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
                        </div>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </>
   );
};

export default LibraryRoomScheduler;