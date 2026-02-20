
import React, { useState, useEffect, useMemo } from 'react';
import {
   Headphones,
   Search,
   CheckCircle2,
   XCircle,
   Clock,
   User,
   Calendar,
   RotateCcw,
   Truck,
   MessageSquare,
   ShieldCheck,
   ChevronRight,
   ArrowRightLeft,
   AlertTriangle,
   History,
   Plus,
   Minus,
   Library,
   Play,
   PlusCircle,
   X,
   Users,
   FileText
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from './Toast';
import { EquipmentBooking } from '../types';

const AlmoxarifeEquipmentManager: React.FC = () => {
   const { addToast } = useToast();
   const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
   const [filter, setFilter] = useState<'SOLICITADO' | 'EM_USO' | 'DEVOLVIDO' | 'TODOS'>('TODOS');
   const [selectedBookingForStudents, setSelectedBookingForStudents] = useState<EquipmentBooking | null>(null);
   const [editingStudentList, setEditingStudentList] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newRequest, setNewRequest] = useState({
      teacher_name: '',
      equipment_type: 'FONES DE OUVIDO',
      quantity: 1,
      return_time: new Date().toISOString().slice(0, 16),
   });

   const fetchBookings = async () => {
      try {
         const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('resource_type', 'EQUIPMENT')
            .order('created_at', { ascending: false });

         if (error) throw error;

         if (!data || data.length === 0) {
            // Auto-seed for migration/testing
            const seedData = [
               {
                  resource_id: 'fone-01',
                  resource_type: 'EQUIPMENT',
                  user_name: 'PROF. CARLOS SILVA',
                  purpose: '9º ANO A',
                  date: new Date().toISOString().split('T')[0],
                  shift: 'MATUTINO',
                  status: 'SOLICITADO',
                  description: 'PEDRO, MARIA, JOAO, ANA'
               },
               {
                  resource_id: 'fone-02',
                  resource_type: 'EQUIPMENT',
                  user_name: 'PROF. ANA SOUZA',
                  purpose: '8º ANO B',
                  date: new Date().toISOString().split('T')[0],
                  shift: 'VESPERTINO',
                  status: 'RETIRADO',
                  description: 'CARLOS, BEATRIZ, LUCAS'
               },
               {
                  resource_id: 'fone-03',
                  resource_type: 'EQUIPMENT',
                  user_name: 'PROF. MARCOS',
                  purpose: '7º ANO C',
                  date: new Date().toISOString().split('T')[0],
                  shift: 'MATUTINO',
                  status: 'SOLICITADO',
                  description: ''
               }
            ];
            const { error: seedError } = await supabase.from('bookings').insert(seedData);
            if (!seedError) fetchBookings();
            return;
         }

         setBookings(data.map(b => ({
            id: b.id,
            equipmentId: b.resource_id,
            equipmentName: b.resource_id.startsWith('fone-') ? `KIT FONE ${b.resource_id.split('-')[1]}` : b.resource_id,
            teacherName: b.user_name,
            className: b.purpose,
            date: b.date,
            shift: b.shift as any,
            status: b.status as any,
            studentList: b.description,
            returnTimestamp: b.return_timestamp ? new Date(b.return_timestamp).getTime() : undefined
         })));
      } catch (error) {
         console.error("Erro ao buscar agendamentos:", error);
      }
   };

   useEffect(() => {
      fetchBookings();
      const subscription = supabase
         .channel('equipment_bookings_changes')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchBookings)
         .subscribe();
      return () => { subscription.unsubscribe(); };
   }, []);

   const updateStatus = async (id: string, status: string) => {
      try {
         const updateData: any = { status };
         if (status === 'DEVOLVIDO') {
            updateData.return_timestamp = new Date().toISOString();
         }

         const { error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', id);

         if (error) throw error;

         await fetchBookings();
         addToast(`Status do Kit atualizado para: ${status}`, 'success');
      } catch (error) {
         console.error("Erro ao atualizar status:", error);
         addToast("Erro ao atualizar status.", 'error');
      }
   };

   const handleUpdateStudents = async () => {
      if (!selectedBookingForStudents) return;
      try {
         // Try to parse existing or start fresh
         let mapping: Record<number, string> = {};
         try {
            mapping = JSON.parse(editingStudentList);
         } catch {
            // If it's not JSON (legacy or raw string), we can't easily map it 1-1, 
            // but for new ones we use the grid. 
            // We'll handle this in the UI by setting the state.
         }

         const { error } = await supabase
            .from('bookings')
            .update({ description: editingStudentList }) // Storing as JSON string
            .eq('id', selectedBookingForStudents.id);

         if (error) throw error;

         await fetchBookings();
         setSelectedBookingForStudents(null);
         addToast("Vínculo individual de fones atualizado!", 'success');
      } catch (error) {
         console.error("Erro ao atualizar lista de alunos:", error);
         addToast("Erro ao atualizar lista de alunos.", 'error');
      }
   };

   const handleCreateRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         const { data, error } = await supabase
            .from('bookings')
            .insert({
               resource_id: newRequest.equipment_type.toLowerCase().replace(/ /g, '-'), // Simple ID generation
               resource_type: 'EQUIPMENT',
               user_name: newRequest.teacher_name,
               purpose: 'NOVA SOLICITACAO', // Placeholder
               date: new Date().toISOString().split('T')[0],
               shift: 'MATUTINO', // Placeholder
               status: 'SOLICITADO',
               description: '',
               return_timestamp: newRequest.return_time,
            });

         if (error) throw error;

         await fetchBookings();
         setIsModalOpen(false);
         setNewRequest({
            teacher_name: '',
            equipment_type: 'FONES DE OUVIDO',
            quantity: 1,
            return_time: new Date().toISOString().slice(0, 16),
         });
         addToast('Solicitação de empréstimo criada com sucesso!', 'success');
      } catch (error) {
         console.error('Erro ao criar solicitação:', error);
         addToast('Erro ao criar solicitação.', 'error');
      }
   };

   const filtered = useMemo(() => {
      if (filter === 'TODOS') return bookings;
      return bookings.filter(b => b.status === filter);
   }, [bookings, filter]);

   const stats = useMemo(() => {
      return {
         pending: bookings.filter(b => b.status === 'SOLICITADO').length,
         inUse: bookings.filter(b => b.status === 'RETIRADO').length,
         today: bookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length
      };
   }, [bookings]);

   return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8 space-y-8 animate-in fade-in duration-500 pb-20">

         {/* HEADER */}
         <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg shadow-orange-600/20">
                     <Headphones size={32} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-white uppercase tracking-tight">Gestão de Equipamentos</h2>
                     <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Controle de Fones e Recursos Audiovisuais</p>
                  </div>
               </div>
               <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all shadow-lg border border-white/5"
               >
                  <PlusCircle size={18} /> Novo Empréstimo
               </button>
            </div>

            {/* KBS / STATS */}
            <div className="grid grid-cols-3 gap-4">
               <div className="p-6 bg-black/20 rounded-[2rem] border border-white/5 flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
                     <Clock size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pendentes</p>
                     <p className="text-2xl font-black text-white">{bookings.filter(r => r.status === 'SOLICITADO').length}</p>
                  </div>
               </div>
               <div className="p-6 bg-black/20 rounded-[2rem] border border-white/5 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                     <CheckCircle2 size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Em Uso</p>
                     <p className="text-2xl font-black text-white">{bookings.filter(r => r.status === 'EM_USO').length}</p>
                  </div>
               </div>
               <div className="p-6 bg-black/20 rounded-[2rem] border border-white/5 flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                     <Calendar size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Hoje</p>
                     <p className="text-2xl font-black text-white">
                        {bookings.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length}
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* FILTROS E BUSCA */}
         <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md">
            <div className="flex bg-black/20 p-1.5 rounded-2xl overflow-x-auto border border-white/5">
               {['SOLICITADO', 'EM_USO', 'DEVOLVIDO', 'TODOS'].map(f => (
                  <button
                     key={f}
                     onClick={() => setFilter(f as any)}
                     className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${filter === f ? 'bg-orange-600 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                  >
                     {f === 'SOLICITADO' ? 'Solicitados' : f === 'EM_USO' ? 'Em Uso' : f === 'DEVOLVIDO' ? 'Devolvidos' : 'Ver Todos'}
                  </button>
               ))}
            </div>
            <div className="flex items-center gap-3">
               <ShieldCheck className="text-emerald-500" size={20} />
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Controle Patrimonial Ativo</span>
            </div>
         </div>

         {/* LIST AND CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length > 0 ? filtered.map(req => (
               <div key={req.id} className="bg-white/5 rounded-[2.5rem] border border-white/10 p-6 flex flex-col justify-between hover:border-orange-500/30 transition-all group relative backdrop-blur-md">
                  <div className="space-y-4">
                     <div className="flex items-start justify-between">
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${req.status === 'SOLICITADO' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                           req.status === 'EM_USO' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                           }`}>
                           {req.status.replace('_', ' ')}
                        </div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                           {new Date(req.created_at).toLocaleDateString('pt-BR')}
                        </span>
                     </div>

                     <div>
                        <h3 className="text-lg font-black text-white uppercase leading-tight">{req.teacher_name}</h3>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                           {req.equipment_type} • {req.quantity} Unidades
                        </p>
                     </div>

                     <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Devolução Prevista</span>
                           <span className="text-xs font-black text-white uppercase">
                              {new Date(req.return_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                     {req.status === 'SOLICITADO' && (
                        <button
                           onClick={() => updateStatus(req.id, 'EM_USO')}
                           className="col-span-2 py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                           <Play size={16} /> Iniciar Uso
                        </button>
                     )}
                     {req.status === 'EM_USO' && (
                        <button
                           onClick={() => updateStatus(req.id, 'DEVOLVIDO')}
                           className="col-span-2 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                           <CheckCircle2 size={16} /> Finalizar / Devolver
                        </button>
                     )}
                     {(req.status === 'SOLICITADO' || req.status === 'EM_USO') && (
                        <button
                           onClick={() => updateStatus(req.id, 'RECUSADO')}
                           className="col-span-2 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                           <XCircle size={16} /> Recusar / Cancelar
                        </button>
                     )}
                  </div>
               </div>
            )) : (
               <div className="py-32 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-white/30 col-span-full">
                  <History size={48} className="mb-4 opacity-20" />
                  <p className="text-white/40 font-black uppercase text-xs tracking-widest">Sem movimentações para este filtro</p>
               </div>
            )}
         </div>

         {/* NOTA DE CONFORMIDADE */}
         <div className="bg-orange-500/10 p-8 rounded-[3rem] border border-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-white/10 rounded-2xl shadow-sm text-orange-400">
                  <AlertTriangle size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-white uppercase">Aviso de Auditoria</h4>
                  <p className="text-xs text-orange-200 font-medium">Todos os empréstimos de kits eletrônicos são monitorados pela DRE e devem ser devolvidos no mesmo turno.</p>
               </div>
            </div>
         </div>

         {/* MODAL VÍNCULO DE ALUNOS */}
         {selectedBookingForStudents && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-gray-900 rounded-[3.5rem] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden flex flex-col">
                  <div className="p-8 bg-white/5 border-b border-white/10 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg"><Users size={24} /></div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tighter">Vínculo de Alunos</h3>
                           <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-1">{selectedBookingForStudents.equipmentName} • {selectedBookingForStudents.className}</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedBookingForStudents(null)} className="p-2 text-white/40 hover:text-white transition-colors"><X size={24} /></button>
                  </div>

                  <div className="p-10 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: 30 }).map((_, i) => {
                           const headphoneNumber = i + 1;
                           let currentMapping: Record<number, string> = {};
                           try {
                              currentMapping = JSON.parse(editingStudentList);
                           } catch {
                              // Handle empty or string
                           }

                           return (
                              <div key={headphoneNumber} className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/10 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                                 <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border border-orange-500/20">
                                    {headphoneNumber < 10 ? `0${headphoneNumber}` : headphoneNumber}
                                 </div>
                                 <input
                                    type="text"
                                    placeholder="Nome do Aluno..."
                                    value={currentMapping[headphoneNumber] || ''}
                                    onChange={(e) => {
                                       const newMapping = { ...currentMapping, [headphoneNumber]: e.target.value.toUpperCase() };
                                       setEditingStudentList(JSON.stringify(newMapping));
                                    }}
                                    className="flex-1 bg-transparent font-bold text-xs outline-none uppercase placeholder:text-white/20 text-white"
                                 />
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  <div className="p-10 border-t border-white/10 bg-black/20 flex flex-col gap-4">
                     <div className="flex gap-4">
                        <button
                           onClick={handleUpdateStudents}
                           className="flex-1 py-5 bg-orange-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-orange-700 transition-all"
                        >
                           Confirmar Mapeamento
                        </button>
                        <button onClick={() => setSelectedBookingForStudents(null)} className="px-8 py-5 bg-white/10 text-white/40 border border-white/10 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-white/20 transition-all">Cancelar</button>
                     </div>
                     <p className="text-[9px] text-white/40 text-center font-medium italic">O mapeamento individual ajuda a identificar rapidamente o responsável por cada item do KIT.</p>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL NOVO EMPRÉSTIMO */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-gray-900 rounded-[3.5rem] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden flex flex-col">
                  <div className="p-8 bg-white/5 flex justify-between items-center border-b border-white/10">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-600/20">
                           <PlusCircle size={24} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Novo Empréstimo</h3>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleCreateRequest} className="p-10 space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Professor Responsável</label>
                        <input
                           required
                           type="text"
                           value={newRequest.teacher_name}
                           onChange={e => setNewRequest({ ...newRequest, teacher_name: e.target.value })}
                           className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none focus:bg-black/40 focus:border-orange-500/50 transition-all placeholder-white/20"
                           placeholder="Nome do professor..."
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Equipamento</label>
                           <select
                              value={newRequest.equipment_type}
                              onChange={e => setNewRequest({ ...newRequest, equipment_type: e.target.value })}
                              className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-black text-xs uppercase text-white outline-none focus:border-orange-500/50"
                           >
                              <option className="bg-gray-900">FONES DE OUVIDO</option>
                              <option className="bg-gray-900">TABLETS</option>
                              <option className="bg-gray-900">CHROMEBOOKS</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Quantidade</label>
                           <input
                              required
                              type="number"
                              min="1"
                              value={newRequest.quantity}
                              onChange={e => setNewRequest({ ...newRequest, quantity: Number(e.target.value) })}
                              className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-black text-sm text-white outline-none focus:border-orange-500/50"
                           />
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Horário de Devolução</label>
                        <input
                           required
                           type="datetime-local"
                           value={newRequest.return_time}
                           onChange={e => setNewRequest({ ...newRequest, return_time: e.target.value })}
                           className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-black text-sm text-white outline-none focus:border-orange-500/50 [color-scheme:dark]"
                        />
                     </div>

                     <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-orange-700 transition-all">
                        <CheckCircle2 size={20} /> Registrar Solicitação
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default AlmoxarifeEquipmentManager;
