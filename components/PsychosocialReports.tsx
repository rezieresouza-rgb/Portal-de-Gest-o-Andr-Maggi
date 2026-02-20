
import React from 'react';
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
  Download, 
  FileText, 
  ShieldCheck, 
  Activity, 
  Smile, 
  Frown,
  Meh
} from 'lucide-react';
import { PsychosocialRole } from '../types';

const PsychosocialReports: React.FC<{ role: PsychosocialRole }> = ({ role }) => {
  const chartData = [
    { name: 'Conflitos', value: 35 },
    { name: 'Bullying', value: 12 },
    { name: 'Familiar', value: 28 },
    { name: 'Aprendizagem', value: 25 },
  ];

  const COLORS = ['#e11d48', '#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
               <TrendingUp size={32} />
            </div>
            <div>
               <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Impacto e Performance</h3>
               <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Consolidação de Dados Relacionais</p>
            </div>
         </div>
         <div className="flex gap-4">
            <button className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2">
               <Download size={14} /> Exportar Relatório Anual
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* TIPOLOGIA DE CASOS */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-10 flex items-center gap-2">
               <Activity size={16} className="text-rose-600" /> Tipologia de Intervenções
            </h4>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} />
                     <Tooltip 
                        cursor={{fill: '#fff1f2'}} 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                     />
                     <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={50}>
                        {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* CLIMA ESCOLAR */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-10 flex items-center gap-2">
               <Smile size={16} className="text-rose-600" /> Percepção do Clima Escolar
            </h4>
            <div className="grid grid-cols-3 gap-6 text-center">
               <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-3">
                  <Smile size={32} className="text-emerald-600 mx-auto" />
                  <div>
                     <p className="text-2xl font-black text-emerald-700">62%</p>
                     <p className="text-[8px] font-black text-emerald-600 uppercase">Satisfeito</p>
                  </div>
               </div>
               <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-3">
                  <Meh size={32} className="text-amber-600 mx-auto" />
                  <div>
                     <p className="text-2xl font-black text-amber-700">28%</p>
                     <p className="text-[8px] font-black text-amber-600 uppercase">Regular</p>
                  </div>
               </div>
               <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 space-y-3">
                  <Frown size={32} className="text-rose-600 mx-auto" />
                  <div>
                     <p className="text-2xl font-black text-rose-700">10%</p>
                     <p className="text-[8px] font-black text-rose-600 uppercase">Conflituoso</p>
                  </div>
               </div>
            </div>
            <div className="mt-10 p-6 bg-gray-900 rounded-[2rem] text-white">
               <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2">Meta Institucional</p>
               <p className="text-sm font-bold leading-relaxed italic">"Reduzir o índice de conflitos violentos em 40% até o fim do semestre letivo."</p>
            </div>
         </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
               <ShieldCheck size={24} />
            </div>
            <div>
               <h4 className="text-sm font-black text-gray-900 uppercase">Dados Protegidos (LGPD)</h4>
               <p className="text-xs text-gray-400 font-medium">Todos os relatórios individuais são anonimizados para fins estatísticos de gestão.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PsychosocialReports;
