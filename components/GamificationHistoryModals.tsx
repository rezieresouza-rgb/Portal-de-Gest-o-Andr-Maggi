import React, { useMemo, useState } from 'react';
import {
  X,
  Trophy,
  Star,
  HeartHandshake,
  BookOpen,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Printer,
  Search,
  History,
  Award,
  Users,
  Calendar,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  ClassScore,
  StudentScore,
  GamificationEvent,
  GamificationPillar,
  formatDateBr
} from '../hooks/useGamificationData';

const PILLAR_META: Record<GamificationPillar, { label: string; color: string; badgeClass: string }> = {
  grades: { label: 'Notas', color: '#10b981', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  attendance: { label: 'Frequência', color: '#0d9488', badgeClass: 'bg-teal-100 text-teal-800 border-teal-200' },
  library: { label: 'Biblioteca', color: '#2563eb', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  civicBehavior: { label: 'Cívico-Militar', color: '#4f46e5', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  praises: { label: 'Elogios', color: '#d97706', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  occurrences: { label: 'Ocorrências', color: '#e11d48', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
  extraPoints: { label: 'Pontos Extras', color: '#9333ea', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' }
};

export const renderBadgePill = (badge: string) => {
  switch (badge) {
    case 'Selo Paz':
      return (
        <span key={badge} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
          <HeartHandshake size={11} /> Paz
        </span>
      );
    case 'Selo Leitura':
      return (
        <span key={badge} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
          <BookOpen size={11} /> Leitura
        </span>
      );
    case 'Selo Coruja':
      return (
        <span key={badge} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
          <Star size={11} /> Destaque Notas
        </span>
      );
    case 'Selo Cívico':
      return (
        <span key={badge} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
          <ShieldCheck size={11} /> Cívico
        </span>
      );
    case 'Selo Assiduidade':
      return (
        <span key={badge} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-teal-100 text-teal-800 border border-teal-200">
          <UserCheck size={11} /> Assiduidade
        </span>
      );
    default:
      return (
        <span key={badge} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
          <Award size={11} /> {badge}
        </span>
      );
  }
};

interface EventListProps {
  events: GamificationEvent[];
  showStudentName?: boolean;
}

const EventLedgerList: React.FC<EventListProps> = ({ events, showStudentName = false }) => {
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'GAIN' | 'LOSS'>('ALL');
  const [pillarFilter, setPillarFilter] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(30);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(evt => {
      if (directionFilter === 'GAIN' && evt.points <= 0) return false;
      if (directionFilter === 'LOSS' && evt.points >= 0) return false;
      if (pillarFilter !== 'ALL' && evt.pillar !== pillarFilter) return false;
      if (q) {
        const hay = `${evt.title} ${evt.description} ${evt.studentName || ''} ${evt.sourceLabel} ${evt.bimestre}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, directionFilter, pillarFilter, query]);

  const gainsSum = useMemo(() => filtered.filter(e => e.points > 0).reduce((a, e) => a + e.points, 0), [filtered]);
  const lossSum = useMemo(() => filtered.filter(e => e.points < 0).reduce((a, e) => a + e.points, 0), [filtered]);

  return (
    <div className="space-y-3">
      {/* Filtros internos do extrato */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 print:hidden">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setVisibleLimit(30);
            }}
            placeholder={showStudentName ? 'Filtrar evento ou aluno...' : 'Filtrar evento, disciplina ou descrição...'}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
          {([
            ['ALL', 'Todos'],
            ['GAIN', 'Ganhos (+)'],
            ['LOSS', 'Perdas (-)']
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDirectionFilter(key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                directionFilter === key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={pillarFilter}
          onChange={e => setPillarFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none"
        >
          <option value="ALL">Todos os Pilares</option>
          {(Object.keys(PILLAR_META) as GamificationPillar[]).map(p => (
            <option key={p} value={p}>
              {PILLAR_META[p].label}
            </option>
          ))}
        </select>
      </div>

      {/* Resumo rápido */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500 px-1">
        <span>
          Exibindo <strong className="text-slate-800">{Math.min(visibleLimit, filtered.length)}</strong> de{' '}
          <strong className="text-slate-800">{filtered.length}</strong> registro(s) no extrato
        </span>
        <div className="flex items-center gap-3">
          <span className="text-emerald-600 font-black">+{gainsSum} pts ganhos</span>
          <span className="text-rose-600 font-black">{lossSum} pts perdas</span>
        </div>
      </div>

      {/* Lista cronológica */}
      <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-white overflow-hidden max-h-[340px] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
        {filtered.slice(0, visibleLimit).map(evt => {
          const meta = PILLAR_META[evt.pillar];
          const isPositive = evt.points >= 0;
          return (
            <div key={evt.id} className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 inline-flex items-center gap-1">
                    <Calendar size={10} /> {formatDateBr(evt.date)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${meta.badgeClass}`}>
                    {evt.sourceLabel}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{evt.bimestre}</span>
                  {showStudentName && evt.studentName && (
                    <span className="text-[10px] font-black text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                      {evt.studentName}
                    </span>
                  )}
                </div>
                <p className="text-xs font-black text-slate-800">{evt.title}</p>
                {evt.description && (
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{evt.description}</p>
                )}
              </div>

              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                  isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isPositive ? `+${evt.points}` : evt.points} pts
              </span>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase">
            Nenhum lançamento encontrado para os filtros aplicados.
          </div>
        )}
      </div>

      {filtered.length > visibleLimit && (
        <div className="text-center print:hidden">
          <button
            type="button"
            onClick={() => setVisibleLimit(prev => prev + 40)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
          >
            Carregar mais eventos ({filtered.length - visibleLimit} restantes)
          </button>
        </div>
      )}
    </div>
  );
};

interface ClassModalProps {
  classScore: ClassScore;
  topStudents: StudentScore[];
  periodLabel: string;
  onClose: () => void;
  onSelectStudent: (student: StudentScore) => void;
}

export const GamificationClassHistoryModal: React.FC<ClassModalProps> = ({
  classScore,
  topStudents,
  periodLabel,
  onClose,
  onSelectStudent
}) => {
  const chartData = classScore.bimesterHistory.map(b => ({
    name: b.bimestre.replace(' BIMESTRE', ''),
    pontos: b.totalPoints,
    notas: b.grades,
    assiduidade: b.attendance
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] max-w-[96vw] xl:max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black text-lg">
              {classScore.rank}º
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black uppercase tracking-tight">{classScore.className}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/10 border border-white/15">
                  {classScore.shift}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {periodLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1"><Users size={12} /> {classScore.activeStudentCount} alunos ativos</span>
                {classScore.attendanceStats && (
                  <span>• Frequência: {classScore.attendanceStats.rate.toFixed(1)}%</span>
                )}
                {classScore.deltaPoints !== null && (
                  <span className={`inline-flex items-center gap-0.5 font-black ${classScore.deltaPoints >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    • {classScore.deltaPoints >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {classScore.deltaPoints >= 0 ? `+${classScore.deltaPoints}` : classScore.deltaPoints} pts vs bimestre anterior
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-right">
              <span className="block text-[9px] font-black uppercase text-slate-300">Pontuação Total</span>
              <span className="text-2xl font-black text-amber-400">{classScore.totalPoints} pts</span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 print:hidden"
            >
              <Printer size={14} /> Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 print:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-6 custom-scrollbar">
          {/* Selos da Turma */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Medalhas da Turma:</span>
            {classScore.badges.length > 0 ? (
              classScore.badges.map(b => renderBadgePill(b))
            ) : (
              <span className="text-xs text-slate-400 italic">Nenhum selo conquistado neste recorte.</span>
            )}
          </div>

          {/* Gráfico de Evolução + Top 5 Alunos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-600" /> Evolução Bimestral da Turma (1º ao 4º Bimestre)
              </h4>
              <div className="h-52 w-full min-w-0">
                <ResponsiveContainer width="100%" height={208}>
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 2 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: any) => [`${value} pts`, 'Pontuação Total']} />
                    <Bar dataKey="pontos" name="Pontuação Total" radius={[10, 10, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b', '#8b5cf6'][i % 4]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" /> Top 5 Alunos da Turma ({periodLabel})
              </h4>
              <div className="space-y-2">
                {topStudents.slice(0, 5).map((st, idx) => (
                  <button
                    key={st.studentKey}
                    type="button"
                    onClick={() => onSelectStudent(st)}
                    className="w-full p-2.5 bg-white hover:bg-indigo-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {idx + 1}º
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 uppercase truncate">{st.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Cód: {st.studentCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black text-indigo-700">{st.totalPoints} pts</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
                    </div>
                  </button>
                ))}
                {topStudents.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Sem alunos pontuados nesta turma.</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabela comparativa bimestre a bimestre */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Detalhamento Histórico por Bimestre
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Bimestre</th>
                    <th className="px-3 py-2.5 text-center text-emerald-700">Notas</th>
                    <th className="px-3 py-2.5 text-center text-teal-700">Assiduidade</th>
                    <th className="px-3 py-2.5 text-center text-blue-700">Biblioteca</th>
                    <th className="px-3 py-2.5 text-center text-indigo-700">Cívico-Militar</th>
                    <th className="px-3 py-2.5 text-center text-amber-600">Elogios</th>
                    <th className="px-3 py-2.5 text-center text-rose-600">Ocorrências</th>
                    <th className="px-3 py-2.5 text-center text-purple-700">Extras</th>
                    <th className="px-4 py-2.5 text-center font-black text-slate-900 bg-slate-100/70">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classScore.bimesterHistory.map(row => (
                    <tr key={row.bimestre} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-black text-slate-800">{row.bimestre}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-600">+{row.grades}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-teal-700">
                        {row.attendance >= 0 ? `+${row.attendance}` : row.attendance}
                        {row.attendanceRate != null && (
                          <span className="block text-[9px] text-slate-400">{row.attendanceRate.toFixed(1)}%</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-blue-600">+{row.library}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-indigo-600">
                        {row.civicBehavior >= 0 ? `+${row.civicBehavior}` : row.civicBehavior}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-600">+{row.praises}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-rose-600">{row.occurrences}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-purple-600">
                        {row.extraPoints >= 0 ? `+${row.extraPoints}` : row.extraPoints}
                      </td>
                      <td className="px-4 py-2.5 text-center font-black text-slate-900 bg-slate-50">{row.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extrato Cronológico */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <History size={14} className="text-indigo-600" /> Extrato Cronológico de Eventos da Turma ({periodLabel})
            </h4>
            <EventLedgerList events={classScore.events} showStudentName />
          </div>
        </div>
      </div>
    </div>
  );
};

interface StudentModalProps {
  studentScore: StudentScore;
  periodLabel: string;
  onClose: () => void;
}

export const GamificationStudentHistoryModal: React.FC<StudentModalProps> = ({
  studentScore,
  periodLabel,
  onClose
}) => {
  const chartData = studentScore.bimesterHistory.map(b => ({
    name: b.bimestre.replace(' BIMESTRE', ''),
    pontos: b.totalPoints
  }));

  const pillarCards = [
    { label: 'Notas', val: studentScore.breakdown.grades, cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { label: 'Frequência', val: studentScore.breakdown.attendance, cls: 'bg-teal-50 border-teal-200 text-teal-800' },
    { label: 'Biblioteca', val: studentScore.breakdown.library, cls: 'bg-blue-50 border-blue-200 text-blue-800' },
    { label: 'Cívico-Militar', val: studentScore.breakdown.civicBehavior, cls: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
    { label: 'Elogios', val: studentScore.breakdown.praises, cls: 'bg-amber-50 border-amber-200 text-amber-800' },
    { label: 'Ocorrências', val: studentScore.breakdown.occurrences, cls: 'bg-rose-50 border-rose-200 text-rose-800' },
    { label: 'Extras', val: studentScore.breakdown.extraPoints, cls: 'bg-purple-50 border-purple-200 text-purple-800' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] max-w-[96vw] xl:max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 font-black text-lg">
              {studentScore.studentName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">{studentScore.studentName}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/10 border border-white/15">
                  {studentScore.className} • {studentScore.shift}
                </span>
                {!studentScore.isActive && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/20 text-rose-200 border border-rose-400/30">
                    {studentScore.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Código SEDUC: <strong className="font-mono text-white">{studentScore.studentCode}</strong></span>
                <span>• Geral: <strong className="text-amber-300">{studentScore.rankOverall}º lugar</strong></span>
                <span>• Na turma: <strong className="text-emerald-300">{studentScore.rankInClass}º lugar</strong></span>
                {studentScore.attendanceStats && (
                  <span>• Frequência: {studentScore.attendanceStats.rate.toFixed(1)}% ({studentScore.attendanceStats.absences} faltas)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-right">
              <span className="block text-[9px] font-black uppercase text-slate-300">{periodLabel}</span>
              <span className="text-2xl font-black text-amber-400">{studentScore.totalPoints} pts</span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 print:hidden"
            >
              <Printer size={14} /> Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 print:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-6 custom-scrollbar">
          {/* Selos */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Selos Conquistados:</span>
            {studentScore.badges.length > 0 ? (
              studentScore.badges.map(b => renderBadgePill(b))
            ) : (
              <span className="text-xs text-slate-400 italic">Nenhum selo conquistado neste recorte.</span>
            )}
          </div>

          {/* Cards de composição de pontos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {pillarCards.map(card => (
              <div key={card.label} className={`p-3 rounded-2xl border text-center ${card.cls}`}>
                <span className="block text-[9px] font-black uppercase opacity-75">{card.label}</span>
                <span className="text-base font-black">{card.val > 0 ? `+${card.val}` : card.val}</span>
              </div>
            ))}
          </div>

          {/* Gráfico Evolução Individual */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-indigo-600" /> Evolução Individual por Bimestre (1º ao 4º Bimestre)
            </h4>
            <div className="h-48 w-full min-w-0">
              <ResponsiveContainer width="100%" height={192}>
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: any) => [`${value} pts`, 'Pontuação do Aluno']} />
                  <Bar dataKey="pontos" name="Pontuação do Aluno" radius={[10, 10, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b', '#8b5cf6'][i % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Extrato Cronológico Individual */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <History size={14} className="text-indigo-600" /> Extrato Individual de Pontuação ({periodLabel})
            </h4>
            <EventLedgerList events={studentScore.events} />
          </div>
        </div>
      </div>
    </div>
  );
};
