import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Plus,
  Search,
  Printer,
  Trash2,
  X,
  Save,
  CheckCircle2,
  RotateCcw,
  Clock,
  UserCheck,
  Building2,
  ShieldAlert,
  HeartHandshake,
  AlertTriangle,
  History,
  FileText,
  Activity,
  Home,
  MessageSquare,
  Users,
  ChevronRight,
  Filter,
  Check,
  Calendar,
  Lock,
  Sparkles
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import {
  PsychosocialCase,
  PsychosocialSessionLog,
  PsychosocialProcessStep,
  PsychosocialSessionType,
  PsychosocialRole
} from '../types';

interface PsychosocialCaseManagerProps {
  user?: any;
  role: PsychosocialRole;
  initialSearch?: string;
}

const SESSION_TYPE_CONFIG: Record<PsychosocialSessionType, { label: string; icon: any; color: string; bg: string }> = {
  ESCUTA_INDIVIDUAL_ALUNO: {
    label: 'Escuta Individual (Discente)',
    icon: Brain,
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200'
  },
  ENTREVISTA_FAMILIAR: {
    label: 'Entrevista / Acolhimento Familiar',
    icon: Users,
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200'
  },
  ALINHAMENTO_PEDAGOGICO: {
    label: 'Alinhamento com Docentes / Coordenação',
    icon: UserCheck,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200'
  },
  VISITA_DOMICILIAR: {
    label: 'Visita Domiciliar (Serviço Social)',
    icon: Home,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200'
  },
  ESTUDO_CASO_INTERSETORIAL: {
    label: 'Estudo de Caso com Rede (CAPSi/CT/CRAS)',
    icon: Building2,
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200'
  },
  MANEJO_CRISE_EMOCIONAL: {
    label: 'Manejo de Crise Emocional Aguda',
    icon: ShieldAlert,
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200'
  }
};

const DEMAND_TYPE_LABELS: Record<string, string> = {
  SAUDE_MENTAL: 'Saúde Mental & Sofrimento Psíquico',
  VULNERABILIDADE_SOCIAL: 'Vulnerabilidade Socioeconômica Extrema',
  VIOLENCIA_DOMESTICA: 'Violação de Direitos / Violência Doméstica',
  LUTO_CRISE: 'Luto / Crise Familiar Aguda',
  COMPORTAMENTAL_GRAVE: 'Conflito Comportamental / Desregulação',
  INFREQUENCIA_EVASAO: 'Evasão Escolar / Infrequência Crítica',
  OUTRO: 'Outra Demanda Especializada'
};

const DEFAULT_PSYCHOSOCIAL_STEPS: PsychosocialProcessStep[] = [
  { id: 'step-1', label: '1. Acolhimento e Escuta Especializada Inicial', completed: true, date: new Date().toLocaleDateString('sv-SE') },
  { id: 'step-2', label: '2. Entrevista e Escuta com a Família / Responsáveis Legais', completed: false },
  { id: 'step-3', label: '3. Alinhamento Pedagógico com Professores e Coordenação', completed: false },
  { id: 'step-4', label: '4. Articulação com a Rede Externa (CAPSi / Conselho Tutelar / CRAS)', completed: false },
  { id: 'step-5', label: '5. Devolutiva Orientativa à Gestão Escolar (Sem Quebra de Sigilo)', completed: false },
  { id: 'step-6', label: '6. Reavaliação, Conclusão ou Monitoramento Longitudinal', completed: false }
];

const PsychosocialCaseManager: React.FC<PsychosocialCaseManagerProps> = ({
  user,
  role,
  initialSearch
}) => {
  const { students: dbStudents } = useStudents();
  const [cases, setCases] = useState<PsychosocialCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [demandFilter, setDemandFilter] = useState<string>('TODAS');

  // Modal de visualização / gestão do caso
  const [selectedCase, setSelectedCase] = useState<PsychosocialCase | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'steps' | 'opinion'>('sessions');

  // Modal de abertura de novo caso
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Formulário de nova evolução / sessão dentro do caso
  const [newSession, setNewSession] = useState<Partial<PsychosocialSessionLog>>({
    date: new Date().toLocaleDateString('sv-SE'),
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    type: 'ESCUTA_INDIVIDUAL_ALUNO',
    participants: '',
    professionalName: user?.name || 'TÉCNICO PSICOSSOCIAL',
    professionalRole: 'PSICÓLOGO(A) / ASSISTENTE SOCIAL',
    summary: '',
    confidentialNotes: '',
    immediateActions: ''
  });

  // Formulário de novo caso
  const [newCaseForm, setNewCaseForm] = useState<Partial<PsychosocialCase>>({
    studentName: '',
    className: '',
    studentAge: '',
    guardianName: '',
    guardianPhone: '',
    guardianAddress: '',
    priority: 'MÉDIA',
    demandType: 'SAUDE_MENTAL',
    origin: 'TRIAGEM_MEDIACAO',
    initialDemand: '',
    status: 'ACOLHIMENTO',
    professionalInCharge: user?.name || 'TÉCNICO PSICOSSOCIAL'
  });

  const currentYear = new Date().getFullYear();

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('psychosocial_cases')
        .select('*')
        .order('opened_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted: PsychosocialCase[] = data.map((c: any) => ({
          id: c.id,
          caseNumber: c.case_number || ('PSI-' + String(c.id).substring(0, 5) + '/' + currentYear),
          studentId: c.student_id,
          studentName: c.student_name,
          className: c.class_name,
          studentAge: c.student_age,
          birthDate: c.birth_date,
          guardianName: c.guardian_name,
          guardianPhone: c.guardian_phone,
          guardianAddress: c.guardian_address,
          status: c.status || 'ACOLHIMENTO',
          priority: c.priority || 'MÉDIA',
          demandType: c.demand_type || 'SAUDE_MENTAL',
          origin: c.origin || 'TRIAGEM_MEDIACAO',
          originReferralId: c.origin_referral_id,
          openedAt: c.opened_at || new Date().toISOString(),
          closedAt: c.closed_at,
          initialDemand: c.initial_demand || c.description || 'Acolhimento psicossocial inicial.',
          logs: Array.isArray(c.logs) ? c.logs : [],
          steps: Array.isArray(c.steps) && c.steps.length > 0 ? c.steps : DEFAULT_PSYCHOSOCIAL_STEPS,
          technicalOpinion: c.technical_opinion || '',
          schoolRecommendations: c.school_recommendations || '',
          externalNetworkAction: c.external_network_action || '',
          professionalInCharge: c.professional_in_charge || user?.name || 'TÉCNICO PSICOSSOCIAL'
        }));
        setCases(formatted);
      } else {
        const saved = localStorage.getItem('psychosocial_cases_v2026');
        if (saved) {
          setCases(JSON.parse(saved));
        } else {
          setCases([]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar casos psicossociais:', err);
      const saved = localStorage.getItem('psychosocial_cases_v2026');
      if (saved) setCases(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim() || studentSearch.length < 2) return [];
    return dbStudents.filter(s =>
      (s.Nome || s.name || '').toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 8);
  }, [studentSearch, dbStudents]);

  const handleSelectStudent = (s: any) => {
    setNewCaseForm(prev => ({
      ...prev,
      studentId: s.CodigoAluno || s.id,
      studentName: s.Nome || s.name,
      className: s.Turma || s.className || '',
      birthDate: s.DataNascimento || s.birthDate || '',
      guardianName: s.NomeMae || s.NomePai || s.guardianName || '',
      guardianPhone: s.Telefone || s.contactPhone || '',
      guardianAddress: s.Endereco || s.address || ''
    }));
    setStudentSearch('');
  };

  // Salvar novo caso
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseForm.studentName?.trim() || !newCaseForm.initialDemand?.trim()) {
      return alert("Por favor, selecione o discente e descreva a queixa/demanda inicial.");
    }

    const nextCaseNumber = 'PSI-' + String(cases.length + 1).padStart(3, '0') + '/' + currentYear;
    const newCaseId = 'psi-' + Date.now();

    const initialLog: PsychosocialSessionLog = {
      id: 'log-' + Date.now(),
      date: new Date().toLocaleDateString('sv-SE'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'ESCUTA_INDIVIDUAL_ALUNO',
      participants: newCaseForm.studentName,
      professionalName: user?.name || 'TÉCNICO PSICOSSOCIAL',
      professionalRole: 'PSICÓLOGO(A) / ASSISTENTE SOCIAL',
      summary: `Abertura do prontuário técnico e acolhimento inicial. Demanda identificada: ${newCaseForm.initialDemand}`,
      immediateActions: 'Início do Plano de Acompanhamento Singular e escuta qualificada.'
    };

    const newCaseItem: PsychosocialCase = {
      id: newCaseId,
      caseNumber: nextCaseNumber,
      studentId: newCaseForm.studentId,
      studentName: newCaseForm.studentName,
      className: newCaseForm.className || '',
      studentAge: newCaseForm.studentAge || '',
      birthDate: newCaseForm.birthDate,
      guardianName: newCaseForm.guardianName || '',
      guardianPhone: newCaseForm.guardianPhone || '',
      guardianAddress: newCaseForm.guardianAddress || '',
      status: 'ACOLHIMENTO',
      priority: newCaseForm.priority || 'MÉDIA',
      demandType: newCaseForm.demandType || 'SAUDE_MENTAL',
      origin: newCaseForm.origin || 'TRIAGEM_MEDIACAO',
      openedAt: new Date().toISOString(),
      initialDemand: newCaseForm.initialDemand,
      logs: [initialLog],
      steps: DEFAULT_PSYCHOSOCIAL_STEPS,
      professionalInCharge: user?.name || 'TÉCNICO PSICOSSOCIAL'
    };

    try {
      const { error } = await supabase.from('psychosocial_cases').insert([{
        id: newCaseItem.id,
        case_number: newCaseItem.caseNumber,
        student_id: newCaseItem.studentId,
        student_name: newCaseItem.studentName,
        class_name: newCaseItem.className,
        student_age: newCaseItem.studentAge,
        birth_date: newCaseItem.birthDate,
        guardian_name: newCaseItem.guardianName,
        guardian_phone: newCaseItem.guardianPhone,
        guardian_address: newCaseItem.guardianAddress,
        status: newCaseItem.status,
        priority: newCaseItem.priority,
        demand_type: newCaseItem.demandType,
        origin: newCaseItem.origin,
        opened_at: newCaseItem.openedAt,
        initial_demand: newCaseItem.initialDemand,
        logs: newCaseItem.logs,
        steps: newCaseItem.steps,
        professional_in_charge: newCaseItem.professionalInCharge
      }]);

      if (error) {
        console.warn('Salvando localmente:', error);
      }

      const updated = [newCaseItem, ...cases];
      setCases(updated);
      localStorage.setItem('psychosocial_cases_v2026', JSON.stringify(updated));
      setIsCreateModalOpen(false);
      setSelectedCase(newCaseItem);
      alert("✅ Prontuário Psicossocial aberto com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao criar caso: " + err.message);
    }
  };

  // Adicionar Sessão de Atendimento / Evolução
  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newSession.summary?.trim()) {
      return alert("Por favor, preencha a síntese técnica do atendimento.");
    }

    const sessionItem: PsychosocialSessionLog = {
      id: 'log-' + Date.now(),
      date: newSession.date || new Date().toLocaleDateString('sv-SE'),
      time: newSession.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: newSession.type || 'ESCUTA_INDIVIDUAL_ALUNO',
      participants: newSession.participants?.trim() || selectedCase.studentName,
      professionalName: newSession.professionalName || user?.name || 'TÉCNICO PSICOSSOCIAL',
      professionalRole: 'PSICÓLOGO(A) / ASSISTENTE SOCIAL',
      summary: newSession.summary.trim(),
      confidentialNotes: newSession.confidentialNotes?.trim() || '',
      immediateActions: newSession.immediateActions?.trim() || ''
    };

    const updatedLogs = [sessionItem, ...(selectedCase.logs || [])];
    const updatedCase = {
      ...selectedCase,
      logs: updatedLogs,
      status: selectedCase.status === 'ACOLHIMENTO' ? ('EM_ACOMPANHAMENTO' as const) : selectedCase.status
    };

    try {
      await supabase
        .from('psychosocial_cases')
        .update({
          logs: updatedLogs,
          status: updatedCase.status
        })
        .eq('id', selectedCase.id);

      const updatedList = cases.map(c => c.id === selectedCase.id ? updatedCase : c);
      setCases(updatedList);
      localStorage.setItem('psychosocial_cases_v2026', JSON.stringify(updatedList));
      setSelectedCase(updatedCase);

      setNewSession(prev => ({
        ...prev,
        summary: '',
        confidentialNotes: '',
        immediateActions: '',
        participants: ''
      }));

      alert("✅ Sessão de atendimento registrada no prontuário!");
    } catch (err: any) {
      console.error('Erro ao adicionar sessão:', err);
      alert("Erro ao salvar sessão: " + err.message);
    }
  };

  // Atualizar Checklist de Etapas
  const handleToggleStep = async (stepIdx: number) => {
    if (!selectedCase) return;

    const currentStep = selectedCase.steps[stepIdx];
    const updatedSteps = selectedCase.steps.map((s, idx) => {
      if (idx === stepIdx) {
        return {
          ...s,
          completed: !s.completed,
          date: !s.completed ? new Date().toLocaleDateString('sv-SE') : undefined
        };
      }
      return s;
    });

    const updatedCase = { ...selectedCase, steps: updatedSteps };

    try {
      await supabase
        .from('psychosocial_cases')
        .update({ steps: updatedSteps })
        .eq('id', selectedCase.id);

      const updatedList = cases.map(c => c.id === selectedCase.id ? updatedCase : c);
      setCases(updatedList);
      localStorage.setItem('psychosocial_cases_v2026', JSON.stringify(updatedList));
      setSelectedCase(updatedCase);
    } catch (err: any) {
      console.error('Erro ao atualizar etapa:', err);
    }
  };

  // Salvar Parecer Técnico e Orientações
  const handleSaveOpinion = async () => {
    if (!selectedCase) return;

    try {
      await supabase
        .from('psychosocial_cases')
        .update({
          technical_opinion: selectedCase.technicalOpinion || '',
          school_recommendations: selectedCase.schoolRecommendations || '',
          status: selectedCase.status
        })
        .eq('id', selectedCase.id);

      const updatedList = cases.map(c => c.id === selectedCase.id ? selectedCase : c);
      setCases(updatedList);
      localStorage.setItem('psychosocial_cases_v2026', JSON.stringify(updatedList));
      alert("✅ Parecer Técnico Psicossocial e Orientações Pedagógicas salvas com sucesso!");
    } catch (err: any) {
      console.error('Erro ao salvar parecer:', err);
      alert("Erro: " + err.message);
    }
  };

  // Concluir Caso
  const handleCloseCase = async () => {
    if (!selectedCase) return;
    if (!window.confirm(`Deseja finalizar o acompanhamento psicossocial do estudante ${selectedCase.studentName}?`)) return;

    const updatedCase: PsychosocialCase = {
      ...selectedCase,
      status: 'CONCLUÍDO',
      closedAt: new Date().toISOString()
    };

    try {
      await supabase
        .from('psychosocial_cases')
        .update({
          status: 'CONCLUÍDO',
          closed_at: updatedCase.closedAt,
          technical_opinion: selectedCase.technicalOpinion || ''
        })
        .eq('id', selectedCase.id);

      const updatedList = cases.map(c => c.id === selectedCase.id ? updatedCase : c);
      setCases(updatedList);
      localStorage.setItem('psychosocial_cases_v2026', JSON.stringify(updatedList));
      setSelectedCase(updatedCase);
      alert("✅ Caso finalizado com parecer conclusivo registrado no prontuário!");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao finalizar caso: " + err.message);
    }
  };

  // Excluir Caso
  const handleDeleteCase = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ Tem certeza que deseja excluir este prontuário psicossocial?")) return;

    try {
      await supabase.from('psychosocial_cases').delete().eq('id', id);
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      localStorage.setItem('psychosocial_cases_v2026', JSON.stringify(updated));
      if (selectedCase?.id === id) setSelectedCase(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtros
  const filteredCases = cases.filter(c => {
    const matchesSearch =
      (c.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.caseNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.initialDemand || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'TODOS' || c.status === statusFilter;
    const matchesDemand = demandFilter === 'TODAS' || c.demandType === demandFilter;

    return matchesSearch && matchesStatus && matchesDemand;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* HEADER DE CONTROLE */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-rose-600 to-indigo-600 text-white rounded-3xl shadow-lg shadow-rose-600/20">
            <Brain size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Prontuário & Atendimentos Psicossociais
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 text-[8px] font-black uppercase tracking-wider">
                Lei 13.935/2019 • SEDUC/MT
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Escuta especializada, plano singular de acompanhamento, registro de evoluções e pareceres técnicos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar aluno, prontuário ou demanda..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none w-64 focus:bg-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer focus:bg-white"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ACOLHIMENTO">Em Acolhimento</option>
            <option value="EM_ACOMPANHAMENTO">Em Acompanhamento</option>
            <option value="AGUARDANDO_REDE">Aguardando Rede</option>
            <option value="CONCLUÍDO">Concluídos</option>
          </select>

          <button
            onClick={() => {
              setNewCaseForm({
                studentName: '',
                className: '',
                studentAge: '',
                guardianName: '',
                guardianPhone: '',
                guardianAddress: '',
                priority: 'MÉDIA',
                demandType: 'SAUDE_MENTAL',
                origin: 'TRIAGEM_MEDIACAO',
                initialDemand: '',
                status: 'ACOLHIMENTO',
                professionalInCharge: user?.name || 'TÉCNICO PSICOSSOCIAL'
              });
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={16} /> Novo Acolhimento / Prontuário
          </button>
        </div>
      </div>

      {/* CARDS DE STATUS RÁPIDO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div 
          onClick={() => setStatusFilter(statusFilter === 'ACOLHIMENTO' ? 'TODOS' : 'ACOLHIMENTO')}
          className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === 'ACOLHIMENTO' ? 'bg-rose-900 text-white border-rose-700 shadow-xl' : 'bg-white border-slate-100 hover:border-rose-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-2xl ${statusFilter === 'ACOLHIMENTO' ? 'bg-white/10 text-white' : 'bg-rose-50 text-rose-600'}`}>
              <Brain size={22} />
            </div>
            <span className={`text-2xl font-black ${statusFilter === 'ACOLHIMENTO' ? 'text-white' : 'text-slate-900'}`}>
              {cases.filter(c => c.status === 'ACOLHIMENTO').length}
            </span>
          </div>
          <div className="mt-4">
            <p className={`text-xs font-black uppercase ${statusFilter === 'ACOLHIMENTO' ? 'text-white' : 'text-slate-900'}`}>Em Acolhimento</p>
            <p className={`text-[10px] mt-1 ${statusFilter === 'ACOLHIMENTO' ? 'text-rose-200' : 'text-slate-500'}`}>Casos novos em fase de escuta inicial</p>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'EM_ACOMPANHAMENTO' ? 'TODOS' : 'EM_ACOMPANHAMENTO')}
          className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === 'EM_ACOMPANHAMENTO' ? 'bg-indigo-900 text-white border-indigo-700 shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-2xl ${statusFilter === 'EM_ACOMPANHAMENTO' ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
              <Activity size={22} />
            </div>
            <span className={`text-2xl font-black ${statusFilter === 'EM_ACOMPANHAMENTO' ? 'text-white' : 'text-slate-900'}`}>
              {cases.filter(c => c.status === 'EM_ACOMPANHAMENTO').length}
            </span>
          </div>
          <div className="mt-4">
            <p className={`text-xs font-black uppercase ${statusFilter === 'EM_ACOMPANHAMENTO' ? 'text-white' : 'text-slate-900'}`}>Em Acompanhamento</p>
            <p className={`text-[10px] mt-1 ${statusFilter === 'EM_ACOMPANHAMENTO' ? 'text-indigo-200' : 'text-slate-500'}`}>Sessões periódicas e plano ativo</p>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'AGUARDANDO_REDE' ? 'TODOS' : 'AGUARDANDO_REDE')}
          className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === 'AGUARDANDO_REDE' ? 'bg-purple-900 text-white border-purple-700 shadow-xl' : 'bg-white border-slate-100 hover:border-purple-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-2xl ${statusFilter === 'AGUARDANDO_REDE' ? 'bg-white/10 text-white' : 'bg-purple-50 text-purple-600'}`}>
              <Building2 size={22} />
            </div>
            <span className={`text-2xl font-black ${statusFilter === 'AGUARDANDO_REDE' ? 'text-white' : 'text-slate-900'}`}>
              {cases.filter(c => c.status === 'AGUARDANDO_REDE').length}
            </span>
          </div>
          <div className="mt-4">
            <p className={`text-xs font-black uppercase ${statusFilter === 'AGUARDANDO_REDE' ? 'text-white' : 'text-slate-900'}`}>Rede de Proteção</p>
            <p className={`text-[10px] mt-1 ${statusFilter === 'AGUARDANDO_REDE' ? 'text-purple-200' : 'text-slate-500'}`}>Encaminhado ao CAPSi / Conselho / CRAS</p>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'CONCLUÍDO' ? 'TODOS' : 'CONCLUÍDO')}
          className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === 'CONCLUÍDO' ? 'bg-emerald-900 text-white border-emerald-700 shadow-xl' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-2xl ${statusFilter === 'CONCLUÍDO' ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
              <CheckCircle2 size={22} />
            </div>
            <span className={`text-2xl font-black ${statusFilter === 'CONCLUÍDO' ? 'text-white' : 'text-slate-900'}`}>
              {cases.filter(c => c.status === 'CONCLUÍDO').length}
            </span>
          </div>
          <div className="mt-4">
            <p className={`text-xs font-black uppercase ${statusFilter === 'CONCLUÍDO' ? 'text-white' : 'text-slate-900'}`}>Casos Concluídos</p>
            <p className={`text-[10px] mt-1 ${statusFilter === 'CONCLUÍDO' ? 'text-emerald-200' : 'text-slate-500'}`}>Superação com parecer final emitido</p>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE CASOS PSICOSSOCIAIS */}
      <div className="grid grid-cols-1 gap-4 no-print">
        {filteredCases.map(caseItem => {
          return (
            <div
              key={caseItem.id}
              onClick={() => {
                setSelectedCase(caseItem);
                setActiveTab('sessions');
              }}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm hover:border-rose-300 hover:shadow-xl transition-all cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5 flex-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shrink-0 bg-rose-50 border-rose-200 text-rose-600">
                  <Brain size={26} />
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-[10px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                      {caseItem.caseNumber}
                    </span>
                    <h4 className="text-base font-black text-slate-900 uppercase">{caseItem.studentName}</h4>
                    
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                      caseItem.priority === 'CRÍTICA' ? 'bg-red-500 text-white border-red-600 animate-pulse' :
                      caseItem.priority === 'ALTA' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      caseItem.priority === 'MÉDIA' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      Prioridade {caseItem.priority}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                      caseItem.status === 'CONCLUÍDO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      caseItem.status === 'EM_ACOMPANHAMENTO' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      caseItem.status === 'AGUARDANDO_REDE' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                    <strong>Demanda:</strong> {caseItem.initialDemand}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase flex-wrap">
                    <span>Turma: <strong className="text-slate-700">{caseItem.className || 'N/A'}</strong></span>
                    <span>•</span>
                    <span>Sessões: <strong className="text-rose-700">{caseItem.logs?.length || 0} evoluções</strong></span>
                    <span>•</span>
                    <span>Origem: <strong className="text-slate-700">{caseItem.origin}</strong></span>
                    <span>•</span>
                    <span>Abertura: <strong className="text-slate-700">{new Date(caseItem.openedAt).toLocaleDateString('pt-BR')}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCase(caseItem);
                    setTimeout(() => window.print(), 300);
                  }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-slate-900/10"
                  title="Imprimir Prontuário Oficial"
                >
                  <Printer size={14} />
                  <span>Imprimir Prontuário</span>
                </button>

                <button
                  onClick={(e) => handleDeleteCase(caseItem.id, e)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                  title="Excluir Prontuário"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredCases.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <Brain size={48} className="mx-auto mb-3 text-slate-200" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Nenhum prontuário psicossocial encontrado
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE GESTÃO COMPLETA DO CASO PSICOSSOCIAL */}
      {selectedCase && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-5xl h-[94vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            
            {/* Header do Modal */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex justify-between items-center shrink-0 no-print">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg">
                  <Brain size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-white/20 px-2.5 py-0.5 rounded-lg text-rose-300">
                      {selectedCase.caseNumber}
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">{selectedCase.studentName}</h3>
                  </div>
                  <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest mt-0.5">
                    Turma: {selectedCase.className} • Prontuário Técnico Psicossocial Escolar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Printer size={14} /> Imprimir Prontuário
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Navegação de Abas do Caso */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-8 gap-3 pt-3 shrink-0 no-print">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'sessions'
                    ? 'bg-white text-rose-700 border-t-2 border-rose-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Activity size={16} />
                <span>1. Registro de Evoluções & Sessões ({selectedCase.logs?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('steps')}
                className={`px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'steps'
                    ? 'bg-white text-rose-700 border-t-2 border-rose-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>2. Plano Singular de Acompanhamento (Etapas)</span>
              </button>

              <button
                onClick={() => setActiveTab('opinion')}
                className={`px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'opinion'
                    ? 'bg-white text-rose-700 border-t-2 border-rose-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText size={16} />
                <span>3. Parecer Técnico & Orientações Pedagógicas</span>
              </button>
            </div>

            {/* CONTEÚDO DAS ABAS */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar no-print">
              
              {/* ABA 1: REGISTRO DE EVOLUÇÕES & SESSÕES */}
              {activeTab === 'sessions' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                  
                  {/* Histórico Cronológico (Coluna Esquerda - 5 colunas) */}
                  <div className="lg:col-span-5 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <History size={16} className="text-rose-600" />
                        Histórico de Atendimentos Realizados
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        Total: {selectedCase.logs?.length || 0}
                      </span>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                      {selectedCase.logs && selectedCase.logs.length > 0 ? (
                        selectedCase.logs.map((log) => {
                          const cfg = SESSION_TYPE_CONFIG[log.type] || SESSION_TYPE_CONFIG.ESCUTA_INDIVIDUAL_ALUNO;
                          const Icon = cfg.icon;

                          return (
                            <div
                              key={log.id}
                              className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 relative group hover:bg-white hover:border-rose-300 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.color}`}>
                                    <Icon size={14} />
                                  </div>
                                  <span className="text-[10px] font-black uppercase text-slate-900">
                                    {cfg.label}
                                  </span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {new Date(log.date).toLocaleDateString('pt-BR')} {log.time && `• ${log.time}`}
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                {log.summary}
                              </p>

                              {log.immediateActions && (
                                <div className="p-2.5 bg-rose-50/60 border border-rose-100 rounded-xl text-[10px] text-rose-900">
                                  <strong>Encaminhamentos:</strong> {log.immediateActions}
                                </div>
                              )}

                              {log.confidentialNotes && (
                                <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-[10px] text-amber-900 flex items-start gap-1.5">
                                  <Lock size={12} className="text-amber-700 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="block text-amber-800">Nota Sigilosa (CFP/CFESS):</strong>
                                    <span>{log.confidentialNotes}</span>
                                  </div>
                                </div>
                              )}

                              <div className="text-[9px] font-bold text-slate-400 uppercase pt-1 border-t border-slate-100 flex justify-between">
                                <span>Por: {log.professionalName}</span>
                                <span>Partic.: {log.participants}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <Activity size={32} className="mx-auto mb-2 text-slate-300" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Nenhum atendimento registrado ainda
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formulário de Novo Atendimento (Coluna Direita - 7 colunas) */}
                  <div className="lg:col-span-7 bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Plus size={16} className="text-rose-600" />
                        Registrar Nova Evolução / Atendimento Psicossocial
                      </h4>
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full uppercase">
                        Prontuário Ativo
                      </span>
                    </div>

                    <form onSubmit={handleAddSession} className="space-y-4 flex-1 flex flex-col">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                            Tipo de Atendimento / Modalidade:
                          </label>
                          <select
                            value={newSession.type || 'ESCUTA_INDIVIDUAL_ALUNO'}
                            onChange={e => setNewSession(prev => ({ ...prev, type: e.target.value as any }))}
                            className="w-full p-2.5 bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                          >
                            {Object.keys(SESSION_TYPE_CONFIG).map(typeKey => (
                              <option key={typeKey} value={typeKey}>
                                {SESSION_TYPE_CONFIG[typeKey as PsychosocialSessionType].label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                            Data do Atendimento:
                          </label>
                          <input
                            type="date"
                            value={newSession.date || new Date().toLocaleDateString('sv-SE')}
                            onChange={e => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full p-2 bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                          Participantes Presentes:
                        </label>
                        <input
                          type="text"
                          value={newSession.participants || ''}
                          onChange={e => setNewSession(prev => ({ ...prev, participants: e.target.value }))}
                          placeholder={`Ex: Estudante ${selectedCase.studentName}, Mãe, Professora de Língua Portuguesa...`}
                          className="w-full p-2.5 bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div className="flex-1 flex flex-col">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                          Síntese Técnica da Escuta & Relato do Atendimento:
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={newSession.summary || ''}
                          onChange={e => setNewSession(prev => ({ ...prev, summary: e.target.value }))}
                          placeholder="Descreva a escuta realizada, estado emocional observado, relatos do estudante/família e combinados estabelecidos..."
                          className="w-full p-3 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 flex-1 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                          Encaminhamentos Imediatos / Ações Acordadas:
                        </label>
                        <input
                          type="text"
                          value={newSession.immediateActions || ''}
                          onChange={e => setNewSession(prev => ({ ...prev, immediateActions: e.target.value }))}
                          placeholder="Ex: Agendamento de escuta familiar para sexta-feira, orientação ao professor sobre crise de ansiedade..."
                          className="w-full p-2.5 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                          <Lock size={12} /> Notas Sigilosas Reservadas (Protegidas por Sigilo Profissional CFP/CFESS):
                        </label>
                        <input
                          type="text"
                          value={newSession.confidentialNotes || ''}
                          onChange={e => setNewSession(prev => ({ ...prev, confidentialNotes: e.target.value }))}
                          placeholder="Anotações clínicas/sociais restritas à equipe psicossocial (não constarão em relatórios abertos aos docentes)..."
                          className="w-full p-2 bg-amber-50/50 border border-amber-200 text-slate-900 text-xs font-medium rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Save size={16} /> Salvar Atendimento no Prontuário
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ABA 2: PLANO SINGULAR DE ACOMPANHAMENTO (ETAPAS) */}
              {activeTab === 'steps' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                          <CheckCircle2 size={20} className="text-rose-600" />
                          Plano Singular de Acompanhamento Psicossocial
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Fluxo técnico oficial de atendimento discente em conformidade com as diretrizes da SEDUC/MT.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const stepName = window.prompt("Digite o nome da nova etapa técnica ou ação intersetorial:");
                          if (!stepName || !stepName.trim()) return;

                          const newStep: PsychosocialProcessStep = {
                            id: `custom-step-${Date.now()}`,
                            label: stepName.trim(),
                            completed: false
                          };

                          const updatedSteps = [...(selectedCase.steps || []), newStep];
                          try {
                            await supabase
                              .from('psychosocial_cases')
                              .update({ steps: updatedSteps })
                              .eq('id', selectedCase.id);

                            const updatedCase = { ...selectedCase, steps: updatedSteps };
                            const updatedList = cases.map(c => c.id === selectedCase.id ? updatedCase : c);
                            setCases(updatedList);
                            localStorage.setItem('psychosocial_cases_v2026', JSON.stringify(updatedList));
                            setSelectedCase(updatedCase);
                          } catch (err: any) {
                            alert("Erro ao adicionar etapa: " + err.message);
                          }
                        }}
                        className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus size={14} /> Adicionar Etapa Customizada
                      </button>
                    </div>

                    <div className="space-y-3">
                      {selectedCase.steps && selectedCase.steps.map((step, idx) => (
                        <div
                          key={step.id}
                          className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                            step.completed
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              step.completed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {step.completed ? <Check size={16} /> : idx + 1}
                            </div>
                            <div>
                              <p className={`text-xs font-black uppercase ${step.completed ? 'text-emerald-900' : 'text-slate-900'}`}>
                                {step.label}
                              </p>
                              {step.date && (
                                <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                                  Concluído em: {new Date(step.date).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleStep(idx)}
                              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                step.completed
                                  ? 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-50'
                                  : 'bg-slate-900 hover:bg-rose-600 text-white shadow-md'
                              }`}
                            >
                              {step.completed ? (
                                <>
                                  <RotateCcw size={13} /> Desfazer
                                </>
                              ) : (
                                <>
                                  <Check size={13} /> Concluir Etapa
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: PARECER TÉCNICO & ORIENTAÇÕES PEDAGÓGICAS */}
              {activeTab === 'opinion' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div>
                      <h4 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <FileText size={20} className="text-rose-600" />
                        Parecer Técnico Psicossocial & Orientações Pedagógicas
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Síntese conclusiva e diretrizes de acolhimento em sala de aula para docentes e equipe gestora.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                          1. Parecer Técnico Conclusivo da Equipe Multiprofissional:
                        </label>
                        <textarea
                          rows={6}
                          value={selectedCase.technicalOpinion || ''}
                          onChange={e => setSelectedCase({ ...selectedCase, technicalOpinion: e.target.value })}
                          placeholder="Apresente a avaliação técnica fundamentada da situação do estudante, avanços observados e encaminhamentos consolidados..."
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                          2. Orientações Pedagógicas para os Professores e Sala de Aula:
                        </label>
                        <textarea
                          rows={4}
                          value={selectedCase.schoolRecommendations || ''}
                          onChange={e => setSelectedCase({ ...selectedCase, schoolRecommendations: e.target.value })}
                          placeholder="Diretrizes práticas sem quebra de sigilo ético (ex: estratégias de inclusão, manejo de momentos de ansiedade, apoio socioemocional em grupo)..."
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all leading-relaxed"
                        />
                      </div>

                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 flex items-center gap-3">
                        <Lock size={20} className="text-rose-600 shrink-0" />
                        <span>
                          <strong>Garantia de Sigilo Profissional:</strong> As orientações registradas neste campo são sincronizadas com o corpo docente preservando a intimidade e a dignidade do estudante (Art. 9º Código de Ética do Psicólogo e CFESS).
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={handleCloseCase}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                      >
                        <CheckCircle2 size={16} /> Finalizar Acompanhamento
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveOpinion}
                        className="px-6 py-3 bg-slate-900 hover:bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
                      >
                        <Save size={16} /> Salvar Parecer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ABERTURA DE NOVO CASO / ACOLHIMENTO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg">
                  <Brain size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Novo Acolhimento & Prontuário Psicossocial</h3>
                  <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest">Escuta Especializada • SEDUC/MT</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-xl">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={handleCreateCase} className="space-y-6">
                
                {/* IDENTIFICAÇÃO DO ALUNO */}
                <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-200">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    1. Identificação do Discente Matriculado
                  </label>

                  {newCaseForm.studentName ? (
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-rose-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center font-black">
                          {newCaseForm.studentName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-slate-900">{newCaseForm.studentName}</p>
                          <p className="text-[10px] text-rose-600 font-bold uppercase">Turma: {newCaseForm.className || 'Não Informada'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewCaseForm(prev => ({ ...prev, studentName: '', studentId: '', className: '', guardianName: '', guardianPhone: '', guardianAddress: '' }))}
                        className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        placeholder="Buscar aluno cadastrado na escola para auto-preenchimento..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                      />
                      {filteredStudents.length > 0 && (
                        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 divide-y divide-slate-100 overflow-hidden">
                          {filteredStudents.map((s: any) => (
                            <button
                              key={s.CodigoAluno || s.id}
                              type="button"
                              onClick={() => handleSelectStudent(s)}
                              className="w-full text-left p-3 hover:bg-rose-50 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-xs font-black uppercase text-slate-900">{s.Nome || s.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{s.Turma || s.className}</p>
                              </div>
                              <span className="text-[10px] font-black text-rose-600 uppercase">+ Selecionar</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Responsável Legal</label>
                      <input
                        type="text"
                        value={newCaseForm.guardianName || ''}
                        onChange={e => setNewCaseForm(prev => ({ ...prev, guardianName: e.target.value }))}
                        placeholder="Mãe / Pai / Guardião"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Telefone Contato</label>
                      <input
                        type="text"
                        value={newCaseForm.guardianPhone || ''}
                        onChange={e => setNewCaseForm(prev => ({ ...prev, guardianPhone: e.target.value }))}
                        placeholder="(66) 99999-9999"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Endereço</label>
                      <input
                        type="text"
                        value={newCaseForm.guardianAddress || ''}
                        onChange={e => setNewCaseForm(prev => ({ ...prev, guardianAddress: e.target.value }))}
                        placeholder="Rua, Número, Bairro"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* TIPO DE DEMANDA E ORIGEM */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      2. Tipo de Demanda Principal:
                    </label>
                    <select
                      value={newCaseForm.demandType || 'SAUDE_MENTAL'}
                      onChange={e => setNewCaseForm(prev => ({ ...prev, demandType: e.target.value as any }))}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase outline-none cursor-pointer"
                    >
                      {Object.keys(DEMAND_TYPE_LABELS).map(dKey => (
                        <option key={dKey} value={dKey}>{DEMAND_TYPE_LABELS[dKey]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      3. Nível de Prioridade:
                    </label>
                    <select
                      value={newCaseForm.priority || 'MÉDIA'}
                      onChange={e => setNewCaseForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase outline-none cursor-pointer"
                    >
                      <option value="BAIXA">Baixa (Acompanhamento Preventivo)</option>
                      <option value="MÉDIA">Média (Acolhimento Regular)</option>
                      <option value="ALTA">Alta (Risco Moderado)</option>
                      <option value="CRÍTICA">🚨 Crítica (Ideação / Risco Iminente)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      4. Origem do Encaminhamento:
                    </label>
                    <select
                      value={newCaseForm.origin || 'TRIAGEM_MEDIACAO'}
                      onChange={e => setNewCaseForm(prev => ({ ...prev, origin: e.target.value as any }))}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase outline-none cursor-pointer"
                    >
                      <option value="TRIAGEM_MEDIACAO">Triagem da Mediação Escolar</option>
                      <option value="GESTAO_ESCOLAR">Gestão Escolar / Coordenação</option>
                      <option value="BUSCA_ATIVA">Busca Ativa Escolar</option>
                      <option value="DEMANDA_ESPONTANEA">Demanda Espontânea / Aluno</option>
                    </select>
                  </div>
                </div>

                {/* DESCRIÇÃO DA DEMANDA INICIAL */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    5. Queixa Inicial / Demanda Identificada para o Acolhimento:
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newCaseForm.initialDemand || ''}
                    onChange={e => setNewCaseForm(prev => ({ ...prev, initialDemand: e.target.value }))}
                    placeholder="Descreva a queixa que motivou o acolhimento psicossocial, sinais de alerta observados e objetivos do acompanhamento..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Abrir Prontuário & Iniciar Acompanhamento
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTO OFICIAL PARA IMPRESSÃO (PRINT ONLY) */}
      {selectedCase && (
        <div className="hidden print:block print-document bg-white text-slate-900 p-8 space-y-6">
          {/* CABEÇALHO OFICIAL SEDUC/MT */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <div className="flex justify-center items-center gap-6 mb-2">
              <img src="/brasao_mt.png" alt="MT" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              <img src="/logo-escola-oficial.png" alt="Escola" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Governo do Estado de Mato Grosso</h2>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Secretaria de Estado de Educação — SEDUC/MT</h3>
            <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">E.E. Cívico-Militar André Antônio Maggi</h4>
            <p className="text-[10px] text-slate-600">Núcleo Multidisciplinar de Apoio Psicossocial e Proteção Discente</p>
          </div>

          <div className="text-center my-3">
            <h2 className="text-base font-black uppercase text-slate-900 tracking-wider">
              PRONTUÁRIO TÉCNICO & RELATÓRIO DE EVOLUÇÃO PSICOSSOCIAL
            </h2>
            <p className="text-xs font-mono font-bold text-slate-600">{selectedCase.caseNumber}</p>
          </div>

          {/* DADOS DO ESTUDANTE */}
          <div className="border border-slate-400 p-4 rounded-xl text-xs space-y-2">
            <p><strong>Estudante:</strong> <span className="uppercase">{selectedCase.studentName}</span></p>
            <div className="grid grid-cols-2 gap-4">
              <p><strong>Turma:</strong> <span className="uppercase">{selectedCase.className}</span></p>
              <p><strong>Status:</strong> <span className="uppercase font-bold">{selectedCase.status}</span></p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <p><strong>Responsável:</strong> <span className="uppercase">{selectedCase.guardianName || 'Não Informado'}</span></p>
              <p><strong>Contato:</strong> <span>{selectedCase.guardianPhone || 'Não Informado'}</span></p>
            </div>
            <p><strong>Demanda Inicial:</strong> {selectedCase.initialDemand}</p>
          </div>

          {/* HISTÓRICO DE SESSÕES */}
          <div className="space-y-2">
            <h5 className="font-black uppercase text-xs text-slate-900 border-b border-slate-300 pb-1">
              1. Registro de Evoluções e Atendimentos Realizados:
            </h5>
            <div className="space-y-3">
              {selectedCase.logs && selectedCase.logs.map((log, idx) => (
                <div key={log.id} className="p-3 border border-slate-300 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Sessão #{idx + 1} — {log.type}</span>
                    <span>{new Date(log.date).toLocaleDateString('pt-BR')} {log.time}</span>
                  </div>
                  <p><strong>Participantes:</strong> {log.participants}</p>
                  <p><strong>Síntese:</strong> {log.summary}</p>
                  {log.immediateActions && <p><strong>Encaminhamentos:</strong> {log.immediateActions}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* PARECER TÉCNICO FINAL */}
          {selectedCase.technicalOpinion && (
            <div className="space-y-1">
              <h5 className="font-black uppercase text-xs text-slate-900 border-b border-slate-300 pb-1">
                2. Parecer Técnico Psicossocial Conclusivo:
              </h5>
              <p className="p-3 border border-slate-300 rounded-lg text-xs leading-relaxed text-justify">
                {selectedCase.technicalOpinion}
              </p>
            </div>
          )}

          {/* ORIENTAÇÕES PEDAGÓGICAS */}
          {selectedCase.schoolRecommendations && (
            <div className="space-y-1">
              <h5 className="font-black uppercase text-xs text-slate-900 border-b border-slate-300 pb-1">
                3. Orientações Pedagógicas para o Corpo Docente:
              </h5>
              <p className="p-3 border border-slate-300 rounded-lg text-xs leading-relaxed text-justify">
                {selectedCase.schoolRecommendations}
              </p>
            </div>
          )}

          {/* ASSINATURAS */}
          <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
            <div className="border-t border-slate-900 pt-2 space-y-0.5">
              <p className="font-black uppercase text-slate-900">{selectedCase.professionalInCharge || 'TÉCNICO PSICOSSOCIAL'}</p>
              <p className="text-[10px] text-slate-600 uppercase font-bold">Psicólogo(a) / Assistente Social</p>
              <p className="text-[9px] text-slate-500 uppercase">Equipe Multidisciplinar Escolar</p>
            </div>
            <div className="border-t border-slate-900 pt-2 space-y-0.5">
              <p className="font-black uppercase text-slate-900">REZIERE DE SOUZA</p>
              <p className="text-[10px] text-slate-600 uppercase font-bold">Diretor Escolar</p>
              <p className="text-[9px] text-slate-500 uppercase">E.E. Cívico-Militar André Antônio Maggi</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychosocialCaseManager;
