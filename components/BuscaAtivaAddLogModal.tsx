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
}

const ACTION_TYPES = [
    { id: 'TELEFONE', label: 'Contato Telefônico', icon: Phone },
    { id: 'WHATSAPP', label: 'Mensagem WhatsApp', icon: MessageSquare },
    { id: 'VISITA', label: 'Visita Domiciliar', icon: Home },
    { id: 'REUNIAO', label: 'Reunião Presencial', icon: Users },
    { id: 'OUTRO', label: 'Outra Intervenção', icon: AlertTriangle },
];

export default function BuscaAtivaAddLogModal({ student, protocolItems, actionsStatus, onClose, onSuccess }: BuscaAtivaAddLogModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedProtocolItems, setSelectedProtocolItems] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        date: new Date().toLocaleDateString('sv-SE'),
        time: new Date().toLocaleTimeString('pt-BR', { hour12: false }).substring(0, 5),
        type: 'TELEFONE',
        description: '',
        contact_person: '',
        severity: 'NORMAL',
        responsible_name: 'Angela'
    });

    const toggleProtocolItem = (id: string) => {
        setSelectedProtocolItems(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Save Log Entry
            const { error: logError } = await supabase
                .from('occurrences')
                .insert([{
                    student_id: student.id,
                    student_name: student.name,
                    classroom_name: student.class,
                    classroom_id: student.classroom_id,
                    date: formData.date,
                    time: formData.time,
                    category: 'BUSCA_ATIVA',
                    severity: formData.severity,
                    description: `[${formData.type}] ${formData.description}${formData.contact_person ? ` (Contato: ${formData.contact_person})` : ''}`,
                    status: 'REGISTRADO',
                    location: formData.contact_person || 'Escola',
                    responsible_name: formData.responsible_name
                }]);

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

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl border border-emerald-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[95vh]">
                
                {/* HEADER */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Registrar Acompanhamento</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {student.name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all">
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
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:bg-white focus:border-emerald-500 transition-all"
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
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:bg-white focus:border-emerald-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meio de Contato</label>
                        <div className="grid grid-cols-3 gap-2">
                            {ACTION_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData({...formData, type: type.id})}
                                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.type === type.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white border-gray-100 text-gray-400 hover:bg-emerald-50'}`}
                                >
                                    <type.icon size={18} />
                                    <span className="text-[8px] font-black uppercase text-center leading-none">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pessoa Contatada</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Mãe (Dona Maria)"
                            value={formData.contact_person}
                            onChange={e => setFormData({...formData, contact_person: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Servidor Responsável</label>
                        <div className="grid grid-cols-2 gap-2">
                             {['Angela', 'Zenir'].map(name => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setFormData({...formData, responsible_name: name})}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                        formData.responsible_name === name 
                                            ? 'bg-gray-900 border-gray-900 text-white shadow-lg' 
                                            : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                                    }`}
                                >
                                    {name}
                                </button>
                             ))}
                        </div>
                    </div>

                    <div className="space-y-1.5 bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50">
                        <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 flex items-center gap-1.5 mb-3">
                           <ShieldAlert size={12} /> Vincular Ações do Protocolo (Art. 23)
                        </label>
                        <div className="space-y-2">
                            {protocolItems.map(item => {
                                const isAlreadyDone = actionsStatus[item.id]?.status === 'CONCLUIDO';
                                const isSelected = selectedProtocolItems.includes(item.id);
                                
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        disabled={isAlreadyDone}
                                        onClick={() => toggleProtocolItem(item.id)}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                                            isAlreadyDone ? 'bg-gray-100 border-transparent opacity-60' :
                                            isSelected ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 
                                            'bg-white border-gray-100 text-gray-500 hover:border-emerald-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-gray-50'}`}>
                                                <item.icon size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-tight">{item.label}</p>
                                                {isAlreadyDone && <p className="text-[8px] font-bold uppercase text-emerald-600">Já concluído</p>}
                                            </div>
                                        </div>
                                        {isSelected && <Save size={14} className="animate-bounce" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações do Atendimento</label>
                        <textarea 
                            required
                            placeholder="Descreva o que foi conversado ou o resultado da visita..."
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:border-emerald-500 transition-all resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        Salvar Acompanhamento
                    </button>
                </form>
            </div>
        </div>
    );
}
