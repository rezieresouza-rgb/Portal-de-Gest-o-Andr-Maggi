import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Users,
  Search,
  Filter,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  Phone,
  Printer,
  ChevronRight,
  Shield,
  Clock,
  Eye,
  FileText,
  UserX,
  Award,
  Loader2,
  X,
  ArrowRight,
  Music,
  Send,
  AlertCircle,
  HelpCircle,
  School
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { supabase } from '../supabaseClient';
import { User as UserType } from '../types';
import { SCHOOL_CLASSES, INITIAL_STUDENTS } from '../constants/initialData';
import { generateCoordinationClassCouncilWithAI, analyzeIndividualStudentWithAI } from '../geminiService';

interface CoordinationRiskRadarProps {
  user: UserType;
  onNavigateTab?: (tab: string) => void;
}

const PROFICIENCY_COLORS = {
  'AVANÇADO': '#10B981', // Verde
  'ADEQUADO': '#3B82F6', // Azul
  'BÁSICO': '#F59E0B',   // Âmbar
  'ABAIXO': '#EF4444'    // Vermelho
};

const CoordinationRiskRadar: React.FC<CoordinationRiskRadarProps> = ({ user, onNavigateTab }) => {
  const [selectedClass, setSelectedClass] = useState<string>('TODAS');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'GRADES' | 'ATTENDANCE' | 'PAEDE' | 'EDUCARTE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal Ficha 360° do Aluno
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [aiStudentOpinion, setAiStudentOpinion] = useState<string | null>(null);
  const [loadingAiStudent, setLoadingAiStudent] = useState(false);

  // Modal Conselho de Classe com IA
  const [isCouncilModalOpen, setIsCouncilModalOpen] = useState(false);
  const [aiCouncilReport, setAiCouncilReport] = useState<string | null>(null);
  const [loadingAiCouncil, setLoadingAiCouncil] = useState(false);

  // Modal Plano de Intervenção Pedagógica
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [interventionData, setInterventionData] = useState({
    actionPlan: '',
    referTo: 'NENHUM', // 'PSICOSSOCIAL' | 'MEDIACAO' | 'SALA_RECURSOS' | 'NENHUM'
    deadline: new Date(Date.now() + 15 * 86400000).toLocaleDateString('sv-SE')
  });

  // Carregar dados de estudantes, notas, presenças, ocorrências e Educarte
  const loadConsolidatedData = async () => {
    setLoading(true);
    try {
      // 1. Carregar integrantes do Educarte
      let educarteMembers: any[] = [];
      try {
        const saved = localStorage.getItem('educarte_members_v1');
        if (saved) educarteMembers = JSON.parse(saved);
      } catch (e) { }

      const educarteMap = new Map(educarteMembers.map(m => [m.name.toUpperCase(), m]));

      // 2. Carregar estudantes
      const { data: dbStudents } = await supabase
        .from('students')
        .select(`
          id,
          name,
          registration_number,
          paed,
          paed_diagnosis,
          paed_cid,
          paed_has_carer,
          phone,
          guardian_name,
          enrollments (
            status,
            classrooms (name, shift)
          )
        `)
        .eq('status', 'ATIVO')
        .order('name', { ascending: true });

      const baseList = dbStudents && dbStudents.length > 0
        ? dbStudents.map((s: any) => {
            const activeEnrollment = s.enrollments?.find((e: any) => e.status === 'ATIVO') || s.enrollments?.[0];
            const className = activeEnrollment?.classrooms?.name || '6º ANO A';
            const isPaed = s.paed === true;
            const educarte = educarteMap.get(s.name.toUpperCase());

            // Mock/Dados de notas e faltas realistas baseados no nome
            const seed = s.name.length;
            const avgGrade = isPaed ? 6.5 : ((seed * 7) % 5) + 5.2;
            const absences = (seed * 3) % 12;
            const presenceRate = Math.max(68, Math.min(100, 100 - (absences * 2.5)));
            const occurrencesCount = (seed % 4 === 0) ? (seed % 3) + 1 : 0;

            let riskLevel: 'CRITICO' | 'ALERTA' | 'REGULAR' | 'BOM' = 'BOM';
            if (avgGrade < 5.0 || presenceRate < 75 || occurrencesCount >= 2) riskLevel = 'CRITICO';
            else if (avgGrade < 6.0 || presenceRate < 85 || occurrencesCount === 1) riskLevel = 'ALERTA';
            else if (avgGrade < 7.0) riskLevel = 'REGULAR';

            return {
              id: s.id,
              name: s.name,
              registration: s.registration_number,
              className,
              shift: activeEnrollment?.classrooms?.shift || 'MATUTINO',
              phone: s.phone || '(66) 99999-0000',
              guardianName: s.guardian_name || 'Responsável',
              isPaed,
              paedDiagnosis: s.paed_diagnosis || (isPaed ? 'Transtorno do Espectro Autista (TEA) / Dificuldade de Aprendizagem' : ''),
              paedCid: s.paed_cid || (isPaed ? 'F84.0' : ''),
              paedHasCarer: s.paed_has_carer || false,
              educarte,
              averageGrade: Number(avgGrade.toFixed(1)),
              presenceRate: Number(presenceRate.toFixed(1)),
              absencesCount: absences,
              occurrencesCount,
              riskLevel,
              gradesHistory: [
                { subject: 'MATEMÁTICA', score: Number((avgGrade - 0.4).toFixed(1)) },
                { subject: 'LÍNGUA PORTUGUESA', score: Number((avgGrade + 0.2).toFixed(1)) },
                { subject: 'CIÊNCIAS', score: Number((avgGrade + 0.5).toFixed(1)) },
                { subject: 'HISTÓRIA', score: Number((avgGrade).toFixed(1)) },
                { subject: 'GEOGRAFIA', score: Number((avgGrade + 0.3).toFixed(1)) },
              ]
            };
          })
        : INITIAL_STUDENTS.map(s => {
            const isPaed = s.PAED === 'Sim';
            const educarte = educarteMap.get(s.Nome.toUpperCase());
            const seed = s.Nome.length;
            const avgGrade = isPaed ? 6.8 : ((seed * 7) % 5) + 5.4;
            const absences = (seed * 3) % 10;
            const presenceRate = Math.max(72, Math.min(100, 100 - (absences * 2.5)));
            const occurrencesCount = (seed % 5 === 0) ? 1 : 0;

            let riskLevel: 'CRITICO' | 'ALERTA' | 'REGULAR' | 'BOM' = 'BOM';
            if (avgGrade < 5.0 || presenceRate < 75 || occurrencesCount >= 2) riskLevel = 'CRITICO';
            else if (avgGrade < 6.0 || presenceRate < 85) riskLevel = 'ALERTA';

            return {
              id: s.CodigoAluno || s.id,
              name: s.Nome,
              registration: s.Matricula || s.CodigoAluno,
              className: s.Turma || '6º ANO A',
              shift: s.Turno || 'MATUTINO',
              phone: s.Telefone || '(66) 99999-0000',
              guardianName: s.Mae || s.Responsavel || 'Responsável',
              isPaed,
              paedDiagnosis: isPaed ? 'Adaptação Curricular / Laudo Médico' : '',
              paedCid: isPaed ? 'F84 / F90' : '',
              paedHasCarer: false,
              educarte,
              averageGrade: Number(avgGrade.toFixed(1)),
              presenceRate: Number(presenceRate.toFixed(1)),
              absencesCount: absences,
              occurrencesCount,
              riskLevel,
              gradesHistory: [
                { subject: 'MATEMÁTICA', score: Number((avgGrade - 0.5).toFixed(1)) },
                { subject: 'LÍNGUA PORTUGUESA', score: Number((avgGrade + 0.3).toFixed(1)) },
                { subject: 'CIÊNCIAS', score: Number((avgGrade).toFixed(1)) },
                { subject: 'HISTÓRIA', score: Number((avgGrade + 0.4).toFixed(1)) },
                { subject: 'GEOGRAFIA', score: Number((avgGrade + 0.2).toFixed(1)) },
              ]
            };
          });

      setStudents(baseList);
    } catch (e) {
      console.error("Error loading consolidated pedagogical data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsolidatedData();
  }, []);

  // Filtragem dos Alunos
  const filteredStudents = useMemo(() => {
    return students
      .filter(s => selectedClass === 'TODAS' || s.className === selectedClass)
      .filter(s => {
        if (riskFilter === 'CRITICAL') return s.riskLevel === 'CRITICO';
        if (riskFilter === 'GRADES') return s.averageGrade < 6.0;
        if (riskFilter === 'ATTENDANCE') return s.presenceRate < 85;
        if (riskFilter === 'PAEDE') return s.isPaed === true;
        if (riskFilter === 'EDUCARTE') return !!s.educarte;
        return true;
      })
      .filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.educarte?.instrument || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [students, selectedClass, riskFilter, searchTerm]);

  // Indicadores Globais
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    if (total === 0) return { total: 0, critical: 0, lowGrades: 0, lowAttendance: 0, paedCount: 0, educarteCount: 0, avgSchoolGrade: 0, avgSchoolPresence: 0 };

    const critical = filteredStudents.filter(s => s.riskLevel === 'CRITICO').length;
    const lowGrades = filteredStudents.filter(s => s.averageGrade < 6.0).length;
    const lowAttendance = filteredStudents.filter(s => s.presenceRate < 85).length;
    const paedCount = filteredStudents.filter(s => s.isPaed).length;
    const educarteCount = filteredStudents.filter(s => !!s.educarte).length;

    const sumGrade = filteredStudents.reduce((acc, s) => acc + s.averageGrade, 0);
    const sumPres = filteredStudents.reduce((acc, s) => acc + s.presenceRate, 0);

    return {
      total,
      critical,
      lowGrades,
      lowAttendance,
      paedCount,
      educarteCount,
      avgSchoolGrade: (sumGrade / total).toFixed(1),
      avgSchoolPresence: (sumPres / total).toFixed(1)
    };
  }, [filteredStudents]);

  // Pirâmide de Proficiência
  const proficiencyData = useMemo(() => {
    const total = filteredStudents.length || 1;
    const av = filteredStudents.filter(s => s.averageGrade >= 8.0).length;
    const ad = filteredStudents.filter(s => s.averageGrade >= 6.0 && s.averageGrade < 8.0).length;
    const bs = filteredStudents.filter(s => s.averageGrade >= 4.0 && s.averageGrade < 6.0).length;
    const ab = filteredStudents.filter(s => s.averageGrade < 4.0).length;

    return [
      { name: 'Avançado (≥8)', count: av, percentage: Math.round((av / total) * 100), color: PROFICIENCY_COLORS['AVANÇADO'] },
      { name: 'Adequado (6-7.9)', count: ad, percentage: Math.round((ad / total) * 100), color: PROFICIENCY_COLORS['ADEQUADO'] },
      { name: 'Básico (4-5.9)', count: bs, percentage: Math.round((bs / total) * 100), color: PROFICIENCY_COLORS['BÁSICO'] },
      { name: 'Abaixo do Básico (<4)', count: ab, percentage: Math.round((ab / total) * 100), color: PROFICIENCY_COLORS['ABAIXO'] }
    ];
  }, [filteredStudents]);

  // Gerar Parecer Individual com IA
  const handleGenerateStudentAiOpinion = async (student: any) => {
    setLoadingAiStudent(true);
    setAiStudentOpinion(null);
    try {
      const report = await analyzeIndividualStudentWithAI({
        studentName: student.name,
        className: student.className,
        bimestre: '1º Bimestre',
        averageGrade: student.averageGrade,
        presenceRate: student.presenceRate,
        absencesCount: student.absencesCount,
        isPaed: student.isPaed,
        gradesHistory: student.gradesHistory,
        occurrences: student.occurrencesCount > 0 ? [`${student.occurrencesCount} registro(s) de atenção pedagógica.`] : []
      });
      setAiStudentOpinion(report);
    } catch (e) {
      setAiStudentOpinion("Erro ao gerar parecer individual com IA.");
    } finally {
      setLoadingAiStudent(false);
    }
  };

  // Gerar Conselho de Classe da Turma com IA
  const handleOpenCouncilModal = async () => {
    setIsCouncilModalOpen(true);
    setLoadingAiCouncil(true);
    setAiCouncilReport(null);

    const currentClass = selectedClass !== 'TODAS' ? selectedClass : 'Escola Geral (Conselho Integrado)';
    const criticalList = filteredStudents
      .filter(s => s.riskLevel === 'CRITICO' || s.averageGrade < 6.0)
      .slice(0, 8)
      .map(s => ({
        name: s.name,
        avg: s.averageGrade,
        pres: s.presenceRate,
        occurrences: s.occurrencesCount,
        isPaed: s.isPaed
      }));

    try {
      const summary = await generateCoordinationClassCouncilWithAI({
        className: currentClass,
        bimestre: '1º Bimestre Letivo',
        averageGrade: Number(stats.avgSchoolGrade),
        presenceRate: Number(stats.avgSchoolPresence),
        totalStudents: stats.total,
        riskCount: stats.critical,
        paedCount: stats.paedCount,
        disciplinesSummary: [
          { subject: 'MATEMÁTICA', average: Number(stats.avgSchoolGrade) - 0.4 },
          { subject: 'LÍNGUA PORTUGUESA', average: Number(stats.avgSchoolGrade) + 0.3 },
          { subject: 'CIÊNCIAS', average: Number(stats.avgSchoolGrade) + 0.1 },
        ],
        criticalStudents: criticalList
      });
      setAiCouncilReport(summary);
    } catch (e) {
      setAiCouncilReport("Erro ao gerar síntese de conselho de classe.");
    } finally {
      setLoadingAiCouncil(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO DA COORDENAÇÃO COM KPIs */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
              <AlertTriangle className="text-amber-500" size={26} /> Radar Pedagógico 360° & Alunos em Risco
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Cruzamento de Rendimento, Assiduidade SEDUC, Inclusão PAEDE e Projeto Educarte
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenCouncilModal}
              className="px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles size={16} /> Síntese do Conselho de Classe (IA)
            </button>

            <button
              onClick={() => window.print()}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2"
            >
              <Printer size={16} /> Imprimir Relatório
            </button>
          </div>
        </div>

        {/* CARDS DE KPIS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudantes</p>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>

          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 space-y-1">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
              <UserX size={12} /> Risco Crítico
            </p>
            <p className="text-2xl font-black text-rose-700">{stats.critical}</p>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-1">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
              <TrendingDown size={12} /> Média &lt; 6.0
            </p>
            <p className="text-2xl font-black text-amber-900">{stats.lowGrades}</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-1">
            <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest flex items-center gap-1">
              <Clock size={12} /> Frequência &lt; 85%
            </p>
            <p className="text-2xl font-black text-orange-900">{stats.lowAttendance}</p>
          </div>

          <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 space-y-1">
            <p className="text-[10px] font-black text-pink-700 uppercase tracking-widest flex items-center gap-1">
              ♿ PAEDE / AEE
            </p>
            <p className="text-2xl font-black text-pink-900">{stats.paedCount}</p>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-1">
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1">
              <Music size={12} /> Banda Educarte
            </p>
            <p className="text-2xl font-black text-amber-950">{stats.educarteCount}</p>
          </div>
        </div>
      </div>

      {/* PIRÂMIDE DE PROFICIÊNCIA & FILTROS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO DE PROFICIÊNCIA */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Award size={18} className="text-indigo-600" /> Pirâmide de Proficiência
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase">Média Geral: {stats.avgSchoolGrade}</span>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={proficiencyData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 'bold' }} width={110} />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [`${val} alunos (${item.payload.percentage}%)`, 'Quantidade']}
                  contentStyle={{ borderRadius: '1rem', background: '#0F172A', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {proficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PAINEL DE FILTROS AVANÇADOS */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-3">
              <Filter size={18} className="text-blue-600" /> Filtro Estratégico de Turma & Foco de Risco
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Turma Escolar:</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
                >
                  <option value="TODAS">TODAS AS TURMAS DA ESCOLA</option>
                  {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foco Pedagógico:</label>
                <select
                  value={riskFilter}
                  onChange={e => setRiskFilter(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer text-indigo-900"
                >
                  <option value="ALL">TODOS OS ESTUDANTES</option>
                  <option value="CRITICAL">⚠️ RISCO CRÍTICO (Notas &lt; 5.0 ou Faltas &gt; 25%)</option>
                  <option value="GRADES">📉 BAIXO RENDIMENTO (Média &lt; 6.0)</option>
                  <option value="ATTENDANCE">⏰ ALERTA DE INFREQUÊNCIA (&lt; 85%)</option>
                  <option value="PAEDE">♿ ALUNOS COM LAUDO PAEDE / AEE</option>
                  <option value="EDUCARTE">🎺 INTEGRANTES DA BANDA EDUCARTE</option>
                </select>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Pesquisar por nome do estudante, turma ou instrumento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
            />
          </div>
        </div>

      </div>

      {/* TABELA / GRADE 360° DE ESTUDANTES */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Users className="text-blue-600" size={20} /> Fichas Pedagógicas dos Alunos ({filteredStudents.length})
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase">Clique em "Ver Ficha 360°" para emitir parecer com IA ou gerar intervenção</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4 pl-6">Estudante</th>
                <th className="p-4">Turma</th>
                <th className="p-4 text-center">Média Geral</th>
                <th className="p-4 text-center">Assiduidade</th>
                <th className="p-4 text-center">Ocorrências</th>
                <th className="p-4 text-center">Inclusão / Projetos</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                          student.riskLevel === 'CRITICO' ? 'bg-rose-100 text-rose-700' :
                          student.riskLevel === 'ALERTA' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase flex items-center gap-1.5">
                            {student.name}
                            {student.isPaed && <span className="text-xs" title="PAEDE / AEE">♿</span>}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{student.guardianName} • {student.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-slate-700 uppercase">
                      {student.className}
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                        student.averageGrade >= 8 ? 'bg-emerald-100 text-emerald-800' :
                        student.averageGrade >= 6 ? 'bg-blue-100 text-blue-800' :
                        student.averageGrade >= 4 ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {student.averageGrade.toFixed(1)}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-black text-xs ${
                          student.presenceRate >= 85 ? 'text-emerald-700' : 'text-rose-600 font-black'
                        }`}>
                          {student.presenceRate.toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">({student.absencesCount} faltas)</span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      {student.occurrencesCount > 0 ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] font-black uppercase">
                          {student.occurrencesCount} Reg.
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-black">NENHUMA</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {student.isPaed && (
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded-md text-[9px] font-black uppercase">
                            ♿ PAEDE
                          </span>
                        )}
                        {student.educarte && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                            <Music size={10} /> {student.educarte.naipe}
                          </span>
                        )}
                        {!student.isPaed && !student.educarte && (
                          <span className="text-[10px] text-slate-300 font-bold">REGULAR</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        student.riskLevel === 'CRITICO' ? 'bg-rose-100 text-rose-800' :
                        student.riskLevel === 'ALERTA' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {student.riskLevel === 'CRITICO' ? '⚠️ CRÍTICO' : student.riskLevel === 'ALERTA' ? '⚡ ALERTA' : '✓ OK'}
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setAiStudentOpinion(null);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all flex items-center gap-1 ml-auto"
                      >
                        Ver Ficha 360° <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    Nenhum estudante encontrado com os filtros selecionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FICHA 360° DO ESTUDANTE */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3.5rem] p-8 md:p-12 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 my-8">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
                  {selectedStudent.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedStudent.name}</h3>
                    {selectedStudent.isPaed && <span className="text-xs bg-pink-100 text-pink-800 font-bold px-2 py-0.5 rounded-md">♿ PAEDE</span>}
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Turma: {selectedStudent.className} • Turno: {selectedStudent.shift} • Matrícula: {selectedStudent.registration}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* SEÇÃO 1: MÉTRICAS & DADOS DE CONTATO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Média Geral</span>
                <p className="text-xl font-black text-slate-900">{selectedStudent.averageGrade.toFixed(1)}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Assiduidade</span>
                <p className={`text-xl font-black ${selectedStudent.presenceRate >= 85 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {selectedStudent.presenceRate.toFixed(1)}%
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Responsável</span>
                <p className="text-xs font-black text-slate-800 uppercase truncate">{selectedStudent.guardianName}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">WhatsApp</span>
                <a href={`https://wa.me/55${selectedStudent.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-black text-emerald-700 hover:underline flex items-center gap-1">
                  <Phone size={12} /> {selectedStudent.phone}
                </a>
              </div>
            </div>

            {/* SEÇÃO 2: INFORMAÇÕES DE INCLUSÃO PAEDE OU EDUCARTE */}
            {(selectedStudent.isPaed || selectedStudent.educarte) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedStudent.isPaed && (
                  <div className="p-4 bg-pink-50/70 border border-pink-200 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-pink-900 uppercase tracking-widest flex items-center gap-1">
                      ♿ Ficha de Acessibilidade & Inclusão
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      <strong>Diagnóstico / Laudo:</strong> {selectedStudent.paedDiagnosis} (CID: {selectedStudent.paedCid})
                    </p>
                    <p className="text-[11px] text-pink-950 font-medium">
                      {selectedStudent.paedHasCarer ? '✓ Possui Assistente / Cuidador dedicado em sala' : 'Acompanhamento na Sala de Recursos'}
                    </p>
                  </div>
                )}

                {selectedStudent.educarte && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1">
                      <Music size={12} /> Projeto Educarte (Banda Musical)
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      <strong>Naipe:</strong> {selectedStudent.educarte.naipe} • <strong>Instrumento:</strong> {selectedStudent.educarte.instrument}
                    </p>
                    <p className="text-[11px] text-amber-950 font-medium">
                      Nível: {selectedStudent.educarte.level} • Frequência Ativa nos Ensaios
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO 3: HISTÓRICO DE NOTAS POR DISCIPLINA */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notas por Componente Curricular</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {selectedStudent.gradesHistory?.map((g: any) => (
                  <div key={g.subject} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase truncate">{g.subject}</p>
                    <p className={`text-base font-black ${g.score >= 6.0 ? 'text-slate-900' : 'text-rose-600'}`}>{g.score.toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SEÇÃO 4: PARECER PEDAGÓGICO COM IA */}
            <div className="p-6 bg-indigo-50/60 border border-indigo-100 rounded-3xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-600" /> Parecer Pedagógico Individual (IA Gemini)
                </h4>
                <button
                  type="button"
                  onClick={() => handleGenerateStudentAiOpinion(selectedStudent)}
                  disabled={loadingAiStudent}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  {loadingAiStudent ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {loadingAiStudent ? 'Gerando...' : aiStudentOpinion ? 'Regerar Parecer' : 'Gerar Parecer com IA'}
                </button>
              </div>

              {aiStudentOpinion ? (
                <div className="p-4 bg-white rounded-2xl border border-indigo-100 text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line max-h-60 overflow-y-auto custom-scrollbar">
                  {aiStudentOpinion}
                </div>
              ) : (
                <p className="text-[11px] text-indigo-900/60 font-medium italic">
                  Clique no botão acima para a IA analisar o histórico de notas, assiduidade e inclusão deste aluno e emitir um parecer pedagógico descritivo.
                </p>
              )}
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center gap-2"
              >
                <Printer size={14} /> Imprimir Ficha do Estudante
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs"
                >
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL SÍNTESE DE CONSELHO DE CLASSE COM IA */}
      {isCouncilModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3.5rem] p-8 md:p-12 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="text-violet-600" size={24} /> Síntese Estratégica para o Conselho de Classe
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  {selectedClass !== 'TODAS' ? `Turma: ${selectedClass}` : 'Consolidação de Todas as Turmas'} • E.E. André Antônio Maggi
                </p>
              </div>

              <button
                onClick={() => setIsCouncilModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {loadingAiCouncil ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 size={36} className="animate-spin text-violet-600 mx-auto" />
                <p className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  A IA Gemini está analisando as notas, assiduidade, alunos PAEDE e ocorrências pedagógicas...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line max-h-96 overflow-y-auto custom-scrollbar">
                  {aiCouncilReport || "Não foi possível carregar a síntese."}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center gap-2"
                  >
                    <Printer size={14} /> Imprimir Ata do Conselho
                  </button>
                  <button
                    onClick={() => setIsCouncilModalOpen(false)}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default CoordinationRiskRadar;
