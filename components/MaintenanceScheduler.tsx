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
    X,
    Settings2
} from 'lucide-react';

interface MaintenanceTask {
    id: string;
    block: string;
    area_name: string;
    task_description: string;
    frequency: 'DIARIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL';
    last_executed_at: string | null;
    assigned_employee_name?: string | null;
    status?: 'PENDENTE' | 'CONCLUIDO' | 'ATRASADO';
    executed_shift?: string | null;
}

interface MaintenanceSchedulerProps {
    employees: { id: string, name: string }[];
}

const FREQUENCY_ORDER: Record<string, number> = {
    'DIARIA': 1,
    'SEMANAL': 2,
    'MENSAL': 3,
    'TRIMESTRAL': 4
};

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
    const [selectedEmployeeNames, setSelectedEmployeeNames] = useState<string[]>(['', '', '']);
    const [taskDates, setTaskDates] = useState<Record<string, string>>({});
    const [taskShifts, setTaskShifts] = useState<Record<string, 'MATUTINO' | 'VESPERTINO'>>({});
    const [reportPeriodStart, setReportPeriodStart] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + 1); // Monday
        return d.toISOString().split('T')[0];
    });
    const [reportPeriodEnd, setReportPeriodEnd] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + 5); // Friday
        return d.toISOString().split('T')[0];
    });

    const formatDateBr = (dateStr: string) => {
        if (!dateStr) return '';
        return dateStr.split('-').reverse().join('/');
    };
    const reportPeriod = `${formatDateBr(reportPeriodStart)} a ${formatDateBr(reportPeriodEnd)}`;

    // Bathroom clean tracking states
    const [selectedCleanDate, setSelectedCleanDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedCleanEmployee, setSelectedCleanEmployee] = useState('');
    const [records, setRecords] = useState<any[]>([]);
    const [isBathroomPanelOpen, setIsBathroomPanelOpen] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const [selectedPrintBathroom, setSelectedPrintBathroom] = useState<MaintenanceTask | null>(null);

    // Print Options Configuration State
    const [showReportConfig, setShowReportConfig] = useState(false);
    const [selectedSignatures, setSelectedSignatures] = useState<string[]>([]);
    const [includeTaskSignature, setIncludeTaskSignature] = useState(true);
    const [includeGestaoSignature, setIncludeGestaoSignature] = useState(true);
    const [includeZeladoriaSignature, setIncludeZeladoriaSignature] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    // Auto-select signatures for employees assigned to tasks in the current filtered view
    useEffect(() => {
        const activeTasks = tasks.filter(t => filterFrequency === 'ALL' || t.frequency === filterFrequency);
        const assignedNamesList: string[] = [];
        activeTasks.forEach(t => {
            if (t.assigned_employee_name) {
                const names = t.assigned_employee_name.split(' / ');
                names.forEach(name => {
                    const trimmed = name.trim();
                    if (trimmed && !assignedNamesList.includes(trimmed)) {
                        assignedNamesList.push(trimmed);
                    }
                });
            }
        });
        setSelectedSignatures(assignedNamesList);
    }, [tasks, filterFrequency]);

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
                .select('task_id, completed_at, status, performed_by_name')
                .order('completed_at', { ascending: false });

            if (recordsError) throw recordsError;
            setRecords(recordsData || []);

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
                    else if (task.frequency === 'TRIMESTRAL' && diffDays <= 90) status = 'CONCLUIDO';
                    else status = 'ATRASADO';
                }

                return {
                    ...task,
                    last_executed_at: lastRecord ? lastRecord.completed_at : null,
                    status,
                    executed_shift: lastRecord?.performed_by_name?.includes('[MATUTINO]') ? 'Matutino' : lastRecord?.performed_by_name?.includes('[VESPERTINO]') ? 'Vespertino' : null
                };
            });

            setTasks(mergedTasks);

        } catch (error) {
            console.error('Error fetching maintenance tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsDone = async (task: MaintenanceTask, customDate?: string, shift: 'MATUTINO' | 'VESPERTINO' = 'MATUTINO') => {
        const executionDate = customDate ? new Date(customDate + 'T12:00:00').toISOString() : new Date().toISOString();
        const performedByName = `${task.assigned_employee_name || 'Manutenção'} [${shift}]`;
        try {
            const { error } = await supabase.from('maintenance_records').insert([{
                task_id: task.id,
                status: 'CONCLUIDO',
                completed_at: executionDate,
                performed_by_name: performedByName
            }]);

            if (error) throw error;

            const newRecord = {
                task_id: task.id,
                status: 'CONCLUIDO',
                completed_at: executionDate,
                performed_by_name: performedByName
            };
            setRecords(prev => [newRecord, ...prev]);

            setTasks(prev => prev.map(t =>
                t.id === task.id
                    ? { 
                        ...t, 
                        status: 'CONCLUIDO', 
                        last_executed_at: executionDate,
                        executed_shift: shift === 'MATUTINO' ? 'Matutino' : 'Vespertino'
                      }
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
        if (!selectedAssignment) return;

        const employeeNameToAssign = selectedEmployeeNames.filter(Boolean).map(n => n.trim()).join(' / ') || null;

        try {
            const { error } = await supabase
                .from('maintenance_tasks')
                .update({ assigned_employee_name: employeeNameToAssign })
                .match({ block: selectedAssignment.block, area_name: selectedAssignment.area });

            if (error) throw error;

            setTasks(prev => prev.map(t =>
                (t.block === selectedAssignment.block && t.area_name === selectedAssignment.area)
                    ? { ...t, assigned_employee_name: employeeNameToAssign }
                    : t
            ));

            setIsAssignModalOpen(false);
            setSelectedAssignment(null);
            setSelectedEmployeeNames(['', '', '']);
            alert(employeeNameToAssign ? 'Responsáveis definidos com sucesso!' : 'Responsáveis removidos com sucesso!');

        } catch (error) {
            console.error('Error assigning employee:', error);
            alert('Erro ao processar alteração.');
        }
    };

    const generateWeeklyReport = async () => {
        const element = document.getElementById('weekly-report-print');
        if (!element) return;

        const safePeriod = reportPeriod.replace(/\//g, '-').replace(/\s+/g, '_');
        const opt = {
            margin: 5,
            filename: `Relatorio_Manutencao_${safePeriod}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();
    };

    const generateMuralChecklist = async () => {
        setIsPrinting(true);
        setTimeout(async () => {
            const element = document.getElementById('mural-checklist-print');
            if (element) {
                const opt = {
                    margin: 5,
                    filename: `Checklist_Mural_Zeladoria.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 1.5 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
                };
                try {
                    // @ts-ignore
                    await window.html2pdf().set(opt).from(element).save();
                } catch (err) {
                    console.error("Error printing mural checklist:", err);
                } finally {
                    setIsPrinting(false);
                }
            } else {
                setIsPrinting(false);
            }
        }, 300);
    };

    const handleMarkBathroomClean = async (task: MaintenanceTask, shift: 'MATUTINO' | 'VESPERTINO') => {
        if (!selectedCleanEmployee) {
            alert('Por favor, selecione um zelador(a) para registrar o lançamento.');
            return;
        }

        const now = new Date();
        const timePart = now.toTimeString().split(' ')[0]; // HH:MM:SS
        const executionDate = new Date(`${selectedCleanDate}T${timePart}`).toISOString();
        const performedByName = `${selectedCleanEmployee} [${shift}]`;

        try {
            const { error } = await supabase.from('maintenance_records').insert([{
                task_id: task.id,
                status: 'CONCLUIDO',
                completed_at: executionDate,
                performed_by_name: performedByName
            }]);

            if (error) throw error;

            const newRecord = {
                task_id: task.id,
                status: 'CONCLUIDO',
                completed_at: executionDate,
                performed_by_name: performedByName
            };

            setRecords(prev => [newRecord, ...prev]);

            setTasks(prev => prev.map(t =>
                t.id === task.id
                    ? { 
                        ...t, 
                        status: 'CONCLUIDO', 
                        last_executed_at: executionDate,
                        executed_shift: shift === 'MATUTINO' ? 'Matutino' : 'Vespertino'
                      }
                    : t
            ));

        } catch (error) {
            console.error('Error completing bathroom task:', error);
            alert('Erro ao registrar limpeza do banheiro.');
        }
    };

    const handleDeleteRecord = async (taskId: string, completedAt: string) => {
        if (!window.confirm('Deseja realmente remover este registro de higienização?')) return;

        try {
            const { error } = await supabase
                .from('maintenance_records')
                .delete()
                .match({ task_id: taskId, completed_at: completedAt });

            if (error) throw error;

            setRecords(prev => prev.filter(r => !(r.task_id === taskId && r.completed_at === completedAt)));
            fetchTasks();
        } catch (error) {
            console.error('Error deleting record:', error);
            alert('Erro ao remover registro.');
        }
    };

    const handlePrintBathroomSheet = async (task: MaintenanceTask) => {
        setIsPrinting(true);
        setSelectedPrintBathroom(task);
        
        setTimeout(async () => {
            const element = document.getElementById('bathroom-print-sheet');
            if (element) {
                const safeName = task.area_name.replace(/\s+/g, '_');
                const safePeriod = reportPeriod.replace(/\//g, '-').replace(/\s+/g, '_');
                const opt = {
                    margin: 5,
                    filename: `Planilha_Limpeza_${safeName}_${safePeriod}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                
                try {
                    // @ts-ignore
                    await window.html2pdf().set(opt).from(element).save();
                } catch (err) {
                    console.error("Error printing bathroom sheet:", err);
                } finally {
                    setSelectedPrintBathroom(null);
                    setIsPrinting(false);
                }
            } else {
                setIsPrinting(false);
            }
        }, 300);
    };

    // Grouping
    const groupedTasks = tasks.reduce((acc, task) => {
        if (filterFrequency !== 'ALL' && task.frequency !== filterFrequency) return acc;

        if (!acc[task.block]) acc[task.block] = {};
        if (!acc[task.block][task.area_name]) acc[task.block][task.area_name] = [];

        acc[task.block][task.area_name].push(task);
        return acc;
    }, {} as Record<string, Record<string, MaintenanceTask[]>>);

    const muralGroupedTasks = tasks.reduce((acc, task) => {
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
            case 'TRIMESTRAL': return 'Trimestral';
            default: return freq;
        }
    };

    const getFrequencyColor = (freq: string) => {
        switch (freq) {
            case 'DIARIA': return 'text-blue-600 bg-blue-50';
            case 'SEMANAL': return 'text-purple-600 bg-purple-50';
            case 'MENSAL': return 'text-orange-600 bg-orange-50';
            case 'TRIMESTRAL': return 'text-pink-600 bg-pink-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    // Helper to get responsible for an area (assuming all tasks in area have same responsible)
    const getAreaResponsible = (block: string, area: string) => {
        const areaTasks = tasks.filter(t => t.block === block && t.area_name === area);
        return areaTasks.find(t => t.assigned_employee_name)?.assigned_employee_name || null;
    };

    const getFlatMuralTasks = () => {
        const flatList: Array<{
            block: string;
            area: string;
            task: MaintenanceTask;
            isFirstInBlock: boolean;
            blockSpan: number;
            isFirstInArea: boolean;
            areaSpan: number;
        }> = [];
        
        const sortedBlocks = Object.keys(muralGroupedTasks).sort();
        
        sortedBlocks.forEach(block => {
            const areas = muralGroupedTasks[block];
            const sortedAreas = Object.keys(areas).sort();
            
            // Count total tasks in this block
            let blockTotalTasks = 0;
            sortedAreas.forEach(area => {
                blockTotalTasks += areas[area].length;
            });
            
            let isFirstInBlock = true;
            
            sortedAreas.forEach(area => {
                const areaTasks = [...areas[area]].sort((a, b) => (FREQUENCY_ORDER[a.frequency] || 99) - (FREQUENCY_ORDER[b.frequency] || 99));
                const areaTotalTasks = areaTasks.length;
                let isFirstInArea = true;
                
                areaTasks.forEach(task => {
                    flatList.push({
                        block,
                        area,
                        task,
                        isFirstInBlock,
                        blockSpan: blockTotalTasks,
                        isFirstInArea,
                        areaSpan: areaTotalTasks
                    });
                    isFirstInBlock = false;
                    isFirstInArea = false;
                });
            });
        });
        return flatList;
    };

    const renderMuralVistos = (task: MaintenanceTask) => {
        if (task.frequency === 'DIARIA') {
            return (
                <div className="flex justify-center items-center gap-2">
                    {['S', 'T', 'Q', 'Q', 'S'].map((day, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="w-5 h-5 border border-gray-400 rounded bg-white"></div>
                            <span className="text-[7px] font-bold text-gray-500 mt-0.5">{day}</span>
                        </div>
                    ))}
                </div>
            );
        } else if (task.frequency === 'SEMANAL') {
            return (
                <div className="flex justify-center items-center gap-2">
                    {['S1', 'S2', 'S3', 'S4'].map((week, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="w-5 h-5 border border-gray-400 rounded bg-white"></div>
                            <span className="text-[7px] font-bold text-gray-500 mt-0.5">{week}</span>
                        </div>
                    ))}
                </div>
            );
        } else if (task.frequency === 'MENSAL') {
            return (
                <div className="flex justify-center items-center">
                    <div className="w-16 h-5 border border-gray-400 rounded bg-white flex items-center justify-center">
                        <span className="text-[7px] font-bold text-gray-300 uppercase">VISTO MENSAL</span>
                    </div>
                </div>
            );
        } else if (task.frequency === 'TRIMESTRAL') {
            return (
                <div className="flex justify-center items-center">
                    <div className="w-20 h-5 border border-gray-400 rounded bg-white flex items-center justify-center">
                        <span className="text-[7px] font-bold text-gray-300 uppercase">VISTO TRIMESTRAL</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const dailyBathroomTasks = tasks.filter(t => 
        t.frequency === 'DIARIA' && (
            t.area_name.toLowerCase().includes('banheiro') || 
            t.area_name.toLowerCase().includes('sanitário')
        )
    );

    return (
        <div className="space-y-6 w-full min-w-0">
            {/* Header / Filters */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 w-full min-w-0">
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 w-full lg:flex-1 min-w-0 custom-scrollbar">
                    {['ALL', 'DIARIA', 'SEMANAL', 'MENSAL', 'TRIMESTRAL'].map(freq => (
                        <button
                            key={freq}
                            onClick={() => setFilterFrequency(freq)}
                            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider border transition-all shrink-0 ${filterFrequency === freq
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            {freq === 'ALL' ? 'Todos' : getFrequencyLabel(freq)}
                        </button>
                    ))}
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-2 sm:gap-4 shrink-0 min-w-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-sm shrink-0">
                        <span className="text-[9px] font-black uppercase text-gray-400 shrink-0">De:</span>
                        <input
                            type="date"
                            value={reportPeriodStart}
                            onChange={e => setReportPeriodStart(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-bold text-gray-700 outline-none w-24 px-1 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[9px] font-black uppercase text-gray-400 shrink-0">Até:</span>
                        <input
                            type="date"
                            value={reportPeriodEnd}
                            onChange={e => setReportPeriodEnd(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-bold text-gray-700 outline-none w-24 px-1 focus:ring-0 cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={() => setShowReportConfig(!showReportConfig)}
                        className={`p-2 rounded-xl border transition-all shrink-0 ${
                            showReportConfig 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                        title="Opções de Assinaturas e Impressão"
                    >
                        <Settings2 size={16} />
                    </button>
                    <button
                        onClick={generateMuralChecklist}
                        className="px-3 sm:px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-lg shrink-0"
                    >
                        <Printer size={14} className="shrink-0" /> <span className="truncate">Checklist Mural (Vazio)</span>
                    </button>
                    <button
                        onClick={generateWeeklyReport}
                        className="px-3 sm:px-5 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-1.5 shadow-lg shrink-0"
                    >
                        <Printer size={14} className="shrink-0" /> <span className="truncate">Imprimir Relatório</span>
                    </button>
                    <div className="text-right shrink-0 border-l border-gray-200 pl-3 sm:pl-4">
                        <p className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 tracking-tighter">Total de Tarefas</p>
                        <p className="text-lg sm:text-xl font-black text-gray-900 leading-none">{tasks.length}</p>
                    </div>
                </div>
            </div>

            {/* PAINEL DE OPÇÕES DE IMPRESSÃO / CONFIGURAÇÃO DO RELATÓRIO */}
            {showReportConfig && (
                <div className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} className="text-indigo-600" />
                            Configurar Assinaturas do Relatório de Manutenção
                        </h4>
                        <button 
                            onClick={() => setShowReportConfig(false)}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Coluna 1: Lista de servidores que assinam */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                Servidores para Assinatura
                            </span>
                            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-3 space-y-2 custom-scrollbar bg-gray-50/50">
                                {employees.map(emp => {
                                    const isAssigned = tasks.some(t => {
                                        if (filterFrequency !== 'ALL' && t.frequency !== filterFrequency) return false;
                                        if (!t.assigned_employee_name) return false;
                                        return t.assigned_employee_name.split(' / ').map(n => n.trim()).includes(emp.name);
                                    });
                                    return (
                                        <label key={emp.id} className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase cursor-pointer hover:text-gray-900 select-none">
                                            <input
                                                type="checkbox"
                                                checked={selectedSignatures.includes(emp.name)}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setSelectedSignatures(prev => [...prev, emp.name]);
                                                    } else {
                                                        setSelectedSignatures(prev => prev.filter(name => name !== emp.name));
                                                    }
                                                }}
                                                className="rounded text-indigo-600 focus:ring-indigo-500/20 w-3.5 h-3.5 border-gray-300"
                                            />
                                            <span className="truncate flex-1">{emp.name}</span>
                                            {isAssigned && (
                                                <span className="text-[8px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-black tracking-tight shrink-0">
                                                    Tarefas Ativas
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                                {employees.length === 0 && (
                                    <p className="text-[10px] text-gray-400 italic py-2">Nenhum servidor cadastrado na equipe de apoio.</p>
                                )}
                            </div>
                        </div>

                        {/* Coluna 2: Configurações de layout */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                Opções de Layout
                            </span>
                            <div className="space-y-3 bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                                <label className="flex items-center gap-2.5 text-xs font-bold text-gray-700 uppercase cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={includeTaskSignature}
                                        onChange={e => setIncludeTaskSignature(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500/20 w-3.5 h-3.5 border-gray-300"
                                    />
                                    Coluna de Assinatura por Tarefa
                                </label>
                                <label className="flex items-center gap-2.5 text-xs font-bold text-gray-700 uppercase cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={includeGestaoSignature}
                                        onChange={e => setIncludeGestaoSignature(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500/20 w-3.5 h-3.5 border-gray-300"
                                    />
                                    Assinatura da Gestão Escolar
                                </label>
                                <label className="flex items-center gap-2.5 text-xs font-bold text-gray-700 uppercase cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={includeZeladoriaSignature}
                                        onChange={e => setIncludeZeladoriaSignature(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500/20 w-3.5 h-3.5 border-gray-300"
                                    />
                                    Assinatura da Zeladoria/Manutenção
                                </label>
                            </div>
                        </div>

                        {/* Coluna 3: Resumo e Ação */}
                        <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 flex flex-col justify-between">
                            <div className="space-y-2">
                                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">Resumo do Relatório</span>
                                <p className="text-xs text-gray-600 leading-normal">
                                    Tipo: <strong className="text-gray-900 uppercase">
                                        {filterFrequency === 'ALL' ? 'Geral' : getFrequencyLabel(filterFrequency)}
                                    </strong>
                                </p>
                                <p className="text-xs text-gray-600 leading-normal">
                                    Assinaturas de Servidores selecionadas: <strong className="text-indigo-700 font-black">{selectedSignatures.length}</strong>
                                </p>
                            </div>
                            <button
                                onClick={generateWeeklyReport}
                                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1.5"
                            >
                                <Printer size={14} /> Gerar e Imprimir Relatório
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MONITOR DE LIMPEZA DE BANHEIROS */}
            {!loading && dailyBathroomTasks.length > 0 && (
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[2rem] p-6 shadow-xl space-y-6">
                    <button 
                        onClick={() => setIsBathroomPanelOpen(!isBathroomPanelOpen)}
                        className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left outline-none"
                    >
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                Acompanhamento de Higienização de Banheiros
                            </h3>
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">
                                Monitoramento diário de limpeza por turnos (Matutino / Vespertino)
                            </p>
                        </div>
                        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 hover:bg-white/20 transition-all">
                                {isBathroomPanelOpen ? 'Ocultar Painel' : 'Visualizar Painel'}
                            </span>
                        </div>
                    </button>

                    {isBathroomPanelOpen && (
                        <div className="space-y-6 pt-4 border-t border-white/10 animate-in fade-in duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <p className="text-xs text-indigo-200 font-bold max-w-md">
                                    Para registrar a higienização, selecione o funcionário abaixo e clique em "Limpar" no banheiro e turno correspondentes.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    {/* Date Picker */}
                                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-xl px-3 py-2 w-full sm:w-auto">
                                        <span className="text-[9px] font-black uppercase text-indigo-200 shrink-0">Data Limpeza:</span>
                                        <input
                                            type="date"
                                            value={selectedCleanDate}
                                            onChange={e => setSelectedCleanDate(e.target.value)}
                                            className="bg-transparent border-none text-[10px] font-bold text-white outline-none focus:ring-0 w-28 h-5 cursor-pointer"
                                        />
                                    </div>

                                    {/* Employee Select */}
                                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-xl px-3 py-2 w-full sm:w-auto">
                                        <span className="text-[9px] font-black uppercase text-indigo-200 shrink-0">Zelador(a):</span>
                                        <select
                                            value={selectedCleanEmployee}
                                            onChange={e => setSelectedCleanEmployee(e.target.value)}
                                            className="bg-transparent border-none text-[10px] font-bold text-white outline-none focus:ring-0 cursor-pointer w-full sm:w-44 text-gray-900"
                                        >
                                            <option value="" className="text-gray-900">Selecione...</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.name} className="text-gray-900">{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Restrooms Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {dailyBathroomTasks.map(task => {
                                    // find records for this task on selectedCleanDate
                                    const dayRecords = records.filter(r => 
                                        r.task_id === task.id && 
                                        new Date(r.completed_at).toISOString().split('T')[0] === selectedCleanDate
                                    );

                                    const matRecord = dayRecords.find(r => r.performed_by_name?.includes('[MATUTINO]'));
                                    const vespRecord = dayRecords.find(r => r.performed_by_name?.includes('[VESPERTINO]'));

                                    return (
                                        <div key={task.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:bg-white/10 transition-all">
                                            <div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider bg-indigo-950/50 border border-indigo-900/30 px-1.5 py-0.5 rounded-md truncate">
                                                        {task.block}
                                                    </span>
                                                    <button
                                                        onClick={() => handlePrintBathroomSheet(task)}
                                                        disabled={isPrinting}
                                                        className="p-1 text-white/50 hover:text-white bg-white/5 hover:bg-indigo-600 rounded transition-all shrink-0"
                                                        title="Imprimir Planilha de Banheiro (Afixação)"
                                                    >
                                                        <Printer size={10} />
                                                    </button>
                                                </div>
                                                <h4 className="text-xs font-black uppercase text-white mt-2 truncate" title={task.area_name}>
                                                    {task.area_name}
                                                </h4>
                                                <p className="text-[9px] font-bold text-white/50 line-clamp-1 mt-1 leading-normal" title={task.task_description}>
                                                    {task.task_description}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                {/* MATUTINO SHIFT */}
                                                <div className="flex flex-col space-y-1">
                                                    <span className="text-[8px] font-black uppercase text-white/40 tracking-wider">Matutino</span>
                                                    {matRecord ? (
                                                        <div className="flex items-center justify-between bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl p-2 text-[9px] font-black uppercase relative group/shift">
                                                            <div className="truncate flex flex-col">
                                                                <span className="truncate leading-none">{matRecord.performed_by_name?.split(' [')[0]}</span>
                                                                <span className="text-[7px] text-emerald-400/80 mt-1 font-bold">
                                                                    {new Date(matRecord.completed_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteRecord(task.id, matRecord.completed_at)}
                                                                className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover/shift:opacity-100 transition-opacity shadow-md"
                                                                title="Remover registro"
                                                            >
                                                                <X size={8} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMarkBathroomClean(task, 'MATUTINO')}
                                                            className="w-full py-2 bg-white/10 hover:bg-indigo-600 text-white hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-white/5 hover:border-indigo-500"
                                                        >
                                                            Limpar
                                                        </button>
                                                    )}
                                                </div>

                                                {/* VESPERTINO SHIFT */}
                                                <div className="flex flex-col space-y-1">
                                                    <span className="text-[8px] font-black uppercase text-white/40 tracking-wider">Vespertino</span>
                                                    {vespRecord ? (
                                                        <div className="flex items-center justify-between bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl p-2 text-[9px] font-black uppercase relative group/shift">
                                                            <div className="truncate flex flex-col">
                                                                <span className="truncate leading-none">{vespRecord.performed_by_name?.split(' [')[0]}</span>
                                                                <span className="text-[7px] text-emerald-400/80 mt-1 font-bold">
                                                                    {new Date(vespRecord.completed_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteRecord(task.id, vespRecord.completed_at)}
                                                                className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover/shift:opacity-100 transition-opacity shadow-md"
                                                                title="Remover registro"
                                                            >
                                                                <X size={8} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMarkBathroomClean(task, 'VESPERTINO')}
                                                            className="w-full py-2 bg-white/10 hover:bg-indigo-600 text-white hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-white/5 hover:border-indigo-500"
                                                        >
                                                            Limpar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="text-center py-20 text-gray-400">Carregando cronograma...</div>
            ) : Object.keys(groupedTasks).length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                    <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase text-xs">Nenhuma tarefa encontrada</p>
                </div>
            ) : (
                <div className="space-y-4 w-full min-w-0">
                    {Object.keys(groupedTasks).sort().map(block => (
                        <div key={block} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm w-full min-w-0">

                            {/* BLOCK HEADER */}
                            <button
                                onClick={() => toggleBlock(block)}
                                className="w-full flex items-center justify-between p-4 sm:p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors min-w-0 gap-2"
                            >
                                <h3 className="text-sm sm:text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 sm:gap-3 truncate">
                                    {block.includes('Bloco I') ? <span className="w-1.5 sm:w-2 h-6 sm:h-8 bg-indigo-500 rounded-full shrink-0"></span> :
                                        block.includes('Bloco II') ? <span className="w-1.5 sm:w-2 h-6 sm:h-8 bg-emerald-500 rounded-full shrink-0"></span> :
                                            <span className="w-1.5 sm:w-2 h-6 sm:h-8 bg-amber-500 rounded-full shrink-0"></span>}
                                    <span className="truncate">{block}</span>
                                </h3>
                                {expandedBlocks[block] ? <ChevronDown className="text-gray-400 shrink-0" /> : <ChevronRight className="text-gray-400 shrink-0" />}
                            </button>

                            {/* AREAS LIST */}
                            {expandedBlocks[block] && (
                                <div className="divide-y divide-gray-100 min-w-0 w-full">
                                    {Object.keys(groupedTasks[block]).sort().map(area => {
                                        const responsible = getAreaResponsible(block, area);
                                        return (
                                            <div key={area} className="p-4 sm:p-6 min-w-0 w-full">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 min-w-0 w-full">
                                                    <h4 className="text-xs sm:text-sm font-black text-gray-700 uppercase flex items-center gap-2 truncate">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></div>
                                                        <span className="truncate">{area}</span>
                                                    </h4>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAssignment({ block, area });
                                                            const names = (responsible || '').split(' / ').map(n => n.trim()).filter(Boolean);
                                                            const initialNames = ['', '', ''];
                                                            for (let i = 0; i < Math.min(names.length, 3); i++) {
                                                                initialNames[i] = names[i];
                                                            }
                                                            setSelectedEmployeeNames(initialNames);
                                                            setIsAssignModalOpen(true);
                                                        }}
                                                        className="flex items-center self-start sm:self-auto gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-[9px] font-black uppercase tracking-wide shrink-0 max-w-full truncate"
                                                    >
                                                        <UserPlus size={12} className="shrink-0" />
                                                        <span className="truncate">{responsible ? responsible : 'Definir Responsável'}</span>
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-w-0 w-full">
                                                    {[...groupedTasks[block][area]].sort((a, b) => (FREQUENCY_ORDER[a.frequency] || 99) - (FREQUENCY_ORDER[b.frequency] || 99)).map(task => (
                                                        <div key={task.id} className={`p-4 rounded-xl border transition-all flex flex-col justify-between min-w-0 w-full ${task.status === 'CONCLUIDO' ? 'bg-emerald-50/30 border-emerald-100' :
                                                                task.status === 'ATRASADO' ? 'bg-red-50/30 border-red-100' :
                                                                    'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-sm'
                                                            }`}>
                                                            <div className="min-w-0 w-full">
                                                                <div className="flex justify-between items-start mb-2 gap-1 min-w-0">
                                                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider truncate max-w-full ${getFrequencyColor(task.frequency)}`}>
                                                                        {getFrequencyLabel(task.frequency)}
                                                                    </span>
                                                                    {task.status === 'ATRASADO' && (
                                                                        <span className="text-red-500 shrink-0"><AlertTriangle size={12} /></span>
                                                                    )}
                                                                </div>

                                                                <p className="text-xs font-bold text-gray-700 mb-3 line-clamp-2 break-words">{task.task_description}</p>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-1 pt-2 mt-auto border-t border-gray-50/50 min-w-0">
                                                                <div className="text-[9px] text-gray-400 font-medium truncate">
                                                                    {task.last_executed_at
                                                                        ? `Última: ${new Date(task.last_executed_at).toLocaleDateString('pt-BR')}${task.executed_shift ? ` (${task.executed_shift})` : ''}`
                                                                        : 'Nunca executado'}
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end">
                                                                    {task.status !== 'CONCLUIDO' && (
                                                                        <>
                                                                            <input
                                                                                type="date"
                                                                                value={taskDates[task.id] || new Date().toISOString().split('T')[0]}
                                                                                onChange={e => setTaskDates(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                                                className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[9px] font-bold outline-none focus:border-indigo-300 text-gray-700 w-[105px] h-7"
                                                                            />
                                                                            <select
                                                                                value={taskShifts[task.id] || 'MATUTINO'}
                                                                                onChange={e => setTaskShifts(prev => ({ ...prev, [task.id]: e.target.value as any }))}
                                                                                className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[9px] font-bold outline-none focus:border-indigo-300 text-gray-700 h-7 w-20 cursor-pointer"
                                                                            >
                                                                                <option value="MATUTINO">Matutino</option>
                                                                                <option value="VESPERTINO">Vespertino</option>
                                                                            </select>
                                                                        </>
                                                                    )}
                                                                    <button
                                                                        onClick={() => {
                                                                            if (task.status === 'CONCLUIDO' && task.last_executed_at) {
                                                                                handleDeleteRecord(task.id, task.last_executed_at);
                                                                            } else {
                                                                                handleMarkAsDone(task, taskDates[task.id], taskShifts[task.id] || 'MATUTINO');
                                                                            }
                                                                        }}
                                                                        className={`p-1.5 sm:p-2 rounded-full transition-all shrink-0 ${task.status === 'CONCLUIDO'
                                                                                ? 'bg-emerald-100 text-emerald-600 hover:bg-red-100 hover:text-red-600 cursor-pointer'
                                                                                : 'bg-gray-100 text-gray-400 hover:bg-indigo-600 hover:text-white'
                                                                            }`}
                                                                        title={task.status === 'CONCLUIDO' ? 'Desmarcar como concluída' : 'Marcar como Feito'}
                                                                    >
                                                                        <CheckCircle2 size={14} className="shrink-0" />
                                                                    </button>
                                                                </div>
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
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profissionais Responsáveis (Até 3)</label>
                                {[0, 1, 2].map(index => (
                                    <div key={index} className="space-y-1">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Responsável {index + 1}</span>
                                        <select
                                            value={selectedEmployeeNames[index]}
                                            onChange={e => {
                                                const newNames = [...selectedEmployeeNames];
                                                newNames[index] = e.target.value;
                                                setSelectedEmployeeNames(newNames);
                                            }}
                                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="">Nenhum / Remover</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.name}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
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
            <div className="fixed top-0 left-0 w-full h-0 overflow-hidden pointer-events-none">
                <div id="weekly-report-print" className="bg-white p-8">
                <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                    <h1 className="text-2xl font-bold uppercase">
                        {filterFrequency === 'DIARIA' ? 'Relatório Diário de Manutenção' :
                         filterFrequency === 'SEMANAL' ? 'Relatório Semanal de Manutenção' :
                         filterFrequency === 'MENSAL' ? 'Relatório Mensal de Manutenção' :
                         filterFrequency === 'TRIMESTRAL' ? 'Relatório Trimestral de Manutenção' :
                         'Relatório Geral de Manutenção'}
                    </h1>
                    <p className="text-sm text-gray-600 uppercase">Escola Estadual André Maggi</p>
                    <p className="text-xs text-gray-500 mt-2">Referência: {reportPeriod}</p>
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
                                                        <th className="py-1 w-[40%]">Tarefa</th>
                                                        <th className="py-1 w-[12%]">Freq.</th>
                                                        <th className="py-1 w-[18%]">Execução</th>
                                                        <th className="py-1 w-[10%] text-center">Status</th>
                                                        {includeTaskSignature && (
                                                            <th className="py-1 w-[20%]">Assinatura</th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                     {[...groupedTasks[block][area]].sort((a, b) => (FREQUENCY_ORDER[a.frequency] || 99) - (FREQUENCY_ORDER[b.frequency] || 99)).map(task => (
                                                        <tr key={task.id} className="border-b border-gray-100">
                                                            <td className="py-1 pr-2">{task.task_description}</td>
                                                            <td className="py-1 text-[10px]">{task.frequency}</td>
                                                            <td className="py-1 text-[10px]">
                                                                {task.last_executed_at 
                                                                    ? `${new Date(task.last_executed_at).toLocaleDateString('pt-BR')}${task.executed_shift ? ` (${task.executed_shift === 'Matutino' ? 'Mat' : 'Vesp'})` : ''}` 
                                                                    : '____/____/____'}
                                                            </td>
                                                            <td className="py-1 text-center">
                                                                {task.status === 'CONCLUIDO' ? 'OK' : '[ ]'}
                                                            </td>
                                                            {includeTaskSignature && (
                                                                <td className="py-1 text-[9px] text-gray-500 italic">
                                                                    {task.status === 'CONCLUIDO' 
                                                                        ? (task.assigned_employee_name || 'Servidor') 
                                                                        : '_________________'}
                                                                </td>
                                                            )}
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

                {/* Dynamic Server Signatures */}
                {selectedSignatures.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="text-[10px] font-black uppercase mb-6 tracking-wider text-gray-400">
                            Assinatura dos Servidores Responsáveis pelas Tarefas
                        </h4>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-12">
                            {selectedSignatures.map(server => (
                                <div key={server} className="text-center break-inside-avoid">
                                    <div className="border-t border-black w-4/5 mx-auto pt-2"></div>
                                    <p className="text-[11px] font-bold uppercase text-gray-900 leading-tight">{server}</p>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">Executor Responsável</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* General Supervisory Signatures */}
                {(includeGestaoSignature || includeZeladoriaSignature) && (
                    <div className="mt-12 flex justify-between gap-12 pt-8 border-t border-gray-300">
                        {includeGestaoSignature && (
                            <div className="flex-1 text-center break-inside-avoid">
                                <div className="border-t border-black w-4/5 mx-auto pt-2"></div>
                                <p className="text-xs font-bold uppercase text-gray-900">Gestão Escolar</p>
                                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Assinatura / Carimbo</p>
                            </div>
                        )}
                        {includeZeladoriaSignature && (
                            <div className="flex-1 text-center break-inside-avoid">
                                <div className="border-t border-black w-4/5 mx-auto pt-2"></div>
                                <p className="text-xs font-bold uppercase text-gray-900">Supervisão de Zeladoria</p>
                                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Responsável Zeladoria/Manutenção</p>
                            </div>
                        )}
                    </div>
                )}

                <style>{`
                    @media print {
                        @page { margin: 10mm; }
                        body { -webkit-print-color-adjust: exact; }
                    }
                `}</style>
                </div>

                {/* 2. PLANILHA DE AFIXAÇÃO DO BANHEIRO */}
                {selectedPrintBathroom && (
                    <div id="bathroom-print-sheet" className="p-10 text-gray-900 font-sans bg-white w-[210mm] h-[297mm]">
                        <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-4">
                            <div>
                                <h1 className="text-base font-black uppercase tracking-tight">Planilha de Controle de Higienização de Sanitários</h1>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Escola Estadual André Maggi | Manutenção</p>
                            </div>
                            <div className="text-right text-[8px] font-black uppercase">
                                <p className="text-indigo-600 font-black">Zeladoria e Limpeza</p>
                                <p>Referência: {reportPeriod}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-[8px] font-black uppercase bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4 text-gray-800">
                            <div>
                                <span className="text-gray-400">Sanitário:</span>
                                <p className="text-[9px] text-gray-900 font-bold">{selectedPrintBathroom.area_name}</p>
                            </div>
                            <div>
                                <span className="text-gray-400">Bloco/Setor:</span>
                                <p className="text-[9px] text-gray-900 font-bold">{selectedPrintBathroom.block}</p>
                            </div>
                            <div>
                                <span className="text-gray-400">Responsável Padrão:</span>
                                <p className="text-[9px] text-gray-900 font-bold">{selectedPrintBathroom.assigned_employee_name || 'Serviços Gerais'}</p>
                            </div>
                        </div>

                        <div className="border border-gray-900 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-900 text-white">
                                    <tr className="text-[8px] uppercase font-black">
                                        <th className="p-1.5 border-r border-gray-800 text-center w-[8%]">Dia</th>
                                        <th className="p-1.5 border-r border-gray-800 text-center w-[20%]">Turno Matutino (Hora)</th>
                                        <th className="p-1.5 border-r border-gray-800 w-[20%]">Assinatura / Visto</th>
                                        <th className="p-1.5 border-r border-gray-800 text-center w-[20%]">Turno Vespertino (Hora)</th>
                                        <th className="p-1.5 border-r border-gray-800 w-[20%]">Assinatura / Visto</th>
                                        <th className="p-1.5 w-[12%] text-center">Obs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-300">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                        <tr key={day} className="h-[6.5mm] text-[8px] font-bold">
                                            <td className="p-1 border-r border-gray-300 text-center bg-gray-50 font-black">{day}</td>
                                            <td className="p-1 border-r border-gray-300 text-center text-gray-300 font-normal">____:____</td>
                                            <td className="p-1 border-r border-gray-300"></td>
                                            <td className="p-1 border-r border-gray-300 text-center text-gray-300 font-normal">____:____</td>
                                            <td className="p-1 border-r border-gray-300"></td>
                                            <td className="p-1"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-300 grid grid-cols-2 gap-16 text-center text-gray-800">
                            <div>
                                <div className="border-t border-gray-400 w-3/4 mx-auto pt-1">
                                    <p className="text-[8px] font-black uppercase">Responsável pela Limpeza</p>
                                    <p className="text-[6px] text-gray-400 uppercase font-bold">Visto do Servidor</p>
                                </div>
                            </div>
                            <div>
                                <div className="border-t border-gray-400 w-3/4 mx-auto pt-1">
                                    <p className="text-[8px] font-black uppercase">Supervisão de Zeladoria</p>
                                    <p className="text-[6px] text-gray-400 uppercase font-bold">Assinatura / Carimbo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. CHECKLIST MURAL (VAZIO) */}
                <div id="mural-checklist-print" className="p-6 text-gray-900 font-sans bg-white w-[280mm]" style={{ minHeight: '190mm', boxSizing: 'border-box' }}>
                    <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-4">
                        <div>
                            <h1 className="text-lg font-black uppercase tracking-tight">Checklist de Rotina de Zeladoria e Manutenção</h1>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Escola Estadual André Maggi</p>
                        </div>
                        <div className="text-right text-[10px] font-black uppercase">
                            <p className="text-indigo-600 font-black">MURAL DE AFIXAÇÃO</p>
                            <p>Referência: {reportPeriod || '_________________'}</p>
                        </div>
                    </div>

                    <div className="border border-gray-900 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-900 text-white">
                                <tr className="text-[9px] uppercase font-black">
                                    <th className="p-2 border-r border-gray-800 w-[15%]">Bloco / Setor</th>
                                    <th className="p-2 border-r border-gray-800 w-[18%]">Ambiente / Área</th>
                                    <th className="p-2 border-r border-gray-800 w-[38%]">Tarefa de Manutenção / Zeladoria</th>
                                    <th className="p-2 border-r border-gray-800 w-[10%] text-center">Frequência</th>
                                    <th className="p-2 w-[19%] text-center">Vistos de Execução</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-300">
                                {getFlatMuralTasks().map((item, index) => (
                                    <tr key={item.task.id} className="text-[9px] hover:bg-gray-50/50">
                                        {item.isFirstInBlock && (
                                            <td rowSpan={item.blockSpan} className="p-2 border-r border-b border-gray-300 font-bold uppercase text-[9px] align-middle bg-gray-50/50 max-w-[120px] break-words">
                                                {item.block}
                                            </td>
                                        )}
                                        {item.isFirstInArea && (
                                            <td rowSpan={item.areaSpan} className="p-2 border-r border-b border-gray-300 font-bold uppercase text-[9px] align-middle max-w-[120px] break-words">
                                                {item.area}
                                                <div className="text-[7px] text-gray-500 font-normal mt-1 lowercase">
                                                    Resp: {getAreaResponsible(item.block, item.area) || '_________'}
                                                </div>
                                            </td>
                                        )}
                                        <td className="p-2 border-r border-b border-gray-300 font-medium break-words leading-relaxed">
                                            {item.task.task_description}
                                        </td>
                                        <td className="p-2 border-r border-b border-gray-300 text-[8px] font-black uppercase text-center align-middle">
                                            {getFrequencyLabel(item.task.frequency)}
                                        </td>
                                        <td className="p-2 border-b border-gray-300 text-center align-middle bg-gray-50/20">
                                            {renderMuralVistos(item.task)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Signatures at the bottom */}
                    <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 gap-16 text-center text-gray-800 break-inside-avoid">
                        <div>
                            <div className="border-t border-gray-400 w-3/4 mx-auto pt-2">
                                <p className="text-[9px] font-black uppercase">Supervisão de Zeladoria</p>
                                <p className="text-[7px] text-gray-400 uppercase font-bold">Assinatura / Carimbo</p>
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-gray-400 w-3/4 mx-auto pt-2">
                                <p className="text-[9px] font-black uppercase">Gestão Escolar / Direção</p>
                                <p className="text-[7px] text-gray-400 uppercase font-bold">Assinatura / Carimbo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceScheduler;
