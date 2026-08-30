import React from 'react';
import {
  Sparkles,
  Users,
  Music,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  Shield,
  Flag,
  FileText,
  Radio,
  Drum,
  Volume2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';

interface EducarteDashboardProps {
  onNavigate: (tabId: string) => void;
  members: any[];
  attendanceRecords: any[];
  instruments: any[];
  events: any[];
}

const NAIPE_COLORS = {
  'METAIS': '#f59e0b',
  'MADEIRAS': '#3b82f6',
  'PERCUSSÃO': '#ef4444',
  'LINHA DE FRENTE': '#8b5cf6',
  'OUTRO': '#10b981'
};

const EducarteDashboard: React.FC<EducarteDashboardProps> = ({
  onNavigate,
  members,
  attendanceRecords,
  instruments,
  events
}) => {
  // Contadores
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'ATIVO').length;
  const loanedInstruments = instruments.filter(i => i.status === 'CAUTELADO' || i.status === 'EMPRESTADO').length;
  const totalInstruments = instruments.length;

  // Próximos Eventos
  const upcomingEvents = [...events]
    .filter(e => new Date(e.date + 'T23:59:59') >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Distribuição por Naipe
  const naipeCount: Record<string, number> = {};
  members.forEach(m => {
    const naipe = m.naipe || 'OUTRO';
    naipeCount[naipe] = (naipeCount[naipe] || 0) + 1;
  });

  const naipeChartData = Object.entries(naipeCount).map(([name, value]) => ({
    name,
    value,
    color: (NAIPE_COLORS as any)[name] || '#64748b'
  }));

  // Média de Presença nos Ensaios
  let totalPresences = 0;
  let totalSlots = 0;
  attendanceRecords.forEach(rec => {
    (rec.presences || []).forEach((p: any) => {
      totalSlots++;
      if (p.isPresent) totalPresences++;
    });
  });
  const presenceRate = totalSlots > 0 ? Math.round((totalPresences / totalSlots) * 100) : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* BANNER PRINCIPAL EDUCARTE */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-indigo-950 p-8 md:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <Music size={220} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                🎺 PROJETO EDUCARTE • SEDUC-MT
              </span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-amber-200 text-xs font-bold uppercase">Banda de Música & Fanfarra</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
              Banda Musical André Maggi
            </h1>

            <p className="text-amber-100/70 text-xs md:text-sm max-w-2xl font-medium leading-relaxed">
              Formação musical, disciplina, arte e cidadania para os estudantes no contraturno escolar. Gestão de ensaios, naipes, instrumentos e apresentações cívicas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-6 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={18} /> Fazer Chamada do Ensaio
            </button>
            <button
              onClick={() => onNavigate('members')}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest backdrop-blur-md transition-all flex items-center gap-2 border border-white/10"
            >
              <Users size={18} /> Integrantes ({activeMembers})
            </button>
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Músicos Ativos</p>
            <p className="text-3xl font-black text-white mt-1">{activeMembers}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Presença nos Ensaios</p>
            <p className="text-3xl font-black text-white mt-1">{presenceRate}%</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Instrumentos Cautelados</p>
            <p className="text-3xl font-black text-white mt-1">{loanedInstruments} / {totalInstruments}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Próxima Apresentação</p>
            <p className="text-lg font-black text-white mt-1 truncate">
              {upcomingEvents.length > 0 ? upcomingEvents[0].title : 'A definir'}
            </p>
          </div>
        </div>
      </div>

      {/* PAINEL CENTRAL EM 2 COLUNAS: NAIPES & PRÓXIMOS EVENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA 1: DISTRIBUIÇÃO POR NAIPE */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6 lg:col-span-1">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Drum className="text-amber-500" size={20} /> Distribuição de Naipes
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Estrutura musical da banda
            </p>
          </div>

          <div className="h-56 w-full">
            {naipeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={naipeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {naipeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
                Sem integrantes cadastrados
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {naipeChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-black text-slate-900">{item.value} integrante(s)</span>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA 2 e 3: AGENDA DE ENSAIOS & APRESENTAÇÕES */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Calendar className="text-indigo-600" size={20} /> Próximas Apresentações & Ensaios
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Calendário oficial do projeto Educarte
              </p>
            </div>
            <button
              onClick={() => onNavigate('schedule')}
              className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase flex items-center gap-1"
            >
              Ver agenda completa <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((evt) => (
                <div key={evt.id} className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4 hover:bg-slate-100/60 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center font-black shrink-0 border border-indigo-200">
                      <span className="text-[10px] leading-none uppercase">
                        {new Date(evt.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                      <span className="text-base leading-none mt-0.5">
                        {new Date(evt.date + 'T12:00:00').getDate()}
                      </span>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        evt.type === 'APRESENTACAO' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                      }`}>
                        {evt.type === 'APRESENTACAO' ? '⭐ Apresentação Pública' : '🎺 Ensaio Geral'}
                      </span>
                      <h4 className="font-black text-slate-900 text-sm uppercase mt-1">{evt.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">{evt.location || 'Escola André Maggi'} • {evt.time || '14:00'}</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-400 uppercase hidden sm:block">
                    {evt.targetGroup || 'Toda a Banda'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                Nenhum evento agendado para os próximos dias
              </div>
            )}
          </div>

          {/* ATALHOS RÁPIDOS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('attendance')}
              className="p-4 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80 rounded-2xl text-left transition-all group"
            >
              <CheckCircle2 size={20} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-black text-slate-900 text-xs uppercase">Diário de Presença</p>
              <p className="text-[10px] text-slate-500 font-medium">Chamada rápida do ensaio</p>
            </button>

            <button
              onClick={() => onNavigate('instruments')}
              className="p-4 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-2xl text-left transition-all group"
            >
              <Volume2 size={20} className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-black text-slate-900 text-xs uppercase">Cautela de Instrumentos</p>
              <p className="text-[10px] text-slate-500 font-medium">Termos de responsabilidade</p>
            </button>

            <button
              onClick={() => onNavigate('repertoire')}
              className="p-4 bg-purple-50/80 hover:bg-purple-100 border border-purple-200/80 rounded-2xl text-left transition-all group"
            >
              <Music size={20} className="text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-black text-slate-900 text-xs uppercase">Repertório & Partituras</p>
              <p className="text-[10px] text-slate-500 font-medium">Hinos e marchas oficiais</p>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default EducarteDashboard;
