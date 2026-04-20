
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  History, 
  MapPin, 
  Phone, 
  User, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  MessageSquare,
  Scale,
  Plus,
  Clock,
  Loader2,
  ShieldAlert,
  Circle,
  Send,
  Users,
  Pencil,
  Trash2
} from 'lucide-react';
import { Referral } from '../types';
import { supabase } from '../supabaseClient';
import BuscaAtivaAddLogModal from './BuscaAtivaAddLogModal';

interface ActionItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
}

const ACTION_ITEMS: ActionItem[] = [
  { id: 'COMUNICADO_PAIS', label: 'Comunicar Pais/Responsáveis', description: 'Contato imediato sobre ausência (Lei 10.509/2017)', icon: Phone, required: true },
  { id: 'ALERTA_SISTEMA', label: 'Analisar Alertas do Sistema', description: 'Verificar justificativas e padrão de faltas', icon: AlertTriangle, required: true },
  { id: 'VISITA_TURMA', label: 'Visita à Turma', description: 'Obter informações com colegas e professores', icon: Users, required: true },
  { id: 'CONTATO_DIARIO', label: 'Contatos Diários Alternados', description: 'Telefone, WhatsApp, E-mail (tentativas documentadas)', icon: MessageSquare, required: true },
  { id: 'ELABORAR_RELATORIO', label: 'Elaborar Relatório de Ações', description: 'Registro detalhado no Sistema de Prevenção', icon: FileText, required: true },
  { id: 'REDE_PROTECAO', label: 'Acionar Rede de Proteção', description: 'CRAS, CREAS, Saúde (quando necessário)', icon: ShieldAlert, required: false },
  { id: 'FICAI_ONLINE', label: 'Registrar na FICAI Online', description: 'Para alunos com >10% de faltas injustificadas', icon: FileText, required: true },
  { id: 'NOTIFICAR_CONSELHO', label: 'Notificar Conselho Tutelar', description: 'Envio da FICAI com documentação exigida', icon: Send, required: true },
  { id: 'ACOMPANHAR_DEVOLUTIVA', label: 'Acompanhar Devolutiva', description: 'Monitorar retorno do Conselho Tutelar', icon: Calendar, required: true },
  { id: 'INTERVENCAO_METODOLOGIA', label: 'Intervenção Metodológica', description: 'Orientar e executar ações de reintegração', icon: CheckCircle2, required: true },
];

interface BuscaAtivaStudentProfileProps {
  student: any;
  referrals?: Referral[];
  onClose: () => void;
}

const BuscaAtivaStudentProfile: React.FC<BuscaAtivaStudentProfileProps> = ({ student, referrals = [], onClose }) => {
  const [activeView, setActiveView] = useState<'history' | 'protocol'>('history');
  const [monitoringLogs, setMonitoringLogs] = useState<any[]>([]);
  const [mediationFeedbacks, setMediationFeedbacks] = useState<any[]>([]);
  const [actionsStatus, setActionsStatus] = useState<Record<string, { status: string, notes: string, completed_at: string | null }>>({});
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingActions, setLoadingActions] = useState(true);
  const [showAddLog, setShowAddLog] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const studentReferrals = referrals.filter(r => r.studentId === student.id);

  useEffect(() => {
    fetchMonitoringLogs();
    fetchActions();
    fetchMediationFeedbacks();

    const channel = supabase
      .channel(`student-monitoring-${student.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'occurrences', 
        filter: `student_id=eq.${student.id}` 
      }, () => {
        fetchMonitoringLogs();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'active_search_actions', 
        filter: `student_id=eq.${student.id}` 
      }, () => {
        fetchActions();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'mediation_cases'
      }, () => {
        fetchMediationFeedbacks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student.id]);

  const fetchMediationFeedbacks = async () => {
    try {
      const { data } = await supabase
        .from('mediation_cases')
        .select('id, feedback, opened_at, description, status, type')
        .eq('student_name', student.name)
        .not('feedback', 'is', null)
        .neq('feedback', '');
      setMediationFeedbacks(data || []);
    } catch (e) {
      console.error('Erro ao buscar devolutivas da mediação:', e);
    }
  };

  const fetchMonitoringLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .eq('student_id', student.id)
        .eq('category', 'BUSCA_ATIVA')
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) throw error;
      setMonitoringLogs(data || []);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchActions = async () => {
    setLoadingActions(true);
    try {
      const { data, error } = await supabase
        .from('active_search_actions')
        .select('*')
        .eq('student_id', student.id);

      if (error) throw error;

      const statusMap: any = {};
      if (data) {
        data.forEach((action: any) => {
          statusMap[action.action_type] = {
            status: action.status,
            notes: action.notes || '',
            completed_at: action.completed_at
          };
        });
      }
      setActionsStatus(statusMap);
    } catch (error) {
      console.error("Erro ao buscar ações:", error);
    } finally {
      setLoadingActions(false);
    }
  };

  const handleDeleteLog = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('occurrences')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) throw error;
      
      fetchMonitoringLogs();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Erro ao excluir log:", error);
      alert("Erro ao excluir registro.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleAction = async (actionId: string) => {
    const current = actionsStatus[actionId] || { status: 'PENDENTE', notes: '', completed_at: null };
    const newStatus = current.status === 'CONCLUIDO' ? 'PENDENTE' : 'CONCLUIDO';
    const completedAt = newStatus === 'CONCLUIDO' ? new Date().toISOString() : null;

    setActionsStatus(prev => ({
      ...prev,
      [actionId]: { ...current, status: newStatus, completed_at: completedAt }
    }));

    try {
      const { data: existing } = await supabase
        .from('active_search_actions')
        .select('id')
        .eq('student_id', student.id)
        .eq('action_type', actionId)
        .single();

      if (existing) {
        await supabase
          .from('active_search_actions')
          .update({ status: newStatus, completed_at: completedAt })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('active_search_actions')
          .insert([{ student_id: student.id, action_type: actionId, status: newStatus, completed_at: completedAt }]);
      }
    } catch (error) {
      console.error("Erro ao atualizar ação:", error);
    }
  };

  const handleSaveNotes = async (actionId: string, notes: string) => {
    try {
      const { data: existing } = await supabase
        .from('active_search_actions')
        .select('id')
        .eq('student_id', student.id)
        .eq('action_type', actionId)
        .single();

      if (existing) {
        await supabase.from('active_search_actions').update({ notes }).eq('id', existing.id);
      } else {
        await supabase.from('active_search_actions').insert([{ student_id: student.id, action_type: actionId, status: 'PENDENTE', notes }]);
      }

      setActionsStatus(prev => ({
        ...prev,
        [actionId]: { ...prev[actionId], notes }
      }));
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
    }
  };

  const actionsArray = Object.values(actionsStatus) as { status: string, notes: string, completed_at: string | null }[];
  const protocolProgress = Math.round((actionsArray.filter(a => a.status === 'CONCLUIDO').length / ACTION_ITEMS.length) * 100) || 0;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] shadow-2xl rounded-[3rem] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* HEADER PERFIL */}
        <div className="p-8 bg-emerald-900 text-white shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><User size={200} /></div>
           <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-black">
                    {student.name[0]}
                 </div>
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{student.name}</h3>
                    <p className="text-emerald-300 font-bold uppercase text-[10px] tracking-widest mt-2">{student.class} • MATRÍCULA ATIVA</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                 <X size={28} />
              </button>
           </div>
        </div>

        {/* CONTEÚDO SCROLL */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-gray-50/50">
           
           {/* CARDS DE STATUS RÁPIDO */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Frequência Real</p>
                 <div className="flex items-end gap-2">
                    <p className={`text-3xl font-black ${student.attendance < 90 ? 'text-red-600' : 'text-emerald-600'}`}>
                       {student.attendance}%
                    </p>
                    <TrendingDown size={18} className={student.attendance < 90 ? 'text-red-400 mb-1' : 'hidden'} />
                 </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Evolução de Protocolo</p>
                 <div className="flex items-center gap-3">
                    <p className={`text-3xl font-black ${protocolProgress === 100 ? 'text-emerald-600' : 'text-gray-900'}`}>
                       {protocolProgress}%
                    </p>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${protocolProgress}%` }}></div>
                    </div>
                 </div>
              </div>
           </div>

           {/* TAB BAR */}
           <div className="flex p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
             <button 
               onClick={() => setActiveView('history')}
               className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'history' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <History size={14} /> Diário de Bordo
             </button>
             <button 
               onClick={() => setActiveView('protocol')}
               className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'protocol' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <ShieldAlert size={14} /> Plano de Ação
             </button>
           </div>

           {activeView === 'history' ? (
             <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <History size={16} className="text-emerald-600" /> Diário de Acompanhamento
                </h4>
                <button 
                  onClick={() => setShowAddLog(true)}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Plus size={14} /> Novo Registro
                </button>
              </div>
              
              <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-100">
                 {loadingLogs ? (
                   <div className="py-12 text-center ml-12"><Loader2 className="animate-spin mx-auto text-emerald-600" /></div>
                 ) : monitoringLogs.length > 0 || studentReferrals.length > 0 || mediationFeedbacks.length > 0 ? (
                   [...monitoringLogs.map(log => ({ 
                      id: log.id, 
                      date: log.date, 
                      time: log.time, 
                      type: 'BUSCA ATIVA', 
                      content: log.description, 
                      responsible: log.responsible_name || 'Equipe',
                      isOccurrence: true,
                      original: log,
                      isMediationFeedback: false
                   })), ...studentReferrals.map(ref => ({
                      id: ref.id,
                      date: ref.date,
                      time: '00:00',
                      type: ref.type,
                      content: `Motivo: ${ref.reason}`,
                      responsible: ref.responsible,
                      isOccurrence: false,
                      original: ref,
                      isMediationFeedback: false
                   })), ...mediationFeedbacks.map(fb => ({
                      id: `med-${fb.id}`,
                      date: fb.opened_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                      time: '23:59',
                      type: 'DEVOLUTIVA DA MEDIAÇÃO',
                      content: fb.feedback,
                      responsible: 'Equipe de Mediação',
                      isOccurrence: false,
                      original: null,
                      isMediationFeedback: true
                   }))]
                   .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                      return dateB.getTime() - dateA.getTime();
                   })
                   .map((item) => (
                    <div key={item.id} className="relative pl-12">
                       <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${item.isMediationFeedback ? 'bg-green-600' : 'bg-emerald-500'}`}></div>
                       <div className={`p-5 rounded-[2rem] border shadow-sm transition-all group ${
                          item.isMediationFeedback 
                            ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400' 
                            : 'bg-white border-gray-100 hover:border-emerald-200'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${
                                   item.isMediationFeedback
                                     ? 'bg-emerald-600 text-white border-emerald-700'
                                     : item.type === 'BUSCA ATIVA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-violet-50 text-violet-600 border-violet-100'
                                 }`}>
                                  {item.type}
                                </span>
                             </div>
                              <div className="flex items-center gap-3">
                                 {item.isOccurrence && (
                                   <div className="flex items-center gap-1 mr-2">
                                      <button 
                                        onClick={() => {
                                          setEditingLog(item.original);
                                          setShowAddLog(true);
                                        }}
                                        className="p-1.5 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition-all"
                                        title="Editar"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button 
                                        onClick={() => setDeleteConfirmId(item.id)}
                                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                                        title="Excluir"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                   </div>
                                 )}
                                 <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                    <Calendar size={10} /> {new Date(item.date).toLocaleDateString('pt-BR')}
                                    {item.time && <><Clock size={10} className="ml-1" /> {item.time.substring(0, 5)}</>}
                                 </div>
                              </div>
                          </div>
                          <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                          
                          {/* Destaque especial para devolutivas da mediação */}
                          {item.isMediationFeedback && (
                            <div className="mt-3 flex items-center gap-2 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                              <CheckCircle2 size={10} /> Devolutiva oficial registrada pela equipe de mediação
                            </div>
                          )}

                          {/* [LEGADO] Devolutiva inline via referral */}
                          {!item.isOccurrence && !item.isMediationFeedback && (item.original as any)?.feedback && (
                            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                               <div className="flex items-center gap-2 mb-2 text-emerald-700">
                                  <CheckCircle2 size={14} strokeWidth={3} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Devolutiva da Mediação</span>
                               </div>
                               <p className="text-[11px] font-bold text-emerald-800 leading-relaxed italic">
                                  {(item.original as any)?.feedback}
                                </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mt-3 pt-3 border-t border-gray-50">
                             <User size={12} /> Resp: {item.responsible}
                          </div>
                       </div>
                    </div>
                  ))
                 ) : (
                   <div className="py-12 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100 ml-12 mr-2">
                      <MessageSquare size={32} className="mx-auto mb-2 text-gray-200" />
                      <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Sem registros anteriores</p>
                      <button 
                        onClick={() => setShowAddLog(true)}
                        className="mt-4 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                      >
                        Iniciar acompanhamento
                      </button>
                   </div>
                 )}
               </div>
             </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={16} className="text-emerald-600" /> Checklist do Protocolo (Art. 23)
                  </h4>
                </div>
                
                <div className="space-y-4 pb-8">
                  {loadingActions ? (
                    <div className="py-20 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" /> Carregando protocolo...</div>
                  ) : (
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                    {ACTION_ITEMS.map((item, index) => {
                      const status = actionsStatus[item.id] || { status: 'PENDENTE', notes: '', completed_at: null };
                      const isDone = status.status === 'CONCLUIDO';

                      return (
                        <div 
                          key={item.id} 
                          className={`p-4 flex items-center gap-4 transition-all ${
                            index !== ACTION_ITEMS.length - 1 ? 'border-b border-gray-50' : ''
                          } ${isDone ? 'bg-emerald-50/30' : 'hover:bg-gray-50'}`}
                        >
                          <button
                            onClick={() => handleToggleAction(item.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isDone ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-300 border border-gray-200'
                            }`}
                          >
                            {isDone ? <CheckCircle2 size={12} strokeWidth={3} /> : <Circle size={12} />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className={`text-[11px] font-black uppercase tracking-tight truncate ${isDone ? 'text-emerald-900' : 'text-gray-700'}`}>
                                {item.label}
                              </h5>
                              {isDone && status.completed_at && (
                                <span className="text-[8px] font-bold text-emerald-500 bg-emerald-100/50 px-1.5 py-0.5 rounded italic">
                                  {new Date(status.completed_at).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold truncate tracking-tight uppercase opacity-60">
                              {item.description}
                            </p>
                          </div>

                          <div className={`p-2 rounded-lg ${isDone ? 'text-emerald-500' : 'text-gray-300'}`}>
                            <item.icon size={14} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              </div>
            )}

           {/* ALERTA FICAI */}
           {student.attendance < 90 && (
              <div className="p-8 bg-red-50 rounded-[2.5rem] border-2 border-red-100 border-dashed space-y-4">
                 <div className="flex items-center gap-3 text-red-600">
                    <AlertTriangle size={24} className="animate-pulse" />
                    <h4 className="text-sm font-black uppercase">Limite de Infrequência Atingido</h4>
                 </div>
                 <p className="text-xs text-red-700 font-medium leading-relaxed">
                    O aluno atingiu o patamar crítico de faltas. É obrigatória a abertura de <strong>FICAi</strong> e o encaminhamento imediato ao Conselho Tutelar.
                 </p>
                 <button className="w-full py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    <Scale size={14}/> Abrir FICAi Agora
                 </button>
              </div>
           )}
        </div>
      </div>

      {showAddLog && (
        <BuscaAtivaAddLogModal 
          student={student} 
          protocolItems={ACTION_ITEMS}
          actionsStatus={actionsStatus}
          editData={editingLog}
          onClose={() => {
            setShowAddLog(false);
            setEditingLog(null);
          }} 
          onSuccess={() => {
            fetchMonitoringLogs();
            fetchActions();
          }}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 text-center space-y-4">
                 <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={40} />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Tem certeza?</h3>
                 <p className="text-xs text-gray-500 font-bold leading-relaxed px-4">
                   Esta ação não pode ser desfeita. O registro será removido permanentemente do histórico.
                 </p>
                 <div className="grid grid-cols-2 gap-3 pt-4">
                    <button 
                      onClick={() => setDeleteConfirmId(null)}
                      disabled={deleting}
                      className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleDeleteLog}
                      disabled={deleting}
                      className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Excluir
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BuscaAtivaStudentProfile;

