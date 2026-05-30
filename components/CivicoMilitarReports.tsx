import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Filter, AlertTriangle, TrendingUp, Users, ShieldAlert, Award, FileText } from 'lucide-react';
import { StudentBehaviorState } from '../types'; // Adjust imports as necessary

interface CivicoMilitarReportsProps {
  studentStates: StudentBehaviorState[];
}

type Period = 'HOJE' | 'SEMANA' | 'MES' | 'TRIMESTRE' | 'ANO';

const COLORS = {
  LEVE: '#3b82f6', // blue-500
  MÉDIA: '#f59e0b', // amber-500
  GRAVE: '#ef4444', // red-500
  MERIT: '#10b981' // emerald-500
};

const CivicoMilitarReports: React.FC<CivicoMilitarReportsProps> = ({ studentStates }) => {
  const [period, setPeriod] = useState<Period>('MES');

  // Helper to filter dates
  const isDateInPeriod = (dateStr: string, p: Period) => {
    const d = new Date(dateStr);
    const now = new Date();
    
    // Normalize to midnight for fair comparison
    d.setHours(0,0,0,0);
    const today = new Date(now);
    today.setHours(0,0,0,0);

    const diffTime = Math.abs(today.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (p) {
      case 'HOJE': return diffDays === 0;
      case 'SEMANA': return diffDays <= 7;
      case 'MES': return diffDays <= 30;
      case 'TRIMESTRE': return diffDays <= 90;
      case 'ANO': return diffDays <= 365;
      default: return true;
    }
  };

  const filteredData = useMemo(() => {
    let totalOccurrences = 0;
    let totalMerits = 0;
    let totalDemerits = 0;
    const severityCount = { LEVE: 0, MÉDIA: 0, GRAVE: 0 };
    
    const studentsAffected = new Set<string>();
    
    // For rankings
    const infractionCounts: Record<string, number> = {};
    const classCounts: Record<string, number> = {};
    const studentCounts: Record<string, { name: string, className: string, count: number }> = {};
    const meritStudentCounts: Record<string, { name: string, className: string, count: number }> = {};
    
    // For timeline (last 7 data points based on period)
    const timelineDataMap: Record<string, { date: string, demeritos: number, meritos: number }> = {};

    studentStates.forEach(student => {
      student.occurrences.forEach(occ => {
        if (!isDateInPeriod(occ.date, period)) return;

        totalOccurrences++;
        studentsAffected.add(student.studentId);
        
        // Timeline grouping
        const dateKey = occ.date;
        if (!timelineDataMap[dateKey]) {
          timelineDataMap[dateKey] = { date: dateKey, demeritos: 0, meritos: 0 };
        }

        // Classes ranking
        if (!classCounts[student.className]) classCounts[student.className] = 0;
        classCounts[student.className]++;

        // Students ranking
        if (!studentCounts[student.studentId]) {
          studentCounts[student.studentId] = { name: student.studentName, className: student.className, count: 0 };
        }
        studentCounts[student.studentId].count++;

        if (occ.type === 'MERIT') {
          totalMerits++;
          timelineDataMap[dateKey].meritos++;
          if (!meritStudentCounts[student.studentId]) {
            meritStudentCounts[student.studentId] = { name: student.studentName, className: student.className, count: 0 };
          }
          meritStudentCounts[student.studentId].count++;
        } else {
          totalDemerits++;
          timelineDataMap[dateKey].demeritos++;
          
          // Severity
          let sev: 'LEVE'|'MÉDIA'|'GRAVE' = 'LEVE';
          if (occ.points >= 1.0) sev = 'GRAVE';
          else if (occ.points >= 0.5) sev = 'MÉDIA';
          severityCount[sev]++;

          // Infractions
          if (!infractionCounts[occ.category]) infractionCounts[occ.category] = 0;
          infractionCounts[occ.category]++;
        }
      });
    });

    const topInfractions = Object.entries(infractionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.substring(0, 60) + (name.length > 60 ? '...' : ''), value }));

    const topClasses = Object.entries(classCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const topStudents = Object.values(studentCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topMeritStudents = Object.values(meritStudentCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const severityPie = [
      { name: 'Faltas Leves', value: severityCount.LEVE, color: COLORS.LEVE },
      { name: 'Faltas Médias', value: severityCount.MÉDIA, color: COLORS.MÉDIA },
      { name: 'Faltas Graves', value: severityCount.GRAVE, color: COLORS.GRAVE }
    ].filter(item => item.value > 0);

    const timelineData = Object.values(timelineDataMap)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(d => ({ ...d, date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }));

    return {
      totalOccurrences,
      totalMerits,
      totalDemerits,
      studentsAffectedCount: studentsAffected.size,
      topInfractions,
      topClasses,
      topStudents,
      topMeritStudents,
      severityPie,
      timelineData
    };
  }, [studentStates, period]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Filters */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Inteligência de Dados</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Estatísticas Disciplinares Cívico-Militares</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          {(['HOJE', 'SEMANA', 'MES', 'TRIMESTRE', 'ANO'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-200/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center"><FileText size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Registros</p>
            <p className="text-3xl font-black text-slate-900">{filteredData.totalOccurrences}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.2rem] bg-red-50 text-red-500 flex items-center justify-center"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deméritos (Faltas)</p>
            <p className="text-3xl font-black text-red-500">{filteredData.totalDemerits}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center"><Award size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Méritos (Elogios)</p>
            <p className="text-3xl font-black text-emerald-500">{filteredData.totalMerits}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.2rem] bg-blue-50 text-blue-500 flex items-center justify-center"><Users size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alunos Atingidos</p>
            <p className="text-3xl font-black text-blue-500">{filteredData.studentsAffectedCount}</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-8">Evolução Temporal</h3>
          <div className="h-72">
            {filteredData.timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData.timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Line type="monotone" name="Faltas" dataKey="demeritos" stroke={COLORS.GRAVE} strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Elogios" dataKey="meritos" stroke={COLORS.MERIT} strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase text-xs">Sem dados no período</div>
            )}
          </div>
        </div>

        {/* Severity Pie Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 text-center">Proporção de Faltas</h3>
          <div className="flex-1 min-h-[250px]">
            {filteredData.severityPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredData.severityPie}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {filteredData.severityPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', marginTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase text-xs">Sem deméritos</div>
            )}
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Infractions */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-500" /> Infrações Mais Comuns
          </h3>
          <div className="space-y-4">
            {filteredData.topInfractions.length > 0 ? filteredData.topInfractions.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1 pr-4">
                  <p className="text-[10px] font-black text-slate-700 uppercase leading-snug line-clamp-2">{item.name}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-red-500 shrink-0">
                  {item.value}
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 font-bold uppercase text-center py-10">Nenhuma infração</p>}
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Alunos Reincidentes
          </h3>
          <div className="space-y-4">
            {filteredData.topStudents.length > 0 ? filteredData.topStudents.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-amber-100 text-amber-600 flex items-center justify-center font-black text-[10px]">{idx + 1}º</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[140px]">{item.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{item.className}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-amber-600 shrink-0">
                  {item.count}
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 font-bold uppercase text-center py-10">Nenhum aluno reincidente</p>}
          </div>
        </div>

        {/* Top Classes */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
            <Users size={18} className="text-blue-500" /> Turmas Mais Críticas
          </h3>
          <div className="space-y-4">
            {filteredData.topClasses.length > 0 ? filteredData.topClasses.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-blue-200">
                    {idx + 1}º
                  </div>
                  <p className="text-xs font-black text-slate-900 uppercase">{item.name}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center font-black text-blue-600 shrink-0 shadow-sm">
                  {item.value}
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 font-bold uppercase text-center py-10">Nenhuma turma</p>}
          </div>
        </div>

        {/* Top Merits */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
            <Award size={18} className="text-emerald-500" /> Alunos Destaque (Elogios)
          </h3>
          <div className="space-y-4">
            {filteredData.topMeritStudents.length > 0 ? filteredData.topMeritStudents.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[10px]">{idx + 1}º</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[140px]">{item.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{item.className}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center font-black text-emerald-600 shrink-0">
                  {item.count}
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 font-bold uppercase text-center py-10">Nenhum aluno com méritos</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CivicoMilitarReports;
