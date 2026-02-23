
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
   Loader2
} from 'lucide-react';

type KitchenArea = 'Pré-preparo' | 'Cocção' | 'Distribuição' | 'Higiene e Lixo' | 'Armazenamento' | 'Utensílios/Equipamentos';
type Frequency = 'DIÁRIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL' | 'PERIÓDICA';

interface SanitationTask {
   id: string;
   area: KitchenArea;
   title: string;
   frequency: Frequency;
   status: 'CONCLUÍDO' | 'PENDENTE' | 'ATRASADO';
   lastDone?: string;
   notes?: string;
}

const KITCHEN_AREAS: KitchenArea[] = [
   'Pré-preparo', 'Cocção', 'Distribuição', 'Higiene e Lixo', 'Armazenamento', 'Utensílios/Equipamentos'
];

const INITIAL_KITCHEN_TASKS: SanitationTask[] = [
   // DIÁRIAS
   { id: 'k-1', area: 'Higiene e Lixo', title: 'Higienização das mãos dos manipuladores (POP 2)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-2', area: 'Pré-preparo', title: 'Higienização das mesas e bancadas de manipulação (POP 8)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-3', area: 'Utensílios/Equipamentos', title: 'Higienização de utensílios: facas, talheres, pratos, canecas, placas (POP 6)', frequency: 'DIÁRIA', status: 'PENDENTE' },
   { id: 'k-4', area: 'Utensílios/Equipamentos', title: 'Higienização de utensílios em alumínio: panelas, assadeiras, conchas (POP 7)', frequency: 'DIÁRIA', status: 'PENDENTE' },
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
];

const KitchenSanitation: React.FC = () => {
   const [tasks, setTasks] = useState<SanitationTask[]>(() => {
      const saved = localStorage.getItem('kitchen_sanitation_tasks_v2');
      return saved ? JSON.parse(saved) : INITIAL_KITCHEN_TASKS;
   });

   const [filterArea, setFilterArea] = useState<KitchenArea | 'TODOS'>('TODOS');
   const [filterFreq, setFilterFreq] = useState<Frequency | 'TODOS'>('DIÁRIA');
   const [searchTerm, setSearchTerm] = useState('');
   const [isPrinting, setIsPrinting] = useState(false);

   useEffect(() => {
      localStorage.setItem('kitchen_sanitation_tasks_v2', JSON.stringify(tasks));
   }, [tasks]);

   const toggleTask = (id: string) => {
      setTasks(prev => prev.map(t => {
         if (t.id !== id) return t;
         const isDone = t.status === 'CONCLUÍDO';
         return {
            ...t,
            status: isDone ? 'PENDENTE' : 'CONCLUÍDO',
            lastDone: isDone ? undefined : new Date().toISOString()
         };
      }));
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

   const handlePrintKitchen = async () => {
      setIsPrinting(true);
      const element = document.getElementById('kitchen-print-area');
      if (!element) return setIsPrinting(false);

      try {
         // @ts-ignore
         await window.html2pdf().set({
            margin: 10,
            filename: `Checklist_Cozinha_UANE_${new Date().getFullYear()}.pdf`,
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

         {/* PAINEL DE CONTROLE DA COZINHA */}
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
                  <button
                     onClick={handlePrintKitchen}
                     disabled={isPrinting}
                     className="w-full py-4 bg-white text-orange-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-2 border border-white/20 shadow-lg"
                  >
                     {isPrinting ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                     Checklist Diário (BOAS PRÁTICAS)
                  </button>
                  <button
                     onClick={handlePrintKitchen}
                     disabled={isPrinting}
                     className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-xl border border-orange-500"
                  >
                     {isPrinting ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
                     Imprimir Cronograma Mensal
                  </button>
               </div>
            </div>
         </div>

         {/* ÁREA DE FILTROS E BUSCA */}
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

         {/* LISTAGEM DE TAREFAS EM CARDS */}
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
                        <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tight flex items-center gap-1">
                           <CheckCircle2 size={10} /> Realizado: {new Date(task.lastDone).toLocaleString('pt-BR')}
                        </p>
                     )}
                  </div>

                  <div className="mt-8 flex gap-2 relative z-10">
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
            ))}
         </div>

         {/* TEMPLATE OCULTO PARA IMPRESSÃO COZINHA */}
         <div className="hidden">
            <div id="kitchen-print-area" className="p-10 space-y-6 text-gray-900 font-sans h-full bg-white">
               <div className="flex items-center justify-between border-b-2 border-gray-900 pb-6">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-gray-900 text-white rounded-xl"><CookingPot size={24} /></div>
                     <h1 className="text-2xl font-black uppercase text-gray-900">Controle de Higienização e Sanitização</h1>
                     <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Unidade Escolar / Setor de Nutrição Escolar</p>
                  </div>
               </div>
               <div className="text-right text-[10px] font-black uppercase">
                  <p>Checklist Mensal</p>
                  <p>Mês/Ano: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase bg-gray-50 p-4 rounded-xl border border-gray-100">
               <p>Responsável Técnico: ___________________________________</p>
               <p>Setor: COZINHA ESCOLAR / ALIMENTAÇÃO</p>
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
                              <td className="p-3 text-center text-[8px] font-black text-orange-600">{t.frequency[0]}</td>
                              <td className="p-3 text-center">
                                 <div className="w-5 h-5 border border-gray-400 mx-auto rounded-md"></div>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>

            <div className="mt-10 pt-10 border-t-2 border-dashed border-gray-200 grid grid-cols-2 gap-20">
               <div className="text-center space-y-2">
                  <div className="border-t border-gray-400 pt-1">
                     <p className="text-[9px] font-black uppercase">Responsável pela Cozinha (AAE)</p>
                     <p className="text-[7px] uppercase text-gray-400 font-bold">Data: ____/____/{new Date().getFullYear()}</p>
                  </div>
               </div>
               <div className="text-center space-y-2">
                  <div className="border-t border-gray-400 pt-1">
                     <p className="text-[9px] font-black uppercase">Gestão Escolar / CDCE</p>
                     <p className="text-[7px] uppercase text-gray-400 font-bold">Assinatura / Carimbo</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default KitchenSanitation;
