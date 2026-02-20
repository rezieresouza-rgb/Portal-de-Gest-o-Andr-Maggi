
import React, { useMemo, useState, useEffect } from 'react';
import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Cell,
   PieChart,
   Pie,
   Legend
} from 'recharts';
import {
   TrendingUp,
   AlertTriangle,
   CheckCircle2,
   Users,
   Flag,
   Calendar,
   Sparkles,
   TrendingDown,
   Loader2
} from 'lucide-react';
import { AttendanceRecord, ClassroomOccurrence } from '../types';
import { supabase } from '../supabaseClient';

const COLORS = ['#d97706', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

const TeacherPerformance: React.FC = () => {
   const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
   const [occurrences, setOccurrences] = useState<ClassroomOccurrence[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchData = async () => {
         setLoading(true);
         try {
            // Fetch Attendance
            const { data: attendanceData, error: attendanceError } = await supabase
               .from('class_attendance_records')
               .select(`
            *,
            presences:class_attendance_students(*)
          `)
               .eq('teacher_name', 'PROF. CRISTIANO') // Mock user filter
               .order('date', { ascending: false });

            if (attendanceError) throw attendanceError;

            const mappedAttendance: AttendanceRecord[] = attendanceData.map(rec => ({
               id: rec.id,
               date: rec.date,
               shift: rec.shift as any,
               className: rec.classroom_name,
               teacherName: rec.teacher_name,
               subject: rec.subject,
               timestamp: new Date(rec.created_at).getTime(),
               presences: rec.presences.map((p: any) => ({
                  studentId: p.student_id,
                  studentName: p.student_name,
                  isPresent: p.is_present
               }))
            }));
            setAttendanceRecords(mappedAttendance);

            // Fetch Occurrences
            const { data: occurrencesData, error: occurrencesError } = await supabase
               .from('occurrences')
               .select('*')
               .eq('responsible_name', 'PROF. CRISTIANO'); // Mock user filter

            if (occurrencesError) throw occurrencesError;

            const mappedOccurrences: ClassroomOccurrence[] = occurrencesData.map(occ => ({
               id: occ.id,
               date: occ.date,
               teacherName: occ.responsible_name,
               className: occ.classroom_name,
               studentName: occ.student_name,
               type: occ.category as any,
               severity: occ.severity as any,
               description: occ.description,
               notifiedParents: false, // Default
               timestamp: new Date(occ.created_at || occ.date).getTime()
            }));
            setOccurrences(mappedOccurrences);

         } catch (error) {
            console.error('Error fetching performance data:', error);
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, []);

   const stats = useMemo(() => {
      if (attendanceRecords.length === 0 && occurrences.length === 0) return null;

      const classFrequencies: Record<string, { total: number, present: number }> = {};
      attendanceRecords.forEach(rec => {
         if (!classFrequencies[rec.className]) classFrequencies[rec.className] = { total: 0, present: 0 };
         rec.presences.forEach(p => {
            classFrequencies[rec.className].total++;
            if (p.isPresent) classFrequencies[rec.className].present++;
         });
      });

      const attendanceChartData = Object.entries(classFrequencies).map(([name, data]) => ({
         name,
         percentage: data.total > 0 ? (data.present / data.total) * 100 : 0
      }));

      const occurrenceTypeCount: Record<string, number> = {};
      occurrences.forEach(occ => {
         occurrenceTypeCount[occ.type] = (occurrenceTypeCount[occ.type] || 0) + 1;
      });

      const occurrenceChartData = Object.entries(occurrenceTypeCount).map(([name, value]) => ({
         name,
         value
      }));

      const globalPresence = attendanceRecords.reduce((acc, rec) => {
         const present = rec.presences.filter(p => p.isPresent).length;
         return { total: acc.total + rec.presences.length, present: acc.present + present };
      }, { total: 0, present: 0 });

      const criticalStudents: Record<string, number> = {};
      attendanceRecords.forEach(rec => {
         rec.presences.forEach(p => {
            if (!p.isPresent && p.studentName) {
               criticalStudents[p.studentName] = (criticalStudents[p.studentName] || 0) + 1;
            }
         });
      });

      const mostAbsent = Object.entries(criticalStudents)
         .sort((a, b) => b[1] - a[1])
         .slice(0, 5)
         .map(([name, absences]) => ({ name, absences }));

      return {
         attendanceChartData,
         occurrenceChartData,
         globalPresencePercent: globalPresence.total > 0 ? (globalPresence.present / globalPresence.total) * 100 : 0,
         totalOccurrences: occurrences.length,
         mostAbsent
      };
   }, [attendanceRecords, occurrences]);

   if (loading) {
      return (
         <div className="flex justify-center items-center py-32">
            <Loader2 className="animate-spin text-gray-300" size={48} />
         </div>
      );
   }

   if (!stats) {
      return (
         <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <TrendingUp size={64} className="mb-6 opacity-20" />
            <h3 className="text-xl font-black uppercase tracking-widest text-gray-300">Sem dados pedagógicos</h3>
            <p className="text-sm font-medium mt-2">Realize a chamada e registre ocorrências para gerar o painel.</p>
         </div>
      );
   }

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">

         {/* SUMÁRIO EXECUTIVO */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
               <div className="p-3 w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mb-4 flex items-center justify-center">
                  <Users size={24} />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Média de Presença</p>
               <div className="flex items-end gap-2">
                  <p className="text-3xl font-black text-gray-900 mt-1">{stats.globalPresencePercent.toFixed(1)}%</p>
                  <span className={`text-[10px] font-bold mb-1 flex items-center gap-0.5 ${stats.globalPresencePercent >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                     {stats.globalPresencePercent >= 90 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                     {stats.globalPresencePercent >= 90 ? 'Excelente' : 'Atenção'}
                  </span>
               </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
               <div className="p-3 w-12 h-12 rounded-xl bg-red-50 text-red-600 mb-4 flex items-center justify-center">
                  <AlertTriangle size={24} />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fatos Lançados</p>
               <p className="text-3xl font-black text-gray-900 mt-1">{stats.totalOccurrences}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
               <div className="p-3 w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mb-4 flex items-center justify-center">
                  <CheckCircle2 size={24} />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Elogios (Foco Positivo)</p>
               <p className="text-3xl font-black text-gray-900 mt-1">
                  {stats.occurrenceChartData.find(d => d.name === 'ELOGIO')?.value || 0}
               </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
               <div className="p-3 w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-4 flex items-center justify-center">
                  <Calendar size={24} />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diários Processados</p>
               <p className="text-3xl font-black text-gray-900 mt-1">{attendanceRecords.length}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* GRÁFICO DE PRESENÇA POR TURMA */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Assiduidade por Turma</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Frequência média acumulada</p>
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><TrendingUp size={20} /></div>
               </div>
               <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={stats.attendanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} />
                        <Tooltip
                           cursor={{ fill: '#f9fafb' }}
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="percentage" radius={[12, 12, 0, 0]} barSize={40}>
                           {stats.attendanceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.percentage >= 90 ? '#10b981' : entry.percentage >= 75 ? '#f59e0b' : '#ef4444'} />
                           ))}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* DISTRIBUIÇÃO DE OCORRÊNCIAS */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Perfil Comportamental</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tipificação de ocorrências no período</p>
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Flag size={20} /></div>
               </div>
               <div className="h-72 flex flex-col md:flex-row items-center">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={stats.occurrenceChartData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                        >
                           {stats.occurrenceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ALUNOS COM MAIOR AUSÊNCIA */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                     <AlertTriangle size={20} className="text-red-500" /> Alerta de Evasão / Infrequência
                  </h3>
               </div>
               <div className="space-y-4">
                  {stats.mostAbsent.map((s, idx) => (
                     <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-red-100 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm shrink-0 font-black text-xs">
                              {idx + 1}º
                           </div>
                           <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{s.name}</p>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <p className="text-[10px] font-black text-red-600 uppercase">{s.absences} Faltas acumuladas</p>
                              <p className="text-[8px] text-gray-400 font-bold uppercase">Últimos 30 dias</p>
                           </div>
                           <button className="px-4 py-2 bg-white text-[10px] font-black text-red-600 uppercase rounded-xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm">Notificar</button>
                        </div>
                     </div>
                  ))}
                  {stats.mostAbsent.length === 0 && (
                     <p className="text-center py-10 text-gray-300 font-black uppercase text-xs">Nenhum alerta de frequência crítico</p>
                  )}
               </div>
            </div>

            {/* INSIGHTS IA */}
            <div className="bg-amber-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col shadow-xl">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                  <Sparkles size={140} />
               </div>
               <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                        <Sparkles size={20} className="text-amber-400" />
                     </div>
                     <h3 className="text-lg font-black uppercase tracking-widest">Insight do Dia</h3>
                  </div>
                  <div className="space-y-6">
                     <p className="text-amber-100/80 text-sm font-medium leading-relaxed italic">
                        "Identificamos um aumento de 15% nos elogios na turma 6º ANO A. Recomenda-se aplicar a mesma metodologia de incentivo na turma 7º ANO B para melhorar o clima escolar."
                     </p>
                     <div className="pt-6 border-t border-white/10 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-amber-400">
                           <span>Meta de Engajamento</span>
                           <span>85%</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-500" style={{ width: '72%' }}></div>
                        </div>
                     </div>
                  </div>
               </div>
               <button className="relative z-10 mt-8 w-full py-4 bg-white text-amber-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-50 active:scale-95 transition-all">
                  Plano de Intervenção IA
               </button>
            </div>
         </div>
      </div>
   );
};

export default TeacherPerformance;
