import React, { useState, useEffect } from 'react';
import {
   Users,
   GraduationCap,
   Briefcase,
   TrendingUp,
   AlertCircle,
   FileCheck,
   UserPlus,
   ArrowRight,
   Bell,
   Clock,
   Loader2
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface DashboardMovement {
   id: string;
   student_name: string;
   type: string;
   description: string;
   date: string;
   classroom?: string;
}

const SecretariatDashboard: React.FC = () => {
   const [studentCount, setStudentCount] = useState(0);
   const [classCount, setClassCount] = useState(0);
   const [staffCount, setStaffCount] = useState(0);
   const [pendingDocsCount, setPendingDocsCount] = useState(0);
   const [recentMovements, setRecentMovements] = useState<DashboardMovement[]>([]);
   
   const [isLoading, setIsLoading] = useState(true);
   const [isSendingAlerts, setIsSendingAlerts] = useState(false);
   const [alertsSent, setAlertsSent] = useState(false);

   const fetchDashboardData = async () => {
      try {
         setIsLoading(true);

         // 1. Total de Alunos (Ativos e com turma)
         const { data: activeE } = await supabase
            .from('enrollments')
            .select('student_id')
            .in('status', ['ATIVO', 'RECLASSIFICADO']);
            
         if (activeE) {
            const uniqueStudents = new Set(activeE.map((e: any) => e.student_id));
            setStudentCount(uniqueStudents.size);
         } else {
            setStudentCount(0);
         }

         // 2. Turmas Ativas (com matrícula)
         const { data: enrollments } = await supabase
            .from('enrollments')
            .select('classroom_id');
         if (enrollments) {
            const uniqueClassIds = new Set(enrollments.map(e => e.classroom_id));
            setClassCount(uniqueClassIds.size);
         }

         // 3. Servidores Reais
         const { count: totalStaff } = await supabase
            .from('staff')
            .select('*', { count: 'exact', head: true });
         setStaffCount(totalStaff || 0);

         // 4. Pendências Reais (Alunos sem Responsável ou Telefone)
         const { count: pendingCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .or('guardian_name.is.null,contact_phone.is.null,guardian_name.eq."",contact_phone.eq.""');
         setPendingDocsCount(pendingCount || 0);

         // 5. Movimentações Recentes Reais
         const { data: movements } = await supabase
            .from('student_movements')
            .select(`
               id,
               movement_type,
               description,
               movement_date,
               students (
                  name,
                  enrollments (
                     status,
                     classrooms (name)
                  )
               )
            `)
            .order('movement_date', { ascending: false })
            .limit(5);

         if (movements) {
            const mapped: DashboardMovement[] = movements.map((m: any) => {
               const s = m.students;
               const activeEnr = s?.enrollments?.find((e: any) => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO') || s?.enrollments?.[0];
               return {
                  id: m.id,
                  student_name: s?.name || 'ALUNO NÃO IDENTIFICADO',
                  type: m.movement_type,
                  description: m.description,
                  date: m.movement_date,
                  classroom: activeEnr?.classrooms?.name || 'SEM TURMA'
               };
            });
            setRecentMovements(mapped);
         }

      } catch (error) {
         console.error("Erro ao carregar dashboard:", error);
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchDashboardData();
   }, []);

   const handleSendAlerts = () => {
      setIsSendingAlerts(true);
      setTimeout(() => {
         setIsSendingAlerts(false);
         setAlertsSent(true);
         alert("Sincronização concluída com sucesso!");
      }, 1500);
   };

   const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}`;
   };

   if (isLoading) {
      return (
         <div className="h-96 flex flex-col items-center justify-center gap-4 text-gray-400">
            <Loader2 className="animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest">Carregando Indicadores Reais...</p>
         </div>
      );
   }

   return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-20">
         {/* KPI Cards Reais */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alunos Matriculados</p>
               <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-black text-gray-900">{studentCount}</p>
                  <GraduationCap size={24} className="text-indigo-200" />
               </div>
            </div>
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-between">
               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Turmas com Alunos</p>
               <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-black text-indigo-700">{classCount}</p>
                  <Users size={24} className="text-indigo-300" />
               </div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Servidores Ativos</p>
               <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-black text-emerald-700">{staffCount}</p>
                  <Briefcase size={24} className="text-emerald-300" />
               </div>
            </div>
            <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between ${pendingDocsCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
               <p className={`text-[10px] font-black uppercase tracking-widest ${pendingDocsCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>Pendências Cadastrais</p>
               <div className="flex items-end justify-between mt-1">
                  <p className={`text-3xl font-black ${pendingDocsCount > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{pendingDocsCount}</p>
                  <AlertCircle size={24} className={pendingDocsCount > 0 ? 'text-amber-300' : 'text-gray-200'} />
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Atividades Recentes Reais */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[400px]">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                        <HistoryIcon className="text-indigo-600" /> Movimentações Recentes
                     </h3>
                     <button onClick={fetchDashboardData} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-all"><Clock size={16} /></button>
                  </div>

                  {recentMovements.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                        <AlertCircle size={40} className="mb-2 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma movimentação este mês</p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {recentMovements.map((item) => (
                           <div key={item.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-transparent hover:border-indigo-200 transition-all group">
                              <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-xs">
                                    {item.student_name[0]}
                                 </div>
                                 <div className="max-w-[250px]">
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{item.student_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                       <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                          item.type === 'TRANSFERENCIA' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                                       }`}>{item.type}</span>
                                       <span className="text-[9px] text-gray-400 font-bold uppercase truncate">{item.classroom}</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right flex items-center gap-4">
                                 <p className="text-[10px] font-black text-gray-300 uppercase font-mono">{formatDate(item.date)}</p>
                                 <div className="p-2 bg-white text-gray-200 rounded-xl"><ArrowRight size={18} /></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            {/* Simulação de Comunicação com Área do Professor */}
            <div className="space-y-6">
               <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Bell size={140} /></div>
                  <div className="relative z-10 space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                           <FileCheck size={20} className="text-indigo-300" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-widest">Push Área do Professor</h3>
                     </div>
                     <p className="text-indigo-100/80 text-sm leading-relaxed font-medium">
                        {alertsSent
                           ? <strong>Sincronização de Enturmação: OK. Todos os dados foram disparados.</strong>
                           : <>A enturmação atual está <strong>sincronizada</strong> com os Diários Digitais. Não há alertas pendentes.</>
                        }
                     </p>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-300">
                           <span>{isSendingAlerts ? 'Processando...' : 'Status do Sync'}</span>
                           <span>{alertsSent ? 'CONCLUÍDO' : (isSendingAlerts ? '60%' : 'ESTÁVEL')}</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 ${alertsSent ? 'bg-emerald-500 w-full' : (isSendingAlerts ? 'bg-amber-500 w-[60%]' : 'bg-indigo-400 w-full opacity-30')}`}></div>
                        </div>
                     </div>
                  </div>
                  <button
                     onClick={handleSendAlerts}
                     disabled={isSendingAlerts || alertsSent}
                     className={`relative z-10 mt-8 w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${alertsSent
                        ? 'bg-emerald-500 text-white cursor-default'
                        : (isSendingAlerts ? 'bg-indigo-100 text-indigo-400' : 'bg-white text-indigo-950 hover:bg-indigo-50')
                        }`}
                  >
                     {isSendingAlerts ? 'Sincronizando...' : (alertsSent ? 'Sincronizado' : 'Sincronizar Diários')}
                     {!isSendingAlerts && !alertsSent && <TrendingUp size={14} />}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

// Simple Icon component used in the JSX
const HistoryIcon = ({ className }: { className?: string }) => (
   <Clock className={className} size={20} />
);

export default SecretariatDashboard;
