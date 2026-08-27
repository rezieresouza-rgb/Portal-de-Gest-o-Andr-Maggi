import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Save,
  Printer,
  Scale,
  User,
  GraduationCap,
  AlertTriangle,
  FileText,
  CheckSquare,
  Square,
  ShieldAlert,
  Loader2,
  Users,
  Search,
  MessageSquare,
  Send
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import { INITIAL_STUDENTS } from '../constants/initialData';
import { User as UserType } from '../types';

interface CivicMediationReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialStudent?: {
    id?: string;
    name: string;
    class: string;
  };
  initialReport?: string;
  user?: UserType;
}

const REASON_OPTIONS = [
  'Conflito / Desentendimento entre Pares',
  'Bullying / Cyberbullying',
  'Indisciplina Reincidente em Sala / Pátio',
  'Dificuldade de Convivência e Respeito às Regras',
  'Agressividade Verbal ou Física',
  'Intimidação ou Ameaças',
  'Outro Motivo Comportamental'
];

const PREVIOUS_PROCEDURES = [
  'Orientação e Escuta Verbal da Monitoria',
  'Registro de Fato Observado',
  'Aplicação de Demérito / Perda de Pontos de Atitude',
  'Notificação / Contato Telefônico com Responsáveis',
  'Reunião Presencial com Responsáveis realizada',
  'Advertência Formal Aplicada',
  'Encaminhamento para Estudo Orientado'
];

export const CivicMediationReferralModal: React.FC<CivicMediationReferralModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStudent,
  initialReport,
  user
}) => {
  const { students: dbStudents } = useStudents();
  const printRef = useRef<HTMLDivElement>(null);

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    class: string;
  }>({
    id: initialStudent?.id || '',
    name: initialStudent?.name || '',
    class: initialStudent?.class || ''
  });

  const [priority, setPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA' | 'CRÍTICA'>('MEDIA');
  const [reasonCategory, setReasonCategory] = useState(REASON_OPTIONS[0]);
  const [involvedParties, setInvolvedParties] = useState('');
  const [adoptedProcedures, setAdoptedProcedures] = useState<string[]>([]);
  const [report, setReport] = useState(initialReport || '');
  const [responsibleName, setResponsibleName] = useState(user?.name || 'MONITORIA CÍVICO-MILITAR');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  // Unifica a lista de estudantes disponíveis
  const masterStudents = useMemo(() => {
    const combined = [...dbStudents];
    INITIAL_STUDENTS.forEach(initS => {
      if (!combined.some(s => String(s.registration_number || s.id) === String(initS.CodigoAluno))) {
        combined.push({
          id: String(initS.CodigoAluno),
          registration_number: String(initS.CodigoAluno),
          name: initS.Nome,
          class: initS.Turma,
          status: 'ATIVO'
        });
      }
    });
    return combined;
  }, [dbStudents]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch || studentSearch.length < 2) return [];
    return masterStudents.filter(s =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.class && s.class.toLowerCase().includes(studentSearch.toLowerCase()))
    ).slice(0, 6);
  }, [studentSearch, masterStudents]);

  useEffect(() => {
    if (initialStudent) {
      setSelectedStudent({
        id: initialStudent.id || '',
        name: initialStudent.name,
        class: initialStudent.class
      });
      setStudentSearch(initialStudent.name);
    }
  }, [initialStudent]);

  useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
    }
  }, [initialReport]);

  if (!isOpen) return null;

  const toggleProcedure = (proc: string) => {
    setAdoptedProcedures(prev =>
      prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent.name) {
      alert('Por favor, selecione ou informe o nome do aluno.');
      return;
    }
    if (!report.trim()) {
      alert('Por favor, informe a justificativa/relato do encaminhamento.');
      return;
    }

    setIsSubmitting(true);

    try {
      const todayDate = new Date().toLocaleDateString('sv-SE');
      const nowTimestamp = Date.now();
      const referralId = `civic-ref-${nowTimestamp}`;

      const fullReportText = `[ORIGEM: CÍVICO-MILITAR] [Enviado por: ${responsibleName}]\nPrioridade: ${priority}\nMotivo: ${reasonCategory}\nOutras Partes Envolvidas: ${involvedParties || 'Nenhuma'}\n\nRelato do Incidente/Fato:\n${report}`;

      // 1. Inserir em psychosocial_referrals (Encaminhamento para Mediação)
      const referralPayload = {
        id: referralId,
        school_unit: 'E.E. ANDRÉ ANTÔNIO MAGGI',
        student_name: selectedStudent.name,
        student_age: 'Não informado',
        class_name: selectedStudent.class || 'N/A',
        teacher_name: responsibleName,
        previous_strategies: adoptedProcedures.join('; ') || 'Acompanhamento Cívico-Militar',
        attendance_frequency: '100%',
        adopted_procedures: adoptedProcedures,
        observations: {
          learning: [],
          behavioral: [reasonCategory],
          emotional: []
        },
        report: fullReportText,
        status: 'AGUARDANDO_TRIAGEM',
        priority: priority === 'CRÍTICA' ? 'ALTA' : priority,
        date: todayDate,
        timestamp: nowTimestamp,
        referral_destination: 'MEDIACAO',
        mediation_procedures: []
      };

      const { error: refError } = await supabase
        .from('psychosocial_referrals')
        .insert([referralPayload]);

      if (refError) {
        console.warn('Falha ao salvar no Supabase (psychosocial_referrals), usando fallback local:', refError);
      }

      // 2. Inserir diretamente um caso ativo na tabela mediation_cases (para a equipe da mediação)
      const mediationCasePayload = {
        id: `case-${nowTimestamp}`,
        student_id: selectedStudent.id || `std-${nowTimestamp}`,
        student_name: selectedStudent.name,
        class_name: selectedStudent.class || 'N/A',
        type: reasonCategory.includes('Bullying') ? 'BULLYING' : reasonCategory.includes('Conflito') ? 'CONFLITO' : 'DISCIPLINAR',
        severity: priority === 'CRÍTICA' ? 'CRÍTICA' : priority,
        status: 'ABERTURA',
        opened_at: todayDate,
        description: fullReportText,
        involved_parties: involvedParties ? involvedParties.split(',').map(p => p.trim()) : [responsibleName],
        teacher_name: responsibleName.toUpperCase().includes('CÍVICO') || responsibleName.toUpperCase().includes('MILITAR') ? responsibleName : `EQUIPE CÍVICO-MILITAR (${responsibleName})`,
        created_by: `EQUIPE CÍVICO-MILITAR (${responsibleName})`,
        steps: [
          { id: 'A', label: 'Encaminhamento Cívico-Militar Recebido', completed: true, date: todayDate },
          { id: 'B', label: 'Escuta das Partes', completed: false },
          { id: 'C', label: 'Comunicação com Pais e Responsáveis', completed: false },
          { id: 'D', label: 'Sessão / Círculo de Mediação de Paz', completed: false },
          { id: 'E', label: 'Termo de Acordo / Finalização', completed: false }
        ],
        logs: [
          {
            id: `log-${nowTimestamp}`,
            date: todayDate,
            professional: `MONITORIA CÍVICO-MILITAR (${responsibleName})`,
            content: `Encaminhamento criado via Módulo Cívico-Militar por ${responsibleName}. Motivo: ${reasonCategory}.`
          }
        ],
        origin_referral_id: referralId
      };

      const { error: caseError } = await supabase
        .from('mediation_cases')
        .insert([mediationCasePayload]);

      if (caseError) {
        console.warn('Falha ao salvar caso em mediation_cases:', caseError);
      }

      // 3. Notificar a equipe da Mediação
      try {
        await supabase.from('psychosocial_notifications').insert([
          {
            title: 'Novo Encaminhamento para Mediação (Cívico-Militar)',
            message: `O monitor/gestor ${responsibleName} encaminhou o aluno ${selectedStudent.name} (${selectedStudent.class}) para Mediação Escolar. Motivo: ${reasonCategory}.`,
            is_read: false,
            created_at: new Date().toISOString()
          }
        ]);
      } catch (e) {
        console.warn('Erro ao notificar mediação:', e);
      }

      // Fallback em LocalStorage para resiliência offline
      const civicMediationHistory = JSON.parse(localStorage.getItem('civic_militar_mediacoes_v1') || '[]');
      civicMediationHistory.unshift({
        id: referralId,
        studentName: selectedStudent.name,
        className: selectedStudent.class,
        date: todayDate,
        priority,
        reasonCategory,
        involvedParties,
        responsibleName,
        report,
        status: 'EM_TRIAGEM'
      });
      localStorage.setItem('civic_militar_mediacoes_v1', JSON.stringify(civicMediationHistory));

      alert(`Encaminhamento de ${selectedStudent.name} para a Mediação Escolar registrado com sucesso!`);
      if (onSuccess) onSuccess();
      onClose();

    } catch (err: any) {
      console.error('Erro ao registrar encaminhamento:', err);
      alert('Ocorreu um erro ao salvar o encaminhamento. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-slate-800">
        
        {/* Header (Fixo) */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b border-slate-100 shrink-0 bg-slate-50/50 rounded-t-[2.5rem]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-amber-500/20 shrink-0">
              <Scale size={24} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                Encaminhamento para Mediação Escolar
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Gestão Cívico-Militar • E.E. André Antônio Maggi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          {/* Corpo do Formulário com Scroll Próprio */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
            
            {/* Seção 1: Identificação do Aluno */}
            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                <User size={16} className="text-blue-600" /> Identificação do Estudante
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 relative">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Nome do Aluno *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite para buscar aluno..."
                      value={studentSearch}
                      onChange={e => {
                        setStudentSearch(e.target.value);
                        setSelectedStudent(prev => ({ ...prev, name: e.target.value }));
                        setIsStudentDropdownOpen(true);
                      }}
                      onFocus={() => setIsStudentDropdownOpen(true)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Search size={14} className="absolute right-3 top-3 text-slate-400" />
                  </div>

                  {/* Dropdown autocompletar */}
                  {isStudentDropdownOpen && filteredStudents.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredStudents.map(st => (
                        <button
                          key={st.id || st.name}
                          type="button"
                          onClick={() => {
                            setSelectedStudent({
                              id: String(st.id || st.registration_number || ''),
                              name: st.name,
                              class: st.class || 'N/A'
                            });
                            setStudentSearch(st.name);
                            setIsStudentDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex justify-between items-center text-xs"
                        >
                          <span className="font-bold text-slate-800">{st.name}</span>
                          <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-100/60 px-2 py-0.5 rounded">
                            {st.class}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Turma *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 8º Ano A"
                    value={selectedStudent.class}
                    onChange={e => setSelectedStudent(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Motivo e Nível de Urgência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Motivo Principal do Encaminhamento *
                </label>
                <select
                  value={reasonCategory}
                  onChange={e => setReasonCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {REASON_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Nível de Prioridade / Urgência *
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs font-black uppercase focus:outline-none focus:ring-2 ${
                    priority === 'CRÍTICA' ? 'bg-red-50 text-red-700 border-red-300 focus:ring-red-500' :
                    priority === 'ALTA' ? 'bg-orange-50 text-orange-700 border-orange-300 focus:ring-orange-500' :
                    priority === 'MEDIA' ? 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500' :
                    'bg-blue-50 text-blue-700 border-blue-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="BAIXA">Baixa (Acompanhamento de Convivência)</option>
                  <option value="MEDIA">Média (Conflito Pontual em Sala/Pátio)</option>
                  <option value="ALTA">Alta (Conflito Recorrente / Reincidente)</option>
                  <option value="CRÍTICA">Crítica (Risco ou Agressão Grave)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                Outras Partes Envolvidas (Outros Alunos, Turmas ou Servidores)
              </label>
              <input
                type="text"
                placeholder="Ex: Aluno João Silva (7º B), Aluna Maria (8º A)..."
                value={involvedParties}
                onChange={e => setInvolvedParties(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Seção 3: Procedimentos Já Adotados */}
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                Ações Prévias Adotadas pela Monitoria Cívico-Militar
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {PREVIOUS_PROCEDURES.map(proc => {
                  const checked = adoptedProcedures.includes(proc);
                  return (
                    <button
                      key={proc}
                      type="button"
                      onClick={() => toggleProcedure(proc)}
                      className={`flex items-center gap-2 text-[10px] font-bold text-left p-2.5 rounded-lg transition-all ${
                        checked
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {checked ? <CheckSquare size={14} className="shrink-0" /> : <Square size={14} className="text-slate-400 shrink-0" />}
                      <span className="leading-tight">{proc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seção 4: Relato Detalhado */}
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                Relato Detalhado do Incidente / Justificativa para Mediação *
              </label>
              <textarea
                rows={3}
                placeholder="Descreva detalhadamente o ocorrido, antecedentes, comportamento do estudante e motivo específico da necessidade de intervenção por Mediação de Conflitos..."
                value={report}
                onChange={e => setReport(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                required
              />
            </div>

            {/* Seção 5: Responsável pelo Encaminhamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Responsável pelo Encaminhamento
                </label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={e => setResponsibleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Data do Registro
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString('pt-BR')}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions (Fixo) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-200 shrink-0 rounded-b-[2.5rem]">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-black uppercase text-[10px] tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer size={15} /> Imprimir Termo Formal
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 sm:w-auto px-5 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-700 hover:to-amber-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Registrando...
                  </>
                ) : (
                  <>
                    <Send size={15} /> Enviar para Mediação
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modelo Oculto de Impressão Formal */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-8 text-black font-sans">
        <div ref={printRef} className="max-w-2xl mx-auto space-y-6">
          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-base font-black uppercase">GOVERNO DO ESTADO DE MATO GROSSO</h1>
            <h2 className="text-sm font-bold uppercase">SECRETARIA DE ESTADO DE EDUCAÇÃO - SEDUC/MT</h2>
            <h3 className="text-xs font-bold uppercase">E.E. ANDRÉ ANTÔNIO MAGGI - ESCOLA CÍVICO-MILITAR</h3>
            <p className="text-[10px] mt-1">TERMO FORMAL DE ENCAMINHAMENTO À MEDIAÇÃO ESCOLAR DE CONFLITOS</p>
          </div>

          <div className="space-y-2 text-xs">
            <p><strong>ESTUDANTE:</strong> {selectedStudent.name}</p>
            <p><strong>TURMA:</strong> {selectedStudent.class}</p>
            <p><strong>DATA:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>MOTIVO PRINCIPAL:</strong> {reasonCategory}</p>
            <p><strong>PRIORIDADE:</strong> {priority}</p>
            {involvedParties && <p><strong>OUTRAS PARTES:</strong> {involvedParties}</p>}
          </div>

          <div className="border-t border-b border-black py-3 text-xs space-y-1">
            <p className="font-bold uppercase">Procedimentos Prévios Adotados:</p>
            <p>{adoptedProcedures.join(', ') || 'Acompanhamento pela Monitoria Cívico-Militar.'}</p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold uppercase">Relato do Incidente / Fato Gerador:</p>
            <div className="p-3 border border-black min-h-[120px] whitespace-pre-wrap">
              {report}
            </div>
          </div>

          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-t border-black pt-1">
                <strong>{responsibleName}</strong>
                <p className="text-[10px]">Monitoria / Gestão Cívico-Militar</p>
              </div>
            </div>
            <div>
              <div className="border-t border-black pt-1">
                <strong>Recebido por: Mediação Escolar</strong>
                <p className="text-[10px]">Data e Assinatura do Mediador</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
