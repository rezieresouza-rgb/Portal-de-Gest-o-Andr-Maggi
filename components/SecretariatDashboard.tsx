
import React, { useState, useEffect, useMemo } from 'react';
import {
   Users,
   GraduationCap,
   Briefcase,
   TrendingUp,
   AlertCircle,
   FileCheck,
   UserPlus,
   ArrowRight,
   Bell
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const SecretariatDashboard: React.FC = () => {
   const [studentCount, setStudentCount] = useState(0);
   const [classCount, setClassCount] = useState(0);

   useEffect(() => {
      const fetchStats = async () => {
         try {
            // 1. Total de Alunos
            const { count: totalStudents, error: studentError } = await supabase
               .from('students')
               .select('*', { count: 'exact', head: true });

            if (!studentError && totalStudents !== null) {
               setStudentCount(totalStudents);
            }

            // 2. Turmas com Alunos (Distintas na tabela de matrículas)
            // Nota: Supabase não suporta count(distinct) direto na API facilmente sem RPC ou query crua.
            // Vamos buscar todas as matrículas e contar no JS por enquanto (supondo volume aceitável para MVP)
            // Ou melhor: Buscar classrooms e filtrar quais tem enrollments.
            const { data: activeClasses, error: classError } = await supabase
               .from('enrollments')
               .select('classroom_id');

            if (!classError && activeClasses) {
               const uniqueClassIds = new Set(activeClasses.map(e => e.classroom_id));
               setClassCount(uniqueClassIds.size);
            }

         } catch (error) {
            console.error("Erro ao carregar estatísticas dashboard:", error);
         }
      };

      fetchStats();

      // Inscreve-se para atualizações em tempo real (Opcional, futuro)
      // const subscription = supabase.channel('dashboard_stats')...
   }, []);

   return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-20">

         {/* KPI Cards */}
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
                  <p className="text-3xl font-black text-emerald-700">42</p>
                  <Briefcase size={24} className="text-emerald-300" />
               </div>
            </div>
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm flex flex-col justify-between">
               <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pendências Docs</p>
               <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-black text-amber-700">12</p>
                  <AlertCircle size={24} className="text-amber-300" />
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Atividades Recentes */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                        <UserPlus className="text-indigo-600" /> Movimentações Recentes
                     </h3>
                     <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">Hoje</span>
                  </div>

                  <div className="space-y-4">
                     {[
                        { name: 'PEDRO ALVES SILVA', action: 'MATRÍCULA NOVA', class: '6º ANO B', date: '09:30' },
                        { name: 'MARIA EDUARDA G.', action: 'SOLICITAÇÃO TRANSFERÊNCIA', class: '9º ANO A', date: '10:15' },
                        { name: 'PROF. CRISTIANO P.', action: 'LANÇAMENTO DE NOTAS', class: '9º ANO A', date: '11:45' },
                     ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-transparent hover:border-indigo-200 transition-all group">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-xs">
                                 {item.name[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.name}</p>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase">{item.action}</span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase">{item.class}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="text-right flex items-center gap-4">
                              <p className="text-[10px] font-black text-gray-300 uppercase">{item.date}</p>
                              <button className="p-2 bg-white text-gray-300 hover:text-indigo-600 rounded-xl shadow-sm transition-all"><ArrowRight size={18} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Notificações para o Portal Diário */}
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
                        Existem <strong>4 novos avisos</strong> de enturmação pendentes de envio automático para os professores.
                     </p>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-300">
                           <span>Sincronização</span>
                           <span>95%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: '95%' }}></div>
                        </div>
                     </div>
                  </div>
                  <button className="relative z-10 mt-8 w-full py-4 bg-white text-indigo-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all shadow-lg flex items-center justify-center gap-2">
                     Disparar Alertas <TrendingUp size={14} />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default SecretariatDashboard;
