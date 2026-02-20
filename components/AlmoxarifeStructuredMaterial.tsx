
import React, { useState, useEffect, useMemo } from 'react';
import {
   BookMarked,
   Search,
   Plus,
   Minus,
   ArrowUpCircle,
   ArrowDownCircle,
   ShieldCheck,
   X,
   History,
   PlusCircle,
   BookOpen,
   Tag,
   Palette,
   Layers,
   Users,
   Trash2,
   BookType,
   AlertTriangle,
   CheckCircle2,
   AlertCircle,
   UserCheck // Mantido
} from 'lucide-react';

interface StructuredMaterial {
   id: string;
   grade: string;
   category: string;
   type: string;
   current: number;
   totalEntries: number;
   totalExits: number;
   description?: string;
   bimestre?: string;
   targetAno?: string;
   bookType?: 'ESTUDANTE' | 'PROFESSOR';
   subCategory?: 'MULTIDISCIPLINAR' | 'ARTE' | 'INGLES';
}

import { supabase } from '../supabaseClient';
import { useToast } from './Toast';

const AlmoxarifeStructuredMaterial: React.FC = () => {
   const { addToast } = useToast();
   const [materials, setMaterials] = useState<StructuredMaterial[]>([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [activeSection] = useState<'ESTRUTURADO'>('ESTRUTURADO');
   const [activeCategory, setActiveCategory] = useState<'TODOS' | 'MULTIDISCIPLINAR' | 'ARTE' | 'INGLES'>('TODOS');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isRegModalOpen, setIsRegModalOpen] = useState(false);
   const [selectedMaterial, setSelectedMaterial] = useState<StructuredMaterial | null>(null);
   const [moveType, setMoveType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
   const [amount, setAmount] = useState<number | ''>('');
   const [observation, setObservation] = useState('');
   const [projects, setProjects] = useState<any[]>([]);
   const [gradeDemands, setGradeDemands] = useState<Record<string, { students: number, classes: number }>>({});
   const [newBookForm, setNewBookForm] = useState({
      bimestre: '1º BIMESTRE',
      ano: '6º ANO',
      tipo: 'ESTUDANTE' as 'ESTUDANTE' | 'PROFESSOR',
      categoria: 'MULTIDISCIPLINAR' as 'MULTIDISCIPLINAR' | 'ARTE' | 'INGLES',
      initialEntry: '' as number | '',
      initialExit: '' as number | '',
      observations: ''
   });

   const fetchMaterials = async () => {
      try {
         // 1. Fetch Items
         const { data: itemsData, error: itemsError } = await supabase
            .from('almoxarifado_items')
            .select('*')
            .eq('category', 'ESTRUTURADO');

         if (itemsError) throw itemsError;

         // 2. Fetch Movements Summary
         const { data: movementsData, error: movementsError } = await supabase
            .from('almoxarifado_movements')
            .select('*')
            .in('item_id', itemsData?.map(i => i.id) || []);

         if (movementsError) throw movementsError;

         setMaterials(itemsData.map(item => {
            let meta: any = {};
            try {
               meta = JSON.parse(item.description || '{}');
            } catch (e) {
               meta = { grade: 'N/A', subCategory: 'GERAL', type: 'ALUNO' };
            }

            const itemMovements = movementsData?.filter(m => m.item_id === item.id) || [];
            const entries = itemMovements.filter(m => m.type === 'ENTRADA').reduce((acc, m) => acc + m.quantity, 0);
            const exits = itemMovements.filter(m => m.type === 'SAIDA').reduce((acc, m) => acc + m.quantity, 0);

            return {
               id: item.id,
               grade: meta.grade || 'N/A',
               category: meta.subCategory || 'MULTIDISCIPLINAR',
               type: meta.type || 'ESTUDANTE',
               current: item.quantity,
               totalEntries: entries,
               totalExits: exits,
               description: meta.description || '',
               bimestre: meta.bimestre || 'N/A',
               targetAno: meta.grade || 'N/A',
               bookType: meta.type || 'ESTUDANTE',
               subCategory: meta.subCategory || 'MULTIDISCIPLINAR'
            } as any;
         }));

      } catch (error) {
         console.error("Erro ao buscar material estruturado:", error);
      }
   };

   const fetchProjects = async () => {
      const { data } = await supabase.from('pedagogical_projects').select('id, name');
      if (data) setProjects(data);
   };

   const fetchGradeDemands = async () => {
      try {
         const { data: classes } = await supabase.from('classrooms').select('id, name');
         const { data: enrolls } = await supabase.from('enrollments').select('classroom_id');

         if (classes && enrolls) {
            const demands: Record<string, { students: number, classes: number }> = {
               '6º ANO': { students: 0, classes: 0 },
               '7º ANO': { students: 0, classes: 0 },
               '8º ANO': { students: 0, classes: 0 },
               '9º ANO': { students: 0, classes: 0 },
               'MULTI-SÉRIE': { students: 0, classes: 0 }
            };

            classes.forEach(cls => {
               const studentCount = enrolls.filter(e => e.classroom_id === cls.id).length;
               let gradeKey = 'MULTI-SÉRIE';

               if (cls.name.includes('6º')) gradeKey = '6º ANO';
               else if (cls.name.includes('7º')) gradeKey = '7º ANO';
               else if (cls.name.includes('8º')) gradeKey = '8º ANO';
               else if (cls.name.includes('9º')) gradeKey = '9º ANO';

               demands[gradeKey].students += studentCount;
               demands[gradeKey].classes += 1; // 1 turma = 1 professor (estimativa)
            });
            setGradeDemands(demands);
         }
      } catch (error) {
         console.error("Erro ao buscar contagem de alunos:", error);
      }
   };

   useEffect(() => {
      fetchMaterials();
      fetchProjects();
      fetchGradeDemands();
      const subscription = supabase
         .channel('almoxarifado_structured_changes')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'almoxarifado_items' }, fetchMaterials)
         .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, fetchGradeDemands)
         .subscribe();
      return () => { subscription.unsubscribe(); };
   }, []);

   const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         const name = `CADERNO ${newBookForm.tipo} - ${newBookForm.ano} - ${newBookForm.bimestre}`;
         const entryQty = Number(newBookForm.initialEntry) || 0;
         const exitQty = Number(newBookForm.initialExit) || 0;
         const finalQty = entryQty - exitQty;

         const { data: itemData, error } = await supabase.from('almoxarifado_items').insert([{
            name: name,
            category: 'ESTRUTURADO',
            description: JSON.stringify({
               bimestre: newBookForm.bimestre,
               grade: newBookForm.ano,
               type: newBookForm.tipo,
               subCategory: newBookForm.categoria,
               observations: newBookForm.observations
            }),
            quantity: finalQty
         }]).select().single();

         if (error) throw error;

         // Adicionar movimentações iniciais para rastreabilidade
         const movements = [];
         if (entryQty > 0 && itemData) {
            movements.push({
               item_id: itemData.id,
               type: 'ENTRADA',
               quantity: entryQty,
               observation: 'CARGA INICIAL DE ENTRADA'
            });
         }
         if (exitQty > 0 && itemData) {
            movements.push({
               item_id: itemData.id,
               type: 'SAIDA',
               quantity: exitQty,
               observation: 'CARGA INICIAL DE SAÍDA'
            });
         }

         if (movements.length > 0) {
            await supabase.from('almoxarifado_movements').insert(movements);
         }

         await fetchMaterials();
         setIsRegModalOpen(false);
         setNewBookForm({
            bimestre: '1º BIMESTRE',
            ano: '6º ANO',
            tipo: 'ESTUDANTE',
            categoria: 'MULTIDISCIPLINAR',
            initialEntry: '',
            initialExit: '',
            observations: ''
         });
         alert("Material cadastrado com sucesso!");
      } catch (error) {
         console.error("Erro ao cadastrar material:", error);
         alert("Erro ao cadastrar material. Verifique os campos.");
      }
   };

   const handleMovement = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedMaterial || !amount) return;
      const num = Number(amount);

      if (moveType === 'EXIT' && selectedMaterial.current < num) {
         addToast("Saldo insuficiente no estoque!", 'error');
         return;
      }

      try {
         const newQuantity = moveType === 'ENTRY' ? selectedMaterial.current + num : selectedMaterial.current - num;
         const { error: updateError } = await supabase
            .from('almoxarifado_items')
            .update({ quantity: newQuantity })
            .eq('id', selectedMaterial.id);

         if (updateError) throw updateError;

         const { error: moveError } = await supabase.from('almoxarifado_movements').insert([{
            item_id: selectedMaterial.id,
            type: moveType === 'ENTRY' ? 'ENTRADA' : 'SAIDA',
            quantity: num,
            requester: 'ALMOXARIFE (LIVROS)',
            observations: observation || `${moveType === 'ENTRY' ? 'Entrada' : 'Distribuição'} de Livros`
         }]);

         if (moveError) throw moveError;

         await fetchMaterials();
         setIsModalOpen(false);
         setAmount('');
         setObservation('');
         setSelectedMaterial(null);
         addToast("Movimentação registrada!", 'success');

      } catch (error) {
         console.error("Erro:", error);
      }
   };

   const deleteBook = async (id: string) => {
      if (window.confirm("Deseja remover este item permanentemente?")) {
         try {
            await supabase.from('almoxarifado_movements').delete().eq('item_id', id);
            const { error } = await supabase.from('almoxarifado_items').delete().eq('id', id);
            if (error) throw error;
            await fetchMaterials();
         } catch (error) {
            console.error("Erro:", error);
         }
      }
   };

   const filtered = useMemo(() => {
      return materials.filter(m => {
         if (activeSection === 'PROJETOS' && !(m as any).isProject) return false;
         if (activeSection === 'ESTRUTURADO' && (m as any).isProject) return false;

         const matchSearch = (m.grade || '').includes(searchTerm) ||
            (m.category || '').includes(searchTerm.toUpperCase()) ||
            (m.bookTitle || '').toLowerCase().includes(searchTerm.toLowerCase());

         const matchCat = activeSection === 'PROJETOS' ? true : (activeCategory === 'TODOS' || m.category === activeCategory);
         return matchSearch && matchCat;
      });
   }, [materials, searchTerm, activeCategory, activeSection]);

   return (
      <div className="space-y-8 animate-in fade-in duration-500">

         {/* HEADER E FILTROS */}
         <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg shadow-orange-600/20">
                     <BookMarked size={32} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-white uppercase tracking-tight">Material Estruturado</h2>
                     <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão de remessas pedagógicas SEDUC</p>
                  </div>
               </div>
            </div>

            <div className="flex gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                     type="text"
                     placeholder="Buscar por ano, título ou categoria..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-12 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl font-bold text-sm text-white outline-none focus:bg-black/40 focus:border-orange-500/30 transition-all placeholder-white/20"
                  />
               </div>
               <div className="flex gap-2">
                  <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
                     {['TODOS', 'MULTIDISCIPLINAR', 'ARTE', 'INGLES'].map(s => (
                        <button
                           key={s}
                           onClick={() => setActiveCategory(s as any)}
                           className={`px-4 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${activeCategory === s ? 'bg-orange-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                           {s === 'INGLES' ? 'INGLÊS' : s}
                        </button>
                     ))}
                  </div>
                  <button
                     onClick={() => setIsRegModalOpen(true)}
                     className="px-6 py-3 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all shadow-lg border border-white/5"
                  >
                     <PlusCircle size={18} /> Novo Registro
                  </button>
               </div>
            </div>
         </div>

         {/* LISTA DE ITENS (ESTILO TABELA) */}
         <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
               <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                     <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Informações do Título</th>
                     <th className="px-6 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Bimestre</th>
                     <th className="px-6 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Ano/Série</th>
                     <th className="px-6 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Público</th>
                     <th className="px-6 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Demanda</th>
                     <th className="px-6 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Saldo</th>
                     <th className="px-6 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Suficiência</th>
                     <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {filtered.map(m => {
                     const gradeData = gradeDemands[m.targetAno] || { students: 0, classes: 0 };
                     const demand = m.bookType === 'PROFESSOR' ? gradeData.classes : gradeData.students;

                     let statusColor = 'emerald';
                     let statusText = 'Adequado';
                     let statusIcon = <ShieldCheck size={10} />;

                     if (m.current < demand) {
                        statusColor = 'red';
                        statusText = 'Déficit';
                        statusIcon = <X size={10} />;
                     } else if (m.current > demand) {
                        statusColor = 'amber';
                        statusText = 'Excesso';
                        statusIcon = <AlertTriangle size={10} />;
                     }

                     return (
                        <tr key={m.id} className="group hover:bg-white/5 transition-colors">
                           <td className="px-8 py-5">
                              <div className="flex flex-col">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${m.subCategory === 'ARTE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                       m.subCategory === 'INGLES' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                                          'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                       }`}>
                                       {m.subCategory || 'CADERNO'}
                                    </span>
                                    <h4 className="text-sm font-black text-white uppercase">
                                       {m.subCategory === 'MULTIDISCIPLINAR' ? 'Kit Multidisc.' :
                                          m.subCategory === 'ARTE' ? 'Livro de Arte' :
                                             m.subCategory === 'INGLES' ? 'Livro de Inglês' : 'Material'}
                                    </h4>
                                 </div>
                                 <p className="text-[10px] text-white/40 font-bold uppercase truncate max-w-[200px]">
                                    {m.description || 'REMESSA SEDUC'}
                                 </p>
                              </div>
                           </td>
                           <td className="px-6 py-5 text-center">
                              <span className="text-xs font-black text-white/80 uppercase tracking-tighter">
                                 {m.bimestre}
                              </span>
                           </td>
                           <td className="px-6 py-5 text-center">
                              <span className="text-xs font-black text-white/80 uppercase tracking-tighter">
                                 {m.targetAno}
                              </span>
                           </td>
                           <td className="px-6 py-5 text-center">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${m.bookType === 'PROFESSOR' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                 {m.bookType}
                              </span>
                           </td>
                           <td className="px-6 py-5 text-center">
                              <div className="flex flex-col items-center">
                                 <span className="text-xl font-black text-white">{demand}</span>
                                 <p className="text-[8px] text-white/40 font-black uppercase tracking-tighter">{m.bookType === 'PROFESSOR' ? 'TURMAS' : 'ALUNOS'}</p>
                              </div>
                           </td>
                           <td className="px-6 py-5 text-center">
                              <div className="flex flex-col items-center">
                                 <span className={`text-xl font-black ${m.current < demand ? 'text-red-400' : m.current > demand ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {m.current}
                                 </span>
                                 <p className="text-[8px] text-white/40 font-black uppercase tracking-tighter">EXEMPLARES</p>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex flex-col items-center gap-2">
                                 <div className="w-24 h-1.5 bg-black/20 rounded-full overflow-hidden border border-white/5">
                                    <div
                                       className={`h-full ${statusColor === 'emerald' ? 'bg-emerald-500' : statusColor === 'red' ? 'bg-red-500' : 'bg-amber-500'}`}
                                       style={{ width: `${Math.min(100, (m.current / (demand || 1)) * 100)}%` }}
                                    />
                                 </div>
                                 <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${statusColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : statusColor === 'red' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                    {statusIcon}
                                    {statusText}
                                 </span>
                              </div>
                           </td>
                           <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                 <button
                                    onClick={() => { setSelectedMaterial(m); setMoveType('ENTRY'); setIsModalOpen(true); }}
                                    className="p-3 bg-white/5 border border-white/10 text-white/60 hover:text-emerald-400 hover:border-emerald-500/30 rounded-xl transition-all shadow-sm"
                                    title="Registrar Entrada"
                                 >
                                    <ArrowUpCircle size={18} />
                                 </button>
                                 <button
                                    onClick={() => { setSelectedMaterial(m); setMoveType('EXIT'); setIsModalOpen(true); }}
                                    className="p-3 bg-white/5 border border-white/10 text-white/60 hover:text-orange-400 hover:border-orange-500/30 rounded-xl transition-all shadow-sm"
                                    title="Lançar Baixa/Saída"
                                 >
                                    <ArrowDownCircle size={18} />
                                 </button>
                                 <button
                                    onClick={() => deleteBook(m.id)}
                                    className="p-3 bg-white/5 border border-white/10 text-white/60 hover:text-red-400 hover:border-red-500/30 rounded-xl transition-all shadow-sm"
                                    title="Excluir Permanente"
                                 >
                                    <Trash2 size={18} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
            {filtered.length === 0 && (
               <div className="p-20 text-center">
                  <BookOpen size={48} className="mx-auto mb-4 text-white/10" />
                  <p className="text-white/20 font-black uppercase text-xs tracking-widest">Nenhum título encontrado com este filtro</p>
               </div>
            )}
         </div>

         {/* NOTA DE CONFORMIDADE */}
         <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-lg backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <ShieldCheck size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Modelo Multidisciplinar SEDUC-MT</p>
                  <h4 className="text-sm font-black text-white uppercase">Livros centralizados e Cadernos de Arte integrados</h4>
               </div>
            </div>
            <button className="px-6 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/20 transition-all border border-white/5">
               <History size={16} /> Ver Log de Remessas
            </button>
         </div>

         {/* MODAL MOVIMENTAÇÃO */}
         {isModalOpen && selectedMaterial && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-gray-900 rounded-[3.5rem] w-full max-w-md shadow-2xl border border-white/10 overflow-hidden flex flex-col">
                  <div className={`p-8 flex justify-between items-center border-b shrink-0 ${moveType === 'ENTRY' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                     <div className="flex items-center gap-4">
                        <div className={`p-3 text-white rounded-2xl shadow-lg ${moveType === 'ENTRY' ? 'bg-emerald-600' : 'bg-orange-600'}`}>
                           {moveType === 'ENTRY' ? <Plus size={24} /> : <Minus size={24} />}
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                              {moveType === 'ENTRY' ? 'Entrada de Volumes' : 'Distribuição / Saída'}
                           </h3>
                           <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${moveType === 'ENTRY' ? 'text-emerald-400' : 'text-orange-400'}`}>
                              {selectedMaterial.bimestre} • {selectedMaterial.targetAno} • {selectedMaterial.bookType}
                           </p>
                        </div>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleMovement} className="p-10 space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Quantidade de Exemplares</label>
                        <input
                           autoFocus
                           required
                           type="number"
                           placeholder="0"
                           value={amount}
                           onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                           className="w-full p-6 bg-black/20 border border-white/10 rounded-3xl font-black text-4xl text-center text-white outline-none focus:bg-black/40 focus:border-orange-500/30 transition-all placeholder-white/20"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Observações / Destino</label>
                        <input
                           type="text"
                           placeholder="EX: REMESSA RECEBIDA OU ENTREGA PARA TURMA B"
                           value={observation}
                           onChange={e => setObservation(e.target.value)}
                           className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none focus:bg-black/40 transition-all shadow-sm placeholder-white/20"
                        />
                     </div>

                     <div className="flex gap-4">
                        <button
                           type="submit"
                           className={`flex-1 py-5 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${moveType === 'ENTRY' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
                              }`}
                        >
                           Confirmar Lançamento
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* MODAL DE CADASTRO (PROJETOS) */}
         {isRegModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-gray-900 rounded-[3.5rem] w-full max-w-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">
                  <div className="p-8 bg-white/5 flex justify-between items-center border-b border-white/10">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-600/20">
                           <PlusCircle size={24} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Novo Registro de Material</h3>
                     </div>
                     <button onClick={() => setIsRegModalOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleRegister} className="p-10 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Bimestre</label>
                           <select
                              required
                              value={newBookForm.bimestre}
                              onChange={e => setNewBookForm({ ...newBookForm, bimestre: e.target.value })}
                              className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-black text-xs uppercase text-white outline-none focus:border-orange-500/50"
                           >
                              <option className="bg-gray-900">1º BIMESTRE</option>
                              <option className="bg-gray-900">2º BIMESTRE</option>
                              <option className="bg-gray-900">3º BIMESTRE</option>
                              <option className="bg-gray-900">4º BIMESTRE</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Ano / Série</label>
                           <select
                              required
                              value={newBookForm.ano}
                              onChange={e => setNewBookForm({ ...newBookForm, ano: e.target.value })}
                              className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-black text-xs uppercase text-white outline-none focus:border-orange-500/50"
                           >
                              <option className="bg-gray-900">6º ANO</option>
                              <option className="bg-gray-900">7º ANO</option>
                              <option className="bg-gray-900">8º ANO</option>
                              <option className="bg-gray-900">9º ANO</option>
                              <option className="bg-gray-900">MULTI-SÉRIE</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Público Alvo (Tipo)</label>
                           <select
                              required
                              value={newBookForm.tipo}
                              onChange={e => setNewBookForm({ ...newBookForm, tipo: e.target.value as any })}
                              className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-black text-xs uppercase text-white outline-none focus:border-orange-500/50"
                           >
                              <option value="ESTUDANTE" className="bg-gray-900">LIVRO DO ESTUDANTE</option>
                              <option value="PROFESSOR" className="bg-gray-900">LIVRO DO PROFESSOR</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Categoria</label>
                           <select
                              required
                              value={newBookForm.categoria}
                              onChange={e => setNewBookForm({ ...newBookForm, categoria: e.target.value as any })}
                              className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-black text-xs uppercase text-white outline-none focus:border-orange-500/50"
                           >
                              <option value="MULTIDISCIPLINAR" className="bg-gray-900">MULTIDISCIPLINAR</option>
                              <option value="ARTE" className="bg-gray-900">ARTE</option>
                              <option value="INGLES" className="bg-gray-900">INGLÊS</option>
                           </select>
                        </div>
                     </div>

                     {/* SMART DEMAND FEEDBACK */}
                     {(() => {
                        const gradeData = gradeDemands[newBookForm.ano] || { students: 0, classes: 0 };
                        const targetDemand = newBookForm.tipo === 'PROFESSOR' ? gradeData.classes : gradeData.students;
                        const currentTotal = (Number(newBookForm.initialEntry) || 0) - (Number(newBookForm.initialExit) || 0);
                        const diff = currentTotal - targetDemand;

                        if (targetDemand === 0) return null;

                        return (
                           <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                              <div>
                                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Demanda Estimada</p>
                                 <p className="text-lg font-black text-blue-300">{targetDemand} {newBookForm.tipo === 'PROFESSOR' ? 'TURMAS' : 'ALUNOS'}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Situação Prevista</p>
                                 <div className={`text-lg font-black flex items-center gap-1 justify-end ${diff < 0 ? 'text-red-400' : diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {diff === 0 ? <CheckCircle2 size={16} /> : diff < 0 ? <AlertCircle size={16} /> : <AlertTriangle size={16} />}
                                    {diff === 0 ? 'IDEAL' : diff > 0 ? `+${diff} (Excesso)` : `${diff} (Falta)`}
                                 </div>
                              </div>
                           </div>
                        );
                     })()}

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
                           <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Total Entradas</label>
                           <input
                              type="number"
                              required
                              min="0"
                              placeholder="0"
                              value={newBookForm.initialEntry}
                              onChange={e => setNewBookForm({ ...newBookForm, initialEntry: e.target.value === '' ? '' : Number(e.target.value) })}
                              className="w-full bg-transparent font-black text-4xl text-center outline-none text-white"
                           />
                        </div>
                        <div className="space-y-1.5 p-6 bg-orange-500/10 rounded-[2rem] border border-orange-500/20">
                           <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Total Saídas</label>
                           <input
                              type="number"
                              required
                              min="0"
                              placeholder="0"
                              value={newBookForm.initialExit}
                              onChange={e => setNewBookForm({ ...newBookForm, initialExit: e.target.value === '' ? '' : Number(e.target.value) })}
                              className="w-full bg-transparent font-black text-4xl text-center outline-none text-white"
                           />
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Observações Adicionais</label>
                        <textarea
                           placeholder="EX: REMESSA ESPECIAL OU DETALHES DO VOLUME..."
                           value={newBookForm.observations}
                           onChange={e => setNewBookForm({ ...newBookForm, observations: e.target.value })}
                           className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none focus:bg-black/40 transition-all shadow-sm h-24 resize-none placeholder-white/20"
                        />
                     </div>

                     <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-orange-700 transition-all">
                        <PlusCircle size={20} /> Concluir Cadastro
                     </button>
                  </form>
               </div>
            </div>
         )}

      </div>
   );
};

export default AlmoxarifeStructuredMaterial;
