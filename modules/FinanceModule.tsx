
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Wallet,
  ArrowLeft,
  FileText,
  Calculator,
  PieChart,
  Plus,
  ArrowRightLeft,
  Building,
  GraduationCap,
  Apple,
  Coins,
  ChevronRight,
  AlertCircle,
  X,
  Target,
  Flag,
  Sprout,
  Scale,
  Zap,
  Package,
  ScanLine,
  Loader2,
  FileUp,
  Sparkles,
  Hash,
  Calendar,
  Banknote,
  FileCheck,
  Tag,
  Search,
  Download,
  Filter,
  ShieldCheck,
  Percent,
  ReceiptText,
  UserCheck,
  Maximize2,
  Database,
  Trash2 // Added Trash2 icon
} from 'lucide-react';
import { extractInvoiceInfo } from '../geminiService';
import { supabase } from '../supabaseClient';
import { useToast } from '../components/Toast';
import { User } from '../types';
import BudgetModule from './BudgetModule';

const DEFAULT_FUNDS = [
  { name: 'ru', full_name: 'Recurso Único (ESTADUAL)', budget_year: new Date().getFullYear().toString() },
  { name: 'merenda', full_name: 'Merenda Escolar (PNAE/ESTADUAL)', budget_year: new Date().getFullYear().toString() },
  { name: 'pdde_basico', full_name: 'PDDE Básico (FEDERAL)', budget_year: new Date().getFullYear().toString() },
  { name: 'pdde_qualidade', full_name: 'PDDE Qualidade (FEDERAL)', budget_year: new Date().getFullYear().toString() },
];

type SubModuleType = 'dashboard' | 'ru' | 'merenda' | 'pdde_basico' | 'pdde_qualidade' | 'reports' | 'budget';

interface Transaction {
  id: string;
  date: string;
  invoiceDate?: string;
  description: string;
  invoiceNumber?: string;
  type: 'ENTRY' | 'EXPENSE';
  group: 'CUSTEIO' | 'CAPITAL' | 'OUTROS';
  value: number;
  netValue?: number;
  taxValue?: number;
  category: string;
  integratedAction?: string;
  fundingSource?: 'ESTADUAL' | 'FEDERAL';
  isFamilyAgriculture?: boolean;
  isIndividualProducer?: boolean;
  receiptUrl?: string;
  time?: string;
}

interface FundData {
  id: SubModuleType;
  dbId?: string;
  name: string;
  fullName: string;
  allocated: number;
  transactions: Transaction[];
  color: string;
  icon: any;
}

const FinanceModule: React.FC<{ onExit: () => void; user: User }> = ({ onExit, user }) => {
  const { addToast } = useToast();
  /*
   * MÓDULO FINANCEIRO - MIGRAÇÃO SUPABASE
   */
  const [activeTab, setActiveTab] = useState<SubModuleType>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [funds, setFunds] = useState<Record<string, FundData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeContracts, setActiveContracts] = useState<any[]>([]);

  // [NOVO] Estados para Filtros
  const [filters, setFilters] = useState({
    search: '',
    invoice: '',
    value: '',
    date: ''
  });

  // UI Helper for Date Pickers (YYYY-MM-DD)
  const getLocalDateString = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };

  // DB Helper to avoid Timezone Shifts (noon-offset)
  const toISODateString = (dateInput?: string | Date) => {
    let dateStr = '';
    if (!dateInput) {
      dateStr = getLocalDateString();
    } else if (typeof dateInput === 'string') {
      dateStr = dateInput.split('T')[0];
    } else {
      const d = dateInput as Date;
      const tzOffset = d.getTimezoneOffset() * 60000;
      dateStr = new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
    }
    return `${dateStr}T12:00:00.000Z`;
  };

  const getLocalTimeString = () => {
    const d = new Date();
    return d.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
  };

  const [newTx, setNewTx] = useState({
    description: '',
    invoiceNumber: '',
    invoiceDate: '',
    value: '',
    type: 'EXPENSE' as 'ENTRY' | 'EXPENSE',
    group: 'CUSTEIO' as 'CUSTEIO' | 'CAPITAL',
    category: '',
    integratedAction: '',
    fundingSource: '',
    isFamilyAgriculture: false,
    isIndividualProducer: false,
    date: getLocalDateString(),
    time: getLocalTimeString()
  });

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Mapeamento de cores e ícones estáticos (o banco só guarda Nome e Ano)
  const fundConfig: Record<string, { color: string, icon: any }> = {
    'ru': { color: 'blue', icon: Coins },
    'merenda': { color: 'emerald', icon: Apple },
    'pdde_basico': { color: 'amber', icon: Building },
    'pdde_qualidade': { color: 'purple', icon: GraduationCap }
  };

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      // 1. Buscar Fundos
      const { data: fundsData, error: fundsError } = await supabase.from('funds').select('*');
      if (fundsError) throw fundsError;

      // 2. Buscar Transações
      const { data: transactionsData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: true });

      if (txError) throw txError;

      const newFundsState: Record<string, FundData> = {};

      fundsData?.forEach(fund => {
        // Mapear nome do banco 'ru' para chave 'ru' etc. 
        // Supondo que o nome no banco seja a chave usada (ex: 'ru', 'merenda')
        // Se o banco tiver nomes diferentes, precisaremos de um mapa ou ajustar a seed.
        // Na seed usamos: 'ru', 'merenda', 'pdde_basico', 'pdde_qualidade' no campo NAME.
        const key = fund.name;
        const config = fundConfig[key] || { color: 'gray', icon: Wallet };

        const fundTransactions = transactionsData?.filter(t => t.fund_id === fund.id).map(t => ({
          id: t.id,
          date: t.date || '',
          description: t.description || 'Sem descrição',
          invoiceNumber: t.invoice_number || '',
          invoiceDate: t.invoice_date || '',
          group: t.tx_group || 'CUSTEIO',
          type: t.type || 'EXPENSE',
          value: Number(t.gross_value) || 0,
          category: t.category || '',
          receiptUrl: t.receipt_url || '',
          integratedAction: t.integrated_action || '',
          fundingSource: t.funding_source || '',
          isFamilyAgriculture: t.is_family_agriculture || false,
          isIndividualProducer: t.is_individual_producer || false,
          taxValue: Number(t.tax_value) || 0,
          netValue: Number(t.net_value) || 0,
          time: t.time || ''
        })) || [];

        // Calcular alocado? Por enquanto fixo ou vindo de algum lugar?
        // Vamos manter o allocated fixo por enquanto ou zero.
        let allocated = 0;
        if (key === 'ru') allocated = 50000;
        if (key === 'merenda') allocated = 30000;
        if (key === 'pdde_basico') allocated = 15000;
        if (key === 'pdde_qualidade') allocated = 20000;

        newFundsState[key] = {
          id: key as SubModuleType,
          dbId: fund.id, // Guardar ID do banco para inserts
          name: fund.full_name?.split('(')[0].trim() || fund.name, // Exibir nome amigável
          fullName: fund.full_name || fund.name,
          allocated,
          color: config.color,
          icon: config.icon,
          transactions: fundTransactions
        } as FundData & { dbId: string };
      });

      setFunds(newFundsState);

    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeDatabase = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('funds').insert(DEFAULT_FUNDS);
      if (error) throw error;
      addToast("Banco de dados do Financeiro inicializado com sucesso!", "success");
      await fetchFinancialData();
    } catch (error: any) {
      console.error("Erro ao inicializar banco:", error);
      addToast("Erro ao inicializar: " + (error.message || "Verifique as permissões de RLS"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      // Fetch active contracts strictly to help standardizing descriptions
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          number,
          suppliers (
            name
          )
        `);
      if (error) throw error;
      if (data) setActiveContracts(data);
    } catch (err) {
      console.error("Error fetching contracts for autofill:", err);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    fetchContracts();
  }, []);



  // [NOVO] Lógica de Filtragem Universal
  const passesFilter = (tx: Transaction) => {
    const searchMatch = !filters.search || tx.description.toUpperCase().includes(filters.search.toUpperCase());
    const invoiceMatch = !filters.invoice || (tx.invoiceNumber && tx.invoiceNumber.toUpperCase().includes(filters.invoice.toUpperCase()));
    const valueMatch = !filters.value || tx.value.toString().includes(filters.value);
    const dateMatch = !filters.date || tx.date === filters.date;
    return searchMatch && invoiceMatch && valueMatch && dateMatch;
  };

  // Lista consolidada de todas as notas fiscais (com filtro)
  const allInvoices = useMemo(() => {
    const invoices: (Transaction & { fundName: string, fundColor: string })[] = [];
    (Object.values(funds) as FundData[]).forEach(fund => {
      fund.transactions.forEach(tx => {
        if (tx.invoiceNumber && passesFilter(tx)) {
          invoices.push({ ...tx, fundName: fund.name, fundColor: fund.color });
        }
      });
    });
    return invoices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [funds, filters]);

  // Transações filtradas para a aba ativa
  const activeFundTransactions = useMemo(() => {
    if (!funds[activeTab]) return [];
    return funds[activeTab].transactions.filter(passesFilter);
  }, [funds, activeTab, filters]);

  // Filtro específico para relatório de impostos AF
  const afTaxReport = useMemo(() => {
    const report: (Transaction & { fundName: string })[] = [];
    (Object.values(funds) as FundData[]).forEach(fund => {
      fund.transactions.forEach(tx => {
        if (tx.isFamilyAgriculture && tx.isIndividualProducer && tx.type === 'EXPENSE') {
          report.push({ ...tx, fundName: fund.name });
        }
      });
    });
    return report;
  }, [funds]);

  const totalTaxAmount = useMemo(() => {
    return afTaxReport.reduce((acc, curr) => acc + (curr.taxValue || 0), 0);
  }, [afTaxReport]);

  const getAvailableCategories = (group: string, fundId: string, type: 'ENTRY' | 'EXPENSE') => {
    if (type === 'ENTRY') {
      return fundId === 'merenda' ? ['Repasse Federal', 'Repasse Estadual'] : ['Repasse Federal', 'Repasse Estadual', 'Rendimento de Aplicação', 'Saldo Exercício Anterior'];
    }
    if (group === 'CAPITAL') {
      return ['Equipamentos e Material Permanente', 'Mobiliário Escolar', 'Equipamentos de Informática', 'Utensílios de Cozinha (Bens Permanentes)', 'Eletrodomésticos', 'Máquinas e Equipamentos'];
    }
    const commonCusteio = ['Material de Consumo', 'Serviços de Terceiros - Pessoa Jurídica', 'Serviços de Terceiros - Pessoa Física', 'Pequenos Reparos e Manutenção Predial', 'Material Pedagógico e Esportivo', 'Material de Expediente', 'Material de Limpeza e Higiene'];
    if (fundId === 'merenda') return ['Aquisição de Gêneros Alimentícios', 'Gás de Cozinha', 'Material de Higiene (Cozinha)', ...commonCusteio];
    if (fundId === 'pdde_qualidade') return ['Material de Apoio Pedagógico', 'Conectividade e Internet', 'Capacitação e Formação', ...commonCusteio];
    if (fundId === 'ru') return ['Manutenção de Ar Condicionado', 'Pequenas Reformas', ...commonCusteio];
    return commonCusteio;
  };

  useEffect(() => {
    const cats = getAvailableCategories(newTx.group, activeTab, newTx.type);
    if (!cats.includes(newTx.category)) {
      setNewTx(prev => ({ ...prev, category: cats[0] }));
    }
  }, [newTx.group, newTx.type, activeTab]);

  const getFundStats = (fund: FundData) => {
    if (!fund) return null;
    const entries = fund.transactions.filter(t => t.type === 'ENTRY').reduce((acc, t) => acc + t.value, 0);

    // Federal vs Estadual (specific for Merenda)
    const federalEntries = fund.transactions.filter(t => t.type === 'ENTRY' && t.fundingSource === 'FEDERAL').reduce((acc, t) => acc + t.value, 0);
    const stateEntries = fund.transactions.filter(t => t.type === 'ENTRY' && t.fundingSource === 'ESTADUAL').reduce((acc, t) => acc + t.value, 0);

    const expenses = fund.transactions.filter(t => t.type === 'EXPENSE');
    const totalExpenses = expenses.reduce((acc, t) => acc + t.value, 0);

    // Expenses split by source (only applicable if fundingSource was tracked on expense, assuming default fallback based on some logic, but typically we track fundingSource on Expense too in this app)
    const federalExpenses = expenses.filter(t => t.fundingSource === 'FEDERAL').reduce((acc, t) => acc + t.value, 0);
    const stateExpenses = expenses.filter(t => t.fundingSource === 'ESTADUAL').reduce((acc, t) => acc + t.value, 0);

    const entriesCusteio = fund.transactions.filter(t => t.type === 'ENTRY' && t.group === 'CUSTEIO').reduce((acc, t) => acc + t.value, 0);
    const entriesCapital = fund.transactions.filter(t => t.type === 'ENTRY' && t.group === 'CAPITAL').reduce((acc, t) => acc + t.value, 0);
    const expensesCusteio = expenses.filter(t => t.group === 'CUSTEIO').reduce((acc, t) => acc + t.value, 0);
    const expensesCapital = expenses.filter(t => t.group === 'CAPITAL').reduce((acc, t) => acc + t.value, 0);

    const afTotalFederal = expenses.filter(t => t.isFamilyAgriculture && t.fundingSource === 'FEDERAL').reduce((acc, t) => acc + t.value, 0);
    const afGoalPercent = federalEntries > 0 ? (afTotalFederal / federalEntries) * 100 : 0;

    return {
      balance: entries - totalExpenses,
      totalEntries: entries,
      federalEntries,
      stateEntries,
      totalExpenses,
      federalExpenses,
      stateExpenses,
      federalBalance: federalEntries - federalExpenses,
      stateBalance: stateEntries - stateExpenses,
      afTotalFederal,
      afGoalPercent,
      entriesCusteio,
      entriesCapital,
      expensesCusteio,
      expensesCapital,
      execPercent: entries > 0 ? (totalExpenses / entries) * 100 : 0
    };
  };

  const globalStats = useMemo(() => {
    const allFunds = Object.values(funds) as FundData[];
    return allFunds.reduce((acc, f) => {
      const s = getFundStats(f);
      if (!s) return acc;
      return { balance: acc.balance + s.balance, entries: acc.entries + s.totalEntries, expenses: acc.expenses + s.totalExpenses };
    }, { balance: 0, entries: 0, expenses: 0 });
  }, [funds]);

  const stats = useMemo(() => {
    const validFunds = ['ru', 'merenda', 'pdde_basico', 'pdde_qualidade'];
    if (validFunds.includes(activeTab)) return getFundStats(funds[activeTab]);
    return null;
  }, [funds, activeTab]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || !newTx.value) {
      addToast("Preencha os campos obrigatórios.", "warning");
      return;
    }
    const rawValue = parseFloat(newTx.value);
    const taxValue = (newTx.type === 'EXPENSE' && newTx.isFamilyAgriculture && newTx.isIndividualProducer) ? rawValue * 0.015 : 0;
    const netValue = rawValue - taxValue;

    let receiptUrl = null;

    try {
      const currentFund = funds[activeTab];
      if (!currentFund || !currentFund.dbId) throw new Error("Fundo não identificado.");

      // 1. Upload do Arquivo (PDF/Imagem) para o Supabase Storage se houver
      if (tempFile) {
        const fileExt = tempFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('finance-documents')
          .upload(filePath, tempFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('finance-documents')
          .getPublicUrl(filePath);

        receiptUrl = publicUrl;
      }

      // === DUPLICATE CHECK LOGIC ===
      // Only warn on creations, bypass if it's an edit
      if (!editingTx) {
        // Compare with local transactions of the current fund
        const duplicateWarning = currentFund.transactions.some(tx =>
          tx.date === newTx.date &&
          tx.description.trim().toUpperCase() === newTx.description.trim().toUpperCase() &&
          tx.value === netValue &&
          tx.type === newTx.type
        );

        if (duplicateWarning) {
          const userConfirmed = window.confirm(
            "ALERTA: Parece que você já tem um lançamento anotado nesse mesmo dia, com o mesmo fornecedor e mesmo valor.\n\nTem certeza que não é duplicado e deseja prosseguir para salvar mesmo assim?"
          );
          if (!userConfirmed) {
            setIsScanning(false);
            return;
          }
        }
      }

      const txPayload = {
        fund_id: currentFund.dbId,
        date: toISODateString(newTx.date),
        description: newTx.description.toUpperCase(),
        invoice_number: newTx.invoiceNumber.toUpperCase(),
        invoice_date: newTx.invoiceDate || null,
        type: newTx.type,
        tx_group: (activeTab === 'merenda' && newTx.type === 'ENTRY') ? 'CUSTEIO' : newTx.group,
        gross_value: rawValue,
        tax_value: taxValue,
        net_value: netValue,
        category: newTx.category,
        integrated_action: activeTab === 'pdde_qualidade' ? newTx.integratedAction : null,
        funding_source: activeTab === 'merenda' ? newTx.fundingSource : null,
        is_family_agriculture: activeTab === 'merenda' ? newTx.isFamilyAgriculture : false,
        is_individual_producer: activeTab === 'merenda' ? newTx.isIndividualProducer : false,
        time: newTx.time || null,
        ...(receiptUrl ? { receipt_url: receiptUrl } : {})
      };

      if (editingTx) {
        const { error } = await supabase.from('transactions')
          .update(txPayload)
          .eq('id', editingTx.id);
        if (error) throw error;
        addToast("Lançamento atualizado com sucesso!", "success");
      } else {
        const { error } = await supabase.from('transactions').insert([txPayload]);
        if (error) throw error;
        addToast("Lançamento realizado com sucesso!", "success");
      }

      setIsModalOpen(false);
      setTempFile(null);
      setEditingTx(null);
      setNewTx({ description: '', invoiceNumber: '', invoiceDate: '', value: '', type: 'EXPENSE', group: 'CUSTEIO', category: '', integratedAction: '', fundingSource: '', isFamilyAgriculture: false, isIndividualProducer: false, date: getLocalDateString(), time: getLocalTimeString() });
      fetchFinancialData();
    } catch (error: any) {
      console.error("Erro ao salvar lançamento:", error);
      addToast("Erro ao salvar: " + (error.message || "Erro desconhecido"), "error");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("ATENÇÃO: Você tem certeza que deseja EXCLUIR PERMANENTEMENTE este lançamento? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      addToast("Lançamento excluído com sucesso!", "success");
      fetchFinancialData();
    } catch (error: any) {
      console.error("Erro ao deletar lançamento:", error);
      addToast("Erro ao excluir. Tente novamente.", "error");
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const data = await extractInvoiceInfo(base64, file.type);
        if (data) {
          setTempFile(file);
          setNewTx(prev => ({ 
            ...prev, 
            description: data.description || prev.description, 
            invoiceNumber: data.invoiceNumber || prev.invoiceNumber, 
            invoiceDate: data.invoiceDate || prev.invoiceDate,
            value: data.totalValue?.toString() || prev.value, 
            date: getLocalDateString() // Data da operação fica como data de hoje, a NF vai pro invoiceDate
          }));
        }
      } catch (err) { addToast("Erro ao ler nota fiscal com IA.", "error"); } finally { setIsScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans relative overflow-hidden text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 fixed"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black fixed opacity-90"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite] fixed"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite] fixed"></div>
      </div>

      <div className="relative z-10 flex h-screen">
        <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col no-print">
          <div className="p-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">💰</span>
              Financeiro
            </h1>
          </div>

          <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/30'
                : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              <PieChart size={18} /> Balanço Global
            </button>

            <button
              onClick={() => setActiveTab('budget')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'budget'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/30'
                : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              <Calculator size={18} /> Orçamento / Planejamento
            </button>

            <div className="py-4">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-3">Fontes de Recurso</p>
              <div className="space-y-1">
                {[
                  { id: 'ru', label: 'R.U (Recurso Único)', icon: Coins },
                  { id: 'merenda', label: 'Merenda Escolar', icon: Apple },
                  { id: 'pdde_basico', label: 'PDDE Básico', icon: Building },
                  { id: 'pdde_qualidade', label: 'PDDE Qualidade', icon: GraduationCap },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SubModuleType)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === item.id
                      ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30 shadow-lg'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                  >
                    <item.icon size={16} /> {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/30'
                : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              <FileText size={18} /> Prestação de Contas
            </button>
          </nav>

          <div className="p-6 border-t border-white/10 space-y-3">
            <button onClick={onExit} className="w-full flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-white/60">
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-20 bg-transparent border-b border-white/10 flex items-center justify-between px-10 shrink-0 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 text-blue-400 rounded-lg border border-white/10"><Wallet size={20} /></div>
              <h2 className="text-sm font-black text-white/80 uppercase tracking-widest">{user.name}</h2>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={toggleFullScreen}
                className="p-2.5 text-white/40 hover:bg-white/10 hover:text-white rounded-xl transition-all group flex items-center gap-2"
                title="Alternar Tela Cheia"
              >
                <Maximize2 size={18} className="group-hover:text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Expandir</span>
              </button>
              {activeTab === 'merenda' && stats && (
                <div className="flex items-center gap-4 bg-emerald-900/20 px-4 py-2 rounded-2xl border border-emerald-500/20 animate-in slide-in-from-right-4 backdrop-blur-md">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">Meta 45% (PNAE)</p>
                    <p className={`text-sm font-black ${stats.afGoalPercent >= 45 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.afGoalPercent.toFixed(1)}%</p>
                  </div>
                  <div className="w-24 bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${stats.afGoalPercent >= 45 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} style={{ width: `${Math.min(stats.afGoalPercent * 2.22, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6">

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
                  <Loader2 className="animate-spin text-blue-500" size={48} />
                  <p className="text-xs font-black uppercase tracking-[0.3em]">Carregando Informações...</p>
                </div>
              ) : Object.keys(funds).length === 0 && activeTab !== 'budget' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-32 h-32 bg-amber-500/10 text-amber-500 rounded-[2.5rem] flex items-center justify-center mb-8 border border-amber-500/20 shadow-2xl">
                    <Database size={64} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter max-w-md">Estrutura Financeira Não Encontrada</h3>
                  <p className="text-white/40 font-medium max-w-sm mt-4 leading-relaxed">
                    Parece que as tabelas de recursos (RU, Merenda, PDDE) ainda não foram configuradas no seu banco de dados Supabase.
                  </p>
                  <div className="mt-10 flex flex-col gap-4">
                    <button
                      onClick={handleInitializeDatabase}
                      className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all"
                    >
                      Inicializar Módulos Padrão
                    </button>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Isso criará as categorias RU, Merenda e PDDE automáticamente.</p>
                  </div>
                </div>
              ) : (
                <>

                  {activeTab === 'budget' && <BudgetModule user={user} />}

                  {activeTab !== 'dashboard' && activeTab !== 'reports' && activeTab !== 'budget' && funds[activeTab] && (
                    <div className="space-y-6 animate-in fade-in duration-500">

                      {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all duration-300">
                          <div className="bg-gray-900/90 rounded-[3.5rem] w-full max-w-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-hidden flex flex-col border border-white/10">

                            {/* MODAL HEADER */}
                            <div className="px-10 pt-10 pb-6 flex justify-between items-start shrink-0">
                              <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-[1.5rem] shadow-xl ${funds[activeTab].color === 'purple' ? 'bg-purple-600' : funds[activeTab].color === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600'} text-white`}>
                                  <Plus size={28} strokeWidth={3} />
                                </div>
                                <div>
                                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{editingTx ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
                                  <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${funds[activeTab].color === 'purple' ? 'bg-purple-500' : funds[activeTab].color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                    Recurso: {funds[activeTab].fullName}
                                  </p>
                                </div>
                              </div>
                              <button onClick={() => { setIsModalOpen(false); setEditingTx(null); setNewTx({ description: '', invoiceNumber: '', invoiceDate: '', value: '', type: 'EXPENSE', group: 'CUSTEIO', category: '', integratedAction: '', fundingSource: '', isFamilyAgriculture: false, isIndividualProducer: false, date: getLocalDateString(), time: getLocalTimeString() }); }} className="p-3 bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-200">
                                <X size={24} />
                              </button>
                            </div>

                            {tempFile && (
                              <div className="px-10 mb-4">
                                <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                  <div className="flex items-center gap-3">
                                    <FileCheck size={20} className="text-blue-400" />
                                    <div>
                                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Arquivo em Anexo</p>
                                      <p className="text-xs font-bold text-white mt-1 truncate max-w-[200px]">{tempFile.name}</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setTempFile(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar">
                              <form onSubmit={handleAddTransaction} className="space-y-8">

                                {/* IA MAGIC SCANNER */}
                                <div className="relative group overflow-hidden p-6 rounded-[2.5rem] border-2 border-dashed border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300">
                                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Sparkles size={120} className="text-blue-900" />
                                  </div>

                                  {isScanning ? (
                                    <div className="flex flex-col items-center gap-4 py-4 animate-pulse">
                                      <div className="relative">
                                        <Loader2 className="animate-spin text-blue-600" size={40} strokeWidth={2.5} />
                                        <Sparkles className="absolute inset-0 m-auto text-blue-400" size={16} />
                                      </div>
                                      <div className="text-center">
                                        <p className="text-sm font-black text-blue-900 uppercase tracking-widest">Inteligência Artificial Ativa</p>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Analisando dados da nota fiscal...</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-6">
                                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <ScanLine size={32} />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Importar via Nota Fiscal</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Extração instantânea de valores, datas e descrições</p>
                                        <button
                                          type="button"
                                          onClick={() => fileInputRef.current?.click()}
                                          className="mt-3 px-6 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-gray-900/20 hover:bg-blue-600 transition-all"
                                        >
                                          Selecionar PDF ou Foto
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleInvoiceUpload} className="hidden" accept="image/*,application/pdf" />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* FORM CONTROLS */}
                                <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Tipo de Movimento</label>
                                    <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] shadow-inner">
                                      <button type="button" onClick={() => setNewTx({ ...newTx, type: 'ENTRY' })} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${newTx.type === 'ENTRY' ? 'bg-white text-emerald-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}>Entrada</button>
                                      <button type="button" onClick={() => setNewTx({ ...newTx, type: 'EXPENSE' })} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${newTx.type === 'EXPENSE' ? 'bg-white text-red-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}>Despesa</button>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{activeTab === 'merenda' ? 'Origem do Recurso' : 'Natureza'}</label>
                                    <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] shadow-inner">
                                      {activeTab === 'merenda' ? (
                                        <>
                                          <button type="button" onClick={() => setNewTx({ ...newTx, fundingSource: 'ESTADUAL', group: 'CUSTEIO' })} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${newTx.fundingSource === 'ESTADUAL' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}>Estadual</button>
                                          <button type="button" onClick={() => setNewTx({ ...newTx, fundingSource: 'FEDERAL', group: 'CUSTEIO' })} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${newTx.fundingSource === 'FEDERAL' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Federal</button>
                                        </>
                                      ) : (
                                        <>
                                          <button type="button" disabled={activeTab === 'merenda' && newTx.type === 'ENTRY'} onClick={() => setNewTx({ ...newTx, group: 'CUSTEIO' })} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${newTx.group === 'CUSTEIO' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 disabled:opacity-50'}`}>Custeio</button>
                                          <button type="button" disabled={activeTab === 'merenda' && newTx.type === 'ENTRY'} onClick={() => setNewTx({ ...newTx, group: 'CAPITAL' })} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${newTx.group === 'CAPITAL' ? 'bg-white text-amber-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 disabled:opacity-50'}`}>Capital</button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">
                                        {newTx.type === 'ENTRY' ? 'Descrição do Repasse / Recebimento' : 'Fornecedor / Descrição'}
                                      </label>
                                      <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"><Tag size={18} /></div>
                                        <input
                                          type="text"
                                          required
                                          list={(activeTab === 'merenda' && newTx.type === 'EXPENSE') ? "contracts-list" : undefined}
                                          value={newTx.description}
                                          onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                                          placeholder={newTx.type === 'ENTRY' ? "Ex: Repasse FNDE Mês 05..." : "Ex: SILVA COMERCIO - Contrato 028/2026"}
                                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        />
                                        {activeTab === 'merenda' && newTx.type === 'EXPENSE' && activeContracts.length > 0 && (
                                          <datalist id="contracts-list">
                                            {activeContracts.map(c => (
                                              <option key={c.id} value={`${c.suppliers?.name} - Contrato ${c.number}`} />
                                            ))}
                                          </datalist>
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Número da Nota Fiscal</label>
                                      <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"><Hash size={18} /></div>
                                        <input type="text" value={newTx.invoiceNumber} onChange={(e) => setNewTx({ ...newTx, invoiceNumber: e.target.value })} placeholder="Opcional" className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all" />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Valor Bruto (R$)</label>
                                      <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs uppercase tracking-widest">R$</div>
                                        <input type="number" step="0.01" required value={newTx.value} onChange={(e) => setNewTx({ ...newTx, value: e.target.value })} placeholder="0,00" className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-lg font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all text-gray-900" />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Data Emissão NF</label>
                                      <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"><Calendar size={18} /></div>
                                        <input type="date" value={newTx.invoiceDate} onChange={(e) => setNewTx({ ...newTx, invoiceDate: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all" />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Data Operação</label>
                                      <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"><Calendar size={18} /></div>
                                        <input type="date" required value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all" />
                                      </div>
                                    </div>
                                    <div className="space-y-2 group/time">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 group-focus-within/time:text-blue-500 transition-colors">Hora do Lançamento</label>
                                      <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/time:text-blue-500 transition-colors">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        </div>
                                        <input type="time" value={newTx.time} onChange={(e) => setNewTx({ ...newTx, time: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all" />
                                      </div>
                                    </div>
                                  </div>

                                  {activeTab !== 'merenda' && (
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Categoria Contábil</label>
                                      <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"><FileCheck size={18} /></div>
                                        <select value={newTx.category} onChange={(e) => setNewTx({ ...newTx, category: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-gray-900 appearance-none outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all uppercase">
                                          {getAvailableCategories(newTx.group, activeTab, newTx.type).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300"><ChevronRight size={18} className="rotate-90" /></div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* CONDITIONAL SECTIONS */}
                                {activeTab === 'pdde_qualidade' && (
                                  <div className="bg-purple-50/50 p-8 rounded-[2.5rem] border border-purple-100 space-y-6 animate-in slide-in-from-top-4">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-purple-600 text-white rounded-lg"><Target size={16} /></div>
                                      <h4 className="text-[11px] font-black text-purple-900 uppercase tracking-widest">Ações Integradas PDDE</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      {['Escola das Adolescências', 'Educação Conectada', 'Escola e Comunidade'].map(action => (
                                        <button
                                          key={action}
                                          type="button"
                                          onClick={() => setNewTx({ ...newTx, integratedAction: action })}
                                          className={`py-3 px-4 rounded-xl text-[9px] font-black uppercase transition-all duration-300 border-2 ${newTx.integratedAction === action ? 'bg-purple-600 text-white border-purple-700 shadow-lg' : 'bg-white text-purple-400 border-purple-50 hover:border-purple-200'}`}
                                        >
                                          {action}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {activeTab === 'merenda' && newTx.type === 'EXPENSE' && (
                                  <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-6 animate-in slide-in-from-top-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-600 text-white rounded-lg"><Sprout size={16} /></div>
                                        <span className="text-[11px] font-black text-emerald-900 uppercase tracking-widest">Agricultura Familiar</span>
                                      </div>
                                      <button type="button" onClick={() => setNewTx({ ...newTx, isFamilyAgriculture: !newTx.isFamilyAgriculture })} className={`w-14 h-7 rounded-full transition-all duration-300 relative ${newTx.isFamilyAgriculture ? 'bg-emerald-600' : 'bg-gray-200 shadow-inner'}`}>
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${newTx.isFamilyAgriculture ? 'left-8' : 'left-1'}`}></div>
                                      </button>
                                    </div>
                                    {newTx.isFamilyAgriculture && (
                                      <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                                        {/* PNAE TARGET SIMULATION */}
                                        <div className="bg-emerald-100/50 p-4 rounded-2xl border border-emerald-200">
                                          <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Target size={12} /> Simulação de Meta PNAE (45%)
                                          </h5>

                                          {(() => {
                                            const currentStats = getFundStats(funds['merenda']);
                                            if (!currentStats) return null;

                                            const currentFederalEntries = currentStats.federalEntries || 0;
                                            const currentAF = currentStats.afTotalFederal || 0;
                                            const newAFValue = parseFloat(newTx.value || "0");

                                            // Projection Logic: Only counts towards goal if Funding Source IS FEDERAL (matches logic in getFundStats)
                                            // However, the form sets Funding Source to FEDERAL if user selected "Federal".
                                            // If user selected "Estadual", it doesn't count towards federal goal.
                                            // Let's assume user wants to know if this helps.

                                            const isFederalSource = newTx.fundingSource === 'FEDERAL';

                                            const projectedAF = currentAF + (isFederalSource ? newAFValue : 0);
                                            const projectedTotalEntries = currentFederalEntries; // Entries don't change with expenses

                                            const currentPercent = currentFederalEntries > 0 ? (currentAF / currentFederalEntries) * 100 : 0;
                                            const projectedPercent = currentFederalEntries > 0 ? (projectedAF / currentFederalEntries) * 100 : 0;

                                            return (
                                              <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                  <div>
                                                    <span className="text-[9px] font-bold text-emerald-600 uppercase">Atual</span>
                                                    <p className="text-lg font-black text-emerald-700">{currentPercent.toFixed(1)}%</p>
                                                  </div>
                                                  <div className="text-right">
                                                    <span className="text-[9px] font-bold text-emerald-600 uppercase">Com este lançamento</span>
                                                    <p className={`text-lg font-black ${projectedPercent >= 45 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                      {projectedPercent.toFixed(1)}%
                                                    </p>
                                                  </div>
                                                </div>

                                                {/* Progress Bar with "Ghost" Projection */}
                                                <div className="h-3 bg-emerald-200/50 rounded-full overflow-hidden relative">
                                                  {/* Current Progress */}
                                                  <div
                                                    className="absolute top-0 left-0 h-full bg-emerald-500 z-10"
                                                    style={{ width: `${Math.min(currentPercent * 2.22, 100)}%` }}
                                                  />

                                                  {/* Projected Add-on */}
                                                  {isFederalSource && newAFValue > 0 && (
                                                    <div
                                                      className="absolute top-0 h-full bg-emerald-400/50 z-0 animate-pulse"
                                                      style={{
                                                        left: `${Math.min(currentPercent * 2.22, 100)}%`,
                                                        width: `${Math.min((projectedPercent - currentPercent) * 2.22, 100 - (currentPercent * 2.22))}%`
                                                      }}
                                                    />
                                                  )}
                                                </div>

                                                {!isFederalSource && newAFValue > 0 && (
                                                  <p className="text-[9px] text-amber-600 font-bold text-center bg-amber-50 py-1 rounded">
                                                    Atenção: Recurso "Estadual" não contabiliza para meta Federal (PNAE/FNDE).
                                                  </p>
                                                )}

                                                {projectedPercent >= 45 && currentPercent < 45 && (
                                                  <p className="text-[9px] text-emerald-700 font-black text-center bg-emerald-200/50 py-1 rounded">
                                                    🎉 Parabéns! Este lançamento atinge a meta de 45%!
                                                  </p>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>

                                        <div className="flex bg-white p-1.5 rounded-[1.2rem] border border-emerald-100 shadow-sm">
                                          <button type="button" onClick={() => setNewTx({ ...newTx, isIndividualProducer: false })} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all duration-300 ${!newTx.isIndividualProducer ? 'bg-emerald-100 text-emerald-800' : 'text-gray-400'}`}>Cooperativa / Associação</button>
                                          <button type="button" onClick={() => setNewTx({ ...newTx, isIndividualProducer: true })} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all duration-300 ${newTx.isIndividualProducer ? 'bg-amber-600 text-white shadow-md' : 'text-gray-400'}`}>Produtor Individual</button>
                                        </div>
                                        {newTx.isIndividualProducer && (
                                          <div className="flex items-center justify-between bg-amber-50 p-4 rounded-2xl border border-amber-200 border-dashed animate-in slide-in-from-left-4">
                                            <div className="flex items-center gap-3 text-amber-800">
                                              <div className="p-2 bg-white rounded-lg"><Scale size={16} /></div>
                                              <div>
                                                <p className="text-[10px] font-black uppercase tracking-tight leading-none">Imposto Lei 15.226/25 (1,5%)</p>
                                                <p className="text-[8px] font-bold text-amber-600 uppercase mt-1">Dedução Automática de Auditoria</p>
                                              </div>
                                            </div>
                                            <span className="text-sm font-black text-amber-800">- R$ {(parseFloat(newTx.value || "0") * 0.015).toFixed(2)}</span>
                                          </div>
                                        )}

                                      </div>
                                    )}
                                  </div>
                                )}

                                <button type="submit" className={`w-full py-5 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${funds[activeTab].color === 'purple' ? 'bg-purple-700 shadow-purple-900/20' :
                                  funds[activeTab].color === 'emerald' ? 'bg-emerald-700 shadow-emerald-900/20' :
                                    'bg-gray-900 shadow-gray-900/20'
                                  } text-white`}>{editingTx ? 'Salvar Alterações' : 'Confirmar Lançamento Financeiro'}</button>
                              </form>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        {(() => {
                          const FundIcon = funds[activeTab].icon;
                          return (
                            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md flex-1 flex items-center gap-6">
                              <div className={`p-5 rounded-3xl ${funds[activeTab].color === 'blue' ? 'bg-blue-600' : funds[activeTab].color === 'purple' ? 'bg-purple-600' : 'bg-emerald-600'} text-white shadow-xl`}>
                                <FundIcon size={40} />
                              </div>
                              <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight">{funds[activeTab].name}</h2>
                                <p className="text-white/50 font-bold text-xs uppercase tracking-widest mt-2">{funds[activeTab].fullName}</p>
                              </div>
                            </div>
                          );
                        })()}

                        {activeTab === 'pdde_qualidade' ? (
                          <div className="flex flex-col gap-6 flex-1">
                            {/* Saldo Geral PDDE Qualidade */}
                            <div className="flex gap-6 w-full flex-col lg:flex-row">
                              <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md flex flex-col justify-center min-w-[200px] text-center lg:text-left">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Saldo Geral Disponível</p>
                                <p className={`text-4xl font-black ${stats?.balance! < 0 ? 'text-red-500' : 'text-white'} tracking-tighter`}>
                                  R$ {stats?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                </p>
                              </div>

                              {/* CUSTEIO CARD (PDDE Qualidade) */}
                              {(() => {
                                const orcado = stats?.entriesCusteio || 0;
                                const gasto = stats?.expensesCusteio || 0;
                                const pct = orcado > 0 ? (gasto / orcado) * 100 : 0;
                                const saldoCusteio = orcado - gasto;
                                const color = pct >= 95 ? 'red' : pct >= 80 ? 'amber' : 'emerald';

                                return (
                                  <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md flex-1 flex flex-col justify-center min-w-[250px]">
                                    <div className="flex justify-between items-center mb-3">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full bg-${color}-500 ${pct >= 95 ? 'animate-pulse' : ''}`}></div>
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Saldo Custeio</p>
                                      </div>
                                      <p className={`text-[10px] font-black ${saldoCusteio < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                        R$ {(saldoCusteio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <p className="text-xl font-black text-white">R$ {(gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[9px] text-white/40 font-bold uppercase">Gasto</span></p>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-3">
                                      <div className={`h-full bg-${color}-500 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* CAPITAL CARD (PDDE Qualidade) */}
                              {(() => {
                                const orcado = stats?.entriesCapital || 0;
                                const gasto = stats?.expensesCapital || 0;
                                const pct = orcado > 0 ? (gasto / orcado) * 100 : 0;
                                const saldoCapital = orcado - gasto;
                                const color = pct >= 95 ? 'red' : pct >= 80 ? 'amber' : 'emerald';

                                return (
                                  <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md flex-1 flex flex-col justify-center min-w-[250px]">
                                    <div className="flex justify-between items-center mb-3">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full bg-${color}-500 ${pct >= 95 ? 'animate-pulse' : ''}`}></div>
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Saldo Capital</p>
                                      </div>
                                      <p className={`text-[10px] font-black ${saldoCapital < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                        R$ {(saldoCapital || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <p className="text-xl font-black text-white">R$ {(gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[9px] text-white/40 font-bold uppercase">Gasto</span></p>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-3">
                                      <div className={`h-full bg-${color}-500 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Ações Integradas com Detalhamento Custeio/Capital */}
                            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                              {['Escola das Adolescências', 'Educação Conectada', 'Escola e Comunidade'].map(action => {
                                const actionTx = funds['pdde_qualidade'].transactions.filter(t => t.integratedAction === action);
                                const entries = actionTx.filter(t => t.type === 'ENTRY');
                                const expenses = actionTx.filter(t => t.type === 'EXPENSE');

                                const balance = actionTx.reduce((acc, t) => acc + (t.type === 'ENTRY' ? t.value : -t.value), 0);
                                
                                const entriesCusteio = entries.filter(t => t.group === 'CUSTEIO').reduce((acc, t) => acc + t.value, 0);
                                const expensesCusteio = expenses.filter(t => t.group === 'CUSTEIO').reduce((acc, t) => acc + t.value, 0);
                                const balanceCusteio = entriesCusteio - expensesCusteio;

                                const entriesCapital = entries.filter(t => t.group === 'CAPITAL').reduce((acc, t) => acc + t.value, 0);
                                const expensesCapital = expenses.filter(t => t.group === 'CAPITAL').reduce((acc, t) => acc + t.value, 0);
                                const balanceCapital = entriesCapital - expensesCapital;

                                return (
                                  <div key={action} className="bg-purple-500/10 p-5 rounded-[2rem] border border-purple-500/20 backdrop-blur-md min-w-[240px] flex flex-col">
                                    <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest mb-3 line-clamp-1 border-b border-purple-500/10 pb-2" title={action}>{action}</p>
                                    
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-end">
                                        <p className="text-[8px] font-bold text-white/40 uppercase">Saldo Total</p>
                                        <p className={`text-lg font-black ${balance < 0 ? 'text-red-400' : 'text-white'}`}>R$ {(balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-500/10">
                                        <div>
                                          <p className="text-[7px] font-black text-blue-300 uppercase tracking-tighter">Custeio</p>
                                          <p className={`text-[11px] font-black ${balanceCusteio < 0 ? 'text-red-400' : 'text-blue-200'}`}>R$ {(balanceCusteio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[7px] font-black text-amber-300 uppercase tracking-tighter">Capital</p>
                                          <p className={`text-[11px] font-black ${balanceCapital < 0 ? 'text-red-400' : 'text-amber-200'}`}>R$ {(balanceCapital || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : activeTab === 'merenda' ? (
                          <div className="flex gap-6 overflow-x-auto pb-2 custom-scrollbar flex-1">
                            <div className="bg-emerald-900/20 p-6 rounded-[2rem] border border-emerald-500/20 backdrop-blur-md flex-1 text-center flex flex-col justify-center min-w-[150px]">
                              <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1 flex items-center justify-center gap-2"><Building size={12} /> Saldo Federal</p>
                              <p className={`text-2xl font-black ${stats?.federalBalance! < 0 ? 'text-red-400' : 'text-emerald-400'}`}>R$ {stats?.federalBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                            </div>
                            <div className="bg-blue-900/20 p-6 rounded-[2rem] border border-blue-500/20 backdrop-blur-md flex-1 text-center flex flex-col justify-center min-w-[150px]">
                              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1 flex items-center justify-center gap-2"><Flag size={12} /> Saldo Estadual</p>
                              <p className={`text-2xl font-black ${stats?.stateBalance! < 0 ? 'text-red-400' : 'text-blue-400'}`}>R$ {stats?.stateBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md flex-1 text-center flex flex-col justify-center min-w-[150px]">
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Saldo Total</p>
                              <p className={`text-2xl font-black ${stats?.balance! < 0 ? 'text-red-600' : 'text-white'}`}>R$ {stats?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-6 w-full flex-col lg:flex-row">
                            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md flex flex-col justify-center min-w-[200px] text-center lg:text-left">
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Saldo Geral Disponível</p>
                              <p className={`text-4xl font-black ${stats?.balance! < 0 ? 'text-red-500' : 'text-white'} tracking-tighter`}>
                                R$ {stats?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                              </p>
                            </div>
                            
                            {/* CUSTEIO CARD */}
                            {(() => {
                              const orcado = stats?.entriesCusteio || 0;
                              const gasto = stats?.expensesCusteio || 0;
                              const pct = orcado > 0 ? (gasto / orcado) * 100 : 0;
                              const saldoCusteio = orcado - gasto;
                              const color = pct >= 95 ? 'red' : pct >= 80 ? 'amber' : 'emerald';
                              
                              return (
                                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md flex-1 flex flex-col justify-center min-w-[250px]">
                                  <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full bg-${color}-500 ${pct >= 95 ? 'animate-pulse' : ''}`}></div>
                                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Limite Custeio</p>
                                    </div>
                                    <p className={`text-[10px] font-black ${saldoCusteio < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                      SALDO: R$ {(saldoCusteio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                  <div className="flex justify-between items-end mb-2">
                                    <p className="text-xl font-black text-white">R$ {(gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <div className="text-right">
                                      <p className="text-[9px] font-bold text-white/40 uppercase">Orçado: R$ {(orcado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                  </div>
                                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full bg-${color}-500 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                  </div>
                                  <div className="flex justify-between items-center mt-2">
                                    <p className={`text-[10px] font-black ${pct >= 95 ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>{pct.toFixed(1)}% Usado</p>
                                    {pct >= 95 && <div className="flex items-center gap-1 text-red-500"><AlertCircle size={10} /><span className="text-[8px] font-black uppercase">Estourando</span></div>}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* CAPITAL CARD */}
                            {(() => {
                              const orcado = stats?.entriesCapital || 0;
                              const gasto = stats?.expensesCapital || 0;
                              const pct = orcado > 0 ? (gasto / orcado) * 100 : 0;
                              const saldoCapital = orcado - gasto;
                              const color = pct >= 95 ? 'red' : pct >= 80 ? 'amber' : 'emerald';
                              
                              return (
                                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md flex-1 flex flex-col justify-center min-w-[250px]">
                                  <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full bg-${color}-500 ${pct >= 95 ? 'animate-pulse' : ''}`}></div>
                                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Limite Capital</p>
                                    </div>
                                    <p className={`text-[10px] font-black ${saldoCapital < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                      SALDO: R$ {(saldoCapital || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                  <div className="flex justify-between items-end mb-2">
                                    <p className="text-xl font-black text-white">R$ {(gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <div className="text-right">
                                      <p className="text-[9px] font-bold text-white/40 uppercase">Orçado: R$ {(orcado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                  </div>
                                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full bg-${color}-500 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                  </div>
                                  <div className="flex justify-between items-center mt-2">
                                    <p className={`text-[10px] font-black ${pct >= 95 ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>{pct.toFixed(1)}% Usado</p>
                                    {pct >= 95 && <div className="flex items-center gap-1 text-red-500"><AlertCircle size={10} /><span className="text-[8px] font-black uppercase">Estourando</span></div>}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-6 backdrop-blur-md">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><ArrowRightLeft className="text-blue-400" size={20} /> Livro Caixa</h3>
                          <div className="flex items-center gap-3">
                             {/* [NOVO] Barra de Filtros Rápida */}
                             <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 no-print">
                                <div className="relative">
                                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                                   <input 
                                      type="text" 
                                      placeholder="Fornecedor..." 
                                      value={filters.search}
                                      onChange={e => setFilters({...filters, search: e.target.value})}
                                      className="bg-transparent pl-9 pr-4 py-2 text-[10px] font-bold text-white outline-none w-32 focus:w-48 transition-all"
                                   />
                                </div>
                                <div className="relative border-l border-white/10">
                                   <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                                   <input 
                                      type="text" 
                                      placeholder="Nota..." 
                                      value={filters.invoice}
                                      onChange={e => setFilters({...filters, invoice: e.target.value})}
                                      className="bg-transparent pl-9 pr-4 py-2 text-[10px] font-bold text-white outline-none w-20 focus:w-32 transition-all"
                                   />
                                </div>
                                <div className="relative border-l border-white/10">
                                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                                   <input 
                                      type="date" 
                                      value={filters.date}
                                      onChange={e => setFilters({...filters, date: e.target.value})}
                                      className="bg-transparent pl-9 pr-4 py-2 text-[10px] font-bold text-white outline-none w-28 invert opacity-50 focus:opacity-100 transition-all"
                                   />
                                </div>
                                {(filters.search || filters.invoice || filters.value || filters.date) && (
                                   <button 
                                      onClick={() => setFilters({ search: '', invoice: '', value: '', date: '' })}
                                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                      title="Limpar Filtros"
                                   >
                                      <X size={14} />
                                   </button>
                                )}
                             </div>

                             <button onClick={() => {
                               setEditingTx(null);
                               setNewTx({ description: '', invoiceNumber: '', invoiceDate: '', value: '', type: 'EXPENSE', group: 'CUSTEIO', category: '', integratedAction: '', fundingSource: '', isFamilyAgriculture: false, isIndividualProducer: false, date: getLocalDateString(), time: getLocalTimeString() });
                               setIsModalOpen(true);
                             }} className={`px-6 py-2.5 ${funds[activeTab].color === 'purple' ? 'bg-purple-600' : funds[activeTab].color === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600'} text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:opacity-90 transition-all shadow-lg`}><Plus size={16} /> Novo Lançamento</button>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead><tr className="text-white/40 border-b border-white/5"><th className="px-6 py-4 font-black uppercase tracking-widest">Data Op.</th><th className="px-6 py-4 font-black uppercase tracking-widest">Descrição / NF</th><th className="px-6 py-4 font-black uppercase tracking-widest text-center">Grupo / AF</th><th className="px-6 py-4 font-black uppercase tracking-widest text-right">Valor</th><th className="px-6 py-4 font-black uppercase tracking-widest text-center">Docs</th></tr></thead>
                            <tbody className="divide-y divide-white/5">
                              {activeFundTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4 font-bold text-white/50">
                                    {t.date ? t.date.split('-').reverse().join('/') : ''}
                                    <span className="block text-[9px] opacity-50 mt-0.5">{t.time?.substring(0, 5)}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <p className="font-black text-white uppercase leading-tight">{t.description}</p>
                                      {t.invoiceNumber && <span className="bg-white/10 text-white/60 px-1.5 py-0.5 rounded text-[8px] font-black border border-white/10">NF: {t.invoiceNumber} {t.invoiceDate ? `(${t.invoiceDate.split('-').reverse().join('/')})` : ''}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1"><span className="text-[8px] text-white/30 font-bold uppercase">{t.category}</span>{t.integratedAction && <span className="text-[8px] bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded font-black uppercase border border-purple-500/20">{t.integratedAction}</span>}</div>
                                  </td>
                                  <td className="px-6 py-4 text-center space-y-1">
                                    <span className={`px-2 py-0.5 rounded font-black text-[7px] uppercase border ${t.group === 'CAPITAL' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-blue-500/10 text-blue-300 border-blue-500/20'}`}>{t.group}</span>
                                    {t.isFamilyAgriculture && <span className={`px-2 py-0.5 rounded font-black text-[7px] uppercase border ml-1 ${t.isIndividualProducer ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}`}>{t.isIndividualProducer ? '[AF-IND]' : '[AF-COOP]'}</span>}
                                  </td>
                                  <td className="px-6 py-4 text-right font-black"><span className={t.type === 'ENTRY' ? 'text-emerald-400' : 'text-red-400'}>R$ {(t.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingTx(t);
                                          setNewTx({
                                            description: t.description,
                                            invoiceNumber: t.invoiceNumber || '',
                                            invoiceDate: t.invoiceDate || '',
                                            value: t.value.toString(),
                                            type: t.type,
                                            group: t.group,
                                            category: t.category,
                                            integratedAction: t.integratedAction || '',
                                            fundingSource: t.fundingSource || '',
                                            isFamilyAgriculture: t.isFamilyAgriculture || false,
                                            isIndividualProducer: t.isIndividualProducer || false,
                                            date: t.date,
                                            time: t.time || ''
                                          });
                                          setIsModalOpen(true);
                                        }}
                                        className="p-2 bg-white/5 text-white/40 rounded-lg hover:bg-white/10 hover:text-white transition-all shadow-sm"
                                        title="Editar Lançamento"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTransaction(t.id)}
                                        className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                        title="Excluir Lançamento"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                      {t.receiptUrl ? (
                                        <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Visualizar Nota Fiscal">
                                          <FileText size={14} />
                                        </a>
                                      ) : (
                                        <span className="p-2 text-white/10" title="Sem Nota Anexada"><FileText size={14} /></span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 backdrop-blur-xl p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border border-white/10">
                        <div className="absolute top-0 right-0 p-10 opacity-10"><Zap size={180} /></div>
                        <div className="relative z-10 space-y-4">
                          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Visão Global<br />Financeira</h2>
                          <p className="text-blue-100/70 font-medium max-w-md">Controle centralizado com auditoria de conformidade SEDUC/FNDE.</p>
                        </div>
                        <div className="bg-white/10 p-8 rounded-3xl border border-white/10 backdrop-blur-sm text-center">
                          <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Saldo Disponível Total</p>
                          <h3 className="text-4xl font-black">R$ {(globalStats.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(Object.values(funds) as FundData[]).map((fund) => {
                          const s = getFundStats(fund);
                          const DashboardIcon = fund.icon;
                          if (!s) return null;
                          return (
                            <button key={fund.id} onClick={() => setActiveTab(fund.id as SubModuleType)} className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-lg hover:bg-white/10 transition-all text-left group">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${fund.color === 'blue' ? 'bg-blue-500/20 text-blue-400' : fund.color === 'purple' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
                                } text-white`}>
                                <DashboardIcon size={24} />
                              </div>
                              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{fund.name}</h4>
                              <p className="text-xl font-black text-white leading-none">R$ {(s.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'reports' && (
                    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                      {/* Cabeçalho da Aba de Relatórios */}
                      <div className="bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center shadow-inner border border-blue-500/20">
                            <Calculator size={40} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Prestação de Contas</h3>
                            <p className="text-white/50 font-bold text-xs uppercase tracking-widest mt-1">Consolidação para SIGPC & Auditoria Estadual</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button className="px-8 py-3 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-white/20 hover:scale-105 transition-all flex items-center gap-2 border border-white/5">
                            <Download size={14} /> Exportar SIGPC
                          </button>
                          <button className="px-8 py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600/30 hover:scale-105 transition-all flex items-center gap-2">
                            <Sprout size={14} /> Mapa de AF (PNAE)
                          </button>
                        </div>
                      </div>

                      {/* Relatório de Impostos Retidos - Lei 15.226/25 */}
                      <div className="bg-emerald-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10"><Percent size={180} /></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                              <Scale size={32} className="text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black uppercase tracking-widest">Retenções Tributárias AF</h3>
                              <p className="text-emerald-200/60 font-bold text-[10px] uppercase tracking-[0.2em]">Lei Estadual 15.226/25 (Produtor Individual)</p>
                            </div>
                          </div>
                          <div className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md text-center">
                            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">Total Retido no Exercício</p>
                             <h4 className="text-3xl font-black">R$ {(totalTaxAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                          </div>
                        </div>

                        <div className="relative z-10 bg-black/20 rounded-[2rem] border border-white/5 overflow-hidden">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-black/20 text-emerald-400">
                                <th className="px-8 py-4 font-black uppercase tracking-widest">Data</th>
                                <th className="px-8 py-4 font-black uppercase tracking-widest">Produtor / NF</th>
                                <th className="px-8 py-4 font-black uppercase tracking-widest text-center">Recurso</th>
                                <th className="px-8 py-4 font-black uppercase tracking-widest text-right">Bruto</th>
                                <th className="px-8 py-4 font-black uppercase tracking-widest text-right">Taxa (1,5%)</th>
                                <th className="px-8 py-4 font-black uppercase tracking-widest text-right">Valor Líquido</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {afTaxReport.length > 0 ? afTaxReport.map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-8 py-5 font-bold text-emerald-100 opacity-70">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                                  <td className="px-8 py-5">
                                    <p className="font-black text-white uppercase leading-none">{tx.description}</p>
                                    <p className="text-[9px] text-emerald-400 font-bold mt-1">NF: {tx.invoiceNumber}</p>
                                  </td>
                                  <td className="px-8 py-5 text-center">
                                    <span className="bg-white/10 text-white px-2 py-1 rounded text-[9px] font-black uppercase">{tx.fundName}</span>
                                  </td>
                                  <td className="px-8 py-5 text-right font-bold text-white/60 italic">R$ {(tx.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  <td className="px-8 py-5 text-right font-black text-emerald-400">- R$ {(tx.taxValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  <td className="px-8 py-5 text-right font-black text-white text-sm">R$ {(tx.netValue || tx.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              )) : (
                                <tr><td colSpan={6} className="py-12 text-center text-emerald-200/40 uppercase font-black text-[10px] tracking-[0.3em]">Nenhuma retenção registrada</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Histórico Consolidado de Notas Fiscais */}
                      <div className="bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/10 shadow-xl space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20"><ReceiptText size={20} /></div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Arquivo Digital de Notas Fiscais</h3>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="relative flex items-center bg-white/5 rounded-2xl border border-white/10 px-4">
                              <Search className="text-white/30" size={16} />
                              <input 
                                 type="text" 
                                 placeholder="Filtrar por NF ou fornecedor..." 
                                 value={filters.search}
                                 onChange={e => setFilters({...filters, search: e.target.value})}
                                 className="pl-4 pr-2 py-3 bg-transparent text-[10px] font-black uppercase outline-none w-64 text-white placeholder-white/20" 
                              />
                              {(filters.search || filters.invoice || filters.value || filters.date) && (
                                 <button onClick={() => setFilters({search: '', invoice: '', value: '', date: ''})} className="text-red-400 hover:text-red-300 ml-2">
                                    <X size={14} />
                                 </button>
                              )}
                            </div>
                            <div className="flex items-center bg-white/5 rounded-2xl border border-white/10 px-4">
                               <Calendar className="text-white/30" size={16} />
                               <input 
                                  type="date" 
                                  value={filters.date}
                                  onChange={e => setFilters({...filters, date: e.target.value})}
                                  className="bg-transparent pl-4 pr-2 py-3 text-[10px] font-black uppercase outline-none text-white invert opacity-50"
                               />
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="text-white/40 border-b border-white/5">
                                <th className="px-8 py-5 font-black uppercase tracking-widest">Emissão</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest">Número da Nota</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest">Descrição do Material</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest">Fonte / Recurso</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-right">Valor Bruto</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {allInvoices.length > 0 ? allInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-white/5 transition-all group">
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                      <Calendar size={14} className="text-white/30" />
                                      <span className="font-bold text-white/50">{new Date(inv.date).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className="bg-white/5 text-white/80 px-3 py-1 rounded-xl font-black border border-white/10 shadow-sm uppercase">
                                      {inv.invoiceNumber}
                                    </span>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                      <p className="font-black text-white uppercase leading-tight group-hover:text-blue-400 transition-colors">{inv.description}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">{inv.category}</p>
                                        {inv.isFamilyAgriculture && (
                                          <span className="bg-emerald-500/10 text-emerald-400 text-[7px] font-black px-1 py-0.5 rounded border border-emerald-500/20 uppercase">AF</span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${inv.fundColor === 'blue' ? 'bg-blue-500' :
                                        inv.fundColor === 'purple' ? 'bg-purple-500' :
                                          inv.fundColor === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                                        } shadow-sm shadow-white/10`}></div>
                                      <span className="text-[10px] font-black text-white/50 uppercase">{inv.fundName}</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                     <span className="font-black text-white text-sm">R$ {(inv.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                    {inv.receiptUrl ? (
                                      <a
                                        href={inv.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
                                      >
                                        <Download size={12} /> Ver PDF
                                      </a>
                                    ) : (
                                      <span className="text-white/10 text-[9px] font-black uppercase">Sem Anexo</span>
                                    )}
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={5} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                      <FileCheck size={64} className="text-white" />
                                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Nenhuma nota fiscal registrada no sistema</p>
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

                </>
              )}

            </div>
          </div>
        </main>
        <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); }
      `}</style>
      </div>
    </div>
  );
};

export default FinanceModule;

