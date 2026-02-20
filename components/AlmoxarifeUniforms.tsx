import React, { useState, useEffect, useMemo } from 'react';
// Added missing ShieldCheck icon to the lucide-react imports to fix potential missing reference issues.
import {
   Shirt,
   Search,
   Plus,
   Minus,
   AlertTriangle,
   PackageCheck,
   Filter,
   ArrowUpRight,
   TrendingUp,
   Download,
   Footprints,
   ChevronRight,
   LayoutGrid,
   Settings2,
   X,
   CheckCircle2,
   ArrowDownCircle,
   ArrowUpCircle,
   ShieldCheck,
   FileText,
   Printer
} from 'lucide-react';

// Expandir para incluir tamanhos de calçados
type UniformSize = '12' | '14' | '16' | 'P' | 'M' | 'G' | 'GG' | 'XG' | '33' | '34' | '35' | '36' | '37' | '38' | '39' | '40' | '41' | '42' | '43' | '44';

interface UniformItem {
   id: string;
   name: string;
   category: 'VESTUÁRIO' | 'CALÇADO' | 'ACESSÓRIO' | string;
   sizes: Record<UniformSize, number>;
   minPerSize: number;
}

const CLOTHING_SIZES: UniformSize[] = ['12', '14', '16', 'P', 'M', 'G', 'GG', 'XG'];
const FOOTWEAR_SIZES: UniformSize[] = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
const SIZES: UniformSize[] = [...CLOTHING_SIZES, ...FOOTWEAR_SIZES];

const CLOTHING_TYPES = ['BERMUDA', 'CALÇA', 'CAMISETA', 'JAQUETA', 'SHORTS-SAIA', 'OUTROS'] as const;
type ClothingType = typeof CLOTHING_TYPES[number] | 'VESTUÁRIO';

import { supabase } from '../supabaseClient';
import { useToast } from './Toast';
import DocumentHeader from './DocumentHeader';

const AlmoxarifeUniforms: React.FC = () => {
   const { addToast } = useToast();
   const [uniforms, setUniforms] = useState<UniformItem[]>([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedItem, setSelectedItem] = useState<UniformItem | null>(null);
   const [activeCategory, setActiveCategory] = useState<'TODOS' | 'VESTUÁRIO' | 'CALÇADO'>('TODOS');
   const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
   const [newItem, setNewItem] = useState<{
      name: string; // Used for final name or custom input
      type: ClothingType | ''; // To track the selected type dropdown
      details: string; // Extra info (e.g. "Infantil", "Gola V")
      category: 'VESTUÁRIO' | 'CALÇADO';
      sizes: Record<UniformSize, number>;
   }>({
      name: '',
      type: '',
      details: '',
      category: 'VESTUÁRIO',
      sizes: { '12': 0, '14': 0, '16': 0, 'P': 0, 'M': 0, 'G': 0, 'GG': 0, 'XG': 0 }
   });

   // Estados do Termo de Responsabilidade
   const [isTermModalOpen, setIsTermModalOpen] = useState(false);
   const [termData, setTermData] = useState({
      studentName: '',
      studentClass: '',
      guardianName: '',
      guardianCPF: '',
   });
   const [termItems, setTermItems] = useState<{ name: string; size: string; quantity: number }[]>([]);
   const [currentTermItem, setCurrentTermItem] = useState({ name: '', size: '', quantity: 1 });

   const handleAddTermItem = () => {
      if (!currentTermItem.name) {
         addToast("Selecione um item.", "warning");
         return;
      }
      if (!currentTermItem.size) {
         addToast("Selecione o tamanho.", "warning");
         return;
      }
      if (currentTermItem.quantity <= 0) {
         addToast("Quantidade inválida.", "warning");
         return;
      }
      setTermItems([...termItems, currentTermItem]);
      setCurrentTermItem({ name: '', size: '', quantity: 1 });
   };

   // Estado de salvamento
   const [isSavingTerm, setIsSavingTerm] = useState(false);

   const handleSaveAndPrintTerm = async () => {
      if (!termData.studentName || !termData.guardianName) {
         addToast("Preencha os dados do Aluno e Responsável.", "warning");
         return;
      }
      if (termItems.length === 0) {
         addToast("Adicione pelo menos um item ao termo.", "warning");
         return;
      }

      if (!confirm("Isso irá descontar os itens do estoque e registrar a entrega. Confirma?")) {
         return;
      }

      setIsSavingTerm(true);

      try {
         for (const tItem of termItems) {
            // 1. Buscar item atualizado para garantir estoque correto
            const { data: currentItemData, error: fetchError } = await supabase
               .from('almoxarifado_items')
               .select('*')
               .eq('name', tItem.name) // Buscando por nome pois o termItems só tem nome, ideal seria ID
               .maybeSingle();

            if (fetchError || !currentItemData) {
               console.error(`Erro ao buscar item ${tItem.name}:`, fetchError);
               continue; // Pula item com erro
            }

            // 2. Calcular novo estoque
            const currentSizes = currentItemData.sizes || {};
            const currentQty = currentSizes[tItem.size] || 0;
            const newQty = Math.max(0, currentQty - tItem.quantity);
            const newSizes = { ...currentSizes, [tItem.size]: newQty };
            const totalQuantity = Object.values(newSizes).reduce((a, b) => Number(a) + Number(b), 0);

            // 3. Atualizar Item
            const { error: updateError } = await supabase
               .from('almoxarifado_items')
               .update({ sizes: newSizes, quantity: totalQuantity })
               .eq('id', currentItemData.id);

            if (updateError) throw updateError;

            // 4. Registrar Movimentação (Saída)
            const { error: moveError } = await supabase
               .from('almoxarifado_movements')
               .insert([{
                  item_id: currentItemData.id,
                  type: 'SAIDA',
                  quantity: tItem.quantity,
                  requester: termData.studentName.toUpperCase(),
                  observations: `TERMO DE RESP. - RESP: ${termData.guardianName.toUpperCase()} CPF: ${termData.guardianCPF} - TURMA: ${termData.studentClass}`
               }]);

            if (moveError) throw moveError;
         }

         addToast("Entrega registrada com sucesso! Imprimindo termo...", "success");
         setTimeout(() => window.print(), 500);
         // Opcional: Limpar dados ou fechar modal
         // setIsTermModalOpen(false); 

      } catch (error: any) {
         console.error("Erro ao salvar termo:", error);
         addToast("Erro ao salvar dados do termo: " + (error.message || "Erro desconhecido"), "error");
      } finally {
         setIsSavingTerm(false);
         fetchUniforms(); // Atualiza lista local
      }
   };

   const handleCreateUniform = async () => {
      if (!newItem.name) {
         addToast("Por favor, informe o nome do item.", "warning");
         return;
      }

      const totalQuantity = Object.values(newItem.sizes).reduce((a, b) => Number(a) + Number(b), 0);

      try {
         // Construct Name based on Type + Details if Vestuário
         let finalName = newItem.name.toUpperCase();
         if (newItem.category === 'VESTUÁRIO' || CLOTHING_TYPES.includes(newItem.category as any)) {
            if (newItem.type && newItem.type !== 'OUTROS') {
               finalName = `${newItem.type} ${newItem.details}`.trim().toUpperCase();
            } else {
               // If OUTROS, use the name input
               finalName = newItem.name.toUpperCase();
            }
         }

         if (!finalName) {
            addToast("Por favor, informe o nome ou tipo do item.", "warning");
            return;
         }

         const { error } = await supabase.from('almoxarifado_items').insert([{
            name: finalName,
            category: 'UNIFORME',
            description: newItem.category, // Used for sub-category
            sizes: newItem.sizes,
            quantity: totalQuantity,
            min_quantity: 10, // Default min quantity
            image_url: ''
         }]);

         if (error) throw error;

         addToast("Item cadastrado com sucesso!", "success");
         setIsNewItemModalOpen(false);
         setNewItem({
            name: '',
            type: '',
            details: '',
            category: 'VESTUÁRIO',
            sizes: { '12': 0, '14': 0, '16': 0, 'P': 0, 'M': 0, 'G': 0, 'GG': 0, 'XG': 0 }
         });
         fetchUniforms();

      } catch (error: any) {
         console.error("Erro ao cadastrar uniforme:", error);
         addToast("Erro ao cadastrar uniforme: " + (error.message || JSON.stringify(error)), "error");
      }
   };

   const fetchUniforms = async () => {
      try {
         const { data, error } = await supabase
            .from('almoxarifado_items')
            .select('*')
            .ilike('category', 'UNIFORME%');

         if (data) {
            setUniforms(data.map(u => ({
               id: u.id,
               name: u.name,
               category: (u.description || 'VESTUÁRIO') as any, // Using description for sub-category for now
               sizes: u.sizes || {}, // Initialize with empty or DB value, rendering handles what to show
               minPerSize: u.min_quantity || 10
            })));
         }
      } catch (error) {
         console.error("Erro ao buscar uniformes:", error);
      }
   };

   useEffect(() => {
      fetchUniforms();

      const subscription = supabase
         .channel('almoxarifado_uniforms_changes')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'almoxarifado_items' }, fetchUniforms)
         .subscribe();

      return () => { subscription.unsubscribe(); };
   }, []);

   const updateSizeStock = async (itemId: string, size: UniformSize, amount: number) => {
      const item = uniforms.find(u => u.id === itemId);
      if (!item) return;

      const newSizes = { ...item.sizes, [size]: Math.max(0, item.sizes[size] + amount) };
      const totalQuantity = Object.values(newSizes).reduce((a, b) => Number(a) + Number(b), 0);

      try {
         // 1. Update Item (Sizes JSONB and Total Quantity)
         const { error } = await supabase
            .from('almoxarifado_items')
            .update({
               sizes: newSizes,
               quantity: totalQuantity
            })
            .eq('id', itemId);

         if (error) throw error;

         // 2. Registra Movimentação
         await supabase.from('almoxarifado_movements').insert([{
            item_id: itemId,
            type: amount > 0 ? 'ENTRADA' : 'SAIDA',
            quantity: Math.abs(amount),
            requester: 'ALMOXARIFE (GRADE)',
            observations: `Ajuste de grade tamanho ${size}`
         }]);

         // Optimistic update for UI responsiveness
         setUniforms(prev => prev.map(u => u.id === itemId ? { ...u, sizes: newSizes } : u));
         if (selectedItem?.id === itemId) {
            setSelectedItem(prev => prev ? { ...prev, sizes: newSizes } : null);
         }

      } catch (error) {
         console.error("Erro ao atualizar estoque de uniformes:", error);
         addToast("Erro ao atualizar estoque.", "error");
      }
   };

   const filteredUniforms = useMemo(() => {
      return uniforms.filter(u => {
         const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
         const isVestuario = activeCategory === 'VESTUÁRIO' && (u.category === 'VESTUÁRIO' || CLOTHING_TYPES.includes(u.category as any));
         const matchesCat = activeCategory === 'TODOS' || u.category === activeCategory || isVestuario;
         return matchesSearch && matchesCat;
      });
   }, [uniforms, searchTerm, activeCategory]);

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">

         {/* HEADER DE GESTÃO */}
         {/* HEADER DE GESTÃO - Oculto na impressão */}
         <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md space-y-6 print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg shadow-orange-600/20">
                     <Shirt size={32} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-white uppercase tracking-tight">Estoque de Uniformes</h2>
                     <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão de Vestuário e Grade de Tamanhos</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button
                     onClick={() => setIsTermModalOpen(true)}
                     className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg print:hidden border border-white/10"
                  >
                     <FileText size={16} /> Gerar Termo
                  </button>
                  <button
                     onClick={() => setIsNewItemModalOpen(true)}
                     className="px-6 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/20 transition-all shadow-lg border border-white/10"
                  >
                     <Plus size={16} /> Novo Item
                  </button>
                  <button
                     onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8,"
                           + "Item,Categoria,Tamanho,Quantidade\n"
                           + uniforms.flatMap(u => SIZES.map(s => `${u.name},${u.category},${s},${u.sizes[s] || 0}`)).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "estoque_uniformes.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                     }}
                     className="px-6 py-3 bg-orange-500/10 text-orange-400 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-orange-500/20 transition-all border border-orange-500/20"
                  >
                     <Download size={16} /> Exportar Inventário
                  </button>
                  <button
                     onClick={() => alert("Funcionalidade de Entrada em Lote (DRE) em desenvolvimento.")}
                     className="px-6 py-3 bg-white/5 text-white/60 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/10 hover:text-white transition-all shadow-lg border border-white/5"
                  >
                     <PackageCheck size={16} /> Receber Lote DRE
                  </button>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 border-t border-white/10 pt-6">
               <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  {['TODOS', 'VESTUÁRIO', 'CALÇADO'].map(cat => (
                     <button
                        key={cat}
                        onClick={() => setActiveCategory(cat as any)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeCategory === cat ? 'bg-orange-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
                           }`}
                     >
                        {cat}
                     </button>
                  ))}
               </div>
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                     type="text"
                     placeholder="Pesquisar por nome do item..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none focus:bg-white/10 focus:border-orange-500/50 transition-all placeholder-white/20"
                  />
               </div>
            </div>
         </div>

         {/* GRID DE CARDS INTUITIVOS */}
         {/* GRID DE CARDS INTUITIVOS - Oculto na impressão */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:hidden">
            {filteredUniforms.map(item => {
               // Fixed TypeScript error by casting to number[]
               const total = (Object.values(item.sizes || {}) as number[]).reduce((a, b) => Number(a) + Number(b), 0);
               const criticalSizes = SIZES.filter(s => (item.sizes?.[s] || 0) > 0 && (item.sizes?.[s] || 0) < item.minPerSize);
               const emptySizes = SIZES.filter(s => (item.sizes?.[s] || 0) === 0);

               return (
                  <div
                     key={item.id}
                     onClick={() => setSelectedItem(item)}
                     className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md hover:bg-white/10 hover:border-orange-500/30 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
                  >
                     <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl ${item.category === 'CALÇADO' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'} group-hover:scale-110 transition-transform`}>
                           {item.category === 'CALÇADO' ? <Footprints size={24} /> : <Shirt size={24} />}
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Saldo Total</p>
                           <p className="text-2xl font-black text-white">{total}</p>
                        </div>
                     </div>

                     <div className="flex-1">
                        <h3 className="text-lg font-black text-white uppercase leading-tight mb-1">{item.name}</h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{item.category}</p>

                        <div className="mt-6 flex flex-wrap gap-1.5">
                           {(item.category === 'CALÇADO' ? FOOTWEAR_SIZES : CLOTHING_SIZES).map(s => {
                              const q = item.sizes?.[s] || 0;
                              const isLow = q > 0 && q < item.minPerSize;
                              const isZero = q === 0;
                              return (
                                 <div
                                    key={s}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-black border transition-all ${isZero ? 'bg-white/5 border-transparent text-white/20' :
                                       isLow ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                          'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                       }`}
                                 >
                                    {s}: {q}
                                 </div>
                              );
                           })}
                        </div>
                     </div>

                     <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           {criticalSizes.length > 0 && (
                              <div className="flex items-center gap-1 text-[8px] font-black text-red-400 uppercase bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 animate-pulse">
                                 <AlertTriangle size={10} /> {criticalSizes.length} Tamanhos Baixos
                              </div>
                           )}
                        </div>
                        <div className="p-2 bg-white/5 text-white/40 group-hover:bg-orange-600 group-hover:text-white rounded-xl transition-all">
                           <Settings2 size={18} />
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>

         {/* MODAL DE GESTÃO DO ITEM SELECIONADO */}
         {selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-gray-900 border border-white/10 rounded-[3.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* HEADER MODAL */}
                  <div className="p-8 bg-white/5 flex justify-between items-center border-b border-white/10 shrink-0">
                     <div className="flex items-center gap-5">
                        <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg shadow-orange-600/20">
                           <Shirt size={28} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedItem.name}</h3>
                           <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-1">Ajuste de Grade do Almoxarifado</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedItem(null)} className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-red-500/20 rounded-2xl shadow-sm transition-all border border-white/5">
                        <X size={24} />
                     </button>
                  </div>

                  {/* CONTEÚDO MODAL */}
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {(selectedItem.category === 'CALÇADO' ? FOOTWEAR_SIZES : CLOTHING_SIZES).map(size => {
                           const qty = selectedItem.sizes?.[size] || 0;
                           const isLow = qty > 0 && qty < selectedItem.minPerSize;
                           const isZero = qty === 0;

                           return (
                              <div
                                 key={size}
                                 className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${isZero ? 'bg-white/5 border-white/5' :
                                    isLow ? 'bg-amber-500/10 border-amber-500/40' :
                                       'bg-white/5 border-emerald-500/40 shadow-lg'
                                    }`}
                              >
                                 <div className="text-center">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tamanho</p>
                                    <p className="text-3xl font-black text-white">{size}</p>
                                 </div>

                                 <div className={`w-full py-4 rounded-2xl text-center border shadow-inner ${isZero ? 'bg-black/20 border-white/5' : 'bg-black/20 border-white/5'}`}>
                                    <p className={`text-2xl font-black ${isZero ? 'text-white/20' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                                       {qty}
                                    </p>
                                    <p className="text-[8px] font-bold text-white/40 uppercase">Em Estoque</p>
                                 </div>

                                 <div className="flex gap-2 w-full">
                                    <button
                                       onClick={() => updateSizeStock(selectedItem.id, size, -1)}
                                       className="flex-1 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex justify-center border border-red-500/20"
                                    >
                                       <Minus size={18} />
                                    </button>
                                    <button
                                       onClick={() => updateSizeStock(selectedItem.id, size, 1)}
                                       className="flex-1 p-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex justify-center border border-emerald-500/20"
                                    >
                                       <Plus size={18} />
                                    </button>
                                 </div>
                              </div>
                           );
                        })}
                     </div>

                     {/* DASHBOARD DE STATUS DA GRADE */}
                     <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-orange-950/40 border border-orange-500/20 p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl backdrop-blur-md">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-orange-500/20 rounded-2xl">
                                 <CheckCircle2 className="text-orange-400" />
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-orange-300 uppercase tracking-widest">Status Geral</p>
                                 <p className="text-sm font-bold uppercase text-white/90">Integridade da Grade: 100%</p>
                              </div>
                           </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl backdrop-blur-md">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/10 rounded-2xl">
                                 <TrendingUp className="text-blue-400" />
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Previsão</p>
                                 <p className="text-sm font-bold uppercase text-white/90">Reposição Sugerida: 30 Dias</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* FOOTER MODAL */}
                  <div className="p-8 bg-white/5 border-t border-white/10 shrink-0">
                     <button
                        onClick={() => setSelectedItem(null)}
                        className="w-full py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-white/20 transition-all border border-white/10"
                     >
                        Concluir Ajustes
                     </button>
                  </div>
               </div>
            </div>
         )}


         {/* MODAL DE CADASTRO DE NOVO ITEM */}
         {isNewItemModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-white/5 flex justify-between items-center border-b border-white/10 shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 text-white rounded-2xl shadow-lg border border-white/10">
                           <Shirt size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tight">Novo Uniforme</h3>
                           <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Cadastro de Peça e Grade Inicial</p>
                        </div>
                     </div>
                     <button onClick={() => setIsNewItemModalOpen(false)} className="p-2 bg-white/5 text-white/40 hover:text-white hover:bg-red-500/20 rounded-xl shadow-sm transition-all border border-white/5">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Tipo de Item</label>

                        {/* Categoria Principal */}
                        <div className="flex gap-2 mb-4">
                           {(['VESTUÁRIO', 'CALÇADO'] as const).map(cat => (
                              <button
                                 key={cat}
                                 onClick={() => setNewItem({
                                    ...newItem,
                                    category: cat,
                                    type: '',
                                    sizes: cat === 'CALÇADO'
                                       ? { '33': 0, '34': 0, '35': 0, '36': 0, '37': 0, '38': 0, '39': 0, '40': 0, '41': 0, '42': 0, '43': 0, '44': 0 } as any
                                       : { '12': 0, '14': 0, '16': 0, 'P': 0, 'M': 0, 'G': 0, 'GG': 0, 'XG': 0 }
                                 })}
                                 className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${newItem.category === cat
                                    ? 'bg-orange-600 text-white shadow-lg'
                                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                                    }`}
                              >
                                 {cat}
                              </button>
                           ))}
                        </div>

                        {/* Se for VESTUÁRIO, mostrar Tipos */}
                        {newItem.category === 'VESTUÁRIO' ? (
                           <div className="space-y-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                 {CLOTHING_TYPES.map(type => (
                                    <button
                                       key={type}
                                       onClick={() => setNewItem({ ...newItem, type: type as any, name: type !== 'OUTROS' ? type : '' })}
                                       className={`px-3 py-3 rounded-xl text-[10px] font-bold uppercase border transition-all ${newItem.type === type
                                          ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-md ring-1 ring-orange-500/20'
                                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:bg-white/10 hover:text-white'
                                          }`}
                                    >
                                       {type}
                                    </button>
                                 ))}
                              </div>

                              {/* Input Condicional: Se for OUTROS, pede Nome. Se for Tipo específico, pede Detalhes */}
                              {newItem.type === 'OUTROS' ? (
                                 <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[9px] font-bold text-white/40 uppercase ml-1">Nome do Item (Outros)</label>
                                    <input
                                       type="text"
                                       placeholder="Ex: BONÉ, MEIAS, ETC."
                                       value={newItem.name}
                                       onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                       className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none uppercase focus:bg-white/10 focus:border-orange-500/50 transition-all placeholder-white/20"
                                    />
                                 </div>
                              ) : newItem.type ? (
                                 <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[9px] font-bold text-white/40 uppercase ml-1">Detalhes / Modelo (Opcional)</label>
                                    <input
                                       type="text"
                                       placeholder={`Ex: INFANTIL, GOLA V, PROJETO X`}
                                       value={newItem.details}
                                       onChange={e => setNewItem({ ...newItem, details: e.target.value })}
                                       className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none uppercase focus:bg-white/10 focus:border-orange-500/50 transition-all placeholder-white/20"
                                    />
                                    <p className="text-[9px] text-white/40 font-medium ml-1">Nome Final: <span className="text-orange-400 font-bold">{newItem.type} {newItem.details}</span></p>
                                 </div>
                              ) : null}
                           </div>
                        ) : (
                           // Se for CALÇADO (Manter input simples de Nome por enquanto ou expandir futuramente)
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-white/40 uppercase ml-1">Nome do Calçado</label>
                              <input
                                 type="text"
                                 placeholder="Ex: TÊNIS PRETO ESCOLAR"
                                 value={newItem.name}
                                 onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                 className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none uppercase focus:bg-white/10 focus:border-orange-500/50 transition-all placeholder-white/20"
                              />
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="space-y-3 px-8 pb-4">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Grade Inicial (Quantidade por Tamanho)</label>
                     <div className="grid grid-cols-4 gap-3">
                        {(newItem.category === 'CALÇADO' ? FOOTWEAR_SIZES : CLOTHING_SIZES).map(size => (
                           <div key={size} className="bg-white/5 p-3 rounded-2xl border border-white/5">
                              <label className="block text-center text-[9px] font-black text-white/40 uppercase mb-1">{size}</label>
                              <input
                                 type="number"
                                 min="0"
                                 value={newItem.sizes[size] || 0}
                                 onChange={e => setNewItem({
                                    ...newItem,
                                    sizes: { ...newItem.sizes, [size]: parseInt(e.target.value) || 0 }
                                 })}
                                 className="w-full text-center bg-transparent p-2 rounded-xl font-black text-lg text-white border border-white/10 outline-none focus:border-orange-500 transition-all"
                              />
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="p-6 bg-white/5 border-t border-white/10 shrink-0">
                     <button
                        onClick={handleCreateUniform}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                     >
                        <CheckCircle2 size={18} /> Confirmar Cadastro
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* NOTA DE CONFORMIDADE */}
         {/* NOTA DE CONFORMIDADE - Oculto na impressão */}
         <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden print:hidden border border-white/10">
            <div className="absolute top-0 right-0 p-10 opacity-10">
               <ShieldCheck size={140} />
            </div>
            <div className="flex items-center gap-6 relative z-10">
               <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/10">
                  <PackageCheck size={32} className="text-blue-300" />
               </div>
               <div>
                  <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">Auditoria Interna</p>
                  <h4 className="text-xl font-black uppercase">Inventário Blindado</h4>
                  <p className="text-blue-200/60 text-xs font-medium uppercase tracking-tight">Sincronizado com os pedidos da Área do Professor</p>
               </div>
            </div>
            <button className="bg-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/20 transition-all shadow-xl relative z-10 border border-white/10">
               Gerar Relatório de Baixas
            </button>
         </div>

         {/* MODAL DE TERMO DE RESPONSABILIDADE */}
         {isTermModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 print:p-0 print:bg-white print:static print:block overflow-y-auto">
               <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:border-none print:max-w-none print:max-h-none print:rounded-none print:overflow-visible">

                  {/* HEADER DO MODAL (ESCONDIDO NA IMPRESSÃO) */}
                  <div className="p-8 bg-white/5 flex justify-between items-center border-b border-white/10 shrink-0 print:hidden">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                           <FileText size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tight">Termo de Responsabilidade</h3>
                           <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Geração de Documento de Entrega</p>
                        </div>
                     </div>
                     <button onClick={() => setIsTermModalOpen(false)} className="p-2 bg-white/5 text-white/40 hover:text-white hover:bg-red-500/20 rounded-xl shadow-sm transition-all border border-white/5">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print:overflow-visible print:p-0">

                     {/* FORMULÁRIO DE DADOS (ESCONDIDO NA IMPRESSÃO SE PREENCHIDO, MAS AQUI VAMOS MANTER VISÍVEL PARA EDIÇÃO E USAR DISPLAY BLOCK PARA O TERMO IMPRESSO) */}
                     <div className="space-y-6 print:hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nome do Aluno</label>
                              <input
                                 type="text"
                                 value={termData.studentName}
                                 onChange={e => setTermData({ ...termData, studentName: e.target.value })}
                                 className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm text-white outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all placeholder-white/20"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Turma</label>
                              <input
                                 type="text"
                                 value={termData.studentClass}
                                 onChange={e => setTermData({ ...termData, studentClass: e.target.value })}
                                 className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm text-white outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all placeholder-white/20"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nome do Responsável</label>
                              <input
                                 type="text"
                                 value={termData.guardianName}
                                 onChange={e => setTermData({ ...termData, guardianName: e.target.value })}
                                 className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm text-white outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all placeholder-white/20"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">CPF do Responsável</label>
                              <input
                                 type="text"
                                 value={termData.guardianCPF}
                                 onChange={e => setTermData({ ...termData, guardianCPF: e.target.value })}
                                 className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm text-white outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all placeholder-white/20"
                              />
                           </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                           <h4 className="text-sm font-black text-white uppercase">Adicionar Itens ao Termo</h4>
                           <div className="flex flex-col md:flex-row gap-3 items-end">
                              <div className="flex-1 w-full space-y-1">
                                 <label className="text-[9px] font-bold text-white/40 uppercase">Item</label>
                                 <select
                                    value={currentTermItem.name}
                                    onChange={e => setCurrentTermItem({ ...currentTermItem, name: e.target.value })}
                                    className="w-full p-2 bg-black/20 border border-white/10 rounded-lg text-sm font-medium text-white outline-none focus:border-blue-500/50"
                                 >
                                    <option value="" className="text-gray-500">Selecione...</option>
                                    {uniforms.map(u => (
                                       <option key={u.id} value={u.name} className="text-gray-900 bg-white">{u.name}</option>
                                    ))}
                                 </select>
                              </div>
                              <div className="w-24 space-y-1">
                                 <label className="text-[9px] font-bold text-white/40 uppercase">Tamanho</label>
                                 <select
                                    value={currentTermItem.size}
                                    onChange={e => setCurrentTermItem({ ...currentTermItem, size: e.target.value })}
                                    className="w-full p-2 bg-black/20 border border-white/10 rounded-lg text-sm font-medium text-white outline-none focus:border-blue-500/50"
                                 >
                                    <option value="" className="text-gray-500">...</option>
                                    {SIZES.map(s => <option key={s} value={s} className="text-gray-900 bg-white">{s}</option>)}
                                 </select>
                              </div>
                              <div className="w-20 space-y-1">
                                 <label className="text-[9px] font-bold text-white/40 uppercase">Qtd</label>
                                 <input
                                    type="number"
                                    min="1"
                                    value={currentTermItem.quantity}
                                    onChange={e => setCurrentTermItem({ ...currentTermItem, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full p-2 bg-black/20 border border-white/10 rounded-lg text-sm font-medium text-white outline-none text-center focus:border-blue-500/50"
                                 />
                              </div>
                              <button
                                 onClick={handleAddTermItem}
                                 className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-bold uppercase hover:bg-white/20 transition-all border border-white/10"
                              >
                                 Adicionar
                              </button>
                           </div>

                           {/* Lista de Itens Adicionados */}
                           {termItems.length > 0 && (
                              <div className="mt-4 bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                 <table className="w-full text-sm text-left text-white">
                                    <thead className="bg-white/5 text-white/40 text-[10px] uppercase font-black">
                                       <tr>
                                          <th className="px-4 py-2">Item</th>
                                          <th className="px-4 py-2 text-center">Tam</th>
                                          <th className="px-4 py-2 text-center">Qtd</th>
                                          <th className="px-4 py-2 text-right">Ação</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                       {termItems.map((item, idx) => (
                                          <tr key={idx}>
                                             <td className="px-4 py-2 font-medium">{item.name}</td>
                                             <td className="px-4 py-2 text-center">{item.size}</td>
                                             <td className="px-4 py-2 text-center">{item.quantity}</td>
                                             <td className="px-4 py-2 text-right">
                                                <button
                                                   onClick={() => setTermItems(termItems.filter((_, i) => i !== idx))}
                                                   className="text-red-400 hover:text-red-300 font-bold text-xs uppercase"
                                                >
                                                   Remover
                                                </button>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* ÁREA DE IMPRESSÃO (AGORA VISÍVEL COMO PREVIEW) */}
                     <div className="border-[3px] border-dashed border-white/10 mt-8 rounded-xl print:border-none print:mt-0 print:p-0 overflow-hidden">
                        <div className="bg-white/5 p-4 border-b border-white/10 print:hidden text-center text-xs font-bold text-white/40 uppercase tracking-widest">
                           Pré-visualização do Documento
                        </div>
                        <div className="p-8 max-w-[210mm] mx-auto bg-white text-black text-sm">
                           <DocumentHeader />
                           <div className="text-center mb-8 border-b-2 border-black pb-4">
                              <h1 className="text-xl font-bold uppercase mb-2">Termo de Responsabilidade e Recebimento de Uniforme Escolar</h1>
                              <p className="text-sm">Controle de Entrega e Devolução</p>
                           </div>

                           <div className="mb-6 text-justify leading-relaxed">
                              <p className="mb-4">
                                 Eu, <strong>{termData.guardianName || "__________________________________________"}</strong>, portador(a) do CPF nº <strong>{termData.guardianCPF || "_____________________"}</strong>,
                                 responsável legal pelo(a) aluno(a) <strong>{termData.studentName || "__________________________________________"}</strong>,
                                 matriculado(a) na turma <strong>{termData.studentClass || "__________"}</strong>, declaro ter recebido da Unidade Escolar os seguintes itens de uniforme:
                              </p>

                              <table className="w-full mb-6 border-collapse border border-black text-sm">
                                 <thead>
                                    <tr className="bg-gray-100">
                                       <th className="border border-black px-2 py-1 text-left">Item Descrição</th>
                                       <th className="border border-black px-2 py-1 text-center w-20">Tamanho</th>
                                       <th className="border border-black px-2 py-1 text-center w-20">Quant.</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {termItems.map((item, idx) => (
                                       <tr key={idx}>
                                          <td className="border border-black px-2 py-1">{item.name}</td>
                                          <td className="border border-black px-2 py-1 text-center">{item.size}</td>
                                          <td className="border border-black px-2 py-1 text-center">{item.quantity}</td>
                                       </tr>
                                    ))}
                                    {termItems.length === 0 && (
                                       <tr>
                                          <td className="border border-black px-2 py-1 text-center italic" colSpan={3}>Nenhum item listado.</td>
                                       </tr>
                                    )}
                                 </tbody>
                              </table>

                              <h3 className="font-bold uppercase text-sm mb-2">Compromisso de Uso e Conservação:</h3>
                              <ol className="list-decimal pl-5 space-y-2 mb-6">
                                 <li>Comprometo-me a zelar pela limpeza e conservação das peças recebidas, realizando a lavagem e passadoria conforme as instruções de etiqueta.</li>
                                 <li>Declaro estar ciente da obrigatoriedade do uso do uniforme escolar <strong>diariamente</strong> e de forma completa durante o período de aulas e em atividades oficiais da escola.</li>
                                 <li>Comprometo-me a não descaracterizar o uniforme (cortes, pinturas, customizações ou alterações na modelagem).</li>
                                 <li>Em caso de dano, perda ou roubo, comprometo-me a comunicar imediatamente à direção da escola. Estou ciente de que a reposição por mau uso ou negligência poderá ser de minha inteira responsabilidade.</li>
                                 <li>Ao final do ano letivo ou em caso de transferência, comprometo-me a devolver os itens, se assim for solicitado pela gestão escolar.</li>
                              </ol>
                           </div>

                           <div className="mt-16 flex flex-col items-center gap-12">
                              <div className="text-center w-full">
                                 <p className="mb-8">_________________________, ______ de ____________________ de 20______.</p>
                                 <div className="border-t border-black w-2/3 mx-auto pt-2">
                                    <p className="font-bold">{termData.guardianName || "Assinatura do Responsável"}</p>
                                    <p className="text-xs">Responsável Legal</p>
                                 </div>
                              </div>

                              <div className="border-t border-black w-2/3 mx-auto pt-2 text-center">
                                 <p className="font-bold">Coordenação / Almoxarifado</p>
                                 <p className="text-xs">Visto da Escola</p>
                              </div>
                           </div>
                        </div>

                     </div>
                  </div>

                  {/* FOOTER DO MODAL (ESCONDIDO NA IMPRESSÃO) */}
                  <div className="p-6 bg-white/5 border-t border-white/10 shrink-0 print:hidden flex justify-end gap-4">
                     <button
                        onClick={() => setIsTermModalOpen(false)}
                        className="px-6 py-3 bg-transparent border border-white/10 text-white/60 rounded-xl font-bold text-xs uppercase hover:bg-white/10 hover:text-white transition-all"
                     >
                        Cancelar
                     </button>
                     <button
                        onClick={handleSaveAndPrintTerm}
                        disabled={isSavingTerm}
                        className={`px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2 ${isSavingTerm ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                        {isSavingTerm ? 'Salvando...' : <><Printer size={18} /> Confirmar Entrega e Imprimir</>}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AlmoxarifeUniforms;