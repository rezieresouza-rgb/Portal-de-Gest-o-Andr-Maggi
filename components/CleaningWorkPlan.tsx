import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Printer, Users, MapPin, AlertTriangle, Plus, Trash2, RefreshCw, FileText } from 'lucide-react';

interface MaintenanceTask {
    id: string;
    block: string;
    area_name: string;
    task_description: string;
    frequency: 'DIARIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL';
    assigned_employee_name?: string | null;
}

interface EscalaRow {
    servidor: string;
    turno: string;
    ambientes: string;
    atividades: string;
    frequencia: string;
    horario: string;
}

interface CleaningWorkPlanProps {
    employees: any[];
}

const FREQUENCY_LABEL: Record<string, string> = {
    'DIARIA': 'Diária',
    'SEMANAL': 'Semanal',
    'MENSAL': 'Mensal',
    'TRIMESTRAL': 'Trimestral'
};

const CleaningWorkPlan: React.FC<CleaningWorkPlanProps> = ({ employees }) => {
    const [subTab, setSubTab] = useState<'individual' | 'mural'>('individual');
    
    // Individual Plan States
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
    const [isPrinting, setIsPrinting] = useState(false);

    // Mural Escala States
    const [escalaRows, setEscalaRows] = useState<EscalaRow[]>([]);
    const [muralStartDate, setMuralStartDate] = useState<string>(() => {
        const d = new Date();
        return d.toLocaleDateString('sv-SE');
    });
    const [muralEndDate, setMuralEndDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30); // Default to 30 days from now
        return d.toLocaleDateString('sv-SE');
    });
    const [dreName, setDreName] = useState('SINOP');
    const [schoolNameCode, setSchoolNameCode] = useState('EE ANDRÉ ANTÔNIO MAGGI - CÓDIGO 24045890');

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        if (tasks.length > 0 && employees.length > 0 && escalaRows.length === 0) {
            handleAutofillMural();
        }
    }, [tasks, employees]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cleaning_tasks') // Using cleaning_tasks from supabase
                .select('*');

            if (error) {
                // Fallback to maintenance_tasks if cleaning_tasks is empty/fails
                const { data: maintData, error: maintError } = await supabase
                    .from('maintenance_tasks')
                    .select('*')
                    .order('block')
                    .order('area_name');
                if (!maintError && maintData) {
                    setTasks(maintData as any);
                }
            } else if (data) {
                // Map cleaning tasks
                const mapped = data.map((t: any) => ({
                    id: t.id,
                    block: t.environment_id ? 'BLOCO ÚNICO' : 'GERAL',
                    area_name: t.title || 'LIMPEZA',
                    task_description: t.title || 'Limpeza de rotina',
                    frequency: t.frequency || 'DIARIA',
                    assigned_employee_name: employees.find(e => e.id === t.assigned_employee_id)?.name || null
                }));
                setTasks(mapped);
            }
        } catch (error) {
            console.error('Error fetching tasks for work plan:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter tasks for the selected employee
    const employeeTasks = useMemo(() => {
        if (!selectedEmployeeName) return [];
        if (selectedEmployeeName === 'TODOS') return tasks;
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

    const handlePrintIndividual = async () => {
        setIsPrinting(true);
        setTimeout(async () => {
            const element = document.getElementById('work-plan-print');
            if (element) {
                const nameStr = selectedEmployeeName === 'TODOS' ? 'Geral' : selectedEmployeeName.replace(/\s+/g, '_');
                const opt = {
                    margin: 10,
                    filename: `Plano_Trabalho_${nameStr}.pdf`,
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

    const handlePrintMural = async () => {
        setIsPrinting(true);
        setTimeout(async () => {
            const element = document.getElementById('escala-mural-print');
            if (element) {
                const opt = {
                    margin: 10,
                    filename: `Escala_Limpeza_Mural_${muralStartDate}_${muralEndDate}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                try {
                    // @ts-ignore
                    await window.html2pdf().set(opt).from(element).save();
                } catch (err) {
                    console.error("Error printing mural scale:", err);
                } finally {
                    setIsPrinting(false);
                }
            } else {
                setIsPrinting(false);
            }
        }, 300);
    };

    const handleAutofillMural = () => {
        const rows: EscalaRow[] = [];
        
        // Only include requested servers: Renato, Marisa, Edina/Édina, Keila, and Camilia/Camila
        const ALLOWED_NAMES = ['RENATO', 'MARISA', 'EDINA', 'ÉDINA', 'KEILA', 'CAMILIA', 'CAMILA'];
        const cleaningStaff = employees.filter(e => {
            const nameUpper = e.name?.toUpperCase() || '';
            return ALLOWED_NAMES.some(allowed => nameUpper.includes(allowed));
        });

        cleaningStaff.forEach(emp => {
            // Find tasks assigned to this employee
            const empTasks = tasks.filter(t => 
                t.assigned_employee_name && 
                t.assigned_employee_name.toUpperCase() === emp.name.toUpperCase()
            );

            // Unique areas
            const areas = Array.from(new Set(empTasks.map(t => t.area_name))).join(', ');
            
            // Unique activities grouped by frequency
            const daily = Array.from(new Set(empTasks.filter(t => t.frequency === 'DIARIA').map(t => t.task_description))).join(', ');
            const weekly = Array.from(new Set(empTasks.filter(t => t.frequency === 'SEMANAL').map(t => t.task_description))).join(', ');
            const monthly = Array.from(new Set(empTasks.filter(t => t.frequency === 'MENSAL').map(t => t.task_description))).join(', ');
            const quarterly = Array.from(new Set(empTasks.filter(t => t.frequency === 'TRIMESTRAL').map(t => t.task_description))).join(', ');

            const activityParts: string[] = [];
            if (daily) activityParts.push(`DIÁRIA: ${daily}`);
            if (weekly) activityParts.push(`SEMANAL: ${weekly}`);
            if (monthly) activityParts.push(`MENSAL: ${monthly}`);
            if (quarterly) activityParts.push(`TRIMESTRAL: ${quarterly}`);

            const activities = activityParts.length > 0 
                ? activityParts.join('\n') 
                : 'DIÁRIA: Zeladoria geral, varrer, passar pano, recolher lixo';

            // Frequencies
            const freqs = Array.from(new Set(empTasks.map(t => FREQUENCY_LABEL[t.frequency] || t.frequency))).join(', ');

            // Default horario based on shift
            const shiftUpper = emp.shift?.toUpperCase();
            let defaultHorario = '07:00 - 11:00 / 13:00 - 17:00';
            if (shiftUpper === 'MATUTINO') {
                defaultHorario = '07:00 - 11:00';
            } else if (shiftUpper === 'VESPERTINO') {
                defaultHorario = '13:00 - 17:00';
            }

            rows.push({
                servidor: emp.name.toUpperCase(),
                turno: emp.shift?.toUpperCase() || 'MATUTINO',
                ambientes: areas || 'Salas de Aula e Corredores',
                atividades: activities,
                frequencia: freqs || 'Diária',
                horario: defaultHorario
            });
        });

        if (rows.length === 0) {
            rows.push({
                servidor: 'CLIQUE PARA SELECIONAR...',
                turno: 'MATUTINO',
                ambientes: 'BLOCO A (SALAS E PÁTIO)',
                atividades: 'VARRER, PASSAR PANO, RECOLHER LIXO',
                frequencia: 'DIÁRIA',
                horario: '07:00 - 11:00'
            });
        }

        setEscalaRows(rows);
    };

    const handleAddRow = () => {
        setEscalaRows([
            ...escalaRows,
            {
                servidor: 'NOVO SERVIDOR',
                turno: 'MATUTINO',
                ambientes: 'GERAL / PÁTIO',
                atividades: 'LIMPEZA DE ROTINA',
                frequencia: 'DIÁRIA',
                horario: '07:00 - 11:00'
            }
        ]);
    };

    const handleRemoveRow = (index: number) => {
        setEscalaRows(escalaRows.filter((_, i) => i !== index));
    };

    const handleUpdateRowField = (index: number, field: keyof EscalaRow, value: string) => {
        const newRows = [...escalaRows];
        newRows[index] = { ...newRows[index], [field]: value };
        setEscalaRows(newRows);
    };

    if (loading) {
        return <div className="text-center py-20 text-gray-400 font-bold uppercase">Carregando dados...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Sub-tab selection */}
            <div className="flex bg-gray-200/80 p-1.5 rounded-2xl w-full sm:w-fit no-print">
                <button
                    onClick={() => setSubTab('individual')}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${subTab === 'individual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Users size={16} /> Plano de Trabalho
                </button>
                <button
                    onClick={() => setSubTab('mural')}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${subTab === 'mural' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FileText size={16} /> Escala para o Mural
                </button>
            </div>

            {subTab === 'individual' ? (
                <>
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
                                    <option value="TODOS">-- Toda a Equipe (Plano Geral) --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedEmployeeName && (
                            <button
                                onClick={handlePrintIndividual}
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
                                                                                {selectedEmployeeName === 'TODOS' && t.assigned_employee_name && (
                                                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md ml-1 inline-block uppercase">
                                                                                        {t.assigned_employee_name}
                                                                                    </span>
                                                                                )}
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
                </>
            ) : (
                /* MURAL ESCALA VIEW */
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-6 items-end justify-between no-print">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 w-full">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Diretoria Regional (DRE)</label>
                                <input 
                                    type="text" 
                                    value={dreName} 
                                    onChange={e => setDreName(e.target.value)} 
                                    className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none text-xs"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Escola e Código</label>
                                <input 
                                    type="text" 
                                    value={schoolNameCode} 
                                    onChange={e => setSchoolNameCode(e.target.value)} 
                                    className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Início da Vigência</label>
                                <input 
                                    type="date" 
                                    value={muralStartDate} 
                                    onChange={e => setMuralStartDate(e.target.value)} 
                                    className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none text-xs"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 w-full lg:w-auto">
                            <button
                                onClick={handleAutofillMural}
                                className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                            >
                                <RefreshCw size={14} /> Restaurar da Base
                            </button>
                            <button
                                onClick={handlePrintMural}
                                disabled={isPrinting || escalaRows.length === 0}
                                className="px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 flex-1 sm:flex-initial shadow-lg shadow-orange-600/10"
                            >
                                <Printer size={14} />
                                {isPrinting ? 'Gerando...' : 'Imprimir Escala'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-x-auto no-print">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="font-black text-gray-900 uppercase text-sm">Escala de Jardinagem e Limpeza (Mural)</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Clique nas células para editar livremente antes de gerar a folha física</p>
                            </div>
                            <button
                                onClick={handleAddRow}
                                className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                            >
                                <Plus size={12} /> Adicionar Servidor
                            </button>
                        </div>

                        <table className="w-full text-left border-collapse border border-gray-200 min-w-[700px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="p-3 border border-gray-200">Servidor(a)</th>
                                    <th className="p-3 border border-gray-200 w-24">Turno</th>
                                    <th className="p-3 border border-gray-200">Ambientes Atendidos</th>
                                    <th className="p-3 border border-gray-200">Principais Atividades</th>
                                    <th className="p-3 border border-gray-200 w-24">Frequência</th>
                                    <th className="p-3 border border-gray-200 w-36">Horário</th>
                                    <th className="p-3 border border-gray-200 text-center w-16">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {escalaRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="p-2 border border-gray-200">
                                            <input 
                                                type="text" 
                                                value={row.servidor} 
                                                onChange={(e) => handleUpdateRowField(idx, 'servidor', e.target.value)} 
                                                className="w-full bg-transparent border-none outline-none font-bold uppercase text-[10px] text-gray-900 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 p-1.5 rounded"
                                            />
                                        </td>
                                        <td className="p-2 border border-gray-200">
                                            <input 
                                                type="text" 
                                                value={row.turno} 
                                                onChange={(e) => handleUpdateRowField(idx, 'turno', e.target.value)} 
                                                className="w-full bg-transparent border-none outline-none font-bold uppercase text-[10px] text-gray-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 p-1.5 rounded"
                                            />
                                        </td>
                                        <td className="p-2 border border-gray-200">
                                            <input 
                                                type="text" 
                                                value={row.ambientes} 
                                                onChange={(e) => handleUpdateRowField(idx, 'ambientes', e.target.value)} 
                                                className="w-full bg-transparent border-none outline-none font-medium text-[10px] text-gray-700 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 p-1.5 rounded"
                                            />
                                        </td>
                                        <td className="p-2 border border-gray-200">
                                            <textarea 
                                                value={row.atividades} 
                                                onChange={(e) => handleUpdateRowField(idx, 'atividades', e.target.value)} 
                                                rows={5}
                                                className="w-full bg-transparent border-none outline-none font-medium text-[10px] text-gray-600 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 p-1.5 rounded resize-y"
                                            />
                                        </td>
                                        <td className="p-2 border border-gray-200">
                                            <input 
                                                type="text" 
                                                value={row.frequencia} 
                                                onChange={(e) => handleUpdateRowField(idx, 'frequencia', e.target.value)} 
                                                className="w-full bg-transparent border-none outline-none font-bold uppercase text-[9px] text-gray-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 p-1.5 rounded"
                                            />
                                        </td>
                                        <td className="p-2 border border-gray-200">
                                            <input 
                                                type="text" 
                                                value={row.horario} 
                                                onChange={(e) => handleUpdateRowField(idx, 'horario', e.target.value)} 
                                                className="w-full bg-transparent border-none outline-none font-bold text-[10px] text-gray-900 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 p-1.5 rounded"
                                            />
                                        </td>
                                        <td className="p-2 border border-gray-200 text-center">
                                            <button
                                                onClick={() => handleRemoveRow(idx)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* INDIVIDUAL PRINTABLE PLAN */}
            <div className="fixed top-0 left-0 w-full h-0 overflow-hidden pointer-events-none">
                <div id="work-plan-print" className="bg-white p-8 font-sans w-[210mm] min-h-[297mm]">
                    <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                        <h1 className="text-xl font-black uppercase text-gray-900">
                            {selectedEmployeeName === 'TODOS' ? 'Plano de Trabalho Geral' : 'Plano de Trabalho Individual'}
                        </h1>
                        <p className="text-sm text-gray-600 uppercase font-bold mt-1">Escola Estadual André Maggi</p>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] font-black uppercase text-gray-500">Servidor(a) Responsável</span>
                                <p className="text-base font-black text-gray-900 uppercase">
                                    {selectedEmployeeName === 'TODOS' ? 'Toda a Equipe' : selectedEmployeeName}
                                </p>
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
                                                                    {selectedEmployeeName === 'TODOS' && t.assigned_employee_name && (
                                                                        <span className="text-[8px] font-black text-indigo-700 uppercase ml-1">
                                                                            ({t.assigned_employee_name})
                                                                        </span>
                                                                    )}
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
                                <p className="text-[10px] font-black uppercase text-gray-900">
                                    {selectedEmployeeName === 'TODOS' ? 'Equipe de Limpeza / Zeladoria' : selectedEmployeeName}
                                </p>
                                <p className="text-[8px] text-gray-500 uppercase font-bold mt-1">Cientes das Atribuições</p>
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

            {/* MURAL PRINTABLE ESCALA (IDENTICAL TO SCREENSHOT) */}
            <div className="fixed top-0 left-0 w-full h-0 overflow-hidden pointer-events-none">
                <div id="escala-mural-print" className="bg-white p-12 font-serif w-[210mm] min-h-[297mm] text-gray-950 flex flex-col justify-between">
                    <div className="space-y-8">
                        {/* SEDUC Header */}
                        <div className="text-center space-y-1">
                            <h2 className="text-xs font-bold uppercase tracking-tight">SECRETARIA DE ESTADO DE EDUCAÇÃO DE MATO GROSSO</h2>
                            <h3 className="text-xs font-bold uppercase tracking-tight">DIRETORIA REGIONAL DE EDUCAÇÃO DE {dreName.toUpperCase()}</h3>
                            <h3 className="text-[10px] font-bold uppercase tracking-tight">{schoolNameCode.toUpperCase()}</h3>
                        </div>

                        {/* Title */}
                        <div className="text-center space-y-4 pt-4">
                            <h1 className="text-sm font-bold uppercase border-b border-t border-gray-900 py-2">
                                FORMULÁRIO DE ESCALA DE LIMPEZA
                            </h1>
                            <p className="text-xs font-bold">
                                Período de Vigência: {new Date(muralStartDate + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(muralEndDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        {/* Table */}
                        <div className="pt-6">
                            <table className="w-full text-left border-collapse border border-gray-800 text-[10px]">
                                <thead>
                                    <tr className="bg-gray-50 font-bold">
                                        <th className="p-2 border border-gray-800 uppercase w-[22%]">Servidor(a)</th>
                                        <th className="p-2 border border-gray-800 uppercase w-[10%] text-center">Turno</th>
                                        <th className="p-2 border border-gray-800 uppercase w-[22%]">Ambientes Atendidos</th>
                                        <th className="p-2 border border-gray-800 uppercase w-[26%]">Principais Atividades</th>
                                        <th className="p-2 border border-gray-800 uppercase w-[10%] text-center">Frequência</th>
                                        <th className="p-2 border border-gray-800 text-center w-[10%]">Horário</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {escalaRows.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2 border border-gray-800 font-bold uppercase text-[9px]">{row.servidor}</td>
                                            <td className="p-2 border border-gray-800 uppercase text-center text-[9px]">{row.turno}</td>
                                            <td className="p-2 border border-gray-800 text-[9px]">{row.ambientes}</td>
                                            <td className="p-2 border border-gray-800 text-[9px] whitespace-pre-line leading-normal">
                                                {row.atividades.split('\n').map((line, lIdx) => {
                                                    const trimmed = line.trim();
                                                    if (!trimmed) {
                                                        return <div key={lIdx} className="h-1" />;
                                                    }
                                                    const match = trimmed.match(/^(DIÁRIA|SEMANAL|MENSAL|TRIMESTRAL|DIARIA):\s*(.*)$/i);
                                                    if (match) {
                                                        return (
                                                            <div key={lIdx} className="mb-0.5 last:mb-0 text-gray-800">
                                                                <strong className="text-gray-900">{match[1].toUpperCase()}:</strong> {match[2]}
                                                            </div>
                                                        );
                                                    }
                                                    return <div key={lIdx} className="mb-0.5 last:mb-0 text-gray-800">{trimmed}</div>;
                                                })}
                                            </td>
                                            <td className="p-2 border border-gray-800 uppercase text-center text-[9px]">{row.frequencia}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold text-[9px]">{row.horario}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="pt-8 border-t border-gray-300">
                        <p className="text-[9px] italic text-gray-600 font-bold">
                            * Esta tabela deve permanecer fixada em local visível e ser atualizada sempre que houver alterações na escala.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CleaningWorkPlan;
