
import React, { useState, useEffect, useMemo } from 'react';
import {
    ClipboardCheck,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    FileText,
    Save,
    Users,
    DollarSign,
    ChevronDown,
    ChevronUp,
    Download,
    PieChart,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { PreventiveMaintenanceItem, MaintenanceFrequency, PreventiveStatus, StaffMember } from '../types';
import { supabase } from '../supabaseClient';

// --- DATA FROM MANUAL (SEDUC-MT 2025) ---
const MANUAL_ITEMS: Omit<PreventiveMaintenanceItem, 'id' | 'status'>[] = [
    // 7.1 SISTEMAS CONSTRUTIVOS
    { category: 'SISTEMAS CONSTRUTIVOS', item: 'Estrutura (Alvenaria/Concreto)', intervention: 'Inspeção Visual', description: 'Verificar fissuras, infiltrações, desprendimento de revestimentos.', frequency: 'SEMESTRAL' },

    // 7.2 COBERTURA
    { category: 'COBERTURA', item: 'Telhas', intervention: 'Inspeção Visual', description: 'Verificar telhas quebradas, soltas ou desalinhadas.', frequency: 'SEMESTRAL' },
    { category: 'COBERTURA', item: 'Estrutura do Telhado', intervention: 'Inspeção Visual', description: 'Avaliar estado da madeira/metal (ferrugem, cupim) e fixações.', frequency: 'SEMESTRAL' },
    { category: 'COBERTURA', item: 'Calhas e Rufos', intervention: 'Limpeza', description: 'Remover folhas e detritos para evitar entupimentos.', frequency: 'SEMESTRAL' },

    // 7.3 FORRO
    { category: 'FORRO', item: 'Placas e Estrutura', intervention: 'Inspeção Visual', description: 'Verificar manchas, ondulações, infiltrações e fixação.', frequency: 'SEMESTRAL' },

    // 7.4 PISOS E REVESTIMENTOS
    { category: 'PISOS E REVESTIMENTOS', item: 'Pisos Internos', intervention: 'Inspeção Visual', description: 'Verificar peças soltas, trincadas ou manchadas.', frequency: 'ANUAL' },

    // 7.5 PINTURA
    { category: 'PINTURA', item: 'Paredes Internas/Externas', intervention: 'Inspeção Visual', description: 'Verificar manchas, bolhas, descascamento.', frequency: 'BIENAL' },

    // 7.6 ESQUADRIAS
    { category: 'ESQUADRIAS', item: 'Portas e Janelas', intervention: 'Inspeção Visual', description: 'Verificar empenamento, trincos, fechaduras e vidros.', frequency: 'ANUAL' },
    { category: 'ESQUADRIAS', item: 'Dobradiças/Fechaduras', intervention: 'Limpeza/Lubrificação', description: 'Lubrificar para garantir funcionamento suave.', frequency: 'ANUAL' },

    // 7.7 INSTALAÇÕES ELÉTRICAS
    { category: 'ELÉTRICA', item: 'Fiação e Cabos', intervention: 'Inspeção Visual', description: 'Identificar desgastes, superaquecimento, fios expostos.', frequency: 'ANUAL' },
    { category: 'ELÉTRICA', item: 'Quadros de Energia', intervention: 'Limpeza', description: 'Remover poeira (por especialista) para evitar superaquecimento.', frequency: 'TRIMESTRAL' },
    { category: 'ELÉTRICA', item: 'SPDA (Para-raios)', intervention: 'Inspeção Visual', description: 'Verificar integridade de captores e descidas.', frequency: 'ANUAL' },
    { category: 'ELÉTRICA', item: 'Aterramento', intervention: 'Teste', description: 'Medição de resistência de terra (Especialista).', frequency: 'ANUAL' },

    // 7.8 HIDROSSANITÁRIAS
    { category: 'HIDRÁULICA', item: 'Caixa d\'água / Cisterna', intervention: 'Inspeção Visual', description: 'Verificar rachaduras na estrutura e vedação da tampa.', frequency: 'ANUAL' },
    { category: 'HIDRÁULICA', item: 'Caixa d\'água / Cisterna', intervention: 'Limpeza', description: 'Limpeza completa e desinfecção.', frequency: 'ANUAL' },
    { category: 'HIDRÁULICA', item: 'Ralos e Sifões', intervention: 'Limpeza', description: 'Remover resíduos e verificar escoamento.', frequency: 'MENSAL' },
    { category: 'HIDRÁULICA', item: 'Válvulas de Descarga', intervention: 'Inspeção Visual', description: 'Verificar vazamentos e funcionamento do acionamento.', frequency: 'MENSAL' },
    { category: 'HIDRÁULICA', item: 'Caixa de Gordura', intervention: 'Limpeza', description: 'Remoção de gordura e resíduos sólidos.', frequency: 'MENSAL' },
    { category: 'HIDRÁULICA', item: 'Instalações de Gás', intervention: 'Inspeção Visual', description: 'Verificar validade de mangueiras e vazamentos (água+sabão).', frequency: 'MENSAL' },

    // 7.9 INCÊNDIO
    { category: 'INCÊNDIO', item: 'Extintores', intervention: 'Inspeção Visual', description: 'Verificar manômetro, lacre, validade e acesso desobstruído.', frequency: 'MENSAL' },
    { category: 'INCÊNDIO', item: 'Hidrantes', intervention: 'Teste', description: 'Teste de funcionamento e vedação.', frequency: 'ANUAL' },
    { category: 'INCÊNDIO', item: 'Iluminação de Emergência', intervention: 'Teste', description: 'Simular falta de energia para verificar acionamento.', frequency: 'SEMESTRAL' },

    // 7.13 IMPLANTAÇÃO
    { category: 'EXTERNA', item: 'Muros e Gradis', intervention: 'Inspeção Visual', description: 'Verificar estabilidade, fissuras e corrosão.', frequency: 'SEMESTRAL' },
    { category: 'EXTERNA', item: 'Depósito de Lixo', intervention: 'Limpeza', description: 'Limpeza profunda e desinfecção.', frequency: 'SEMANAL' },
    { category: 'EXTERNA', item: 'Calhas e Drenagem', intervention: 'Limpeza', description: 'Desobstrução de canaletas e caixas de areia.', frequency: 'SEMESTRAL' },
    { category: 'EXTERNA', item: 'Controle de Pragas', intervention: 'Dedetização', description: 'Serviço especializado.', frequency: 'SEMESTRAL' },

    // 7.15 EQUIPAMENTOS
    { category: 'EQUIPAMENTOS', item: 'Ar Condicionado', intervention: 'Limpeza de Filtros', description: 'Limpeza dos filtros de ar.', frequency: 'MENSAL' },
    { category: 'EQUIPAMENTOS', item: 'Ar Condicionado', intervention: 'Limpeza Interna', description: 'Higienização profunda (Especialista).', frequency: 'SEMESTRAL' },
    { category: 'EQUIPAMENTOS', item: 'Bebedouros', intervention: 'Troca de Filtro', description: 'Substituição do elemento filtrante.', frequency: 'MENSAL' },
    { category: 'EQUIPAMENTOS', item: 'Bebedouros', intervention: 'Higienização', description: 'Limpeza interna do reservatório.', frequency: 'SEMESTRAL' },
    { category: 'EQUIPAMENTOS', item: 'Computadores', intervention: 'Limpeza Externa', description: 'Remover poeira de gabinete e periféricos.', frequency: 'ANUAL' },
];

const PreventiveMaintenancePlan: React.FC<{ employees: any[] }> = ({ employees }) => {
    const [items, setItems] = useState<PreventiveMaintenanceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('TODOS');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // Initialize Data
    useEffect(() => {
        const loadItems = async () => {
            try {
                const { data, error } = await supabase.from('preventive_maintenance_plan').select('*');
                if (error) throw error;

                if (data && data.length > 0) {
                    setItems(data);
                } else {
                    const seedData = MANUAL_ITEMS.map(m => ({
                        ...m,
                        status: 'PENDENTE' as PreventiveStatus,
                        created_at: new Date().toISOString()
                    }));

                    const { data: inserted, error: insertError } = await supabase
                        .from('preventive_maintenance_plan')
                        .insert(seedData)
                        .select();

                    if (insertError) throw insertError;
                    if (inserted) setItems(inserted);
                }
            } catch (err) {
                console.error("Error loading plan:", err);
            } finally {
                setLoading(false);
            }
        };
        loadItems();
    }, []);

    const updateItem = async (id: string, updates: Partial<PreventiveMaintenanceItem>) => {
        // Optimistic update
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));

        try {
            await supabase.from('preventive_maintenance_plan').update(updates).eq('id', id);
        } catch (err) {
            console.error("Failed to update item:", err);
        }
    };

    const uniqueCategories = useMemo(() => {
        return Array.from(new Set(items.map(i => i.category)));
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'TODOS' || item.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, filterCategory]);

    const groupedItems = useMemo(() => {
        const groups: Record<string, PreventiveMaintenanceItem[]> = {};
        filteredItems.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [filteredItems]);

    // Auto-expand category when filtering or when data loads
    useEffect(() => {
        const availableCategories = Object.keys(groupedItems);
        if (availableCategories.length > 0) {
            // If currently active category is not in the new list, or if we just loaded/filtered
            // We check only when groups change (filter/load), not when user clicks (activeCategory changes)
            if (!activeCategory || !availableCategories.includes(activeCategory)) {
                setActiveCategory(availableCategories[0]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupedItems]);

    const stats = useMemo(() => {
        const total = items.length;
        const completed = items.filter(i => i.status === 'CONCLUIDO').length;
        const pending = items.filter(i => i.status === 'PENDENTE').length;
        const ongoing = items.filter(i => i.status === 'EM_EXECUCAO').length;
        const totalCost = items.reduce((acc, curr) => acc + (curr.cost || 0), 0);
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, pending, ongoing, totalCost, progress };
    }, [items]);

    const getStatusColor = (status: PreventiveStatus) => {
        switch (status) {
            case 'CONCLUIDO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'EM_EXECUCAO': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'AGENDADO': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getUrgency = (nextDate?: string) => {
        if (!nextDate) return 'normal';
        const now = new Date();
        const due = new Date(nextDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'overdue';
        if (diffDays <= 7) return 'urgent';
        return 'normal';
    };

    const calculateNextDue = (lastDate: string, frequency: MaintenanceFrequency) => {
        const date = new Date(lastDate);
        switch (frequency) {
            case 'SEMANAL': date.setDate(date.getDate() + 7); break;
            case 'MENSAL': date.setMonth(date.getMonth() + 1); break;
            case 'TRIMESTRAL': date.setMonth(date.getMonth() + 3); break;
            case 'SEMESTRAL': date.setMonth(date.getMonth() + 6); break;
            case 'ANUAL': date.setFullYear(date.getFullYear() + 1); break;
            case 'BIENAL': date.setFullYear(date.getFullYear() + 2); break;
            default: break;
        }
        return date.toISOString().split('T')[0];
    };

    const handleExecutionChange = (id: string, date: string, freq: MaintenanceFrequency) => {
        const nextDue = calculateNextDue(date, freq);
        updateItem(id, {
            lastExecutionDate: date,
            nextDueDate: nextDue,
            status: 'CONCLUIDO'
        });
    };

    const generatePDF = (type: 'ANEXO_II' | 'ANEXO_III' | 'ANEXO_IV') => {
        const reportId = `report-${type}`;
        const element = document.getElementById(reportId);

        if (!element) return;

        // @ts-ignore
        window.html2pdf().set({
            margin: 10,
            filename: `${type}_SEDUC_2025.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: type === 'ANEXO_II' ? 'landscape' : 'portrait' }
        }).from(element).save();
    };

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"></div></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header & Dashboard */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
                            <ClipboardCheck size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Plano Preventivo</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Gestão & Relatórios Oficiais (SEDUC-MT)</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => generatePDF('ANEXO_II')} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-200">
                            <Calendar size={14} /> Anexo II (Cronograma)
                        </button>
                        <button onClick={() => generatePDF('ANEXO_III')} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-200">
                            <AlertTriangle size={14} /> Anexo III (Demandas)
                        </button>
                        <button onClick={() => generatePDF('ANEXO_IV')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-200">
                            <CheckCircle2 size={14} /> Anexo IV (Intervenções)
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <PieChart size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Progresso</span>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{stats.progress}%</p>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${stats.progress}%` }}></div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <AlertCircle size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Pendências</span>
                        </div>
                        <p className="text-2xl font-black text-orange-600">{stats.pending}</p>
                        <p className="text-[9px] text-gray-400 font-medium">Itens a verificar</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <TrendingUp size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Em Execução</span>
                        </div>
                        <p className="text-2xl font-black text-blue-600">{stats.ongoing}</p>
                        <p className="text-[9px] text-gray-400 font-medium">Manutenções ativas</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <DollarSign size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Investimento</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-600">R$ {stats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[9px] text-gray-400 font-medium">Total acumulado ({new Date().getFullYear()})</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-wrap gap-4 items-center shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar item..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 border-r-8 border-transparent cursor-pointer"
                >
                    <option value="TODOS">Todas Categorias</option>
                    {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Accordion List */}
            <div className="space-y-4">
                {(Object.entries(groupedItems) as [string, PreventiveMaintenanceItem[]][]).map(([cat, catItems]) => (
                    <div key={cat} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                        <button
                            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                            className="w-full flex items-center justify-between p-6 bg-gray-50/50 hover:bg-white transition-colors text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${activeCategory === cat ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-200 text-gray-500'} transition-all`}>
                                    {activeCategory === cat ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{cat}</h3>
                                <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black">{catItems.length} itens</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">{catItems.filter(i => i.status === 'CONCLUIDO').length} OK</div>
                                <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-bold">{catItems.filter(i => i.status === 'PENDENTE').length} Pendentes</div>
                            </div>
                        </button>

                        {activeCategory === cat && (
                            <div className="p-6 border-t border-gray-100 overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                            <th className="pb-4 pl-2">Item / Intervenção</th>
                                            <th className="pb-4">Frequência</th>
                                            <th className="pb-4">Status</th>
                                            <th className="pb-4">Datas</th>
                                            <th className="pb-4">Responsável</th>
                                            <th className="pb-4">Custo (R$)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs text-gray-600">
                                        {catItems.map(item => {
                                            const urgency = getUrgency(item.nextDueDate);
                                            return (
                                                <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/10 transition-colors group">
                                                    <td className="py-4 pl-2 font-medium">
                                                        <p className="font-black text-gray-900 text-sm">{item.item}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">{item.intervention}</p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5 italic max-w-xs">{item.description}</p>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-bold">{item.frequency}</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <select
                                                            value={item.status}
                                                            onChange={(e) => updateItem(item.id, { status: e.target.value as PreventiveStatus })}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase outline-none border ${getStatusColor(item.status)} cursor-pointer transition-all focus:ring-2 focus:ring-offset-1`}
                                                        >
                                                            <option value="PENDENTE">Pendente</option>
                                                            <option value="AGENDADO">Agendado</option>
                                                            <option value="EM_EXECUCAO">Em Execução</option>
                                                            <option value="CONCLUIDO">Concluído</option>
                                                        </select>
                                                    </td>
                                                    <td className="py-4 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-gray-400 w-10">REALIZ:</span>
                                                            <input
                                                                type="date"
                                                                value={item.lastExecutionDate || ''}
                                                                onChange={(e) => handleExecutionChange(item.id, e.target.value, item.frequency)}
                                                                className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] outline-none focus:border-orange-300 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-gray-400 w-10">VENC:</span>
                                                            <div className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] bg-white border ${urgency === 'overdue' ? 'border-red-300 text-red-600 bg-red-50' : urgency === 'urgent' ? 'border-amber-300 text-amber-600 bg-amber-50' : 'border-gray-200'}`}>
                                                                {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString('pt-BR') : '-'}
                                                                {urgency === 'overdue' && <AlertTriangle size={12} />}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <select
                                                            value={item.responsibleId || ''}
                                                            onChange={(e) => updateItem(item.id, { responsibleId: e.target.value })}
                                                            className="w-32 bg-white border border-gray-200 rounded px-2 py-1 text-[10px] outline-none focus:border-orange-300 transition-colors"
                                                        >
                                                            <option value="">Selecione...</option>
                                                            {employees.map(emp => (
                                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="relative w-24">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">R$</span>
                                                            <input
                                                                type="number"
                                                                value={item.cost || ''}
                                                                onChange={(e) => updateItem(item.id, { cost: parseFloat(e.target.value) })}
                                                                placeholder="0,00"
                                                                className="w-full pl-6 pr-2 py-1 bg-white border border-gray-200 rounded text-[10px] outline-none focus:border-orange-300 transition-colors"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* HIDDEN REPORT TEMPLATES FOR PDF GENERATION */}
            <div className="fixed top-0 left-0 w-full h-0 overflow-hidden">

                {/* ANEXO II - CRONOGRAMA */}
                <div id="report-ANEXO_II" className="p-8 bg-white" style={{ width: '297mm', minHeight: '210mm' }}>
                    <div className="mb-6 text-center border-b-2 border-gray-900 pb-4">
                        <h1 className="text-xl font-bold uppercase">ANEXO II – CRONOGRAMA DE MANUTENÇÃO PREVENTIVA</h1>
                        <p className="text-sm">Planejamento Anual - Unidade Escolar</p>
                    </div>
                    <table className="w-full border-collapse border border-gray-800 text-[9px]">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-800 p-2 text-left w-1/3">SISTEMA / ITEM</th>
                                <th className="border border-gray-800 p-2 text-center w-16">FREQ.</th>
                                {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map(m => (
                                    <th key={m} className="border border-gray-800 p-2 text-center">{m}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const isScheduledMonth = (monthIndex: number) => {
                                    const interval = item.frequency === 'MENSAL' ? 1 :
                                        item.frequency === 'TRIMESTRAL' ? 3 :
                                            item.frequency === 'SEMESTRAL' ? 6 :
                                                item.frequency === 'ANUAL' ? 12 : 0;
                                    return interval > 0 && (monthIndex % interval === 0);
                                };

                                return (
                                    <tr key={item.id}>
                                        <td className="border border-gray-800 p-1 font-bold truncate max-w-xs">{item.item}</td>
                                        <td className="border border-gray-800 p-1 text-center">{item.frequency.substring(0, 3)}</td>
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <td key={i} className="border border-gray-800 p-1 text-center">
                                                {isScheduledMonth(i) && <div className="w-2 h-2 bg-gray-600 rounded-full mx-auto"></div>}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ANEXO III - DEMANDAS */}
                <div id="report-ANEXO_III" className="p-8 bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
                    <div className="mb-6 text-center border-b-2 border-gray-900 pb-4">
                        <h1 className="text-xl font-bold uppercase">ANEXO III – RELATÓRIO DE DEMANDA</h1>
                        <p className="text-sm">Levantamento de Necessidades de Manutenção</p>
                    </div>
                    <div className="space-y-6">
                        {items.filter(i => i.status !== 'CONCLUIDO').map((item, idx) => (
                            <div key={item.id} className="border border-gray-800 break-inside-avoid">
                                <div className="bg-gray-100 p-2 border-b border-gray-800 flex justify-between font-bold text-xs uppercase">
                                    <span>ITEM {idx + 1}: {item.item} ({item.category})</span>
                                    <span>Prioridade: {getUrgency(item.nextDueDate) === 'overdue' ? 'ALTA' : 'NORMAL'}</span>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <p className="mb-2"><strong>Problema / Condição:</strong> {item.description}</p>
                                        <p className="mb-2"><strong>Ação Necessária:</strong> {item.intervention}</p>
                                        <p><strong>Prazo:</strong> {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString('pt-BR') : 'A definir'}</p>
                                    </div>
                                    <div className="h-24 border border-gray-300 border-dashed flex items-center justify-center text-gray-400 text-[10px]">
                                        FOTO DO LOCAL
                                    </div>
                                </div>
                            </div>
                        ))}
                        {items.filter(i => i.status !== 'CONCLUIDO').length === 0 && (
                            <p className="text-center text-gray-500 italic py-10">Nenhuma pendência registrada no momento.</p>
                        )}
                    </div>
                </div>

                {/* ANEXO IV - INTERVENÇÕES */}
                <div id="report-ANEXO_IV" className="p-8 bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
                    <div className="mb-6 text-center border-b-2 border-gray-900 pb-4">
                        <h1 className="text-xl font-bold uppercase">ANEXO IV – IDENTIFICAÇÃO DE INTERVENÇÕES</h1>
                        <p className="text-sm">Relatório Financeiro e Executivo</p>
                    </div>
                    <table className="w-full border-collapse border border-gray-800 text-xs">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-800 p-2 text-left w-1/3">DESCRIÇÃO DO SERVIÇO</th>
                                <th className="border border-gray-800 p-2 text-left">TIPO</th>
                                <th className="border border-gray-800 p-2 text-center w-24">DATA</th>
                                <th className="border border-gray-800 p-2 text-right w-24">VALOR (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.filter(i => i.status === 'CONCLUIDO').map(item => (
                                <tr key={item.id}>
                                    <td className="border border-gray-800 p-2">{item.item} - {item.description}</td>
                                    <td className="border border-gray-800 p-2 uppercase">{item.intervention}</td>
                                    <td className="border border-gray-800 p-2 text-center">
                                        {item.lastExecutionDate ? new Date(item.lastExecutionDate).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="border border-gray-800 p-2 text-right">
                                        {item.cost ? item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-200 font-bold">
                                <td colSpan={3} className="border border-gray-800 p-2 text-right">TOTAL INVESTIDO:</td>
                                <td className="border border-gray-800 p-2 text-right">
                                    {items.filter(i => i.status === 'CONCLUIDO').reduce((a, b) => a + (b.cost || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="mt-8 pt-8 border-t border-gray-400 flex justify-between text-xs text-center">
                        <div className="w-1/3 border-t border-black pt-2">DIRETOR(A) ESCOLAR</div>
                        <div className="w-1/3 border-t border-black pt-2">RESPONSÁVEL TÉCNICO</div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PreventiveMaintenancePlan;
