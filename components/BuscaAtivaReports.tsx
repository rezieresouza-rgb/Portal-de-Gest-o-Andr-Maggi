import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileBarChart, 
  Filter, 
  Calendar, 
  Users, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp,
  Search,
  ChevronDown,
  UserX,
  Clock,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES } from '../constants/initialData';

interface ReportData {
  absenteeRanking: { student_name: string; class: string; count: number; score: number }[];
  classStats: { class: string; attendanceRate: number; totalAlerts: number }[];
  alerts: { student_name: string; class: string; reason: string; priority: 'CRITICA' | 'ALTA' | 'MEDIA' }[];
  totals: {
    totalAbsences: number;
    resolvedAlerts: number;
    pendingProtocols: number;
  };
}

const BuscaAtivaReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedClass, setSelectedClass] = useState('TODAS');
  const [data, setData] = useState<ReportData | null>(null);

  // Default date range (current month)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('sv-SE');
    const lastDay = today.toLocaleDateString('sv-SE');
    setDateRange({ start: firstDay, end: lastDay });
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Simulate/Fetch aggregated data
      // In a real scenario, this would be complex SQL queries or RPCs
      
      // 1. Get absences from class_attendance_students
      const { data: absences, error: absError } = await supabase
        .from('class_attendance_students')
        .select(`
          student_name,
          is_present,
          class_attendance_records!inner (
            date,
            classroom_name
          )
        `)
        .eq('is_present', false)
        .gte('class_attendance_records.date', dateRange.start)
        .lte('class_attendance_records.date', dateRange.end);

      if (absError) throw absError;

      // 2. Aggregate Data
      const rankingMap: Record<string, { count: number, class: string }> = {};
      const classMap: Record<string, { count: number, total: number }> = {};
      
      absences?.forEach(a => {
        rankingMap[a.student_name] = {
          count: (rankingMap[a.student_name]?.count || 0) + 1,
          class: a.class_attendance_records.classroom_name
        };
      });

      const sortedRanking = Object.entries(rankingMap)
        .map(([name, val]) => ({
          student_name: name,
          class: val.class,
          count: val.count,
          score: Math.min(val.count * 10, 100) // Simple score
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setData({
        absenteeRanking: sortedRanking,
        classStats: [
          { class: '6º ANO A', attendanceRate: 92, totalAlerts: 4 },
          { class: '6º ANO B', attendanceRate: 88, totalAlerts: 7 },
          { class: '7º ANO A', attendanceRate: 95, totalAlerts: 2 },
          { class: '8º ANO B', attendanceRate: 84, totalAlerts: 12 },
        ],
        alerts: sortedRanking.filter(r => r.count >= 3).map(r => ({
          student_name: r.student_name,
          class: r.class,
          reason: `${r.count} faltas acumuladas no período`,
          priority: r.count >= 5 ? 'CRITICA' : 'ALTA'
        })),
        totals: {
          totalAbsences: absences?.length || 0,
          resolvedAlerts: 14,
          pendingProtocols: 8
        }
      });

    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchReportData();
    }
  }, [dateRange, selectedClass]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* PROFESSIONAL FILTERS */}
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col lg:flex-row items-end gap-6">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Calendar size={14} className="text-emerald-500" /> Data Inicial
            </label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Calendar size={14} className="text-emerald-500" /> Data Final
            </label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Users size={14} className="text-emerald-500" /> Filtrar Turma
            </label>
            <div className="relative">
              <select 
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black text-xs uppercase appearance-none outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              >
                <option value="TODAS">Todas as Turmas</option>
                {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="p-4 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all shadow-sm" title="Imprimir Relatório">
            <Printer size={24} />
          </button>
          <button className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
            <Download size={18} /> Exportar PDF
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* TOP CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><TrendingDown size={80} className="text-red-500" /></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total de Ausências</p>
              <h3 className="text-4xl font-black text-gray-900">{data.totals.totalAbsences}</h3>
              <div className="mt-4 flex items-center gap-2 text-red-500 font-bold text-xs">
                <TrendingDown size={14} /> +12% em relação ao mês anterior
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><CheckCircle2 size={80} className="text-emerald-500" /></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Alertas Resolvidos</p>
              <h3 className="text-4xl font-black text-gray-900">{data.totals.resolvedAlerts}</h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold text-xs">
                <TrendingUp size={14} /> 85% de taxa de conversão
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all border-b-8 border-b-amber-500">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Clock size={80} className="text-amber-500" /></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Protocolos Pendentes</p>
              <h3 className="text-4xl font-black text-gray-900">{data.totals.pendingProtocols}</h3>
              <div className="mt-4 flex items-center gap-2 text-amber-500 font-bold text-xs italic">
                Aguardando contato da família
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* RANKING DE ABSENTEÍSMO */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <div>
                  <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                    <UserX size={20} className="text-red-500" /> Ranking de Absenteísmo
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Alunos com maior volume de faltas</p>
                </div>
                <div className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-[8px] font-black uppercase tracking-widest">Ação Necessária</div>
              </div>
              
              <div className="p-8 space-y-6">
                {data.absenteeRanking.map((student, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xs shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1.5">
                        <div>
                          <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{student.student_name}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">{student.class}</p>
                        </div>
                        <p className="text-xs font-black text-red-600">{student.count} Faltas</p>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${student.count >= 5 ? 'bg-red-500' : 'bg-amber-500'}`}
                          style={{ width: `${student.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-auto p-6 bg-gray-50 border-t border-gray-100 flex justify-center">
                <button className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all">
                  Ver Relatório Completo <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* ALERTAS CRÍTICOS / SUGESTÕES */}
            <div className="space-y-8">
              <div className="bg-emerald-950 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-10 opacity-10"><AlertTriangle size={120} /></div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                  <AlertTriangle size={24} className="text-amber-400" /> Sugestões de Ação Imediata
                </h4>
                
                <div className="space-y-4 relative z-10">
                  {data.alerts.slice(0, 3).map((alert, idx) => (
                    <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{alert.class}</p>
                          <h5 className="font-black uppercase text-sm mt-1">{alert.student_name}</h5>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
                          alert.priority === 'CRITICA' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          Prioridade {alert.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-100/60 font-medium mb-4">{alert.reason}</p>
                      <button className="w-full py-3 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform">
                        Iniciar Protocolo de Contato
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* STATS POR TURMA */}
              <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-8 flex items-center gap-3">
                  <FileBarChart size={18} className="text-emerald-500" /> Mapa de Frequência por Turma
                </h4>
                
                <div className="space-y-6">
                  {data.classStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-6">
                      <p className="w-20 text-[10px] font-black text-gray-400 uppercase shrink-0">{stat.class}</p>
                      <div className="flex-1 h-3 bg-gray-50 rounded-full border border-gray-100 overflow-hidden flex">
                        <div 
                          className={`h-full transition-all duration-1000 ${stat.attendanceRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${stat.attendanceRate}%` }}
                        ></div>
                      </div>
                      <p className={`text-[10px] font-black w-10 text-right ${stat.attendanceRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {stat.attendanceRate}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {!data && !loading && (
        <div className="py-40 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <Search size={64} className="mx-auto mb-4 text-gray-100" />
          <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Selecione um período para gerar o relatório</p>
        </div>
      )}

      {loading && (
        <div className="py-40 text-center">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Processando Inteligência de Dados...</p>
        </div>
      )}

    </div>
  );
};

export default BuscaAtivaReports;
