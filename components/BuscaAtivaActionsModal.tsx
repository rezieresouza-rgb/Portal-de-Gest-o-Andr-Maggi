import React, { useState, useEffect } from 'react';
import {
    X,
    CheckCircle2,
    Circle,
    AlertTriangle,
    FileText,
    MessageSquare,
    Phone,
    Users,
    Send,
    ShieldAlert,
    Calendar,
    Save,
    Loader2
} from 'lucide-react';
import { supabase } from '../supabaseClient';

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

interface BuscaAtivaActionsModalProps {
    student: { id: string, name: string, class: string };
    onClose: () => void;
}

export default function BuscaAtivaActionsModal({ student, onClose }: BuscaAtivaActionsModalProps) {
    const [actionsStatus, setActionsStatus] = useState<Record<string, { status: string, notes: string, completed_at: string | null }>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchActions();
    }, [student.id]);

    const fetchActions = async () => {
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
            setLoading(false);
        }
    };

    const handleToggleAction = async (actionId: string) => {
        const current = actionsStatus[actionId] || { status: 'PENDENTE', notes: '', completed_at: null };
        const newStatus = current.status === 'CONCLUIDO' ? 'PENDENTE' : 'CONCLUIDO';
        const completedAt = newStatus === 'CONCLUIDO' ? new Date().toISOString() : null;

        // Optimistic Update
        setActionsStatus(prev => ({
            ...prev,
            [actionId]: { ...current, status: newStatus, completed_at: completedAt }
        }));

        try {
            // Check if exists
            const { data: existing } = await supabase
                .from('active_search_actions')
                .select('id')
                .eq('student_id', student.id)
                .eq('action_type', actionId)
                .single();

            if (existing) {
                await supabase
                    .from('active_search_actions')
                    .update({
                        status: newStatus,
                        completed_at: completedAt
                    })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('active_search_actions')
                    .insert([{
                        student_id: student.id,
                        action_type: actionId,
                        status: newStatus,
                        completed_at: completedAt
                    }]);
            }
        } catch (error) {
            console.error("Erro ao atualizar ação:", error);
            // Revert on error would be ideal
        }
    };

    const handleSaveNotes = async (actionId: string, notes: string) => {
        setSaving(true);
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
                    .update({ notes })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('active_search_actions')
                    .insert([{
                        student_id: student.id,
                        action_type: actionId,
                        status: 'PENDENTE',
                        notes
                    }]);
            }

            setActionsStatus(prev => ({
                ...prev,
                [actionId]: { ...prev[actionId], notes }
            }));
        } catch (error) {
            console.error("Erro ao salvar nota:", error);
        } finally {
            setSaving(false);
        }
    };

    const actionsArray = Object.values(actionsStatus) as { status: string, notes: string, completed_at: string | null }[];
    const progress = Math.round((actionsArray.filter(a => a.status === 'CONCLUIDO').length / ACTION_ITEMS.length) * 100) || 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl border border-emerald-100 overflow-hidden max-h-[90vh] flex flex-col">

                {/* HEADER */}
                <div className="px-10 pt-10 pb-6 bg-white shrink-0 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-600/20">
                            <ShieldAlert size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Protocolo de Busca Ativa</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {student.name} • {student.class}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* PROGRESS BAR */}
                <div className="px-10 pb-6 shrink-0">
                    <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Progresso do Protocolo (Art. 23)</p>
                        <p className="text-xl font-black text-emerald-600">{progress}%</p>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {/* LIST */}
                <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-4 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-20 text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" /> Carregando ações...</div>
                    ) : (
                        ACTION_ITEMS.map((item) => {
                            const status = actionsStatus[item.id] || { status: 'PENDENTE', notes: '', completed_at: null };
                            const isDone = status.status === 'CONCLUIDO';

                            return (
                                <div key={item.id} className={`p-6 rounded-3xl border transition-all duration-300 ${isDone ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-start gap-4">
                                        <button
                                            onClick={() => handleToggleAction(item.id)}
                                            className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-100 text-gray-300 hover:bg-emerald-100 hover:text-emerald-500'}`}
                                        >
                                            {isDone ? <CheckCircle2 size={18} strokeWidth={3} /> : <Circle size={18} />}
                                        </button>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className={`text-sm font-black uppercase tracking-tight ${isDone ? 'text-emerald-900' : 'text-gray-900'}`}>{item.label}</h4>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-1">{item.description}</p>
                                                </div>
                                                <div className={`p-2 rounded-xl ${isDone ? 'bg-white text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                                                    <item.icon size={16} />
                                                </div>
                                            </div>

                                            {/* NOTES SECTION */}
                                            <div className="mt-4 pt-4 border-t border-gray-100/50">
                                                <div className="relative">
                                                    <textarea
                                                        placeholder="Adicionar observações sobre esta ação..."
                                                        value={status.notes}
                                                        onChange={(e) => setActionsStatus(prev => ({ ...prev, [item.id]: { ...prev[item.id], notes: e.target.value } }))}
                                                        onBlur={(e) => handleSaveNotes(item.id, e.target.value)}
                                                        className={`w-full p-3 rounded-xl text-xs font-medium outline-none transition-all resize-none ${isDone ? 'bg-white border border-emerald-100 text-emerald-800 placeholder:text-emerald-300' : 'bg-gray-50 border border-transparent text-gray-700 placeholder:text-gray-300 focus:bg-white focus:border-emerald-200'}`}
                                                        rows={2}
                                                    />
                                                    {status.completed_at && (
                                                        <p className="text-[9px] text-emerald-600/60 font-black uppercase mt-2 text-right">
                                                            Concluído em: {new Date(status.completed_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); }
      `}</style>
        </div>
    );
}
