import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PreventiveMaintenanceItem, PreventiveStatus } from '../types';
import { 
    AlertTriangle, 
    Clock, 
    CheckCircle2, 
    Calendar, 
    User, 
    ArrowRight, 
    Wrench,
    TrendingUp,
    ShieldAlert,
    Check,
    ChevronRight,
    CheckSquare
} from 'lucide-react';

interface MaintenanceDashboardProps {
    employees: any[];
    onNavigateToPlan: () => void;
}

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ employees, onNavigateToPlan }) => {
    const [items, setItems] = useState<PreventiveMaintenanceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'SOON'>('ALL');

    useEffect(() => {
        const loadItems = async () => {
            try {
                const { data, error } = await supabase
                    .from('preventive_maintenance_plan')
                    .select('*');
                if (error) throw error;
                if (data) setItems(data);
            } catch (err) {
                console.error("Error loading dashboard items:", err);
            } finally {
                setLoading(false);
            }
        };
        loadItems();
    }, []);

    // Get helper names
    const getEmployeeName = (id?: string) => {
        if (!id) return 'Não atribuído';
        const emp = employees.find(e => e.id === id);
        return emp ? emp.name : 'Não atribuído';
    };

    // Parse description for clean display
    const cleanDescription = (desc: string) => {
        if (!desc) return '';
        return desc.split('||')[0].trim();
    };

    // Calculate urgency status
    const getMaintenanceStatus = (item: PreventiveMaintenanceItem) => {
        if (item.status === 'CONCLUIDO') {
            return { label: 'Concluído', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', type: 'OK' };
        }
        if (!item.nextDueDate) {
            return { label: 'Sem prazo', color: 'bg-gray-50 text-gray-400 border-gray-100', type: 'NONE' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(item.nextDueDate + 'T12:00:00');
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: 'Vencido', color: 'bg-red-50 text-red-700 border-red-150 animate-pulse', type: 'OVERDUE', days: Math.abs(diffDays) };
        } else if (diffDays <= 30) {
            return { label: `Vence em ${diffDays} dias`, color: 'bg-amber-50 text-amber-700 border-amber-100', type: 'SOON', days: diffDays };
        }

        return { label: 'Em dia', color: 'bg-blue-50 text-blue-700 border-blue-100', type: 'UPCOMING' };
    };

    // Process lists
    const processedItems = items.map(item => ({
        ...item,
        info: getMaintenanceStatus(item)
    }));

    const overdueCount = processedItems.filter(i => i.info.type === 'OVERDUE').length;
    const soonCount = processedItems.filter(i => i.info.type === 'SOON').length;
    const completedCount = processedItems.filter(i => i.status === 'CONCLUIDO').length;
    const pendingTotal = processedItems.length - completedCount;

    const complianceRate = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    // Filtered items for display
    const displayedItems = processedItems.filter(item => {
        if (filter === 'OVERDUE') return item.info.type === 'OVERDUE';
        if (filter === 'SOON') return item.info.type === 'SOON';
        return item.info.type === 'OVERDUE' || item.info.type === 'SOON';
    }).sort((a, b) => {
        // Show overdue first, then soonest nextDueDate
        if (a.info.type === 'OVERDUE' && b.info.type !== 'OVERDUE') return -1;
        if (a.info.type !== 'OVERDUE' && b.info.type === 'OVERDUE') return 1;
        if (!a.nextDueDate) return 1;
        if (!b.nextDueDate) return -1;
        return a.nextDueDate.localeCompare(b.nextDueDate);
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0 pb-16">
            
            {/* TOP HEADER */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-8 sm:p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-start md:items-center justify-between shadow-xl relative overflow-hidden gap-6 w-full">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 pointer-events-none"><Wrench size={160} /></div>
                <div className="relative z-10 space-y-2">
                    <span className="text-[10px] font-black uppercase bg-white/20 px-3 py-1 rounded-full border border-white/10 tracking-widest">Painel de Controle</span>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Painel Geral de Manutenções</h3>
                    <p className="text-orange-100 text-xs sm:text-sm font-medium">Gestão inteligente de prazos, conformidade e manutenções preventivas.</p>
                </div>
                <button 
                    onClick={onNavigateToPlan}
                    className="relative z-10 px-6 py-4 bg-white text-orange-700 hover:bg-orange-50 active:scale-95 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-black/10 shrink-0"
                >
                    <CheckSquare size={14} /> Acessar Cronograma Completo
                </button>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                
                {/* OVERDUE */}
                <div 
                    onClick={() => setFilter('OVERDUE')}
                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer ${filter === 'OVERDUE' ? 'bg-red-50 border-red-200 shadow-md ring-2 ring-red-500/20' : 'bg-white border-gray-100 hover:border-red-200 shadow-sm'}`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20">
                            <ShieldAlert size={20} />
                        </div>
                        <span className="text-[8px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase">Vencido</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{overdueCount}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Manutenções Atrasadas</p>
                </div>

                {/* DUE SOON */}
                <div 
                    onClick={() => setFilter('SOON')}
                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer ${filter === 'SOON' ? 'bg-amber-50 border-amber-200 shadow-md ring-2 ring-amber-500/20' : 'bg-white border-gray-100 hover:border-amber-200 shadow-sm'}`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                            <Clock size={20} />
                        </div>
                        <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">A Vencer</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{soonCount}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Próximos 30 dias</p>
                </div>

                {/* TOTAL PENDING */}
                <div 
                    onClick={() => setFilter('ALL')}
                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer ${filter === 'ALL' ? 'bg-orange-50 border-orange-200 shadow-md ring-2 ring-orange-500/20' : 'bg-white border-gray-100 hover:border-orange-200 shadow-sm'}`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-600/20">
                            <Calendar size={20} />
                        </div>
                        <span className="text-[8px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded uppercase">Total Alerta</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{overdueCount + soonCount}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Total pendentes de ação</p>
                </div>

                {/* COMPLIANCE RATE */}
                <div className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">Conformidade</span>
                        </div>
                        <p className="text-3xl font-black text-gray-900">{complianceRate}%</p>
                    </div>
                    <div className="w-full mt-3">
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${complianceRate}%` }}></div>
                        </div>
                        <p className="text-[8px] text-gray-400 font-bold uppercase mt-1.5">{completedCount} de {items.length} concluídas</p>
                    </div>
                </div>

            </div>

            {/* ALERT SECTION FOR PENDING MAINTENANCE */}
            <div className="bg-white border border-gray-150 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 pb-5">
                    <div>
                        <h4 className="text-base font-black text-gray-900 uppercase">Alertas de Prazos de Manutenção</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            {filter === 'OVERDUE' ? 'Apenas atividades vencidas' : 
                             filter === 'SOON' ? 'Apenas atividades a vencer (próximos 30 dias)' : 
                             'Todas as atividades em situação de alerta'}
                        </p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl text-[10px] font-black uppercase">
                        <button 
                            onClick={() => setFilter('ALL')}
                            className={`px-4 py-2 rounded-lg transition-all ${filter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                        >
                            Ver Todos ({overdueCount + soonCount})
                        </button>
                        <button 
                            onClick={() => setFilter('OVERDUE')}
                            className={`px-4 py-2 rounded-lg transition-all ${filter === 'OVERDUE' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}
                        >
                            Vencidos ({overdueCount})
                        </button>
                        <button 
                            onClick={() => setFilter('SOON')}
                            className={`px-4 py-2 rounded-lg transition-all ${filter === 'SOON' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}
                        >
                            A Vencer ({soonCount})
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400 font-black uppercase text-xs">Carregando dados...</div>
                ) : displayedItems.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                                    <th className="py-3 px-4">Item de Manutenção / Categoria</th>
                                    <th className="py-3 px-4">Frequência</th>
                                    <th className="py-3 px-4">Status Alerta</th>
                                    <th className="py-3 px-4">Prazo de Vencimento</th>
                                    <th className="py-3 px-4">Responsável Técnico</th>
                                    <th className="py-3 px-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                                {displayedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="py-4 px-4 font-medium">
                                            <p className="font-black text-gray-900 text-sm">{item.item}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black mt-0.5">{item.category}</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[9px] font-black uppercase">{item.frequency}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${item.info.color}`}>
                                                {item.info.label}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 font-bold text-gray-700">
                                            {item.nextDueDate ? new Date(item.nextDueDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir'}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <User size={12} className="text-gray-400" />
                                                <span className="font-bold text-gray-750">{getEmployeeName(item.responsibleId)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <button 
                                                onClick={onNavigateToPlan}
                                                className="inline-flex items-center justify-center gap-1 px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-[10px] font-black uppercase transition-all"
                                            >
                                                Ver no Plano <ChevronRight size={10} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl space-y-3">
                        <CheckCircle2 className="mx-auto text-emerald-100" size={48} />
                        <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma pendência crítica para exibir</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MaintenanceDashboard;
