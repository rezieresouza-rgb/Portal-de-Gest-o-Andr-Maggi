import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    CheckCircle2,
    Circle,
    ChevronDown,
    ChevronRight,
    Calendar,
    AlertTriangle,
    Clock,
    Filter,
    UserPlus,
    Printer,
    FileText,
    Users,
    X
} from 'lucide-react';

interface MaintenanceTask {
    id: string;
    block: string;
    area_name: string;
    task_description: string;
    frequency: 'DIARIA' | 'SEMANAL' | 'MENSAL' | 'BIMESTRAL';
    last_executed_at: string | null;
    assigned_employee_name?: string | null;
    status?: 'PENDENTE' | 'CONCLUIDO' | 'ATRASADO';
}

interface MaintenanceSchedulerProps {
    employees: { id: string, name: string }[];
}

const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({ employees }) => {
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({
        'Bloco I - Térreo': true
    });
    const [filterFrequency, setFilterFrequency] = useState<string>('ALL');

    // Assignment Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<{ block: string, area: string } | null>(null);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data: tasksData, error: tasksError } = await supabase
                .from('maintenance_tasks')
                .select('*')
                .order('area_name');

            if (tasksError) throw tasksError;

            const { data: recordsData, error: recordsError } = await supabase
                .from('maintenance_records')
                .select('task_id, completed_at, status')
                .order('completed_at', { ascending: false });

            if (recordsError) throw recordsError;

            const mergedTasks = tasksData.map(task => {
                const lastRecord = recordsData.find((r: any) => r.task_id === task.id);
                let status: 'PENDENTE' | 'CONCLUIDO' | 'ATRASADO' = 'PENDENTE';

                if (lastRecord) {
                    const completedDate = new Date(lastRecord.completed_at);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - completedDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (task.frequency === 'DIARIA' && diffDays <= 1) status = 'CONCLUIDO';
                    else if (task.frequency === 'SEMANAL' && diffDays <= 7) status = 'CONCLUIDO';
                    else if (task.frequency === 'MENSAL' && diffDays <= 30) status = 'CONCLUIDO';
                    else if (task.frequency === 'BIMESTRAL' && diffDays <= 60) status = 'CONCLUIDO';
                    else status = 'ATRASADO';
                }

                return {
                    ...task,
                    last_executed_at: lastRecord ? lastRecord.completed_at : null,
                    status
                };
            });

            setTasks(mergedTasks);

        } catch (error) {
            console.error('Error fetching maintenance tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsDone = async (task: MaintenanceTask) => {
        try {
            const { error } = await supabase.from('maintenance_records').insert([{
                task_id: task.id,
                status: 'CONCLUIDO',
                completed_at: new Date().toISOString(),
                performed_by_name: task.assigned_employee_name
            }]);

            if (error) throw error;

            setTasks(prev => prev.map(t =>
                t.id === task.id
                    ? { ...t, status: 'CONCLUIDO', last_executed_at: new Date().toISOString() }
                    : t
            ));

        } catch (error) {
            console.error('Error completing task:', error);
            alert('Erro ao concluir tarefa.');
        }
    };

    const toggleBlock = (block: string) => {
        setExpandedBlocks(prev => ({ ...prev, [block]: !prev[block] }));
    };

    const handleAssignEmployee = async () => {
        if (!selectedAssignment || !selectedEmployeeName) return;

        try {
            const { error } = await supabase
                .from('maintenance_tasks')
                .update({ assigned_employee_name: selectedEmployeeName })
                .match({ block: selectedAssignment.block, area_name: selectedAssignment.area });

            if (error) throw error;

            setTasks(prev => prev.map(t =>
                (t.block === selectedAssignment.block && t.area_name === selectedAssignment.area)
                    ? { ...t, assigned_employee_name: selectedEmployeeName }
                    : t
            ));

            setIsAssignModalOpen(false);
            setSelectedAssignment(null);
            setSelectedEmployeeName('');
            alert('Responsável definido com sucesso!');

        } catch (error) {
            console.error('Error assigning employee:', error);
            alert('Erro ao definir responsável.');
        }
    };

    const generateWeeklyReport = async () => {
        const element = document.getElementById('weekly-report-print');
        if (!element) return;

        const opt = {
            margin: 5,
            filename: `Relatorio_Semanal_Manutencao_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();
    };

    // Grouping
    const groupedTasks = tasks.reduce((acc, task) => {
        if (filterFrequency !== 'ALL' && task.frequency !== filterFrequency) return acc;

        if (!acc[task.block]) acc[task.block] = {};
        if (!acc[task.block][task.area_name]) acc[task.block][task.area_name] = [];

        acc[task.block][task.area_name].push(task);
        return acc;
    }, {} as Record<string, Record<string, MaintenanceTask[]>>);

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'DIARIA': return 'Diária';
            case 'SEMANAL': return 'Semanal';
            case 'MENSAL': return 'Mensal';
            case 'BIMESTRAL': return 'Bimestral';
            default: return freq;
        }
    };

    const getFrequencyColor = (freq: string) => {
        switch (freq) {
            case 'DIARIA': return 'text-blue-600 bg-blue-50';
            case 'SEMANAL': return 'text-purple-600 bg-purple-50';
            case 'MENSAL': return 'text-orange-600 bg-orange-50';
            case 'BIMESTRAL': return 'text-pink-600 bg-pink-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    // Helper to get responsible for an area (assuming all tasks in area have same responsible)
    const getAreaResponsible = (block: string, area: string) => {
        const areaTasks = tasks.filter(t => t.block === block && t.area_name === area);
        return areaTasks.find(t => t.assigned_employee_name)?.assigned_employee_name || null;
    };

    return (
        <div className="space-y-6">
            {/* Header / Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                    {['ALL', 'DIARIA', 'SEMANAL', 'MENSAL', 'BIMESTRAL'].map(freq => (
                        <button
                            key={freq}
                            onClick={() => setFilterFrequency(freq)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${filterFrequency === freq
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            {freq === 'ALL' ? 'Todos' : getFrequencyLabel(freq)}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={generateWeeklyReport}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg"
                    >
                        <Printer size={16} /> Imprimir Relatório
                    </button>
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black uppercase text-gray-400">Total de Tarefas</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{tasks.length}</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Carregando cronograma...</div>
            ) : Object.keys(groupedTasks).length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                    <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase text-xs">Nenhuma tarefa encontrada</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.keys(groupedTasks).sort().map(block => (
                        <div key={block} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">

                            {/* BLOCK HEADER */}
                            <button
                                onClick={() => toggleBlock(block)}
                                className="w-full flex items-center justify-between p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                            >
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                                    {block.includes('Bloco I') ? <span className="w-2 h-8 bg-indigo-500 rounded-full"></span> :
                                        block.includes('Bloco II') ? <span className="w-2 h-8 bg-emerald-500 rounded-full"></span> :
                                            <span className="w-2 h-8 bg-amber-500 rounded-full"></span>}
                                    {block}
                                </h3>
                                {expandedBlocks[block] ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
                            </button>

                            {/* AREAS LIST */}
                            {expandedBlocks[block] && (
                                <div className="divide-y divide-gray-100">
                                    {Object.keys(groupedTasks[block]).sort().map(area => {
                                        const responsible = getAreaResponsible(block, area);
                                        return (
                                            <div key={area} className="p-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="text-sm font-black text-gray-700 uppercase flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                                        {area}
                                                    </h4>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAssignment({ block, area });
                                                            setSelectedEmployeeName(responsible || '');
                                                            setIsAssignModalOpen(true);
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-[9px] font-black uppercase tracking-wide"
                                                    >
                                                        <UserPlus size={12} />
                                                        {responsible ? responsible : 'Definir Responsável'}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                    {groupedTasks[block][area].map(task => (
                                                        <div key={task.id} className={`p-4 rounded-xl border transition-all ${task.status === 'CONCLUIDO' ? 'bg-emerald-50/30 border-emerald-100' :
                                                                task.status === 'ATRASADO' ? 'bg-red-50/30 border-red-100' :
                                                                    'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-sm'
                                                            }`}>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${getFrequencyColor(task.frequency)}`}>
                                                                    {getFrequencyLabel(task.frequency)}
                                                                </span>
                                                                {task.status === 'ATRASADO' && (
                                                                    <span className="text-red-500"><AlertTriangle size={12} /></span>
                                                                )}
                                                            </div>

                                                            <p className="text-xs font-bold text-gray-700 mb-3 line-clamp-2">{task.task_description}</p>

                                                            <div className="flex items-center justify-between">
                                                                <div className="text-[9px] text-gray-400 font-medium">
                                                                    {task.last_executed_at
                                                                        ? `Última: ${new Date(task.last_executed_at).toLocaleDateString('pt-BR')}`
                                                                        : 'Nunca executado'}
                                                                </div>

                                                                <button
                                                                    onClick={() => handleMarkAsDone(task)}
                                                                    disabled={task.status === 'CONCLUIDO'}
                                                                    className={`p-2 rounded-full transition-all ${task.status === 'CONCLUIDO'
                                                                            ? 'bg-emerald-100 text-emerald-600 cursor-default'
                                                                            : 'bg-gray-100 text-gray-400 hover:bg-indigo-600 hover:text-white'
                                                                        }`}
                                                                    title={task.status === 'CONCLUIDO' ? 'Concluído' : 'Marcar como Feito'}
                                                                >
                                                                    <CheckCircle2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Assignment Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-900 uppercase">Definir Responsável</h3>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Área</label>
                                <p className="text-sm font-bold text-gray-900">{selectedAssignment?.area}</p>
                                <p className="text-xs text-gray-500">{selectedAssignment?.block}</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profissional</label>
                                <select
                                    value={selectedEmployeeName}
                                    onChange={e => setSelectedEmployeeName(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">Selecione...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleAssignEmployee}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
                            >
                                Salvar Vínculo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Printable Report */}
            <div id="weekly-report-print" className="hidden print:block bg-white p-8">
                <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                    <h1 className="text-2xl font-bold uppercase">Relatório Semanal de Manutenção</h1>
                    <p className="text-sm text-gray-600 uppercase">Escola Estadual André Maggi</p>
                    <p className="text-xs text-gray-500 mt-2">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <div className="space-y-6">
                    {Object.keys(groupedTasks).sort().map(block => (
                        <div key={block}>
                            <h3 className="text-lg font-bold uppercase bg-gray-100 p-2 mb-2 border-l-4 border-black">{block}</h3>
                            <div className="space-y-4">
                                {Object.keys(groupedTasks[block]).sort().map(area => {
                                    const responsible = getAreaResponsible(block, area);
                                    return (
                                        <div key={area} className="break-inside-avoid">
                                            <div className="flex justify-between items-end mb-1 border-b border-gray-300 pb-1">
                                                <h4 className="text-sm font-bold uppercase">{area}</h4>
                                                <span className="text-xs uppercase text-gray-600">Resp: {responsible || '_________________'}</span>
                                            </div>
                                            <table className="w-full text-left text-xs mb-4">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="py-1 w-1/2">Tarefa</th>
                                                        <th className="py-1 w-1/6">Freq.</th>
                                                        <th className="py-1 w-1/6">Execução</th>
                                                        <th className="py-1 w-1/6 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {groupedTasks[block][area].map(task => (
                                                        <tr key={task.id} className="border-b border-gray-100">
                                                            <td className="py-1 pr-2">{task.task_description}</td>
                                                            <td className="py-1 text-[10px]">{task.frequency}</td>
                                                            <td className="py-1 text-[10px]">
                                                                {task.last_executed_at ? new Date(task.last_executed_at).toLocaleDateString('pt-BR') : '-'}
                                                            </td>
                                                            <td className="py-1 text-center">
                                                                {task.status === 'CONCLUIDO' ? 'OK' : '[ ]'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-between gap-8 pt-8 border-t border-gray-300">
                    <div className="flex-1 text-center">
                        <div className="border-t border-black w-3/4 mx-auto pt-2"></div>
                        <p className="text-xs font-bold uppercase">Gestão Escolar</p>
                    </div>
                    <div className="flex-1 text-center">
                        <div className="border-t border-black w-3/4 mx-auto pt-2"></div>
                        <p className="text-xs font-bold uppercase">Responsável Manutenção</p>
                    </div>
                </div>

                <style>{`
                    @media print {
                        @page { margin: 10mm; }
                        body { -webkit-print-color-adjust: exact; }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default MaintenanceScheduler;
