import React, { useState, useMemo, useEffect } from 'react';
import {
   Building2,
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
   Music,
   Tv,
   Wind,
   Theater
} from 'lucide-react';
import { AuditoriumBooking, Shift, StaffMember } from '../types';
import { useStaff } from '../hooks/useStaff';
import { useClassrooms } from '../hooks/useClassrooms';
import { useSubjects } from '../hooks/useSubjects';
import { supabase } from '../supabaseClient';

const SHIFTS: Shift[] = ['MATUTINO', 'VESPERTINO'];
const AVAILABLE_CLASSES = ["1ª", "2ª", "3ª", "4ª", "5ª"];
const EVENT_TYPES = ['Palestra', 'Apresentação', 'Cinema', 'Ensaio', 'Reunião', 'Outros'];

const AuditoriumScheduler: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'status' | 'history'>('status');
   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
   const [bookings, setBookings] = useState<AuditoriumBooking[]>([]);
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
      eventName: '',
      eventType: 'Palestra' as any,
      needsSound: false,
      needsProjector: false,
      needsAc: true,
      observations: ''
   });

   const fetchBookings = async () => {
      try {
         const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('resource_type', 'AUDITORIUM')
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
               eventName: b.title || '',
               eventType: b.type || 'Outros',
               needsSound: b.needs_sound,
               needsProjector: b.needs_projector,
               needsAc: b.needs_ac,
               observations: b.description || '',
               timestamp: new Date(b.created_at).getTime()
            })));
         }
      } catch (error) {
         console.error("Erro ao buscar agendamentos:", error);
      }
   };

   useEffect(() => {
      fetchBookings();

      const channel = supabase.channel('auditorium_bookings')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: "resource_type=eq.AUDITORIUM" }, fetchBookings)
         .subscribe();

      return () => {
         if (channel) channel.unsubscribe();
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

      // Checking for conflict locally
      const conflict = bookings.find(b =>
         b.date === selectedDate &&
         b.shift === newBooking.shift &&
         b.classes.some(cls => newBooking.classes.includes(cls))
      );

      if (conflict) {
         return alert(`ERRO: Conflito de horário! O Auditório já possui reserva para as aulas (${conflict.classes.join(', ')}) no turno ${newBooking.shift} por ${conflict.teacherName}.`);
      }

      try {
         const { error } = await supabase.from('bookings').insert([{
            resource_type: 'AUDITORIUM',
            date: selectedDate,
            shift: newBooking.shift,
            classes: newBooking.classes,
            teacher_name: newBooking.teacherName,
            class_name: newBooking.className,
            title: `[${newBooking.subject}] ${newBooking.eventName}`,
            type: newBooking.eventType,
            description: newBooking.observations,
            needs_sound: newBooking.needsSound,
            needs_projector: newBooking.needsProjector,
            needs_ac: newBooking.needsAc
         }]);

         if (error) throw error;

         setIsModalOpen(false);
         setNewBooking({ ...newBooking, classes: [], teacherName: '', className: '', subject: '', eventName: '', eventType: 'Palestra', needsSound: false, needsProjector: false, needsAc: true, observations: '' });
         alert("Agendamento realizado com sucesso!");
      } catch (error) {
         console.error("Erro ao agendar:", error);
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
      if (window.confirm("Deseja cancelar esta reserva do auditório?")) {
         try {
            const { error } = await supabase.from('bookings').delete().eq('id', id);
            if (error) throw error;
         } catch (error) {
            console.error("Erro ao cancelar reserva:", error);
            alert("Erro ao cancelar reserva.");
         }
      }
   };

   const renderStatus = () => (
      <div className="space-y-8 animate-in fade-in duration-500">
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl">
                  <Building2 size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Auditório / Teatro André Maggi</h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão de Eventos, Reuniões e Cinema Escolar</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
               />
               <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2"
               >
                  <Plus size={18} /> Novo Agendamento
               </button>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-6">
               <Theater className="text-emerald-500" />
               <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Disponibilidade: {new Date(selectedDate).toLocaleDateString('pt-BR')}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {SHIFTS.map(shift => {
                  const shiftBookings = currentBookings.filter(b => b.shift === shift);
                  return (
                     <div key={shift} className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{shift}</span>
                           <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-lg">{shiftBookings.length} Atividade(s)</span>
                        </div>
                        <div className="space-y-4">
                           {shiftBookings.length > 0 ? (
                              shiftBookings.map(sb => (
                                 <div key={sb.id} className="p-6 rounded-[2.5rem] bg-emerald-50/50 border border-emerald-100 hover:bg-white transition-all relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                       <Theater size={80} className="text-emerald-900" />
                                    </div>
                                    <div className="relative z-10">
                                       <div className="flex justify-between items-start mb-4">
                                          <span className="text-[8px] font-black bg-emerald-600 text-white px-2 py-1 rounded-lg uppercase">Aulas: {sb.classes.join(', ')}</span>
                                          <div className="flex gap-1.5">
                                             {sb.needsSound && <Music size={12} className="text-emerald-600" />}
                                             {sb.needsProjector && <Tv size={12} className="text-emerald-600" />}
                                             {sb.needsAc && <Wind size={12} className="text-emerald-600" />}
                                          </div>
                                       </div>
                                       <p className="text-xs font-black text-gray-900 uppercase leading-tight mb-1">{sb.teacherName}</p>
                                       <p className="text-[10px] text-emerald-700 font-bold uppercase mb-4">{sb.className}</p>
                                       <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100">
                                          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">{sb.eventType}:</p>
                                          <p className="text-[11px] font-bold text-emerald-900 uppercase italic">"{sb.eventName}"</p>
                                       </div>
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <div className="py-20 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300">
                                 <Clock size={32} className="mb-3 opacity-20" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Horário Livre</span>
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
            <History size={16} /> Ver Relatório Geral do Auditório
         </button>
      </div>
   );

   const renderHistory = () => (
      <div className="space-y-6">
         <button
            onClick={() => setActiveTab('status')}
            className="flex items-center gap-2 text-emerald-700 font-black uppercase text-xs tracking-widest hover:text-emerald-800 transition-colors group mb-4"
         >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Calendário
         </button>

         <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Log de Uso (Auditório / Teatro)</h3>
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Registros Oficiais</span>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-gray-50 text-gray-400">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Data / Turno</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Solicitante / Turma</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Evento / Atividade</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Infraestrutura</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Ação</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                     {bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-8 py-6">
                              <p className="font-black text-gray-900">{new Date(b.date).toLocaleDateString('pt-BR')}</p>
                              <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">{b.shift} • {b.classes.join(', ')} aulas</p>
                           </td>
                           <td className="px-8 py-6">
                              <p className="font-black text-gray-800 uppercase">{b.teacherName}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{b.className}</p>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                 <span className="text-[8px] font-black bg-gray-100 px-2 py-0.5 rounded-lg uppercase">{b.eventType}</span>
                                 <p className="font-bold text-gray-600 uppercase italic line-clamp-1">{b.eventName}</p>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <div className="flex justify-center gap-2">
                                 <div className={`p-1.5 rounded-lg ${b.needsSound ? 'text-emerald-600 bg-emerald-50' : 'text-gray-200'}`} title="Som"><Music size={14} /></div>
                                 <div className={`p-1.5 rounded-lg ${b.needsProjector ? 'text-emerald-600 bg-emerald-50' : 'text-gray-200'}`} title="Projetor"><Tv size={14} /></div>
                                 <div className={`p-1.5 rounded-lg ${b.needsAc ? 'text-emerald-600 bg-emerald-50' : 'text-gray-200'}`} title="Ar Condicionado"><Wind size={14} /></div>
                              </div>
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
                     <Theater size={48} className="mx-auto mb-4 text-gray-200" />
                     <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Sem eventos registrados</p>
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col h-full max-h-[90vh]">
                  <form onSubmit={handleAddBooking} className="flex flex-col h-full">
                     <div className="px-10 pt-10 pb-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-600/20"><Plus size={28} strokeWidth={3} /></div>
                           <div>
                              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Reservar Auditório</h3>
                              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Data do Evento: {new Date(selectedDate).toLocaleDateString('pt-BR')}</p>
                           </div>
                        </div>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
                     </div>

                     <div className="px-10 pb-10 space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turno de Uso</label>
                              <select
                                 required
                                 value={newBooking.shift}
                                 onChange={e => setNewBooking({ ...newBooking, shift: e.target.value as Shift })}
                                 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                              >
                                 {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                              <select
                                 required
                                 value={newBooking.eventType}
                                 onChange={e => setNewBooking({ ...newBooking, eventType: e.target.value as any })}
                                 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                              >
                                 {EVENT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <Layers size={14} className="text-emerald-600" /> Blocos de Aulas Reservados
                           </label>
                           <div className="flex gap-2">
                              {AVAILABLE_CLASSES.map(cls => (
                                 <button
                                    key={cls}
                                    type="button"
                                    onClick={() => toggleClass(cls)}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border-2 ${newBooking.classes.includes(cls)
                                       ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg'
                                       : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-emerald-200'
                                       }`}
                                 >
                                    {cls}
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Docente / Responsável pela Chave</label>
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
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma / Grupo</label>
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
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título do Evento</label>
                              <input
                                 required
                                 type="text"
                                 placeholder="EX: PALESTRA SOBRE MEIO AMBIENTE"
                                 value={newBooking.eventName}
                                 onChange={e => setNewBooking({ ...newBooking, eventName: e.target.value.toUpperCase() })}
                                 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                              />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recursos Necessários</label>
                           <div className="grid grid-cols-3 gap-3">
                              <button
                                 type="button"
                                 onClick={() => setNewBooking({ ...newBooking, needsSound: !newBooking.needsSound })}
                                 className={`flex items-center justify-center gap-2 p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${newBooking.needsSound ? 'bg-emerald-50 border-emerald-600 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                              >
                                 <Music size={14} /> Som
                              </button>
                              <button
                                 type="button"
                                 onClick={() => setNewBooking({ ...newBooking, needsProjector: !newBooking.needsProjector })}
                                 className={`flex items-center justify-center gap-2 p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${newBooking.needsProjector ? 'bg-emerald-50 border-emerald-600 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                              >
                                 <Tv size={14} /> Projetor
                              </button>
                              <button
                                 type="button"
                                 onClick={() => setNewBooking({ ...newBooking, needsAc: !newBooking.needsAc })}
                                 className={`flex items-center justify-center gap-2 p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${newBooking.needsAc ? 'bg-emerald-50 border-emerald-600 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                              >
                                 <Wind size={14} /> Ar Cond.
                              </button>
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações de Layout / Apoio</label>
                           <textarea
                              value={newBooking.observations}
                              onChange={e => setNewBooking({ ...newBooking, observations: e.target.value })}
                              placeholder="Necessita de cadeiras extras, microfone sem fio..."
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-sm outline-none focus:bg-white transition-all h-20 resize-none"
                           />
                        </div>

                        <div className="pt-2 flex gap-4">
                           <button type="submit" className="flex-1 py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all">Confirmar Agendamento</button>
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

export default AuditoriumScheduler;