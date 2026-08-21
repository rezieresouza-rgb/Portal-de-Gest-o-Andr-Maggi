import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { 
  Filter, AlertTriangle, TrendingUp, Users, ShieldAlert, Award, FileText, Printer,
  Search, User, Star, Sparkles, CheckCircle, Shield, ThumbsUp, ThumbsDown, Calendar,
  FileCheck, Layers, ChevronRight, UserCheck, AlertCircle
} from 'lucide-react';

interface CivicoMilitarReportsProps {
  studentStates: any[];
  inspections: any[];
  routines: any[];
}

type Period = 'HOJE' | 'SEMANA' | 'MES' | 'TRIMESTRE' | 'ANO';

const COLORS = {
  LEVE: '#3b82f6', // blue-500
  MÉDIA: '#f59e0b', // amber-500
  GRAVE: '#ef4444', // red-500
  MERIT: '#10b981' // emerald-500
};

const getBehaviorStatus = (score: number) => {
  if (score >= 9.0) return { label: 'EXCELENTE CONDUTA', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 7.0) return { label: 'BOA CONDUTA', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (score >= 5.0) return { label: 'REGULAR', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
  if (score >= 3.0) return { label: 'INSUFICIENTE', color: 'bg-orange-50 text-orange-700 border-orange-200' };
  return { label: 'INCOMPATÍVEL / MAU', color: 'bg-red-50 text-red-700 border-red-200' };
};

const CivicoMilitarReports: React.FC<CivicoMilitarReportsProps> = ({ studentStates, inspections, routines }) => {
  const [period, setPeriod] = useState<Period>('MES');
  const [activeReportTab, setActiveReportTab] = useState<'general' | 'student'>('general');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

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

  const classesList = useMemo(() => {
    const set = new Set<string>();
    (studentStates || []).forEach(s => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set).sort();
  }, [studentStates]);

  const matchingStudents = useMemo(() => {
    return (studentStates || []).filter(s => {
      const matchClass = selectedClassFilter === 'ALL' || s.className === selectedClassFilter;
      const term = studentSearchTerm.toLowerCase().trim();
      const matchName = !term || 
        s.studentName.toLowerCase().includes(term) || 
        String(s.studentId).includes(term) ||
        s.className.toLowerCase().includes(term);
      return matchClass && matchName;
    });
  }, [studentStates, selectedClassFilter, studentSearchTerm]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return (studentStates || []).find(s => String(s.studentId) === String(selectedStudentId)) || null;
  }, [studentStates, selectedStudentId]);

  const selectedStudentInspections = useMemo(() => {
    if (!selectedStudentId) return [];
    return (inspections || []).filter(i => String(i.studentId) === String(selectedStudentId));
  }, [inspections, selectedStudentId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
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

    // Inspections Stats
    let totalInspections = 0;
    const inspectionItemsCounts: Record<string, number> = {};

    (inspections || []).forEach(insp => {
      if (!isDateInPeriod(insp.date, period)) return;
      totalInspections++;
      if (!inspectionItemsCounts[insp.item]) inspectionItemsCounts[insp.item] = 0;
      inspectionItemsCounts[insp.item]++;
    });

    const topInspectionItems = Object.entries(inspectionItemsCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Routine Stats
    let totalRoutines = 0;
    let completedSteps = 0;
    let possibleSteps = 0;

    (routines || []).forEach(rout => {
      if (!isDateInPeriod(rout.date, period)) return;
      totalRoutines++;
      possibleSteps += 10;
      if (rout.formationOk) completedSteps++;
      if (rout.commandersPresent) completedSteps++;
      if (rout.flagsRaised?.national) completedSteps++;
      if (rout.flagsRaised?.state) completedSteps++;
      if (rout.flagsRaised?.municipal) completedSteps++;
      if (rout.anthemsSung?.national) completedSteps++;
      if (rout.anthemsSung?.state) completedSteps++;
      if (rout.anthemsSung?.school) completedSteps++;
      if (rout.marchingOk) completedSteps++;
      if (rout.bulletinRead) completedSteps++;
    });

    const routineAdherence = possibleSteps > 0 ? Math.round((completedSteps / possibleSteps) * 100) : 100;

    (studentStates || []).forEach(student => {
      (student.occurrences || []).forEach((occ: any) => {
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
      timelineData,
      totalInspections,
      topInspectionItems,
      totalRoutines,
      routineAdherence
    };
  }, [studentStates, inspections, routines, period]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Tabs Navigation */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Relatórios Disciplinares</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Módulo Cívico-Militar EE André Maggi</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveReportTab('general')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeReportTab === 'general'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={14} /> Estatísticas Gerais
          </button>
          <button
            onClick={() => setActiveReportTab('student')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeReportTab === 'student'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User size={14} /> Relatório por Aluno
          </button>
        </div>
      </div>

      {/* ABA 1: VISÃO GERAL E ESTATÍSTICAS */}
      {activeReportTab === 'general' && (
        <div className="space-y-6">
          {/* Period Filter & Print */}
          <div className="flex justify-end items-center gap-3 print:hidden">
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
            
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-colors"
            >
              <Printer size={16} /> Imprimir Geral
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-[1.2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><FileText size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ocorrências</p>
                <p className="text-3xl font-black text-slate-900">{filteredData.totalOccurrences}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-[1.2rem] bg-red-50 text-red-500 flex items-center justify-center shrink-0"><AlertTriangle size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deméritos</p>
                <p className="text-3xl font-black text-red-500">{filteredData.totalDemerits}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-[1.2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><Award size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Méritos</p>
                <p className="text-3xl font-black text-emerald-500">{filteredData.totalMerits}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-[1.2rem] bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><Users size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alunos</p>
                <p className="text-3xl font-black text-blue-500">{filteredData.studentsAffectedCount}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-[1.2rem] bg-orange-50 text-orange-500 flex items-center justify-center shrink-0"><ShieldAlert size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inspeções</p>
                <p className="text-3xl font-black text-orange-500">{filteredData.totalInspections}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-[1.2rem] bg-purple-50 text-purple-500 flex items-center justify-center shrink-0"><TrendingUp size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Adesão Rotina</p>
                <p className="text-3xl font-black text-purple-500">{filteredData.routineAdherence}%</p>
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

          {/* Top Inspection Items Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                <ShieldAlert size={18} className="text-orange-500" /> Irregularidades de Fardamento
              </h3>
              <div className="space-y-4">
                {filteredData.topInspectionItems.length > 0 ? filteredData.topInspectionItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                    <div className="flex-1 pr-4">
                      <p className="text-[10px] font-black text-slate-700 uppercase leading-snug line-clamp-2">{item.name}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 flex items-center justify-center font-black text-orange-500 shrink-0 shadow-sm">
                      {item.value}
                    </div>
                  </div>
                )) : <p className="text-xs text-slate-400 font-bold uppercase text-center py-10">Nenhuma inspeção registrada</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: RELATÓRIO INDIVIDUAL DO ALUNO */}
      {activeReportTab === 'student' && (
        <div className="space-y-6">
          {/* Card de Busca de Aluno */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <UserCheck size={22} className="text-indigo-600" /> Emitir Relatório Individual do Aluno
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Busque o aluno pelo nome ou código para gerar a ficha cadastral e histórico completo de ocorrências.
                </p>
              </div>

              {selectedStudent && (
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Printer size={18} /> Imprimir Relatório (PDF)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Digite o nome do aluno ou código da matrícula..."
                  value={studentSearchTerm}
                  onChange={e => setStudentSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div>
                <select
                  value={selectedClassFilter}
                  onChange={e => setSelectedClassFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-black uppercase text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ALL">Todas as Turmas ({studentStates.length} Alunos)</option>
                  {classesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista com Seleção de Alunos */}
            {!selectedStudentId && (
              <div className="pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Selecione um aluno na lista abaixo ({matchingStudents.length} encontrados):
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {matchingStudents.map(s => {
                    const status = getBehaviorStatus(s.score);
                    const occCount = (s.occurrences || []).length;
                    return (
                      <button
                        key={s.studentId}
                        onClick={() => setSelectedStudentId(s.studentId)}
                        className="text-left p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/80 hover:border-indigo-200 transition-all group flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-[9px] font-bold text-slate-400">#{s.studentId}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${status.color}`}>
                            {s.score.toFixed(1)} pts
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 uppercase truncate group-hover:text-indigo-600 transition-colors">
                          {s.studentName}
                        </h4>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/60 text-[9px] font-bold text-slate-500">
                          <span>Turma: {s.className}</span>
                          <span>{occCount} Ocorrência(s)</span>
                        </div>
                      </button>
                    );
                  })}
                  {matchingStudents.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                      Nenhum aluno encontrado para os critérios informados.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Aluno Selecionado Bar */}
            {selectedStudent && (
              <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                    {selectedStudent.studentName.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">{selectedStudent.studentName}</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Turma: {selectedStudent.className} • Código: {selectedStudent.studentId}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider underline px-2 py-1"
                >
                  Selecionar Outro Aluno
                </button>
              </div>
            )}
          </div>

          {/* FICHA RELATÓRIO DO ALUNO (ÁREA IMPRESSA) */}
          {selectedStudent ? (
            <div id="student-report-print" className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200/80 shadow-md space-y-8 print:p-0 print:border-none print:shadow-none print:rounded-none">
              
              {/* Cabeçalho Oficial do Relatório */}
              <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
                <div className="flex justify-center items-center gap-3 mb-2">
                  <Shield size={36} className="text-slate-900" />
                </div>
                <h1 className="text-lg font-black uppercase text-slate-900 tracking-tight">
                  Escola Estadual Cívico-Militar EE André Maggi
                </h1>
                <h2 className="text-xs font-black uppercase text-indigo-800 tracking-widest">
                  Relatório Disciplinar Individual do Aluno - SISMIL
                </h2>
                <p className="text-[9px] font-bold text-slate-500 uppercase">
                  SEDUC/MT • Diretoria Regional de Educação • Colíder - MT
                </p>
              </div>

              {/* Bloco 1: Dados do Aluno */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <div className="md:col-span-2 space-y-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Nome do Aluno</span>
                  <h3 className="text-base font-black text-slate-900 uppercase">{selectedStudent.studentName}</h3>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600 pt-1">
                    <span><strong>Turma:</strong> {selectedStudent.className}</span>
                    <span><strong>Código Matrícula:</strong> #{selectedStudent.studentId}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 space-y-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Nota de Atitude Atual</span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-slate-900">{selectedStudent.score.toFixed(1)}</span>
                    <span className={`px-3 py-1 text-[9px] font-black rounded-xl border uppercase ${getBehaviorStatus(selectedStudent.score).color}`}>
                      {getBehaviorStatus(selectedStudent.score).label}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {selectedStudent.isClassLeader && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[8px] font-black rounded uppercase">Líder de Turma</span>
                    )}
                    {selectedStudent.isCivicHighlight && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-black rounded uppercase">Destaque Cívico</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bloco 2: Resumo Estatístico do Aluno */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Ocorrências</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{(selectedStudent.occurrences || []).length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Méritos (Elogios)</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {(selectedStudent.occurrences || []).filter((o: any) => o.type === 'MERIT').length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-center">
                  <p className="text-[8px] font-black text-red-600 uppercase tracking-widest">Deméritos (Faltas)</p>
                  <p className="text-2xl font-black text-red-700 mt-1">
                    {(selectedStudent.occurrences || []).filter((o: any) => o.type === 'DEMERIT').length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-center">
                  <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest">Inspeções Fardamento</p>
                  <p className="text-2xl font-black text-orange-700 mt-1">{selectedStudentInspections.length}</p>
                </div>
              </div>

              {/* Bloco 3: Tabela de Histórico de Atitude */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Award size={16} className="text-indigo-600" /> Histórico Disciplinar e de Atitude (Ocorrências & Elogios)
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {(selectedStudent.occurrences || []).length} Registros
                  </span>
                </div>

                {(selectedStudent.occurrences || []).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase font-black tracking-wider text-[8px] border-b border-slate-200">
                          <th className="py-2.5 px-3">Data</th>
                          <th className="py-2.5 px-3">Tipo / Pontos</th>
                          <th className="py-2.5 px-3">Enquadramento / Categoria</th>
                          <th className="py-2.5 px-3">Medida Aplicada</th>
                          <th className="py-2.5 px-3">Observações / Detalhes</th>
                          <th className="py-2.5 px-3">Responsável</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedStudent.occurrences.map((occ: any) => (
                          <tr key={occ.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-bold text-slate-700 whitespace-nowrap">
                              {formatDate(occ.date)}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                occ.type === 'MERIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {occ.type === 'MERIT' ? `MÉRITO (+${occ.points})` : `DEMÉRITO (-${occ.points})`}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold uppercase text-slate-800 max-w-[200px]">
                              {occ.category}
                              {occ.isEscalated && (
                                <span className="ml-1 text-[7px] font-black text-purple-700 bg-purple-100 px-1 py-0.2 rounded">
                                  Reincidência
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700">
                              {occ.disciplinaryMeasure ? (
                                <span className="bg-slate-100 px-2 py-0.5 rounded font-bold">
                                  {occ.disciplinaryMeasure}
                                  {occ.suspensionDays ? ` (${occ.suspensionDays} dia(s))` : ''}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-3 px-3 text-slate-600 italic max-w-[250px]">
                              "{occ.observations || 'Sem observações adicionais.'}"
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-500 whitespace-nowrap">
                              {occ.responsible || 'Gestor'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    Excelente conduta. Nenhuma ocorrência disciplinar registrada para este aluno.
                  </div>
                )}
              </div>

              {/* Bloco 4: Tabela de Inspeções de Fardamento */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-orange-500" /> Registro de Inspeções de Fardamento e Apresentação
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {selectedStudentInspections.length} Registros
                  </span>
                </div>

                {selectedStudentInspections.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-orange-50 text-orange-900 uppercase font-black tracking-wider text-[8px] border-b border-orange-100">
                          <th className="py-2.5 px-3">Data</th>
                          <th className="py-2.5 px-3">Item Inspecionado</th>
                          <th className="py-2.5 px-3">Turno</th>
                          <th className="py-2.5 px-3">Observações</th>
                          <th className="py-2.5 px-3">Responsável</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedStudentInspections.map((insp: any) => (
                          <tr key={insp.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-bold text-slate-700 whitespace-nowrap">
                              {formatDate(insp.date)}
                            </td>
                            <td className="py-3 px-3 font-bold uppercase text-orange-700">
                              {insp.item}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-600">
                              {insp.shift || 'MATUTINO'}
                            </td>
                            <td className="py-3 px-3 text-slate-600 italic">
                              "{insp.observations || 'Sem observações.'}"
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-500 whitespace-nowrap">
                              {insp.responsible || 'Monitor'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    Nenhuma irregularidade de fardamento ou apresentação pessoal registrada.
                  </div>
                )}
              </div>

              {/* Bloco 5: Termo de Homologação / Assinaturas */}
              <div className="pt-12 border-t-2 border-slate-900 space-y-12">
                <div className="text-center font-bold text-xs text-slate-800">
                  Colíder - MT, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-center pt-8">
                  <div className="space-y-2">
                    <div className="border-b border-slate-900 w-3/4 mx-auto"></div>
                    <p className="text-[10px] font-black uppercase text-slate-900">Gestão Cívico-Militar / Monitoria</p>
                    <p className="text-[8px] font-bold uppercase text-slate-400">EE Cívico-Militar André Maggi</p>
                  </div>

                  <div className="space-y-2">
                    <div className="border-b border-slate-900 w-3/4 mx-auto"></div>
                    <p className="text-[10px] font-black uppercase text-slate-900">Responsável Legal pelo Aluno</p>
                    <p className="text-[8px] font-bold uppercase text-slate-400">Ciente do Histórico Disciplinar</p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-16 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-4 print:hidden">
              <User size={48} className="mx-auto text-slate-300" />
              <h3 className="text-base font-black uppercase text-slate-800">Nenhum Aluno Selecionado</h3>
              <p className="text-xs font-bold text-slate-400 uppercase max-w-md mx-auto">
                Utilize o campo de busca acima para pesquisar o nome de um aluno e visualizar/imprimir a Ficha e Histórico Disciplinar Individual.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CivicoMilitarReports;
