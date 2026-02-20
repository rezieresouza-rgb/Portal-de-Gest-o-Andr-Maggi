
import React, { useState, useEffect, useMemo } from 'react';
import {
   LibraryBig,
   Search,
   Plus,
   Minus,
   ArrowUpCircle,
   ArrowDownCircle,
   History,
   ShieldCheck,
   LayoutGrid,
   X,
   CheckCircle2,
   TrendingUp,
   Package,
   Users,
   Printer,
   FileText
} from 'lucide-react';

interface SchoolKit {
   id: string;
   name: string;
   category: 'ANOS FINAIS' | 'DOCENTE';
   current: number;
   totalEntries: number;
   totalExits: number;
}

import { supabase } from '../supabaseClient';
import { useToast } from './Toast';

interface Student {
   id: string;
   name: string;
   registration_number: string;
}

interface Classroom {
   id: string;
   name: string;
}

const AlmoxarifeSchoolKits: React.FC = () => {
   const { addToast } = useToast();
   const [kits, setKits] = useState<SchoolKit[]>([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [activeKit, setActiveKit] = useState<SchoolKit | null>(null);
   const [movementType, setMovementType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
   const [amount, setAmount] = useState<number | ''>('');

   // States for Student Linking
   const [classrooms, setClassrooms] = useState<Classroom[]>([]);
   const [students, setStudents] = useState<Student[]>([]);
   const [selectedClassId, setSelectedClassId] = useState('');
   const [selectedStudentId, setSelectedStudentId] = useState('');
   const [selectedStudentName, setSelectedStudentName] = useState(''); // To store for receipt
   const [selectedStudentCode, setSelectedStudentCode] = useState(''); // To store for receipt

   const [movementDetails, setMovementDetails] = useState({
      year: '2024',
      bimester: '1º BIMESTRE',
      audience: 'ESTUDANTE',
      targetClass: '',
      responsible: ''
   });

   const fetchKits = async () => {
      try {
         // 1. Fetch Kits
         const { data: itemsData, error: itemsError } = await supabase
            .from('almoxarifado_items')
            .select('*')
            .eq('category', 'KIT');

         if (itemsError) throw itemsError;

         // 2. Fetch Movements Summary (Simulated with fetch all for now, optimization: use RPC or view later)
         const { data: movementsData, error: movementsError } = await supabase
            .from('almoxarifado_movements')
            .select('*')
            .in('item_id', itemsData?.map(i => i.id) || []);

         if (movementsError) throw movementsError;

         if (itemsData) {
            setKits(itemsData.map(item => {
               const itemMovements = movementsData?.filter(m => m.item_id === item.id) || [];
               const entries = itemMovements.filter(m => m.type === 'ENTRADA').reduce((acc, m) => acc + m.quantity, 0);
               const exits = itemMovements.filter(m => m.type === 'SAIDA').reduce((acc, m) => acc + m.quantity, 0);

               return {
                  id: item.id,
                  name: item.name,
                  category: (item.description || 'ANOS FINAIS') as any, // Use description as sub-category
                  current: item.quantity,
                  totalEntries: entries,
                  totalExits: exits
               };
            }));
         }
      } catch (error) {
         console.error("Erro ao buscar kits:", error);
      }
   };

   useEffect(() => {
      fetchKits();
      fetchClassrooms();

      const subscription = supabase
         .channel('almoxarifado_kits_changes')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'almoxarifado_items' }, fetchKits)
         .subscribe();

      return () => { subscription.unsubscribe(); };
   }, []);

   const fetchClassrooms = async () => {
      try {
         const { data, error } = await supabase
            .from('classrooms')
            .select('id, name')
            .order('name');
         if (data) setClassrooms(data);
      } catch (error) {
         console.error("Erro ao buscar turmas:", error);
      }
   };

   const fetchStudentsByClass = async (classId: string) => {
      if (!classId) {
         setStudents([]);
         return;
      }
      try {
         const { data, error } = await supabase
            .from('enrollments')
            .select(`
               student_id,
               students (id, name, registration_number)
            `)
            .eq('classroom_id', classId)
            .is('end_date', null);

         if (data) {
            const validStudents = data
               .map((e: any) => e.students)
               .filter((s: any) => s !== null)
               .sort((a: any, b: any) => a.name.localeCompare(b.name));
            setStudents(validStudents);
         }
      } catch (error) {
         console.error("Erro ao buscar alunos:", error);
      }
   };

   const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const classId = e.target.value;
      setSelectedClassId(classId);
      setSelectedStudentId('');
      setSelectedStudentName('');
      setSelectedStudentCode('');
      fetchStudentsByClass(classId);
   };

   const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const studentId = e.target.value;
      setSelectedStudentId(studentId);
      const student = students.find(s => s.id === studentId);
      if (student) {
         setSelectedStudentName(student.name);
         setSelectedStudentCode(student.registration_number);
         // Auto-fill responsible field if needed, or keep generic
         setMovementDetails(prev => ({ ...prev, responsible: student.name }));
      }
   };

   const generateReceipt = (kitName: string, quantity: number, studentName: string, studentCode: string, className: string) => {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) return;

      const dateStr = new Date().toLocaleDateString('pt-BR');
      const timeStr = new Date().toLocaleTimeString('pt-BR');

      printWindow.document.write(`
         <html>
            <head>
               <title>Comprovante de Entrega - Kit Escolar</title>
               <style>
                  body { font-family: 'Arial', sans-serif; padding: 40px; }
                  .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                  .logo { font-size: 24px; font-weight: bold; text-transform: uppercase; }
                  .sublogo { font-size: 14px; margin-top: 5px; }
                  .title { text-align: center; font-size: 20px; font-weight: bold; margin: 30px 0; text-transform: uppercase; text-decoration: underline; }
                  .content { font-size: 16px; line-height: 1.6; margin-bottom: 50px; }
                  .field { margin-bottom: 10px; }
                  .label { font-weight: bold; }
                  .signature-area { margin-top: 100px; display: flex; justify-content: space-between; }
                  .signature-line { border-top: 1px solid #000; width: 45%; text-align: center; padding-top: 10px; font-size: 12px; }
                  .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #666; }
                  @media print {
                     button { display: none; }
                  }
               </style>
            </head>
            <body>
               <div class="header">
                  <div class="logo">Escola Municipal André Maggi</div>
                  <div class="sublogo">Sistema de Gestão Escolar Integrada</div>
               </div>

               <div class="title">Comprovante de Entrega de Material Escolar</div>

               <div class="content">
                  <p>Declaro que recebi da Unidade Escolar os itens descritos abaixo:</p>
                  
                  <div class="field"><span class="label">Aluno(a):</span> ${studentName}</div>
                  <div class="field"><span class="label">Matrícula:</span> ${studentCode || 'N/A'}</div>
                  <div class="field"><span class="label">Turma:</span> ${className}</div>
                  <hr style="margin: 20px 0; border: 0; border-top: 1px dashed #ccc;">
                  <div class="field"><span class="label">Item Recebido:</span> ${kitName}</div>
                  <div class="field"><span class="label">Quantidade:</span> ${quantity} unidade(s)</div>
                  <div class="field"><span class="label">Data da Entrega:</span> ${dateStr} às ${timeStr}</div>
               </div>

               <div class="signature-area">
                  <div class="signature-line">
                     Responsável pela Entrega (Almoxarifado)
                  </div>
                  <div class="signature-line">
                     ${studentName}<br>
                     (Assinatura do Aluno/Responsável)
                  </div>
               </div>

               <div class="footer">
                  Documento gerado eletronicamente em ${dateStr} ${timeStr}.
               </div>

               <script>
                  window.onload = function() { window.print(); }
               </script>
            </body>
         </html>
      `);
      printWindow.document.close();
   };

   const handleMovement = async () => {
      if (!activeKit || !amount) return;
      const numAmount = Number(amount);

      if (movementType === 'EXIT' && activeKit.current < numAmount) {
         addToast("Saldo insuficiente para esta saída!", 'error');
         return;
      }

      if (movementType === 'EXIT' && (!selectedClassId || !selectedStudentId)) {
         addToast("Para saída de kits, é obrigatório selecionar a Turma e o Aluno.", 'warning');
         return;
      }

      try {
         // Construct Observation String
         let observations = '';
         if (movementType === 'ENTRY') {
            observations = `ENTRADA KIT: ${movementDetails.audience} | ${movementDetails.year} - ${movementDetails.bimester} | Turma: ${movementDetails.targetClass}`;
         } else {
            const className = classrooms.find(c => c.id === selectedClassId)?.name || 'N/A';
            observations = JSON.stringify({
               action: 'SAIDA_KIT',
               studentName: selectedStudentName,
               studentCode: selectedStudentCode,
               className: className,
               date: new Date().toISOString()
            });
         }

         // 1. Update Stock
         const newQuantity = movementType === 'ENTRY' ? activeKit.current + numAmount : activeKit.current - numAmount;
         const { error: updateError } = await supabase
            .from('almoxarifado_items')
            .update({ quantity: newQuantity })
            .eq('id', activeKit.id);

         if (updateError) throw updateError;

         // 2. Register Movement
         const { error } = await supabase.from('almoxarifado_movements').insert([{
            item_id: activeKit.id,
            type: movementType === 'ENTRY' ? 'ENTRADA' : 'SAIDA',
            quantity: numAmount,
            requester: movementType === 'EXIT' ? movementDetails.responsible.toUpperCase() : 'ALMOXARIFE (KITS)',
            observations: observations
         }]);

         if (error) throw error;

         await fetchKits();
         if (movementType === 'EXIT') {
            const className = classrooms.find(c => c.id === selectedClassId)?.name || 'N/A';
            generateReceipt(activeKit.name, Number(amount), selectedStudentName, selectedStudentCode, className);
         }

         setIsModalOpen(false);
         setAmount('');
         setSelectedClassId('');
         setSelectedStudentId('');
         setSelectedStudentName('');
         setSelectedStudentCode('');
         setMovementDetails({
            year: '2024',
            bimester: '1º BIMESTRE',
            audience: 'ESTUDANTE',
            targetClass: '',
            responsible: ''
         });
         setActiveKit(null);
         addToast("Movimentação registrada com sucesso!", 'success');

      } catch (error) {
         console.error("Erro ao registrar movimentação:", error);
         addToast("Erro ao registrar movimentação.", 'error');
      }
   };

   const filteredKits = useMemo(() => {
      return kits.filter(k => k.name.toLowerCase().includes(searchTerm.toLowerCase()));
   }, [kits, searchTerm]);

   const [isRegModalOpen, setIsRegModalOpen] = useState(false);
   const [newKitName, setNewKitName] = useState('');
   const [newKitCategory, setNewKitCategory] = useState<'ANOS FINAIS' | 'DOCENTE'>('ANOS FINAIS');
   const [newKitInitialStock, setNewKitInitialStock] = useState<number | ''>('');

   const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newKitName || newKitInitialStock === '') return;

      try {
         // 1. Create Item
         const { data: newItem, error: createError } = await supabase
            .from('almoxarifado_items')
            .insert([{
               name: newKitName.toUpperCase(),
               category: 'KIT',
               description: newKitCategory, // Storing sub-category in description
               quantity: Number(newKitInitialStock),
               min_quantity: 10 // Default alert threshold
            }])
            .select()
            .single();

         if (createError) throw createError;

         // 2. Register Initial Movement
         if (Number(newKitInitialStock) > 0) {
            const { error: moveError } = await supabase.from('almoxarifado_movements').insert([{
               item_id: newItem.id,
               type: 'ENTRADA',
               quantity: Number(newKitInitialStock),
               requester: 'ALMOXARIFE (SISTEMA)',
               observations: 'Estoque Inicial - Cadastro de Kit'
            }]);

            if (moveError) throw moveError;
         }

         await fetchKits();
         setIsRegModalOpen(false);
         setNewKitName('');
         setNewKitInitialStock('');
         addToast("Kit cadastrado com sucesso!", 'success');

      } catch (error) {
         console.error("Erro ao cadastrar kit:", error);
         addToast("Erro ao cadastrar kit.", 'error');
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500">

         {/* HEADER E BUSCA */}
         <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg shadow-orange-600/20">
                  <LibraryBig size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Kits de Material Escolar</h3>
                  <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Lançamento de Chegada (DRE) e Distribuição (6º ao 9º Ano)</p>
               </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="relative flex-1 md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                     type="text"
                     placeholder="Buscar Kit..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-12 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl font-bold text-sm text-white outline-none focus:bg-black/40 focus:border-orange-500/30 transition-all placeholder-white/20"
                  />
               </div>
               <button
                  onClick={() => setIsRegModalOpen(true)}
                  className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all shadow-lg border border-white/5"
                  title="Novo Kit"
               >
                  <Plus size={20} />
               </button>
            </div>
         </div>

         {/* GRID DE CONTROLE */}
         {filteredKits.length === 0 ? (
            <div className="text-center py-24 opacity-50">
               <LibraryBig size={48} className="mx-auto mb-4 text-gray-300" />
               <p className="text-gray-400 font-bold uppercase tracking-widest">Nenhum kit encontrado</p>
               <button onClick={() => setIsRegModalOpen(true)} className="mt-4 text-orange-600 font-black text-xs uppercase hover:underline">
                  Cadastrar Primeiro Kit
               </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {filteredKits.map(kit => (
                  <div key={kit.id} className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-lg hover:bg-white/10 transition-all flex flex-col justify-between group backdrop-blur-md">
                     <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{kit.category}</p>
                           <h4 className="text-lg font-black text-white uppercase leading-tight">{kit.name}</h4>
                        </div>
                        <div className="p-3 bg-white/5 text-white/40 rounded-2xl group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-colors border border-white/5">
                           <Package size={24} />
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
                           <p className="text-[8px] font-black text-white/40 uppercase mb-1">Entradas</p>
                           <p className="text-xl font-black text-emerald-400">{kit.totalEntries}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
                           <p className="text-[8px] font-black text-white/40 uppercase mb-1">Saídas</p>
                           <p className="text-xl font-black text-orange-400">{kit.totalExits}</p>
                        </div>
                        <div className="bg-orange-600 p-4 rounded-2xl shadow-lg shadow-orange-600/20 text-center">
                           <p className="text-[8px] font-black text-orange-200 uppercase mb-1">Saldo Atual</p>
                           <p className="text-2xl font-black text-white">{kit.current}</p>
                        </div>
                     </div>

                     <div className="flex gap-3">
                        <button
                           onClick={() => { setActiveKit(kit); setMovementType('ENTRY'); setIsModalOpen(true); }}
                           className="flex-1 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                        >
                           <ArrowUpCircle size={14} /> Registrar Chegada
                        </button>
                        <button
                           onClick={() => { setActiveKit(kit); setMovementType('EXIT'); setIsModalOpen(true); }}
                           className="flex-1 py-3 bg-red-500/10 text-red-400 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all border border-red-500/20"
                        >
                           <ArrowDownCircle size={14} /> Lançar Saída
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* NOTA DE CONFORMIDADE */}
         <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-lg backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <ShieldCheck size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Rastreabilidade Integrada</p>
                  <h4 className="text-sm font-black text-white uppercase">Todo movimento gera Log de Auditoria Permanente</h4>
               </div>
            </div>
            <button className="px-6 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/20 transition-all border border-white/5">
               <History size={16} /> Ver Histórico de Lotes
            </button>
         </div>

         {/* MODAL DE CADASTRO */}
         {isRegModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-gray-900 rounded-[3.5rem] w-full max-w-md shadow-2xl border border-white/10 overflow-hidden flex flex-col">
                  <div className="p-8 flex justify-between items-center border-b border-white/10 bg-white/5">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-600/20">
                           <Plus size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tighter">Novo Kit Escolar</h3>
                           <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Cadastro de Item</p>
                        </div>
                     </div>
                     <button onClick={() => setIsRegModalOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleRegister} className="p-8 space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nome do Kit</label>
                        <input
                           autoFocus
                           required
                           type="text"
                           placeholder="Ex: KIT ALUNO 6º ANO A"
                           value={newKitName}
                           onChange={e => setNewKitName(e.target.value)}
                           className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none uppercase focus:border-orange-500/50 transition-all placeholder-white/20"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Categoria</label>
                        <select
                           required
                           value={newKitCategory}
                           onChange={e => setNewKitCategory(e.target.value as any)}
                           className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none uppercase focus:border-orange-500/50"
                        >
                           <option value="ANOS FINAIS" className="bg-gray-900">ANOS FINAIS (ALUNO)</option>
                           <option value="DOCENTE" className="bg-gray-900">DOCENTE (PROFESSOR)</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Estoque Inicial</label>
                        <input
                           required
                           type="number"
                           min="0"
                           placeholder="0"
                           value={newKitInitialStock}
                           onChange={e => setNewKitInitialStock(e.target.value === '' ? '' : Number(e.target.value))}
                           className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none focus:border-orange-500/50 placeholder-white/20"
                        />
                     </div>

                     <div className="flex gap-4 pt-4">
                        <button
                           type="submit"
                           className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-orange-700 transition-all"
                        >
                           Cadastrar Kit
                        </button>
                        <button
                           type="button"
                           onClick={() => setIsRegModalOpen(false)}
                           className="px-6 py-4 bg-white/5 text-white/60 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all border border-white/5"
                        >
                           Cancelar
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* MODAL DE MOVIMENTAÇÃO */}
         {isModalOpen && activeKit && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-gray-900 rounded-[3.5rem] w-full max-w-md shadow-2xl border border-white/10 overflow-hidden flex flex-col">
                  <div className={`p-8 flex justify-between items-center border-b shrink-0 ${movementType === 'ENTRY' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                     <div className="flex items-center gap-4">
                        <div className={`p-3 text-white rounded-2xl shadow-lg ${movementType === 'ENTRY' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                           {movementType === 'ENTRY' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                              {movementType === 'ENTRY' ? 'Entrada de Kits' : 'Saída de Kits'}
                           </h3>
                           <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${movementType === 'ENTRY' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {activeKit.name}
                           </p>
                        </div>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleMovement} className="p-8 space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Quantidade de Kits</label>
                        <input
                           autoFocus
                           required
                           type="number"
                           min="1"
                           placeholder="0"
                           value={amount}
                           onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                           className="w-full p-6 bg-black/20 border border-white/10 rounded-3xl font-black text-4xl text-center text-white outline-none focus:bg-black/40 focus:border-orange-500/30 transition-all placeholder-white/20"
                        />
                     </div>

                     {movementType === 'EXIT' && (
                        <div className="space-y-4 pt-4 border-t border-white/10 animate-in slide-in-from-right-4 duration-500">
                           <div className="flex items-center gap-2 mb-2">
                              <Users size={16} className="text-indigo-400" />
                              <span className="text-sm font-black text-white uppercase">Vínculo com Aluno</span>
                           </div>

                           <div>
                              <label className="block text-xs font-bold text-white/40 uppercase mb-1">Selecione a Turma</label>
                              <select
                                 value={selectedClassId}
                                 onChange={handleClassChange}
                                 className="w-full p-4 bg-black/20 rounded-2xl font-bold text-sm text-white border border-white/10 outline-none focus:border-indigo-500/50 uppercase"
                              >
                                 <option value="" className="bg-gray-900">Selecione...</option>
                                 {classrooms.map(c => (
                                    <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
                                 ))}
                              </select>
                           </div>

                           {selectedClassId && (
                              <div className="animate-in fade-in slide-in-from-top-2">
                                 <label className="block text-xs font-bold text-white/40 uppercase mb-1">Selecione o Aluno</label>
                                 <select
                                    value={selectedStudentId}
                                    onChange={handleStudentChange}
                                    className="w-full p-4 bg-black/20 rounded-2xl font-bold text-sm text-white border border-white/10 outline-none focus:border-indigo-500/50 uppercase"
                                 >
                                    <option value="" className="bg-gray-900">Selecione o aluno...</option>
                                    {students.length === 0 && <option disabled className="bg-gray-900">Nenhum aluno nesta turma</option>}
                                    {students.map(s => (
                                       <option key={s.id} value={s.id} className="bg-gray-900">{s.name} ({s.registration_number || 'S/M'})</option>
                                    ))}
                                 </select>
                              </div>
                           )}

                           {selectedStudentId && (
                              <div className="p-4 bg-indigo-500/10 rounded-2xl flex items-start gap-3 border border-indigo-500/20">
                                 <Printer size={20} className="text-indigo-400 mt-1" />
                                 <div>
                                    <p className="text-xs font-black text-indigo-300 uppercase">Comprovante Automático</p>
                                    <p className="text-[10px] text-indigo-400/80 mt-1 font-bold">Ao confirmar a saída, será gerado um arquivo PDF para impressão e assinatura do aluno/responsável.</p>
                                 </div>
                              </div>
                           )}
                        </div>
                     )}

                     {movementType === 'ENTRY' ? (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Ano Letivo</label>
                                 <select
                                    required
                                    value={movementDetails.year}
                                    onChange={e => setMovementDetails({ ...movementDetails, year: e.target.value })}
                                    className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none uppercase focus:border-emerald-500/30"
                                 >
                                    <option value="2024" className="bg-gray-900">2024</option>
                                    <option value="2025" className="bg-gray-900">2025</option>
                                    <option value="2026" className="bg-gray-900">2026</option>
                                 </select>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Bimestre</label>
                                 <select
                                    required
                                    value={movementDetails.bimester}
                                    onChange={e => setMovementDetails({ ...movementDetails, bimester: e.target.value })}
                                    className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none uppercase focus:border-emerald-500/30"
                                 >
                                    <option value="1º BIMESTRE" className="bg-gray-900">1º BIMESTRE</option>
                                    <option value="2º BIMESTRE" className="bg-gray-900">2º BIMESTRE</option>
                                    <option value="3º BIMESTRE" className="bg-gray-900">3º BIMESTRE</option>
                                    <option value="4º BIMESTRE" className="bg-gray-900">4º BIMESTRE</option>
                                 </select>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Público</label>
                                 <select
                                    required
                                    value={movementDetails.audience}
                                    onChange={e => setMovementDetails({ ...movementDetails, audience: e.target.value })}
                                    className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none uppercase focus:border-emerald-500/30"
                                 >
                                    <option value="ESTUDANTE" className="bg-gray-900">ESTUDANTE</option>
                                    <option value="DOCENTE" className="bg-gray-900">DOCENTE</option>
                                 </select>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Turma</label>
                                 <input
                                    type="text"
                                    required
                                    placeholder="Ex: 6º A"
                                    value={movementDetails.targetClass}
                                    onChange={e => setMovementDetails({ ...movementDetails, targetClass: e.target.value })}
                                    className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-white outline-none uppercase focus:border-emerald-500/30 placeholder-white/20"
                                 />
                              </div>
                           </div>
                        </div>
                     ) : (
                        // Hide Manual Fields for Exit since we use the selectors
                        null
                     )}

                     <div className="flex gap-4 pt-4">
                        <button
                           type="submit"
                           className={`flex-1 py-4 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${movementType === 'ENTRY' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                              }`}
                        >
                           Confirmar {movementType === 'ENTRY' ? 'Entrada' : 'Saída'}
                        </button>
                        <button
                           type="button"
                           onClick={() => setIsModalOpen(false)}
                           className="px-6 py-4 bg-white/5 text-white/60 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all border border-white/5"
                        >
                           Cancelar
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default AlmoxarifeSchoolKits;
