import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Printer, Users, MapPin, AlertTriangle } from 'lucide-react';

interface MaintenanceTask {
    id: string;
    block: string;
    area_name: string;
    task_description: string;
    frequency: 'DIARIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL';
    assigned_employee_name?: string | null;
}

interface CleaningWorkPlanProps {
    employees: { id: string, name: string }[];
}

const FREQUENCY_LABEL: Record<string, string> = {
    'DIARIA': 'Diária',
    'SEMANAL': 'Semanal',
    'MENSAL': 'Mensal',
    'TRIMESTRAL': 'Trimestral'
};

const CleaningWorkPlan: React.FC<CleaningWorkPlanProps> = ({ employees }) => {
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('maintenance_tasks')
                .select('*')
                .order('block')
                .order('area_name');

            if (error) throw error;
            if (data) setTasks(data as MaintenanceTask[]);
        } catch (error) {
            console.error('Error fetching tasks for work plan:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter tasks for the selected employee
    const employeeTasks = useMemo(() => {
        if (!selectedEmployeeName) return [];
        return tasks.filter(t => 
            t.assigned_employee_name && 
            t.assigned_employee_name.toUpperCase().includes(selectedEmployeeName.toUpperCase())
        );
    }, [tasks, selectedEmployeeName]);

    // Group tasks by block -> area
    const groupedTasks = useMemo(() => {
        const grouped: Record<string, Record<string, MaintenanceTask[]>> = {};
        employeeTasks.forEach(task => {
            if (!grouped[task.block]) grouped[task.block] = {};
            if (!grouped[task.block][task.area_name]) grouped[task.block][task.area_name] = [];
            grouped[task.block][task.area_name].push(task);
        });
        return grouped;
    }, [employeeTasks]);

    const handlePrint = async () => {
        setIsPrinting(true);
        setTimeout(async () => {
            const element = document.getElementById('work-plan-print');
            if (element) {
                const opt = {
                    margin: 10,
                    filename: `Plano_Trabalho_${selectedEmployeeName.replace(/\s+/g, '_')}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                try {
                    // @ts-ignore
                    await window.html2pdf().set(opt).from(element).save();
                } catch (err) {
                    console.error("Error printing:", err);
                } finally {
                    setIsPrinting(false);
                }
            } else {
                setIsPrinting(false);
            }
        }, 300);
    };

    if (loading) {
        return <div className="text-center py-20 text-gray-400 font-bold uppercase">Carregando dados...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-1/2">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Users size={24} />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Selecione o Servidor</label>
                        <select
                            value={selectedEmployeeName}
                            onChange={(e) => setSelectedEmployeeName(e.target.value)}
                            className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">-- Selecione um servidor --</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.name}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedEmployeeName && (
                    <button
                        onClick={handlePrint}
                        disabled={isPrinting || employeeTasks.length === 0}
                        className="w-full md:w-auto px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Printer size={16} />
                        {isPrinting ? 'Gerando...' : 'Imprimir Plano'}
                    </button>
                )}
            </div>

            {!selectedEmployeeName ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                    <Users size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase text-sm">Selecione um servidor para visualizar o Plano de Trabalho</p>
                </div>
            ) : employeeTasks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                    <AlertTriangle size={48} className="mx-auto text-amber-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase text-sm">Nenhuma tarefa atribuída a este servidor.</p>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-xl font-black uppercase text-gray-900">Pré-visualização do Plano de Trabalho</h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">Confira abaixo os ambientes e tarefas atribuídas a <strong>{selectedEmployeeName}</strong>.</p>
                    </div>

                    <div className="space-y-6">
                        {Object.entries(groupedTasks).map(([block, areas]) => (
                            <div key={block} className="border border-gray-200 rounded-2xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                    <MapPin size={18} className="text-indigo-600" />
                                    <h3 className="font-black uppercase text-gray-900">{block}</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {Object.entries(areas).map(([area, areaTasks]) => (
                                        <div key={area} className="p-4 bg-white">
                                            <h4 className="font-bold text-gray-800 uppercase text-sm mb-3">{area}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {['DIARIA', 'SEMANAL', 'MENSAL', 'TRIMESTRAL'].map(freq => {
                                                    const freqTasks = areaTasks.filter(t => t.frequency === freq);
                                                    if (freqTasks.length === 0) return null;
                                                    return (
                                                        <div key={freq} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mb-2 inline-block">
                                                                {FREQUENCY_LABEL[freq]}
                                                            </span>
                                                            <ul className="list-disc pl-4 space-y-1">
                                                                {freqTasks.map(t => (
                                                                    <li key={t.id} className="text-xs text-gray-600 font-medium leading-tight">
                                                                        {t.task_description}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* HIDDEN PRINTABLE REPORT */}
            <div className="fixed top-0 left-0 w-full h-0 overflow-hidden pointer-events-none">
                <div id="work-plan-print" className="bg-white p-8 font-sans w-[210mm] min-h-[297mm]">
                    <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                        <h1 className="text-xl font-black uppercase text-gray-900">Plano de Trabalho Individual</h1>
                        <p className="text-sm text-gray-600 uppercase font-bold mt-1">Escola Estadual André Maggi</p>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] font-black uppercase text-gray-500">Servidor(a) Responsável</span>
                                <p className="text-base font-black text-gray-900 uppercase">{selectedEmployeeName}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-gray-500">Cargo / Função</span>
                                <p className="text-base font-black text-gray-900 uppercase">Apoio Administrativo (Limpeza)</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-sm font-black uppercase border-b border-gray-300 pb-2 mb-4">Relação de Ambientes e Atribuições</h2>
                        {Object.entries(groupedTasks).map(([block, areas]) => (
                            <div key={block} className="mb-6 break-inside-avoid">
                                <h3 className="text-xs font-black uppercase bg-gray-200 p-2 border-l-4 border-gray-800 mb-3">{block}</h3>
                                {Object.entries(areas).map(([area, areaTasks]) => (
                                    <div key={area} className="ml-4 mb-4">
                                        <h4 className="text-[11px] font-black uppercase text-gray-800 mb-2 underline decoration-gray-300 underline-offset-4">{area}</h4>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                            {['DIARIA', 'SEMANAL', 'MENSAL', 'TRIMESTRAL'].map(freq => {
                                                const freqTasks = areaTasks.filter(t => t.frequency === freq);
                                                if (freqTasks.length === 0) return null;
                                                return (
                                                    <div key={freq} className="break-inside-avoid">
                                                        <span className="text-[9px] font-black uppercase text-gray-600 border border-gray-300 px-1.5 py-0.5 rounded bg-gray-50 mb-1 inline-block">
                                                            {FREQUENCY_LABEL[freq]}
                                                        </span>
                                                        <ul className="list-disc pl-3 mt-1">
                                                            {freqTasks.map(t => (
                                                                <li key={t.id} className="text-[9px] text-gray-700 leading-tight mb-0.5">
                                                                    {t.task_description}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 pt-8 border-t border-gray-400 grid grid-cols-2 gap-12 text-center text-gray-800 break-inside-avoid">
                        <div>
                            <div className="border-t border-gray-800 w-4/5 mx-auto pt-2">
                                <p className="text-[10px] font-black uppercase text-gray-900">{selectedEmployeeName}</p>
                                <p className="text-[8px] text-gray-500 uppercase font-bold mt-1">Ciente das Atribuições</p>
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-gray-800 w-4/5 mx-auto pt-2">
                                <p className="text-[10px] font-black uppercase text-gray-900">Gestão Escolar / Zeladoria</p>
                                <p className="text-[8px] text-gray-500 uppercase font-bold mt-1">Supervisão</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CleaningWorkPlan;
