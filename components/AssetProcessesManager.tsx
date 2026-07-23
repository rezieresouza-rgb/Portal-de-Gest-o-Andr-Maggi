import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  FileDown,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Calendar,
  Building2,
  Tag,
  User,
  ArrowRightLeft,
  DollarSign,
  PackageCheck,
  Filter,
  RefreshCw,
  X,
  Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from './Toast';

export interface GeneralProcess {
  id: string;
  processo: string;
  dataEntrada: string;
  dataAtual: string;
  diasNoSetor: number;
  setorOrigem: string;
  assunto: string;
  objeto: string;
  unidade: string;
  responsavel: string;
  dataSaida?: string;
  setorDestino?: string;
  observacao?: string;
  quemLancou: string;
  status: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'PENDENTE' | 'CANCELADO';
}

export interface InvoiceProcess {
  id: string;
  numero: number | string;
  dre: string;
  municipio: string;
  codLotacao: string;
  unidadeEscolar: string;
  sigadoc: string;
  dataEnvio: string;
  status: 'PENDENTE' | 'EM_TRAMITE' | 'APROVADO' | 'ARQUIVADO';
  observacoes?: string;
}

export interface DisposalProcess {
  id: string;
  processo: string;
  categoria: string;
  grupo: string;
  unidade: string;
  municipio: string;
  dre: string;
  destino: string;
  quantidadeItens: number;
  valor: number;
  status: 'PENDENTE' | 'EM_TRAMITE' | 'CONCLUIDO' | 'RECOLHIDO';
  dataTramite: string;
  observacao?: string;
  recolhimento: string;
  dataOrdemServico?: string;
  dataRecolhimento?: string;
}

interface AssetProcessesManagerProps {
  user?: any;
}

const INITIAL_GENERAL_PROCESSES: GeneralProcess[] = [
  {
    id: 'gp-1',
    processo: 'SEDUC-PRO-2026/00142',
    dataEntrada: '2026-02-10',
    dataAtual: new Date().toISOString().split('T')[0],
    diasNoSetor: 12,
    setorOrigem: 'DRE-SINOP',
    assunto: 'AQS - Aquisição de Equipamentos de Climatização',
    objeto: 'Aquisição de 10 Aparelhos de Ar Condicionado 30.000 BTUs para salas de aula',
    unidade: 'EE ANDRÉ ANTONIO MAGGI',
    responsavel: 'GESTOR ANDRÉ MAGGI',
    dataSaida: '',
    setorDestino: 'COPM/SEDUC',
    observacao: 'Aguardando validação da dotação orçamentária pela SEDUC-MT',
    quemLancou: 'Secretaria Escolar',
    status: 'EM_ANDAMENTO'
  },
  {
    id: 'gp-2',
    processo: 'SEDUC-PRO-2026/00289',
    dataEntrada: '2026-03-01',
    dataAtual: new Date().toISOString().split('T')[0],
    diasNoSetor: 5,
    setorOrigem: 'EE ANDRÉ ANTONIO MAGGI',
    assunto: 'SOLICITAÇÃO DE MOBILIÁRIO',
    objeto: 'Solicitação de 60 Conjuntos de Carteira e Cadeira de Aluno modelo FDE-04',
    unidade: 'EE ANDRÉ ANTONIO MAGGI',
    responsavel: 'COORDENAÇÃO PATRIMONIAL',
    dataSaida: '',
    setorDestino: 'DRE-SINOP',
    observacao: 'Encaminhado via SIGADOC para atendimento do remanejamento de turmas',
    quemLancou: 'Gestor Administrativo',
    status: 'EM_ANDAMENTO'
  },
  {
    id: 'gp-3',
    processo: 'SEDUC-PRO-2026/00085',
    dataEntrada: '2026-01-15',
    dataAtual: '2026-02-28',
    diasNoSetor: 44,
    setorOrigem: 'COMISSÃO DE INVENTÁRIO',
    assunto: 'INVENTÁRIO ANUAL',
    objeto: 'Relatório Final e Conciliação do Inventário Físico Patrimonial Anual 2025/2026',
    unidade: 'EE ANDRÉ ANTONIO MAGGI',
    responsavel: 'PRESIDENTE DA COMISSÃO',
    dataSaida: '2026-02-28',
    setorDestino: 'SEDUC/COPM',
    observacao: 'Processo concluído e homologado pela comissão avaliadora com Laudo de Inservibilidade',
    quemLancou: 'Comissão Inventariante',
    status: 'CONCLUIDO'
  }
];

const INITIAL_INVOICE_PROCESSES: InvoiceProcess[] = [
  {
    id: 'ip-1',
    numero: 1,
    dre: 'DRE - SINOP',
    municipio: 'SINOP',
    codLotacao: '2505506',
    unidadeEscolar: 'EE ANDRÉ ANTONIO MAGGI',
    sigadoc: 'SEDUC-NF-2026/08912',
    dataEnvio: '2026-02-20',
    status: 'EM_TRAMITE',
    observacoes: 'Envio de 03 Notas Fiscais relativas aos Nobreaks da Sala de Informática'
  },
  {
    id: 'ip-2',
    numero: 2,
    dre: 'DRE - SINOP',
    municipio: 'SINOP',
    codLotacao: '2505506',
    unidadeEscolar: 'EE ANDRÉ ANTONIO MAGGI',
    sigadoc: 'SEDUC-NF-2026/04310',
    dataEnvio: '2026-01-18',
    status: 'APROVADO',
    observacoes: 'Incorporação tombada com sucesso na Carga Patrimonial Unificada'
  }
];

const INITIAL_DISPOSAL_PROCESSES: DisposalProcess[] = [
  {
    id: 'dp-1',
    processo: 'SEDUC-DES-2026/00044',
    categoria: 'SUCATA / INSERVÍVEL',
    grupo: 'MOBILIÁRIO ESCOLAR',
    unidade: 'EE ANDRÉ ANTONIO MAGGI',
    municipio: 'SINOP',
    dre: 'DRE - SINOP',
    destino: 'RECOLHIMENTO DRE',
    quantidadeItens: 45,
    valor: 8750.00,
    status: 'EM_TRAMITE',
    dataTramite: '2026-03-05',
    observacao: 'Carteiras danificadas e armários de aço irrecuperáveis após Laudo da Comissão',
    recolhimento: 'AGUARDANDO ORDEM DE SERVIÇO',
    dataOrdemServico: '2026-03-10',
    dataRecolhimento: ''
  }
];

export const AssetProcessesManager: React.FC<AssetProcessesManagerProps> = ({ user }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'geral' | 'nota_fiscal' | 'desfazimento'>('geral');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Data States
  const [generalProcesses, setGeneralProcesses] = useState<GeneralProcess[]>(() => {
    const saved = localStorage.getItem('portal_patrimonio_proc_gerais_v1');
    return saved ? JSON.parse(saved) : INITIAL_GENERAL_PROCESSES;
  });

  const [invoiceProcesses, setInvoiceProcesses] = useState<InvoiceProcess[]>(() => {
    const saved = localStorage.getItem('portal_patrimonio_proc_nf_v1');
    return saved ? JSON.parse(saved) : INITIAL_INVOICE_PROCESSES;
  });

  const [disposalProcesses, setDisposalProcesses] = useState<DisposalProcess[]>(() => {
    const saved = localStorage.getItem('portal_patrimonio_proc_desf_v1');
    return saved ? JSON.parse(saved) : INITIAL_DISPOSAL_PROCESSES;
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'geral' | 'nota_fiscal' | 'desfazimento'; data?: any } | null>(null);

  // Form States for General
  const [formGeral, setFormGeral] = useState<Partial<GeneralProcess>>({
    processo: '',
    dataEntrada: new Date().toISOString().split('T')[0],
    dataAtual: new Date().toISOString().split('T')[0],
    diasNoSetor: 0,
    setorOrigem: 'EE ANDRÉ ANTONIO MAGGI',
    assunto: 'SOLICITAÇÃO DE MOBILIÁRIO',
    objeto: '',
    unidade: 'EE ANDRÉ ANTONIO MAGGI',
    responsavel: user?.name || 'GESTOR ANDRÉ MAGGI',
    dataSaida: '',
    setorDestino: '',
    observacao: '',
    quemLancou: user?.name || 'Secretaria Escolar',
    status: 'EM_ANDAMENTO'
  });

  // Form States for Invoice
  const [formNF, setFormNF] = useState<Partial<InvoiceProcess>>({
    numero: '',
    dre: 'DRE - SINOP',
    municipio: 'SINOP',
    codLotacao: '2505506',
    unidadeEscolar: 'EE ANDRÉ ANTONIO MAGGI',
    sigadoc: '',
    dataEnvio: new Date().toISOString().split('T')[0],
    status: 'EM_TRAMITE',
    observacoes: ''
  });

  // Form States for Disposal
  const [formDesfazimento, setFormDesfazimento] = useState<Partial<DisposalProcess>>({
    processo: '',
    categoria: 'SUCATA / INSERVÍVEL',
    grupo: 'MOBILIÁRIO ESCOLAR',
    unidade: 'EE ANDRÉ ANTONIO MAGGI',
    municipio: 'SINOP',
    dre: 'DRE - SINOP',
    destino: 'RECOLHIMENTO DRE',
    quantidadeItens: 1,
    valor: 0,
    status: 'EM_TRAMITE',
    dataTramite: new Date().toISOString().split('T')[0],
    observacao: '',
    recolhimento: 'PENDENTE',
    dataOrdemServico: '',
    dataRecolhimento: ''
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('portal_patrimonio_proc_gerais_v1', JSON.stringify(generalProcesses));
  }, [generalProcesses]);

  useEffect(() => {
    localStorage.setItem('portal_patrimonio_proc_nf_v1', JSON.stringify(invoiceProcesses));
  }, [invoiceProcesses]);

  useEffect(() => {
    localStorage.setItem('portal_patrimonio_proc_desf_v1', JSON.stringify(disposalProcesses));
  }, [disposalProcesses]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const totalGerais = generalProcesses.length;
    const geraisEmAndamento = generalProcesses.filter(p => p.status === 'EM_ANDAMENTO').length;
    const totalNF = invoiceProcesses.length;
    const nfTramite = invoiceProcesses.filter(p => p.status === 'EM_TRAMITE').length;
    const totalDesf = disposalProcesses.length;
    const valorTotalDesf = disposalProcesses.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const itensDesf = disposalProcesses.reduce((acc, curr) => acc + (Number(curr.quantidadeItens) || 0), 0);

    return { totalGerais, geraisEmAndamento, totalNF, nfTramite, totalDesf, valorTotalDesf, itensDesf };
  }, [generalProcesses, invoiceProcesses, disposalProcesses]);

  // Filtered Items
  const filteredGerais = useMemo(() => {
    return generalProcesses.filter(p => {
      const matchSearch = p.processo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.assunto.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.objeto.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.responsavel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [generalProcesses, searchQuery, statusFilter]);

  const filteredNF = useMemo(() => {
    return invoiceProcesses.filter(p => {
      const matchSearch = p.sigadoc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.unidadeEscolar.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.observacoes && p.observacoes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoiceProcesses, searchQuery, statusFilter]);

  const filteredDesfazimento = useMemo(() => {
    return disposalProcesses.filter(p => {
      const matchSearch = p.processo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.grupo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.destino.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [disposalProcesses, searchQuery, statusFilter]);

  // Handlers for Add/Edit
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (type: 'geral' | 'nota_fiscal' | 'desfazimento', item: any) => {
    setEditingItem({ type, data: item });
    if (type === 'geral') setFormGeral(item);
    if (type === 'nota_fiscal') setFormNF(item);
    if (type === 'desfazimento') setFormDesfazimento(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (type: 'geral' | 'nota_fiscal' | 'desfazimento', id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este processo patrimonial?')) return;

    if (type === 'geral') {
      setGeneralProcesses(prev => prev.filter(item => item.id !== id));
    } else if (type === 'nota_fiscal') {
      setInvoiceProcesses(prev => prev.filter(item => item.id !== id));
    } else if (type === 'desfazimento') {
      setDisposalProcesses(prev => prev.filter(item => item.id !== id));
    }
    addToast('Processo removido com sucesso!', 'success');
  };

  const handleSaveProcess = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetType = editingItem ? editingItem.type : activeTab;

      if (targetType === 'geral') {
        if (!formGeral.processo || !formGeral.assunto) {
          addToast('Preencha o número do processo e o assunto!', 'warning');
          return;
        }
        if (editingItem?.data?.id) {
          setGeneralProcesses(prev => prev.map(p => p.id === editingItem.data.id ? { ...p, ...formGeral } as GeneralProcess : p));
          addToast('Processo Geral atualizado com sucesso!', 'success');
        } else {
          const newItem: GeneralProcess = {
            id: `gp-${Date.now()}`,
            processo: formGeral.processo || '',
            dataEntrada: formGeral.dataEntrada || new Date().toISOString().split('T')[0],
            dataAtual: new Date().toISOString().split('T')[0],
            diasNoSetor: Number(formGeral.diasNoSetor) || 0,
            setorOrigem: formGeral.setorOrigem || 'EE ANDRÉ ANTONIO MAGGI',
            assunto: formGeral.assunto || '',
            objeto: formGeral.objeto || '',
            unidade: formGeral.unidade || 'EE ANDRÉ ANTONIO MAGGI',
            responsavel: formGeral.responsavel || (user?.name || 'GESTOR ANDRÉ MAGGI'),
            dataSaida: formGeral.dataSaida || '',
            setorDestino: formGeral.setorDestino || '',
            observacao: formGeral.observacao || '',
            quemLancou: user?.name || 'Secretaria Escolar',
            status: formGeral.status || 'EM_ANDAMENTO'
          };
          setGeneralProcesses(prev => [newItem, ...prev]);
          addToast('Novo Processo Geral cadastrado!', 'success');
        }
      } else if (targetType === 'nota_fiscal') {
        if (!formNF.sigadoc) {
          addToast('Preencha o Nº SIGADOC da Nota Fiscal!', 'warning');
          return;
        }
        if (editingItem?.data?.id) {
          setInvoiceProcesses(prev => prev.map(p => p.id === editingItem.data.id ? { ...p, ...formNF } as InvoiceProcess : p));
          addToast('Processo de Nota Fiscal atualizado!', 'success');
        } else {
          const newItem: InvoiceProcess = {
            id: `ip-${Date.now()}`,
            numero: formNF.numero || invoiceProcesses.length + 1,
            dre: formNF.dre || 'DRE - SINOP',
            municipio: formNF.municipio || 'SINOP',
            codLotacao: formNF.codLotacao || '2505506',
            unidadeEscolar: formNF.unidadeEscolar || 'EE ANDRÉ ANTONIO MAGGI',
            sigadoc: formNF.sigadoc || '',
            dataEnvio: formNF.dataEnvio || new Date().toISOString().split('T')[0],
            status: formNF.status || 'EM_TRAMITE',
            observacoes: formNF.observacoes || ''
          };
          setInvoiceProcesses(prev => [newItem, ...prev]);
          addToast('Novo Processo de Nota Fiscal registrado!', 'success');
        }
      } else if (targetType === 'desfazimento') {
        if (!formDesfazimento.processo || !formDesfazimento.categoria) {
          addToast('Preencha o número do processo e a categoria de desfazimento!', 'warning');
          return;
        }
        if (editingItem?.data?.id) {
          setDisposalProcesses(prev => prev.map(p => p.id === editingItem.data.id ? { ...p, ...formDesfazimento } as DisposalProcess : p));
          addToast('Processo de Desfazimento atualizado!', 'success');
        } else {
          const newItem: DisposalProcess = {
            id: `dp-${Date.now()}`,
            processo: formDesfazimento.processo || '',
            categoria: formDesfazimento.categoria || 'SUCATA / INSERVÍVEL',
            grupo: formDesfazimento.grupo || 'MOBILIÁRIO ESCOLAR',
            unidade: formDesfazimento.unidade || 'EE ANDRÉ ANTONIO MAGGI',
            municipio: formDesfazimento.municipio || 'SINOP',
            dre: formDesfazimento.dre || 'DRE - SINOP',
            destino: formDesfazimento.destino || 'RECOLHIMENTO DRE',
            quantidadeItens: Number(formDesfazimento.quantidadeItens) || 1,
            valor: Number(formDesfazimento.valor) || 0,
            status: formDesfazimento.status || 'EM_TRAMITE',
            dataTramite: formDesfazimento.dataTramite || new Date().toISOString().split('T')[0],
            observacao: formDesfazimento.observacao || '',
            recolhimento: formDesfazimento.recolhimento || 'PENDENTE',
            dataOrdemServico: formDesfazimento.dataOrdemServico || '',
            dataRecolhimento: formDesfazimento.dataRecolhimento || ''
          };
          setDisposalProcesses(prev => [newItem, ...prev]);
          addToast('Novo Processo de Desfazimento cadastrado!', 'success');
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      addToast('Erro ao salvar processo: ' + err.message, 'error');
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Processos Gerais
      const wsGeraisData = generalProcesses.map(p => ({
        'PROCESSOS': p.processo,
        'DATA DE ENTRADA': p.dataEntrada,
        'DATA ATUAL': p.dataAtual,
        'DIAS NO SETOR': p.diasNoSetor,
        'SETOR ORIGEM': p.setorOrigem,
        'ASSUNTO': p.assunto,
        'OBJETO': p.objeto,
        'UNIDADE': p.unidade,
        'RESPONSÁVEL': p.responsavel,
        'DATA DE SAÍDA': p.dataSaida || '',
        'SETOR DESTINO': p.setorDestino || '',
        'OBSERVAÇÃO': p.observacao || '',
        'Nome de quem lançou': p.quemLancou
      }));
      const wsGerais = XLSX.utils.json_to_sheet(wsGeraisData);
      XLSX.utils.book_append_sheet(wb, wsGerais, 'PROCESSOS GERAIS');

      // Sheet 2: Notas Fiscais
      const wsNFData = invoiceProcesses.map(p => ({
        'N°': p.numero,
        'DRE': p.dre,
        'MUNICÍPIO': p.municipio,
        'COD.LOTAÇÃO': p.codLotacao,
        'UNIDADE ESCOLAR': p.unidadeEscolar,
        'N° SIGADOC': p.sigadoc,
        'DATA ENVIO': p.dataEnvio,
        'STATUS': p.status,
        'OBSERVAÇÕES': p.observacoes || ''
      }));
      const wsNF = XLSX.utils.json_to_sheet(wsNFData);
      XLSX.utils.book_append_sheet(wb, wsNF, 'NOTAS FISCAIS');

      // Sheet 3: Desfazimento
      const wsDesfData = disposalProcesses.map(p => ({
        'PROCESSOS': p.processo,
        'CATEGORIA DE DESFAZIMENTO': p.categoria,
        'GRUPO': p.grupo,
        'UNIDADE': p.unidade,
        'MUNICÍPIO': p.municipio,
        'DRE': p.dre,
        'DESTINO': p.destino,
        'QUANTIDADE DE ITENS': p.quantidadeItens,
        'VALOR': p.valor,
        'STATUS': p.status,
        'DATA DO TRÂMITE': p.dataTramite,
        'OBSERVAÇÃO': p.observacao || '',
        'RECOLHIMENTO': p.recolhimento,
        'DATA DA ORDEM DE SERVIÇO': p.dataOrdemServico || '',
        'DATA DO RECOLHIMENTO': p.dataRecolhimento || ''
      }));
      const wsDesf = XLSX.utils.json_to_sheet(wsDesfData);
      XLSX.utils.book_append_sheet(wb, wsDesf, 'DESFAZIMENTO');

      XLSX.writeFile(wb, `Planilha_Processos_Patrimoniais_${new Date().toISOString().split('T')[0]}.xlsx`);
      addToast('Planilha Excel gerada e baixada com sucesso!', 'success');
    } catch (e: any) {
      console.error(e);
      addToast('Erro ao exportar planilha Excel.', 'error');
    }
  };

  // Import Spreadsheet File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        let loadedCount = 0;

        wb.SheetNames.forEach(sheetName => {
          const cleanName = sheetName.trim().toUpperCase();
          const sheet = wb.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          if (cleanName.includes('GERAIS')) {
            const parsedGerais: GeneralProcess[] = rows.map((r, i) => ({
              id: `gp-imp-${Date.now()}-${i}`,
              processo: r['PROCESSOS'] || r['PROCESSOS '] || r['SIGADOC'] || `PROC-${i+1}`,
              dataEntrada: r['DATA DE ENTRADA'] || new Date().toISOString().split('T')[0],
              dataAtual: r['DATA ATUAL'] || new Date().toISOString().split('T')[0],
              diasNoSetor: Number(r['DIAS NO SETOR']) || 0,
              setorOrigem: r['SETOR ORIGEM'] || r['SETOR\nORIGEM'] || 'EE ANDRÉ ANTONIO MAGGI',
              assunto: r['ASSUNTO'] || 'PATRIMÔNIO',
              objeto: r['OBJETO'] || '',
              unidade: r['UNIDADE'] || 'EE ANDRÉ ANTONIO MAGGI',
              responsavel: r['RESPONSÁVEL'] || 'GESTOR PATRIMONIAL',
              dataSaida: r['DATA DE SAÍDA'] || '',
              setorDestino: r['SETOR DESTINO'] || '',
              observacao: r['OBSERVAÇÃO'] || r['OBSERVACOES'] || '',
              quemLancou: r['Nome de quem lancou'] || r['Nome de quem lançou'] || 'Importação Excel',
              status: (r['STATUS'] || r['SITUAÇÃO'] || 'EM_ANDAMENTO') as 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO'
            })).filter(item => item.processo && item.processo !== 'PROCESSOS');

            if (parsedGerais.length > 0) {
              setGeneralProcesses(prev => [...parsedGerais, ...prev]);
              loadedCount += parsedGerais.length;
            }
          } else if (cleanName.includes('FISCAIS') || cleanName.includes('NOTAS')) {
            const parsedNF: InvoiceProcess[] = rows.map((r, i) => ({
              id: `ip-imp-${Date.now()}-${i}`,
              numero: r['N°'] || r['Nº'] || i + 1,
              dre: r['DRE'] || 'DRE - SINOP',
              municipio: r['MUNICIPIO'] || r['MUNICÍPIO'] || 'SINOP',
              codLotacao: r['COD.LOTAÇÃO'] || '2505506',
              unidadeEscolar: r['UNIDADE ESCOLAR'] || 'EE ANDRÉ ANTONIO MAGGI',
              sigadoc: r['N° SIGADOC'] || r['SIGADOC'] || `NF-${i+1}`,
              dataEnvio: r['DATA ENVIO'] || new Date().toISOString().split('T')[0],
              status: (r['STATUS'] || 'EM_TRAMITE') as any,
              observacoes: r['OBSERVAÇÕES'] || r['OBSERVAÇÃO'] || ''
            })).filter(item => item.sigadoc && item.sigadoc !== 'N° SIGADOC');

            if (parsedNF.length > 0) {
              setInvoiceProcesses(prev => [...parsedNF, ...prev]);
              loadedCount += parsedNF.length;
            }
          } else if (cleanName.includes('DESFAZIMENTO')) {
            const parsedDesf: DisposalProcess[] = rows.map((r, i) => ({
              id: `dp-imp-${Date.now()}-${i}`,
              processo: r['PROCESSOS'] || `DESF-${i+1}`,
              categoria: r['CATEGORIA  DE DESFAZIMENTO'] || r['CATEGORIA DE DESFAZIMENTO'] || 'SUCATA / INSERVÍVEL',
              grupo: r['GRUPO'] || 'MOBILIÁRIO ESCOLAR',
              unidade: r['UNIDADE'] || 'EE ANDRÉ ANTONIO MAGGI',
              municipio: r['MUNICÍPIO'] || 'SINOP',
              dre: r['DRE'] || 'DRE - SINOP',
              destino: r['DESTINO'] || 'RECOLHIMENTO DRE',
              quantidadeItens: Number(r['QUANTIDADE DE ITENS ']) || Number(r['QUANTIDADE DE ITENS']) || 1,
              valor: Number(r['VALOR']) || 0,
              status: (r['STATUS'] || 'EM_TRAMITE') as any,
              dataTramite: r['DATA DO TRÂMITE'] || new Date().toISOString().split('T')[0],
              observacao: r['OBSERVAÇÃO'] || '',
              recolhimento: r['RECOLHIMENTO'] || 'PENDENTE',
              dataOrdemServico: r['DATA DA ORDEM DE SERVIÇO'] || '',
              dataRecolhimento: r['DATA DO RECOLHIMENTO'] || ''
            })).filter(item => item.processo && item.processo !== 'PROCESSOS');

            if (parsedDesf.length > 0) {
              setDisposalProcesses(prev => [...parsedDesf, ...prev]);
              loadedCount += parsedDesf.length;
            }
          }
        });

        addToast(`Planilha importada com sucesso! ${loadedCount} registros carregados.`, 'success');
      } catch (err: any) {
        console.error(err);
        addToast('Erro ao importar arquivo Excel. Verifique a estrutura das abas.', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 min-w-0 w-full font-sans">
      {/* HEADER & METRICS SUMMARY */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">
                Processos Administrativos Patrimoniais
              </h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                Gestão de Tramitação, Envio de Notas Fiscais e Desfazimento Patrimonial • EE André Maggi
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label className="flex-1 md:flex-none px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border border-blue-100">
            <Upload size={16} /> Importar Planilha
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleExportExcel}
            className="flex-1 md:flex-none px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <FileSpreadsheet size={16} /> Exportar Excel
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-none px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Novo Processo
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-600/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 block">Processos Gerais</span>
            <div className="text-3xl font-black mt-1">{metrics.totalGerais}</div>
            <span className="text-xs font-bold text-blue-100 mt-2 block">
              {metrics.geraisEmAndamento} em andamento no setor
            </span>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl">
            <Clock size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-indigo-800 text-white p-6 rounded-[2.5rem] shadow-xl shadow-purple-600/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-200 block">Notas Fiscais DRE/SEDUC</span>
            <div className="text-3xl font-black mt-1">{metrics.totalNF}</div>
            <span className="text-xs font-bold text-purple-100 mt-2 block">
              {metrics.nfTramite} em trâmite na DRE/NPM
            </span>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl">
            <Building2 size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-6 rounded-[2.5rem] shadow-xl shadow-emerald-600/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 block">Desfazimento Patrimonial</span>
            <div className="text-3xl font-black mt-1">R$ {metrics.valorTotalDesf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <span className="text-xs font-bold text-emerald-100 mt-2 block">
              {metrics.itensDesf} itens catalogados para recolhimento
            </span>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl">
            <DollarSign size={32} />
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS & FILTERS */}
      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Submodule Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'geral' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileText size={16} /> Processos Gerais ({generalProcesses.length})
          </button>
          <button
            onClick={() => setActiveTab('nota_fiscal')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'nota_fiscal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Building2 size={16} /> Envio de Notas Fiscais ({invoiceProcesses.length})
          </button>
          <button
            onClick={() => setActiveTab('desfazimento')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'desfazimento' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <PackageCheck size={16} /> Desfazimento ({disposalProcesses.length})
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Pesquisar por SIGADOC, Assunto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            >
              <option value="ALL">Todos os Status</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="EM_TRAMITE">Em Trâmite</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="APROVADO">Aprovado</option>
              <option value="PENDENTE">Pendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: PROCESSOS GERAIS TABLE */}
      {activeTab === 'geral' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h4 className="font-black text-gray-900 uppercase text-sm tracking-wide">
              Controle de Processos Administrativos Gerais ({filteredGerais.length})
            </h4>
            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase border border-blue-100">
              Acompanhamento de Trâmite Interno / Externo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="p-4">Processo (SIGADOC)</th>
                  <th className="p-4">Data Entrada</th>
                  <th className="p-4">Origem / Destino</th>
                  <th className="p-4">Assunto & Objeto</th>
                  <th className="p-4">Responsável</th>
                  <th className="p-4 text-center">Dias Setor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                {filteredGerais.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 font-bold uppercase text-xs">
                      Nenhum processo geral encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredGerais.map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-all">
                      <td className="p-4">
                        <span className="font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 block w-fit">
                          {item.processo}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 font-medium">
                        {item.dataEntrada}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{item.setorOrigem}</div>
                        {item.setorDestino && (
                          <div className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                            <ArrowRightLeft size={10} /> {item.setorDestino}
                          </div>
                        )}
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="font-black text-gray-900 uppercase truncate">{item.assunto}</div>
                        <div className="text-[10px] text-gray-500 truncate">{item.objeto}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{item.responsavel}</div>
                        <div className="text-[9px] text-gray-400">{item.quemLancou}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          item.diasNoSetor > 15 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.diasNoSetor} dias
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                          item.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          item.status === 'EM_ANDAMENTO' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal('geral', item)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('geral', item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: NOTAS FISCAIS TABLE */}
      {activeTab === 'nota_fiscal' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h4 className="font-black text-gray-900 uppercase text-sm tracking-wide">
              Envio de Notas Fiscais de Patrimônio Mobiliário - DRE/NPM/COPM/SEDUC ({filteredNF.length})
            </h4>
            <span className="text-[10px] font-black bg-purple-50 text-purple-600 px-3 py-1 rounded-full uppercase border border-purple-100">
              Protocolo e Regularização Fiscal
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="p-4">N°</th>
                  <th className="p-4">DRE / Município</th>
                  <th className="p-4">Unidade Escolar / Cód</th>
                  <th className="p-4">N° SIGADOC</th>
                  <th className="p-4">Data Envio</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Observações</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                {filteredNF.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 font-bold uppercase text-xs">
                      Nenhum processo de nota fiscal encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredNF.map(item => (
                    <tr key={item.id} className="hover:bg-purple-50/30 transition-all">
                      <td className="p-4 font-black text-gray-900">
                        #{item.numero}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{item.dre}</div>
                        <div className="text-[10px] text-gray-400 uppercase">{item.municipio}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{item.unidadeEscolar}</div>
                        <div className="text-[10px] text-gray-400">Lotação: {item.codLotacao}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 block w-fit">
                          {item.sigadoc}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 font-medium">
                        {item.dataEnvio}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                          item.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          item.status === 'EM_TRAMITE' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs text-gray-600 font-normal">
                        {item.observacoes || '-'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal('nota_fiscal', item)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('nota_fiscal', item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DESFAZIMENTO TABLE */}
      {activeTab === 'desfazimento' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h4 className="font-black text-gray-900 uppercase text-sm tracking-wide">
              Controle de Processos de Desfazimento Patrimonial ({filteredDesfazimento.length})
            </h4>
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase border border-emerald-100">
              Alienação, Sucata & Recolhimento
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="p-4">Processo</th>
                  <th className="p-4">Categoria / Grupo</th>
                  <th className="p-4">Destino / DRE</th>
                  <th className="p-4 text-center">Itens</th>
                  <th className="p-4">Valor Total</th>
                  <th className="p-4">Status / Trâmite</th>
                  <th className="p-4">Recolhimento</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                {filteredDesfazimento.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 font-bold uppercase text-xs">
                      Nenhum processo de desfazimento cadastrado.
                    </td>
                  </tr>
                ) : (
                  filteredDesfazimento.map(item => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-all">
                      <td className="p-4">
                        <span className="font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 block w-fit">
                          {item.processo}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{item.categoria}</div>
                        <div className="text-[10px] text-gray-400 uppercase">{item.grupo}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{item.destino}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">{item.dre} - {item.municipio}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full font-black text-[10px]">
                          {item.quantidadeItens} un
                        </span>
                      </td>
                      <td className="p-4 font-black text-gray-900">
                        R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                          item.status === 'CONCLUIDO' || item.status === 'RECOLHIDO' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                        <div className="text-[9px] text-gray-400 mt-0.5">Trâmite: {item.dataTramite}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-800 text-[10px]">{item.recolhimento}</div>
                        {item.dataRecolhimento && (
                          <div className="text-[9px] text-emerald-600 font-semibold">Data: {item.dataRecolhimento}</div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal('desfazimento', item)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('desfazimento', item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gray-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-black text-lg uppercase tracking-tight">
                    {editingItem ? 'Editar Processo Patrimonial' : 'Novo Processo Patrimonial'}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Preencha os dados conforme trâmite oficial SEDUC-MT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProcess} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* Type Switch in Modal */}
              {!editingItem && (
                <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('geral')}
                    className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${
                      activeTab === 'geral' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Processo Geral
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('nota_fiscal')}
                    className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${
                      activeTab === 'nota_fiscal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Nota Fiscal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('desfazimento')}
                    className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${
                      activeTab === 'desfazimento' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Desfazimento
                  </button>
                </div>
              )}

              {/* FORM FOR PROCESSO GERAL */}
              {(editingItem?.type === 'geral' || (!editingItem && activeTab === 'geral')) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Nº Processo / SIGADOC *
                      </label>
                      <input
                        type="text"
                        required
                        value={formGeral.processo}
                        onChange={e => setFormGeral({ ...formGeral, processo: e.target.value.toUpperCase() })}
                        placeholder="Ex: SEDUC-PRO-2026/00142"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Data de Entrada
                      </label>
                      <input
                        type="date"
                        value={formGeral.dataEntrada}
                        onChange={e => setFormGeral({ ...formGeral, dataEntrada: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Setor Origem
                      </label>
                      <input
                        type="text"
                        value={formGeral.setorOrigem}
                        onChange={e => setFormGeral({ ...formGeral, setorOrigem: e.target.value.toUpperCase() })}
                        placeholder="Ex: DRE-SINOP, COORDENAÇÃO"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Setor Destino
                      </label>
                      <input
                        type="text"
                        value={formGeral.setorDestino}
                        onChange={e => setFormGeral({ ...formGeral, setorDestino: e.target.value.toUpperCase() })}
                        placeholder="Ex: SEDUC/COPM"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Assunto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formGeral.assunto}
                      onChange={e => setFormGeral({ ...formGeral, assunto: e.target.value.toUpperCase() })}
                      placeholder="Ex: SOLICITAÇÃO DE MOBILIÁRIO, AQS, INVENTÁRIO"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Objeto Detalhado
                    </label>
                    <textarea
                      value={formGeral.objeto}
                      onChange={e => setFormGeral({ ...formGeral, objeto: e.target.value })}
                      placeholder="Descrição dos itens, aparelhos ou materiais vinculados ao processo..."
                      rows={2}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Responsável
                      </label>
                      <input
                        type="text"
                        value={formGeral.responsavel}
                        onChange={e => setFormGeral({ ...formGeral, responsavel: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Dias no Setor
                      </label>
                      <input
                        type="number"
                        value={formGeral.diasNoSetor}
                        onChange={e => setFormGeral({ ...formGeral, diasNoSetor: Number(e.target.value) })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Status
                      </label>
                      <select
                        value={formGeral.status}
                        onChange={e => setFormGeral({ ...formGeral, status: e.target.value as any })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="EM_ANDAMENTO">Em Andamento</option>
                        <option value="CONCLUIDO">Concluído</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Observação / Trâmite
                    </label>
                    <input
                      type="text"
                      value={formGeral.observacao}
                      onChange={e => setFormGeral({ ...formGeral, observacao: e.target.value })}
                      placeholder="Anotações adicionais do processo..."
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                </div>
              )}

              {/* FORM FOR NOTA FISCAL */}
              {(editingItem?.type === 'nota_fiscal' || (!editingItem && activeTab === 'nota_fiscal')) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Nº SIGADOC da NF *
                      </label>
                      <input
                        type="text"
                        required
                        value={formNF.sigadoc}
                        onChange={e => setFormNF({ ...formNF, sigadoc: e.target.value.toUpperCase() })}
                        placeholder="Ex: SEDUC-NF-2026/08912"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Data de Envio
                      </label>
                      <input
                        type="date"
                        value={formNF.dataEnvio}
                        onChange={e => setFormNF({ ...formNF, dataEnvio: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        DRE
                      </label>
                      <input
                        type="text"
                        value={formNF.dre}
                        onChange={e => setFormNF({ ...formNF, dre: e.target.value.toUpperCase() })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Município
                      </label>
                      <input
                        type="text"
                        value={formNF.municipio}
                        onChange={e => setFormNF({ ...formNF, municipio: e.target.value.toUpperCase() })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Status
                      </label>
                      <select
                        value={formNF.status}
                        onChange={e => setFormNF({ ...formNF, status: e.target.value as any })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="EM_TRAMITE">Em Trâmite</option>
                        <option value="APROVADO">Aprovado</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="ARQUIVADO">Arquivado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Observações da Nota Fiscal
                    </label>
                    <textarea
                      value={formNF.observacoes}
                      onChange={e => setFormNF({ ...formNF, observacoes: e.target.value })}
                      placeholder="Descrição dos materiais da Nota Fiscal enviados para incorporação..."
                      rows={3}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* FORM FOR DESFAZIMENTO */}
              {(editingItem?.type === 'desfazimento' || (!editingItem && activeTab === 'desfazimento')) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Nº Processo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formDesfazimento.processo}
                        onChange={e => setFormDesfazimento({ ...formDesfazimento, processo: e.target.value.toUpperCase() })}
                        placeholder="Ex: SEDUC-DES-2026/00044"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Categoria de Desfazimento *
                      </label>
                      <input
                        type="text"
                        required
                        value={formDesfazimento.categoria}
                        onChange={e => setFormDesfazimento({ ...formDesfazimento, categoria: e.target.value.toUpperCase() })}
                        placeholder="Ex: SUCATA / INSERVÍVEL, LEILÃO, DOAÇÃO"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Grupo de Bens
                      </label>
                      <input
                        type="text"
                        value={formDesfazimento.grupo}
                        onChange={e => setFormDesfazimento({ ...formDesfazimento, grupo: e.target.value.toUpperCase() })}
                        placeholder="Ex: MOBILIÁRIO, ELETRÔNICOS"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Qtd. de Itens
                      </label>
                      <input
                        type="number"
                        value={formDesfazimento.quantidadeItens}
                        onChange={e => setFormDesfazimento({ ...formDesfazimento, quantidadeItens: Number(e.target.value) })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Valor Total (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formDesfazimento.valor}
                        onChange={e => setFormDesfazimento({ ...formDesfazimento, valor: Number(e.target.value) })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Destino do Recolhimento
                      </label>
                      <input
                        type="text"
                        value={formDesfazimento.destino}
                        onChange={e => setFormDesfazimento({ ...formDesfazimento, destino: e.target.value.toUpperCase() })}
                        placeholder="Ex: DEPÓSITO DRE, RECICLAGEM"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Status do Processo
                      </label>
                      <select
                        value={formDesfazimento.status}
                        onChange={e => setFormDesfazimento({ ...formDesfazimento, status: e.target.value as any })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="EM_TRAMITE">Em Trâmite</option>
                        <option value="CONCLUIDO">Concluído</option>
                        <option value="RECOLHIDO">Recolhido</option>
                        <option value="PENDENTE">Pendente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Observação / Laudo de Inservibilidade
                    </label>
                    <textarea
                      value={formDesfazimento.observacao}
                      onChange={e => setFormDesfazimento({ ...formDesfazimento, observacao: e.target.value })}
                      placeholder="Detalhes dos itens irrecuperáveis ou autorização de baixa..."
                      rows={2}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                  Salvar Processo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
