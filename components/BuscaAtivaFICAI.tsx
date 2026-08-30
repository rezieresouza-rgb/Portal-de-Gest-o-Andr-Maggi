import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  ShieldCheck,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Calendar,
  User,
  Send,
  CheckSquare,
  Square,
  Clock,
  MessageSquare,
  Filter,
  Eye,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import { INITIAL_STUDENTS } from '../constants/initialData';

export interface FicaiRecord {
  id: string;
  protocolNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  absencesCount: number;
  expeditionDate: string;
  reasons: string[];
  schoolProcedures: string[];
  detailsReport: string;
  responsibleName: string;
  status: 'EXPEDIDA' | 'EM_ACOMPANHAMENTO' | 'ALUNO_REINTEGRADO' | 'ARQUIVADA';
  conselhoDevolutiva?: {
    receivedDate?: string;
    counselorName?: string;
    actionTaken?: string;
    notes?: string;
  };
  created_at?: string;
}

const MOTIVOS_ECA = [
  'Reiteração de Graves Atos de Indisciplina e Descumprimento de TACE (Art. 56, III ECA)',
  'Infrequência Injustificada Superior a 10% / Faltas Reiteradas (Art. 56, II ECA)',
  '5 ou Mais Faltas Consecutivas sem Justificativa',
  'Suspeita de Evasão / Abandono Escolar',
  'Conflitos Graves, Agressão ou Ameaça no Ambiente Escolar',
  'Suspeita de Violação de Direitos / Maus-Tratos / Vulnerabilidade Familiar (Art. 56, I ECA)',
  'Impossibilidade de Contato Telefônico ou Recusa dos Pais em Comparecer'
];

const PROVIDENCIAS_ESCOLA = [
  'Aplicação de Medidas Disciplinares e Ficha de Enquadramento EECM',
  'Celebração de Termo de Ajustamento de Conduta Escolar (TACE - Art. 22)',
  'Atendimento e Acolhimento pela Equipe Psicossocial (Lei 13.935/19)',
  'Sessão de Mediação Escolar e Círculo Restaurativo de Paz',
  'Contato Telefônico / WhatsApp com os Pais realizado',
  'Notificação por Escrito e Convocação Presencial dos Pais',
  'Anotação e Alerta Registrado em Diário de Classe',
  'Visita Domiciliar realizada pela Equipe Escolar',
  'Reunião com a Coordenação Pedagógica e Direção Escolar',
  'Esgotamento de todas as medidas pedagógicas e disciplinares internas'
];

const BuscaAtivaFICAI: React.FC = () => {
  const { students: dbStudents, loading: loadingStudents } = useStudents();
  const printRef = useRef<HTMLDivElement>(null);

  // Aba principal: 'historico' ou 'nova'
  const [currentTab, setCurrentTab] = useState<'historico' | 'nova'>('historico');

  // Estados do Histórico de FICAIs
  const [ficaiRecords, setFicaiRecords] = useState<FicaiRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [selectedRecordForView, setSelectedRecordForView] = useState<FicaiRecord | null>(null);
  const [recordForDevolutiva, setRecordForDevolutiva] = useState<FicaiRecord | null>(null);

  // Estados para Registro de Nova FICAI
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    class: string;
    guardian: string;
    phone: string;
  }>({
    id: '',
    name: '',
    class: '',
    guardian: '',
    phone: ''
  });

  const [protocolNumber, setProtocolNumber] = useState('');
  const [absencesCount, setAbsencesCount] = useState<number>(5);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([MOTIVOS_ECA[0]]);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([PROVIDENCIAS_ESCOLA[0], PROVIDENCIAS_ESCOLA[2]]);
  const [detailsReport, setDetailsReport] = useState('');
  const [responsibleName, setResponsibleName] = useState('EQUIPE BUSCA ATIVA ESCOLAR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Encaminhamentos do Cívico-Militar para FICAI
  const [pendingCivicReferrals, setPendingCivicReferrals] = useState<any[]>([]);
  const [activeReferralOriginId, setActiveReferralOriginId] = useState<string | null>(null);

  // Estados para Devolutiva do Conselho
  const [devolutivaForm, setDevolutivaForm] = useState({
    receivedDate: new Date().toLocaleDateString('sv-SE'),
    counselorName: '',
    actionTaken: 'Visita Domiciliar e Notificação dos Responsáveis realizada pelo Conselho',
    notes: '',
    newStatus: 'EM_ACOMPANHAMENTO' as FicaiRecord['status']
  });

  // Estudantes em Risco Automático (com base em frequência ou cadastro)
  const [studentsAtRisk, setStudentsAtRisk] = useState<any[]>([]);

  // Carregar encaminhamentos do Cívico-Militar
  const fetchCivicReferrals = async () => {
    try {
      const local = JSON.parse(localStorage.getItem('busca_ativa_ficai_referrals_v1') || '[]');
      try {
        const { data, error } = await supabase
          .from('busca_ativa_ficai_referrals')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setPendingCivicReferrals(data);
          return;
        }
      } catch (e) {}
      setPendingCivicReferrals(local);
    } catch (err) {
      console.warn('Erro ao carregar encaminhamentos cívico-militares:', err);
    }
  };

  const handleImportCivicReferral = (refItem: any) => {
    setSelectedStudent({
      id: refItem.student_id || '',
      name: refItem.student_name || '',
      class: refItem.class_name || '',
      guardian: refItem.guardian_name || '',
      phone: refItem.guardian_phone || ''
    });
    setStudentSearch(refItem.student_name || '');
    if (refItem.reasons && refItem.reasons.length > 0) {
      setSelectedReasons(refItem.reasons);
    }
    if (refItem.adopted_procedures && refItem.adopted_procedures.length > 0) {
      setSelectedProcedures(refItem.adopted_procedures);
    }
    setDetailsReport(refItem.report_details || `Encaminhamento originado do Módulo Cívico-Militar por ${refItem.responsible_name}.\nMotivos: ${(refItem.reasons || []).join('; ')}`);
    setActiveReferralOriginId(refItem.id);
    setCurrentTab('nova');
  };

  // Unifica todos os estudantes para busca
  const masterStudents = useMemo(() => {
    const combined = [...dbStudents];
    INITIAL_STUDENTS.forEach(initS => {
      if (!combined.some(s => String(s.registration_number || s.id) === String(initS.CodigoAluno))) {
        combined.push({
          id: String(initS.CodigoAluno),
          registration_number: String(initS.CodigoAluno),
          name: initS.Nome,
          class: initS.Turma,
          guardian_name: (initS as any).NomeResponsavel || 'NÃO INFORMADO',
          contact_phone: (initS as any).TelefoneContato || 'NÃO INFORMADO',
          status: 'ATIVO'
        });
      }
    });
    return combined;
  }, [dbStudents]);

  const filteredMasterStudents = useMemo(() => {
    if (!studentSearch || studentSearch.length < 2) return [];
    return masterStudents.filter(s =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.class && s.class.toLowerCase().includes(studentSearch.toLowerCase()))
    ).slice(0, 6);
  }, [studentSearch, masterStudents]);

  // Carregar histórico de FICAIs expedidas
  const fetchFicaiRecords = async () => {
    setLoadingRecords(true);
    try {
      const { data, error } = await supabase
        .from('ficai_records')
        .select('*')
        .order('expedition_date', { ascending: false });

      if (!error && data) {
        const formatted: FicaiRecord[] = data.map(r => ({
          id: r.id,
          protocolNumber: r.protocol_number || `FICAI-${r.id.slice(0, 6)}`,
          studentId: r.student_id,
          studentName: r.student_name,
          className: r.class_name,
          guardianName: r.guardian_name || 'NÃO INFORMADO',
          guardianPhone: r.guardian_phone || 'NÃO INFORMADO',
          absencesCount: r.absences_count || 5,
          expeditionDate: r.expedition_date || new Date().toLocaleDateString('sv-SE'),
          reasons: r.reasons || [],
          schoolProcedures: r.school_procedures || [],
          detailsReport: r.details_report || '',
          responsibleName: r.responsible_name || 'Busca Ativa Escolar',
          status: r.status || 'EXPEDIDA',
          conselhoDevolutiva: r.conselho_devolutiva || undefined
        }));
        setFicaiRecords(formatted);
      } else {
        // Fallback local
        const local = JSON.parse(localStorage.getItem('busca_ativa_ficai_records_v2') || '[]');
        setFicaiRecords(local);
      }
    } catch (err) {
      console.warn('Erro ao carregar FICAIs do Supabase, carregando local:', err);
      const local = JSON.parse(localStorage.getItem('busca_ativa_ficai_records_v2') || '[]');
      setFicaiRecords(local);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchFicaiRecords();
    fetchCivicReferrals();
  }, []);

  // Gerar número de protocolo automático ao abrir formulário de criação
  useEffect(() => {
    if (currentTab === 'nova' && !protocolNumber) {
      const nextSeq = String(ficaiRecords.length + 1).padStart(4, '0');
      const year = new Date().getFullYear();
      setProtocolNumber(`FICAI-${year}/${nextSeq}`);
    }
  }, [currentTab, ficaiRecords]);

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const toggleProcedure = (proc: string) => {
    setSelectedProcedures(prev =>
      prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc]
    );
  };

  const handleSubmitNewFicai = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent.name) {
      alert('Por favor, selecione um estudante para registrar a FICAI.');
      return;
    }

    if (selectedReasons.length === 0) {
      alert('Selecione ao menos um motivo do ECA para expedição da FICAI.');
      return;
    }

    setIsSubmitting(true);

    try {
      const nowId = `ficai-${Date.now()}`;
      const todayDate = new Date().toLocaleDateString('sv-SE');

      const recordData: FicaiRecord = {
        id: nowId,
        protocolNumber: protocolNumber || `FICAI-2026/${Date.now().toString().slice(-4)}`,
        studentId: selectedStudent.id || `std-${Date.now()}`,
        studentName: selectedStudent.name,
        className: selectedStudent.class || 'N/A',
        guardianName: selectedStudent.guardian || 'NÃO INFORMADO',
        guardianPhone: selectedStudent.phone || 'NÃO INFORMADO',
        absencesCount: absencesCount || 5,
        expeditionDate: todayDate,
        reasons: selectedReasons,
        schoolProcedures: selectedProcedures,
        detailsReport: detailsReport || `Expedição de Ficha FICAI em decorrência de ${absencesCount} faltas registradas.`,
        responsibleName: responsibleName || 'BUSCA ATIVA ESCOLAR',
        status: 'EXPEDIDA'
      };

      // 1. Salvar no Supabase
      const payloadSupabase = {
        id: recordData.id,
        protocol_number: recordData.protocolNumber,
        student_id: recordData.studentId,
        student_name: recordData.studentName,
        class_name: recordData.className,
        guardian_name: recordData.guardianName,
        guardian_phone: recordData.guardianPhone,
        absences_count: recordData.absencesCount,
        expedition_date: recordData.expeditionDate,
        reasons: recordData.reasons,
        school_procedures: recordData.schoolProcedures,
        details_report: recordData.detailsReport,
        responsible_name: recordData.responsibleName,
        status: recordData.status
      };

      const { error: sbError } = await supabase
        .from('ficai_records')
        .insert([payloadSupabase]);

      if (sbError) {
        console.warn('Fallback ativado: Tabela ficai_records inacessível no Supabase:', sbError);
      }

      // 2. Registrar também um encaminhamento geral em psychosocial_referrals para rastreamento
      await supabase.from('psychosocial_referrals').insert([{
        school_unit: 'E.E. ANDRÉ ANTÔNIO MAGGI',
        student_name: recordData.studentName,
        class_name: recordData.className,
        teacher_name: recordData.responsibleName,
        report: `[FICAI EXPEDIDA - CONSELHO TUTELAR] Protocolo: ${recordData.protocolNumber}. Faltas: ${recordData.absencesCount}. ${recordData.detailsReport}`,
        status: 'EM_TRIAGEM',
        referral_destination: 'CONSELHO_TUTELAR',
        priority: 'ALTA',
        date: todayDate
      }]);

      // 3. Se tiver vindo de solicitação do Cívico-Militar, conclui o encaminhamento
      if (activeReferralOriginId) {
        const pending = JSON.parse(localStorage.getItem('busca_ativa_ficai_referrals_v1') || '[]');
        const updated = pending.map((p: any) => p.id === activeReferralOriginId ? { ...p, status: 'FICAI_EXPEDIDA', protocol_generated: recordData.protocolNumber } : p);
        localStorage.setItem('busca_ativa_ficai_referrals_v1', JSON.stringify(updated));
        setPendingCivicReferrals(updated);
        try {
          await supabase.from('busca_ativa_ficai_referrals').update({ status: 'FICAI_EXPEDIDA', protocol_generated: recordData.protocolNumber }).eq('id', activeReferralOriginId);
        } catch (e) {}
        setActiveReferralOriginId(null);
      }

      // 4. Salvar em LocalStorage
      const updatedLocal = [recordData, ...ficaiRecords];
      setFicaiRecords(updatedLocal);
      localStorage.setItem('busca_ativa_ficai_records_v2', JSON.stringify(updatedLocal));

      alert(`Ficha FICAI ${recordData.protocolNumber} registrada com sucesso para ${recordData.studentName}!`);

      // Selecionar para visualização/impressão e alternar aba
      setSelectedRecordForView(recordData);
      setCurrentTab('historico');

      // Resetar form
      setSelectedStudent({ id: '', name: '', class: '', guardian: '', phone: '' });
      setStudentSearch('');
      setDetailsReport('');
      setProtocolNumber('');
    } catch (err: any) {
      console.error('Erro ao registrar FICAI:', err);
      alert('Erro ao registrar FICAI. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Salvar Devolutiva do Conselho Tutelar
  const handleSaveDevolutiva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForDevolutiva) return;

    try {
      const updatedRecord: FicaiRecord = {
        ...recordForDevolutiva,
        status: devolutivaForm.newStatus,
        conselhoDevolutiva: {
          receivedDate: devolutivaForm.receivedDate,
          counselorName: devolutivaForm.counselorName || 'Conselho Tutelar de Colíder',
          actionTaken: devolutivaForm.actionTaken,
          notes: devolutivaForm.notes
        }
      };

      // Atualiza no Supabase
      await supabase
        .from('ficai_records')
        .update({
          status: updatedRecord.status,
          conselho_devolutiva: updatedRecord.conselhoDevolutiva
        })
        .eq('id', updatedRecord.id);

      // Atualiza no estado e localStorage
      const updatedList = ficaiRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r);
      setFicaiRecords(updatedList);
      localStorage.setItem('busca_ativa_ficai_records_v2', JSON.stringify(updatedList));

      alert('Devolutiva do Conselho Tutelar registrada com sucesso!');
      setRecordForDevolutiva(null);
    } catch (err) {
      console.error('Erro ao registrar devolutiva:', err);
      alert('Erro ao salvar devolutiva.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* Header & Estatísticas da FICAI */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <ShieldCheck size={12} /> Art. 56, II do ECA • SEDUC/MT
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              Fichas FICAI (Busca Ativa Escolar)
            </h2>
            <p className="text-xs text-emerald-100/70 font-medium max-w-2xl leading-relaxed">
              Sistema de expedição, acompanhamento e registro de Fichas de Comunicação de Aluno Infrequente (FICAI) encaminhadas ao Conselho Tutelar de Colíder-MT.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCurrentTab('historico')}
              className={`px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                currentTab === 'historico'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <FileCheck size={16} /> Fichas Registradas
            </button>
            <button
              onClick={() => setCurrentTab('nova')}
              className={`px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                currentTab === 'nova'
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Plus size={16} /> Registrar Nova FICAI
            </button>
          </div>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-emerald-900/60">
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest block mb-1">Total de FICAIs Expedidas</span>
            <span className="text-2xl font-black text-white">{ficaiRecords.length}</span>
          </div>
          <div className="bg-amber-500/10 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20">
            <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest block mb-1">Em Acompanhamento</span>
            <span className="text-2xl font-black text-amber-300">
              {ficaiRecords.filter(r => r.status === 'EXPEDIDA' || r.status === 'EM_ACOMPANHAMENTO').length}
            </span>
          </div>
          <div className="bg-emerald-500/10 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20">
            <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest block mb-1">Alunos Reintegrados</span>
            <span className="text-2xl font-black text-emerald-300">
              {ficaiRecords.filter(r => r.status === 'ALUNO_REINTEGRADO').length}
            </span>
          </div>
          <div className="bg-slate-500/10 backdrop-blur-md p-4 rounded-2xl border border-slate-500/20">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Arquivadas</span>
            <span className="text-2xl font-black text-slate-200">
              {ficaiRecords.filter(r => r.status === 'ARQUIVADA').length}
            </span>
          </div>
        </div>

        {/* INBOX DE ENCAMINHAMENTOS DO CÍVICO-MILITAR */}
        {pendingCivicReferrals.filter(r => r.status === 'PENDENTE_BUSCA_ATIVA').length > 0 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-rose-950 via-red-900 to-slate-900 rounded-[2rem] border border-rose-600/40 text-white shadow-xl animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
                    Solicitações de FICAI Recebidas do Cívico-Militar
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                      {pendingCivicReferrals.filter(r => r.status === 'PENDENTE_BUSCA_ATIVA').length} pendente(s)
                    </span>
                  </h3>
                  <p className="text-[10px] text-rose-200 font-bold uppercase tracking-wider">
                    Alunos encaminhados pela gestão militar por reincidência disciplinar e infrequência (Art. 56 do ECA)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {pendingCivicReferrals
                .filter(r => r.status === 'PENDENTE_BUSCA_ATIVA')
                .map(refItem => (
                  <div key={refItem.id} className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex flex-col justify-between gap-3 text-xs">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-mono text-rose-300 block">{refItem.forwarded_date || 'Hoje'}</span>
                          <h4 className="text-sm font-black text-white uppercase">{refItem.student_name}</h4>
                          <p className="text-[10px] text-rose-200 font-semibold">
                            Turma: {refItem.class_name} • Responsável: {refItem.guardian_name} ({refItem.guardian_phone})
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          refItem.urgency === 'CRÍTICA' ? 'bg-red-500 text-white' : refItem.urgency === 'URGENTE' ? 'bg-amber-500 text-slate-950' : 'bg-blue-500 text-white'
                        }`}>
                          {refItem.urgency || 'URGENTE'}
                        </span>
                      </div>

                      <div className="mt-2 text-[10px] text-slate-200 bg-black/20 p-2 rounded-xl line-clamp-2">
                        "{refItem.report_details || (refItem.reasons || []).join('; ')}"
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleImportCivicReferral(refItem)}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <FileCheck size={14} /> Preencher FICAI Oficial com estes Dados
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ABA 1: HISTÓRICO DE FICAIS REGISTRADAS */}
      {currentTab === 'historico' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6 text-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <FileText size={18} className="text-emerald-600" /> Registro Geral de FICAIs Expedidas ao Conselho Tutelar
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                  Consulta, emissão de termos e acompanhamento de devolutivas do Conselho Tutelar
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-black uppercase text-gray-700 focus:outline-none"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="EXPEDIDA">Expedidas (Nova)</option>
                  <option value="EM_ACOMPANHAMENTO">Em Acompanhamento</option>
                  <option value="ALUNO_REINTEGRADO">Aluno Reintegrado</option>
                  <option value="ARQUIVADA">Arquivadas</option>
                </select>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar aluno ou protocolo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="py-4 px-4">Protocolo / Data</th>
                    <th className="py-4 px-4">Estudante / Turma</th>
                    <th className="py-4 px-4">Responsável / Fone</th>
                    <th className="py-4 px-4">Faltas</th>
                    <th className="py-4 px-4">Motivo ECA</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {ficaiRecords
                    .filter(rec => {
                      const matchesSearch =
                        rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        rec.protocolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        rec.className.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesStatus = statusFilter === 'TODOS' || rec.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map(rec => (
                      <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-black text-gray-900 block">{rec.protocolNumber}</span>
                          <span className="text-[9px] text-gray-500 font-bold">
                            {new Date(rec.expeditionDate).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-black text-gray-900 uppercase block">{rec.studentName}</span>
                          <span className="text-[9px] text-emerald-600 font-bold uppercase">{rec.className}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-800 font-bold block">{rec.guardianName}</span>
                          <span className="text-[9px] text-gray-500">{rec.guardianPhone}</span>
                        </td>
                        <td className="py-4 px-4 font-black text-red-600">{rec.absencesCount} Faltas</td>
                        <td className="py-4 px-4 max-w-xs truncate text-gray-600 font-semibold">
                          {rec.reasons.join(', ')}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${
                            rec.status === 'ALUNO_REINTEGRADO' ? 'bg-emerald-100 text-emerald-700' :
                            rec.status === 'EM_ACOMPANHAMENTO' ? 'bg-amber-100 text-amber-800' :
                            rec.status === 'ARQUIVADA' ? 'bg-gray-100 text-gray-600' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {rec.status === 'EXPEDIDA' ? 'Expedida' :
                             rec.status === 'EM_ACOMPANHAMENTO' ? 'Em Acompanhamento' :
                             rec.status === 'ALUNO_REINTEGRADO' ? 'Aluno Reintegrado' : 'Arquivada'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedRecordForView(rec)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-xl text-[9px] font-black uppercase transition-all"
                            title="Visualizar / Imprimir Ficha FICAI"
                          >
                            <Printer size={12} className="inline mr-1" /> Imprimir
                          </button>
                          <button
                            onClick={() => setRecordForDevolutiva(rec)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-xl text-[9px] font-black uppercase transition-all"
                            title="Registrar Devolutiva do Conselho Tutelar"
                          >
                            <MessageSquare size={12} className="inline mr-1" /> Devolutiva
                          </button>
                        </td>
                      </tr>
                    ))}

                  {ficaiRecords.length === 0 && !loadingRecords && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-400 font-bold uppercase text-xs">
                        Nenhuma Ficha FICAI expedida registrada até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: REGISTRAR NOVA FICAI */}
      {currentTab === 'nova' && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 text-gray-800 max-w-4xl mx-auto">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <Plus size={20} className="text-emerald-600" /> Formulário Oficial de Expedição de FICAI
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
              Registro formal para encaminhamento ao Conselho Tutelar (Art. 56, II do ECA)
            </p>
          </div>

          <form onSubmit={handleSubmitNewFicai} className="space-y-6">
            
            {/* Seção Protocolo & Aluno */}
            <div className="bg-gray-50 border border-gray-200/80 p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                    Número do Protocolo FICAI *
                  </label>
                  <input
                    type="text"
                    value={protocolNumber}
                    onChange={e => setProtocolNumber(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs font-black text-emerald-700"
                    required
                  />
                </div>

                <div className="sm:col-span-2 relative">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                    Selecionar Estudante *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite nome ou turma do aluno..."
                      value={studentSearch}
                      onChange={e => {
                        setStudentSearch(e.target.value);
                        setSelectedStudent(prev => ({ ...prev, name: e.target.value }));
                        setIsStudentDropdownOpen(true);
                      }}
                      onFocus={() => setIsStudentDropdownOpen(true)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <Search size={14} className="absolute right-3 top-3 text-gray-400" />
                  </div>

                  {/* Dropdown autocompletar */}
                  {isStudentDropdownOpen && filteredMasterStudents.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-100">
                      {filteredMasterStudents.map(st => (
                        <button
                          key={st.id || st.name}
                          type="button"
                          onClick={() => {
                            setSelectedStudent({
                              id: String(st.id || st.registration_number || ''),
                              name: st.name,
                              class: st.class || 'N/A',
                              guardian: (st as any).guardian_name || 'NÃO INFORMADO',
                              phone: (st as any).contact_phone || 'NÃO INFORMADO'
                            });
                            setStudentSearch(st.name);
                            setIsStudentDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-gray-800 block">{st.name}</span>
                            <span className="text-[9px] text-gray-500">Resp: {(st as any).guardian_name || 'N/A'}</span>
                          </div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-100/60 px-2 py-0.5 rounded">
                            {st.class}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Informações Complementares do Estudante */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Turma</label>
                  <input
                    type="text"
                    value={selectedStudent.class}
                    onChange={e => setSelectedStudent(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-xs font-bold text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Nome do Responsável</label>
                  <input
                    type="text"
                    value={selectedStudent.guardian}
                    onChange={e => setSelectedStudent(prev => ({ ...prev, guardian: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-xs font-bold text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Telefone Contato</label>
                  <input
                    type="text"
                    value={selectedStudent.phone}
                    onChange={e => setSelectedStudent(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-xs font-bold text-gray-900"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Motivo do ECA & Total de Faltas */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                  Motivo da Comunicação ao Conselho Tutelar (Art. 56, II do ECA) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-red-600 uppercase">Total Faltas:</span>
                  <input
                    type="number"
                    min="1"
                    value={absencesCount}
                    onChange={e => setAbsencesCount(parseInt(e.target.value) || 1)}
                    className="w-20 bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 text-xs font-black text-center text-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                {MOTIVOS_ECA.map(motivo => {
                  const checked = selectedReasons.includes(motivo);
                  return (
                    <button
                      key={motivo}
                      type="button"
                      onClick={() => toggleReason(motivo)}
                      className={`flex items-center gap-2 text-[10px] font-bold text-left p-2.5 rounded-xl transition-all ${
                        checked
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {checked ? <CheckSquare size={14} /> : <Square size={14} className="text-gray-400" />}
                      <span>{motivo}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Providências da Escola */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                Providências Prévia Adotadas pela Escola
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                {PROVIDENCIAS_ESCOLA.map(proc => {
                  const checked = selectedProcedures.includes(proc);
                  return (
                    <button
                      key={proc}
                      type="button"
                      onClick={() => toggleProcedure(proc)}
                      className={`flex items-center gap-2 text-[10px] font-bold text-left p-2.5 rounded-xl transition-all ${
                        checked
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {checked ? <CheckSquare size={14} /> : <Square size={14} className="text-gray-400" />}
                      <span>{proc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Relato / Justificativa */}
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                Relato Detalhado das Tentativas de Contato e Situação da Família
              </label>
              <textarea
                rows={4}
                placeholder="Descreva as datas das chamadas telefônicas, mensagens, visitas ou respostas obtidas dos responsáveis antes da expedição desta ficha..."
                value={detailsReport}
                onChange={e => setDetailsReport(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Responsável */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                  Responsável pelo Preenchimento
                </label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={e => setResponsibleName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-xs font-bold text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                  Data de Expedição
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString('pt-BR')}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCurrentTab('historico')}
                className="px-6 py-3.5 border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold uppercase text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Expedir Ficha FICAI
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL DE REGISTRO DE DEVOLUTIVA DO CONSELHO TUTELAR */}
      {recordForDevolutiva && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-[2rem] p-6 max-w-lg w-full shadow-2xl space-y-5 text-gray-800">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase">Registrar Devolutiva do Conselho Tutelar</h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">
                  Protocolo: {recordForDevolutiva.protocolNumber} • {recordForDevolutiva.studentName}
                </p>
              </div>
              <button onClick={() => setRecordForDevolutiva(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveDevolutiva} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                  Novo Status da Ficha FICAI
                </label>
                <select
                  value={devolutivaForm.newStatus}
                  onChange={e => setDevolutivaForm(prev => ({ ...prev, newStatus: e.target.value as any }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs font-black uppercase"
                >
                  <option value="EM_ACOMPANHAMENTO">Em Acompanhamento pelo Conselho</option>
                  <option value="ALUNO_REINTEGRADO">Aluno Reintegrado à Escola (Sucesso)</option>
                  <option value="ARQUIVADA">Arquivada</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                  Data do Retorno / Atendimento pelo Conselho
                </label>
                <input
                  type="date"
                  value={devolutivaForm.receivedDate}
                  onChange={e => setDevolutivaForm(prev => ({ ...prev, receivedDate: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                  Conselheiro(a) Responsável / Ofício de Resposta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conselheira Maria Silva / Ofício nº 42/2026"
                  value={devolutivaForm.counselorName}
                  onChange={e => setDevolutivaForm(prev => ({ ...prev, counselorName: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                  Medida / Devolutiva do Conselho Tutelar
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva as providências tomadas pelo Conselho Tutelar..."
                  value={devolutivaForm.actionTaken}
                  onChange={e => setDevolutivaForm(prev => ({ ...prev, actionTaken: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRecordForDevolutiva(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold uppercase text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs rounded-xl shadow-md"
                >
                  Salvar Devolutiva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO E IMPRESSÃO OFICIAL FICAI */}
      {selectedRecordForView && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 max-w-4xl w-full shadow-2xl my-8 text-gray-900 relative">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6 no-print">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-600" />
                <h3 className="text-sm font-black uppercase">Ficha FICAI - Protocolo {selectedRecordForView.protocolNumber}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-md hover:bg-emerald-700"
                >
                  <Printer size={16} /> Imprimir Ficha Oficial ECA
                </button>
                <button
                  onClick={() => setSelectedRecordForView(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* DOCUMENTO IMPRESSO TIMBRADO */}
            <div ref={printRef} className="p-6 bg-white space-y-6 text-gray-900 font-sans border-2 border-black rounded-xl">
              <div className="text-center border-b-2 border-black pb-4">
                <h1 className="text-base font-black uppercase">GOVERNO DO ESTADO DE MATO GROSSO</h1>
                <h2 className="text-xs font-bold uppercase">SECRETARIA DE ESTADO DE EDUCAÇÃO - SEDUC/MT</h2>
                <h3 className="text-xs font-bold uppercase">E.E. ANDRÉ ANTÔNIO MAGGI - COLÍDER/MT</h3>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-emerald-800">
                  FICAI - FICHA DE COMUNICAÇÃO DE ALUNO INFREQUENTE
                </p>
                <p className="text-[9px] font-semibold italic text-gray-600">
                  Base Legal: Estatuto da Criança e do Adolescente (ECA) - Lei Nº 8.069/1990, Art. 56, Inciso II
                </p>
              </div>

              {/* Protocolo */}
              <div className="flex justify-between items-center text-xs font-bold border-b border-black pb-2">
                <span>PROTOCOLO: {selectedRecordForView.protocolNumber}</span>
                <span>DATA DE EXPEDIÇÃO: {new Date(selectedRecordForView.expeditionDate).toLocaleDateString('pt-BR')}</span>
              </div>

              {/* Seção 1: Identificação da Escola */}
              <div className="border border-black p-3 rounded text-xs space-y-1">
                <h4 className="font-black uppercase text-[10px]">1. UNIDADE ESCOLAR EMISSORA</h4>
                <p><strong>ESCOLA:</strong> E.E. ANDRÉ ANTÔNIO MAGGI • <strong>MUNICÍPIO:</strong> COLÍDER - MT</p>
                <p><strong>ENDEREÇO:</strong> AVENIDA BORBA GATO, Nº 80, CENTRO</p>
              </div>

              {/* Seção 2: Identificação do Aluno */}
              <div className="border border-black p-3 rounded text-xs space-y-2">
                <h4 className="font-black uppercase text-[10px]">2. IDENTIFICAÇÃO DO ESTUDANTE E RESPONSÁVEIS</h4>
                <div className="grid grid-cols-2 gap-2">
                  <p><strong>NOME DO ALUNO:</strong> {selectedRecordForView.studentName}</p>
                  <p><strong>TURMA / SÉRIE:</strong> {selectedRecordForView.className}</p>
                  <p><strong>NOME DO RESPONSÁVEL:</strong> {selectedRecordForView.guardianName}</p>
                  <p><strong>TELEFONE CONTATO:</strong> {selectedRecordForView.guardianPhone}</p>
                </div>
              </div>

              {/* Seção 3: Faltas e Motivo ECA */}
              <div className="border border-black p-3 rounded text-xs space-y-2">
                <h4 className="font-black uppercase text-[10px]">3. MOTIVO DA COMUNICAÇÃO E TOTAL DE FALTAS</h4>
                <p className="font-bold text-red-700">TOTAL DE FALTAS ACUMULADAS: {selectedRecordForView.absencesCount} Faltas Injustificadas</p>
                <div className="space-y-1">
                  <p className="font-bold">Fundamentação ECA:</p>
                  {selectedRecordForView.reasons.map((r, i) => (
                    <p key={i}>• {r}</p>
                  ))}
                </div>
              </div>

              {/* Seção 4: Providências Escolares */}
              <div className="border border-black p-3 rounded text-xs space-y-1">
                <h4 className="font-black uppercase text-[10px]">4. PROVIDÊNCIAS PRÉVIAS ADOTADAS PELA ESCOLA</h4>
                {selectedRecordForView.schoolProcedures.map((p, i) => (
                  <p key={i}>✓ {p}</p>
                ))}
              </div>

              {/* Seção 5: Relato das Intervenções */}
              <div className="border border-black p-3 rounded text-xs space-y-1">
                <h4 className="font-black uppercase text-[10px]">5. RELATO DAS TENTATIVAS DE CONTATO E INTERVENÇÃO</h4>
                <p className="whitespace-pre-wrap leading-relaxed">{selectedRecordForView.detailsReport}</p>
              </div>

              {/* Seção Devolutiva do Conselho */}
              {selectedRecordForView.conselhoDevolutiva && (
                <div className="border border-black p-3 rounded text-xs space-y-1 bg-gray-50">
                  <h4 className="font-black uppercase text-[10px]">6. DEVOLUTIVA / PROVIDÊNCIAS DO CONSELHO TUTELAR</h4>
                  <p><strong>DATA RECEBIMENTO:</strong> {selectedRecordForView.conselhoDevolutiva.receivedDate ? new Date(selectedRecordForView.conselhoDevolutiva.receivedDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  <p><strong>RESPONSÁVEL DO CONSELHO:</strong> {selectedRecordForView.conselhoDevolutiva.counselorName}</p>
                  <p><strong>MEDIDA ADOTADA:</strong> {selectedRecordForView.conselhoDevolutiva.actionTaken}</p>
                </div>
              )}

              {/* Assinaturas */}
              <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
                <div>
                  <div className="border-t border-black pt-1">
                    <strong>{selectedRecordForView?.responsibleName || 'EQUIPE BUSCA ATIVA ESCOLAR'}</strong>
                    <p className="text-[10px]">Equipe de Busca Ativa / Direção Escolar</p>
                  </div>
                </div>
                <div>
                  <div className="border-t border-black pt-1">
                    <strong>CONSELHO TUTELAR DE COLÍDER - MT</strong>
                    <p className="text-[10px]">Data e Assinatura do Conselheiro(a)</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default BuscaAtivaFICAI;
