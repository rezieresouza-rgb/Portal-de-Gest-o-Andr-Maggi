import React, { useState } from 'react';
import { 
    X, 
    Save, 
    Loader2, 
    Phone, 
    MessageSquare, 
    Users, 
    Home,
    AlertTriangle,
    Calendar,
    Clock,
    ShieldAlert
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface ActionItem {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
}

interface BuscaAtivaAddLogModalProps {
    student: { 
        id: string, 
        name: string, 
        class: string,
        classroom_id?: string 
    };
    protocolItems: ActionItem[];
    actionsStatus: Record<string, { status: string, notes: string, completed_at: string | null }>;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;
}

const ACTION_TYPES = [
    { id: 'TELEFONE', label: 'Contato Telefônico', icon: Phone },
    { id: 'WHATSAPP', label: 'Mensagem WhatsApp', icon: MessageSquare },
    { id: 'VISITA', label: 'Visita Domiciliar', icon: Home },
    { id: 'REUNIAO', label: 'Reunião Presencial', icon: Users },
    { id: 'OUTRO', label: 'Outra Intervenção', icon: AlertTriangle },
];

export default function BuscaAtivaAddLogModal({ student, protocolItems, actionsStatus, onClose, onSuccess, editData }: BuscaAtivaAddLogModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedProtocolItems, setSelectedProtocolItems] = useState<string[]>([]);
    const [activeProtocolId, setActiveProtocolId] = useState<string | null>(null);

    const deconstructDescription = (desc: string) => {
        const match = desc.match(/^\[(.*?)\] (.*?)(?: \(Contato: (.*)\))?$/);
        if (match) {
            const type = match[1];
            const text = match[2];
            const contact = match[3] || '';
            const isKnownType = ACTION_TYPES.some(t => t.id === type);
            
            return {
                type: isKnownType ? type : 'OUTRO',
                description: isKnownType && type !== 'OUTRO' ? text : '',
                other_description: !isKnownType || type === 'OUTRO' ? text : '',
                contact_person: contact
            };
        }
        return { type: 'OUTRO', description: '', other_description: desc, contact_person: '' };
    };

    const getFormGroup = (id: string | null) => {
        if (!id) return 'OTHER';
        if (['COMUNICADO_PAIS', 'CONTATO_DIARIO'].includes(id)) return 'COMMUNICATION';
        if (['ALERTA_SISTEMA', 'VISITA_TURMA'].includes(id)) return 'INVESTIGATION';
        if (['FICAI_ONLINE', 'NOTIFICAR_CONSELHO', 'ELABORAR_RELATORIO'].includes(id)) return 'INSTITUTIONAL';
        if (['REDE_PROTECAO', 'ACOMPANHAR_DEVOLUTIVA', 'INTERVENCAO_METODOLOGIA'].includes(id)) return 'SUPPORT';
        return 'OTHER';
    };

    const initialFormData = editData ? {
        date: editData.date,
        time: editData.time?.substring(0, 5) || '00:00',
        severity: editData.severity || 'NORMAL',
        responsible_name: editData.responsible_name || 'ANGELA MARIA TRAMARIN',
        ...deconstructDescription(editData.description || ''),
        outcome: 'SUCESSO',
        consulted_staff: '',
        protocol_number: '',
        institution: '',
        entity_name: '',
        contact_at_entity: ''
    } : {
        date: new Date().toLocaleDateString('sv-SE'),
        time: new Date().toLocaleTimeString('pt-BR', { hour12: false }).substring(0, 5),
        type: 'TELEFONE',
        description: '',
        contact_person: '',
        severity: 'NORMAL',
        responsible_name: 'ANGELA MARIA TRAMARIN',
        other_description: '',
        outcome: 'SUCESSO',
        consulted_staff: '',
        protocol_number: '',
        institution: '',
        entity_name: '',
        contact_at_entity: ''
    };

    const [formData, setFormData] = useState(initialFormData);

    const toggleProtocolItem = (id: string) => {
        const isSelected = selectedProtocolItems.includes(id);
        if (isSelected) {
            setSelectedProtocolItems(prev => prev.filter(i => i !== id));
            if (activeProtocolId === id) setActiveProtocolId(null);
        } else {
            setSelectedProtocolItems(prev => [...prev, id]);
            setActiveProtocolId(id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Save or Update Log Entry
            const group = getFormGroup(activeProtocolId);
            let finalDescription = '';

            switch (group) {
                case 'COMMUNICATION':
                    finalDescription = `[${formData.type}] ${formData.description} (Contato: ${formData.contact_person}, Resultado: ${formData.outcome})`;
                    break;
                case 'INVESTIGATION':
                    finalDescription = `[INVESTIGAÇÃO] ${formData.description} (Equipe Consultada: ${formData.consulted_staff})`;
                    break;
                case 'INSTITUTIONAL':
                    finalDescription = `[DOCUMENTAÇÃO] ${formData.description} (Protocolo: ${formData.protocol_number}, Instituição: ${formData.institution})`;
                    break;
                case 'SUPPORT':
                    finalDescription = `[REDE APOIO] ${formData.description} (Entidade: ${formData.entity_name}, Contato: ${formData.contact_at_entity})`;
                    break;
                default:
                    finalDescription = `[${formData.type}] ${formData.type === 'OUTRO' ? formData.other_description : formData.description}${formData.contact_person ? ` (Contato: ${formData.contact_person})` : ''}`;
            }

            const logData = {
                student_id: student.id,
                student_name: student.name,
                classroom_name: student.class,
                classroom_id: student.classroom_id,
                date: formData.date,
                time: formData.time,
                category: 'BUSCA_ATIVA',
                severity: formData.severity,
                description: finalDescription,
                status: 'REGISTRADO',
                location: formData.contact_person || formData.institution || formData.entity_name || 'Escola',
                responsible_name: formData.responsible_name
            };

            let logError;
            if (editData?.id) {
                const { error } = await supabase
                    .from('occurrences')
                    .update(logData)
                    .eq('id', editData.id);
                logError = error;
            } else {
                const { error } = await supabase
                    .from('occurrences')
                    .insert([logData]);
                logError = error;
            }

            if (logError) throw logError;

            // 2. Save Selected Protocol Items
            if (selectedProtocolItems.length > 0) {
                const now = new Date().toISOString();
                for (const actionId of selectedProtocolItems) {
                    const { data: existing } = await supabase
                        .from('active_search_actions')
                        .select('id')
                        .eq('student_id', student.id)
                        .eq('action_type', actionId)
                        .single();

                    const updateData = {
                        status: 'CONCLUIDO',
                        completed_at: now,
                        notes: `Registrado via Histórico em ${new Date(formData.date).toLocaleDateString('pt-BR')}`
                    };

                    if (existing) {
                        await supabase.from('active_search_actions').update(updateData).eq('id', existing.id);
                    } else {
                        await supabase.from('active_search_actions').insert([{
                            student_id: student.id,
                            action_type: actionId,
                            ...updateData
                        }]);
                    }
                }
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar log:", error);
            alert("Erro ao salvar registro de acompanhamento.");
        } finally {
            setLoading(false);
        }
    };

    const renderActionForm = () => {
        const group = getFormGroup(activeProtocolId);

        return (
            <div className="space-y-6 mt-6 pt-6 border-t border-emerald-50/50 animate-in slide-in-from-top-4 fade-in duration-500">
                
                {/* CAMPOS ESPECÍFICOS POR GRUPO */}
                {group === 'COMMUNICATION' && (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest ml-1">Meio de Contato</label>
                            <div className="grid grid-cols-3 gap-2">
                                {ACTION_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData({...formData, type: type.id})}
                                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.type === type.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white border-emerald-100/50 text-emerald-800/40 hover:bg-emerald-50'}`}
                                    >
                                        <type.icon size={18} />
                                        <span className="text-[8px] font-black uppercase text-center leading-none">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest ml-1">Pessoa Contatada</label>
                                <input type="text" placeholder="Ex: Pai, Mãe..." value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="w-full p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest ml-1">Resultado do Contato</label>
                                <select value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})} className="w-full p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500">
                                    <option value="SUCESSO">Sucesso no Contato</option>
                                    <option value="SEM_RESPOSTA">Sem Resposta</option>
                                    <option value="OCUPADO">Sinal Ocupado / Recusado</option>
                                    <option value="INEXISTENTE">Número Inexistente</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {group === 'INVESTIGATION' && (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest ml-1">Profissionais Consultados</label>
                            <input type="text" placeholder="Ex: Professora Maria, Coord. Paulo..." value={formData.consulted_staff} onChange={e => setFormData({...formData, consulted_staff: e.target.value})} className="w-full p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500" />
                        </div>
                    </div>
                )}

                {group === 'INSTITUTIONAL' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest ml-1">Nº do Protocolo / Ofício</label>
                                <input type="text" placeholder="Ex: 123/2026" value={formData.protocol_number} onChange={e => setFormData({...formData, protocol_number: e.target.value})} className="w-full p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest ml-1">Instituição de Destino</label>
                                <input type="text" placeholder="Ex: Conselho Tutelar Colíder" value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} className="w-full p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500" />
                            </div>
                        </div>
                    </div>
                )}

                {group === 'SUPPORT' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest ml-1">Entidade / Órgão</label>
                                <input type="text" placeholder="Ex: CRAS, CREAS, Saúde..." value={formData.entity_name} onChange={e => setFormData({...formData, entity_name: e.target.value})} className="w-full p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest ml-1">Profissional de Referência</label>
                                <input type="text" placeholder="Ex: Assistente Social Ana" value={formData.contact_at_entity} onChange={e => setFormData({...formData, contact_at_entity: e.target.value})} className="w-full p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* CAMPO DE RESPONSÁVEL (COMUM A TODOS) */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest ml-1">Servidor Responsável</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['ANGELA MARIA TRAMARIN', 'ZENIR RODRIGUES GERALDO'].map(name => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => setFormData({...formData, responsible_name: name})}
                                className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all border leading-tight ${
                                    formData.responsible_name === name 
                                        ? 'bg-emerald-900 border-emerald-900 text-white shadow-lg' 
                                        : 'bg-emerald-50/20 border-emerald-100/50 text-emerald-800/40 hover:border-emerald-200'
                                }`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CAMPO DE OBSERVAÇÕES (COMUM A TODOS) */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest ml-1">Observações / Detalhes da Ação</label>
                    <textarea 
                        required
                        placeholder={group === 'INVESTIGATION' ? "O que foi relatado pelos professores?" : "Descreva os detalhes desta ação..."}
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full p-4 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl text-xs font-medium text-emerald-900 outline-none focus:bg-white focus:border-emerald-500 transition-all resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {editData ? 'Salvar Alterações' : 'Salvar Acompanhamento'}
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl border border-emerald-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[95vh]">
                
                {/* HEADER */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-start shrink-0 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                                {editData ? 'Editar Acompanhamento' : 'Registrar Acompanhamento'}
                            </h3>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">
                                {student.name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Calendar size={12} /> Data
                            </label>
                            <input 
                                type="date" 
                                required
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Clock size={12} /> Hora
                            </label>
                            <input 
                                type="time" 
                                required
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 bg-emerald-50/20 p-6 rounded-[2rem] border border-emerald-100/30">
                        <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 flex items-center gap-1.5 mb-3">
                           <ShieldAlert size={12} /> Selecione as Ações do Protocolo (Art. 23)
                        </label>
                        <div className="space-y-3">
                            {protocolItems.map(item => {
                                const isAlreadyDone = actionsStatus[item.id]?.status === 'CONCLUIDO';
                                const isSelected = selectedProtocolItems.includes(item.id);
                                const isActive = activeProtocolId === item.id;
                                
                                return (
                                    <div key={item.id} className="space-y-2">
                                        <button
                                            type="button"
                                            disabled={isAlreadyDone}
                                            onClick={() => toggleProtocolItem(item.id)}
                                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                                                isAlreadyDone ? 'bg-gray-100 border-transparent opacity-60 text-gray-400' :
                                                isSelected ? (isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-600/30 -translate-y-1 scale-[1.02]' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : 
                                                'bg-white border-gray-100 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 text-left">
                                                <div className={`p-1.5 rounded-lg ${isSelected ? (isActive ? 'bg-white/20' : 'bg-emerald-100') : 'bg-gray-50'}`}>
                                                    <item.icon size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-tight leading-tight">{item.label}</p>
                                                    {isAlreadyDone ? (
                                                        <p className="text-[8px] font-bold uppercase text-emerald-600 mt-0.5">Já concluído</p>
                                                    ) : isSelected && !isActive && (
                                                        <p className="text-[8px] font-bold uppercase text-emerald-500 mt-0.5">Selecionado</p>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className={`transition-all duration-300 ${isActive ? 'rotate-0' : 'rotate-180 opacity-40'}`}>
                                                     <Save size={14} className={isActive ? 'animate-bounce' : ''} />
                                                </div>
                                            )}
                                        </button>
                                        
                                        {isActive && isSelected && (
                                            <div className="px-2 pb-2">
                                                {renderActionForm()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {!activeProtocolId && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-emerald-100 rounded-[2rem] bg-emerald-50/10 animate-in fade-in duration-500">
                            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full">
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-emerald-900 uppercase tracking-tight">Selecione uma ação do protocolo</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Para abrir os campos de preenchimento</p>
                            </div>
                        </div>
                    )}

                    {activeProtocolId && (
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            {editData ? 'Salvar Alterações' : 'Salvar Acompanhamento'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
