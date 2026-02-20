
import React, { useState, useEffect, useMemo } from 'react';
import {
   Package,
   Plus,
   Trash2,
   Send,
   History,
   Search,
   CheckCircle2,
   Clock,
   X,
   ShoppingBag,
   Headphones,
   Calendar,
   Box,
   ShieldAlert,
   Monitor,
   AlertCircle,
   FileText
} from 'lucide-react';
import { PedagogicalMaterialRequest, EquipmentBooking, Shift } from '../types';
import { supabase } from '../supabaseClient';

const HEADPHONE_KITS = [
   { id: 'fone-01', name: 'KIT FONE 01', units: 30 },
   { id: 'fone-02', name: 'KIT FONE 02', units: 30 },
   { id: 'fone-03', name: 'KIT FONE 03', units: 30 },
];

const DEFAULT_PED_MATERIALS = [
   { id: 'm1', name: 'PAPEL SULFITE A4 BRANCO', category: 'PAPELARIA', unit: 'PCT', current: 50, min: 10 },
   { id: 'm2', name: 'COLA BRANCA 500G', category: 'PAPELARIA', unit: 'FRASCO', current: 20, min: 5 },
   { id: 'm3', name: 'TESOURA ESCOLAR SEM PONTA', category: 'PAPELARIA', unit: 'UNID', current: 30, min: 10 },
   { id: 'm4', name: 'TINTA GUACHE 250ML (CORES MISTAS)', category: 'ARTE', unit: 'FRASCO', current: 15, min: 5 },
   { id: 'm5', name: 'CARTOLINA BRANCA', category: 'ARTE', unit: 'UNID', current: 100, min: 20 },
   { id: 'm6', name: 'CANETA HIDROGRÁFICA 12 CORES', category: 'ARTE', unit: 'CX', current: 25, min: 5 },
   { id: 'm7', name: 'LÁPIS DE COR 12 CORES', category: 'PAPELARIA', unit: 'CX', current: 40, min: 10 },
   { id: 'm8', name: 'GRAMPEADOR DE MESA 26/6', category: 'ESCRITÓRIO', unit: 'UNID', current: 10, min: 2 },
];

const SHIFTS: Shift[] = ['MATUTINO', 'VESPERTINO'];

const TeacherPedagogicalRequests: React.FC = () => {
   const [activeMode, setActiveMode] = useState<'consumables' | 'equipment' | 'history'>('consumables');
   const [searchTerm, setSearchTerm] = useState('');
   const [activeCategory, setActiveCategory] = useState<string>('TODOS');

   // Consumables State
   const [stockCatalog] = useState<any[]>(DEFAULT_PED_MATERIALS);
   const [cart, setCart] = useState<{ materialId: string, materialName: string, quantity: number, unit: string, isCustom?: boolean }[]>([]);
   const [reason, setReason] = useState('');
   const [history, setHistory] = useState<PedagogicalMaterialRequest[]>([]);

   // Equipment State
   const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
   const [equipmentBookings, setEquipmentBookings] = useState<EquipmentBooking[]>([]);
   const [activeSlot, setActiveSlot] = useState<{ kitId: string, kitName: string, shift: Shift } | null>(null);
   const [targetClass, setTargetClass] = useState('');
   const [studentList, setStudentList] = useState('');

   // Custom Item State
   const [showCustomModal, setShowCustomModal] = useState(false);
   const [customItemName, setCustomItemName] = useState('');
   const [customItemQty, setCustomItemQty] = useState(1);

   // Load History and Bookings
   useEffect(() => {
      fetchHistory();
      fetchBookings();

      const subs1 = supabase
         .channel('requests-changes')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'pedagogical_requests' }, fetchHistory)
         .subscribe();

      const subs2 = supabase
         .channel('bookings-changes')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchBookings)
         .subscribe();

      return () => {
         subs1.unsubscribe();
         subs2.unsubscribe();
      };
   }, []);

   const fetchHistory = async () => {
      const { data } = await supabase
         .from('pedagogical_requests')
         .select('*')
         .order('created_at', { ascending: false });

      if (data) {
         const mapped: PedagogicalMaterialRequest[] = data.map(d => ({
            id: d.id,
            date: d.created_at,
            teacherName: d.teacher_name, // Using text column for now
            status: d.status,
            reason: d.reason,
            timestamp: new Date(d.created_at).getTime(),
            items: d.items_json
         }));
         setHistory(mapped);
      }
   };

   const fetchBookings = async () => {
      const { data } = await supabase
         .from('bookings')
         .select('*')
         .eq('resource_type', 'EQUIPMENT');

      if (data) {
         const mapped: EquipmentBooking[] = data.map(b => ({
            id: b.id,
            equipmentId: b.resource_id,
            equipmentName: HEADPHONE_KITS.find(k => k.id === b.resource_id)?.name || b.resource_id,
            date: b.date,
            shift: b.shift as Shift,
            teacherName: b.user_name,
            className: b.purpose, // Storing className in 'purpose' or 'meta'? Let's usage 'purpose' for now as logic in booking component
            status: b.status,
            timestamp: new Date(b.created_at).getTime(),
            studentList: b.description // Mapping description to studentList
         }));
         setEquipmentBookings(mapped);
      }
   };

   // Filter Catalog
   const filteredCatalog = useMemo(() => {
      return stockCatalog.filter(item => {
         const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
         const matchesCategory = activeCategory === 'TODOS' || item.category === activeCategory;
         return matchesSearch && matchesCategory;
      });
   }, [stockCatalog, searchTerm, activeCategory]);

   const categories = useMemo(() => {
      const cats = new Set(stockCatalog.map(i => i.category));
      return ['TODOS', ...Array.from(cats)];
   }, [stockCatalog]);

   const addToCart = (item: any) => {
      setCart(prev => {
         const existing = prev.find(c => c.materialId === item.id);
         if (existing) {
            return prev.map(c => c.materialId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
         }
         return [...prev, { materialId: item.id, materialName: item.name, quantity: 1, unit: item.unit }];
      });
   };

   const removeFromCart = (id: string) => {
      setCart(prev => prev.filter(i => i.materialId !== id));
   };

   const updateCartQuantity = (id: string, qty: number) => {
      setCart(prev => prev.map(c => c.materialId === id ? { ...c, quantity: Math.max(1, qty) } : c));
   };

   const handleSendRequest = async () => {
      if (cart.length === 0) return alert("Selecione ao menos um item.");
      if (!reason.trim()) return alert("Por favor, informe o motivo da solicitação.");

      try {
         const { error } = await supabase.from('pedagogical_requests').insert([{
            teacher_name: 'PROF. CRISTIANO',
            items_json: cart,
            reason: reason,
            status: 'PENDENTE'
         }]);

         if (error) throw error;

         setCart([]);
         setReason('');
         alert("Solicitação de materiais enviada com sucesso!");
         setActiveMode('history');
      } catch (e) {
         console.error(e);
         alert("Erro ao enviar solicitação.");
      }
   };

   const handleBooking = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeSlot || !targetClass) return;

      // Client-side conflict check (optimistic)
      const conflict = equipmentBookings.find(b =>
         b.date === bookingDate &&
         b.shift === activeSlot.shift &&
         b.equipmentId === activeSlot.kitId &&
         b.status !== 'RECUSADO'
      );

      if (conflict) {
         return alert(`Este kit já está reservado por ${conflict.teacherName} para este dia e turno.`);
      }

      try {
         const { error } = await supabase.from('bookings').insert([{
            resource_id: activeSlot.kitId,
            resource_type: 'EQUIPMENT',
            date: bookingDate,
            shift: activeSlot.shift,
            user_name: 'PROF. CRISTIANO',
            purpose: targetClass.toUpperCase(), // Using purpose for class name
            description: studentList, // Already a JSON string from the grid
            status: 'SOLICITADO'
         }]);

         if (error) throw error;

         setActiveSlot(null);
         setTargetClass('');
         setStudentList('');
         alert("Reserva de kit solicitada ao Almoxarifado!");
      } catch (err) {
         console.error(err);
         alert("Erro ao realizar reserva.");
      }
   };

   const handleAddCustomItem = () => {
      if (!customItemName.trim()) return alert("Informe o nome do material.");
      if (customItemQty < 1) return alert("Quantidade inválida.");

      setCart(prev => [
         ...prev,
         {
            materialId: `custom-${Date.now()}`,
            materialName: customItemName.toUpperCase(),
            quantity: customItemQty,
            unit: 'UNID',
            isCustom: true
         }
      ]);
      setCustomItemName('');
      setCustomItemQty(1);
      setShowCustomModal(false);
   };

   return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

         {/* SELETOR DE MODO DE SOLICITAÇÃO */}
         <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
               <button
                  onClick={() => setActiveMode('consumables')}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeMode === 'consumables' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
               >
                  Materiais de Consumo
               </button>
               <button
                  onClick={() => setActiveMode('equipment')}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeMode === 'equipment' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
               >
                  Kits de T.I.
               </button>
               <button
                  onClick={() => setActiveMode('history')}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeMode === 'history' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
               >
                  Minhas Requisições
               </button>
            </div>
            <div className="hidden lg:flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
               <ShieldAlert size={14} className="text-amber-600" />
               <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Requisição Direta Almoxarifado</span>
            </div>
         </div>

         {activeMode === 'consumables' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               {/* CATÁLOGO DE MATERIAIS */}
               <div className="xl:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                     <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-col gap-4 w-full md:w-auto">
                           <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                              {categories.map(cat => (
                                 <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-amber-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                 >
                                    {cat}
                                 </button>
                              ))}
                           </div>
                           <button
                              onClick={() => setShowCustomModal(true)}
                              className="w-full md:w-auto px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                           >
                              <Plus size={14} /> Solicitar Outro Material
                           </button>
                        </div>
                        <div className="relative w-full md:w-64">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                           <input
                              type="text"
                              placeholder="Filtrar por nome..."
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCatalog.map(item => (
                           <div key={item.id} className="group p-5 bg-gray-50 rounded-[2rem] border border-transparent hover:border-amber-200 hover:bg-white transition-all flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 group-hover:text-amber-600 transition-colors">
                                    <Package size={20} />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-gray-900 uppercase leading-tight">{item.name}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{item.category} | {item.unit}</p>
                                 </div>
                              </div>
                              <button onClick={() => addToCart(item)} className="p-2.5 bg-white text-gray-300 hover:bg-amber-600 hover:text-white rounded-xl shadow-sm transition-all">
                                 <Plus size={18} />
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* CARRINHO DA REQUISIÇÃO */}
               <div className="space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 sticky top-8">
                     <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                           <ShoppingBag size={18} className="text-amber-600" /> Resumo do Pedido
                        </h3>
                        <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-3 py-1 rounded-full uppercase">{cart.length} Itens</span>
                     </div>

                     <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {cart.map(item => (
                           <div key={item.materialId} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                              <div className="flex-1 min-w-0 pr-4">
                                 <p className="text-[10px] font-black text-gray-900 uppercase truncate">
                                    {item.materialName}
                                    {item.isCustom && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[7px]">EXTRA</span>}
                                 </p>
                                 <p className="text-[8px] text-gray-400 font-bold uppercase">{item.unit}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => updateCartQuantity(item.materialId, parseInt(e.target.value))}
                                    className="w-12 text-center bg-white border border-gray-200 rounded-lg py-1 text-[10px] font-black outline-none focus:border-amber-500"
                                 />
                                 <button onClick={() => removeFromCart(item.materialId)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           </div>
                        ))}
                        {cart.length === 0 && (
                           <div className="py-12 text-center text-gray-300">
                              <Box size={40} className="mx-auto mb-2 opacity-20" />
                              <p className="text-[10px] font-black uppercase">Nenhum item selecionado</p>
                           </div>
                        )}
                     </div>

                     <div className="space-y-4 pt-4 border-t border-gray-50">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Motivo da Solicitação</label>
                           <textarea
                              value={reason}
                              onChange={e => setReason(e.target.value)}
                              placeholder="Informe para qual atividade pedagógica estes materiais serão destinados..."
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold outline-none h-24 resize-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all"
                           />
                        </div>
                        <button
                           onClick={handleSendRequest}
                           disabled={cart.length === 0}
                           className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-600/20 hover:bg-amber-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           <Send size={16} /> Solicitar Materiais
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeMode === 'equipment' && (
            <div className="space-y-8">
               <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-6">
                     <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl shadow-lg">
                        <Headphones size={32} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Kits Eletrônicos (T.I.)</h3>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão de fones e kits de apoio à aprendizagem</p>
                     </div>
                  </div>
                  <div className="space-y-1.5 w-full md:w-64">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data da Reserva</label>
                     <input
                        type="date"
                        value={bookingDate}
                        onChange={e => setBookingDate(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {HEADPHONE_KITS.map(kit => (
                     <div key={kit.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                        <div className="space-y-6">
                           <div className="flex justify-between items-start">
                              <h4 className="text-2xl font-black text-gray-900">{kit.name}</h4>
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase border border-blue-100">{kit.units} UNIDADES</span>
                           </div>

                           <div className="space-y-3">
                              {SHIFTS.map(shift => {
                                 const isBooked = equipmentBookings.find(b => b.date === bookingDate && b.shift === shift && b.equipmentId === kit.id && b.status !== 'RECUSADO');
                                 return (
                                    <button
                                       key={shift}
                                       disabled={!!isBooked}
                                       onClick={() => setActiveSlot({ kitId: kit.id, kitName: kit.name, shift })}
                                       className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${isBooked ? 'bg-red-50 border-red-100 opacity-70 cursor-not-allowed' : 'bg-gray-50 border-transparent hover:border-blue-500 hover:bg-white group/slot'
                                          }`}
                                    >
                                       <span className={`text-[10px] font-black uppercase tracking-widest ${isBooked ? 'text-red-400' : 'text-gray-400 group-hover/slot:text-blue-600'}`}>{shift}</span>
                                       {isBooked ? (
                                          <span className="text-[10px] font-black text-red-600 uppercase">Ocupado</span>
                                       ) : (
                                          <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase">
                                             <CheckCircle2 size={12} /> Disponível
                                          </div>
                                       )}
                                    </button>
                                 );
                              })}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {activeMode === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                        <History size={20} className="text-amber-600" /> Histórico de Materiais
                     </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                     {history.map(req => (
                        <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors group">
                           <div className="flex items-center gap-6">
                              <div className={`p-4 rounded-2xl ${req.status === 'PENDENTE' ? 'bg-amber-100 text-amber-600' :
                                 req.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-700' :
                                    req.status === 'ENTREGUE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'
                                 }`}>
                                 <Box size={24} />
                              </div>
                              <div>
                                 <div className="flex items-center gap-3">
                                    <h4 className="text-sm font-black text-gray-900 uppercase">{new Date(req.date).toLocaleDateString('pt-BR')}</h4>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${req.status === 'PENDENTE' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                       req.status === 'APROVADO' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                          req.status === 'ENTREGUE' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-red-50 border-red-100 text-red-600'
                                       }`}>{req.status}</span>
                                 </div>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{req.items.length} itens no pedido</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-bold text-gray-300 uppercase">Finalidade:</p>
                              <p className="text-xs text-gray-600 italic">"{req.reason}"</p>
                           </div>
                        </div>
                     ))}
                     {history.length === 0 && (
                        <div className="py-24 text-center">
                           <FileText size={48} className="mx-auto mb-4 text-gray-200" />
                           <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Sem registros no histórico</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* HISTÓRICO DE RESERVAS DE T.I. */}
               <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8 flex items-center gap-3">
                     <Monitor size={20} className="text-blue-600" /> Reservas de Equipamentos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {equipmentBookings.filter(b => b.teacherName === 'PROF. CRISTIANO').map(b => (
                        <div key={b.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-blue-200 transition-all">
                           <div>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{b.equipmentName}</p>
                              <p className="text-sm font-bold text-gray-800 uppercase">{new Date(b.date).toLocaleDateString('pt-BR')} • {b.shift}</p>
                              <div className="flex items-center gap-2 mt-2">
                                 <span className="text-[8px] font-black bg-gray-200 text-gray-500 px-2 py-0.5 rounded uppercase">{b.className}</span>
                                 <span className={`text-[8px] font-black uppercase ${b.status === 'RETIRADO' ? 'text-blue-600' : b.status === 'DEVOLVIDO' ? 'text-emerald-600' : 'text-amber-600'
                                    }`}>{b.status}</span>
                              </div>
                           </div>
                           <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-blue-50 transition-colors">
                              {b.status === 'DEVOLVIDO' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <Clock className="text-amber-500" size={20} />}
                           </div>
                        </div>
                     ))}
                     {equipmentBookings.filter(b => b.teacherName === 'PROF. CRISTIANO').length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-300">
                           <p className="text-[10px] font-black uppercase">Nenhum agendamento realizado</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* MODAL RESERVA EQUIPAMENTO */}
         {activeSlot && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl border border-blue-100 overflow-hidden flex flex-col">
                  <div className="p-8 bg-blue-50 border-b border-blue-100 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-lg">
                           <Calendar size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Reservar Kit T.I.</h3>
                           <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">{activeSlot.kitName} • {activeSlot.shift}</p>
                        </div>
                     </div>
                     <button onClick={() => setActiveSlot(null)} className="p-2 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleBooking} className="p-10 space-y-8">
                     <div className="space-y-6">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma de Destino</label>
                           <input
                              required
                              type="text"
                              placeholder="EX: 8º ANO B"
                              value={targetClass}
                              onChange={e => setTargetClass(e.target.value)}
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all uppercase"
                           />
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mapeamento de Fones (Opcional)</label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto p-4 bg-gray-50 rounded-[2rem] border border-gray-100 custom-scrollbar">
                              {Array.from({ length: 30 }).map((_, i) => {
                                 const headphoneNumber = i + 1;
                                 let currentMapping: Record<number, string> = {};
                                 try {
                                    currentMapping = JSON.parse(studentList);
                                 } catch {
                                    // Handle empty
                                 }

                                 return (
                                    <div key={headphoneNumber} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-100">
                                       <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0">
                                          {headphoneNumber < 10 ? `0${headphoneNumber}` : headphoneNumber}
                                       </div>
                                       <input
                                          type="text"
                                          placeholder="Nome do Aluno..."
                                          value={currentMapping[headphoneNumber] || ''}
                                          onChange={(e) => {
                                             const newMapping = { ...currentMapping, [headphoneNumber]: e.target.value.toUpperCase() };
                                             setStudentList(JSON.stringify(newMapping));
                                          }}
                                          className="flex-1 bg-transparent font-bold text-[10px] outline-none uppercase placeholder:text-gray-300"
                                       />
                                    </div>
                                 );
                              })}
                           </div>
                           <p className="text-[9px] text-gray-400 font-medium italic ml-2">Relacione cada aluno ao número do fone que ele irá utilizar.</p>
                        </div>

                        <div className="p-6 bg-blue-900 rounded-[2rem] text-white space-y-3">
                           <div className="flex items-center gap-2 text-blue-400">
                              <AlertCircle size={16} />
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Compromisso do Docente</h4>
                           </div>
                           <p className="text-[10px] font-medium text-blue-100/70 leading-relaxed italic">
                              "Ao reservar, declaro estar ciente de que a integridade física dos equipamentos é de minha inteira responsabilidade durante o período de uso em sala."
                           </p>
                        </div>
                     </div>

                     <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-blue-700 active:scale-95 transition-all">
                        Finalizar Agendamento
                     </button>
                  </form>
               </div>
            </div>
         )}

         {/* MODAL SOLICITAÇÃO PERSONALIZADA */}
         {showCustomModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-amber-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl border border-amber-100 overflow-hidden flex flex-col">
                  <div className="p-8 bg-amber-50 border-b border-amber-100 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="p-4 bg-amber-500 text-white rounded-3xl shadow-lg">
                           <Plus size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Item Extra</h3>
                           <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">Solicitar material não listado</p>
                        </div>
                     </div>
                     <button onClick={() => setShowCustomModal(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="p-10 space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Material</label>
                        <input
                           autoFocus
                           type="text"
                           placeholder="Ex: Cartolina Laminada Dourada"
                           value={customItemName}
                           onChange={e => setCustomItemName(e.target.value)}
                           className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all uppercase"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantidade</label>
                        <input
                           type="number"
                           min="1"
                           value={customItemQty}
                           onChange={e => setCustomItemQty(parseInt(e.target.value))}
                           className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all"
                        />
                     </div>

                     <button
                        onClick={handleAddCustomItem}
                        className="w-full py-5 bg-amber-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-amber-700 active:scale-95 transition-all"
                     >
                        Adicionar ao Pedido
                     </button>
                  </div>
               </div>
            </div>
         )}
         <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(217, 119, 6, 0.2); border-radius: 10px; }
      `}</style>
      </div>
   );
};

export default TeacherPedagogicalRequests;
