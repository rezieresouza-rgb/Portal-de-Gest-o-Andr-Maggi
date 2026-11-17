import React, { useState, useRef, useMemo } from 'react';
import {
    Upload,
    FileSpreadsheet,
    Plus,
    Trash2,
    Download,
    Printer,
    Search,
    Eye,
    Edit3,
    Loader2,
    Settings,
    XCircle,
    Eraser,
    Building2,
    UserCircle2,
    FileText,
    CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '../components/Toast';
import { User } from '../types';

export interface BudgetRow {
    id: string;
    itemNumber?: string;
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
    const [rows, setRows] = useState<BudgetRow[]>([
        {
            id: '1',
            itemNumber: '01',
            description: '',
            unit: 'UN',
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            resource: 'RU'
        }
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterResource, setFilterResource] = useState<'ALL' | 'RU' | 'PDDE'>('ALL');
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [isPrinting, setIsPrinting] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Dados Oficiais do Cabeçalho SEDUC-MT / RU - RECURSO ÚNICO
    const [schoolInfo, setSchoolInfo] = useState({
        uf: 'MT',
        municipio: 'Colíder',
        pesquisaNumero: '01/2026',
        orgao: 'SEDUC/MT',
        escola: 'CDCE EE. ENS. FUND. ANDRE ANTONIO MAGGI',
        cnpjEscola: '11.906.357/0001-50',
        telefoneEscola: '(66) 99664-8410',
        enderecoEscola: 'Avenida Borba Gato, nº 80, Bairro Torre',
        responsavelEscola: 'Reziere de Souza',
        cargoResponsavelEscola: 'Presidente do CDCE / Diretor Escolar',
        dataLimiteResposta: '10 dias úteis',
        ano: new Date().getFullYear().toString()
    });

    // Condições Regulamentares do Modelo RU
    const [condicoesInfo, setCondicoesInfo] = useState({
        validadeDias: '30',
        criterioAvaliacao: 'Menor Preço por Item',
        prazoEntregaDias: '15',
        observacoes: ''
    });

    // Dados do Proponente / Fornecedor Cotado
    const [supplierInfo, setSupplierInfo] = useState({
        razaoSocial: '',
        cnpjCpf: '',
        inscricaoEstadual: '',
        enderecoComercial: '',
        telefoneFax: '',
        email: '',
        contaCorrente: '',
        agencia: '',
        banco: '',
        responsavelInfo: '',
        cargoResponsavel: '',
        data: new Date().toLocaleDateString('pt-BR')
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
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                const newRows: BudgetRow[] = [];

                // Verifica se é o formato oficial RU (procura linha de cabeçalho com QUADRO 1 ou Nº / Discriminação)
                let startRow = 1;
                for (let i = 0; i < Math.min(jsonData.length, 30); i++) {
                    const r = jsonData[i] || [];
                    const rowText = r.join(' ').toLowerCase();
                    if (rowText.includes('discrim') || rowText.includes('especifica') || rowText.includes('quadro 1')) {
                        startRow = i + 1;
                        break;
                    }
                }

                for (let i = startRow; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    const rowStr = row.join(' ').trim();
                    if (rowStr.toLowerCase().includes('preço total') || rowStr.toLowerCase().includes('serão atendidas')) {
                        break; // Fim do QUADRO 1
                    }

                    // Tenta mapear colunas do RU oficial ou formato simples
                    let desc = '';
                    let unit = 'UN';
                    let qty = 0;
                    let price = 0;

                    // Formato RU oficial: Col 1 = Nº, Col 2 = Descrição, Col 9 = Unid, Col 11 = Quant, Col 13 = Unitário
                    if (row[2] !== undefined && typeof row[2] === 'string' && row[2].trim().length > 1) {
                        desc = row[2]?.toString().trim();
                        unit = row[9]?.toString().trim() || row[8]?.toString().trim() || row[3]?.toString().trim() || 'UN';
                        qty = parseFloat(row[11] || row[10] || row[4]) || 1;
                        price = parseFloat(row[13] || row[12] || row[5]) || 0;
                    } else {
                        // Formato simples sequencial (Col 0: Desc, Col 1: Unid, Col 2: Qty, Col 3: Price)
                        desc = row[0]?.toString().trim() || row[1]?.toString().trim() || '';
                        unit = row[1]?.toString().trim() || row[2]?.toString().trim() || 'UN';
                        qty = parseFloat(row[2] || row[3]) || 1;
                        price = parseFloat(row[3] || row[4]) || 0;
                    }

                    if (desc && isNaN(Number(desc))) {
                        newRows.push({
                            id: Math.random().toString(36).substr(2, 9),
                            itemNumber: (newRows.length + 1).toString().padStart(2, '0'),
                            description: desc,
                            unit: unit || 'UN',
                            quantity: isNaN(qty) ? 1 : qty,
                            unitPrice: isNaN(price) ? 0 : price,
                            totalPrice: (isNaN(qty) ? 1 : qty) * (isNaN(price) ? 0 : price),
                            resource: 'RU'
                        });
                    }
                }

                if (newRows.length > 0) {
                    setRows(newRows);
                    addToast(`${newRows.length} itens importados no modelo RU!`, 'success');
                } else {
                    addToast("Nenhum item válido encontrado na planilha.", "warning");
                }
            } catch (error) {
                console.error(error);
                addToast("Erro ao processar planilha Excel.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleAddRow = () => {
        const nextNum = (rows.length + 1).toString().padStart(2, '0');
        const newRow: BudgetRow = {
            id: Math.random().toString(36).substr(2, 9),
            itemNumber: nextNum,
            description: '',
            unit: 'UN',
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            resource: 'RU'
        };
        setRows([...rows, newRow]);
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
        setRows(prev => prev.filter(row => row.id !== id).map((r, i) => ({
            ...r,
            itemNumber: (i + 1).toString().padStart(2, '0')
        })));
    };

    const handleClearAll = () => {
        if (confirm('Tem certeza que deseja apagar todos os itens da cotação?')) {
            setRows([]);
            addToast("Planilha limpa com sucesso.", "info");
        }
    };

    const formatCurrency = (value: number | undefined | null) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Exportação Oficial para Excel (.xlsx) no modelo exato RU - RECURSO ÚNICO
    const handleExportOfficialExcel = () => {
        try {
            const wb = XLSX.utils.book_new();
            const wsData: any[][] = [];

            // Linha 1: UF / Município / Pesquisa nº / SEDUC
            wsData.push(['1', 'UF', schoolInfo.uf, '2', 'Município', schoolInfo.municipio, '', '3', 'Pesquisa nº', schoolInfo.pesquisaNumero, '', '', '', 'SEDUC/MT']);
            wsData.push([]);
            // Linha 3: Escola / Telefone
            wsData.push(['4', 'Escola', '', `${schoolInfo.escola}\nCNPJ: ${schoolInfo.cnpjEscola}`, '', '', '', '', '', '5', 'Telefone', '', '', schoolInfo.telefoneEscola]);
            wsData.push([]);
            // Linha 5: Endereço
            wsData.push(['6', 'Endereço', '', schoolInfo.enderecoEscola]);
            wsData.push([]);
            // Linha 7: Responsável
            wsData.push(['7', 'Responsável', '', schoolInfo.responsavelEscola, '', '', '', '', '', '8', 'Assinatura', '', '', '']);
            wsData.push([]);
            // Linha 9: À
            wsData.push(['9', 'À', supplierInfo.razaoSocial || 'Fornecedor Proponente']);
            wsData.push([]);
            // Linha 11: Solicitamos
            wsData.push(['', 'Solicitamos informar até', '', '', '', schoolInfo.dataLimiteResposta, '', '', 'os preços para a relação discriminada abaixo']);
            wsData.push([]);
            // Linha 13: BENS, MATERIAIS ou SERVIÇOS
            wsData.push(['11', 'BENS, MATERIAIS ou SERVIÇOS']);
            // Linha 14: Cabeçalho QUADRO 1
            wsData.push(['QUADRO 1', '¹ Nº', '² Discriminação/Especificações Técnicas', '', '', '', '', '', '', '³ Unid.', '', '4 Quant.', '', '5 Preço Unitário do Item', '6 Preço Total do Item (R$)']);

            // Itens
            rows.forEach((r, idx) => {
                const num = (idx + 1).toString().padStart(2, '0');
                wsData.push(['', num, r.description, '', '', '', '', '', '', r.unit, '', r.quantity, '', r.unitPrice, r.totalPrice]);
            });

            // Linha Total
            wsData.push([]);
            wsData.push(['', '7 Preço Total (R$)', '', '', '', '', '', '', '', '', '', '', '', '', totals.total]);
            wsData.push([]);
            // Condições
            wsData.push(['', 'Serão atendidas as seguintes condições:']);
            wsData.push(['', 'a) Período de Validade da Proposta', '', '', '', `${condicoesInfo.validadeDias} dias`, '', '', '', 'a partir da sua apresentação;']);
            wsData.push([]);
            wsData.push(['', 'b) Critério de Avaliação das Propostas:', '', '', '', '', '', condicoesInfo.criterioAvaliacao]);
            wsData.push(['', 'c) Caso o critério estabelecido no item(b) for Menor Preço Global, todos os itens da planilha deverão ser cotados']);
            wsData.push(['', 'd) No caso de correção de erros aritméticos(Preço Unitário x Quantidade), prevalecerá o Preço Unitário do item e será corrigido o Preço total, sendo corrigido também o Preço Total da Proposta.']);
            wsData.push(['', 'e) O Prazo de entrega/execução de', '', '', '', `${condicoesInfo.prazoEntregaDias} dias`, '', '', 'a partir da emissão da Ordem de Compra/Serviço pela Unidade Executora']);
            wsData.push(['', 'f) Todos os impostos, taxas, despesas com frete, seguros e embalagens e demais despesas incidentes deverão estar inclusos']);
            wsData.push(['', 'g) O pagamento será efetuado num prazo máximo de 10 (dez) dias contados da apresentação das notas fiscais/faturas condicionadas à sua aprovação pela Unidade Executora.']);
            wsData.push(['', '15', 'Observações: ' + condicoesInfo.observacoes]);
            wsData.push([]);
            // Proponente
            wsData.push(['', '16', 'Razão Social/Nome:', supplierInfo.razaoSocial]);
            wsData.push(['', '17', 'CNPJ/CPF:', supplierInfo.cnpjCpf, '', '', '', '18', 'Inscrição Estadual:', supplierInfo.inscricaoEstadual]);
            wsData.push(['', '19', 'Endereço Comercial:', supplierInfo.enderecoComercial]);
            wsData.push(['', '20', 'Telefone/Fax:', supplierInfo.telefoneFax, '', '', '', '21', 'E-mail:', supplierInfo.email]);
            wsData.push(['', '22', 'Conta Corrente:', supplierInfo.contaCorrente, '', '23', 'Agência:', supplierInfo.agencia, '', '24', 'Banco:', supplierInfo.banco]);
            wsData.push(['', '25', 'Nome do Responsável pelas Informações:', supplierInfo.responsavelInfo]);
            wsData.push(['', '26', 'Cargo do Responsável pelas Informações:', supplierInfo.cargoResponsavel]);
            wsData.push(['', '27', 'Data:', supplierInfo.data, '', '', '', '28', 'Assinatura do Responsável:']);

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Orç. 1');

            const fileName = `RU_RECURSO_UNICO_${supplierInfo.razaoSocial ? supplierInfo.razaoSocial.replace(/\s+/g, '_') : 'COTACAO'}_${schoolInfo.ano}.xlsx`;
            XLSX.writeFile(wb, fileName);
            addToast("Planilha RU oficial exportada com sucesso!", "success");
        } catch (err) {
            console.error(err);
            addToast("Erro ao exportar planilha Excel.", "error");
        }
    };

    const handlePrint = async () => {
        setIsPrinting(true);
        const element = document.getElementById('budget-print-content');
        if (element) {
            try {
                // @ts-ignore
                if (window.html2pdf) {
                    // @ts-ignore
                    await window.html2pdf().set({
                        margin: [5, 5, 5, 5],
                        filename: `RU_RECURSO_UNICO_${supplierInfo.razaoSocial || 'COTACAO'}_${schoolInfo.ano}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    }).from(element).save();
                    addToast("PDF oficial gerado com sucesso!", "success");
                } else {
                    window.print();
                }
            } catch (error) {
                console.error(error);
                window.print();
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
            <div className="sticky top-4 z-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-900/90 p-4 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl no-print">
                <div className="flex items-center gap-3 pl-2">
                    <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                        <FileSpreadsheet className="text-emerald-400" size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black text-white uppercase tracking-tight leading-none">
                                Pesquisa de Preços - RU (Recurso Único)
                            </h2>
                            <span className="text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase">
                                Modelo SEDUC-MT
                            </span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">
                            Pesquisa nº <strong className="text-white">{schoolInfo.pesquisaNumero}</strong> • Ano {schoolInfo.ano}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-2 pr-1">
                    <button
                        onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'edit'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                            }`}
                    >
                        {viewMode === 'edit' ? <><Eye size={14} /> Visualizar Modelo RU (Oficial)</> : <><Edit3 size={14} /> Voltar p/ Edição</>}
                    </button>

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${showSettings ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'}`}
                        title="Dados do Cabeçalho e Fornecedor"
                    >
                        <Settings size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Dados do RU</span>
                    </button>

                    <button
                        onClick={handleExportOfficialExcel}
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        title="Exportar no formato oficial do Excel RU"
                    >
                        <Download size={14} /> Excel RU
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-1 hidden md:block"></div>

                    {viewMode === 'edit' ? (
                        <>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Upload size={14} /> Importar
                            </button>
                            <button
                                onClick={handleAddRow}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all font-mono"
                            >
                                <Plus size={14} /> NOVO ITEM
                            </button>
                            {rows.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all"
                                    title="Limpar Planilha"
                                >
                                    <Eraser size={16} />
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-950 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50"
                        >
                            {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                            Imprimir / Salvar PDF
                        </button>
                    )}
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />

            {/* Config & Supplier Drawer / Modal */}
            {showSettings && (
                <div className="bg-gray-900/95 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl animate-in slide-in-from-top duration-300 no-print shadow-2xl relative">
                    <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                        <XCircle size={24} />
                    </button>

                    <h3 className="text-base font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                        <Settings className="text-emerald-400" size={20} />
                        Parâmetros da Pesquisa de Preços (RU - Recurso Único SEDUC-MT)
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* 1. Unidade Executora / CDCE */}
                        <div className="space-y-4 bg-gray-950/40 p-5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                <Building2 className="text-emerald-400" size={16} />
                                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Unidade Executora / CDCE</h4>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Pesquisa nº</label>
                                    <input
                                        value={schoolInfo.pesquisaNumero}
                                        onChange={(e) => setSchoolInfo({ ...schoolInfo, pesquisaNumero: e.target.value })}
                                        className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="01/2026"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Escola / CDCE</label>
                                    <input
                                        value={schoolInfo.escola}
                                        onChange={(e) => setSchoolInfo({ ...schoolInfo, escola: e.target.value })}
                                        className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">CNPJ</label>
                                        <input
                                            value={schoolInfo.cnpjEscola}
                                            onChange={(e) => setSchoolInfo({ ...schoolInfo, cnpjEscola: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Telefone</label>
                                        <input
                                            value={schoolInfo.telefoneEscola}
                                            onChange={(e) => setSchoolInfo({ ...schoolInfo, telefoneEscola: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Responsável / Diretor</label>
                                    <input
                                        value={schoolInfo.responsavelEscola}
                                        onChange={(e) => setSchoolInfo({ ...schoolInfo, responsavelEscola: e.target.value })}
                                        className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Prazo Limite para Informar Preços</label>
                                    <input
                                        value={schoolInfo.dataLimiteResposta}
                                        onChange={(e) => setSchoolInfo({ ...schoolInfo, dataLimiteResposta: e.target.value })}
                                        className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Ex: 10 dias úteis"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Condições da Proposta (Itens a-g do RU) */}
                        <div className="space-y-4 bg-gray-950/40 p-5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                <FileText className="text-amber-400" size={16} />
                                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Condições Oficiais do Edital</h4>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Validade da Proposta (dias)</label>
                                    <input
                                        value={condicoesInfo.validadeDias}
                                        onChange={(e) => setCondicoesInfo({ ...condicoesInfo, validadeDias: e.target.value })}
                                        className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="30"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Critério de Avaliação</label>
                                    <select
                                        value={condicoesInfo.criterioAvaliacao}
                                        onChange={(e) => setCondicoesInfo({ ...condicoesInfo, criterioAvaliacao: e.target.value })}
                                        className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="Menor Preço por Item">Menor Preço por Item</option>
                                        <option value="Menor Preço Global">Menor Preço Global</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Prazo de Entrega/Execução (dias)</label>
                                    <input
                                        value={condicoesInfo.prazoEntregaDias}
                                        onChange={(e) => setCondicoesInfo({ ...condicoesInfo, prazoEntregaDias: e.target.value })}
                                        className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="15"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Observações (Item 15)</label>
                                    <textarea
                                        rows={3}
                                        value={condicoesInfo.observacoes}
                                        onChange={(e) => setCondicoesInfo({ ...condicoesInfo, observacoes: e.target.value })}
                                        className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                        placeholder="Observações complementares..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Dados do Proponente / Fornecedor (Itens 16-28 do RU) */}
                        <div className="space-y-4 bg-gray-950/40 p-5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                <UserCircle2 className="text-blue-400" size={16} />
                                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Dados do Proponente / Fornecedor</h4>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Razão Social / Nome da Empresa</label>
                                    <input
                                        value={supplierInfo.razaoSocial}
                                        onChange={(e) => setSupplierInfo({ ...supplierInfo, razaoSocial: e.target.value })}
                                        className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        placeholder="Nome da empresa..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">CNPJ / CPF</label>
                                        <input
                                            value={supplierInfo.cnpjCpf}
                                            onChange={(e) => setSupplierInfo({ ...supplierInfo, cnpjCpf: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="00.000.000/0000-00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Inscrição Estadual</label>
                                        <input
                                            value={supplierInfo.inscricaoEstadual}
                                            onChange={(e) => setSupplierInfo({ ...supplierInfo, inscricaoEstadual: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Isento ou Nº"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Endereço Comercial</label>
                                    <input
                                        value={supplierInfo.enderecoComercial}
                                        onChange={(e) => setSupplierInfo({ ...supplierInfo, enderecoComercial: e.target.value })}
                                        className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Telefone / Celular</label>
                                        <input
                                            value={supplierInfo.telefoneFax}
                                            onChange={(e) => setSupplierInfo({ ...supplierInfo, telefoneFax: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">E-mail</label>
                                        <input
                                            value={supplierInfo.email}
                                            onChange={(e) => setSupplierInfo({ ...supplierInfo, email: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Banco</label>
                                        <input
                                            value={supplierInfo.banco}
                                            onChange={(e) => setSupplierInfo({ ...supplierInfo, banco: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ex: BB"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Agência</label>
                                        <input
                                            value={supplierInfo.agencia}
                                            onChange={(e) => setSupplierInfo({ ...supplierInfo, agencia: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">C/C</label>
                                        <input
                                            value={supplierInfo.contaCorrente}
                                            onChange={(e) => setSupplierInfo({ ...supplierInfo, contaCorrente: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Responsável</label>
                                        <input
                                            value={supplierInfo.responsavelInfo}
                                            onChange={(e) => setSupplierInfo({ ...supplierInfo, responsavelInfo: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cargo</label>
                                        <input
                                            value={supplierInfo.cargoResponsavel}
                                            onChange={(e) => setSupplierInfo({ ...supplierInfo, cargoResponsavel: e.target.value })}
                                            className="w-full p-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
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
                                    Total da Cotação RU
                                </p>
                                <p className="text-3xl font-black text-white font-mono tracking-tighter tabular-nums">{formatCurrency(totals.total)}</p>
                                <p className="text-[10px] text-gray-400 mt-2 font-medium">{rows.length} itens discriminados</p>
                            </div>
                            <div className="bg-blue-600/5 p-6 rounded-[2rem] border border-blue-500/10 relative overflow-hidden group">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Alocado em RU (Recurso Único)
                                </p>
                                <p className="text-3xl font-black text-blue-400 font-mono tracking-tighter tabular-nums">{formatCurrency(totals.ru)}</p>
                                <p className="text-[10px] text-blue-300/60 mt-2 font-medium">Recurso Estadual Direto</p>
                            </div>
                            <div className="bg-emerald-600/5 p-6 rounded-[2rem] border border-emerald-500/10 relative overflow-hidden group">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Alocado em PDDE
                                </p>
                                <p className="text-3xl font-black text-emerald-400 font-mono tracking-tighter tabular-nums">{formatCurrency(totals.pdde)}</p>
                                <p className="text-[10px] text-emerald-300/60 mt-2 font-medium">Recurso Federal FNDE</p>
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
                                    placeholder="Procurar item ou especificação técnica..."
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

                        {/* Spreadsheet Table (QUADRO 1) */}
                        <div className="bg-gray-800/20 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse table-fixed min-w-[1050px]">
                                    <thead>
                                        <tr className="bg-gray-950/60 border-b border-white/5">
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center w-14">¹ Nº</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">² Discriminação / Especificações Técnicas (QUADRO 1)</th>
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center w-28">³ Unid.</th>
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right w-24">4 Quant.</th>
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right w-44">5 Preço Unitário</th>
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right w-44">6 Preço Total (R$)</th>
                                            <th className="px-4 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center w-36">Fonte</th>
                                            <th className="px-4 py-5 w-14"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredRows.map((row, idx) => (
                                            <tr key={row.id} className="hover:bg-white/[0.03] transition-all group/row">
                                                <td className="px-4 py-4 text-center font-mono font-bold text-gray-400 text-xs">
                                                    {row.itemNumber || (idx + 1).toString().padStart(2, '0')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <textarea
                                                        rows={1}
                                                        value={row.description}
                                                        onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                                                        className="w-full bg-transparent border-none text-white focus:ring-0 p-0 text-sm font-bold resize-none min-h-[1.5rem] placeholder:text-gray-700 transition-all leading-tight"
                                                        placeholder="Ex: Aquisição de resma de papel A4 75g branca 500 folhas..."
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
                                                        className="w-full bg-gray-950/40 border border-transparent group-hover/row:border-white/10 rounded-xl text-white/70 focus:text-white focus:border-emerald-500/50 py-1.5 text-center uppercase font-black text-[10px] outline-none transition-all"
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
                                                    <div className="flex items-center gap-1.5 bg-gray-950/40 border border-transparent group-hover/row:border-white/10 rounded-xl px-3 py-1.5 transition-all focus-within:ring-2 focus-within:ring-emerald-500/30">
                                                        <span className="text-[10px] font-black text-gray-500">R$</span>
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
                                                        <option value="RU" className="bg-gray-900 text-white">RU (Recurso Único)</option>
                                                        <option value="PDDE" className="bg-gray-900 text-white">PDDE</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <button
                                                        onClick={() => handleRemoveRow(row.id)}
                                                        className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover/row:opacity-100"
                                                        title="Remover item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredRows.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-28 text-center">
                                                    <div className="flex flex-col items-center gap-4 text-gray-600 font-mono">
                                                        <div className="p-6 bg-white/5 rounded-full border border-white/5 shadow-inner">
                                                            <Building2 size={56} className="opacity-20 rotate-12" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-black uppercase tracking-widest text-white/60">Cotação Vazia</p>
                                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Importe o arquivo RU ou adicione itens manualmente</p>
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

                {/* ---------------- PREVIEW VIEW (MODELO EXATO RU - RECURSO ÚNICO SEDUC-MT) ---------------- */}
                {viewMode === 'preview' && (
                    <div className="w-full flex justify-center animate-in zoom-in-95 duration-500 ease-out p-4 sm:p-8 bg-gray-950/40 rounded-[3rem] border border-white/5">
                        <div id="budget-print-content" className="w-[210mm] min-h-[297mm] bg-white text-gray-950 p-[12mm] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative font-sans text-xs leading-normal">
                            
                            {/* TABELA DE CABEÇALHO OFICIAL RU */}
                            <table className="w-full border-collapse border-2 border-black text-[11px] mb-2">
                                <tbody>
                                    <tr className="border-b border-black">
                                        <td className="w-10 text-center font-bold bg-gray-100 border-r border-black p-1">1</td>
                                        <td className="w-12 font-bold p-1">UF:</td>
                                        <td className="w-16 font-bold border-r border-black p-1">{schoolInfo.uf}</td>
                                        <td className="w-10 text-center font-bold bg-gray-100 border-r border-black p-1">2</td>
                                        <td className="w-20 font-bold p-1">Município:</td>
                                        <td className="font-bold border-r border-black p-1">{schoolInfo.municipio}</td>
                                        <td className="w-10 text-center font-bold bg-gray-100 border-r border-black p-1">3</td>
                                        <td className="w-24 font-bold p-1">Pesquisa nº:</td>
                                        <td className="w-28 font-bold border-r border-black p-1">{schoolInfo.pesquisaNumero}</td>
                                        <td className="w-24 text-center font-black bg-gray-100 p-1">{schoolInfo.orgao}</td>
                                    </tr>
                                    <tr className="border-b border-black">
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">4</td>
                                        <td className="font-bold p-1">Escola:</td>
                                        <td colSpan={4} className="font-bold border-r border-black p-1 leading-tight">
                                            {schoolInfo.escola}<br />
                                            <span className="font-mono text-[10px]">CNPJ: {schoolInfo.cnpjEscola}</span>
                                        </td>
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">5</td>
                                        <td className="font-bold p-1">Telefone:</td>
                                        <td colSpan={2} className="font-bold p-1">{schoolInfo.telefoneEscola}</td>
                                    </tr>
                                    <tr className="border-b border-black">
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">6</td>
                                        <td className="font-bold p-1">Endereço:</td>
                                        <td colSpan={8} className="font-bold p-1">{schoolInfo.enderecoEscola}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">7</td>
                                        <td className="font-bold p-1">Responsável:</td>
                                        <td colSpan={4} className="font-bold border-r border-black p-1">{schoolInfo.responsavelEscola}</td>
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">8</td>
                                        <td className="font-bold p-1">Assinatura:</td>
                                        <td colSpan={2} className="p-1"></td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* DESTINATÁRIO / SOLICITAÇÃO */}
                            <table className="w-full border-collapse border-2 border-black text-[11px] mb-2">
                                <tbody>
                                    <tr className="border-b border-black">
                                        <td className="w-10 text-center font-bold bg-gray-100 border-r border-black p-1">9</td>
                                        <td className="w-10 font-bold p-1">À:</td>
                                        <td className="font-bold p-1 text-sm uppercase">{supplierInfo.razaoSocial || '________________________________________________'}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="p-1.5 text-center">
                                            Solicitamos informar até <strong className="underline mx-1">{schoolInfo.dataLimiteResposta}</strong> os preços para a relação discriminada abaixo:
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* QUADRO 1 - BENS, MATERIAIS ou SERVIÇOS */}
                            <div className="border-2 border-black mb-2">
                                <div className="bg-gray-100 border-b border-black font-black text-center py-1 text-[11px] tracking-wider uppercase">
                                    QUADRO 1 — BENS, MATERIAIS ou SERVIÇOS
                                </div>
                                <table className="w-full border-collapse text-[10px]">
                                    <thead>
                                        <tr className="border-b border-black bg-gray-50 font-bold text-center">
                                            <th className="border-r border-black py-1 px-1 w-10">¹ Nº</th>
                                            <th className="border-r border-black py-1 px-2 text-left">² Discriminação / Especificações Técnicas</th>
                                            <th className="border-r border-black py-1 px-1 w-16">³ Unid.</th>
                                            <th className="border-r border-black py-1 px-1 w-16">4 Quant.</th>
                                            <th className="border-r border-black py-1 px-2 text-right w-28">5 Preço Unitário</th>
                                            <th className="py-1 px-2 text-right w-28">6 Preço Total (R$)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {rows.map((item, idx) => (
                                            <tr key={item.id} className="align-top">
                                                <td className="border-r border-black py-1 px-1 text-center font-bold">{item.itemNumber || (idx + 1).toString().padStart(2, '0')}</td>
                                                <td className="border-r border-black py-1 px-2 font-medium leading-tight">{item.description}</td>
                                                <td className="border-r border-black py-1 px-1 text-center font-bold uppercase">{item.unit}</td>
                                                <td className="border-r border-black py-1 px-1 text-center font-bold">{item.quantity}</td>
                                                <td className="border-r border-black py-1 px-2 text-right font-mono">{(item.unitPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td className="py-1 px-2 text-right font-bold font-mono">{(item.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-black bg-gray-100 font-bold text-[11px]">
                                            <td colSpan={5} className="py-1.5 px-3 text-right border-r border-black uppercase">7 Preço Total (R$):</td>
                                            <td className="py-1.5 px-2 text-right font-black font-mono text-xs">{formatCurrency(totals.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* CONDIÇÕES REGULAMENTARES (a até g) */}
                            <div className="border-2 border-black p-2 text-[9.5px] leading-tight mb-2 bg-white">
                                <p className="font-bold mb-1">Serão atendidas as seguintes condições:</p>
                                <p className="mb-0.5"><strong>a)</strong> Período de Validade da Proposta: <span className="underline font-bold">{condicoesInfo.validadeDias} dias</span> a partir da sua apresentação;</p>
                                <p className="mb-0.5"><strong>b)</strong> Critério de Avaliação das Propostas: <span className="underline font-bold">{condicoesInfo.criterioAvaliacao}</span>;</p>
                                <p className="mb-0.5"><strong>c)</strong> Caso o critério estabelecido no item (b) for Menor Preço Global, todos os itens da planilha deverão ser cotados;</p>
                                <p className="mb-0.5"><strong>d)</strong> No caso de correção de erros aritméticos (Preço Unitário x Quantidade), prevalecerá o Preço Unitário do item e será corrigido o Preço total, sendo corrigido também o Preço Total da Proposta;</p>
                                <p className="mb-0.5"><strong>e)</strong> O Prazo de entrega/execução de <span className="underline font-bold">{condicoesInfo.prazoEntregaDias} dias</span> a partir da emissão da Ordem de Compra/Serviço pela Unidade Executora;</p>
                                <p className="mb-0.5"><strong>f)</strong> Todos os impostos, taxas, despesas com frete, seguros e embalagens e demais despesas incidentes deverão estar inclusos;</p>
                                <p className="mb-1"><strong>g)</strong> O pagamento será efetuado num prazo máximo de 10 (dez) dias contados da apresentação das notas fiscais/faturas condicionadas à sua aprovação pela Unidade Executora.</p>
                                <p className="border-t border-gray-300 pt-1">
                                    <strong>15 Observações:</strong> {condicoesInfo.observacoes || 'Nenhuma.'}
                                </p>
                            </div>

                            {/* QUADRO DO PROPONENTE / FORNECEDOR (16 a 28) */}
                            <table className="w-full border-collapse border-2 border-black text-[10px]">
                                <tbody>
                                    <tr className="border-b border-black">
                                        <td className="w-8 text-center font-bold bg-gray-100 border-r border-black p-1">16</td>
                                        <td className="w-32 font-bold p-1">Razão Social/Nome:</td>
                                        <td colSpan={6} className="font-bold p-1 uppercase">{supplierInfo.razaoSocial || '________________________________________'}</td>
                                    </tr>
                                    <tr className="border-b border-black">
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">17</td>
                                        <td className="font-bold p-1">CNPJ/CPF:</td>
                                        <td className="font-mono font-bold border-r border-black p-1">{supplierInfo.cnpjCpf}</td>
                                        <td className="w-8 text-center font-bold bg-gray-100 border-r border-black p-1">18</td>
                                        <td className="w-28 font-bold p-1">Inscrição Estadual:</td>
                                        <td colSpan={3} className="font-bold p-1">{supplierInfo.inscricaoEstadual}</td>
                                    </tr>
                                    <tr className="border-b border-black">
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">19</td>
                                        <td className="font-bold p-1">Endereço Comercial:</td>
                                        <td colSpan={6} className="p-1">{supplierInfo.enderecoComercial}</td>
                                    </tr>
                                    <tr className="border-b border-black">
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">20</td>
                                        <td className="font-bold p-1">Telefone/Fax:</td>
                                        <td className="border-r border-black p-1">{supplierInfo.telefoneFax}</td>
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">21</td>
                                        <td className="font-bold p-1">E-mail:</td>
                                        <td colSpan={3} className="p-1">{supplierInfo.email}</td>
                                    </tr>
                                    <tr className="border-b border-black">
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">22</td>
                                        <td className="font-bold p-1">Conta Corrente:</td>
                                        <td className="border-r border-black p-1">{supplierInfo.contaCorrente}</td>
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">23</td>
                                        <td className="font-bold p-1">Agência:</td>
                                        <td className="border-r border-black p-1">{supplierInfo.agencia}</td>
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">24</td>
                                        <td className="font-bold p-1">Banco: {supplierInfo.banco}</td>
                                    </tr>
                                    <tr className="border-b border-black">
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">25</td>
                                        <td colSpan={2} className="font-bold p-1">Nome do Responsável: <span className="font-normal">{supplierInfo.responsavelInfo}</span></td>
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">26</td>
                                        <td colSpan={4} className="font-bold p-1">Cargo: <span className="font-normal">{supplierInfo.cargoResponsavel}</span></td>
                                    </tr>
                                    <tr>
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">27</td>
                                        <td className="font-bold p-1">Data:</td>
                                        <td className="border-r border-black p-1">{supplierInfo.data}</td>
                                        <td className="text-center font-bold bg-gray-100 border-r border-black p-1">28</td>
                                        <td className="font-bold p-1">Assinatura do Responsável:</td>
                                        <td colSpan={3} className="p-1"></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="mt-4 pt-2 border-t border-gray-200 text-center text-[8px] text-gray-400 uppercase tracking-widest print:block">
                                Documento Padronizado SEDUC-MT • Recurso Único (RU) • {schoolInfo.escola}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetModule;
