import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Save,
  Printer,
  FileText,
  CheckSquare,
  Square,
  ShieldAlert,
  Loader2,
  Users,
  Send,
  AlertTriangle,
  BookOpen,
  Info
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import { INITIAL_STUDENTS } from '../constants/initialData';
import { User as UserType } from '../types';

export interface CivicFicaiReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialStudent?: {
    id?: string;
    name: string;
    class: string;
    guardian?: string;
    phone?: string;
  };
  initialReport?: string;
  user?: UserType;
}

const MOTIVOS_ECA_DEFAULT = [
  'Reiteração de Graves Atos de Indisciplina e Descumprimento de TACE (Art. 56, III ECA)',
  'Infrequência Injustificada Superior a 10% / Faltas Reiteradas (Art. 56, II ECA)',
  '5 ou Mais Faltas Consecutivas sem Justificativa',
  'Suspeita de Evasão / Abandono Escolar',
  'Conflitos Graves, Agressão ou Ameaça no Ambiente Escolar',
  'Suspeita de Violação de Direitos / Vulnerabilidade Familiar (Art. 56, I ECA)',
  'Recusa dos Responsáveis em Comparecer à Escola / Assinar Termos (Art. 26 EECM)'
];

const PROVIDENCIAS_ESCOLA_DEFAULT = [
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

export const CivicFicaiReferralModal: React.FC<CivicFicaiReferralModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStudent,
  initialReport,
  user
}) => {
  const { students: dbStudents } = useStudents();
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    class: string;
    guardian: string;
    phone: string;
  }>({
    id: initialStudent?.id || '',
    name: initialStudent?.name || '',
    class: initialStudent?.class || '',
    guardian: initialStudent?.guardian || '',
    phone: initialStudent?.phone || ''
  });

  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENTE' | 'CRÍTICA'>('URGENTE');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([MOTIVOS_ECA_DEFAULT[0]]);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([
    PROVIDENCIAS_ESCOLA_DEFAULT[0],
    PROVIDENCIAS_ESCOLA_DEFAULT[1],
    PROVIDENCIAS_ESCOLA_DEFAULT[5],
    PROVIDENCIAS_ESCOLA_DEFAULT[9]
  ]);
  const [report, setReport] = useState(initialReport || '');
  const [responsibleName, setResponsibleName] = useState(user?.name || 'MONITORIA / GESTÃO CÍVICO-MILITAR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincroniza initialStudent caso mude
  React.useEffect(() => {
    if (initialStudent) {
      setSelectedStudent({
        id: initialStudent.id || '',
        name: initialStudent.name || '',
        class: initialStudent.class || '',
        guardian: initialStudent.guardian || '',
        phone: initialStudent.phone || ''
      });
    }
    if (initialReport) {
      setReport(initialReport);
    }
  }, [initialStudent, initialReport]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent.name) {
      alert('Por favor, confirme os dados do estudante.');
      return;
    }
    if (selectedReasons.length === 0) {
      alert('Selecione ao menos um motivo do ECA para fundamentar a expedição da FICAI.');
      return;
    }

    setIsSubmitting(true);
    try {
      const todayDate = new Date().toLocaleDateString('pt-BR');
      const referralId = `ficai-ref-${Date.now()}`;

      const payload = {
        id: referralId,
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
        class_name: selectedStudent.class,
        guardian_name: selectedStudent.guardian || 'NÃO INFORMADO',
        guardian_phone: selectedStudent.phone || 'NÃO INFORMADO',
        urgency,
        reasons: selectedReasons,
        adopted_procedures: selectedProcedures,
        report_details: report,
        responsible_name: responsibleName,
        origin_module: 'CIVICO_MILITAR',
        status: 'PENDENTE_BUSCA_ATIVA',
        created_at: new Date().toISOString(),
        forwarded_date: todayDate
      };

      // 1. Salva no Supabase (se a tabela existir)
      try {
        await supabase.from('busca_ativa_ficai_referrals').insert([payload]);
      } catch (err) {
        console.warn('Tabela busca_ativa_ficai_referrals não disponível, persistindo em localStorage:', err);
      }

      // 2. Persiste em LocalStorage para garantir sincronização instantânea com a Busca Ativa
      const pendingReferrals = JSON.parse(localStorage.getItem('busca_ativa_ficai_referrals_v1') || '[]');
      pendingReferrals.unshift(payload);
      localStorage.setItem('busca_ativa_ficai_referrals_v1', JSON.stringify(pendingReferrals));

      // 3. Notificação do sistema
      try {
        await supabase.from('psychosocial_notifications').insert([
          {
            title: 'Nova Solicitação de FICAI (Cívico-Militar)',
            message: `A Gestão Militar encaminhou o discente ${selectedStudent.name} (${selectedStudent.class}) para expedição de FICAI na Busca Ativa. Motivo principal: ${selectedReasons[0]}.`,
            is_read: false,
            created_at: new Date().toISOString()
          }
        ]);
      } catch (e) {
        console.warn('Erro ao disparar notificação:', e);
      }

      alert(`✅ Solicitação de FICAI encaminhada com sucesso para a equipe da Busca Ativa!\n\nEstudante: ${selectedStudent.name}\nA equipe da Busca Ativa receberá a notificação na Central FICAI.`);
      if (onSuccess) onSuccess();
      onClose();

    } catch (err) {
      console.error('Erro ao encaminhar solicitação de FICAI:', err);
      alert('Ocorreu um erro ao salvar o encaminhamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 my-auto">
        
        {/* Header do Modal */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-900 flex items-center justify-center text-rose-300 border border-rose-700/40 shadow-md">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Encaminhar para Busca Ativa (Expedição de FICAI)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-800">
                  Art. 56 do ECA
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Ponte Cívico-Militar ➔ Equipe da Busca Ativa • Indisciplina Reiterada & Infrequência
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informações do Discente */}
        <div className="my-4 p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shrink-0">
          <div>
            <span className="text-[9px] font-black uppercase text-rose-400 block mb-0.5">Discente sob Apuração</span>
            <div className="text-sm font-black text-rose-950 uppercase">{selectedStudent.name || 'Estudante Não Identificado'}</div>
            <div className="text-[10px] text-rose-700 font-mono mt-0.5">
              Matrícula: {selectedStudent.id || '---'} • Turma: <span className="font-bold">{selectedStudent.class || 'Não informada'}</span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[9px] font-black uppercase text-rose-400 block mb-0.5">Responsável Legal</span>
            <div className="text-[11px] font-bold text-rose-900 uppercase flex items-center gap-1">
              <Users size={12} className="text-rose-600" /> {selectedStudent.guardian || 'Responsável não informado'}
            </div>
            <div className="text-[10px] text-rose-700 font-mono">Contato: {selectedStudent.phone || '---'}</div>
          </div>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          
          {/* Nível de Urgência */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              Grau de Urgência do Encaminhamento
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['NORMAL', 'URGENTE', 'CRÍTICA'] as const).map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    urgency === u
                      ? u === 'CRÍTICA' ? 'bg-red-600 text-white border-red-600 shadow-md' : u === 'URGENTE' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {u === 'CRÍTICA' ? '🚨 Crítica / Imediata' : u === 'URGENTE' ? '⚠️ Urgente' : '🟡 Normal'}
                </button>
              ))}
            </div>
          </div>

          {/* Motivos do ECA */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              Motivos da Notificação ao Conselho Tutelar / ECA (Selecione todos que se aplicam)
            </label>
            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {MOTIVOS_ECA_DEFAULT.map(reason => {
                const isSelected = selectedReasons.includes(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => toggleReason(reason)}
                    className={`w-full text-left p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-xs'
                        : 'text-slate-700 hover:bg-white border border-transparent'
                    }`}
                  >
                    {isSelected ? <CheckSquare size={16} className="text-rose-700 shrink-0" /> : <Square size={16} className="text-slate-400 shrink-0" />}
                    <span className="leading-tight">{reason}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Providências da Escola */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              Providências Pedagógicas e Disciplinares já Realizadas pelo Cívico-Militar
            </label>
            <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {PROVIDENCIAS_ESCOLA_DEFAULT.map(proc => {
                const isSelected = selectedProcedures.includes(proc);
                return (
                  <button
                    key={proc}
                    type="button"
                    onClick={() => toggleProcedure(proc)}
                    className={`w-full text-left p-2 rounded-xl text-[10px] font-bold flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'text-slate-600 hover:bg-white border border-transparent'
                    }`}
                  >
                    {isSelected ? <CheckSquare size={14} className="text-blue-700 shrink-0" /> : <Square size={14} className="text-slate-400 shrink-0" />}
                    <span>{proc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Relatório Detalhado */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              Relatório Circunstanciado do Cívico-Militar para Instrução da FICAI
            </label>
            <textarea
              value={report}
              onChange={e => setReport(e.target.value)}
              placeholder="Descreva o histórico disciplinar, faltas reiteradas, recusa familiar ou quebra de TACE para subsidiar a equipe da Busca Ativa..."
              rows={4}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              Responsável pelo Encaminhamento (Monitor / Gestão GEM)
            </label>
            <input
              type="text"
              value={responsibleName}
              onChange={e => setResponsibleName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800"
              required
            />
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
            <div className="text-[9px] text-slate-400 font-bold uppercase">
              A Busca Ativa receberá a notificação para emissão e protocolo junto ao Conselho Tutelar
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white flex items-center gap-2 transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Enviar para Busca Ativa
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
