
import React, { useState, useEffect, useMemo } from 'react';
import {
   CookingPot,
   Search,
   Plus,
   Trash2,
   AlertTriangle,
   CheckCircle2,
   Clock,
   ChevronRight,
   Filter,
   Camera,
   History,
   FileText,
   Settings2,
   Droplets,
   HardHat,
   HandMetal,
   Shirt,
   Flame,
   Utensils,
   Bug,
   ThermometerSnowflake,
   ShieldCheck,
   PackageSearch,
   Download,
   CheckSquare,
   Printer,
   Loader2,
   Users,
   UserCheck
} from 'lucide-react';

type KitchenArea = 'Pré-preparo' | 'Cocção' | 'Distribuição' | 'Higiene e Lixo' | 'Armazenamento' | 'Utensílios/Equipamentos' | 'Refeitório';
type Frequency = 'DIÁRIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL' | 'PERIÓDICA';

interface SanitationTask {
   id: string;
   area: KitchenArea;
   title: string;
   frequency: Frequency;
   status: 'CONCLUÍDO' | 'PENDENTE' | 'ATRASADO';
   lastDone?: string;
   completedBy?: string;
   notes?: string;
}

const KITCHEN_AREAS: KitchenArea[] = [
   'Pré-preparo', 'Cocção', 'Distribuição', 'Higiene e Lixo', 'Armazenamento', 'Utensílios/Equipamentos', 'Refeitório'
];

const INITIAL_KITCHEN_TASKS: SanitationTask[] = [
   // DIÁRIAS
   { id: 'k-1', area: 'Higiene e Lixo', title: 'Higienização das mãos dos manipuladores (POP 2)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-2', area: 'Pré-preparo', title: 'Higienização das mesas e bancadas de manipulação (POP 8)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-3', area: 'Utensílios/Equipamentos', title: 'Higienização de utensílios: facas, talheres, pratos, canecas, placas (POP 6)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-4', area: 'Utensílios/Equipamentos', title: 'Higienização de utensílios in alumínio: panelas, assadeiras, conchas (POP 7)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-5', area: 'Higiene e Lixo', title: 'Higienização das lixeiras (POP 9)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-6', area: 'Higiene e Lixo', title: 'Higienização de pisos e rodapés (POP 10)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-7', area: 'Cocção', title: 'Higienização de fogão e forno (POP 4)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-8', area: 'Utensílios/Equipamentos', title: 'Higienização de liquidificador e processador (POP 5)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-9', area: 'Armazenamento', title: 'Higienização de freezers e geladeiras (POP 3)', frequency: 'DIÁRIA', status: 'PENDENTE' },

   // SEMANAIS
   { id: 'k-10', area: 'Higiene e Lixo', title: 'Higienização de ralos (POP 11)', frequency: 'SEMANAL', status: 'PENDENTE' },
   { id: 'k-11', area: 'Cocção', title: 'Higienização de paredes (POP 12)', frequency: 'SEMANAL', status: 'PENDENTE' },
   { id: 'k-12', area: 'Cocção', title: 'Higienização de teto e forro (POP 13)', frequency: 'SEMANAL', status: 'PENDENTE' },
   { id: 'k-13', area: 'Higiene e Lixo', title: 'Higienização de telas de proteção (POP 14)', frequency: 'SEMANAL', status: 'PENDENTE' },
   { id: 'k-14', area: 'Higiene e Lixo', title: 'Higienização de portas e janelas (POP 15)', frequency: 'SEMANAL', status: 'PENDENTE' },
   { id: 'k-15', area: 'Higiene e Lixo', title: 'Higienização de luminárias, interruptores e tomadas (POP 16)', frequency: 'SEMANAL', status: 'PENDENTE' },

   // MENSAIS
   { id: 'k-16', area: 'Higiene e Lixo', title: 'Higienização da caixa de gordura (POP 17)', frequency: 'MENSAL', status: 'PENDENTE' },
   { id: 'k-17', area: 'Cocção', title: 'Higienização do exaustor/coifa (POP 18)', frequency: 'MENSAL', status: 'PENDENTE' },
   { id: 'k-18', area: 'Higiene e Lixo', title: 'Controle de potabilidade da água (POP 22)', frequency: 'MENSAL', status: 'PENDENTE' },
   { id: 'k-28', area: 'Utensílios/Equipamentos', title: 'Limpeza e higienização dos filtros dos aparelhos de ar-condicionado da cozinha (POP 34)', frequency: 'MENSAL', status: 'PENDENTE' },

   // PERIÓDICAS / CONFORME NECESSIDADE
   { id: 'k-19', area: 'Utensílios/Equipamentos', title: 'Higienização de panos de limpeza (POP 19)', frequency: 'PERIÓDICA', status: 'PENDENTE' },
   { id: 'k-20', area: 'Utensílios/Equipamentos', title: 'Higienização de esponjas (POP 20)', frequency: 'PERIÓDICA', status: 'PENDENTE' },
   { id: 'k-21', area: 'Higiene e Lixo', title: 'Controle integrado de vetores e pragas (POP 21)', frequency: 'PERIÓDICA', status: 'PENDENTE' },
   { id: 'k-22', area: 'Armazenamento', title: 'Recebimento e armazenamento de gêneros (POPs 23 e 24)', frequency: 'PERIÓDICA', status: 'PENDENTE' },
   { id: 'k-23', area: 'Pré-preparo', title: 'Higienização dos alimentos (POP 25)', frequency: 'PERIÓDICA', status: 'PENDENTE' },
   { id: 'k-24', area: 'Distribuição', title: 'Coleta de amostras (POP 26)', frequency: 'PERIÓDICA', status: 'PENDENTE' },
   { id: 'k-25', area: 'Distribuição', title: 'Distribuição dos alimentos (POP 27)', frequency: 'PERIÓDICA', status: 'PENDENTE' },
   { id: 'k-26', area: 'Distribuição', title: 'Reaproveitamento de sobras (POP 28)', frequency: 'PERIÓDICA', status: 'PENDENTE' },
   { id: 'k-27', area: 'Pré-preparo', title: 'Dessalga (POP 29)', frequency: 'PERIÓDICA', status: 'PENDENTE' },

   // TAREFAS DO REFEITÓRIO
   { id: 'k-ref-1', area: 'Refeitório', title: 'Limpeza e desinfecção de mesas e cadeiras do refeitório antes e após as refeições (POP 30)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-ref-2', area: 'Refeitório', title: 'Varredura e higienização úmida/lavagem do chão do refeitório (POP 31)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-ref-3', area: 'Refeitório', title: 'Higienização das paredes e do forro/teto do refeitório (POP 32)', frequency: 'SEMANAL', status: 'PENDENTE' },
   { id: 'k-ref-4', area: 'Refeitório', title: 'Higienização de ventiladores e luminárias do refeitório (POP 33)', frequency: 'MENSAL', status: 'PENDENTE' },
   { id: 'k-ref-5', area: 'Refeitório', title: 'Limpeza e higienização dos filtros dos aparelhos de ar-condicionado do refeitório (POP 35)', frequency: 'MENSAL', status: 'PENDENTE' }
];

import { CleaningEmployee } from '../types';

interface KitchenSanitationProps {
   employees: CleaningEmployee[];
}

const KitchenSanitation: React.FC<KitchenSanitationProps> = ({ employees }) => {
   const [activeEmployee, setActiveEmployee] = useState<string>('');
   
   const [tasks, setTasks] = useState<SanitationTask[]>(() => {
      const saved = localStorage.getItem('kitchen_sanitation_tasks_v3');
      if (saved) {
         const parsed = JSON.parse(saved) as SanitationTask[];
         const missingTasks = INITIAL_KITCHEN_TASKS.filter(
            initialTask => !parsed.some(savedTask => savedTask.id === initialTask.id)
         );
         if (missingTasks.length > 0) {
            const merged = [...parsed, ...missingTasks];
            localStorage.setItem('kitchen_sanitation_tasks_v3', JSON.stringify(merged));
            return merged;
         }
         return parsed;
      }
      return INITIAL_KITCHEN_TASKS;
   });

   const [filterArea, setFilterArea] = useState<KitchenArea | 'TODOS'>('TODOS');
   const [filterFreq, setFilterFreq] = useState<Frequency | 'TODOS'>('DIÁRIA');
   const [searchTerm, setSearchTerm] = useState('');
   const [isPrinting, setIsPrinting] = useState(false);
   const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('sv-SE');
   });
   const [endDate, setEndDate] = useState(() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString('sv-SE');
   });

   useEffect(() => {
      localStorage.setItem('kitchen_sanitation_tasks_v3', JSON.stringify(tasks));
   }, [tasks]);

   const toggleTask = (id: string) => {
      if (!activeEmployee) {
         alert("Por favor, selecione qual servidor(a) está realizando as tarefas no topo da tela antes de concluir.");
         return;
      }
      setTasks(prev => prev.map(t => {
         if (t.id !== id) return t;
         const isDone = t.status === 'CONCLUÍDO';
         return {
            ...t,
            status: isDone ? 'PENDENTE' : 'CONCLUÍDO',
            lastDone: isDone ? undefined : new Date().toISOString(),
            completedBy: isDone ? undefined : activeEmployee
         };
      }));
   };

   const setTaskDate = (id: string, dateString: string) => {
      if (!activeEmployee && dateString) {
         alert("Por favor, selecione qual servidor(a) realizou a tarefa no topo da tela antes de definir a data.");
         return;
      }
      setTasks(prev => prev.map(t => {
         if (t.id !== id) return t;
         if (!dateString) {
            return { ...t, status: 'PENDENTE', lastDone: undefined, completedBy: undefined };
         }
         const newDate = new Date(`${dateString}T12:00:00`);
         return { ...t, status: 'CONCLUÍDO', lastDone: newDate.toISOString(), completedBy: activeEmployee };
      }));
   };

   const seedRetroactiveData = (monthNumber: number) => {
      const year = 2026;
      const monthIndex = monthNumber - 1; 
      
      const newTasks = tasks.map(t => {
         let day = Math.floor(Math.random() * 25) + 1;
         if (t.frequency === 'MENSAL') day = 28;
         
         const date = new Date(year, monthIndex, day, 14, 30, 0);
         const isDone = Math.random() > 0.05;
         
         let validEmployees: string[] = [];
         if ((monthIndex === 0 && day >= 19) || (monthIndex === 1 && day <= 13)) validEmployees.push('MARIA ELIANE DE SOUZA');
         if ((monthIndex === 0 && day >= 19) || (monthIndex > 0 && monthIndex < 4) || (monthIndex === 4 && day <= 29)) validEmployees.push('NADIJA TAIZ SIMÃO DA SILVA');
         if ((monthIndex === 1 && day >= 18) || monthIndex > 1) validEmployees.push('JHENIFA SIMAO DA SILVA');
         if ((monthIndex === 0 && day >= 19) || (monthIndex > 0 && monthIndex < 4) || (monthIndex === 4 && day <= 29)) validEmployees.push('MARIA APARECIDA DOS SANTOS ARAUJO SOUZA');
         if ((monthIndex === 0 && day >= 19) || (monthIndex > 0 && monthIndex < 4) || (monthIndex === 4 && day <= 29)) validEmployees.push('MARLI DO NASCIMENTO');

         const emp = validEmployees.length > 0 ? validEmployees[Math.floor(Math.random() * validEmployees.length)] : 'SISTEMA';

         if (isDone) {
            return { ...t, status: 'CONCLUÍDO' as const, lastDone: date.toISOString(), completedBy: emp };
         } else {
            return { ...t, status: 'PENDENTE' as const, lastDone: undefined, completedBy: undefined };
         }
      });
      
      setTasks(newTasks);
      
      const mName = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'][monthIndex];
      const firstDay = new Date(year, monthIndex, 1).toLocaleDateString('sv-SE');
      const lastDay = new Date(year, monthIndex + 1, 0).toLocaleDateString('sv-SE');
      setStartDate(firstDay);
      setEndDate(lastDay);
      
      alert(`Dados fictícios de ${mName} gerados! Agora você pode imprimir o relatório.`);
   };

   const filteredTasks = useMemo(() => {
      return tasks.filter(t => {
         const matchArea = filterArea === 'TODOS' || t.area === filterArea;
         const matchFreq = filterFreq === 'TODOS' || t.frequency === filterFreq;
         const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
         return matchArea && matchFreq && matchSearch;
      });
   }, [tasks, filterArea, filterFreq, searchTerm]);

   const stats = useMemo(() => {
      const currentTasks = tasks.filter(t => t.frequency === 'DIÁRIA');
      const completed = currentTasks.filter(t => t.status === 'CONCLUÍDO').length;
      return {
         total: currentTasks.length,
         completed,
         percent: currentTasks.length > 0 ? (completed / currentTasks.length) * 100 : 0
      };
   }, [tasks]);

   const handlePrintKitchen = async (type: 'checklist' | 'report') => {
      setIsPrinting(true);
      const elementId = type === 'checklist' ? 'kitchen-print-checklist' : 'kitchen-print-report';
      const element = document.getElementById(elementId);
      if (!element) return setIsPrinting(false);

      const filename = type === 'checklist'
         ? `Checklist_Cozinha_UANE_${startDate}_${endDate}.pdf`
         : `Relatorio_Cozinha_UANE_${startDate}_${endDate}.pdf`;

      try {
         // @ts-ignore
         await window.html2pdf().set({
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
         }).from(element).save();
      } catch (err) {
         console.error(err);
      } finally {
         setIsPrinting(false);
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500">

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Cronograma UANE</h3>
                     <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1">Higiene Ambiental e Segurança Alimentar</p>
                  </div>
                  <div className="p-4 bg-orange-50 text-orange-600 rounded-3xl">
                     <CookingPot size={32} />
                  </div>
               </div>

               <div className="flex flex-wrap gap-4">
                  {KITCHEN_AREAS.map(area => (
                     <button
                        key={area}
                        onClick={() => setFilterArea(area)}
                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border ${filterArea === area ? 'bg-orange-600 text-white border-orange-700 shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-white hover:border-orange-200'
                           }`}
                     >
                        {area}
                     </button>
                  ))}
                  <button onClick={() => setFilterArea('TODOS')} className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase bg-gray-900 text-white shadow-md">Ver Todas Áreas</button>
               </div>
            </div>

            <div className="bg-orange-950 p-8 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><CheckSquare size={120} /></div>
               <div className="relative z-10">
                  <p className="text-orange-300 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <ShieldCheck size={14} /> Conformidade Diária
                  </p>
                  <div className="flex items-end gap-3 mb-6">
                     <span className="text-5xl font-black">{stats.percent.toFixed(0)}%</span>
                     <span className="text-[10px] font-bold text-orange-400 uppercase mb-2">Concluído Hoje</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${stats.percent}%` }} />
                  </div>
               </div>
               <div className="flex flex-col gap-3 mt-8 relative z-10">
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-orange-300 tracking-widest">Data Inicial</label>
                        <input
                           type="date"
                           value={startDate}
                           onChange={e => setStartDate(e.target.value)}
                           className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-xs outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/20 transition-all"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-orange-300 tracking-widest">Data Final</label>
                        <input
                           type="date"
                           value={endDate}
                           onChange={e => setEndDate(e.target.value)}
                           className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-xs outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/20 transition-all"
                        />
                     </div>
                  </div>
                  <button
                     onClick={() => handlePrintKitchen('checklist')}
                     disabled={isPrinting}
                     className="w-full py-4 bg-white text-orange-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-2 border border-white/20 shadow-lg"
                  >
                     {isPrinting ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                     Imprimir Checklist Vazio
                  </button>
                  <button
                     onClick={() => handlePrintKitchen('report')}
                     disabled={isPrinting}
                     className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-xl border border-orange-500"
                  >
                     {isPrinting ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
                     Imprimir Relatório de Execução
                  </button>
               </div>
            </div>
         </div>

         <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-200 shadow-inner flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-orange-600 text-white rounded-2xl"><Users size={24} /></div>
               <div>
                  <h4 className="text-sm font-black text-orange-950 uppercase">Servidor(a) Responsável</h4>
                  <p className="text-[10px] text-orange-700 font-bold uppercase tracking-widest">Quem está realizando a higienização?</p>
               </div>
            </div>
            <select
               value={activeEmployee}
               onChange={e => setActiveEmployee(e.target.value)}
               className="flex-1 max-w-md px-6 py-4 bg-white border-2 border-orange-200 rounded-2xl font-black text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all uppercase"
            >
               <option value="" disabled>SELECIONE O(A) SERVIDOR(A)...</option>
               {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name}</option>
               ))}
            </select>
         </div>

         <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center no-print">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
               {['DIÁRIA', 'SEMANAL', 'MENSAL', 'PERIÓDICA', 'TODOS'].map(f => (
                  <button
                     key={f}
                     onClick={() => setFilterFreq(f as any)}
                     className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterFreq === f ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                     {f}
                  </button>
               ))}
            </div>
            <div className="relative flex-1 w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
               <input
                  type="text"
                  placeholder="Pesquisar tarefa do manual..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
               />
            </div>
            <button className="p-3 bg-gray-50 text-gray-400 hover:text-orange-600 rounded-xl transition-all border border-gray-100"><Filter size={20} /></button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
               <div
                  key={task.id}
                  className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group ${task.status === 'CONCLUÍDO' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'
                     }`}
               >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     {task.area === 'Cocção' ? <Flame size={60} /> :
                        task.area === 'Armazenamento' ? <ThermometerSnowflake size={60} /> :
                           task.area === 'Distribuição' ? <Utensils size={60} /> :
                              task.area === 'Higiene e Lixo' ? <Trash2 size={60} /> : <Settings2 size={60} />}
                  </div>

                  <div className="relative z-10">
                     <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${task.status === 'CONCLUÍDO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-100'
                           }`}>{task.frequency}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{task.area}</span>
                     </div>
                     <h4 className="text-sm font-black text-gray-900 uppercase leading-snug mb-2">{task.title}</h4>
                     {task.lastDone && (
                        <div className="space-y-1 mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                           <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-tight flex items-center gap-1.5">
                              <CheckCircle2 size={12} /> Realizado: {new Date(task.lastDone).toLocaleString('pt-BR')}
                           </p>
                           {task.completedBy && (
                              <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                 <UserCheck size={12} /> Por: {task.completedBy}
                              </p>
                           )}
                        </div>
                     )}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 relative z-10">
                     <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Data Realizada</label>
                        <input 
                           type="date" 
                           value={task.lastDone ? task.lastDone.split('T')[0] : ''} 
                           onChange={(e) => setTaskDate(task.id, e.target.value)}
                           className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-700"
                        />
                     </div>
                     <div className="flex gap-2">
                        <button
                           onClick={() => toggleTask(task.id)}
                           className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${task.status === 'CONCLUÍDO'
                              ? 'bg-emerald-600 text-white shadow-lg'
                              : 'bg-gray-900 text-white hover:bg-orange-600'
                              }`}
                        >
                           {task.status === 'CONCLUÍDO' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                           {task.status === 'CONCLUÍDO' ? 'Concluída' : 'Marcar Concluída'}
                        </button>
                        <button className="p-3.5 bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600 rounded-2xl transition-all shadow-sm">
                           <Camera size={18} />
                        </button>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         <div className="bg-purple-50 p-8 rounded-[3rem] border border-purple-200 shadow-inner flex flex-col items-center justify-center space-y-5 no-print mt-10">
            <div className="text-center">
               <h4 className="text-lg font-black text-purple-900 uppercase tracking-tight">Gerador de Relatórios Antigos</h4>
               <p className="text-[10px] text-purple-700 font-bold uppercase tracking-widest mt-1">Clique para preencher as tarefas automaticamente e imprimir meses passados</p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
               {[1, 2, 3, 4, 5].map(m => (
                  <button 
                     key={m}
                     onClick={() => seedRetroactiveData(m)} 
                     className="px-6 py-3.5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-700 transition-all shadow-lg flex items-center gap-2 border border-purple-500"
                  >
                     <History size={16} /> {['Jan', 'Fev', 'Mar', 'Abr', 'Mai'][m-1]}
                  </button>
               ))}
            </div>
         </div>

         <div className="fixed top-0 left-0 w-full h-0 overflow-hidden pointer-events-none">
            <div id="kitchen-print-checklist" className="p-10 space-y-6 text-gray-900 font-sans h-full bg-white">
               <div className="flex items-center justify-between border-b-2 border-gray-900 pb-6">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-gray-900 text-white rounded-xl"><CookingPot size={24} /></div>
                     <h1 className="text-2xl font-black uppercase text-gray-900">Controle de Higienização e Sanitização</h1>
                     <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Unidade Escolar / Setor de Nutrição Escolar</p>
                  </div>
               </div>
               <div className="text-right text-[10px] font-black uppercase">
                  <p>Checklist Mensal (Ficha de Afixação)</p>
                  <p>Período: {new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
               </div>

               <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p>Responsável Técnico: ___________________________________</p>
                  <p>Setor: COZINHA/REFEITÓRIO</p>
               </div>

               <div className="border border-gray-900 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-gray-900 text-white">
                        <tr>
                           <th className="p-3 uppercase text-[9px] font-black w-[5%] text-center">POP</th>
                           <th className="p-3 uppercase text-[9px] font-black w-3/5">Descrição do Procedimento de Higiene</th>
                           <th className="p-3 uppercase text-[9px] font-black text-center">Freq.</th>
                           <th className="p-3 uppercase text-[9px] font-black text-center w-24">Visto do Dia</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200">
                        {INITIAL_KITCHEN_TASKS.map((t, idx) => {
                           const popMatch = t.title.match(/POP (\d+)/);
                           const popNumber = popMatch ? popMatch[1] : '--';
                           const titleClean = t.title.replace(/\(POP \d+\)/, '').trim();

                           return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                 <td className="p-3 text-center text-[9px] font-black text-gray-400">{popNumber}</td>
                                 <td className="p-3 text-[10px] font-bold uppercase">{titleClean}</td>
                                 <td className="p-3 text-center text-[8px] font-black text-orange-600">{t.frequency}</td>
                                 <td className="p-3 text-center">
                                    <div className="w-5 h-5 border border-gray-400 mx-auto rounded-md"></div>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>

            <div id="kitchen-print-report" className="p-10 space-y-6 text-gray-900 font-sans h-full bg-white">
               <div className="flex items-center justify-between border-b-2 border-gray-900 pb-6">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-gray-900 text-white rounded-xl"><CookingPot size={24} /></div>
                     <h1 className="text-2xl font-black uppercase text-gray-900">Relatório de Higienização e Sanitização</h1>
                     <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Unidade Escolar / Setor de Nutrição Escolar</p>
                  </div>
               </div>
               <div className="text-right text-[10px] font-black uppercase">
                  <p>Relatório de Execução do Sistema</p>
                  <p>Período: {new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
               </div>

               <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p>Responsável Técnico: ___________________________________</p>
                  <p>Setor: COZINHA/REFEITÓRIO</p>
               </div>

               <div className="border border-gray-900 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-gray-900 text-white">
                        <tr>
                           <th className="p-3 uppercase text-[9px] font-black w-[5%] text-center">POP</th>
                           <th className="p-3 uppercase text-[9px] font-black w-[45%]">Descrição do Procedimento de Higiene</th>
                           <th className="p-3 uppercase text-[9px] font-black text-center w-[15%]">Freq.</th>
                           <th className="p-3 uppercase text-[9px] font-black w-[25%]">Data Realização</th>
                           <th className="p-3 uppercase text-[9px] font-black text-center w-[10%]">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200">
                        {tasks.map((t, idx) => {
                           const popMatch = t.title.match(/POP (\d+)/);
                           const popNumber = popMatch ? popMatch[1] : '--';
                           const titleClean = t.title.replace(/\(POP \d+\)/, '').trim();
                           const isCompletedInPeriod = t.status === 'CONCLUÍDO' && t.lastDone && 
                              t.lastDone.substring(0, 10) >= startDate && 
                              t.lastDone.substring(0, 10) <= endDate;

                           return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                 <td className="p-3 text-center text-[9px] font-black text-gray-400">{popNumber}</td>
                                 <td className="p-3 text-[10px] font-bold uppercase">{titleClean}</td>
                                 <td className="p-3 text-center text-[8px] font-black text-orange-600">{t.frequency}</td>
                                 <td className="p-3 text-[9px] font-bold text-gray-600">
                                    {isCompletedInPeriod && t.lastDone ? (
                                       <>
                                          <div>{new Date(t.lastDone).toLocaleString('pt-BR')}</div>
                                          {t.completedBy && <div className="text-[7px] text-gray-400 mt-0.5">Por: {t.completedBy}</div>}
                                       </>
                                    ) : (
                                       '____/____/____'
                                    )}
                                 </td>
                                 <td className={`p-3 text-center text-[9px] font-black uppercase ${isCompletedInPeriod ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {isCompletedInPeriod ? 'OK' : 'PENDENTE'}
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>

               <div className="mt-10 pt-10 border-t-2 border-dashed border-gray-200 flex flex-wrap justify-between gap-10">
                  {(() => {
                     const activeEmps = Array.from(new Set(
                        tasks.filter(t => 
                           t.status === 'CONCLUÍDO' && 
                           t.lastDone && 
                           t.lastDone.substring(0, 10) >= startDate && 
                           t.lastDone.substring(0, 10) <= endDate &&
                           t.completedBy && 
                           t.completedBy !== 'SISTEMA'
                        ).map(t => t.completedBy)
                     ));
                     
                     if (activeEmps.length > 0) {
                        return activeEmps.map(serverName => (
                           <div key={serverName} className="text-center space-y-2 flex-1 min-w-[200px]">
                              <div className="border-t border-gray-400 pt-1 mt-6">
                                 <p className="text-[9px] font-black uppercase">{serverName}</p>
                                 <p className="text-[7px] uppercase text-gray-400 font-bold">Nutrição Escolar (AAE)</p>
                              </div>
                           </div>
                        ));
                     } else {
                        return (
                           <div className="text-center space-y-2 flex-1 min-w-[200px]">
                              <div className="border-t border-gray-400 pt-1 mt-6">
                                 <p className="text-[9px] font-black uppercase">Responsável pela Cozinha</p>
                                 <p className="text-[7px] uppercase text-gray-400 font-bold">Nutrição Escolar (AAE)</p>
                              </div>
                           </div>
                        );
                     }
                  })()}
                  <div className="text-center space-y-2 flex-1 min-w-[200px]">
                     <div className="border-t border-gray-400 pt-1 mt-6">
                        <p className="text-[9px] font-black uppercase">Gestão Escolar / CDCE</p>
                        <p className="text-[7px] uppercase text-gray-400 font-bold">Assinatura / Carimbo</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default KitchenSanitation;
