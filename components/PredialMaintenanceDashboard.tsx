
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
   Hammer,
   AlertTriangle,
   CheckCircle2,
   Clock,
   Search,
   Filter,
   Printer,
   Download,
   History,
   LayoutDashboard,
   ChevronRight,
   Settings2,
   FileText,
   ShieldCheck,
   Calendar,
   Zap,
   Droplets,
   HardHat,
   Monitor,
   Flame,
   Scale,
   Loader2
} from 'lucide-react';
import { MaintenanceTask, MaintenanceArea, MaintenanceFrequency } from '../types';
import MaintenanceReports from './MaintenanceReports';

const INITIAL_TASKS: MaintenanceTask[] = [
   // DIÁRIA / CONTÍNUA
   { id: 'mt-1', area: 'ESTRUTURAL', title: 'Vistorias Visuais dos Ambientes', description: 'Rachaduras, infiltrações, instalações elétricas e hidráulicas.', frequency: 'DIÁRIA', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-2', area: 'ESTRUTURAL', title: 'Limpeza e Conservação de Áreas Comuns', description: 'Manutenção contínua de pisos, paredes e áreas comuns.', frequency: 'DIÁRIA', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-3', area: 'ELÉTRICA', title: 'Monitoramento de Equipamentos Constantes', description: 'Ventiladores, ar-condicionado, bebedouros.', frequency: 'DIÁRIA', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },

   // SEMANAL
   { id: 'mt-4', area: 'ELÉTRICA', title: 'Testes Básicos Elétricos/Hidráulicos', description: 'Verificação de funcionalidade simples em sistemas básicos.', frequency: 'SEMANAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-5', area: 'HIDRÁULICA', title: 'Inspeção de Ralos, Sifões e Válvulas', description: 'Prevenção de entupimentos e vazamentos.', frequency: 'SEMANAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-6', area: 'INCÊNDIO', title: 'Verificação de Extintores e Sinalização', description: 'Checagem visual de carga e placas de emergência.', frequency: 'SEMANAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },

   // MENSAL
   { id: 'mt-7', area: 'HIDRÁULICA', title: 'Inspeção de Reservatórios de Água', description: 'Caixas d’água e cisternas.', frequency: 'MENSAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-8', area: 'HIDRÁULICA', title: 'Verificação de Tubulações e Registros', description: 'Detecção de vazamentos e travamentos.', frequency: 'MENSAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-9', area: 'INCÊNDIO', title: 'Sistemas de Combate a Incêndio', description: 'Hidrantes e mangueiras.', frequency: 'MENSAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-10', area: 'ESTRUTURAL', title: 'Avaliação de Pintura e Revestimentos', description: 'Manutenção de fachadas e salas.', frequency: 'MENSAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },

   // TRIMESTRAL
   { id: 'mt-11', area: 'ESTRUTURAL', title: 'Revisão de Cobertura e Forros', description: 'Telhas, lajes e forros de gesso/pvc.', frequency: 'TRIMESTRAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-12', area: 'ESTRUTURAL', title: 'Inspeção de Esquadrias', description: 'Portas e janelas.', frequency: 'TRIMESTRAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-13', area: 'ELÉTRICA', title: 'Testes de Prevenção (SPDA)', description: 'Para-raios e aterramento.', frequency: 'TRIMESTRAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-14', area: 'ESTRUTURAL', title: 'Avaliação de Quadras Poliesportivas', description: 'Piso e pintura de demarcação.', frequency: 'TRIMESTRAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },

   // SEMESTRAL
   { id: 'mt-15', area: 'INCÊNDIO', title: 'Revisão de Instalações de Gás', description: 'Válvulas, mangueiras e central.', frequency: 'SEMESTRAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-16', area: 'OUTROS', title: 'Equipamentos Industriais (Cozinha)', description: 'Fogão, forno, balcão térmico.', frequency: 'SEMESTRAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-17', area: 'MOBILIÁRIO', title: 'Verificação de Mobiliário Escolar', description: 'Mesas, cadeiras e armários.', frequency: 'SEMESTRAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },

   // ANUAL
   { id: 'mt-18', area: 'ELÉTRICA', title: 'Manutenção Elétrica Completa', description: 'Aperto de barramentos e revisão de quadros.', frequency: 'ANUAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-19', area: 'HIDRÁULICA', title: 'Manutenção Hidráulica Completa', description: 'Revisão de bombas e sistema principal.', frequency: 'ANUAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-20', area: 'ESTRUTURAL', title: 'Inspeção de Muros e Calçamentos', description: 'Gradis e acessos externos.', frequency: 'ANUAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-21', area: 'ACESSIBILIDADE', title: 'Avaliação de Acessibilidade', description: 'Rampas, corrimãos, piso tátil.', frequency: 'ANUAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-22', area: 'OUTROS', title: 'Controle de Pragas e Drenagem', description: 'Desinsetização e limpeza de drenos.', frequency: 'ANUAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
   { id: 'mt-23', area: 'OUTROS', title: 'Revisão de Eletrônicos', description: 'Computadores, Chromes e TVs.', frequency: 'ANUAL', dueDate: new Date().toISOString().split('T')[0], status: 'PENDENTE' },
];

import { supabase } from '../supabaseClient';

const PredialMaintenanceDashboard: React.FC<{ onNavigateToPreventive?: () => void }> = ({ onNavigateToPreventive }) => {
   const [viewMode, setViewMode] = useState<'dashboard' | 'reports'>('dashboard');
   const [tasks, setTasks] = useState<MaintenanceTask[]>([]);

   const [activeArea, setActiveArea] = useState<MaintenanceArea | 'TODOS'>('TODOS');
   const [activeFreq, setActiveFreq] = useState<MaintenanceFrequency | 'TODOS'>('TODOS');
   const [searchTerm, setSearchTerm] = useState('');
   const [isPrinting, setIsPrinting] = useState(false);

   const fetchTasks = async () => {
      try {
         const { data, error } = await supabase
            .from('maintenance_tasks')
            .select('*')
            .order('due_date');

         if (error) throw error;

         if (data && data.length > 0) {
            setTasks(data.map(t => ({
               id: t.id,
               area: t.area as MaintenanceArea,
               title: t.title,
               description: t.description,
               frequency: t.frequency as MaintenanceFrequency,
               dueDate: t.due_date,
               status: t.status as 'PENDENTE' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'ALERTA' | 'ATRASADO',
               lastPerformed: t.last_performed
            })));
         } else if (data && data.length === 0) {
            // Auto-seed
            const { data: inserted, error: insertError } = await supabase
               .from('maintenance_tasks')
               .insert(INITIAL_TASKS.map(t => ({
                  area: t.area,
                  title: t.title,
                  description: t.description,
                  frequency: t.frequency,
                  due_date: t.dueDate,
                  status: t.status
               })))
               .select();

            if (inserted) {
               setTasks(inserted.map(t => ({
                  id: t.id,
                  area: t.area as MaintenanceArea,
                  title: t.title,
                  description: t.description,
                  frequency: t.frequency as MaintenanceFrequency,
                  dueDate: t.due_date,
                  status: t.status as 'PENDENTE' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'ALERTA' | 'ATRASADO',
                  lastPerformed: t.last_performed
               })));
            }
         }
      } catch (error) {
         console.error("Erro ao buscar manutenção predial:", error);
      }
   };

   useEffect(() => {
      fetchTasks();
      const sub = supabase.channel('maintenance_changes')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tasks' }, fetchTasks)
         .subscribe();
      return () => { sub.unsubscribe(); };
   }, []);

   const stats = useMemo(() => {
      const total = tasks.length;
      const ok = tasks.filter(t => t.status === 'CONCLUIDO').length;
      const delayed = tasks.filter(t => {
         const today = new Date();
         const due = new Date(t.dueDate);
         return t.status !== 'CONCLUIDO' && due < today;
      }).length;
      const alerts = tasks.filter(t => {
         const today = new Date();
         const due = new Date(t.dueDate);
         const diff = due.getTime() - today.getTime();
         const days = diff / (1000 * 60 * 60 * 24);
         return t.status !== 'CONCLUIDO' && days > 0 && days < 7;
      }).length;

      return {
         total,
         ok,
         alerts,
         delayed,
         percent: total > 0 ? (ok / total) * 100 : 0
      };
   }, [tasks]);

   const filteredTasks = useMemo(() => {
      return tasks.filter(t => {
         const matchArea = activeArea === 'TODOS' || t.area === activeArea;
         const matchFreq = activeFreq === 'TODOS' || t.frequency === activeFreq;
         const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
         return matchArea && matchFreq && matchSearch;
      });
   }, [tasks, activeArea, activeFreq, searchTerm]);

   const handlePrintReport = async () => {
      setIsPrinting(true);
      const element = document.getElementById('maintenance-report-printable');
      if (!element) return setIsPrinting(false);

      try {
         // @ts-ignore
         await window.html2pdf().set({
            margin: 10,
            filename: `Relatorio_Manutencao_Predial_${new Date().getFullYear()}.pdf`,
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

   const updateTaskStatus = async (id: string, newStatus: MaintenanceTask['status']) => {
      try {
         await supabase.from('maintenance_tasks').update({ status: newStatus }).eq('id', id);
      } catch (error) {
         console.error("Erro ao atualizar status:", error);
      }
   };

   const completeTask = async (id: string) => {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      if (window.confirm("Confirmar execução desta manutenção?")) {
         const nextDate = new Date(task.dueDate);
         if (task.frequency === 'DIÁRIA') nextDate.setDate(nextDate.getDate() + 1);
         else if (task.frequency === 'SEMANAL') nextDate.setDate(nextDate.getDate() + 7);
         else if (task.frequency === 'MENSAL') nextDate.setMonth(nextDate.getMonth() + 1);
         else if (task.frequency === 'TRIMESTRAL') nextDate.setMonth(nextDate.getMonth() + 3);
         else if (task.frequency === 'SEMESTRAL') nextDate.setMonth(nextDate.getMonth() + 6);
         else if (task.frequency === 'ANUAL') nextDate.setFullYear(nextDate.getFullYear() + 1);
         else if (task.frequency === 'BIENAL') nextDate.setFullYear(nextDate.getFullYear() + 2);
         else if (task.frequency === 'QUINQUENAL') nextDate.setFullYear(nextDate.getFullYear() + 5);

         try {
            await supabase.from('maintenance_tasks').update({
               status: 'CONCLUIDO',
               last_performed: new Date().toISOString(),
               due_date: nextDate.toISOString().split('T')[0]
            }).eq('id', id);
            alert("Atividade concluída e próxima data agendada!");
         } catch (error) {
            console.error("Erro ao concluir manutenção:", error);
            alert("Erro ao concluir manutenção.");
         }
      }
   };

   if (viewMode === 'reports') {
      return <MaintenanceReports onBack={() => setViewMode('dashboard')} />;
   }

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">

         {/* PAINEL DE ALERTAS E KPIs */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Atividades</p>
               <p className="text-3xl font-black text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Em Conformidade</p>
               <p className="text-3xl font-black text-emerald-700 mt-1">{stats.ok}</p>
            </div>
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
               <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Vencimento Próximo</p>
               <p className="text-3xl font-black text-amber-700 mt-1">{stats.alerts}</p>
            </div>
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm">
               <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Atrasadas</p>
               <p className="text-3xl font-black text-red-700 mt-1">{stats.delayed}</p>
            </div>
         </div>

         {/* FILTROS E BUSCA */}
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
                     <Hammer size={32} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Painel Predial</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Protocolo de Manutenção Escolar v2025</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button
                     onClick={onNavigateToPreventive}
                     className="px-6 py-4 bg-orange-50 text-orange-600 border border-orange-100 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-100 transition-all flex items-center gap-2"
                  >
                     <ShieldCheck size={18} />
                     Plano Preventivo
                  </button>
                  <button
                     onClick={() => setViewMode('reports')}
                     className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2"
                  >
                     <FileText size={18} />
                     Relatórios
                  </button>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 border-t border-gray-50 pt-6">
               <select
                  value={activeArea}
                  onChange={e => setActiveArea(e.target.value as any)}
                  className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
               >
                  <option value="TODOS">Todas as Áreas</option>
                  <option value="ELÉTRICA">Elétrica</option>
                  <option value="HIDRÁULICA">Hidráulica</option>
                  <option value="ESTRUTURAL">Estrutural</option>
                  <option value="INCÊNDIO">Incêndio</option>
                  <option value="MOBILIÁRIO">Mobiliário</option>
                  <option value="ACESSIBILIDADE">Acessibilidade</option>
               </select>
               <select
                  value={activeFreq}
                  onChange={e => setActiveFreq(e.target.value as any)}
                  className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
               >
                  <option value="TODOS">Todas Periodicidades</option>
                  <option value="DIÁRIA">Diária / Contínua</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="MENSAL">Mensal</option>
                  <option value="TRIMESTRAL">Trimestral</option>
                  <option value="SEMESTRAL">Semestral</option>
                  <option value="ANUAL">Anual</option>
               </select>
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                     type="text"
                     placeholder="Pesquisar atividade..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
               </div>
            </div>
         </div>

         {/* LISTAGEM DE TAREFAS */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTasks.map(task => {
               const today = new Date();
               const due = new Date(task.dueDate);
               const diff = due.getTime() - today.getTime();
               const days = diff / (1000 * 60 * 60 * 24);

               let visualStatus: 'PENDENTE' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'ALERTA' | 'ATRASADO' = task.status;
               if (task.status !== 'CONCLUIDO') {
                  if (due < today) visualStatus = 'ATRASADO';
                  else if (days < 7) visualStatus = 'ALERTA';
               }

               const statusColors = {
                  'PENDENTE': 'bg-white border-gray-100 opacity-90',
                  'EM_EXECUCAO': 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10',
                  'CONCLUIDO': 'bg-emerald-50 border-emerald-200 opacity-75',
                  'ALERTA': 'bg-amber-50 border-amber-200 animate-pulse',
                  'ATRASADO': 'bg-red-50 border-red-200'
               };

               const statusLabels = {
                  'PENDENTE': 'A Executar',
                  'EM_EXECUCAO': 'Em Execução',
                  'CONCLUIDO': 'Executado',
                  'ALERTA': 'Crítico / Próximo',
                  'ATRASADO': 'Vencido / Atrasado'
               };

               const AreaIcon = task.area === 'ELÉTRICA' ? Zap :
                  task.area === 'HIDRÁULICA' ? Droplets :
                     task.area === 'INCÊNDIO' ? Flame :
                        task.area === 'MOBILIÁRIO' ? Monitor :
                           task.area === 'ESTRUTURAL' ? HardHat : Scale;

               return (
                  <div key={task.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col justify-between shadow-md relative overflow-hidden group ${statusColors[visualStatus]}`}>
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-2xl ${task.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-600 shadow-sm'}`}>
                                 <AreaIcon size={24} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{task.area}</p>
                                 <h4 className="text-sm font-black text-gray-900 uppercase leading-snug">{task.title}</h4>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-2">
                              {visualStatus === 'ATRASADO' && <span className="px-2 py-0.5 bg-red-600 text-white rounded-lg text-[7px] font-black uppercase">Vencido</span>}
                              {visualStatus === 'ALERTA' && <span className="px-2 py-0.5 bg-amber-500 text-white rounded-lg text-[7px] font-black uppercase tracking-tighter">Vencendo Logo</span>}

                              <select
                                 value={task.status}
                                 onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                                 className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border outline-none cursor-pointer transition-all ${task.status === 'CONCLUIDO' ? 'bg-emerald-600 text-white border-emerald-700' :
                                    task.status === 'EM_EXECUCAO' ? 'bg-blue-600 text-white border-blue-700' :
                                       'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                                    }`}
                              >
                                 <option value="PENDENTE">A Executar</option>
                                 <option value="EM_EXECUCAO">Em Execução</option>
                                 <option value="CONCLUIDO">Executado</option>
                              </select>
                           </div>
                        </div>

                        <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2 h-8">{task.description}</p>

                        <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
                           <div className="flex gap-4">
                              <div>
                                 <p className="text-[8px] font-black text-gray-400 uppercase">Periodicidade</p>
                                 <p className="text-[10px] font-black text-gray-900 uppercase">{task.frequency}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-gray-400 uppercase">Próximo Prazo</p>
                                 <p className={`text-[10px] font-black ${visualStatus === 'ATRASADO' ? 'text-red-600' : visualStatus === 'ALERTA' ? 'text-amber-600' : 'text-gray-900'}`}>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</p>
                              </div>
                           </div>
                           <button
                              onClick={() => completeTask(task.id)}
                              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm flex items-center gap-2 ${task.status === 'CONCLUIDO' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-900 text-white hover:bg-black'
                                 }`}
                           >
                              <CheckCircle2 size={14} /> {task.status === 'CONCLUIDO' ? 'Concluir Próxima' : 'Marcar como Concluído'}
                           </button>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>

         {/* REMOVED HIDDEN PRINTABLE AREA - NOW HANDLED BY MaintenanceReports COMPONENT */}
         <div className="hidden"></div>
      </div>
   );
};

export default PredialMaintenanceDashboard;
