
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    MessageSquare,
    Settings2,
    History,
    Save,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ExternalLink,
    Shield,
    Smartphone,
    Key,
    Globe2,
    BellRing,
    Trash2
} from 'lucide-react';

interface WhatsAppConfig {
    id: string;
    phone_number_id: string;
    waba_id: string;
    access_token: string;
    template_name: string;
    language_code: string;
    absence_threshold: number;
    is_enabled: boolean;
}

interface WhatsAppLog {
    id: string;
    student_name?: string;
    guardian_phone: string;
    status: string;
    sent_at: string;
    error_message?: string;
}

const BuscaAtivaContactChannels: React.FC = () => {
    const [config, setConfig] = useState<WhatsAppConfig | null>(null);
    const [logs, setLogs] = useState<WhatsAppLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('whatsapp_config')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) setConfig(data);
            else {
                // Initial state if no config exists
                setConfig({
                    id: '',
                    phone_number_id: '',
                    waba_id: '',
                    access_token: '',
                    template_name: 'aviso_falta',
                    language_code: 'pt_BR',
                    absence_threshold: 3,
                    is_enabled: false
                });
            }
        } catch (e) {
            console.error('Error fetching config:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            // Joining with students to get name
            const { data, error } = await supabase
                .from('whatsapp_logs')
                .select(`
          id,
          guardian_phone,
          status,
          sent_at,
          error_message,
          students ( name )
        `)
                .order('sent_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            if (data) {
                setLogs(data.map((l: any) => ({
                    id: l.id,
                    student_name: l.students?.name,
                    guardian_phone: l.guardian_phone,
                    status: l.status,
                    sent_at: l.sent_at,
                    error_message: l.error_message
                })));
            }
        } catch (e) {
            console.error('Error fetching logs:', e);
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchLogs();
    }, []);

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const { id, ...dataToSave } = config;
            let result;

            if (id) {
                result = await supabase
                    .from('whatsapp_config')
                    .update(dataToSave)
                    .eq('id', id);
            } else {
                result = await supabase
                    .from('whatsapp_config')
                    .insert([dataToSave]);
            }

            if (result.error) throw result.error;
            alert('Configurações salvas com sucesso!');
            fetchConfig();
        } catch (e) {
            console.error('Error saving config:', e);
            alert('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-24 text-center">
                <Loader2 className="animate-spin text-emerald-600 mx-auto" size={40} />
                <p className="mt-4 text-gray-400 font-black uppercase text-[10px] tracking-widest">Carregando Canais...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* HEADER PANEL */}
            <div className="bg-emerald-950 p-10 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><MessageSquare size={180} /></div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                            <Smartphone size={32} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Canais de Contato</h2>
                            <p className="text-emerald-200 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                                <Shield size={12} /> Integração Oficial Meta Cloud API
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/10 backdrop-blur-md relative z-10 mt-6 md:mt-0">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'config' ? 'bg-emerald-500 text-white shadow-lg' : 'text-emerald-100/50 hover:bg-white/5'}`}
                    >
                        <Settings2 size={14} /> Configuração
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-emerald-500 text-white shadow-lg' : 'text-emerald-100/50 hover:bg-white/5'}`}
                    >
                        <History size={14} /> Histórico
                    </button>
                </div>
            </div>

            {activeTab === 'config' && config && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* MAIN CONFIG FORM */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 border-t-8 border-t-emerald-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-gray-900 uppercase">Credenciais de Acesso</h3>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full border ${config.is_enabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                        {config.is_enabled ? 'Serviço Ativo' : 'Serviço Pausado'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={config.is_enabled}
                                            onChange={e => setConfig({ ...config, is_enabled: e.target.checked })}
                                        />
                                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Smartphone size={12} /> ID do Telefone (Phone Number ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={config.phone_number_id}
                                        onChange={e => setConfig({ ...config, phone_number_id: e.target.value })}
                                        placeholder="Ex: 105432..."
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Globe2 size={12} /> ID da Conta Business (WABA ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={config.waba_id}
                                        onChange={e => setConfig({ ...config, waba_id: e.target.value })}
                                        placeholder="Ex: 239871..."
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Key size={12} /> Token de Acesso Permanente
                                </label>
                                <textarea
                                    rows={3}
                                    value={config.access_token}
                                    onChange={e => setConfig({ ...config, access_token: e.target.value })}
                                    placeholder="EAAB..."
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none"
                                />
                            </div>

                            <div className="pt-8 border-t border-gray-50">
                                <h3 className="text-xl font-black text-gray-900 uppercase mb-6">Modelo da Mensagem (Template Meta)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Save size={12} /> Nome do Template
                                        </label>
                                        <input
                                            type="text"
                                            value={config.template_name}
                                            onChange={e => setConfig({ ...config, template_name: e.target.value })}
                                            placeholder="aviso_falta"
                                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <BellRing size={12} /> Gatilho de Faltas (Dias)
                                        </label>
                                        <input
                                            type="number"
                                            value={config.absence_threshold}
                                            onChange={e => setConfig({ ...config, absence_threshold: parseInt(e.target.value) })}
                                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Salvar Configurações
                            </button>
                        </div>
                    </div>

                    {/* HELP PANEL */}
                    <div className="space-y-6">
                        <div className="bg-indigo-900 p-8 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10"><Shield size={80} /></div>
                            <h4 className="text-lg font-black uppercase tracking-tight relative z-10">Como Configurar?</h4>
                            <ul className="space-y-4 relative z-10">
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-xs font-black">1</div>
                                    <p className="text-[10px] font-medium leading-relaxed italic text-indigo-100">Crie um aplicativo em <strong>developers.facebook.com</strong> com o produto "WhatsApp".</p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-xs font-black">2</div>
                                    <p className="text-[10px] font-medium leading-relaxed italic text-indigo-100">Crie um <strong>Template de Mensagem</strong> com a variável <code>{"{{1}}"}</code> para o nome do aluno.</p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-xs font-black">3</div>
                                    <p className="text-[10px] font-medium leading-relaxed italic text-indigo-100">Gere um <strong>System User Token</strong> permanente para não precisar renovar a senha.</p>
                                </li>
                            </ul>
                            <a
                                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                                target="_blank"
                                className="w-full py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10 mt-6"
                            >
                                Documentação Meta <ExternalLink size={14} />
                            </a>
                        </div>

                        <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100">
                            <div className="flex items-center gap-3 text-amber-600 mb-4">
                                <AlertCircle size={20} />
                                <h5 className="text-xs font-black uppercase">Regra do Grátis</h5>
                            </div>
                            <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
                                As primeiras 1.000 conversas de serviço por mês são gratuitas. Certifique-se de que o seu template está aprovado na categoria "UTILITY" para usar essa quota.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in zoom-in-95 duration-300">
                    {logs.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 italic">
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Data/Hora</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aluno</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefone</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-10 py-6 text-[11px] font-bold text-gray-500 text-center">
                                            {new Date(log.sent_at).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-xs font-black text-gray-900 uppercase">{log.student_name || 'N/A'}</p>
                                        </td>
                                        <td className="px-10 py-6 text-xs text-gray-500 font-mono italic">
                                            {log.guardian_phone}
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase border ${log.status === 'sent' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    log.status === 'failed' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {log.status === 'sent' ? 'Enviado' : log.status === 'failed' ? 'Erro' : 'Pendente'}
                                            </span>
                                            {log.error_message && (
                                                <p className="text-[7px] text-red-400 mt-2 font-black uppercase">{log.error_message}</p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-32 text-center">
                            <History size={64} className="mx-auto mb-4 text-emerald-50" />
                            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum log de aviso encontrado</p>
                            <p className="text-[10px] text-gray-300 font-bold uppercase mt-2 italic">O histórico aparecerá conforme os alertas forem disparados automaticamente</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BuscaAtivaContactChannels;
