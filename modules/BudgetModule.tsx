
import React, { useState, useRef, useMemo } from 'react';
import {
    Upload,
    FileSpreadsheet,
    Plus,
    Trash2,
    Save,
    Download,
    Printer,
    Search,
    Filter,
    ArrowLeft,
    Eye,
    Edit3,
    Loader2,
    Settings,
    ChevronDown,
    ChevronUp,
    XCircle,
    Copy,
    CheckCircle2,
    Eraser,
    Building2,
    UserCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '../components/Toast';
import { User } from '../types';

interface BudgetRow {
    id: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    resource: 'RU' | 'PDDE';
}

const BudgetModule: React.FC<{ user: User }> = ({ user }) => {
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<BudgetRow[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterResource, setFilterResource] = useState<'ALL' | 'RU' | 'PDDE'>('ALL');
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [isPrinting, setIsPrinting] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const [schoolInfo, setSchoolInfo] = useState({
        name: 'Escola Estadual André Antônio Maggi',
        city: 'Colíder - MT',
        dre: 'DRE - Sinop',
        year: new Date().getFullYear().toString()
    });

    const [supplierInfo, setSupplierInfo] = useState({
        name: '',
        cnpj: '',
        phone: '',
        validity: '30 dias',
        contactName: ''
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const newRows: BudgetRow[] = [];

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as any[];
                    if (!row || row.length === 0) continue;

                    const desc = row[0]?.toString() || '';
                    const unit = row[1]?.toString() || 'UN';
                    const qty = parseFloat(row[2]) || 0;
                    const price = parseFloat(row[3]) || 0;

                    if (desc) {
                        newRows.push({
                            id: Math.random().toString(36).substr(2, 9),
                            description: desc,
                            unit: unit,
                            quantity: qty,
                            unitPrice: price,
                            totalPrice: qty * price,
                            resource: 'RU'
                        });
                    }
                }

                setRows(prev => [...prev, ...newRows]);
                addToast(`${newRows.length} itens importados!`, 'success');
            } catch (error) {
                addToast("Erro ao processar planilha.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleAddRow = () => {
        const newRow: BudgetRow = {
            id: Math.random().toString(36).substr(2, 9),
            description: '',
            unit: 'UN',
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            resource: 'RU'
        };
        setRows([newRow, ...rows]);
    };

    const handleUpdateRow = (id: string, field: keyof BudgetRow, value: any) => {
        setRows(prev => prev.map(row => {
            if (row.id !== id) return row;

            let updatedValue = value;
            if (field === 'quantity' || field === 'unitPrice') {
                updatedValue = value === '' ? 0 : parseFloat(value);
                if (isNaN(updatedValue)) updatedValue = 0;
            }

            const updatedRow = { ...row, [field]: updatedValue };

            if (field === 'quantity' || field === 'unitPrice') {
                updatedRow.totalPrice = updatedRow.quantity * updatedRow.unitPrice;
            }

            return updatedRow;
        }));
    };

    const handleRemoveRow = (id: string) => {
        setRows(prev => prev.filter(row => row.id !== id));
    };

    const handleClearAll = () => {
        if (confirm('Tem certeza que deseja apagar todos os itens da planilha?')) {
            setRows([]);
            addToast("Planilha limpa com sucesso.", "info");
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handlePrint = async () => {
        setIsPrinting(true);
        const element = document.getElementById('budget-print-content');
        if (element) {
            try {
                // @ts-ignore
                await window.html2pdf().set({
                    margin: [10, 10, 10, 10],
                    filename: `Orcamento_${supplierInfo.name || 'Fornecedor'}_${schoolInfo.year}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                }).from(element).save();
            } catch (error) {
                addToast("Erro ao gerar PDF.", "error");
            }
        }
        setIsPrinting(false);
    };

    const totals = useMemo(() => {
        const total = rows.reduce((acc, row) => acc + row.totalPrice, 0);
        const ru = rows.filter(r => r.resource === 'RU').reduce((acc, r) => acc + r.totalPrice, 0);
        const pdde = rows.filter(r => r.resource === 'PDDE').reduce((acc, r) => acc + r.totalPrice, 0);
        return { total, ru, pdde };
    }, [rows]);

    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            const matchesSearch = row.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterResource === 'ALL' || row.resource === filterResource;
            return matchesSearch && matchesFilter;
        });
    }, [rows, searchTerm, filterResource]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Control Bar */}
            <div className="sticky top-4 z-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-900/80 p-4 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl no-print">
                <div className="flex items-center gap-3 pl-2">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <FileSpreadsheet className="text-emerald-400" size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-tight leading-none">
                            Orçamento / Cotação
                        </h2>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{schoolInfo.year}</span>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pr-1">
                    <button
                        onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'edit'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                            }`}
                    >
                        {viewMode === 'edit' ? <><Eye size={14} /> Gerar PDF Final</> : <><Edit3 size={14} /> Voltar p/ Edição</>}
                    </button>

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${showSettings ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                        title="Configurações e Fornecedor"
                    >
                        <Settings size={18} />
                        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Dados do Orçamento</span>
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-2 hidden md:block"></div>

                    {viewMode === 'edit' ? (
                        <>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Upload size={14} /> Excel
                            </button>
                            <button
                                onClick={handleAddRow}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all font-mono"
                            >
                                <Plus size={14} /> NOVO ITEM
                            </button>
                            {rows.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all"
                                    title="Limpar Planilha"
                                >
                                    <Eraser size={18} />
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="flex items-center gap-2 px-6 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                            {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                            Baixar Documento (A4)
                        </button>
                    )}
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />

            {/* Config & Supplier Overlay (Improved) */}
            {showSettings && (
                <div className="bg-gray-800/90 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl animate-in slide-in-from-top duration-300 no-print shadow-2xl relative">
                    <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                        <XCircle size={24} />
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* School Info Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                <Building2 className="text-emerald-400" size={20} />
                                <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Instituição (Cabeçalho)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(Object.keys(schoolInfo) as Array<keyof typeof schoolInfo>).map(key => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                            {key === 'name' ? 'Unidade Escolar' : key === 'city' ? 'Município' : (key as string).toUpperCase()}
                                        </label>
                                        <input
                                            value={schoolInfo[key]}
                                            onChange={(e) => setSchoolInfo({ ...schoolInfo, [key]: e.target.value })}
                                            className="w-full p-3 bg-gray-950/50 border border-white/10 rounded-2xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            placeholder={`Ex: ${key === 'name' ? 'EE André Maggi' : 'Sinop'}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Supplier Info Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                <UserCircle2 className="text-blue-400" size={20} />
                                <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Dados do Fornecedor / Empresa</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Razão Social / Nome da Empresa</label>
                                    <input
                                        value={supplierInfo.name}
                                        onChange={(e) => setSupplierInfo({ ...supplierInfo, name: e.target.value })}
                                        className="w-full p-3 bg-gray-950/50 border border-white/10 rounded-2xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                        placeholder="Digite o nome da empresa..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">CNPJ / CPF</label>
                                    <input
                                        value={supplierInfo.cnpj}
                                        onChange={(e) => setSupplierInfo({ ...supplierInfo, cnpj: e.target.value })}
                                        className="w-full p-3 bg-gray-950/50 border border-white/10 rounded-2xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone / Contato</label>
                                    <input
                                        value={supplierInfo.phone}
                                        onChange={(e) => setSupplierInfo({ ...supplierInfo, phone: e.target.value })}
                                        className="w-full p-3 bg-gray-950/50 border border-white/10 rounded-2xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Responsável pela Cotação</label>
                                    <input
                                        value={supplierInfo.contactName}
                                        onChange={(e) => setSupplierInfo({ ...supplierInfo, contactName: e.target.value })}
                                        className="w-full p-3 bg-gray-950/50 border border-white/10 rounded-2xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Nome do representante"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Validade da Proposta</label>
                                    <input
                                        value={supplierInfo.validity}
                                        onChange={(e) => setSupplierInfo({ ...supplierInfo, validity: e.target.value })}
                                        className="w-full p-3 bg-gray-950/50 border border-white/10 rounded-2xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Ex: 15 dias"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Switcher */}
            <div className="relative">
                {/* ---------------- EDITOR VIEW ---------------- */}
                {viewMode === 'edit' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-800/30 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-all duration-500 rotate-12">
                                    <FileSpreadsheet size={120} />
                                </div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                    Total Geral do Orçamento
                                </p>
                                <p className="text-3xl font-black text-white font-mono tracking-tighter tabular-nums">{formatCurrency(totals.total)}</p>
                            </div>
                            <div className="bg-blue-600/5 p-6 rounded-[2rem] border border-blue-500/10 relative overflow-hidden group">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Alocado em RU
                                </p>
                                <p className="text-3xl font-black text-blue-400 font-mono tracking-tighter tabular-nums">{formatCurrency(totals.ru)}</p>
                            </div>
                            <div className="bg-emerald-600/5 p-6 rounded-[2rem] border border-emerald-500/10 relative overflow-hidden group">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Alocado em PDDE
                                </p>
                                <p className="text-3xl font-black text-emerald-400 font-mono tracking-tighter tabular-nums">{formatCurrency(totals.pdde)}</p>
                            </div>
                        </div>

                        {/* Search & Filter Tabs */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-emerald-400 transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Procurar item na cotação..."
                                    className="w-full pl-14 pr-6 py-4 bg-gray-800/40 border border-white/5 rounded-[1.5rem] text-white placeholder-gray-600 shadow-inner focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium text-sm"
                                />
                            </div>
                            <div className="flex bg-gray-900/40 p-1.5 rounded-[1.5rem] border border-white/5 shrink-0 backdrop-blur-sm shadow-xl">
                                {(['ALL', 'RU', 'PDDE'] as const).map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setFilterResource(filter)}
                                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filterResource === filter
                                            ? 'bg-gray-100 text-gray-950 shadow-lg scale-105'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                            }`}
                                    >
                                        {filter === 'ALL' ? 'Todos' : filter}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Spreadsheet Table */}
                        <div className="bg-gray-800/20 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-gray-950/40 border-b border-white/5">
                                            <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Descrição do Requisito / Serviço</th>
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center w-24">Unidade</th>
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-right w-24">Quant.</th>
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-right w-40">V. Unitário (Fornecedor)</th>
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-right w-40">Subtotal</th>
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center w-36">Fonte</th>
                                            <th className="px-6 py-5 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredRows.map((row) => (
                                            <tr key={row.id} className="hover:bg-white/[0.03] transition-all group/row">
                                                <td className="px-8 py-4">
                                                    <textarea
                                                        rows={1}
                                                        value={row.description}
                                                        onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                                                        className="w-full bg-transparent border-none text-white focus:ring-0 p-0 text-sm font-bold resize-none min-h-[1.5rem] placeholder:text-gray-700 transition-all leading-tight"
                                                        placeholder="Ex: Instalação de ar-condicionado 12000 BTUS..."
                                                        onInput={(e) => {
                                                            const t = e.target as HTMLTextAreaElement;
                                                            t.style.height = 'auto';
                                                            t.style.height = t.scrollHeight + 'px';
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        value={row.unit}
                                                        onChange={(e) => handleUpdateRow(row.id, 'unit', e.target.value)}
                                                        className="w-full bg-gray-950/40 border border-transparent group-hover/row:border-white/10 rounded-xl text-white/50 focus:text-white focus:border-emerald-500/50 py-1.5 text-center uppercase font-black text-[10px] outline-none transition-all"
                                                        placeholder="UN"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="number"
                                                        value={row.quantity || ''}
                                                        onChange={(e) => handleUpdateRow(row.id, 'quantity', e.target.value)}
                                                        className="w-full bg-gray-950/40 border border-transparent group-hover/row:border-white/10 rounded-xl text-white focus:border-emerald-500/50 py-1.5 text-right font-black text-xs outline-none transition-all placeholder:text-gray-800"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2 bg-gray-950/40 border border-transparent group-hover/row:border-white/10 rounded-xl px-3 py-1.5 transition-all focus-within:ring-2 focus-within:ring-emerald-500/30">
                                                        <span className="text-[10px] font-black text-gray-600">R$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={row.unitPrice || ''}
                                                            onChange={(e) => handleUpdateRow(row.id, 'unitPrice', e.target.value)}
                                                            className="w-full bg-transparent border-none text-white focus:ring-0 p-0 text-right text-xs font-black outline-none tabular-nums"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-sm font-black text-emerald-400 font-mono tracking-tighter tabular-nums">
                                                        {formatCurrency(row.totalPrice)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <select
                                                        value={row.resource}
                                                        onChange={(e) => handleUpdateRow(row.id, 'resource', e.target.value)}
                                                        className={`w-full p-2 rounded-xl text-[10px] font-black uppercase border-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all ${row.resource === 'RU'
                                                            ? 'bg-blue-600/20 text-blue-400'
                                                            : 'bg-emerald-600/20 text-emerald-400'
                                                            }`}
                                                    >
                                                        <option value="RU" className="bg-gray-900 text-white">RECURSO ÚNICO</option>
                                                        <option value="PDDE" className="bg-gray-900 text-white">PDDE</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleRemoveRow(row.id)}
                                                        className="p-2 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover/row:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredRows.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-4 text-gray-700 font-mono">
                                                        <div className="p-6 bg-white/5 rounded-full border border-white/5 shadow-inner">
                                                            <Building2 size={64} className="opacity-20 rotate-12" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-black uppercase tracking-widest text-white/50">Cotação Vazia</p>
                                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Lance os valores passados pelo fornecedor</p>
                                                        </div>
                                                        <button
                                                            onClick={handleAddRow}
                                                            className="mt-4 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/20 transition-all flex items-center gap-3"
                                                        >
                                                            <Plus size={16} /> Adicionar Item
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------------- PREVIEW VIEW (A4 - Document Style) ---------------- */}
                {viewMode === 'preview' && (
                    <div className="w-full flex justify-center animate-in zoom-in-95 duration-500 ease-out p-8 bg-gray-950/30 rounded-[3rem] border border-white/5">
                        <div id="budget-print-content" className="w-[210mm] min-h-[297mm] bg-white text-gray-950 p-[20mm] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative font-['Inter'] selection:bg-gray-200">

                            {/* OFFICIAL HEADER */}
                            <div className="flex items-center gap-8 border-b-[3px] border-gray-950 pb-8 mb-5">
                                <div className="w-20 h-20 bg-gray-50 border-2 border-gray-200 flex items-center justify-center rounded-xl overflow-hidden grayscale">
                                    <div className="text-[7px] font-black text-gray-400 text-center leading-none uppercase">BRASÃO<br />OFICIAL<br />MATO GROSSO</div>
                                </div>
                                <div className="flex-1 uppercase font-black text-gray-950">
                                    <h1 className="text-base tracking-tighter leading-tight">Estado de Mato Grosso</h1>
                                    <h2 className="text-[11px] leading-tight text-gray-700">Secretaria de Estado de Educação</h2>
                                    <div className="mt-2 h-0.5 bg-gray-200 w-1/4"></div>
                                    <h3 className="text-[10px] text-gray-600 mt-2">{schoolInfo.dre}</h3>
                                    <h3 className="text-[10px] text-gray-600">{schoolInfo.name}</h3>
                                </div>
                                <div className="text-right uppercase">
                                    <div className="bg-gray-950 text-white px-4 py-2 rounded-lg inline-block">
                                        <p className="text-[10px] font-black tracking-widest">Orçamento de Serviço / Material</p>
                                    </div>
                                    <p className="text-sm font-black mt-3 text-gray-900">Nº {Math.floor(Math.random() * 1000).toString().padStart(4, '0')} / {schoolInfo.year}</p>
                                </div>
                            </div>

                            {/* SUPPLIER DETAILS BOX (NEW) */}
                            <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl mb-8 flex flex-col gap-4">
                                <header className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <h5 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Dados do Proponente (Fornecedor)</h5>
                                    {supplierInfo.validity && (
                                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">Validade: {supplierInfo.validity}</span>
                                    )}
                                </header>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Razão Social</p>
                                        <p className="text-[11px] font-black text-gray-900 uppercase">{supplierInfo.name || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">CNPJ / CPF</p>
                                        <p className="text-[11px] font-black text-gray-900">{supplierInfo.cnpj || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Representante / Contato</p>
                                        <p className="text-[11px] font-black text-gray-900 uppercase">{supplierInfo.contactName || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Telefone / E-mail</p>
                                        <p className="text-[11px] font-black text-gray-900">{supplierInfo.phone || 'Não informado'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* TABLE CONTENT */}
                            <div className="space-y-10">
                                <div>
                                    <header className="flex justify-between items-end mb-4">
                                        <h4 className="text-[12px] font-black uppercase flex items-center gap-2">
                                            <span className="w-2 h-2 bg-gray-950"></span>
                                            III. Detalhamento de Cotação de Preços
                                        </h4>
                                    </header>

                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 uppercase font-black text-[9px] border-y-2 border-gray-950 text-gray-950">
                                                <th className="py-3 pl-3 text-left border-r border-gray-200 w-10">#</th>
                                                <th className="py-3 px-4 text-left border-r border-gray-200">Especificação Detalhada do Objeto</th>
                                                <th className="py-3 px-3 text-center border-r border-gray-200 w-16">U.M.</th>
                                                <th className="py-3 px-3 text-center border-r border-gray-200 w-16">Qtd.</th>
                                                <th className="py-3 px-4 text-right border-r border-gray-200 w-28">Val. Unitário</th>
                                                <th className="py-3 pr-3 text-right w-28">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-medium text-[10px] text-gray-900">
                                            {rows.map((item, idx) => (
                                                <tr key={item.id} className="align-top hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-2.5 px-3 text-center border-r border-gray-100 font-bold text-gray-400">{idx + 1}</td>
                                                    <td className="py-2.5 px-4 border-r border-gray-100 uppercase leading-snug font-bold">{item.description}</td>
                                                    <td className="py-2.5 px-3 text-center border-r border-gray-100 uppercase font-bold">{item.unit}</td>
                                                    <td className="py-2.5 px-3 text-center border-r border-gray-100 tabular-nums">{item.quantity}</td>
                                                    <td className="py-2.5 px-4 text-right border-r border-gray-100 tabular-nums">{item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    <td className="py-2.5 pr-3 text-right font-black tabular-nums">{item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-100 text-gray-950 font-black uppercase text-[11px] border-t-2 border-gray-950">
                                                <td colSpan={5} className="py-4 pr-6 text-right border-r border-gray-200">Valor Total da Proposta:</td>
                                                <td className="py-4 pr-3 text-right text-base tracking-tighter tabular-nums decoration-double underline underline-offset-4">{formatCurrency(totals.total)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* SIGNATURES (Enhanced 3-column layout) */}
                                <div className="pt-32 pb-8 grid grid-cols-3 gap-12 text-center uppercase tracking-tight">
                                    <div className="space-y-4">
                                        <div className="h-0.5 bg-gray-950 w-full mb-1"></div>
                                        <div>
                                            <p className="text-[10px] font-black leading-none text-gray-950 tracking-tighter">Assinatura Proponente</p>
                                            <p className="text-[7px] text-gray-400 font-bold mt-1">(Empresa / Fornecedor)</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-0.5 bg-gray-950 w-full mb-1"></div>
                                        <div>
                                            <p className="text-[10px] font-black leading-none text-gray-950 tracking-tighter">Diretor(a) Escolar</p>
                                            <p className="text-[7px] text-gray-400 font-bold mt-1">(Unidade Executora)</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-0.5 bg-gray-950 w-full mb-1"></div>
                                        <div>
                                            <p className="text-[10px] font-black leading-none text-gray-950 tracking-tighter">Tesoureiro(a) CDCE</p>
                                            <p className="text-[7px] text-gray-400 font-bold mt-1">(Conselho Deliberativo)</p>
                                        </div>
                                    </div>
                                </div>

                                <footer className="pt-10 flex justify-between items-center border-t border-gray-100 text-[8px] font-black text-gray-300 uppercase letter-widest tracking-[0.2em]">
                                    <span>Sistema Gerado em: {new Date().toLocaleDateString('pt-BR')}</span>
                                    <span>Página 1 de 1</span>
                                    <span>Portal de Gestão André Maggi</span>
                                </footer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetModule;
