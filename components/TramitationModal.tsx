import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ShieldCheck,
  HeartHandshake,
  Search,
  UserCheck,
  FileText,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from './Toast';
import {
  PedagogicalOccurrence,
  OccurrenceTramitation,
  TramitationSector,
  TramitationPriority,
  User
} from '../types';

interface TramitationModalProps {
  occurrence: PedagogicalOccurrence;
  currentSector: TramitationSector;
  user: User;
  onClose: () => void;
  onSuccess?: () => void;
}

const SECTOR_LABELS: Record<TramitationSector, { name: string; color: string; icon: any }> = {
  PROFESSOR: { name: 'Área do Professor', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: FileText },
  CIVICO_MILITAR: { name: 'Cívico-Militar (Disciplina)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: ShieldCheck },
  MEDIACAO: { name: 'Mediação Escolar', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: HeartHandshake },
  BUSCA_ATIVA: { name: 'Busca Ativa (Frequência)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Search },
  PSICOSSOCIAL: { name: 'Equipe Psicossocial', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: UserCheck }
};

export const TramitationModal: React.FC<TramitationModalProps> = ({
  occurrence,
  currentSector,
  user,
  onClose,
  onSuccess
}) => {
  const { addToast } = useToast();
  const [history, setHistory] = useState<OccurrenceTramitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'forward' | 'feedback'>('timeline');

  // Form states for forwarding
  const [targetSector, setTargetSector] = useState<TramitationSector>('CIVICO_MILITAR');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<TramitationPriority>('MEDIA');

  // Form states for feedback
  const [feedbackText, setFeedbackText] = useState('');
  const [closingStatus, setClosingStatus] = useState<'EM_ATENDIMENTO' | 'CONCLUIDO' | 'DEVOLVIDO'>('EM_ATENDIMENTO');

  const fetchTramitationHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('occurrence_tramitations')
        .select('*')
        .eq('occurrence_id', occurrence.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn("Tabela occurrence_tramitations não encontrada ou inacessível:", error.message);
        setHistory([]);
      } else {
        setHistory(data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar histórico de tramitação:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTramitationHistory();
  }, [occurrence.id]);

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast('Descreva o motivo do encaminhamento.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const newTramitation = {
        occurrence_id: occurrence.id,
        from_sector: currentSector,
        to_sector: targetSector,
        tramitated_by: user.id,
        tramitated_by_name: user.name,
        reason: reason.trim(),
        priority,
        status: 'PENDENTE',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('occurrence_tramitations').insert([newTramitation]);

      if (error) {
        console.warn("Inserindo no Supabase falhou:", error.message);
      }

      // Se o destino for a Mediação Escolar, criar também na tabela mediation_cases para aparecer no Módulo de Mediação
      if (targetSector === 'MEDIACAO') {
        const activeResponsible = `COORDENAÇÃO PEDAGÓGICA (${user?.name || 'COORDENADOR'})`;
        const fullDesc = `[ENCAMINHAMENTO DA COORDENAÇÃO PEDAGÓGICA] [Enviado por: ${user?.name || 'Coordenação'}]\nMotivo: ${reason.trim()}\n\nRelato Original do Fato: ${occurrence.description || ''}`;

        const { error: caseErr } = await supabase.from('mediation_cases').insert([{
          student_id: occurrence.student_id || occurrence.id || 'N/A',
          student_name: occurrence.student_name || (occurrence as any).studentName || 'Estudante',
          class_name: occurrence.class_name || (occurrence as any).className || 'Turma N/A',
          type: 'CONFLITO',
          severity: priority === 'CRITICA' ? 'CRÍTICA' : (priority === 'ALTA' ? 'ALTA' : 'MÉDIA'),
          status: 'ABERTURA',
          opened_at: new Date().toISOString().split('T')[0],
          description: fullDesc,
          involved_parties: [user?.name || 'Coordenação'],
          origin_referral_id: occurrence.id,
          steps: [
            { id: '1', label: 'Encaminhado pela Coordenação Pedagógica', completed: true, date: new Date().toLocaleDateString('pt-BR') },
            { id: '2', label: 'Escuta das Partes / Acolhimento', completed: false },
            { id: '3', label: 'Círculo de Mediação / Paz', completed: false },
            { id: '4', label: 'Acordo / Finalização', completed: false }
          ]
        }]);

        if (caseErr) {
          console.warn('Aviso ao inserir em mediation_cases:', caseErr.message);
        }

        await supabase.from('psychosocial_notifications').insert([{
          title: 'Encaminhamento para Mediação (Coordenação Pedagógica)',
          message: `A Coordenação Pedagógica (${user?.name || 'Equipe'}) encaminhou o aluno ${occurrence.student_name} (${occurrence.class_name}) para a Mediação.`,
          is_read: false,
          created_at: new Date().toISOString()
        }]);
      }

      await supabase
        .from('occurrences')
        .update({
          current_sector: targetSector,
          tramitation_status: 'EM_TRAMITACAO'
        })
        .eq('id', occurrence.id);

      addToast(`Ocorrência encaminhada com sucesso para ${SECTOR_LABELS[targetSector].name}!`, 'success');
      await fetchTramitationHistory();
      setActiveTab('timeline');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      addToast('Erro ao encaminhar ocorrência: ' + (err.message || 'Erro inesperado'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      addToast('Digite o parecer ou devolutiva institucional.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const pendingItem = history.find(h => h.to_sector === currentSector && h.status !== 'CONCLUIDO');

      if (pendingItem) {
        await supabase
          .from('occurrence_tramitations')
          .update({
            feedback: feedbackText.trim(),
            status: closingStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', pendingItem.id);
      } else {
        await supabase.from('occurrence_tramitations').insert([{
          occurrence_id: occurrence.id,
          from_sector: currentSector,
          to_sector: currentSector,
          tramitated_by: user.id,
          tramitated_by_name: user.name,
          reason: 'Devolutiva / Parecer Técnico',
          priority: 'MEDIA',
          status: closingStatus,
          feedback: feedbackText.trim(),
          created_at: new Date().toISOString()
        }]);
      }

      addToast('Devolutiva registrada com sucesso!', 'success');
      setFeedbackText('');
      await fetchTramitationHistory();
      setActiveTab('timeline');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      addToast('Erro ao salvar devolutiva: ' + (err.message || 'Erro inesperado'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-3xl w-full p-6 md:p-8 space-y-6 text-white shadow-2xl relative my-8">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="flex justify-between items-start border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                Protocolo de Tramitação Intersetorial
              </h3>
              <p className="text-xs text-white/60 font-medium">
                Estudante: <strong className="text-white">{occurrence.involvedStudents}</strong> | Turma: <strong>{occurrence.className}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* DETALHES DA OCORRÊNCIA ORIGINAL */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="font-black text-blue-400 uppercase tracking-widest">
              {occurrence.category} • {occurrence.date} ({occurrence.time})
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
              occurrence.severity === 'GRAVE' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              Gravidade: {occurrence.severity || 'MÉDIA'}
            </span>
          </div>
          <p className="text-white/80 italic bg-black/20 p-3 rounded-xl border border-white/5">
            "{occurrence.report}"
          </p>
          <div className="text-[10px] text-white/50 text-right">
            Registrado por: <strong>{occurrence.responsible}</strong>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS INTERNAS */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'timeline'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock size={15} /> Linha do Tempo ({history.length})
          </button>

          <button
            onClick={() => setActiveTab('forward')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'forward'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Send size={15} /> Encaminhar para Outro Setor
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'feedback'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare size={15} /> Registrar Devolutiva
          </button>
        </div>

        {/* ABA 1: LINHA DO TEMPO DA TRAMITAÇÃO */}
        {activeTab === 'timeline' && (
          <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
            {loading ? (
              <div className="text-center py-8 text-white/50 text-xs">Carregando histórico de tramitações...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <AlertCircle size={24} className="mx-auto text-amber-400 opacity-60" />
                <p className="text-xs font-bold text-white/70">Nenhuma tramitação registrada para esta ocorrência ainda.</p>
                <p className="text-[10px] text-white/40">Clique em "Encaminhar para Outro Setor" para iniciar o protocolo.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-blue-500/30 ml-4 space-y-6 pl-6 my-4">
                {history.map((item, idx) => {
                  const fromInfo = SECTOR_LABELS[item.from_sector] || SECTOR_LABELS.PROFESSOR;
                  const toInfo = SECTOR_LABELS[item.to_sector] || SECTOR_LABELS.CIVICO_MILITAR;

                  return (
                    <div key={item.id || idx} className="relative group">
                      <div className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 shadow-md shadow-blue-500/50"></div>

                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 hover:bg-white/[0.07] transition-all">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div className="flex items-center gap-2 text-xs font-black">
                            <span className={`px-2 py-0.5 rounded text-[9px] border ${fromInfo.color}`}>
                              {fromInfo.name}
                            </span>
                            <span className="text-white/40">➜</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] border ${toInfo.color}`}>
                              {toInfo.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-white/50">
                            <span>{new Date(item.created_at).toLocaleString('pt-BR')}</span>
                            <span className={`px-2 py-0.5 rounded font-black uppercase text-[8px] ${
                              item.status === 'CONCLUIDO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-white/90">
                          <strong className="text-white/50">Motivo:</strong> {item.reason}
                        </p>

                        {item.feedback && (
                          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/20 text-xs text-emerald-200 space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-[10px] uppercase text-emerald-400">
                              <CheckCircle2 size={13} /> Devolutiva / Parecer do Setor:
                            </div>
                            <p className="italic">{item.feedback}</p>
                          </div>
                        )}

                        <div className="text-[10px] text-white/40 text-right">
                          Encaminhado por: {item.tramitated_by_name || 'Usuário do Sistema'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA 2: ENCAMINHAR PARA OUTRO SETOR */}
        {activeTab === 'forward' && (
          <form onSubmit={handleForward} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-white/70 uppercase tracking-wider mb-2">
                Selecione o Setor de Destino
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(['CIVICO_MILITAR', 'MEDIACAO', 'BUSCA_ATIVA', 'PSICOSSOCIAL'] as TramitationSector[]).map(sector => {
                  const info = SECTOR_LABELS[sector];
                  const Icon = info.icon;
                  const isSelected = targetSector === sector;

                  return (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => setTargetSector(sector)}
                      className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded-xl border ${info.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase">{info.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-white/70 uppercase tracking-wider mb-1.5">
                Prioridade do Atendimento
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TramitationPriority)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="BAIXA" className="bg-slate-900">Baixa (Acompanhamento rotineiro)</option>
                <option value="MEDIA" className="bg-slate-900">Média (Atendimento em até 48h)</option>
                <option value="ALTA" className="bg-slate-900">Alta (Atendimento prioritário em até 24h)</option>
                <option value="URGENTE" className="bg-slate-900">Urgente (Intervenção imediata)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-white/70 uppercase tracking-wider mb-1.5">
                Motivo / Despacho de Encaminhamento *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Descreva detalhadamente a necessidade do encaminhamento para a equipe de destino..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white/70"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                <Send size={15} /> Confirmar Encaminhamento
              </button>
            </div>
          </form>
        )}

        {/* ABA 3: REGISTRAR DEVOLUTIVA */}
        {activeTab === 'feedback' && (
          <form onSubmit={handleSendFeedback} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-white/70 uppercase tracking-wider mb-1.5">
                Status Atual do Atendimento
              </label>
              <select
                value={closingStatus}
                onChange={e => setClosingStatus(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="EM_ATENDIMENTO" className="bg-slate-900">Em Atendimento (Em andamento)</option>
                <option value="CONCLUIDO" className="bg-slate-900">Concluído com Resolutividade</option>
                <option value="DEVOLVIDO" className="bg-slate-900">Devolvido ao Professor / Setor de Origem</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-white/70 uppercase tracking-wider mb-1.5">
                Parecer Técnico / Devolutiva Institucional *
              </label>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Registre os acordos firmados, ações tomadas ou parecer institucional para informar o setor solicitante..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white/70"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <CheckCircle2 size={15} /> Salvar Devolutiva
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
