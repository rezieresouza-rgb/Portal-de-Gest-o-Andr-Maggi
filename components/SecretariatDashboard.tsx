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
   Loader2,
   Sparkles,
   Lock,
   Layers,
   RefreshCw
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAcademicYear } from '../contexts/AcademicYearContext';

interface DashboardMovement {
   id: string;
   student_name: string;
   type: string;
   description: string;
   date: string;
   classroom?: string;
}

const SecretariatDashboard: React.FC = () => {
   const { selectedYear, isReadOnly } = useAcademicYear();
   const [studentCount, setStudentCount] = useState(0);
   const [classCount, setClassCount] = useState(0);
   const [staffCount, setStaffCount] = useState(0);
   const [pendingDocsCount, setPendingDocsCount] = useState(0);
   const [recentMovements, setRecentMovements] = useState<DashboardMovement[]>([]);
   
   const [isLoading, setIsLoading] = useState(true);
   const [isSendingAlerts, setIsSendingAlerts] = useState(false);
   const [alertsSent, setAlertsSent] = useState(false);
   const [isCloning, setIsCloning] = useState(false);

   const isClassOfSelectedYear = (c: any) => {
      if (selectedYear === 2027) {
         return c.year === '2027' || (c.created_at && c.created_at >= '2027-01-01') || (c.name && c.name.includes('2027'));
      } else {
         return c.year !== '2027' && (!c.created_at || c.created_at < '2027-01-01') && (!c.name || !c.name.includes('2027'));
      }
   };

   const fetchDashboardData = async () => {
      try {
         setIsLoading(true);

         // 1. Buscar turmas do banco e filtrar estritamente pelo ano selecionado (2026 vs 2027)
         const { data: dbClassrooms, error: classError } = await supabase
            .from('classrooms')
            .select('id, name, year, created_at, shift, room_number');

         if (classError) throw classError;

         const yearClassrooms = (dbClassrooms || []).filter(isClassOfSelectedYear);
         const yearClassroomIds = yearClassrooms.map((c: any) => c.id);

         // 2. Servidores Reais (comum a toda a escola)
         const { count: totalStaff } = await supabase
            .from('staff')
            .select('*', { count: 'exact', head: true });
         setStaffCount(totalStaff || 0);

         // Se não há turmas cadastradas para este ano letivo (ex: 2027 iniciando limpo)
         if (yearClassroomIds.length === 0) {
            setStudentCount(0);
            setClassCount(0);
            setPendingDocsCount(0);
            setRecentMovements([]);
            setIsLoading(false);
            return;
         }

         // 3. Total de Alunos e Turmas com Alunos no Ano Selecionado
         const { data: activeE } = await supabase
            .from('enrollments')
            .select('student_id, classroom_id')
            .in('status', ['ATIVO', 'RECLASSIFICADO'])
            .in('classroom_id', yearClassroomIds);
            
         if (activeE && activeE.length > 0) {
            const uniqueStudents = new Set(activeE.map((e: any) => e.student_id));
            setStudentCount(uniqueStudents.size);
            const uniqueClassIds = new Set(activeE.map((e: any) => e.classroom_id));
            setClassCount(uniqueClassIds.size);
         } else {
            setStudentCount(0);
            setClassCount(yearClassroomIds.length > 0 ? yearClassroomIds.length : 0);
         }

         // 4. Pendências Reais (apenas alunos com matrícula ativa no ano selecionado)
         if (activeE && activeE.length > 0) {
            const activeStudentIds = Array.from(new Set(activeE.map((e: any) => e.student_id)));
            const { count: pendingCount } = await supabase
               .from('students')
               .select('*', { count: 'exact', head: true })
               .in('id', activeStudentIds.slice(0, 500))
               .or('guardian_name.is.null,contact_phone.is.null,guardian_name.eq."",contact_phone.eq.""');
            setPendingDocsCount(pendingCount || 0);
         } else {
            setPendingDocsCount(0);
         }

         // 5. Movimentações Recentes do Ano Selecionado
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
                     classroom_id,
                     classrooms (name)
                  )
               )
            `)
            .order('movement_date', { ascending: false })
            .limit(15);

         let allMovements: DashboardMovement[] = [];

         if (movements) {
            movements.forEach((m: any) => {
               const s = m.students;
               const matchEnr = s?.enrollments?.find((e: any) => yearClassroomIds.includes(e.classroom_id));
               if (matchEnr) {
                  allMovements.push({
                     id: m.id,
                     student_name: s?.name || 'ALUNO NÃO IDENTIFICADO',
                     type: m.movement_type,
                     description: m.description,
                     date: m.movement_date,
                     classroom: matchEnr?.classrooms?.name || 'SEM TURMA'
                  });
               }
            });
         }

         allMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
         setRecentMovements(allMovements.slice(0, 5));

      } catch (error) {
         console.error("Erro ao carregar dashboard:", error);
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchDashboardData();
   }, [selectedYear]);

   const handleCloneClassesTo2027 = async () => {
      if (!window.confirm("Deseja criar a grade de turmas padrão para o Ano Letivo 2027 baseada nas turmas de 2026?")) return;
      try {
         setIsCloning(true);
         const { data: c2026, error: errFetch } = await supabase
            .from('classrooms')
            .select('name, shift, room_number')
            .not('year', 'eq', '2027');

         if (errFetch) throw errFetch;

         if (!c2026 || c2026.length === 0) {
            alert("Nenhuma turma de 2026 encontrada para clonar.");
            return;
         }

         // Remove duplicadas pelo nome
         const uniqueByName = Array.from(new Map(c2026.map(item => [item.name, item])).values());
         const newClasses = uniqueByName.map(c => ({
            name: c.name,
            year: '2027',
            shift: c.shift || 'MATUTINO',
            room_number: c.room_number || null,
            created_at: new Date().toISOString()
         }));

         const { error: errInsert } = await supabase.from('classrooms').insert(newClasses);
         if (errInsert) throw errInsert;

         alert(`Sucesso! ${newClasses.length} turmas foram criadas para o Ano Letivo 2027 com as vagas abertas.`);
         await fetchDashboardData();
      } catch (err: any) {
         console.error(err);
         alert("Erro ao clonar turmas para 2027: " + err.message);
      } finally {
         setIsCloning(false);
      }
   };

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
            <p className="text-[10px] font-black uppercase tracking-widest">Carregando Indicadores do Ano Letivo {selectedYear}...</p>
         </div>
      );
   }

   return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20 w-full min-w-0">
         
         {/* BANNER INFORMATIVO ESPECÍFICO DO ANO LETIVO SELECIONADO */}
         {selectedYear === 2027 && (
            <div className="p-5 md:p-6 rounded-3xl bg-indigo-50 border border-indigo-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shrink-0 shadow-md shadow-indigo-600/20">
                     <Sparkles size={22} />
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[8px] font-black bg-indigo-600 text-white uppercase tracking-wider">Planejamento 2027</span>
                        <h3 className="text-sm md:text-base font-black text-indigo-950 uppercase tracking-tight">Painel da Secretaria — Ano Letivo 2027</h3>
                     </div>
                     <p className="text-xs text-indigo-700/90 mt-0.5 leading-relaxed">
                        Ambiente para planejamento, enturmações e matrículas do próximo ano letivo. Os dados de 2026 permanecem ativos no ano corrente.
                     </p>
                  </div>
               </div>

               {classCount === 0 && (
                  <button
                     onClick={handleCloneClassesTo2027}
                     disabled={isCloning}
                     className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-indigo-600/30 transition-all shrink-0 flex items-center gap-2 active:scale-95"
                  >
                     <RefreshCw size={14} className={isCloning ? "animate-spin" : ""} />
                     {isCloning ? 'Preparando...' : 'Clonar Grade de Turmas de 2026 para 2027'}
                  </button>
               )}
            </div>
         )}

         {/* KPI Cards Reais */}
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full min-w-0">
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between min-w-0">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Alunos Matriculados ({selectedYear})</p>
               <div className="flex items-end justify-between mt-1">
                  <p className="text-2xl md:text-3xl font-black text-gray-900 truncate">{studentCount}</p>
                  <GraduationCap size={24} className="text-indigo-200 shrink-0" />
               </div>
            </div>
            <div className="bg-indigo-50 p-5 md:p-6 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-between min-w-0">
               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest truncate">Turmas ({selectedYear})</p>
               <div className="flex items-end justify-between mt-1">
                  <p className="text-2xl md:text-3xl font-black text-indigo-700 truncate">{classCount}</p>
                  <Users size={24} className="text-indigo-300 shrink-0" />
               </div>
            </div>
            <div className="bg-emerald-50 p-5 md:p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between min-w-0">
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest truncate">Servidores Ativos</p>
               <div className="flex items-end justify-between mt-1">
                  <p className="text-2xl md:text-3xl font-black text-emerald-700 truncate">{staffCount}</p>
                  <Briefcase size={24} className="text-emerald-300 shrink-0" />
               </div>
            </div>
            <div className={`p-5 md:p-6 rounded-3xl border shadow-sm flex flex-col justify-between min-w-0 ${pendingDocsCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
               <p className={`text-[10px] font-black uppercase tracking-widest truncate ${pendingDocsCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>Pendências ({selectedYear})</p>
               <div className="flex items-end justify-between mt-1">
                  <p className={`text-2xl md:text-3xl font-black truncate ${pendingDocsCount > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{pendingDocsCount}</p>
                  <AlertCircle size={24} className={pendingDocsCount > 0 ? 'text-amber-300 shrink-0' : 'text-gray-200 shrink-0'} />
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full min-w-0">
            {/* Atividades Recentes Reais */}
            <div className="lg:col-span-2 space-y-6 min-w-0 w-full">
               <div className="bg-white p-4 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[400px] min-w-0 w-full">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-base sm:text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 truncate">
                        <Clock className="text-indigo-600 shrink-0" size={20} /> <span className="truncate">Movimentações Recentes ({selectedYear})</span>
                     </h3>
                     <button onClick={fetchDashboardData} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-all shrink-0" title="Atualizar dados"><Clock size={16} /></button>
                  </div>

                  {recentMovements.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <AlertCircle size={40} className="mb-2 opacity-30 text-indigo-400" />
                        <p className="text-xs font-black uppercase tracking-widest text-center text-slate-500">
                           {selectedYear === 2027 ? 'Nenhuma movimentação registrada em 2027 ainda' : 'Nenhuma movimentação recente'}
                        </p>
                        {selectedYear === 2027 && (
                           <p className="text-[11px] text-slate-400 text-center mt-1 max-w-sm">
                              As novas matrículas, transferências e rematrículas cadastradas para 2027 aparecerão listadas aqui.
                           </p>
                        )}
                     </div>
                  ) : (
                     <div className="space-y-4 min-w-0 w-full">
                        {recentMovements.map((item) => (
                           <div key={item.id} className="flex items-center justify-between p-3 sm:p-5 bg-gray-50 rounded-[2rem] border border-transparent hover:border-indigo-200 transition-all group gap-2 min-w-0 w-full">
                              <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
                                 <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-xs">
                                    {item.student_name[0]}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight truncate">{item.student_name}</p>
                                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 truncate">
                                       <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                          item.type === 'TRANSFERENCIA' ? 'bg-amber-100 text-amber-600' : 
                                          item.type === 'MATRÍCULA NOVA' ? 'bg-emerald-100 text-emerald-600' :
                                          'bg-indigo-100 text-indigo-600'
                                       }`}>{item.type}</span>
                                       <span className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase truncate">{item.classroom}</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right flex items-center gap-2 sm:gap-4 shrink-0">
                                 <p className="text-[9px] sm:text-[10px] font-black text-gray-300 uppercase font-mono">{formatDate(item.date)}</p>
                                 <div className="p-1.5 sm:p-2 bg-white text-gray-200 rounded-xl hidden xs:block"><ArrowRight size={16} /></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            {/* Simulação de Comunicação com Área do Professor */}
            <div className="space-y-6 min-w-0 w-full">
               <div className="bg-indigo-900 p-6 sm:p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between min-w-0 w-full">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 pointer-events-none"><Bell size={140} /></div>
                  <div className="relative z-10 space-y-6 min-w-0">
                     <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm shrink-0">
                           <FileCheck size={20} className="text-indigo-300" />
                        </div>
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-widest truncate">Push Área do Professor</h3>
                     </div>
                     <p className="text-indigo-100/80 text-xs sm:text-sm leading-relaxed font-medium">
                        {alertsSent
                           ? <strong>Sincronização de Enturmação ({selectedYear}): OK. Todos os dados foram disparados.</strong>
                           : <>A enturmação de <strong>{selectedYear}</strong> está sincronizada com os Diários Digitais correspondentes.</>
                        }
                     </p>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-300 truncate">
                           <span className="truncate">{isSendingAlerts ? 'Processando...' : 'Status do Sync'}</span>
                           <span className="shrink-0">{alertsSent ? 'CONCLUÍDO' : (isSendingAlerts ? '60%' : 'ESTÁVEL')}</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 ${alertsSent ? 'bg-emerald-500 w-full' : (isSendingAlerts ? 'bg-amber-500 w-[60%]' : 'bg-indigo-400 w-full opacity-30')}`}></div>
                        </div>
                     </div>
                  </div>
                  <button
                     onClick={handleSendAlerts}
                     disabled={isSendingAlerts || alertsSent || isReadOnly}
                     className={`relative z-10 mt-8 w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${alertsSent
                        ? 'bg-emerald-500 text-white cursor-default'
                        : (isSendingAlerts ? 'bg-indigo-100 text-indigo-400' : (isReadOnly ? 'bg-white/20 text-white/50 cursor-not-allowed' : 'bg-white text-indigo-950 hover:bg-indigo-50'))
                        }`}
                  >
                     <span className="truncate">{isReadOnly ? 'Bloqueado (Ano Arquivado)' : (isSendingAlerts ? 'Sincronizando...' : (alertsSent ? 'Sincronizado' : 'Sincronizar Diários'))}</span>
                     {!isSendingAlerts && !alertsSent && !isReadOnly && <TrendingUp size={14} className="shrink-0" />}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default SecretariatDashboard;
