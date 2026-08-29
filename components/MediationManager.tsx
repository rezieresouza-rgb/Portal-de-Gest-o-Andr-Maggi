import React, { useState, useEffect, useMemo } from 'react';
import { useStudents } from '../hooks/useStudents';
import { 
  Scale, 
  Plus, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  MessageSquare as MessageSquareIcon, 
  MessageCircle,
  User, 
  X,
  AlertTriangle,
  History,
  FileText,
  Target,
  Users,
  ShieldAlert,
  Save,
  UserPlus,
  PlusCircle,
  Trash2,
  ShieldCheck,
  RotateCcw,
  Pencil,
  Check,
  UserCheck,
  HeartHandshake,
  BookOpen,
  FileCheck,
  Send,
  Sparkles,
  ChevronDown,
  Printer,
  Calendar,
  CalendarDays
} from 'lucide-react';
import { MediationCase, MediationStatus, CaseSeverity, PsychosocialRole, Student } from '../types';
import { supabase } from '../supabaseClient';
import MediationRestorativeGuideModal from './MediationRestorativeGuideModal';
import MediationAgreementTermModal from './MediationAgreementTermModal';
import MediationAttendanceReportModal from './MediationAttendanceReportModal';

interface MediationManagerProps {
  user?: any;
  role: PsychosocialRole;
  onTabChange?: (tab: string) => void;
  initialSearch?: string;
  onOpenAtaForCase?: (c: MediationCase) => void;
}

const CASE_TYPES = [
  'CONFLITO',
  'BULLYING',
  'FAMILIAR',
  'INFREQUÊNCIA',
  'EMOCIONAL',
  'DISCIPLINAR',
  'CELULAR',
  'DISCRIMINAÇÃO',
  'OUTRO'
];

const ATTENDANCE_CATEGORIES = [
  { id: 'BULLYING', label: 'Bullying / Cyberbullying', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'FAMILIAR', label: 'Questão Familiar / Guarda', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'INFREQUÊNCIA', label: 'Infrequência / Busca Ativa', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'CONFLITO', label: 'Conflito entre Colegas', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'EMOCIONAL', label: 'Acolhimento Emocional', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'DISCIPLINAR', label: 'Indisciplina / Regras', color: 'bg-slate-200 text-slate-800 border-slate-300' },
  { id: 'RESPONSÁVEIS', label: 'Atendimento aos Pais', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  { id: 'PALESTRA', label: 'Palestra / Ação Coletiva', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'CELULAR', label: 'Celular / Redes Sociais', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { id: 'OUTRO', label: 'Outro / Geral', color: 'bg-gray-100 text-gray-800 border-gray-300' }
];

const SEVERITIES: CaseSeverity[] = ['BAIXA', 'MÉDIA', 'ALTA', 'CRÍTICA'];

const formatLocalDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const cleanStr = dateStr.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      if (y && m && d) {
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
  }

  try {
    const parseable = dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr;
    return new Date(parseable).toLocaleDateString('pt-BR');
  } catch (e) {
    return dateStr;
  }
};

const MediationManager: React.FC<MediationManagerProps> = ({ user, role, onTabChange, initialSearch, onOpenAtaForCase }) => {
  const { students: dbStudents } = useStudents();
  const [cases, setCases] = useState<MediationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<MediationCase | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [studentSearch, setStudentSearch] = useState('');

  // Novos Modais Integrados de Mediação Restaurativa
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isAgreementTermModalOpen, setIsAgreementTermModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeCaseTab, setActiveCaseTab] = useState<'timeline' | 'steps' | 'resolution'>('timeline');
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  
  const [newCase, setNewCase] = useState<Partial<MediationCase> & { originType?: string }>({
    type: 'CONFLITO',
    severity: 'MÉDIA',
    description: '',
    involvedParties: [],
    studentName: '',
    className: '',
    originType: 'Demanda Espontânea (Aluno)'
  });
  const [activeTab, setActiveTab] = useState<'ativos' | 'historico'>('ativos');

  // Automatic professional title resolution based on user login/name
  const defaultProfessionalTitle = useMemo(() => {
    const userNameUpper = (user?.name || '').toUpperCase();
    const userLogin = user?.login || '';

    if (userNameUpper.includes('DANUBIA') || userLogin.includes('35636524811') || role === 'MEDIAÇÃO' || role === 'MEDIACAO') {
      return 'MEDIAÇÃO';
    }
    if (userNameUpper.includes('RAFAEL') || userNameUpper.includes('ANAIARA')) {
      return 'EQUIPE PSICOSSOCIAL';
    }
    return role === 'PSICOSSOCIAL' ? 'EQUIPE PSICOSSOCIAL' : 'MEDIAÇÃO';
  }, [user, role]);

  // [NOVO] Estados para o Diário de Atendimento
  const [newLog, setNewLog] = useState({
    professional: defaultProfessionalTitle,
    content: '',
    category: 'CONFLITO',
    date: new Date().toLocaleDateString('sv-SE')
  });

  useEffect(() => {
    setNewLog(prev => ({
      ...prev,
      professional: defaultProfessionalTitle
    }));
  }, [defaultProfessionalTitle]);
  const [isLogLoading, setIsLogLoading] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogContent, setEditingLogContent] = useState<string>('');

  const handleSendFeedbackToRequester = async (c: MediationCase) => {
    const defaultMsg = `O caso do estudante ${c.studentName} (${c.className}) foi acolhido pela Mediação Escolar. Foi realizada escuta e pactuado compromisso de convivência.`;
    const feedbackText = window.prompt(
      `Digite o parecer da devolutiva institucional para ${c.teacherName || 'o solicitante'}:`,
      defaultMsg
    );
    if (!feedbackText || !feedbackText.trim()) return;

    try {
      const todayDate = new Date().toISOString().split('T')[0];
      await supabase.from('psychosocial_notifications').insert([{
        title: `Devolutiva da Mediação Escolar: ${c.studentName}`,
        message: `Para: ${c.teacherName || 'Solicitante'}\nEstudante: ${c.studentName} (${c.className})\nParecer: ${feedbackText.trim()}`,
        date: todayDate,
        read: false
      }]);

      const logEntry = {
        id: `log-${Date.now()}`,
        date: todayDate,
        professional: defaultProfessionalTitle,
        content: `[DEVOLUTIVA INSTITUCIONAL ENVIADA] Destinatário: ${c.teacherName || 'Solicitante'}. Parecer: "${feedbackText.trim()}"`
      };

      const updatedLogs = [logEntry, ...(c.logs || [])];
      await supabase
        .from('mediation_cases')
        .update({ logs: updatedLogs, feedback: feedbackText.trim() })
        .eq('id', c.id);

      setSelectedCase(prev => prev ? { ...prev, logs: updatedLogs, feedback: feedbackText.trim() } : null);
      await fetchCases();
      alert(`Devolutiva enviada com sucesso para ${c.teacherName || 'a equipe solicitante'}!`);
    } catch (err: any) {
      console.error('Erro ao enviar devolutiva:', err);
      alert('Erro ao enviar devolutiva: ' + err.message);
    }
  };

  const masterStudents = useMemo(() => {
    return dbStudents.map(s => ({
      ...s,
      Nome: s.name,
      CodigoAluno: s.registration_number,
      Turma: s.class
    }));
  }, [dbStudents]);

  const filteredStudents = useMemo(() => {
    if (studentSearch.length < 3) return [];
    return masterStudents.filter((s: any) => 
      (s.Nome || s.name || '').toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 5);
  }, [studentSearch, masterStudents]);

  const [isTriaging, setIsTriaging] = useState(false);

  const handleTogglePsychosocialTriage = async (c: MediationCase) => {
    if (!c.id) return;
    const isCurrentlyTriaged = c.description?.includes('[TRIAGEM P/ PSICOSSOCIAL');

    if (isCurrentlyTriaged) {
      if (!window.confirm(`Este caso de "${c.studentName}" já foi encaminhado para a Psicossocial.\n\nDeseja CANCELAR este encaminhamento e remover o caso da fila da Equipe Psicossocial?`)) return;

      setIsTriaging(true);
      try {
        // 1. Remover da tabela psychosocial_referrals
        await supabase
          .from('psychosocial_referrals')
          .delete()
          .or(`origin_case_id.eq.${c.id},and(student_name.ilike.${c.studentName.trim()},teacher_name.ilike.%MEDIAÇÃO%)`);

        // 2. Limpar a tag da descrição
        const cleanDescription = (c.description || '').replace(/\n?\[TRIAGEM P\/ PSICOSSOCIAL[^\]]*\][^\n]*/gi, '').trim();

        // 3. Registrar log de cancelamento no diário
        const cancelLog = {
          id: `log-${Date.now()}`,
          date: new Date().toISOString(),
          professional: user?.name ? `${user.name} (Mediador)` : 'Mediação Escolar',
          content: 'Encaminhamento para a Equipe Psicossocial foi CANCELADO pelo mediador.'
        };
        const updatedLogs = [cancelLog, ...(c.logs || [])];

        const { error } = await supabase
          .from('mediation_cases')
          .update({ 
            description: cleanDescription,
            logs: updatedLogs
          })
          .eq('id', c.id);

        if (error) throw error;

        setSelectedCase(prev => prev ? { ...prev, description: cleanDescription, logs: updatedLogs } : null);
        alert(`O encaminhamento de "${c.studentName}" para a Psicossocial foi CANCELADO com sucesso!`);
        await fetchCases();
      } catch (err: any) {
        console.error('Erro ao cancelar triagem:', err);
        alert('Erro ao cancelar encaminhamento: ' + err.message);
      } finally {
        setIsTriaging(false);
      }
      return;
    }

    // Caso NÃO esteja triado: realizar o encaminhamento
    if (!window.confirm(`Deseja encaminhar o caso de "${c.studentName}" para triagem e acompanhamento da Equipe Psicossocial?`)) return;

    setIsTriaging(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const triageTag = `\n[TRIAGEM P/ PSICOSSOCIAL em ${new Date().toLocaleDateString('pt-BR')}] Encaminhado por: ${user?.name || 'PROFESSOR MEDIADOR'}`;

      // 1. Inserir em psychosocial_referrals
      const { error: refErr } = await supabase
        .from('psychosocial_referrals')
        .insert([{
          student_name: c.studentName,
          class_name: c.className,
          reason: `[TRIAGEM DA MEDIAÇÃO] ${c.description || 'Encaminhamento para avaliação técnica.'}`,
          priority: c.severity === 'CRÍTICA' ? 'CRÍTICA' : c.severity === 'ALTA' ? 'ALTA' : 'MEDIA',
          status: 'AGUARDANDO',
          teacher_name: `MEDIAÇÃO (${user?.name || 'MEDIADOR'})`,
          report: `[TRIADO VIA MEDIAÇÃO] Estudante necessita de acolhimento e avaliação técnica da Equipe Psicossocial.`,
          date: todayDate,
          origin_case_id: c.id
        }]);

      if (refErr) console.warn('Aviso ao inserir em psychosocial_referrals:', refErr.message);

      // 2. Inserir notificação
      await supabase
        .from('psychosocial_notifications')
        .insert([{
          title: 'Nova Triagem da Mediação Escolar',
          message: `A Mediação triou o estudante ${c.studentName} (${c.className}) para atendimento psicossocial.`,
          date: todayDate,
          read: false
        }]);

      // 3. Atualizar etapa de encaminhamento
      const updatedSteps = (c.steps || []).map(s => {
        if (s.label?.toLowerCase().includes('encaminhamento')) {
          return { ...s, completed: true, date: todayDate };
        }
        return s;
      });

      // 4. Registrar log na timeline
      const triageLog = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString(),
        professional: user?.name ? `${user.name} (Mediador)` : 'Mediação Escolar',
        content: 'Caso triado e ENCAMINHADO para acompanhamento da Equipe Psicossocial.'
      };
      const updatedLogs = [triageLog, ...(c.logs || [])];

      // 5. Atualizar descrição e caso na Mediação
      const updatedDescription = `${c.description || ''}${triageTag}`;
      const { error: caseErr } = await supabase
        .from('mediation_cases')
        .update({ 
          description: updatedDescription,
          steps: updatedSteps,
          logs: updatedLogs
        })
        .eq('id', c.id);

      if (caseErr) throw caseErr;

      setSelectedCase(prev => prev ? { ...prev, description: updatedDescription, steps: updatedSteps, logs: updatedLogs } : null);
      alert(`O caso de "${c.studentName}" foi encaminhado com sucesso para a Equipe Psicossocial!`);
      await fetchCases();
    } catch (err: any) {
      console.error('Erro ao realizar triagem p/ Psicossocial:', err);
      alert('Erro ao encaminhar para a Psicossocial: ' + (err.message || 'Verifique sua conexão.'));
    } finally {
      setIsTriaging(false);
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mediation_cases')
        .select('*');

      if (error) throw error;
      
      // Buscar encaminhamentos psicossociais em paralelo para capturar teacher_name se houver vínculo
      let referralsMap: Record<string, string> = {};
      try {
        const { data: refData } = await supabase
          .from('psychosocial_referrals')
          .select('id, teacher_name, student_name');
        if (refData) {
          refData.forEach((r: any) => {
            if (r.id && r.teacher_name) referralsMap[r.id] = r.teacher_name;
            if (r.student_name && r.teacher_name && !referralsMap[r.student_name.trim().toUpperCase()]) {
              referralsMap[r.student_name.trim().toUpperCase()] = r.teacher_name;
            }
          });
        }
      } catch (e) {
        console.warn('Aviso ao carregar referências psicossociais:', e);
      }

      // Ordenação em memória para maior robustez
      const sortedData = [...(data || [])].sort((a, b) => {
        const dateA = a.created_at || a.opened_at || a.id || '';
        const dateB = b.created_at || b.opened_at || b.id || '';
        return dateB.localeCompare(dateA);
      });

      const formatted: MediationCase[] = sortedData.map(c => {
        const existingSteps = c.steps || [];
        const baseSteps = [
          { id: 'A', key: 'acolhimento', label: 'Acolhimento Inicial', completed: true, date: c.opened_at },
          { id: 'B', key: 'escuta', label: 'Escuta das Partes', completed: false },
          { id: 'C', key: 'comunicacao', label: 'Comunicação com Pais e/ou Responsáveis', completed: false },
          { id: 'D', key: 'reuniao', label: 'Reunião com os Responsáveis', completed: false },
          { id: 'E', key: 'circulo', label: 'Círculo de Mediação / Paz', completed: false },
          { id: 'F', key: 'palestra', label: 'Palestra Educativa / Ação de Conscientização', completed: false },
          { id: 'G', key: 'encaminhamento', label: 'Encaminhamento à Rede / Apoio', completed: false },
          { id: 'H', key: 'acordo', label: 'Acordo / Finalização', completed: false }
        ];

        const matchBaseKey = (labelStr: string) => {
          const l = (labelStr || '').toLowerCase();
          if (l.includes('acolhimento')) return 'acolhimento';
          if (l.includes('escuta')) return 'escuta';
          if (l.includes('comunicação') || l.includes('comunicacao')) return 'comunicacao';
          if (l.includes('reunião') || l.includes('reuniao')) return 'reuniao';
          if (l.includes('círculo') || l.includes('circulo')) return 'circulo';
          if (l.includes('palestra')) return 'palestra';
          if (l.includes('encaminhamento')) return 'encaminhamento';
          if (l.includes('acordo') || l.includes('finalização') || l.includes('finalizacao')) return 'acordo';
          return null;
        };

        const mergedSteps = baseSteps.map(baseStep => {
          const existing = existingSteps.find((s: any) => matchBaseKey(s.label) === baseStep.key);
          if (existing) {
            return {
              id: baseStep.id,
              label: baseStep.label,
              completed: !!existing.completed,
              date: existing.date || (baseStep.key === 'acolhimento' ? c.opened_at : undefined)
            };
          }
          return {
            id: baseStep.id,
            label: baseStep.label,
            completed: baseStep.key === 'acolhimento',
            date: baseStep.key === 'acolhimento' ? c.opened_at : undefined
          };
        });

        // Preservar apenas etapas verdadeiramente personalizadas (sem duplicatas)
        existingSteps.forEach((s: any) => {
          const baseKey = matchBaseKey(s.label);
          if (!baseKey && !mergedSteps.some(m => m.label?.toLowerCase() === s.label?.toLowerCase())) {
            mergedSteps.push(s);
          }
        });

        // Tentar resolver o nome do professor/solicitante
        let resolvedTeacherName = c.teacher_name || c.created_by || c.referred_by || '';
        if (!resolvedTeacherName && (c.description?.includes('[ENCAMINHAMENTO BUSCA ATIVA]') || c.description?.includes('[VIA BUSCA ATIVA]') || c.description?.includes('Busca Ativa'))) {
          resolvedTeacherName = 'BUSCA ATIVA ESCOLAR';
        }
        if (!resolvedTeacherName && c.origin_referral_id && referralsMap[c.origin_referral_id]) {
          resolvedTeacherName = referralsMap[c.origin_referral_id];
        }
        if (!resolvedTeacherName && c.student_name && referralsMap[c.student_name.trim().toUpperCase()]) {
          resolvedTeacherName = referralsMap[c.student_name.trim().toUpperCase()];
        }
        if (!resolvedTeacherName && c.description) {
          const match = c.description.match(/\[(?:Enviado por|Encaminhado por|Professor|Solicitante):\s*([^\]]+)\]/i);
          if (match && match[1]) resolvedTeacherName = match[1].trim();
        }
        if (!resolvedTeacherName && c.involved_parties && c.involved_parties.length > 0 && c.involved_parties[0] && c.involved_parties[0] !== 'EQUIPE MULTI') {
          resolvedTeacherName = c.involved_parties[0];
        }

        return {
          id: c.id,
          studentId: c.student_id,
          studentName: c.student_name || 'Estudante não identificado',
          className: c.class_name || 'N/A',
          type: c.type || 'OUTRO',
          severity: c.severity || 'MÉDIA',
          status: (c.status as MediationStatus) || 'ABERTURA',
          openedAt: c.opened_at,
          closedAt: c.closed_at,
          description: c.description || '',
          involvedParties: c.involved_parties || [],
          steps: mergedSteps,
          originReferralId: c.origin_referral_id,
          feedback: c?.feedback,
          logs: c.logs || [],
          teacherName: resolvedTeacherName || undefined
        };
      });
      setCases(formatted);
    } catch (error: any) {
      console.error("Erro ao buscar casos de mediação:", error);
      alert("Aviso: Não foi possível carregar o histórico. " + (error.message || "Erro de conexão"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const migrateLegacyData = async () => {
      const legacy = localStorage.getItem('mediation_cases');
      if (legacy) {
        try {
           const parsed = JSON.parse(legacy);
           if (Array.isArray(parsed) && parsed.length > 0) {
              console.log('Migrando dados legais do localStorage para o Supabase...');
              for (const c of parsed) {
                 await supabase.from('mediation_cases').insert([{
                    student_id: c.studentId || null,
                    student_name: c.studentName,
                    class_name: c.className,
                    type: c.type,
                    severity: c.severity,
                    status: c.status,
                    opened_at: c.openedAt,
                    description: c.description,
                    involved_parties: c.involved_parties || [],
                    steps: c.steps,
                 }]);
              }
              localStorage.removeItem('mediation_cases');
              console.log('Migração concluída.');
              await fetchCases();
           }
        } catch (e) {
           console.error('Erro na migração:', e);
        }
      }
    };

    fetchCases();
    migrateLegacyData();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCase.studentName || !newCase.description) {
       return alert("Por favor, selecione um aluno e descreva o relato do fato.");
    }

    const steps = [
      { id: 'A', label: 'Acolhimento Inicial', completed: true, date: new Date().toLocaleDateString('sv-SE') },
      { id: 'B', label: 'Escuta das Partes', completed: false },
      { id: 'C', label: 'Comunicação com Pais e/ou Responsáveis', completed: false },
      { id: 'D', label: 'Reunião com os Responsáveis', completed: false },
      { id: 'E', label: 'Círculo de Mediação / Paz', completed: false },
      { id: 'F', label: 'Palestra Educativa / Ação de Conscientização', completed: false },
      { id: 'G', label: 'Encaminhamento à Rede / Apoio', completed: false },
      { id: 'H', label: 'Acordo / Finalização', completed: false }
    ];

    try {
      const activeUserName = user?.name || 'PROFESSOR / SOLICITANTE';
      const originPrefix = newCase.originType ? `[Origem: ${newCase.originType}] [Enviado por: ${activeUserName}] ` : `[Origem: Demanda Espontânea (Aluno)] [Enviado por: ${activeUserName}] `;

      const payload = {
        student_id: newCase.studentId && newCase.studentId !== 'N/A' ? newCase.studentId : null,
        student_name: newCase.studentName,
        class_name: newCase.className,
        type: newCase.type,
        severity: newCase.severity,
        status: 'ABERTURA',
        opened_at: new Date().toLocaleDateString('sv-SE'),
        description: originPrefix + newCase.description,
        involved_parties: newCase.involvedParties || [activeUserName],
        steps: steps
      };

      const { data, error } = await supabase
        .from('mediation_cases')
        .insert([payload])
        .select();

      if (error) {
        console.error("Erro retornado pelo Supabase (Insert):", error);
        throw error;
      }

      console.log('Caso salvo com sucesso:', data);
      await fetchCases();
      setIsModalOpen(false);
      setNewCase({ type: 'CONFLITO', severity: 'MÉDIA', description: '', involvedParties: [], studentName: '', className: '', originType: 'Demanda Espontânea (Aluno)' });
      setStudentSearch('');
      alert("Novo caso de mediação aberto e registrado no histórico!");
    } catch (error: any) {
      console.error("Erro fatal ao salvar caso:", error);
      alert("❌ Erro ao salvar o caso: " + (error.message || error.details || "Verifique sua conexão ou se as colunas da tabela estão corretas."));
    }
  };

  const handleDeleteCase = async (e: React.MouseEvent, id: string) => {
    if (e) e.stopPropagation();
    if (!window.confirm("⚠️ Você tem certeza que deseja excluir este caso permanentemente? Esta ação não pode ser desfeita.")) return;
    
    try {
      const { error } = await supabase
        .from('mediation_cases')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      alert("✅ Caso excluído com sucesso!");
      await fetchCases();
      if (selectedCase?.id === id) setSelectedCase(null);
    } catch (err: any) {
      console.error("Erro ao excluir caso:", err);
      alert("❌ Erro ao excluir o caso: " + (err.message || "Erro de conexão"));
    }
  };

  const handleSaveLog = async () => {
    if (!selectedCase || !newLog.content) return alert("Descreva o atendimento antes de salvar.");
    
    setIsLogLoading(true);
    try {
      const logEntry: any = {
        id: `log-${Date.now()}`,
        date: newLog.date || new Date().toLocaleDateString('sv-SE'),
        professional: user?.name ? `${user.name} (Mediador)` : 'Mediação Escolar',
        content: newLog.content.trim(),
        category: newLog.category || 'CONFLITO'
      };

      const updatedLogs = [logEntry, ...(selectedCase.logs || [])];

      const { error } = await supabase
        .from('mediation_cases')
        .update({ logs: updatedLogs })
        .eq('id', selectedCase.id);

      if (error) throw error;

      setSelectedCase({ ...selectedCase, logs: updatedLogs });
      setNewLog({ ...newLog, content: '', category: 'CONFLITO' });
      await fetchCases();
      alert("Atendimento registrado no diário com sucesso!");
      setActiveCaseTab('timeline');
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar log: " + err.message);
    } finally {
      setIsLogLoading(false);
    }
  };

  const handleUpdateLog = async (logId: string) => {
    if (!selectedCase || !editingLogContent.trim()) return;
    setIsLogLoading(true);
    try {
      const updatedLogs = (selectedCase.logs || []).map(l => {
        const currentId = l.id || `log-${l.date}`;
        return currentId === logId ? { ...l, content: editingLogContent.trim() } : l;
      });

      const { error } = await supabase
        .from('mediation_cases')
        .update({ logs: updatedLogs })
        .eq('id', selectedCase.id);

      if (error) throw error;

      setSelectedCase({ ...selectedCase, logs: updatedLogs });
      setEditingLogId(null);
      setEditingLogContent('');
      await fetchCases();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao editar o registro do diário: " + err.message);
    } finally {
      setIsLogLoading(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!selectedCase) return;
    if (!window.confirm("Tem certeza que deseja excluir este registro do diário?")) return;

    setIsLogLoading(true);
    try {
      const updatedLogs = (selectedCase.logs || []).filter(l => {
        const currentId = l.id || `log-${l.date}`;
        return currentId !== logId;
      });

      const { error } = await supabase
        .from('mediation_cases')
        .update({ logs: updatedLogs })
        .eq('id', selectedCase.id);

      if (error) throw error;

      setSelectedCase({ ...selectedCase, logs: updatedLogs });
      await fetchCases();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao excluir o registro do diário: " + err.message);
    } finally {
      setIsLogLoading(false);
    }
  };

  const getStatusStyle = (status: MediationStatus) => {
    switch (status) {
      case 'ABERTURA': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'PLANEJAMENTO': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'EXECUÇÃO': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'CONCLUÍDO': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getSeverityColor = (sev: CaseSeverity) => {
    switch (sev) {
      case 'CRÍTICA': return 'text-red-600';
      case 'ALTA': return 'text-rose-500';
      case 'MÉDIA': return 'text-amber-500';
      default: return 'text-blue-500';
    }
  };

  const handleSaveFeedback = async () => {
    const feedbackValue = selectedCase?.feedback?.trim();
    if (!feedbackValue) {
       alert('Por favor, escreva a devolutiva antes de salvar.');
       return false;
    }
    try {
       console.log('Salvando devolutiva para caso ID:', selectedCase.id, '| Texto:', feedbackValue);
       // 1. Salva no caso de mediação
       const { data: updatedData, error: medError } = await supabase
          .from('mediation_cases')
          .update({ feedback: feedbackValue })
          .eq('id', selectedCase.id)
          .select();
       
       if (medError) throw medError;
       console.log('Devolutiva salva com sucesso:', updatedData);

       // 2. Se houver vínculo, salva no encaminhamento original
       if (selectedCase.originReferralId) {
          const { error: refError } = await supabase
             .from('psychosocial_referrals')
             .update({ feedback: feedbackValue })
             .eq('id', selectedCase.originReferralId);
          
          if (refError) console.error("Erro ao sincronizar com encaminhamento:", refError);
       }

       // 3. Também salva em todos os psychosocial_referrals vinculados ao mesmo aluno, se existirem
       const { error: psyErr } = await supabase
          .from('psychosocial_referrals')
          .update({ feedback: feedbackValue })
          .ilike('student_name', selectedCase.studentName || '');
       
       if (psyErr) console.warn('Aviso ao atualizar psychosocial_referrals:', psyErr.message);

       alert("Devolutiva salva com sucesso!");
       setSelectedCase({ ...selectedCase, feedback: feedbackValue });
       await fetchCases();
       return true;
    } catch (err: any) {
       console.error('Erro ao salvar devolutiva:', err);
       alert("Erro ao salvar devolutiva: " + (err.message || JSON.stringify(err)));
       return false;
    }
  };

  const today = new Date().toLocaleDateString('sv-SE');

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      (c.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.className || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'ativos') {
      // Casos não concluídos OU concluídos hoje (para não "sumirem" na hora)
      return matchesSearch && (c.status !== 'CONCLUÍDO' || c.closedAt === today);
    }
    return matchesSearch && c.status === 'CONCLUÍDO';
  });

  const activeCount = cases.filter(c => c.status !== 'CONCLUÍDO').length;
  const historyCount = cases.filter(c => c.status === 'CONCLUÍDO').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl">
               <Scale size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Mediação de Conflitos</h3>
               <div className="flex items-center gap-2 mt-1">
                   <button 
                     onClick={() => setActiveTab('ativos')}
                     className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${activeTab === 'ativos' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                   >
                     Ativos ({activeCount})
                   </button>
                   <button 
                     onClick={() => setActiveTab('historico')}
                     className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${activeTab === 'historico' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                   >
                     Histórico ({historyCount})
                   </button>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
               <input 
                 type="text" 
                 placeholder="Pesquisar caso..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none w-56 focus:ring-2 focus:ring-rose-100" 
               />
            </div>
            {onTabChange && (
              <button 
                onClick={() => onTabChange('calendar' as any)} 
                className="px-3.5 py-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-100 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                title="Abrir Calendário Oficial do Núcleo de Mediação 2026"
              >
                <CalendarDays size={14} className="text-amber-600" />
                <span>Calendário 2026</span>
              </button>
            )}
            <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-2">
               <Plus size={16} /> Novo Caso
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
         {filteredCases.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedCase(c)}
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-rose-200 hover:shadow-xl transition-all cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-8"
            >
               <div className="flex items-center gap-6 flex-1">
                  <div className={"w-14 h-14 rounded-2xl flex items-center justify-center border-2 " + getStatusStyle(c.status)}>
                    {c.status === 'CONCLUÍDO' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-lg font-black text-gray-900 uppercase leading-none">{c.studentName}</h4>
                        <span className={"px-2 py-0.5 rounded text-[8px] font-black uppercase border " + getStatusStyle(c.status)}>
                          {c.status}
                        </span>
                        {(() => {
                          const studentCasesCount = cases.filter(x => x.studentName?.trim().toUpperCase() === c.studentName?.trim().toUpperCase()).length;
                          if (studentCasesCount > 1) {
                            return (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm" title={`Este estudante possui ${studentCasesCount} casos no histórico`}>
                                <AlertTriangle size={11} className="text-amber-700 shrink-0" />
                                Reincidente ({studentCasesCount}x)
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {(() => {
                           const isBuscaAtiva = (c.teacherName && c.teacherName.toUpperCase().includes('BUSCA ATIVA')) || 
                                                c.description?.includes('[ENCAMINHAMENTO BUSCA ATIVA]') || 
                                                c.description?.includes('[VIA BUSCA ATIVA]') ||
                                                c.description?.includes('Busca Ativa');

                           if (isBuscaAtiva) {
                             const displaySource = (c.teacherName && c.teacherName.includes('(')) ? c.teacherName : 'Busca Ativa Escolar';
                             return (
                               <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm" title="Encaminhado via Busca Ativa Escolar">
                                 <Search size={11} className="text-emerald-700 shrink-0" />
                                 Enviado por: {displaySource}
                               </span>
                             );
                           }

                           if (c.teacherName) {
                             return (
                               <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm" title={`Solicitado/Enviado por: ${c.teacherName}`}>
                                 <UserCheck size={11} className="text-indigo-600 shrink-0" />
                                 Enviado por: {c.teacherName}
                               </span>
                             );
                           }

                           return (
                             <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100 text-[7px] font-bold uppercase tracking-widest">
                               Demandante não registrado
                             </span>
                           );
                        })()}
                        {c.description?.includes('[TRIAGEM P/ PSICOSSOCIAL') && (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm" title="Caso encaminhado para a Equipe Psicossocial">
                            <HeartHandshake size={11} className="text-purple-600 shrink-0" />
                            Triado p/ Psicossocial
                          </span>
                        )}
                        {c.status === 'CONCLUÍDO' && c.closedAt === today && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-700 text-[7px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 animate-pulse">
                            Concluído Hoje
                          </span>
                        )}
                     </div>
                     <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><User size={12}/> {c.className}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Target size={12}/> {c.type}</span>
                        <span className={"text-[10px] font-black uppercase flex items-center gap-1 " + getSeverityColor(c.severity)}>
                           <AlertTriangle size={12}/> Risco {c.severity}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                     <p className="text-[10px] font-black text-gray-400 uppercase">Progresso</p>
                     <div className="flex items-center gap-1 mt-1 justify-end">
                        {c.steps?.map((step, i) => (
                          <div key={i} className={"h-1.5 w-6 rounded-full " + (step.completed ? 'bg-rose-500' : 'bg-gray-100')} />
                        ))}
                     </div>
                     {(() => {
                        let latestDateStr = c.openedAt;

                        if (c.logs && c.logs.length > 0) {
                          const logDates = c.logs.map(l => l.date).filter(Boolean);
                          if (logDates.length > 0) {
                            logDates.sort().reverse();
                            if (!latestDateStr || logDates[0] > latestDateStr) {
                              latestDateStr = logDates[0];
                            }
                          }
                        }

                        if (c.steps && c.steps.length > 0) {
                          const stepDates = c.steps.filter(s => s.completed && s.date).map(s => s.date!);
                          if (stepDates.length > 0) {
                            stepDates.sort().reverse();
                            if (!latestDateStr || stepDates[0] > latestDateStr) {
                              latestDateStr = stepDates[0];
                            }
                          }
                        }

                        if (!latestDateStr) return null;

                        let formattedDate = latestDateStr;
                        try {
                          if (latestDateStr.includes('-')) {
                            const parts = latestDateStr.split('T')[0].split('-');
                            if (parts.length === 3) {
                              formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                            }
                          }
                        } catch (e) {}

                        return (
                          <p className="text-[9px] font-black text-gray-400 uppercase mt-1 flex items-center justify-end gap-1">
                             <Clock size={10} className="text-rose-500" />
                             Atualizado em: <span className="font-extrabold text-rose-600">{formattedDate}</span>
                          </p>
                        );
                     })()}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                     <div className="p-3 bg-gray-50 text-gray-300 group-hover:bg-rose-600 group-hover:text-white rounded-xl transition-all">
                        <ChevronRight size={24}/>
                     </div>
                     <button 
                       onClick={(e) => handleDeleteCase(e, c.id)}
                       className="p-3 bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                       title="Excluir Caso"
                     >
                        <Trash2 size={16}/>
                     </button>
                  </div>
               </div>
            </div>
         ))}
         {filteredCases.length === 0 && (
           <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                        <Scale size={48} className="mx-auto mb-4 text-gray-100" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum caso de mediação registrado</p>
           </div>
         )}
      </div>

      {/* MODAL DE CRIAÇÃO DE NOVO CASO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white animate-in fade-in duration-300">
           <div className="bg-white w-full h-full shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 bg-rose-50 border-b border-rose-100 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-rose-600 text-white rounded-3xl shadow-lg">
                       <Plus size={28} strokeWidth={3} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Novo Caso de Mediação</h3>
                       <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mt-1">Abertura de Protocolo Interno</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                 <form onSubmit={handleCreateCase} className="space-y-8">
                    
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aluno Principal</label>
                        
                        {newCase.studentName ? (
                           <div className="flex items-center justify-between p-5 bg-rose-50 rounded-2xl border-2 border-rose-100 animate-in fade-in zoom-in-95">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg rotate-3">
                                    {newCase.studentName.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-black text-gray-900 uppercase tracking-tight">{newCase.studentName}</p>
                                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">{newCase.className}</p>
                                 </div>
                              </div>
                              <button 
                                 type="button"
                                 onClick={() => {
                                    setNewCase({ ...newCase, studentName: '', studentId: '', className: '' });
                                    setStudentSearch('');
                                 }}
                                 className="p-3 hover:bg-rose-100 rounded-xl text-rose-600 transition-all active:scale-95"
                              >
                                 <X size={20} />
                              </button>
                           </div>
                        ) : (
                           <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                              <input 
                                 type="text" 
                                 placeholder="Digite o nome para buscar aluno..." 
                                 value={studentSearch}
                                 onChange={e => setStudentSearch(e.target.value)}
                                 className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all uppercase"
                              />
                              
                              {studentSearch.length >= 3 && filteredStudents.length > 0 && (
                                 <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden divide-y divide-gray-50 z-[100] animate-in slide-in-from-top-2">
                                    {filteredStudents.map((s: any) => (
                                       <button 
                                          key={s.CodigoAluno || s.id}
                                          type="button"
                                          onClick={() => {
                                             setNewCase({ 
                                               ...newCase, 
                                               studentName: (s.Nome || s.name), 
                                               studentId: (s.CodigoAluno || s.id), 
                                               className: (s.Turma || s.className || 'N/A') 
                                             });
                                             setStudentSearch('');
                                          }}
                                          className="w-full text-left p-4 hover:bg-rose-50 transition-colors flex justify-between items-center group"
                                       >
                                          <div>
                                             <p className="text-xs font-black uppercase text-gray-900 group-hover:text-rose-600">{s.Nome || s.name}</p>
                                             <p className="text-[9px] font-bold text-gray-400 uppercase">{s.Turma || s.className}</p>
                                          </div>
                                          <PlusCircle size={16} className="text-gray-200 group-hover:text-rose-400 transition-colors" />
                                       </button>
                                    ))}
                                 </div>
                              )}
                           </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-1.5 md:col-span-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Origem da Demanda</label>
                          <select 
                             value={newCase.originType || 'Demanda Espontânea (Aluno)'} 
                             onChange={e => setNewCase({...newCase, originType: e.target.value as any})}
                             className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white"
                          >
                             <option value="Demanda Espontânea (Aluno)">Demanda Espontânea (Aluno)</option>
                             <option value="Procura da Família">Procura da Família</option>
                             <option value="Encaminhamento Coordenação">Encaminhamento Coordenação</option>
                             <option value="Conselho Tutelar">Conselho Tutelar</option>
                             <option value="Outro">Outro</option>
                          </select>
                       </div>
                       <div className="space-y-1.5 md:col-span-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo do Conflito</label>
                          <select 
                             value={newCase.type} 
                             onChange={e => setNewCase({...newCase, type: e.target.value as any})}
                             className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white"
                          >
                             {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1.5 md:col-span-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Severidade Inicial</label>
                          <select 
                             value={newCase.severity} 
                             onChange={e => setNewCase({...newCase, severity: e.target.value as any})}
                             className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white"
                          >
                             {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Relato do Fato</label>
                        <textarea 
                           required
                           value={newCase.description}
                           onChange={e => setNewCase({...newCase, description: e.target.value})}
                           placeholder="Descreva detalhadamente o ocorrido..."
                           className="w-full p-8 bg-gray-50 border border-gray-100 rounded-[2.5rem] text-base font-medium min-h-[300px] resize-none outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all"
                        />
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Outras Partes Envolvidas</label>
                       <input 
                          type="text" 
                          placeholder="Nomes separados por vírgula..."
                          onChange={e => setNewCase({...newCase, involvedParties: e.target.value.split(',').map(s => s.trim().toUpperCase())})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                       />
                    </div>

                    <div className="p-6 bg-rose-50 rounded-[2.5rem] border-2 border-rose-100 border-dashed space-y-3">
                       <div className="flex items-center gap-2 text-rose-600">
                          <ShieldAlert size={16} />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Protocolo de Sigilo</h4>
                       </div>
                       <p className="text-[10px] font-medium text-rose-700 leading-relaxed italic">
                          "Os dados registrados aqui são protegidos pela LGPD e restritos à equipe técnica e gestão para fins de proteção integral da criança e do adolescente."
                       </p>
                    </div>

                    <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3">
                       <Save size={20} /> Efetivar Abertura de Caso
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DETALHES DO CASO EXISTENTE - MODAL COMPACTO E ELEGANTE */}
      {selectedCase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-[86vh] max-h-[820px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
            
            {/* CABEÇALHO ELEGANTE E COMPACTO */}
            <div className="px-6 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0 border-b border-white/10 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg font-black text-indigo-200 shadow-inner">
                    {(selectedCase.studentName || '?')[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold tracking-tight text-white">{selectedCase.studentName}</h3>
                      {(() => {
                        const count = cases.filter(c => c.studentName?.trim().toUpperCase() === selectedCase.studentName?.trim().toUpperCase()).length;
                        if (count > 1) {
                          return (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[9px] tracking-wide border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle size={10} /> Reincidente ({count} Casos)
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px] text-slate-300">
                      <span className="font-semibold bg-white/10 px-2 py-0.5 rounded-md text-[10px] text-indigo-200">{selectedCase.className}</span>
                      <span className="text-slate-400">•</span>
                      <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg border border-white/15">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Tipo:</span>
                        <select
                          value={selectedCase.type || 'OUTRO'}
                          onChange={async (e) => {
                            const newType = e.target.value;
                            try {
                              const { error } = await supabase
                                .from('mediation_cases')
                                .update({ type: newType })
                                .eq('id', selectedCase.id);
                              if (error) throw error;
                              setSelectedCase(prev => prev ? { ...prev, type: newType } : null);
                              await fetchCases();
                            } catch (err: any) {
                              alert("Erro ao alterar tipo do caso: " + err.message);
                            }
                          }}
                          className="bg-transparent text-white text-[11px] font-extrabold outline-none cursor-pointer hover:text-indigo-300"
                          title="Clique para alterar a classificação geral deste caso"
                        >
                          {CASE_TYPES.map(t => (
                            <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400 font-mono text-[10px]">Protocolo #{selectedCase.id?.substring(0,8)}</span>
                    </div>
                  </div>
                </div>

                {/* AÇÕES RÁPIDAS NO TOPO */}
                <div className="flex items-center gap-2">
                  {/* Botão: Encaminhar / Cancelar Psicossocial */}
                  <button
                    type="button"
                    onClick={() => handleTogglePsychosocialTriage(selectedCase)}
                    disabled={isTriaging}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                      selectedCase.description?.includes('[TRIAGEM P/ PSICOSSOCIAL')
                        ? 'bg-purple-900/80 text-purple-200 border border-purple-400/50 hover:bg-rose-900/80 hover:text-rose-200 hover:border-rose-400'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                    }`}
                    title={
                      selectedCase.description?.includes('[TRIAGEM P/ PSICOSSOCIAL')
                        ? 'Caso já encaminhado. Clique para CANCELAR / REVERTER o encaminhamento.'
                        : 'Encaminhar este caso para acompanhamento da Equipe Psicossocial'
                    }
                  >
                    <HeartHandshake size={14} />
                    <span>{selectedCase.description?.includes('[TRIAGEM P/ PSICOSSOCIAL') ? '✓ Triado (Clique p/ Cancelar)' : 'Encaminhar p/ Psicossocial'}</span>
                  </button>

                  {/* Botão: Imprimir Relatório Oficial */}
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    title="Gerar e Imprimir Relatório Oficial de Atendimento com cabeçalho SEDUC"
                  >
                    <Printer size={14} />
                    <span>Imprimir Relatório</span>
                  </button>

                  {/* Botão Principal: Lavrar Ata SEDUC */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAtaForCase) {
                        onOpenAtaForCase(selectedCase);
                        setSelectedCase(null);
                      } else if (onTabChange) {
                        onTabChange('atas');
                        setSelectedCase(null);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    title="Preencher Ata Oficial SEDUC a partir deste caso"
                  >
                    <FileText size={14} />
                    <span>Lavrar Ata SEDUC</span>
                  </button>

                  {/* Dropdown de Mais Ações */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <span>Mais Ações</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isActionMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isActionMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-150 text-xs">
                        <div className="p-1 space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsActionMenuOpen(false);
                              setIsReportModalOpen(true);
                            }}
                            className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800 text-indigo-300 flex items-center gap-2 font-medium transition-colors"
                          >
                            <Printer size={14} /> Imprimir Relatório de Atendimento
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsActionMenuOpen(false);
                              setIsGuideModalOpen(true);
                            }}
                            className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800 text-amber-300 flex items-center gap-2 font-medium transition-colors"
                          >
                            <BookOpen size={14} /> Guia de Perguntas (SEDUC)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsActionMenuOpen(false);
                              setIsAgreementTermModalOpen(true);
                            }}
                            className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800 text-emerald-300 flex items-center gap-2 font-medium transition-colors"
                          >
                            <FileCheck size={14} /> Pacto / Termo de Compromisso
                          </button>
                        </div>
                        <div className="p-1 space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsActionMenuOpen(false);
                              handleSendFeedbackToRequester(selectedCase);
                            }}
                            className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 font-medium transition-colors"
                          >
                            <Send size={14} /> Enviar Devolutiva ao Solicitante
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsActionMenuOpen(false);
                              handleTogglePsychosocialTriage(selectedCase);
                            }}
                            disabled={isTriaging}
                            className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800 text-purple-300 flex items-center gap-2 font-medium transition-colors"
                          >
                            <HeartHandshake size={14} /> 
                            {selectedCase.description?.includes('[TRIAGEM P/ PSICOSSOCIAL') ? 'Cancelar Encaminhamento Psicossocial' : 'Encaminhar p/ Psicossocial'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fechar */}
                  <button 
                    onClick={() => {
                      setSelectedCase(null);
                      setIsActionMenuOpen(false);
                    }} 
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all ml-1"
                    title="Fechar janela"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* NAVEGAÇÃO POR ABAS EXECUTIVAS */}
              <div className="flex items-center gap-2 border-t border-white/10 pt-2.5">
                <button
                  type="button"
                  onClick={() => setActiveCaseTab('timeline')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeCaseTab === 'timeline'
                      ? 'bg-white text-slate-900 shadow-md font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <History size={14} />
                  <span>Diário & Atendimentos</span>
                  {selectedCase.logs && selectedCase.logs.length > 0 && (
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                      activeCaseTab === 'timeline' ? 'bg-indigo-600 text-white' : 'bg-white/20 text-white'
                    }`}>
                      {selectedCase.logs.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCaseTab('steps')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeCaseTab === 'steps'
                      ? 'bg-white text-slate-900 shadow-md font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  <span>Etapas do Processo</span>
                  {selectedCase.steps && (
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                      activeCaseTab === 'steps' ? 'bg-emerald-600 text-white' : 'bg-white/20 text-white'
                    }`}>
                      {selectedCase.steps.filter(s => s.completed).length}/{selectedCase.steps.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCaseTab('resolution')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeCaseTab === 'resolution'
                      ? 'bg-white text-slate-900 shadow-md font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <MessageSquareIcon size={14} />
                  <span>Acordo & Devolutiva</span>
                  {selectedCase.feedback && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              </div>
            </div>

            {/* CORPO DO MODAL BASEADO NA ABA ATIVA */}
            <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-slate-50/50 flex flex-col min-h-0">
              
              {/* ABA 1: DIÁRIO & ATENDIMENTOS (LAYOUT LIMPO E INTEGRADO) */}
              {activeCaseTab === 'timeline' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full h-full min-h-0 flex-1">
                  
                  {/* Coluna Esquerda: Relato e Contexto */}
                  <div className="lg:col-span-5 flex flex-col gap-4 h-full min-h-0">
                    {/* Relato Original */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col flex-1 min-h-0">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3 shrink-0">
                        <FileText size={15} className="text-indigo-600" />
                        Relato Original do Caso
                      </h4>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-slate-700 text-xs font-normal leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto custom-scrollbar">
                        {selectedCase.description || 'Sem descrição informada.'}
                      </div>
                    </div>

                    {/* Parecer / Devolutiva da Psicossocial (se houver) */}
                    {selectedCase.feedback && (
                      <div className="bg-indigo-50/60 border border-indigo-200 p-5 rounded-2xl shadow-sm space-y-2 shrink-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                            <HeartHandshake size={15} className="text-indigo-600" /> Parecer Psicossocial
                          </h4>
                          <span className="text-[9px] font-bold uppercase bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-md">
                            Registrado
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3.5 rounded-xl border border-indigo-100 whitespace-pre-wrap">
                          "{selectedCase.feedback}"
                        </p>
                      </div>
                    )}

                    {/* Resumo do Status */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between shrink-0">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Atual</p>
                        <p className={`text-sm font-black uppercase mt-0.5 ${
                          selectedCase.status === 'CONCLUÍDO' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {selectedCase.status || 'ABERTURA'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data de Abertura</p>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          {formatLocalDate(selectedCase.openedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita: Diário de Atendimento e Linha do Tempo */}
                  <div className="lg:col-span-7 flex flex-col h-full min-h-0">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full min-h-0 space-y-4">
                      
                      {/* Caixa de Novo Registro com Dropdown de Categoria Limpo */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 shrink-0">
                        {/* Linha 1: Título e Seletor de Tipo */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                            <UserCheck size={14} className="text-indigo-600" />
                            Registrar Atendimento / Ação
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400">Tipo:</span>
                            <select
                              value={newLog.category || 'CONFLITO'}
                              onChange={(e) => setNewLog(prev => ({ ...prev, category: e.target.value }))}
                              className="bg-white border border-slate-300 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
                            >
                              {ATTENDANCE_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Campo de Texto */}
                        <textarea 
                          value={newLog.content}
                          onChange={(e) => setNewLog({ ...newLog, content: e.target.value })}
                          placeholder="Descreva a escuta realizada, relatos dos estudantes/familiares e combinados..."
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-normal resize-none outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 min-h-[65px] transition-all"
                        />

                        {/* Rodapé da Caixa de Registro */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span className="text-[10px] text-slate-500 truncate">
                            Por: <strong className="text-slate-700 font-semibold">{user?.name ? `${user.name} (Mediador)` : 'Mediação'}</strong>
                          </span>
                          <button 
                            onClick={handleSaveLog}
                            disabled={isLogLoading || !newLog.content.trim()}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0"
                          >
                            <Save size={13} />
                            <span>{isLogLoading ? 'Salvando...' : 'Adicionar Registro'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Lista de Registros da Linha do Tempo */}
                      <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar space-y-3 pt-1">
                        {selectedCase.logs && selectedCase.logs.length > 0 ? (
                          selectedCase.logs.map((log, idx) => {
                            const logId = log.id || `log-idx-${idx}`;
                            const isEditing = editingLogId === logId;

                            return (
                              <div key={logId} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 hover:bg-white hover:shadow-sm transition-all group space-y-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                      {log.professional}
                                    </span>
                                    {log.category && (
                                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                        ATTENDANCE_CATEGORIES.find(c => c.id === log.category)?.color || 'bg-slate-100 text-slate-700 border-slate-200'
                                      }`}>
                                        {ATTENDANCE_CATEGORIES.find(c => c.id === log.category)?.label || log.category}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-400 font-medium">{formatLocalDate(log.date)}</span>
                                    {!isEditing && (
                                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => {
                                            setEditingLogId(logId);
                                            setEditingLogContent(log.content);
                                          }}
                                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                          title="Editar registro"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLog(logId)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                          title="Excluir registro"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className="space-y-2 pt-1">
                                    <textarea
                                      value={editingLogContent}
                                      onChange={(e) => setEditingLogContent(e.target.value)}
                                      className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl text-xs font-normal resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[60px]"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setEditingLogId(null)}
                                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={() => handleUpdateLog(logId)}
                                        disabled={!editingLogContent.trim() || isLogLoading}
                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                                      >
                                        <Check size={12} /> Salvar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-slate-700 text-xs font-normal leading-relaxed whitespace-pre-wrap pl-0.5">
                                    {log.content}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                            <Clock size={32} className="text-slate-300 stroke-1" />
                            <p className="text-xs font-semibold">Nenhum atendimento registrado no diário ainda.</p>
                            <p className="text-[11px] text-slate-400">Use o campo acima para registrar as escutas e ações deste caso.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: ETAPAS DO PROCESSO */}
              {activeCaseTab === 'steps' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar w-full flex justify-center">
                  <div className="max-w-5xl w-full space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <h4 className="text-base font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            Roteiro de Mediação & Etapas do Processo
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Marque ou desmarque cada etapa conforme o atendimento, palestras e ações restaurativas avançam.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            const stepName = window.prompt("Digite o nome da nova etapa, palestra ou ação restaurativa (ex: Palestra sobre Bullying no 9º A):");
                            if (!stepName || !stepName.trim()) return;

                            const newStep = {
                              id: `custom-step-${Date.now()}`,
                              label: stepName.trim(),
                              completed: false
                            };

                            const updatedSteps = [...(selectedCase.steps || []), newStep];
                            try {
                              const { error } = await supabase
                                .from('mediation_cases')
                                .update({ steps: updatedSteps })
                                .eq('id', selectedCase.id);
                              if (error) throw error;
                              setSelectedCase({ ...selectedCase, steps: updatedSteps });
                              await fetchCases();
                            } catch (err: any) {
                              alert("Erro ao adicionar etapa: " + err.message);
                            }
                          }}
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-sm active:scale-95"
                        >
                          <Plus size={14} /> Adicionar Etapa / Palestra
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3.5">
                        {selectedCase.steps?.map((step, idx) => (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              step.completed 
                                ? 'bg-emerald-50/70 border-emerald-200' 
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                step.completed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {step.completed ? <Check size={16} /> : idx + 1}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-bold truncate sm:whitespace-normal ${step.completed ? 'text-emerald-900' : 'text-slate-800'}`}>
                                  {step.label}
                                </p>
                                {step.date && (
                                  <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                                    Concluído em: {formatLocalDate(step.date)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {step.completed ? (
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!window.confirm(`Deseja reverter a etapa "${step.label}" para pendente?`)) return;
                                    const updatedSteps = selectedCase.steps.map((s, i) => 
                                      i === idx ? { ...s, completed: false, date: undefined } : s
                                    );
                                    try {
                                      const { error } = await supabase
                                        .from('mediation_cases')
                                        .update({ steps: updatedSteps })
                                        .eq('id', selectedCase.id);
                                      if (error) throw error;
                                      await fetchCases();
                                      setSelectedCase({ ...selectedCase, steps: updatedSteps });
                                    } catch (err) {
                                      alert("Erro ao reverter etapa.");
                                    }
                                  }}
                                  className="px-3.5 py-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                                  title="Clique para desfazer / reverter esta etapa"
                                >
                                  <RotateCcw size={12} /> Desfazer
                                </button>
                              ) : (
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const updatedSteps = selectedCase.steps.map((s, i) => 
                                      i === idx ? { ...s, completed: true, date: new Date().toLocaleDateString('sv-SE') } : s
                                    );
                                    try {
                                      const { error } = await supabase
                                        .from('mediation_cases')
                                        .update({ steps: updatedSteps })
                                        .eq('id', selectedCase.id);
                                      if (error) throw error;
                                      await fetchCases();
                                      setSelectedCase({ ...selectedCase, steps: updatedSteps });
                                    } catch (err) {
                                      alert("Erro ao atualizar etapa.");
                                    }
                                  }}
                                  className="px-4 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                                >
                                  <Check size={13} /> Concluir Etapa
                                </button>
                              )}

                              {step.label?.includes('Encaminhamento') && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePsychosocialTriage(selectedCase);
                                  }}
                                  disabled={isTriaging}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${
                                    selectedCase.description?.includes('[TRIAGEM P/ PSICOSSOCIAL')
                                      ? 'bg-purple-100 text-purple-800 border border-purple-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                                  }`}
                                  title={
                                    selectedCase.description?.includes('[TRIAGEM P/ PSICOSSOCIAL')
                                      ? 'Clique para CANCELAR / DESFAZER o encaminhamento ao Psicossocial'
                                      : 'Encaminhar este caso para a Equipe Psicossocial'
                                  }
                                >
                                  <HeartHandshake size={13} />
                                  <span>{selectedCase.description?.includes('[TRIAGEM P/ PSICOSSOCIAL') ? '✓ Triado (Cancelar)' : 'Encaminhar p/ Psicossocial'}</span>
                                </button>
                              )}

                              {/* Opção de excluir etapa personalizada */}
                              {step.id?.startsWith('custom-step-') && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!window.confirm(`Deseja remover a etapa "${step.label}"?`)) return;
                                    const updatedSteps = selectedCase.steps.filter((_, i) => i !== idx);
                                    try {
                                      const { error } = await supabase
                                        .from('mediation_cases')
                                        .update({ steps: updatedSteps })
                                        .eq('id', selectedCase.id);
                                      if (error) throw error;
                                      await fetchCases();
                                      setSelectedCase({ ...selectedCase, steps: updatedSteps });
                                    } catch (err) {
                                      alert("Erro ao remover etapa.");
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Excluir esta etapa personalizada"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: ACORDO FINAL & DEVOLUTIVA */}
              {activeCaseTab === 'resolution' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar w-full flex justify-center">
                  <div className="max-w-5xl w-full space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                      <div>
                        <h4 className="text-base font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <MessageSquareIcon size={18} className="text-emerald-600" />
                          Acordo Restaurativo Final & Devolutiva
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Escreva aqui a resolução do caso, acordos firmados entre as partes e o parecer final que será sincronizado com o professor solicitante.
                        </p>
                      </div>

                      <textarea 
                        value={selectedCase?.feedback || ''}
                        onChange={(e) => setSelectedCase({ ...selectedCase, feedback: e.target.value })}
                        placeholder="Descreva o desfecho do caso, os combinados e acordos restaurativos firmados com os estudantes e familiares..."
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-normal text-slate-800 leading-relaxed resize-none outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 min-h-[300px] transition-all"
                      />

                      <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/70 text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>Este texto será exibido na devolutiva oficial e nos relatórios de mediação.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RODAPÉ LIMPO E SEMPRE VISÍVEL */}
            <div className="px-6 sm:px-8 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 shadow-lg z-20">
              <button 
                onClick={(e) => selectedCase.id && handleDeleteCase(e as any, selectedCase.id)}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                title="Excluir este caso"
              >
                <Trash2 size={14} /> Excluir Caso
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  title="Gerar e imprimir relatório deste caso"
                >
                  <Printer size={14} /> Imprimir Relatório
                </button>

                <button 
                  onClick={handleSaveFeedback}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Save size={14} /> Salvar Rascunho
                </button>

                <button 
                  onClick={async () => {
                    if (!window.confirm("Deseja encerrar este caso com acordo restaurativo?")) return;
                    try {
                      if (selectedCase?.feedback?.trim()) {
                        await supabase
                          .from('mediation_cases')
                          .update({ feedback: selectedCase.feedback.trim() })
                          .eq('id', selectedCase.id);
                      }

                      const { error } = await supabase
                        .from('mediation_cases')
                        .update({ 
                          status: 'CONCLUÍDO', 
                          closed_at: new Date().toLocaleDateString('sv-SE') 
                        })
                        .eq('id', selectedCase.id);
                      if (error) throw error;
                      await fetchCases();
                      alert("Caso encerrado com sucesso com acordo!");
                      setSelectedCase(null);
                    } catch (err) {
                      alert("Erro ao encerrar caso.");
                    }
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                >
                  <ShieldCheck size={15} /> Encerrar com Acordo
                </button>

                <button 
                  onClick={() => {
                    setSelectedCase(null);
                    setIsActionMenuOpen(false);
                  }} 
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* GUIA DE PERGUNTAS RESTAURATIVAS (SEDUC/MT) */}
      <MediationRestorativeGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onSelectQuestions={(text) => {
          setNewLog(prev => ({
            ...prev,
            content: (prev.content ? `${prev.content}\n\n` : '') + text
          }));
        }}
      />

      {/* TERMO FORMAL DE COMPROMISSO RESTAURATIVO / PACTO DE CONVIVÊNCIA */}
      {selectedCase && (
        <MediationAgreementTermModal
          isOpen={isAgreementTermModalOpen}
          onClose={() => setIsAgreementTermModalOpen(false)}
          mediationCase={selectedCase}
          onAgreementSaved={async () => {
            await fetchCases();
          }}
        />
      )}

      {/* RELATÓRIO OFICIAL DE ATENDIMENTO PARA IMPRESSÃO */}
      {selectedCase && (
        <MediationAttendanceReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          mediationCase={selectedCase}
          userName={user?.name}
        />
      )}
    </div>
  );
};

export default MediationManager;
