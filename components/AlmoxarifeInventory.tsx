
import React, { useState, useEffect, useMemo } from 'react';
import {
   Box,
   Search,
   Plus,
   Trash2,
   AlertTriangle,
   CheckCircle2,
   RefreshCw,
   ChevronRight,
   Filter,
   PackagePlus,
   Minus,
   X,
   History,
   FileText
} from 'lucide-react';

import { supabase } from '../supabaseClient';
import { useToast } from './Toast';

interface StockItem {
   id: string;
   name: string;
   category: string;
   unit: string;
   current: number;
   min: number;
}

const AlmoxarifeInventory: React.FC = () => {
   const { addToast } = useToast();
   const [items, setItems] = useState<StockItem[]>([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
   const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'reports'>('inventory');
   const [movements, setMovements] = useState<any[]>([]);
   const [studentCounts, setStudentCounts] = useState<{ [key: string]: number }>({});
   const [isReportLoading, setIsReportLoading] = useState(false);
   const [newItem, setNewItem] = useState({ name: '', category: 'PEDAGOGICO', unit: 'UN', current: 0, min: 5 });
   const [stockInForm, setStockInForm] = useState({
      itemId: '',
      itemName: '', // For creating new from modal
      category: 'PEDAGOGICO', // For creating new from modal
      unit: 'UN', // For creating new from modal
      isNewItem: false,
      quantity: 1,
      supplier: '',
      invoice: '',
      date: new Date().toISOString().split('T')[0]
   });

   const fetchItems = async () => {
      try {
         const { data, error } = await supabase
            .from('almoxarifado_items')
            .select('*')
            .order('name');

         if (data) {
            setItems(data.map(i => ({
               id: i.id,
               name: i.name,
               category: i.category || 'GERAL',
               unit: i.unit,
               current: i.quantity,
               min: i.min_quantity
            })));
         }
      } catch (error) {
         console.error("Erro ao buscar estoque:", error);
      }
   };

   const fetchMovements = async () => {
      try {
         const { data, error } = await supabase
            .from('almoxarifado_movements')
            .select('*, almoxarifado_items(name, unit)')
            .order('created_at', { ascending: false });
         if (data) setMovements(data);
      } catch (error) {
         console.error("Erro ao buscar histórico:", error);
      }
   };

   const fetchStudentCounts = async () => {
      setIsReportLoading(true);
      try {
         // Count students by grade from classrooms and enrollments
         const { data, error } = await supabase
            .from('classrooms')
            .select(`
               name,
               enrollments (count)
            `);

         if (data) {
            const counts: { [key: string]: number } = {};
            data.forEach((c: any) => {
               const yearMatch = c.name.match(/(\d+º\s*ANO)/i);
               if (yearMatch) {
                  const grade = yearMatch[1].toUpperCase();
                  counts[grade] = (counts[grade] || 0) + (c.enrollments?.[0]?.count || 0);
               }
            });
            setStudentCounts(counts);
         }
      } catch (error) {
         console.error("Erro ao buscar contagem de alunos:", error);
      } finally {
         setIsReportLoading(false);
      }
   };

   useEffect(() => {
      fetchItems();
      fetchMovements();
      fetchStudentCounts();

      const channel = supabase
         .channel('warehouse_stock_sync')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'almoxarifado_items' }, fetchItems)
         .on('postgres_changes', { event: '*', schema: 'public', table: 'almoxarifado_movements' }, fetchMovements)
         .subscribe();

      return () => { channel.unsubscribe(); };
   }, []);

   const updateStock = async (id: string, amount: number) => {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const newQuantity = Math.max(0, item.current + amount);

      try {
         // 1. Update Item
         const { error } = await supabase
            .from('almoxarifado_items')
            .update({ quantity: newQuantity })
            .eq('id', id);

         if (error) throw error;

         // 2. Register Movement (Simples ajuste rápido)
         await supabase.from('almoxarifado_movements').insert([{
            item_id: id,
            type: amount > 0 ? 'ENTRADA' : 'SAIDA',
            quantity: Math.abs(amount),
            requester: 'ALMOXARIFE (AJUSTE RÁPIDO)',
            observations: 'Ajuste manual no inventário'
         }]);

      } catch (error) {
         console.error("Erro ao atualizar estoque:", error);
         addToast("Erro ao atualizar estoque.", "error");
      }
   };

   const handleAddItem = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         const { error } = await supabase.from('almoxarifado_items').insert([{
            name: newItem.name.toUpperCase(),
            category: newItem.category,
            unit: newItem.unit,
            quantity: newItem.current,
            min_quantity: newItem.min
         }]);

         if (error) throw error;

         setIsModalOpen(false);
         setNewItem({ name: '', category: 'PEDAGOGICO', unit: 'UN', current: 0, min: 5 });
         addToast("Item adicionado com sucesso!", "success");
         fetchItems();
      } catch (error) {
         console.error("Erro ao adicionar item:", error);
         addToast("Erro ao adicionar item.", "error");
      }
   };

   const handleStockIn = async (e: React.FormEvent) => {
      e.preventDefault();

      let targetItemId = stockInForm.itemId;

      try {
         // 1. If it's a new item, create it first
         if (stockInForm.isNewItem) {
            const { data, error: itemError } = await supabase
               .from('almoxarifado_items')
               .insert([{
                  name: stockInForm.itemName.toUpperCase(),
                  category: stockInForm.category,
                  unit: stockInForm.unit,
                  quantity: 0, // Will be updated by movements/stock-in logic
                  min_quantity: 5
               }])
               .select()
               .single();

            if (itemError) throw itemError;
            targetItemId = data.id;
         }

         if (!targetItemId) {
            addToast("Selecione ou crie um produto.", "warning");
            return;
         }

         const item = items.find(i => i.id === targetItemId) || { current: 0 };

         // 2. Update Stock
         const { error: updateError } = await supabase
            .from('almoxarifado_items')
            .update({ quantity: (item.current || 0) + stockInForm.quantity })
            .eq('id', targetItemId);

         if (updateError) throw updateError;

         // 3. Register Movement
         const { error: insertError } = await supabase
            .from('almoxarifado_movements')
            .insert([{
               item_id: targetItemId,
               type: 'ENTRADA',
               quantity: stockInForm.quantity,
               requester: `FORNECEDOR: ${stockInForm.supplier.toUpperCase()}`,
               observations: `Doc: ${stockInForm.invoice.toUpperCase() || 'S/ NF'}`
            }]);

         if (insertError) throw insertError;

         setIsStockInModalOpen(false);
         setStockInForm({
            itemId: '',
            itemName: '',
            category: 'PEDAGOGICO',
            unit: 'UN',
            isNewItem: false,
            quantity: 1,
            supplier: '',
            invoice: '',
            date: new Date().toISOString().split('T')[0]
         });
         addToast("Entrada registrada com sucesso!", "success");
         fetchItems();
         fetchMovements();
      } catch (error) {
         console.error("Erro ao registrar entrada:", error);
         addToast("Erro ao registrar entrada.", "error");
      }
   };

   const criticalItems = useMemo(() => items.filter(i => i.current < i.min), [items]);

   return (
      <div className="space-y-8 animate-in fade-in duration-500">

         {/* KPI CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg backdrop-blur-md">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total de Itens</p>
               <p className="text-3xl font-black text-white mt-1">{items.length}</p>
            </div>
            <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 shadow-lg backdrop-blur-md">
               <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Reposição Urgente</p>
               <p className="text-3xl font-black text-red-400 mt-1">{criticalItems.length}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 p-6 rounded-3xl shadow-xl border border-white/10">
               <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Consumo Estimado Mês</p>
               <p className="text-3xl font-black text-white mt-1">ALTO</p>
            </div>
         </div>

         {/* TAB SELECTOR */}
         <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/10 backdrop-blur-md">
            <button
               onClick={() => setActiveTab('inventory')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'inventory' ? 'bg-orange-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
               <Box size={14} /> Inventário Físico
            </button>
            <button
               onClick={() => setActiveTab('history')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'history' ? 'bg-orange-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
               <History size={14} /> Histórico de Entradas
            </button>
            <button
               onClick={() => setActiveTab('reports')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'reports' ? 'bg-orange-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
               <FileText size={14} /> Relatório de Atendimento
            </button>
         </div>

         {/* SEARCH AND TOOLS */}
         {activeTab === 'inventory' && (
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="relative flex-1 w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                     type="text"
                     placeholder="Pesquisar material no estoque..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl font-bold text-sm text-white outline-none focus:bg-white/10 focus:border-orange-500/50 transition-all placeholder-white/20"
                  />
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setIsStockInModalOpen(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-700 shadow-lg border border-white/10">
                     <Plus size={16} /> Registrar Entrada
                  </button>
                  <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-orange-700 shadow-lg border border-white/10">
                     <PackagePlus size={16} /> Novo Item
                  </button>
               </div>
            </div>
         )}

         {/* INVENTORY LIST */}
         {activeTab === 'inventory' && (
            <div className="bg-white/5 rounded-[3rem] border border-white/10 shadow-lg overflow-hidden backdrop-blur-md">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">
                        <th className="px-8 py-5">Descrição do Material</th>
                        <th className="px-8 py-5 text-center">Categoria</th>
                        <th className="px-8 py-5 text-center">Saldo Atual</th>
                        <th className="px-8 py-5 text-center">Mínimo</th>
                        <th className="px-8 py-5 text-right">Ajuste Rápido</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => {
                        const isCritical = item.current < item.min;
                        return (
                           <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${isCritical ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                       <Box size={20} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-white uppercase">{item.name}</p>
                                       <p className="text-[9px] text-white/40 font-bold uppercase">{item.unit}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <span className="px-3 py-1 bg-white/10 text-white/60 rounded-lg text-[9px] font-black uppercase">{item.category}</span>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <p className={`text-lg font-black ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>{item.current}</p>
                                 {isCritical && <p className="text-[7px] font-black text-red-300 uppercase tracking-tighter animate-pulse">Crítico</p>}
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <p className="text-sm font-bold text-white/30">{item.min}</p>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => updateStock(item.id, -1)} className="p-2 bg-white/5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg border border-white/5 transition-all"><Minus size={14} /></button>
                                    <button onClick={() => updateStock(item.id, 1)} className="p-2 bg-white/5 text-white/40 hover:text-emerald-400 hover:bg-white/10 rounded-lg border border-white/5 transition-all"><Plus size={14} /></button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         )}

         {/* HISTORY LIST */}
         {activeTab === 'history' && (
            <div className="bg-white/5 rounded-[3rem] border border-white/10 shadow-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-500 backdrop-blur-md">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">
                        <th className="px-8 py-5">Data / Hora</th>
                        <th className="px-8 py-5">Material</th>
                        <th className="px-8 py-5 text-center">Quantidade</th>
                        <th className="px-8 py-5">Fornecedor / Origem</th>
                        <th className="px-8 py-5 text-right">Documento</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {movements.filter(m => m.type === 'ENTRADA').map(mov => (
                        <tr key={mov.id} className="hover:bg-white/5 transition-colors group">
                           <td className="px-8 py-6">
                              <p className="text-xs font-bold text-white/80">{new Date(mov.created_at).toLocaleString('pt-BR')}</p>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><FileText size={16} /></div>
                                 <div>
                                    <p className="text-xs font-black text-white uppercase">{(mov.almoxarifado_items as any)?.name}</p>
                                    <p className="text-[9px] text-white/40 font-bold uppercase">{(mov.almoxarifado_items as any)?.unit}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black border border-emerald-500/20">+{mov.quantity}</span>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-[10px] font-bold text-white/60 uppercase">{mov.requester.replace('FORNECEDOR: ', '')}</p>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <p className="text-[10px] font-black text-white/30 uppercase tracking-tighter">{mov.observations.replace('Doc: ', '') || '---'}</p>
                           </td>
                        </tr>
                     ))}
                     {movements.filter(m => m.type === 'ENTRADA').length === 0 && (
                        <tr>
                           <td colSpan={5} className="py-24 text-center">
                              <History size={48} className="mx-auto mb-4 text-white/20" />
                              <p className="text-white/30 font-black uppercase text-xs tracking-widest">Nenhuma entrada registrada</p>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         )}

         {/* REPORTS TAB */}
         {activeTab === 'reports' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-end">
                     <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase">Cruzamento: Livro vs Aluno</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase mt-1">Comparativo entre estoque disponível e total de alunos enturmados</p>
                     </div>
                     <button onClick={fetchStudentCounts} className={`p-3 bg-gray-50 text-gray-400 hover:text-orange-600 rounded-2xl transition-all ${isReportLoading ? 'animate-spin' : ''}`}>
                        <RefreshCw size={20} />
                     </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-gray-50">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                              <th className="px-6 py-4">Ano / Série</th>
                              <th className="px-6 py-4 text-center">Total de Alunos</th>
                              <th className="px-6 py-4 text-center">Livros em Estoque</th>
                              <th className="px-6 py-4 text-center">Saldo</th>
                              <th className="px-6 py-4 text-right">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {['6º ANO', '7º ANO', '8º ANO', '9º ANO'].map(grade => {
                              const studentCount = studentCounts[grade] || 0;
                              const bookItem = items.find(i => i.name === `LIVRO DO ESTUDANTE - ${grade}`);
                              const stockCount = bookItem?.current || 0;
                              const balance = stockCount - studentCount;
                              const isMissing = balance < 0;

                              return (
                                 <tr key={grade} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                       <p className="font-black text-gray-900">{grade}</p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                       <p className="font-bold text-gray-600">{studentCount}</p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                       <p className="font-bold text-emerald-600">{stockCount}</p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                       <p className={`font-black ${isMissing ? 'text-red-600' : 'text-emerald-700'}`}>
                                          {balance > 0 ? `+${balance}` : balance}
                                       </p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                       {isMissing ? (
                                          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase flex items-center justify-end gap-1 ml-auto w-fit">
                                             <AlertTriangle size={12} /> Faltando
                                          </span>
                                       ) : (
                                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase flex items-center justify-end gap-1 ml-auto w-fit">
                                             <CheckCircle2 size={12} /> Atendido
                                          </span>
                                       )}
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-start gap-4">
                     <AlertTriangle className="text-orange-600 mt-1" size={24} />
                     <div>
                        <p className="text-xs font-black text-orange-900 uppercase">Atenção ao Planejamento</p>
                        <p className="text-[10px] text-orange-600 font-bold leading-relaxed mt-1 uppercase">
                           Este relatório baseia-se exclusivamente nos alunos enturmados no módulo Secretaria.
                           Garantir que todas as transferências e desistências estejam atualizadas para um cálculo preciso.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL ADD ITEM */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 space-y-6">
                  <h3 className="text-xl font-black text-gray-900 uppercase">Novo Material</h3>
                  <form onSubmit={handleAddItem} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome do Item</label>
                        <input required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white border border-transparent focus:border-orange-200 transition-all" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Categoria</label>
                           <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs uppercase outline-none">
                              <option value="PEDAGOGICO">Pedagógico</option>
                              <option value="ESTRUTURADO">Estruturado</option>
                              <option value="EXPEDIENTE">Expediente</option>
                              <option value="LIMPEZA">Limpeza</option>
                              <option value="ARTE">Arte</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Unidade</label>
                           <input required value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white border border-transparent focus:border-orange-200 transition-all" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Quantidade Inicial</label>
                           <input type="number" min="0" required value={newItem.current} onChange={e => setNewItem({ ...newItem, current: parseInt(e.target.value) })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none focus:bg-white border border-transparent focus:border-orange-200 transition-all" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Estoque Mínimo</label>
                           <input type="number" min="0" required value={newItem.min} onChange={e => setNewItem({ ...newItem, min: parseInt(e.target.value) })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none focus:bg-white border border-transparent focus:border-orange-200 transition-all" />
                        </div>
                     </div>
                     <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-xs hover:bg-gray-50 rounded-xl transition-all">Cancelar</button>
                        <button type="submit" className="flex-1 py-4 bg-orange-600 text-white font-black uppercase text-xs rounded-xl shadow-lg hover:bg-orange-700 transition-all">Salvar Item</button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* MODAL STOCK IN */}
         {isStockInModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 space-y-6">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xl font-black text-gray-900 uppercase flex items-center gap-3">
                        <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Plus size={20} /></span>
                        Registrar Entrada
                     </h3>
                     <button onClick={() => setIsStockInModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors"><X size={20} /></button>
                  </div>

                  <form onSubmit={handleStockIn} className="space-y-4">
                     <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
                        <button
                           type="button"
                           onClick={() => setStockInForm({ ...stockInForm, isNewItem: false })}
                           className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!stockInForm.isNewItem ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
                        >
                           Item Existente
                        </button>
                        <button
                           type="button"
                           onClick={() => setStockInForm({ ...stockInForm, isNewItem: true })}
                           className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${stockInForm.isNewItem ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
                        >
                           Novo Produto
                        </button>
                     </div>

                     {!stockInForm.isNewItem ? (
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Produto no Estoque</label>
                           <select required value={stockInForm.itemId} onChange={e => setStockInForm({ ...stockInForm, itemId: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-emerald-100 transition-all">
                              <option value="">Selecione o produto...</option>
                              {items.map(item => (
                                 <option key={item.id} value={item.id}>{item.name} (Saldo: {item.current} {item.unit})</option>
                              ))}
                           </select>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome do Novo Produto</label>
                              <input required value={stockInForm.itemName} onChange={e => setStockInForm({ ...stockInForm, itemName: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white border border-transparent focus:border-emerald-200" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Categoria</label>
                                 <select value={stockInForm.category} onChange={e => setStockInForm({ ...stockInForm, category: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white border border-transparent focus:border-emerald-200">
                                    <option value="PEDAGOGICO">Pedagógico</option>
                                    <option value="ESTRUTURADO">Estruturado</option>
                                    <option value="EXPEDIENTE">Expediente</option>
                                    <option value="LIMPEZA">Limpeza</option>
                                    <option value="ARTE">Arte</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Unidade</label>
                                 <input required value={stockInForm.unit} onChange={e => setStockInForm({ ...stockInForm, unit: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white border border-transparent focus:border-emerald-200" />
                              </div>
                           </div>
                        </div>
                     )}

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Quantidade</label>
                           <input type="number" min="1" required value={stockInForm.quantity} onChange={e => setStockInForm({ ...stockInForm, quantity: parseInt(e.target.value) })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data</label>
                           <input type="date" required value={stockInForm.date} onChange={e => setStockInForm({ ...stockInForm, date: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none" />
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fornecedor / Origem</label>
                        <input required placeholder="Ex: Secretaria de Educação, Fornecedor X..." value={stockInForm.supplier} onChange={e => setStockInForm({ ...stockInForm, supplier: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white border border-transparent focus:border-emerald-200 transition-all" />
                     </div>

                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nota Fiscal / Doc (Opcional)</label>
                        <input placeholder="Ex: NF 001234" value={stockInForm.invoice} onChange={e => setStockInForm({ ...stockInForm, invoice: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white border border-transparent focus:border-emerald-200 transition-all" />
                     </div>

                     <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black uppercase text-sm rounded-2xl shadow-xl hover:bg-emerald-700 shadow-emerald-200/50 transition-all transform active:scale-95">Confirmar Entrada</button>
                  </form>
               </div>
            </div>
         )}

      </div>
   );
};

export default AlmoxarifeInventory;
