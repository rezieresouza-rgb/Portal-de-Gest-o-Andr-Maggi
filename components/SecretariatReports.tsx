import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    Search, 
    Printer, 
    Filter, 
    FileText, 
    Download, 
    UserCheck, 
    Bus,
    Stethoscope,
    ChevronDown,
    X,
    Calendar,
    ArrowUpDown,
    Loader2
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Classroom {
    id: string;
    name: string;
}

interface StudentReportData {
    id: string;
    name: string;
    birth_date: string;
    registration_number: string;
    status: string;
    paed: boolean;
    school_transport: boolean;
    gender: string;
    current_class?: string;
    age: number;
}

export default function SecretariatReports() {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<StudentReportData[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filters
    const [filters, setFilters] = useState({
        classroom: 'TODOS',
        status: 'ATIVO',
        paed: 'TODOS',
        transport: 'TODOS',
        gender: 'TODOS',
        minAge: '',
        maxAge: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch Classrooms
            const { data: classData } = await supabase
                .from('classrooms')
                .select('id, name')
                .order('name');
            setClassrooms(classData || []);

            // Fetch Students with primary enrollment
            const { data: studentData, error } = await supabase
                .from('students')
                .select(`
                    *,
                    enrollments (
                        status,
                        classrooms (name)
                    )
                `);

            if (error) throw error;

            const now = new Date();
            const processed = (studentData || []).map(s => {
                // Get most relevant enrollment (prefer active one)
                const relevantEnrollment = s.enrollments?.find((e: any) => e.status === 'ATIVO') || s.enrollments?.[0];
                
                // Calculate Exact Age
                const birth = new Date(s.birth_date);
                let age = now.getFullYear() - birth.getFullYear();
                const m = now.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                    age--;
                }

                return {
                    ...s,
                    current_class: relevantEnrollment?.classrooms?.name || 'SEM TURMA',
                    age: age
                };
            });

            setStudents(processed);
        } catch (error) {
            console.error("Erro ao carregar relatórios:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 s.registration_number.includes(searchTerm);
            
            const matchesClass = filters.classroom === 'TODOS' || s.current_class === filters.classroom;
            const matchesStatus = filters.status === 'TODOS' || s.status === filters.status;
            const matchesPAED = filters.paed === 'TODOS' || 
                               (filters.paed === 'SIM' && s.paed) || 
                               (filters.paed === 'NAO' && !s.paed);
            const matchesTransport = filters.transport === 'TODOS' || 
                                    (filters.transport === 'SIM' && s.school_transport) || 
                                    (filters.transport === 'NAO' && !s.school_transport);
            const matchesGender = filters.gender === 'TODOS' || s.gender === filters.gender;
            
            const ageNum = s.age;
            const matchesMinAge = !filters.minAge || ageNum >= parseInt(filters.minAge);
            const matchesMaxAge = !filters.maxAge || ageNum <= parseInt(filters.maxAge);

            return matchesSearch && matchesClass && matchesStatus && matchesPAED && 
                   matchesTransport && matchesGender && matchesMinAge && matchesMaxAge;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [students, searchTerm, filters]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Preparando base de dados...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* NO PRINT AREA: FILTERS & TOOLS */}
            <div className="no-print space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Central de Relatórios</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gere listagens personalizadas e documentos oficiais</p>
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <Printer size={16} /> Imprimir Relatório
                    </button>
                </div>

                {/* FILTER BAR - SLICK DESIGN */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Filter size={14} className="text-indigo-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtros Avançados</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2 relative">
                            <input 
                                type="text" 
                                placeholder="Buscar por nome ou matrícula..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all"
                            />
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>

                        {/* Classroom */}
                        <select 
                            value={filters.classroom}
                            onChange={e => setFilters({...filters, classroom: e.target.value})}
                            className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="TODOS">Todas as Turmas</option>
                            {classrooms.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>

                        {/* Status */}
                        <select 
                            value={filters.status}
                            onChange={e => setFilters({...filters, status: e.target.value})}
                            className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="ATIVO">Apenas Ativos</option>
                            <option value="TODOS">Todos (Inc. Histórico)</option>
                            <option value="TRANSFERIDO">Transferidos</option>
                            <option value="ABANDONO">Abandono</option>
                        </select>

                        {/* PAED */}
                        <select 
                            value={filters.paed}
                            onChange={e => setFilters({...filters, paed: e.target.value})}
                            className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="TODOS">PAED: Todos</option>
                            <option value="SIM">PAED: Sim</option>
                            <option value="NAO">PAED: Não</option>
                        </select>

                         {/* Transport */}
                         <select 
                            value={filters.transport}
                            onChange={e => setFilters({...filters, transport: e.target.value})}
                            className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="TODOS">Transporte: Todos</option>
                            <option value="SIM">Transporte: Sim</option>
                            <option value="NAO">Transporte: Não</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
                        {/* Gender */}
                        <select 
                            value={filters.gender}
                            onChange={e => setFilters({...filters, gender: e.target.value})}
                            className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="TODOS">Gênero: Todos</option>
                            <option value="MASCULINO">Masculino</option>
                            <option value="FEMININO">Feminino</option>
                        </select>

                        {/* Age range */}
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                placeholder="Idade Mín"
                                value={filters.minAge}
                                onChange={e => setFilters({...filters, minAge: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black outline-none focus:bg-white focus:border-indigo-500 transition-all"
                            />
                            <span className="text-gray-300 font-bold">-</span>
                            <input 
                                type="number" 
                                placeholder="Idade Máx"
                                value={filters.maxAge}
                                onChange={e => setFilters({...filters, maxAge: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black outline-none focus:bg-white focus:border-indigo-500 transition-all"
                            />
                        </div>

                        {/* Reset */}
                        <button 
                            onClick={() => {
                                setFilters({
                                    classroom: 'TODOS',
                                    status: 'ATIVO',
                                    paed: 'TODOS',
                                    transport: 'TODOS',
                                    gender: 'TODOS',
                                    minAge: '',
                                    maxAge: ''
                                });
                                setSearchTerm('');
                            }}
                            className="text-[10px] font-black text-gray-400 uppercase hover:text-red-500 transition-all flex items-center gap-2 ml-4"
                        >
                            Limpar Filtros <X size={12} />
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-end px-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Encontrados: <span className="text-indigo-600">{filteredStudents.length} alunos</span>
                    </p>
                </div>
            </div>

            {/* REPORT TABLE / PRINT AREA */}
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-3xl border border-gray-100 shadow-sm print:p-0 print:border-0 print:shadow-none min-h-[500px] print-area">
                
                {/* SCHOOL HEADER - ONLY FOR PRINT OR PREVIEW */}
                <div className="hidden print:flex flex-col items-center justify-center mb-10 text-center border-b-2 border-gray-900 pb-8">
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Escola Estadual André Antônio Maggi</h1>
                    <p className="text-xs font-bold uppercase tracking-widest mt-1">Secretaria Acadêmica - Relatório de Alunos</p>
                    <div className="flex gap-10 mt-4 text-[10px] font-black uppercase">
                        <p>Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
                        <p>Filtros: {filters.classroom !== 'TODOS' ? `Turma ${filters.classroom}` : 'Geral'} | Status: {filters.status}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 print:border-gray-900">
                                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest print:text-gray-900 print:px-2">Nº</th>
                                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest print:text-gray-900 print:px-2">Matrícula</th>
                                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest print:text-gray-900 print:px-2">Nome do Aluno</th>
                                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest print:text-gray-900 print:px-2">Idade</th>
                                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest print:text-gray-900 print:px-2">Turma</th>
                                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest print:text-gray-900 print:px-2 text-center">PAED</th>
                                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest print:text-gray-900 print:px-2 text-center">Transp.</th>
                                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest print:text-gray-900 print:px-2 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 print:divide-y-0">
                            {filteredStudents.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors print:border-b print:border-gray-200">
                                    <td className="px-4 py-3.5 text-[10px] font-bold text-gray-300 font-mono print:text-gray-900 print:px-2">
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    <td className="px-4 py-3.5 text-[10px] font-bold text-gray-400 font-mono print:text-gray-900 print:px-2">
                                        {s.registration_number}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <p className="text-xs font-black text-gray-700 uppercase print:text-gray-900">
                                            {s.name}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs font-bold text-gray-500 print:text-gray-900 print:px-2">
                                        {s.age} anos
                                    </td>
                                    <td className="px-4 py-3.5 border-l border-transparent">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase print:text-gray-900">
                                            {s.current_class}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center print:px-2">
                                        {s.paed ? (
                                            <div className="flex justify-center">
                                                <Stethoscope size={14} className="text-red-400 print:text-gray-900" />
                                            </div>
                                        ) : <span className="text-[10px] text-gray-200 font-bold print:hidden">-</span>}
                                    </td>
                                    <td className="px-4 py-3.5 text-center print:px-2">
                                        {s.school_transport ? (
                                            <div className="flex justify-center">
                                                <Bus size={14} className="text-amber-500 print:text-gray-900" />
                                            </div>
                                        ) : <span className="text-[10px] text-gray-200 font-bold print:hidden">-</span>}
                                    </td>
                                    <td className="px-4 py-3.5 text-right print:px-2">
                                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                            s.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600 print:bg-transparent print:text-gray-900' : 
                                            s.status === 'TRANSFERIDO' ? 'bg-amber-50 text-amber-600 print:bg-transparent print:text-gray-900' :
                                            'bg-red-50 text-red-600 print:bg-transparent print:text-gray-900'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredStudents.length === 0 && (
                        <div className="py-20 text-center space-y-3">
                            <Users size={40} className="mx-auto text-gray-100" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhum aluno encontrado com estes filtros</p>
                        </div>
                    )}
                </div>

                <div className="hidden print:block mt-12 pt-8 border-t border-gray-100 text-[8px] font-black uppercase text-gray-400 text-center tracking-widest">
                    Escola Estadual André Antônio Maggi - Documento Gerado Via Portal de Gestão
                </div>
            </div>

            {/* STYLE FOR PRINTING */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: portrait; margin: 15mm; }
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    
                    /* Reset all layout containers to be invisible */
                    body > * { visibility: hidden !important; position: absolute !important; left: -9999px !important; }
                    
                    /* Force the print area to be visible and top-aligned */
                    .print-area, .print-area * { visibility: visible !important; }
                    .print-area { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important; 
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                    }

                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border-bottom: 1px solid #000 !important; padding: 8px 4px !important; }
                }
            `}} />
        </div>
    );
}
