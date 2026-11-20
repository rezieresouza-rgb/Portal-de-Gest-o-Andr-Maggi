import React, { useState, useMemo } from 'react';
import { User } from '../types';
import {
  ArrowLeft,
  Trophy,
  Star,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Printer,
  Search,
  Filter,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  History,
  Download,
  Plus,
  Trash2,
  Eye,
  Users,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Award,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  useGamificationData,
  GamificationFilters,
  GamificationPeriod,
  GamificationSortBy,
  GamificationPillar,
  ClassScore,
  StudentScore,
  BIMESTRES_LIST,
  EXTRA_POINT_CATEGORIES,
  formatDateBr
} from '../hooks/useGamificationData';
import {
  GamificationClassHistoryModal,
  GamificationStudentHistoryModal,
  renderBadgePill
} from '../components/GamificationHistoryModals';

interface GamificationModuleProps {
  user: User;
  onExit: () => void;
}

const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#e11d48', '#0ea5e9', '#9333ea'];

const DEFAULT_FILTERS: GamificationFilters = {
  period: '3º BIMESTRE',
  customStart: '2026-02-01',
  customEnd: new Date().toISOString().slice(0, 10),
  shift: 'TODOS',
  gradeLevel: 'TODAS',
  className: 'TODAS',
  searchQuery: '',
  badge: 'TODOS',
  sortBy: 'totalPoints',
  includeTransferred: false
};

const GamificationModule: React.FC<GamificationModuleProps> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'ranking' | 'ranking_alunos' | 'historico' | 'auditoria' | 'pontos_manuais'>('ranking');
  const [filters, setFilters] = useState<GamificationFilters>(DEFAULT_FILTERS);
  const [auditMode, setAuditMode] = useState<'turmas' | 'alunos'>('turmas');
  const [studentPage, setStudentPage] = useState(1);
  const STUDENTS_PER_PAGE = 30;

  // Modais de Dossiê / Extrato
  const [selectedClassNameModal, setSelectedClassNameModal] = useState<string | null>(null);
  const [selectedStudentKeyModal, setSelectedStudentKeyModal] = useState<string | null>(null);

  // Estado da aba Histórico & Evolução
  const [selectedCompareClasses, setSelectedCompareClasses] = useState<string[]>([]);
  const [timelinePillarFilter, setTimelinePillarFilter] = useState<'ALL' | GamificationPillar>('ALL');
  const [timelineDirectionFilter, setTimelineDirectionFilter] = useState<'ALL' | 'GAIN' | 'LOSS'>('ALL');
  const [timelineVisibleCount, setTimelineVisibleCount] = useState(40);

  // Estado do formulário Pontos Extras
  const [extraForm, setExtraForm] = useState({
    classroom_name: '',
    student_code: '',
    bimestre: '3º BIMESTRE',
    date: new Date().toISOString().slice(0, 10),
    points: 50,
    category: EXTRA_POINT_CATEGORIES[0],
    description: ''
  });
  const [extraSaving, setExtraSaving] = useState(false);
  const [extraFeedback, setExtraFeedback] = useState<string | null>(null);

  const {
    allClassScores,
    filteredClassScores,
    allStudentScores,
    filteredStudentScores,
    timelineEvents,
    classroomsMeta,
    extraPoints,
    extraPointsBackendAvailable,
    studentsRoster,
    isLoading,
    isLoadingAttendance,
    refresh,
    addExtraPoint,
    deleteExtraPoint
  } = useGamificationData(filters);

  // Opções de turma dependentes de Turno e Série
  const availableClassesForDropdown = useMemo(() => {
    return classroomsMeta.filter(c => {
      if (filters.shift !== 'TODOS' && c.shift !== filters.shift) return false;
      if (filters.gradeLevel !== 'TODAS' && c.gradeLevel !== filters.gradeLevel) return false;
      return true;
    });
  }, [classroomsMeta, filters.shift, filters.gradeLevel]);

  const periodLabel = useMemo(() => {
    if (filters.period === 'ANO_TODO') return 'Ano Letivo 2026 (Acumulado)';
    if (filters.period === 'PERSONALIZADO') {
      return `${formatDateBr(filters.customStart)} a ${formatDateBr(filters.customEnd)}`;
    }
    return filters.period;
  }, [filters.period, filters.customStart, filters.customEnd]);

  const hasActiveSecondaryFilters =
    filters.shift !== 'TODOS' ||
    filters.gradeLevel !== 'TODAS' ||
    filters.className !== 'TODAS' ||
    filters.searchQuery.trim() !== '' ||
    filters.badge !== 'TODOS' ||
    filters.sortBy !== 'totalPoints' ||
    filters.includeTransferred;

  const updateFilter = <K extends keyof GamificationFilters>(key: K, value: GamificationFilters[K]) => {
    setStudentPage(1);
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      // Se mudar turno ou série e a turma selecionada não pertencer mais, reseta turma
      if ((key === 'shift' || key === 'gradeLevel') && next.className !== 'TODAS') {
        const meta = classroomsMeta.find(c => c.name === next.className);
        if (
          meta &&
          ((next.shift !== 'TODOS' && meta.shift !== next.shift) ||
            (next.gradeLevel !== 'TODAS' && meta.gradeLevel !== next.gradeLevel))
        ) {
          next.className = 'TODAS';
        }
      }
      return next;
    });
  };

  // Paginação da lista de alunos
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudentScores.length / STUDENTS_PER_PAGE));
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudentScores.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredStudentScores, studentPage]);

  // Dados para gráfico comparativo de evolução (Histórico & Evolução)
  const classesToCompare = useMemo(() => {
    if (selectedCompareClasses.length > 0) {
      return filteredClassScores.filter(c => selectedCompareClasses.includes(c.className));
    }
    return filteredClassScores.slice(0, 5);
  }, [filteredClassScores, selectedCompareClasses]);

  const evolutionLineData = useMemo(() => {
    return BIMESTRES_LIST.map(bim => {
      const point: Record<string, any> = { name: bim.replace(' BIMESTRE', '') };
      classesToCompare.forEach(c => {
        const snap = c.bimesterHistory.find(h => h.bimestre === bim);
        point[c.className] = snap ? snap.totalPoints : 1000;
      });
      return point;
    });
  }, [classesToCompare]);

  const filteredSchoolTimeline = useMemo(() => {
    return timelineEvents.filter(evt => {
      if (timelinePillarFilter !== 'ALL' && evt.pillar !== timelinePillarFilter) return false;
      if (timelineDirectionFilter === 'GAIN' && evt.points <= 0) return false;
      if (timelineDirectionFilter === 'LOSS' && evt.points >= 0) return false;
      return true;
    });
  }, [timelineEvents, timelinePillarFilter, timelineDirectionFilter]);

  // Alunos da turma selecionada no formulário de Pontos Extras
  const studentsForExtraForm = useMemo(() => {
    if (!extraForm.classroom_name) return [];
    return studentsRoster
      .filter(s => s.isActive && s.className === extraForm.classroom_name)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [studentsRoster, extraForm.classroom_name]);

  // Objetos resolvidos para os modais
  const activeClassModal = useMemo(
    () => (selectedClassNameModal ? allClassScores.find(c => c.className === selectedClassNameModal) || null : null),
    [selectedClassNameModal, allClassScores]
  );

  const topStudentsOfActiveClassModal = useMemo(() => {
    if (!activeClassModal) return [];
    return allStudentScores
      .filter(s => s.className === activeClassModal.className)
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [activeClassModal, allStudentScores]);

  const activeStudentModal = useMemo(
    () => (selectedStudentKeyModal ? allStudentScores.find(s => s.studentKey === selectedStudentKeyModal) || null : null),
    [selectedStudentKeyModal, allStudentScores]
  );

  const handlePrint = () => window.print();

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const classRows = filteredClassScores.map((t, idx) => ({
      Posicao: idx + 1,
      Turma: t.className,
      Turno: t.shift,
      Serie: t.gradeLevel,
      Alunos_Ativos: t.activeStudentCount,
      Pontos_Iniciais: 1000,
      Notas: t.breakdown.grades,
      Assiduidade: t.breakdown.attendance,
      Frequencia_Pct: t.attendanceStats ? Number(t.attendanceStats.rate.toFixed(1)) : '',
      Biblioteca: t.breakdown.library,
      Civico_Militar: t.breakdown.civicBehavior,
      Elogios: t.breakdown.praises,
      Ocorrencias: t.breakdown.occurrences,
      Pontos_Extras: t.breakdown.extraPoints,
      Total_Final: t.totalPoints,
      Selos: t.badges.join(', ')
    }));
    const wsClasses = XLSX.utils.json_to_sheet(classRows);
    XLSX.utils.book_append_sheet(wb, wsClasses, 'Auditoria Turmas');

    const studentRows = filteredStudentScores.map((s, idx) => ({
      Posicao_Filtro: idx + 1,
      Posicao_Geral: s.rankOverall,
      Posicao_Turma: s.rankInClass,
      Codigo_SEDUC: s.studentCode,
      Aluno: s.studentName,
      Turma: s.className,
      Turno: s.shift,
      Status: s.status,
      Notas: s.breakdown.grades,
      Assiduidade: s.breakdown.attendance,
      Biblioteca: s.breakdown.library,
      Civico_Militar: s.breakdown.civicBehavior,
      Elogios: s.breakdown.praises,
      Ocorrencias: s.breakdown.occurrences,
      Pontos_Extras: s.breakdown.extraPoints,
      Total_Final: s.totalPoints,
      Selos: s.badges.join(', ')
    }));
    const wsStudents = XLSX.utils.json_to_sheet(studentRows);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Auditoria Alunos');

    const safePeriod = filters.period.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    XLSX.writeFile(wb, `Liga_Maggi_Gamificacao_${safePeriod}.xlsx`);
  };

  const handleSaveExtraPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraForm.classroom_name || !extraForm.description.trim() || !extraForm.points) return;

    setExtraSaving(true);
    setExtraFeedback(null);
    try {
      const targetStudent = extraForm.student_code
        ? studentsForExtraForm.find(s => s.code === extraForm.student_code)
        : null;

      await addExtraPoint({
        classroom_name: extraForm.classroom_name,
        student_id: targetStudent?.code || null,
        student_name: targetStudent?.name || null,
        bimestre: extraForm.bimestre,
        date: extraForm.date,
        points: Number(extraForm.points),
        category: extraForm.category,
        description: extraForm.description.trim(),
        created_by: user.name || 'Gestão Escolar'
      });

      setExtraForm(prev => ({ ...prev, student_code: '', description: '' }));
      setExtraFeedback('Ponto extra registrado e já computado no ranking e no histórico!');
    } finally {
      setExtraSaving(false);
    }
  };

  const toggleCompareClass = (className: string) => {
    setSelectedCompareClasses(prev => {
      if (prev.includes(className)) return prev.filter(c => c !== className);
      if (prev.length >= 6) return [...prev.slice(1), className];
      return [...prev, className];
    });
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans print:bg-white print:h-auto">
      {/* Cabeçalho Principal */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 z-20 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
            title="Voltar ao Hub"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="text-amber-500" size={26} />
              Liga Maggi - Gamificação
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Ranking, Filtros Inteligentes, Histórico Evolutivo e Extrato de Pontos
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {([
            ['ranking', 'Ranking Turmas', 'text-amber-600'],
            ['ranking_alunos', 'Ranking Alunos', 'text-indigo-600'],
            ['historico', 'Histórico & Evolução', 'text-violet-600'],
            ['auditoria', 'Auditoria', 'text-emerald-600'],
            ['pontos_manuais', 'Pontos Extras', 'text-purple-600']
          ] as const).map(([key, label, activeColor]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === key ? `bg-white ${activeColor} shadow-sm` : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Cabeçalho Exclusivo de Impressão */}
      <div className="hidden print:block text-center mb-6 border-b-2 border-slate-200 pb-4">
        <div className="flex justify-center items-center gap-4 mb-1">
          <Trophy className="text-amber-500" size={40} />
          <h1 className="text-3xl font-black text-slate-900 uppercase">Liga Maggi — E.E. André Antônio Maggi</h1>
          <Trophy className="text-amber-500" size={40} />
        </div>
        <h2 className="text-lg font-bold text-slate-600">Boletim Oficial de Gamificação Escolar</h2>
        <p className="text-sm text-slate-500 mt-1">
          Recorte: {periodLabel}
          {filters.className !== 'TODAS' ? ` • Turma: ${filters.className}` : ''}
          {filters.shift !== 'TODOS' ? ` • Turno: ${filters.shift}` : ''}
        </p>
      </div>

      <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8 custom-scrollbar print:overflow-visible print:p-0">
        <div className="max-w-7xl mx-auto space-y-6 print:max-w-full">
          {/* BARRA GLOBAL DE FILTROS INTELIGENTES */}
          {activeTab !== 'pontos_manuais' && (
            <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-4 print:hidden">
              {/* Linha 1: Período + Ações rápidas */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {([
                    ['ANO_TODO', 'Ano Todo'],
                    ['1º BIMESTRE', '1º Bim'],
                    ['2º BIMESTRE', '2º Bim'],
                    ['3º BIMESTRE', '3º Bim'],
                    ['4º BIMESTRE', '4º Bim'],
                    ['PERSONALIZADO', 'Personalizado']
                  ] as [GamificationPeriod, string][]).map(([pKey, pLabel]) => (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => updateFilter('period', pKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        filters.period === pKey
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pLabel}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isLoadingAttendance && (
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin" /> Carregando assiduidade...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all"
                  >
                    <Download size={14} /> Excel
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all"
                  >
                    <Printer size={14} /> Imprimir
                  </button>
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                  >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Atualizar
                  </button>
                </div>
              </div>

              {/* Datas personalizadas quando PERSONALIZADO estiver ativo */}
              {filters.period === 'PERSONALIZADO' && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1">
                    <Calendar size={12} /> Intervalo de Datas:
                  </span>
                  <input
                    type="date"
                    value={filters.customStart}
                    onChange={e => updateFilter('customStart', e.target.value)}
                    className="bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">até</span>
                  <input
                    type="date"
                    value={filters.customEnd}
                    onChange={e => updateFilter('customEnd', e.target.value)}
                    className="bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              )}

              {/* Linha 2: Filtros de Turno, Série, Turma, Selo, Pilar e Busca por Aluno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100">
                <div className="lg:col-span-3 relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={filters.searchQuery}
                    onChange={e => updateFilter('searchQuery', e.target.value)}
                    placeholder="Buscar aluno ou código SEDUC..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <select
                  value={filters.shift}
                  onChange={e => updateFilter('shift', e.target.value)}
                  className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white"
                >
                  <option value="TODOS">Turno: Todos</option>
                  <option value="MATUTINO">Matutino</option>
                  <option value="VESPERTINO">Vespertino</option>
                </select>

                <select
                  value={filters.gradeLevel}
                  onChange={e => updateFilter('gradeLevel', e.target.value)}
                  className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white"
                >
                  <option value="TODAS">Série: Todas</option>
                  <option value="6º ANO">6º Ano</option>
                  <option value="7º ANO">7º Ano</option>
                  <option value="8º ANO">8º Ano</option>
                  <option value="9º ANO">9º Ano</option>
                </select>

                <select
                  value={filters.className}
                  onChange={e => updateFilter('className', e.target.value)}
                  className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white"
                >
                  <option value="TODAS">Turma: Todas ({availableClassesForDropdown.length})</option>
                  {availableClassesForDropdown.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.shift.slice(0, 3)})
                    </option>
                  ))}
                </select>

                <select
                  value={filters.badge}
                  onChange={e => updateFilter('badge', e.target.value)}
                  className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white"
                  title="Filtrar por Selo / Medalha"
                >
                  <option value="TODOS">Selos</option>
                  <option value="Selo Paz">Paz</option>
                  <option value="Selo Leitura">Leitura</option>
                  <option value="Selo Coruja">Notas</option>
                  <option value="Selo Cívico">Cívico</option>
                  <option value="Selo Assiduidade">Assiduidade</option>
                </select>

                <select
                  value={filters.sortBy}
                  onChange={e => updateFilter('sortBy', e.target.value as GamificationSortBy)}
                  className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white"
                  title="Ordenar Ranking por Pilar"
                >
                  <option value="totalPoints">Ordenar: Total</option>
                  <option value="grades">Pilar: Notas</option>
                  <option value="attendance">Pilar: Frequência</option>
                  <option value="library">Pilar: Biblioteca</option>
                  <option value="civicBehavior">Pilar: Cívico-Militar</option>
                  <option value="praises">Pilar: Elogios</option>
                  <option value="occurrences">Menos Ocorrências</option>
                  <option value="extraPoints">Pilar: Pontos Extras</option>
                </select>
              </div>

              {/* Linha 3: Metadados dos filtros + Incluir transferidos + Limpar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-slate-700">
                    <Filter size={12} className="text-indigo-600" />
                    <strong>{filteredClassScores.length}</strong> turma(s) • <strong>{filteredStudentScores.length}</strong> aluno(s) no recorte
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-700">
                    <input
                      type="checkbox"
                      checked={filters.includeTransferred}
                      onChange={e => updateFilter('includeTransferred', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Incluir transferidos/inativos (histórico completo)
                  </label>
                </div>

                {hasActiveSecondaryFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentPage(1);
                      setFilters(prev => ({ ...DEFAULT_FILTERS, period: prev.period, customStart: prev.customStart, customEnd: prev.customEnd }));
                    }}
                    className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-black uppercase text-[10px]"
                  >
                    <RotateCcw size={11} /> Limpar Filtros
                  </button>
                )}
              </div>
            </div>
          )}

          {/* LOADING */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 print:hidden">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
              <p className="text-slate-500 font-bold text-sm">Consolidando dados de Notas, Biblioteca, Frequência, Ocorrências e Cívico-Militar...</p>
            </div>
          ) : (
            <>
              {/* ================================================================= */}
              {/* ABA 1: RANKING TURMAS                                             */}
              {/* ================================================================= */}
              {activeTab === 'ranking' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {filteredClassScores.length >= 3 && (
                    <div className="bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-3xl p-4 sm:p-8 shadow-xl text-white relative overflow-hidden print:shadow-none print:border-2 print:border-indigo-900 print:text-slate-900 print:bg-none print:bg-white">
                      <div className="absolute top-0 right-0 p-8 opacity-10 print:hidden">
                        <Trophy size={200} />
                      </div>
                      <h2 className="text-xl sm:text-3xl font-black mb-2 text-center text-amber-400 print:text-indigo-900">
                        Pódio Oficial — Top 3 Turmas
                      </h2>
                      <p className="text-center text-xs text-indigo-200/80 mb-6 print:hidden">
                        Clique em qualquer turma para abrir o Dossiê Histórico e o Extrato de Pontos
                      </p>

                      <div className="flex justify-center items-end gap-2 sm:gap-4 h-64 sm:h-72">
                        {/* 2º Lugar */}
                        <button
                          type="button"
                          onClick={() => setSelectedClassNameModal(filteredClassScores[1].className)}
                          className="w-1/3 sm:w-1/4 flex flex-col items-center group cursor-pointer"
                        >
                          <div className="text-sm sm:text-xl font-black mb-1 group-hover:text-amber-300 transition-colors print:text-slate-800">
                            {filteredClassScores[1].className}
                          </div>
                          <div className="text-[10px] text-indigo-200/70 mb-1">{filteredClassScores[1].shift}</div>
                          <div className="text-xs sm:text-sm text-indigo-200 mb-3 font-bold print:text-indigo-700">
                            {filteredClassScores[1].totalPoints} pts
                          </div>
                          <div className="w-full h-32 sm:h-40 bg-slate-300 group-hover:bg-slate-200 transition-colors rounded-t-xl flex justify-center items-start pt-3 border-t-4 border-slate-400">
                            <span className="text-2xl sm:text-4xl font-black text-slate-600">2º</span>
                          </div>
                        </button>

                        {/* 1º Lugar */}
                        <button
                          type="button"
                          onClick={() => setSelectedClassNameModal(filteredClassScores[0].className)}
                          className="w-1/3 sm:w-1/3 flex flex-col items-center z-10 group cursor-pointer"
                        >
                          <div className="text-lg sm:text-3xl font-black text-amber-400 mb-1 group-hover:scale-105 transition-transform">
                            {filteredClassScores[0].className}
                          </div>
                          <div className="text-[10px] text-amber-200/80 mb-1">{filteredClassScores[0].shift}</div>
                          <div className="text-sm sm:text-lg text-amber-200 mb-3 font-black flex items-center gap-1 print:text-amber-600">
                            <Star size={18} /> {filteredClassScores[0].totalPoints} pts
                          </div>
                          <div className="w-full h-44 sm:h-56 bg-amber-500 group-hover:bg-amber-400 transition-colors rounded-t-xl flex justify-center items-start pt-3 border-t-4 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.45)]">
                            <span className="text-3xl sm:text-5xl font-black text-amber-100">1º</span>
                          </div>
                        </button>

                        {/* 3º Lugar */}
                        <button
                          type="button"
                          onClick={() => setSelectedClassNameModal(filteredClassScores[2].className)}
                          className="w-1/3 sm:w-1/4 flex flex-col items-center group cursor-pointer"
                        >
                          <div className="text-sm sm:text-xl font-black mb-1 group-hover:text-amber-300 transition-colors print:text-slate-800">
                            {filteredClassScores[2].className}
                          </div>
                          <div className="text-[10px] text-indigo-200/70 mb-1">{filteredClassScores[2].shift}</div>
                          <div className="text-xs sm:text-sm text-indigo-200 mb-3 font-bold print:text-indigo-700">
                            {filteredClassScores[2].totalPoints} pts
                          </div>
                          <div className="w-full h-24 sm:h-28 bg-amber-700/85 group-hover:bg-amber-700 transition-colors rounded-t-xl flex justify-center items-start pt-3 border-t-4 border-amber-500/60">
                            <span className="text-2xl sm:text-4xl font-black text-amber-100/70">3º</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista Completa de Turmas Filtradas */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden print:border-2 print:border-slate-800">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap justify-between items-center gap-2">
                      <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                        Classificação das Turmas ({periodLabel})
                      </h3>
                      <span className="text-[11px] font-bold text-slate-400">
                        Clique em uma turma para abrir o histórico e extrato
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filteredClassScores.map((turma, idx) => {
                        const gains =
                          (turma.breakdown.civicBehavior > 0 ? turma.breakdown.civicBehavior : 0) +
                          turma.breakdown.grades +
                          turma.breakdown.praises +
                          turma.breakdown.library +
                          (turma.breakdown.attendance > 0 ? turma.breakdown.attendance : 0) +
                          (turma.breakdown.extraPoints > 0 ? turma.breakdown.extraPoints : 0);
                        const losses = Math.abs(
                          (turma.breakdown.occurrences < 0 ? turma.breakdown.occurrences : 0) +
                            (turma.breakdown.civicBehavior < 0 ? turma.breakdown.civicBehavior : 0) +
                            (turma.breakdown.attendance < 0 ? turma.breakdown.attendance : 0) +
                            (turma.breakdown.extraPoints < 0 ? turma.breakdown.extraPoints : 0)
                        );

                        return (
                          <div
                            key={turma.className}
                            onClick={() => setSelectedClassNameModal(turma.className)}
                            className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-start sm:items-center gap-4">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : idx === 1
                                    ? 'bg-slate-200 text-slate-700'
                                    : idx === 2
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                              }`}>
                                {idx + 1}º
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-black text-slate-900 text-sm sm:text-base">{turma.className}</span>
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 text-slate-500">
                                    {turma.shift}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1">
                                    <Users size={11} /> {turma.activeStudentCount} ativos
                                  </span>
                                  {turma.deltaPoints !== null && (
                                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                      turma.deltaPoints >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {turma.deltaPoints >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                      {turma.deltaPoints >= 0 ? `+${turma.deltaPoints}` : turma.deltaPoints}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {turma.badges.length > 0 ? (
                                    turma.badges.map(b => renderBadgePill(b))
                                  ) : (
                                    <span className="text-[11px] text-slate-400">Sem selos no recorte</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-right">
                                <div className="font-black text-indigo-700 text-lg">
                                  {turma.totalPoints} <span className="text-xs font-bold text-indigo-400 uppercase">pts</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">
                                  <span className="text-emerald-600">+{gains}</span> | <span className="text-rose-500">-{losses}</span>
                                </div>
                              </div>
                              <span className="px-3 py-1.5 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white text-[10px] font-black uppercase flex items-center gap-1 transition-all print:hidden">
                                <Eye size={12} /> Histórico
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredClassScores.length === 0 && (
                        <div className="p-12 text-center">
                          <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
                          <p className="text-sm font-bold text-slate-500">Nenhuma turma corresponde aos filtros selecionados.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* ABA 2: RANKING ALUNOS (COMPLETO + BUSCA + PAGINAÇÃO + EXTRATO)   */}
              {/* ================================================================= */}
              {activeTab === 'ranking_alunos' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {filteredStudentScores.length >= 3 && studentPage === 1 && (
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-4 sm:p-8 shadow-xl text-white relative overflow-hidden print:shadow-none print:border-2 print:border-slate-900 print:text-slate-900 print:bg-none print:bg-white">
                      <h2 className="text-xl sm:text-3xl font-black mb-2 text-center text-amber-400 print:text-slate-900">
                        Pódio Alunos — Top 3 {filters.className !== 'TODAS' ? `(${filters.className})` : ''}
                      </h2>
                      <p className="text-center text-xs text-slate-400 mb-6 print:hidden">
                        Clique em qualquer aluno para abrir o Extrato Individual de Pontos
                      </p>

                      <div className="flex justify-center items-end gap-2 sm:gap-4 h-64 sm:h-72">
                        {[1, 0, 2].map(posIdx => {
                          const st = filteredStudentScores[posIdx];
                          const isFirst = posIdx === 0;
                          return (
                            <button
                              key={st.studentKey}
                              type="button"
                              onClick={() => setSelectedStudentKeyModal(st.studentKey)}
                              className={`${isFirst ? 'w-1/3 sm:w-1/3 z-10' : 'w-1/3 sm:w-1/4'} flex flex-col items-center group cursor-pointer`}
                            >
                              <div className={`font-black text-center leading-tight mb-1 group-hover:text-amber-300 transition-colors ${
                                isFirst ? 'text-sm sm:text-xl text-amber-400' : 'text-xs sm:text-base text-white print:text-slate-800'
                              }`}>
                                {st.studentName.split(' ').slice(0, 2).join(' ')}
                              </div>
                              <div className="text-[10px] text-slate-400 mb-1">{st.className}</div>
                              <div className={`mb-3 font-black flex items-center gap-1 ${
                                isFirst ? 'text-sm sm:text-lg text-amber-200' : 'text-xs sm:text-sm text-indigo-200'
                              }`}>
                                {isFirst && <Star size={16} />} {st.totalPoints} pts
                              </div>
                              <div className={`w-full rounded-t-xl flex justify-center items-start pt-3 border-t-4 transition-colors ${
                                isFirst
                                  ? 'h-44 sm:h-52 bg-amber-500 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.45)]'
                                  : posIdx === 1
                                    ? 'h-32 sm:h-36 bg-slate-300 border-slate-400'
                                    : 'h-24 sm:h-28 bg-amber-700/85 border-amber-500/60'
                              }`}>
                                <span className={`font-black ${
                                  isFirst ? 'text-3xl sm:text-5xl text-amber-100' : posIdx === 1 ? 'text-2xl sm:text-4xl text-slate-600' : 'text-2xl sm:text-4xl text-amber-100/70'
                                }`}>
                                  {posIdx + 1}º
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lista Completa Paginada de Alunos */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                        Classificação de Alunos ({filteredStudentScores.length} encontrados)
                      </h3>
                      <span className="text-[11px] font-bold text-slate-400">
                        Página {studentPage} de {totalStudentPages} • Clique no aluno para ver o extrato completo
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {paginatedStudents.map((student, idx) => {
                        const displayRank = (studentPage - 1) * STUDENTS_PER_PAGE + idx + 1;
                        return (
                          <div
                            key={student.studentKey}
                            onClick={() => setSelectedStudentKeyModal(student.studentKey)}
                            className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                displayRank === 1
                                  ? 'bg-amber-100 text-amber-800'
                                  : displayRank === 2
                                    ? 'bg-slate-200 text-slate-700'
                                    : displayRank === 3
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                              }`}>
                                {displayRank}º
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-black text-slate-900 text-xs sm:text-sm uppercase truncate">
                                    {student.studentName}
                                  </span>
                                  {!student.isActive && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-700">
                                      {student.status}
                                    </span>
                                  )}
                                  {student.deltaPoints !== null && (
                                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded ${
                                      student.deltaPoints >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {student.deltaPoints >= 0 ? `+${student.deltaPoints}` : student.deltaPoints}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                                  <span className="text-slate-600">{student.className} ({student.shift})</span>
                                  <span>• Cód: <strong className="font-mono">{student.studentCode}</strong></span>
                                  <span>• {student.rankInClass}º na turma</span>
                                  <span>• {student.events.length} eventos</span>
                                </div>
                                {student.badges.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {student.badges.map(b => renderBadgePill(b))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                              <div className="text-right">
                                <div className="font-black text-indigo-700 text-base sm:text-lg">
                                  {student.totalPoints} <span className="text-[10px] font-bold text-indigo-400 uppercase">pts</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">
                                  Notas +{student.breakdown.grades} • Cívico {student.breakdown.civicBehavior >= 0 ? `+${student.breakdown.civicBehavior}` : student.breakdown.civicBehavior}
                                </div>
                              </div>
                              <span className="px-3 py-1.5 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white text-[10px] font-black uppercase flex items-center gap-1 transition-all print:hidden">
                                <History size={12} /> Extrato
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredStudentScores.length === 0 && (
                        <div className="p-12 text-center">
                          <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
                          <p className="text-sm font-bold text-slate-500">Nenhum aluno encontrado para os filtros aplicados.</p>
                        </div>
                      )}
                    </div>

                    {/* Paginação */}
                    {totalStudentPages > 1 && (
                      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
                        <button
                          type="button"
                          disabled={studentPage <= 1}
                          onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1"
                        >
                          <ChevronLeft size={14} /> Anterior
                        </button>
                        <span className="text-xs font-bold text-slate-500">
                          Página <strong>{studentPage}</strong> de <strong>{totalStudentPages}</strong>
                        </span>
                        <button
                          type="button"
                          disabled={studentPage >= totalStudentPages}
                          onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1"
                        >
                          Próxima <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* ABA 3: HISTÓRICO & EVOLUÇÃO (TURMAS + LINHA DO TEMPO GERAL)       */}
              {/* ================================================================= */}
              {activeTab === 'historico' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Gráfico Multi-Linhas de Evolução Comparativa */}
                  <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                          <TrendingUp className="text-violet-600" size={18} /> Curva de Evolução Bimestral das Turmas
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Selecione até 6 turmas abaixo para comparar o desempenho do 1º ao 4º Bimestre
                        </p>
                      </div>
                      {selectedCompareClasses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedCompareClasses([])}
                          className="text-[10px] font-black uppercase text-indigo-600 hover:underline self-start"
                        >
                          Voltar ao Top 5 Automático
                        </button>
                      )}
                    </div>

                    {/* Chips de seleção rápida de turmas */}
                    <div className="flex flex-wrap gap-1.5">
                      {filteredClassScores.map(c => {
                        const isSelected = classesToCompare.some(sel => sel.className === c.className);
                        return (
                          <button
                            key={c.className}
                            type="button"
                            onClick={() => toggleCompareClass(c.className)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${
                              isSelected
                                ? 'bg-violet-600 text-white border-violet-700 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {c.className}
                          </button>
                        );
                      })}
                    </div>

                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionLineData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          {classesToCompare.map((c, idx) => (
                            <Line
                              key={c.className}
                              type="monotone"
                              dataKey={c.className}
                              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                              strokeWidth={3}
                              dot={{ r: 5 }}
                              activeDot={{ r: 7 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tabela Evolutiva Comparativa por Turma */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                        Histórico Consolidado por Bimestre (Turmas)
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Turma</th>
                            <th className="px-3 py-3 text-center">Turno</th>
                            <th className="px-3 py-3 text-center">1º Bim</th>
                            <th className="px-3 py-3 text-center">2º Bim</th>
                            <th className="px-3 py-3 text-center">3º Bim</th>
                            <th className="px-3 py-3 text-center">4º Bim</th>
                            <th className="px-3 py-3 text-center">Tendência (2º→3º)</th>
                            <th className="px-4 py-3 text-right">Dossiê</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredClassScores.map(turma => {
                            const b1 = turma.bimesterHistory[0]?.totalPoints ?? 1000;
                            const b2 = turma.bimesterHistory[1]?.totalPoints ?? 1000;
                            const b3 = turma.bimesterHistory[2]?.totalPoints ?? 1000;
                            const b4 = turma.bimesterHistory[3]?.totalPoints ?? 1000;
                            const trend23 = b3 - b2;
                            return (
                              <tr key={turma.className} className="hover:bg-indigo-50/40 transition-colors">
                                <td className="px-4 py-3 font-black text-slate-900">{turma.className}</td>
                                <td className="px-3 py-3 text-center text-[10px] font-bold text-slate-500">{turma.shift}</td>
                                <td className="px-3 py-3 text-center font-bold text-slate-700">{b1}</td>
                                <td className="px-3 py-3 text-center font-bold text-slate-700">{b2}</td>
                                <td className="px-3 py-3 text-center font-black text-indigo-700">{b3}</td>
                                <td className="px-3 py-3 text-center font-bold text-slate-500">{b4}</td>
                                <td className="px-3 py-3 text-center">
                                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                    trend23 >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {trend23 >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                    {trend23 >= 0 ? `+${trend23}` : trend23} pts
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedClassNameModal(turma.className)}
                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all"
                                  >
                                    Abrir Dossiê
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Linha do Tempo Geral de Eventos da Escola */}
                  <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                          <History className="text-indigo-600" size={18} /> Linha do Tempo de Eventos ({periodLabel})
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {filteredSchoolTimeline.length} evento(s) pontuado(s) no recorte filtrado
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          {([
                            ['ALL', 'Todos'],
                            ['GAIN', 'Ganhos (+)'],
                            ['LOSS', 'Perdas (-)']
                          ] as const).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setTimelineDirectionFilter(key)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                timelineDirectionFilter === key ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        <select
                          value={timelinePillarFilter}
                          onChange={e => setTimelinePillarFilter(e.target.value as any)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
                        >
                          <option value="ALL">Todos os Módulos</option>
                          <option value="grades">Notas</option>
                          <option value="library">Biblioteca</option>
                          <option value="civicBehavior">Cívico-Militar</option>
                          <option value="praises">Elogios</option>
                          <option value="occurrences">Ocorrências</option>
                          <option value="extraPoints">Pontos Extras</option>
                        </select>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                      {filteredSchoolTimeline.slice(0, timelineVisibleCount).map(evt => {
                        const isPos = evt.points >= 0;
                        return (
                          <div key={evt.id} className="p-3.5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold text-slate-500">{formatDateBr(evt.date)}</span>
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {evt.sourceLabel}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedClassNameModal(evt.className)}
                                  className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 hover:bg-slate-200 text-slate-700"
                                >
                                  {evt.className}
                                </button>
                                {evt.studentName && (
                                  <span className="text-[10px] font-black uppercase text-slate-800">{evt.studentName}</span>
                                )}
                              </div>
                              <p className="text-xs font-black text-slate-800">{evt.title}</p>
                              {evt.description && <p className="text-[11px] text-slate-500 line-clamp-2">{evt.description}</p>}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-black self-start sm:self-center shrink-0 ${
                                isPos ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isPos ? `+${evt.points}` : evt.points} pts
                            </span>
                          </div>
                        );
                      })}
                      {filteredSchoolTimeline.length === 0 && (
                        <div className="p-10 text-center text-xs font-bold text-slate-400 uppercase">
                          Nenhum evento registrado neste recorte.
                        </div>
                      )}
                    </div>

                    {filteredSchoolTimeline.length > timelineVisibleCount && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setTimelineVisibleCount(c => c + 50)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
                        >
                          Mostrar mais ({filteredSchoolTimeline.length - timelineVisibleCount} restantes)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* ABA 4: AUDITORIA (TURMAS + ALUNOS + EXPORTAÇÃO EXCEL)             */}
              {/* ================================================================= */}
              {activeTab === 'auditoria' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 print:hidden">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm sm:text-base font-black text-slate-800 uppercase flex items-center gap-2">
                        <ShieldCheck className="text-emerald-600" size={20} /> Relatório de Auditoria — {periodLabel}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setAuditMode('turmas')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                          auditMode === 'turmas' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Por Turma ({filteredClassScores.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuditMode('alunos')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                          auditMode === 'alunos' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Por Aluno ({filteredStudentScores.length})
                      </button>
                    </div>
                  </div>

                  {auditMode === 'turmas' ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-black uppercase text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Turma</th>
                            <th className="px-3 py-3 text-center">Base</th>
                            <th className="px-3 py-3 text-center text-emerald-700">Notas</th>
                            <th className="px-3 py-3 text-center text-teal-700">Assiduidade</th>
                            <th className="px-3 py-3 text-center text-blue-700">Biblioteca</th>
                            <th className="px-3 py-3 text-center text-indigo-700">Cívico-Militar</th>
                            <th className="px-3 py-3 text-center text-rose-600">Ocorrências</th>
                            <th className="px-3 py-3 text-center text-amber-600">Elogios</th>
                            <th className="px-3 py-3 text-center text-purple-700">Extras</th>
                            <th className="px-4 py-3 text-center font-black text-slate-900 bg-slate-100/70">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredClassScores.map(turma => (
                            <tr
                              key={turma.className}
                              onClick={() => setSelectedClassNameModal(turma.className)}
                              className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="font-black text-slate-900">{turma.className}</div>
                                <div className="text-[10px] text-slate-400 font-bold">{turma.shift} • {turma.activeStudentCount} ativos</div>
                              </td>
                              <td className="px-3 py-3 text-center text-slate-400 font-bold">1000</td>
                              <td className="px-3 py-3 text-center text-emerald-600 font-black">+{turma.breakdown.grades}</td>
                              <td className="px-3 py-3 text-center text-teal-700 font-black">
                                {turma.breakdown.attendance >= 0 ? `+${turma.breakdown.attendance}` : turma.breakdown.attendance}
                                {turma.attendanceStats && (
                                  <span className="block text-[9px] text-slate-400 font-medium">
                                    {turma.attendanceStats.rate.toFixed(1)}% ({turma.attendanceStats.absences} faltas)
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center text-blue-600 font-black">+{turma.breakdown.library}</td>
                              <td className="px-3 py-3 text-center text-indigo-600 font-black">
                                {turma.breakdown.civicBehavior >= 0 ? `+${turma.breakdown.civicBehavior}` : turma.breakdown.civicBehavior}
                              </td>
                              <td className="px-3 py-3 text-center text-rose-600 font-black">{turma.breakdown.occurrences}</td>
                              <td className="px-3 py-3 text-center text-amber-600 font-black">+{turma.breakdown.praises}</td>
                              <td className="px-3 py-3 text-center text-purple-700 font-black">
                                {turma.breakdown.extraPoints >= 0 ? `+${turma.breakdown.extraPoints}` : turma.breakdown.extraPoints}
                              </td>
                              <td className="px-4 py-3 text-center font-black text-slate-900 bg-slate-50 text-sm">
                                {turma.totalPoints}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-black uppercase text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Estudante & Turma</th>
                            <th className="px-3 py-3 text-center text-emerald-700">Notas</th>
                            <th className="px-3 py-3 text-center text-teal-700">Assiduidade</th>
                            <th className="px-3 py-3 text-center text-blue-700">Biblioteca</th>
                            <th className="px-3 py-3 text-center text-indigo-700">Cívico</th>
                            <th className="px-3 py-3 text-center text-amber-600">Elogios</th>
                            <th className="px-3 py-3 text-center text-rose-600">Ocorrências</th>
                            <th className="px-3 py-3 text-center text-purple-700">Extras</th>
                            <th className="px-4 py-3 text-center font-black text-slate-900 bg-slate-100/70">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedStudents.map(st => (
                            <tr
                              key={st.studentKey}
                              onClick={() => setSelectedStudentKeyModal(st.studentKey)}
                              className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="font-black text-slate-900 uppercase">{st.studentName}</div>
                                <div className="text-[10px] text-slate-400 font-bold">
                                  {st.className} • Cód: {st.studentCode}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center font-black text-emerald-600">+{st.breakdown.grades}</td>
                              <td className="px-3 py-3 text-center font-black text-teal-700">+{st.breakdown.attendance}</td>
                              <td className="px-3 py-3 text-center font-black text-blue-600">+{st.breakdown.library}</td>
                              <td className="px-3 py-3 text-center font-black text-indigo-600">
                                {st.breakdown.civicBehavior >= 0 ? `+${st.breakdown.civicBehavior}` : st.breakdown.civicBehavior}
                              </td>
                              <td className="px-3 py-3 text-center font-black text-amber-600">+{st.breakdown.praises}</td>
                              <td className="px-3 py-3 text-center font-black text-rose-600">{st.breakdown.occurrences}</td>
                              <td className="px-3 py-3 text-center font-black text-purple-700">
                                {st.breakdown.extraPoints >= 0 ? `+${st.breakdown.extraPoints}` : st.breakdown.extraPoints}
                              </td>
                              <td className="px-4 py-3 text-center font-black text-slate-900 bg-slate-50 text-sm">{st.totalPoints}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {totalStudentPages > 1 && (
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
                          <button
                            type="button"
                            disabled={studentPage <= 1}
                            onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 disabled:opacity-40"
                          >
                            Anterior
                          </button>
                          <span className="text-xs font-bold text-slate-500">
                            Página {studentPage} de {totalStudentPages}
                          </span>
                          <button
                            type="button"
                            disabled={studentPage >= totalStudentPages}
                            onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 disabled:opacity-40"
                          >
                            Próxima
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ================================================================= */}
              {/* ABA 5: PONTOS EXTRAS (ATIVADA — GINCANAS, FEIRAS E BONIFICAÇÕES)  */}
              {/* ================================================================= */}
              {activeTab === 'pontos_manuais' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 print:hidden">
                  {/* Formulário */}
                  <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-slate-900 uppercase">Lançar Pontos Extras</h2>
                        <p className="text-[11px] text-slate-500 font-medium">Gincanas, Feira de Ciências, Projetos e Bonificações</p>
                      </div>
                    </div>

                    {!extraPointsBackendAvailable && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] font-semibold text-amber-800">
                        Modo local ativo. Para compartilhar os pontos extras entre todos os computadores, execute o arquivo{' '}
                        <code className="font-mono font-bold">create_gamification_extra_points.sql</code> no Supabase.
                      </div>
                    )}

                    <form onSubmit={handleSaveExtraPoint} className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Turma *</label>
                        <select
                          required
                          value={extraForm.classroom_name}
                          onChange={e => setExtraForm(prev => ({ ...prev, classroom_name: e.target.value, student_code: '' }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                        >
                          <option value="">Selecione a turma...</option>
                          {classroomsMeta.map(c => (
                            <option key={c.name} value={c.name}>
                              {c.name} ({c.shift})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                          Aluno Específico (opcional — deixe em branco para a turma inteira)
                        </label>
                        <select
                          value={extraForm.student_code}
                          onChange={e => setExtraForm(prev => ({ ...prev, student_code: e.target.value }))}
                          disabled={!extraForm.classroom_name}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white disabled:opacity-50"
                        >
                          <option value="">Turma inteira ({extraForm.classroom_name || 'selecione a turma'})</option>
                          {studentsForExtraForm.map(s => (
                            <option key={s.code} value={s.code}>
                              {s.name} (Cód: {s.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Bimestre</label>
                          <select
                            value={extraForm.bimestre}
                            onChange={e => setExtraForm(prev => ({ ...prev, bimestre: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none"
                          >
                            {BIMESTRES_LIST.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Data</label>
                          <input
                            type="date"
                            required
                            value={extraForm.date}
                            onChange={e => setExtraForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Categoria</label>
                          <select
                            value={extraForm.category}
                            onChange={e => setExtraForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none"
                          >
                            {EXTRA_POINT_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Pontos (+ ou -)</label>
                          <input
                            type="number"
                            required
                            value={extraForm.points}
                            onChange={e => setExtraForm(prev => ({ ...prev, points: Number(e.target.value) }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-purple-700 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Justificativa / Descrição *</label>
                        <textarea
                          required
                          rows={3}
                          value={extraForm.description}
                          onChange={e => setExtraForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Ex: 1º lugar na Gincana Cívica / Organização impecável da sala..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:bg-white resize-y"
                        />
                      </div>

                      {extraFeedback && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
                          <CheckCircle2 size={14} /> {extraFeedback}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={extraSaving}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 disabled:opacity-50"
                      >
                        <Plus size={15} /> {extraSaving ? 'Salvando...' : 'Registrar Ponto Extra'}
                      </button>
                    </form>
                  </div>

                  {/* Histórico de Pontos Extras Lançados */}
                  <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Award className="text-purple-600" size={18} /> Histórico de Pontos Extras ({extraPoints.length})
                      </h3>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto custom-scrollbar">
                      {extraPoints.map(ep => (
                        <div key={ep.id} className="py-3.5 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-slate-500">{formatDateBr(ep.date)}</span>
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-purple-100 text-purple-800">
                                {ep.classroom_name}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                                {ep.bimestre}
                              </span>
                              {ep.student_name && (
                                <span className="text-[10px] font-black text-indigo-700 uppercase">{ep.student_name}</span>
                              )}
                            </div>
                            <p className="text-xs font-black text-slate-900">{ep.category}</p>
                            <p className="text-[11px] text-slate-600">{ep.description}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Lançado por: {ep.created_by}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                              ep.points >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {ep.points >= 0 ? `+${ep.points}` : ep.points} pts
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Remover este lançamento de ponto extra?')) {
                                  deleteExtraPoint(ep.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Excluir ponto extra"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {extraPoints.length === 0 && (
                        <div className="py-16 text-center text-slate-400 space-y-2">
                          <Trophy size={36} className="mx-auto text-slate-300" />
                          <p className="text-xs font-bold uppercase">Nenhum ponto extra lançado ainda.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL DOSSIÊ DA TURMA */}
      {activeClassModal && (
        <GamificationClassHistoryModal
          classScore={activeClassModal}
          topStudents={topStudentsOfActiveClassModal}
          periodLabel={periodLabel}
          onClose={() => setSelectedClassNameModal(null)}
          onSelectStudent={st => {
            setSelectedClassNameModal(null);
            setSelectedStudentKeyModal(st.studentKey);
          }}
        />
      )}

      {/* MODAL DOSSIÊ / EXTRATO DO ALUNO */}
      {activeStudentModal && (
        <GamificationStudentHistoryModal
          studentScore={activeStudentModal}
          periodLabel={periodLabel}
          onClose={() => setSelectedStudentKeyModal(null)}
        />
      )}
    </div>
  );
};

export default GamificationModule;
