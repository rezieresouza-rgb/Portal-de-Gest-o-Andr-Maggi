
import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  Sprout,
  AlertCircle,
  DollarSign,
  Plus,
  ShieldCheck,
  X,
  Check,
  Truck,
  TrendingUp,
  Wallet,
  Search,
  Filter,
  Calendar,
  Clock,
  PlusCircle,
  FilePlus,
  Save,
  Trash2,
  FileCheck,
  Printer,
  History,
  FileSearch,
  Zap,
  Edit3,
  PackageSearch,
  Package,
  BarChart3,
  CheckCircle2,
  Award,
  ChevronDown,
  ChevronUp,
  Percent,
  Coins,
  CheckSquare,
  Square,
  PieChart,
  Layers,
  Split
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ContractStatus, Contract, ContractItem } from '../types';
import SettlementDeclarationModal from './SettlementDeclarationModal';
import { INITIAL_CONTRACTS, INITIAL_SUPPLIERS } from '../constants/initialData';
import { extractContractInfo } from '../geminiService';

interface ExecutionEvent {
  id: string;
  contractId: string;
  type: 'DELIVERY' | 'ADITIVO' | 'AMENDMENT';
  date: string;
  description: string;
  value?: number;
  responsible: string;
}

const parseNumeric = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const formatQuantity = (val: number) => {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};



const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // Fetch Contracts and Events
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch Contracts with Suppliers and Items
      console.log('Fetching contracts...');
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          supplier:suppliers (id, name, full_name, cnpj, email, phone),
          items:contract_items (*)
        `);

      if (contractsError) throw contractsError;

      // Fetch Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('contract_events')
        .select('*');

      if (eventsError) throw eventsError;

      // Format Contracts
      const formattedContracts: Contract[] = contractsData.map((c: any) => ({
        id: c.id,
        number: c.number,
        supplierId: c.supplier_id,
        supplierName: c.supplier?.name || 'Desconhecido',
        supplierCnpj: c.supplier?.cnpj || '',
        supplierFullName: c.supplier?.full_name || '',
        startDate: c.start_date,
        endDate: c.end_date,
        status: c.status as ContractStatus,
        type: c.type,
        items: c.items.map((i: any) => ({
          id: i.id,
          description: i.description,
          contractedQuantity: i.contracted_quantity,
          acquiredQuantity: i.acquired_quantity,
          unit: i.unit,
          unitPrice: i.unit_price,
          brand: i.brand
        }))
      }));

      // Mapping Events
      const formattedEvents: ExecutionEvent[] = eventsData.map((e: any) => ({
        id: e.id,
        contractId: e.contract_id,
        type: e.type,
        date: e.date,
        description: e.description,
        value: e.value,
        responsible: e.responsible
      }));

      setContracts(formattedContracts);
      setEvents(formattedEvents);

      // Seeding Logic (if empty)
      if (formattedContracts.length === 0) {
        await seedDatabase();
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const seedDatabase = async () => {
    console.log("Seeding database...");
    // 1. Check/Seed Suppliers
    let { data: existingSuppliers } = await supabase.from('suppliers').select('id, name, cnpj');

    if (!existingSuppliers || existingSuppliers.length === 0) {
      for (const s of INITIAL_SUPPLIERS) {
        await supabase.from('suppliers').insert({
          name: s.name,
          full_name: s.full_name,
          cnpj: s.cnpj,
          email: s.email,
          phone: s.phone,
          category: s.category,
          score: s.score,
          location: s.location || 'COLÍDER/MT'
        });
      }
      const { data } = await supabase.from('suppliers').select('id, name, cnpj');
      existingSuppliers = data;
    }

    if (!existingSuppliers) return;

    // 2. Seed Contracts
    for (const c of INITIAL_CONTRACTS) {
      const supplier = existingSuppliers.find((s: any) => s.name === c.supplierName); // Match by name as IDs differ
      if (supplier) {
        const { data: newContract, error } = await supabase.from('contracts').insert({
          number: c.number,
          supplier_id: supplier.id,
          type: c.type,
          start_date: c.startDate,
          end_date: c.endDate,
          status: c.status
        }).select().single();

        if (newContract) {
          const itemsToInsert = c.items.map(i => ({
            contract_id: newContract.id,
            description: i.description,
            contracted_quantity: i.contractedQuantity,
            acquired_quantity: i.acquiredQuantity,
            unit: i.unit,
            unit_price: i.unitPrice,
            brand: i.brand
          }));
          await supabase.from('contract_items').insert(itemsToInsert);
        }
      }
    }
    // Refresh
    window.location.reload();
  };

  useEffect(() => {
    fetchData();
  }, []);



  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [mainViewMode, setMainViewMode] = useState<'contracts' | 'products'>('contracts');
  const [productStatusFilter, setProductStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'DEPLETED'>('ALL');

  const [deliveryModal, setDeliveryModal] = useState<{ contractId: string, itemId: string, description: string } | null>(null);
  const [deliveryQty, setDeliveryQty] = useState<number | "">("");

  const [aditivoModal, setAditivoModal] = useState<{ contractId: string, itemId: string, description: string } | null>(null);
  const [aditivoQty, setAditivoQty] = useState<number | "">("");

  const [outputModal, setOutputModal] = useState<{ contractId: string, itemId: string, description: string } | null>(null);
  const [outputQty, setOutputQty] = useState<number | "">("");

  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [availableSuppliers, setAvailableSuppliers] = useState<{ id: string, name: string, category: string }[]>([]);

  // Multi-item Delivery State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBatchDeliveryModal, setShowBatchDeliveryModal] = useState(false);
  const [batchDeliveryData, setBatchDeliveryData] = useState<Record<string, number>>({});
  const [orderNumber, setOrderNumber] = useState('');
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [generatedGuidePdf, setGeneratedGuidePdf] = useState<{ guide: any, items: any[] } | null>(null);

  // Edit Guide State
  const [editGuideModal, setEditGuideModal] = useState<any | null>(null);
  const [editBatchDeliveryData, setEditBatchDeliveryData] = useState<Record<string, number>>({});
  const [originalBatchDeliveryData, setOriginalBatchDeliveryData] = useState<Record<string, number>>({});
  const [editReceiptDate, setEditReceiptDate] = useState<string>('');
  const [editOrderNumber, setEditOrderNumber] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
  const [receiptDate, setReceiptDate] = useState<string>(getLocalDateString());

  // Guide History State
  const [paymentGuides, setPaymentGuides] = useState<any[]>([]);
  const [isLoadingGuides, setIsLoadingGuides] = useState(false);
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'LOG' | 'GUIDES' | 'EXTRACTS' | 'ORDERS'>('ITEMS');
  const [contractOrders, setContractOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState('');
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  
  // Consumption Statements State
  const [consumptionStatements, setConsumptionStatements] = useState<any[]>([]);
  const [isLoadingStatements, setIsLoadingStatements] = useState(false);
  const [previewExtract, setPreviewExtract] = useState<{ items: any[], guides: any[], totalValue: number } | null>(null);
  const [generatedStatementPdf, setGeneratedStatementPdf] = useState<{ statement: any, items: any[] } | null>(null);

  const [showExtractDateModal, setShowExtractDateModal] = useState(false);
  const [extractStartDate, setExtractStartDate] = useState("");
  const [extractEndDate, setExtractEndDate] = useState("");
  const [extractGuideNumbers, setExtractGuideNumbers] = useState("");
  const [paymentModal, setPaymentModal] = useState<{ statementId: string, paymentDate: string, invoiceNumber: string } | null>(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [selectedGuideIds, setSelectedGuideIds] = useState<Set<string>>(new Set());

  // Partial Extraction Configuration Types and State
  interface ExtractGuideItemConfig {
    id: string; // payment_guide_items.id
    contract_item_id: string;
    description: string;
    unit: string;
    brand?: string;
    unitPrice: number;
    originalQuantity: number;
    paidQuantity: number;
    subtotal: number;
  }

  interface ExtractGuideConfig {
    guideId: string;
    guide: any;
    selected: boolean;
    mode: 'TOTAL' | 'PARCIAL';
    percent: number;
    partialValue: number;
    isExpanded?: boolean;
    items: ExtractGuideItemConfig[];
  }

  const [extractGuideConfigs, setExtractGuideConfigs] = useState<ExtractGuideConfig[]>([]);
  const [isLoadingExtractConfig, setIsLoadingExtractConfig] = useState(false);
  const [extractSearchFilter, setExtractSearchFilter] = useState('');

  const handleOpenPaymentModal = (statement: any) => {
    setPaymentModal({
      statementId: statement.id,
      paymentDate: statement.payment_date ? statement.payment_date : getLocalDateString(),
      invoiceNumber: statement.invoice_number || ''
    });
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal || !selectedContractId) return;
    setIsSavingPayment(true);
    try {
      // 1. Get the statement to get its total value
      const { data: statement, error: fetchErr } = await supabase
        .from('consumption_statements')
        .select('*')
        .eq('id', paymentModal.statementId)
        .single();
      
      if (fetchErr) throw fetchErr;

      // 2. Update Statement status
      const { error } = await supabase
        .from('consumption_statements')
        .update({
          payment_date: paymentModal.paymentDate || null,
          invoice_number: paymentModal.invoiceNumber || null
        })
        .eq('id', paymentModal.statementId);

      if (error) throw error;

      // 3. Create Finance Transaction
      const { data: contract } = await supabase
        .from('contracts')
        .select('*, suppliers(name)')
        .eq('id', selectedContractId)
        .single();

      const { error: transError } = await supabase
        .from('transactions')
        .insert({
          gross_value: statement.total_value,
          net_value: statement.total_value,
          tax_value: 0,
          date: toISODateString(paymentModal.paymentDate),
          description: `PAGAMENTO: ${contract?.suppliers?.name || 'FORNECEDOR'} (NF ${paymentModal.invoiceNumber})`,
          type: 'EXPENSE',
          category: 'Alimentação',
          tx_group: 'CUSTEIO',
          fund_id: '4f4f3469-6f96-419b-8994-3e9196b05322', // ID fixo da Merenda
          created_at: toISODateString()
        });

      if (transError) console.error("Erro ao criar transação financeira:", transError.message);

      setPaymentModal(null);
      if (selectedContractId) fetchStatements(selectedContractId);
      alert("Pagamento registrado e lançado no financeiro com sucesso!");
    } catch (error: any) {
      alert("Erro ao registrar pagamento: " + error.message);
    } finally {
      setIsSavingPayment(false);
    }
  };

  useEffect(() => {
    supabase.from('suppliers').select('id, name, category').then(({ data }) => {
      if (data) setAvailableSuppliers(data);
    });
  }, []);

  const [newContractForm, setNewContractForm] = useState({
    number: '',
    supplierId: '',
    startDate: new Date().toLocaleDateString('sv-SE'),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE'),
    type: 'Pregão Presencial'
  });

  // AI Extraction State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPdf(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await extractContractInfo(base64, file.type);
        if (result && result.contractNumber) {
          setExtractedData(result);
        } else {
          alert("A IA não conseguiu identificar dados válidos neste arquivo.");
        }
        setIsProcessingPdf(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao processar PDF:", error);
      alert("Erro na leitura do arquivo.");
      setIsProcessingPdf(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!extractedData) return;

    try {
      setIsLoading(true);
      // 1. Resolve Supplier
      let supplierId = "";
      const { data: existingSuppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .or(`name.ilike.%${extractedData.supplierName}%,cnpj.eq.${extractedData.supplierCnpj || 'NONE'}`);

      if (existingSuppliers && existingSuppliers.length > 0) {
        supplierId = existingSuppliers[0].id;
      } else {
        // Create new supplier
        const { data: newSupplier, error: sError } = await supabase
          .from('suppliers')
          .insert({
            name: extractedData.supplierName,
            cnpj: extractedData.supplierCnpj || '',
            category: 'ALIMENTOS'
          })
          .select()
          .single();
        if (sError) throw sError;
        supplierId = newSupplier.id;
      }

      // 2. Create Contract
      const { data: newContract, error: cError } = await supabase
        .from('contracts')
        .insert({
          number: extractedData.contractNumber,
          supplier_id: supplierId,
          start_date: extractedData.startDate || new Date().toLocaleDateString('sv-SE'),
          end_date: extractedData.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE'),
          type: extractedData.type || 'Pregão Presencial',
          status: 'ATIVO'
        })
        .select(`*, supplier:suppliers(name)`)
        .single();

      if (cError) throw cError;

      // 3. Create Items
      if (extractedData.items && extractedData.items.length > 0) {
        const itemsToInsert = extractedData.items.map((i: any) => ({
          contract_id: newContract.id,
          description: i.description,
          contracted_quantity: parseNumeric(i.quantity),
          acquired_quantity: 0,
          unit: i.unit,
          unit_price: parseNumeric(i.unitPrice),
          brand: i.brand || ''
        }));
        await supabase.from('contract_items').insert(itemsToInsert);
      }

      await addExecutionEvent(newContract.id, 'AMENDMENT', `Contrato Importado via IA: ${newContract.number}`);

      // Update local state and finish
      setExtractedData(null);
      setIsImportModalOpen(false);
      await fetchData(); // Full refresh
      alert("Contrato importado e vinculado com sucesso!");

    } catch (error: any) {
      console.error(error);
      alert("Erro ao importar: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };



  const filteredContracts = useMemo(() => {
    let result = contracts;
    if (globalSearch) {
      const term = globalSearch.toLowerCase();
      result = result.filter(c =>
        c.number.toLowerCase().includes(term) ||
        c.supplierName.toLowerCase().includes(term) ||
        c.items.some(item => item.description.toLowerCase().includes(term))
      );
    }
    return result.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' }));
  }, [contracts, globalSearch]);

  const allProductsList = useMemo(() => {
    const list: Array<{
      contractId: string;
      contractNumber: string;
      supplierName: string;
      contractType: string;
      contractStatus: string;
      id: string;
      description: string;
      brand?: string;
      unit: string;
      unitPrice: number;
      contractedQuantity: number;
      acquiredQuantity: number;
      remainingQuantity: number;
      usagePercent: number;
      totalValue: number;
      spentValue: number;
    }> = [];

    contracts.forEach(c => {
      c.items.forEach(i => {
        const contracted = parseNumeric(i.contractedQuantity);
        const acquired = parseNumeric(i.acquiredQuantity);
        const remaining = Math.max(0, contracted - acquired);
        const usagePercent = contracted > 0 ? (acquired / contracted) * 100 : 0;
        const unitPrice = parseNumeric(i.unitPrice);
        const totalValue = contracted * unitPrice;
        const spentValue = acquired * unitPrice;

        list.push({
          contractId: c.id,
          contractNumber: c.number,
          supplierName: c.supplierName,
          contractType: c.type,
          contractStatus: c.status,
          id: i.id,
          description: i.description,
          brand: i.brand,
          unit: i.unit,
          unitPrice,
          contractedQuantity: contracted,
          acquiredQuantity: acquired,
          remainingQuantity: remaining,
          usagePercent,
          totalValue,
          spentValue
        });
      });
    });

    return list.sort((a, b) => a.description.localeCompare(b.description, 'pt-BR', { sensitivity: 'base' }));
  }, [contracts]);

  const filteredProductsList = useMemo(() => {
    return allProductsList.filter(p => {
      const matchesSearch = !globalSearch ||
        p.description.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(globalSearch.toLowerCase())) ||
        p.supplierName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.contractNumber.toLowerCase().includes(globalSearch.toLowerCase());

      let matchesStatus = true;
      if (productStatusFilter === 'AVAILABLE') {
        matchesStatus = p.remainingQuantity > 0;
      } else if (productStatusFilter === 'DEPLETED') {
        matchesStatus = p.remainingQuantity <= 0;
      }

      return matchesSearch && matchesStatus;
    });
  }, [allProductsList, globalSearch, productStatusFilter]);

  const selectedContract = useMemo(() =>
    contracts.find(c => c.id === selectedContractId),
    [selectedContractId, contracts]);

  const selectedEvents = useMemo(() =>
    events.filter(e => e.contractId === selectedContractId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [selectedContractId, events]);

  const filteredItems = useMemo(() => {
    if (!selectedContract) return [];
    if (!itemFilter) return selectedContract.items;
    const term = itemFilter.toLowerCase();
    return selectedContract.items.filter(item =>
      item.description.toLowerCase().includes(term)
    );
  }, [selectedContract, itemFilter]);

  const calculateContractStats = (contract: Contract) => {
    const totalValue = contract.items.reduce((acc, item) => acc + (item.contractedQuantity * item.unitPrice), 0);
    const totalSpent = contract.items.reduce((acc, item) => acc + (item.acquiredQuantity * item.unitPrice), 0);
    const remainingValue = totalValue - totalSpent;

    const today = new Date();
    const end = new Date(contract.endDate);
    const diffTime = end.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { totalValue, totalSpent, remainingValue, daysRemaining };
  };

  const addExecutionEvent = async (contractId: string, type: ExecutionEvent['type'], description: string, value?: number, customDateStr?: string) => {
    try {
      const eventDateISO = toISODateString(customDateStr);

      const { data, error } = await supabase.from('contract_events').insert({
        contract_id: contractId,
        type,
        description,
        value,
        responsible: 'Gestor da Merenda',
        date: eventDateISO
      }).select().single();

      if (error) throw error;

      setEvents(prev => [...prev, {
        id: data.id,
        contractId: data.contract_id,
        type: data.type,
        date: data.date,
        description: data.description,
        value: data.value,
        responsible: data.responsible
      }]);
    } catch (err) {
      console.error("Erro ao registrar evento:", err);
    }
  };

  const fetchContractOrders = async (contractId: string) => {
    try {
      setIsLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('contract_id', contractId)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setContractOrders(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar pedidos do contrato:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchPaymentGuides = async (contractId: string) => {
    try {
      setIsLoadingGuides(true);
      const { data, error } = await supabase
        .from('payment_guides')
        .select(`
          *,
          statement:consumption_statements(id, statement_number, payment_date, invoice_number)
        `)
        .eq('contract_id', contractId)
        .order('issue_date', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPaymentGuides(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar guias:", err);
    } finally {
      setIsLoadingGuides(false);
    }
  };

  const handleViewPastGuide = async (guide: any) => {
    try {
      setIsLoadingGuides(true);
      const { data, error } = await supabase
        .from('payment_guide_items')
        .select('*, item:contract_items(*)')
        .eq('guide_id', guide.id);

      if (error) throw error;

      const formattedItems = data.map((gi: any) => ({
        ...gi.item,
        quantity: gi.quantity,
        unitPrice: gi.unit_price,
        total: gi.total_item_value || gi.quantity * gi.unit_price
      }));

      setGeneratedGuidePdf({ guide, items: formattedItems });
    } catch (err) {
      console.error("Erro ao buscar detalhes da guia:", err);
      alert("Erro ao carregar detalhes da guia.");
    } finally {
      setIsLoadingGuides(false);
    }
  };

  const handleDeletePaymentGuide = async (guide: any) => {
    if (!window.confirm(`DESEJA REALMENTE EXCLUIR ESTA GUIA? \n\nIsto irá estornar o saldo dos produtos no contrato e registrar um log de cancelamento.`)) return;

    try {
      setIsLoadingGuides(true);

      // 1. Buscar itens desta guia para saber quanto estornar
      const { data: guideItems, error: itemsError } = await supabase
        .from('payment_guide_items')
        .select('*')
        .eq('guide_id', guide.id);

      if (itemsError) throw itemsError;

      // 2. Reverter os saldos no banco de dados
      for (const gi of guideItems) {
        // Buscar saldo atual para garantir precisão
        const { data: currentItem, error: fetchError } = await supabase
          .from('contract_items')
          .select('acquired_quantity')
          .eq('id', gi.contract_item_id)
          .single();

        if (fetchError) throw fetchError;

        const newQuantity = Math.max(0, (currentItem.acquired_quantity || 0) - gi.quantity);

        const { error: updateError } = await supabase
          .from('contract_items')
          .update({ acquired_quantity: newQuantity })
          .eq('id', gi.contract_item_id);

        if (updateError) throw updateError;
      }

      // 3. Excluir a guia (o cascade delete cuidará dos itens da guia no Supabase)
      const { error: deleteError } = await supabase
        .from('payment_guides')
        .delete()
        .eq('id', guide.id);

      if (deleteError) throw deleteError;

      // 4. Registrar o log do estorno
      await addExecutionEvent(guide.contract_id, 'DELIVERY', `⚠️ ESTORNO: Guia ${guide.guide_number} excluída e saldo devolvido`, -guide.total_value);

      // 5. Atualizar estado local dos contratos
      setContracts(prev => prev.map(c => {
        if (c.id !== guide.contract_id) return c;
        return {
          ...c,
          items: c.items.map(i => {
            const gi = guideItems.find(g => g.contract_item_id === i.id);
            if (!gi) return i;
            return {
              ...i,
              acquiredQuantity: Math.max(0, (i.acquiredQuantity || 0) - gi.quantity)
            };
          })
        };
      }));

      // 6. Recarregar lista de guias
      fetchPaymentGuides(guide.contract_id);
      alert("Estorno realizado com sucesso!");

    } catch (error: any) {
      alert("Erro ao estornar: " + error.message);
    } finally {
      setIsLoadingGuides(false);
    }
  };

  const fetchStatements = async (contractId: string) => {
    try {
      setIsLoadingStatements(true);
      const { data, error } = await supabase
        .from('consumption_statements')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsumptionStatements(data || []);
    } catch (err) {
      console.error("Erro ao buscar extratos:", err);
    } finally {
      setIsLoadingStatements(false);
    }
  };

  useEffect(() => {
    if (selectedContractId) {
      fetchPaymentGuides(selectedContractId);
      fetchStatements(selectedContractId);
      fetchContractOrders(selectedContractId);
      setActiveTab('ITEMS');
    }
  }, [selectedContractId]);

  const handleOpenExtractDateModal = async () => {
    if (!selectedContract) return;
    const pendingGuides = paymentGuides.filter(g => g.contract_id === selectedContract.id && !g.statement_id);
    if (pendingGuides.length === 0) {
      alert("Não há guias de recebimento pendentes para fechar um novo período de extrato.");
      return;
    }

    const dates = pendingGuides.map(g => g.issue_date).filter(Boolean).sort();
    let defaultStart = '';
    let defaultEnd = '';

    if (dates.length > 0) {
      defaultStart = dates[0];
      defaultEnd = dates[dates.length - 1];
    } else {
      const lastStatement = consumptionStatements[0];
      defaultStart = lastStatement ? lastStatement.period_end : selectedContract.startDate;
      defaultEnd = getLocalDateString();
    }

    setExtractStartDate(defaultStart);
    setExtractEndDate(defaultEnd);
    setExtractGuideNumbers('');
    setExtractSearchFilter('');
    setShowExtractDateModal(true);
    setIsLoadingExtractConfig(true);

    try {
      // Fetch items for all pending guides
      const { data: guideItemsData, error: itemsError } = await supabase
        .from('payment_guide_items')
        .select('*, item:contract_items(*)')
        .in('guide_id', pendingGuides.map(g => g.id));

      if (itemsError) throw itemsError;

      const itemsByGuide: Record<string, ExtractGuideItemConfig[]> = {};
      (guideItemsData || []).forEach((gi: any) => {
        if (!itemsByGuide[gi.guide_id]) itemsByGuide[gi.guide_id] = [];
        const unitPrice = Number(gi.unit_price) || 0;
        const qty = Number(gi.quantity) || 0;
        itemsByGuide[gi.guide_id].push({
          id: gi.id,
          contract_item_id: gi.contract_item_id,
          description: gi.item?.description || 'Item de Consumo',
          unit: gi.item?.unit || 'UN',
          brand: gi.item?.brand || '',
          unitPrice,
          originalQuantity: qty,
          paidQuantity: qty,
          subtotal: Math.round(qty * unitPrice * 100) / 100
        });
      });

      const configs: ExtractGuideConfig[] = pendingGuides.map(g => {
        const items = itemsByGuide[g.id] || [];
        const totalGuideVal = Math.round(items.reduce((s, it) => s + it.subtotal, 0) * 100) / 100 || Number(g.total_value) || 0;
        return {
          guideId: g.id,
          guide: g,
          selected: true,
          mode: 'TOTAL',
          percent: 100,
          partialValue: totalGuideVal,
          isExpanded: false,
          items: items
        };
      });

      setExtractGuideConfigs(configs);
    } catch (err: any) {
      console.error("Erro ao carregar detalhes das guias:", err);
      alert("Erro ao carregar itens das guias pendentes.");
    } finally {
      setIsLoadingExtractConfig(false);
    }
  };

  // Partial Extract Configuration Handlers
  const toggleGuideSelected = (guideId: string) => {
    setExtractGuideConfigs(prev => prev.map(cfg => 
      cfg.guideId === guideId ? { ...cfg, selected: !cfg.selected } : cfg
    ));
  };

  const handleSelectAllGuides = (selected: boolean) => {
    setExtractGuideConfigs(prev => prev.map(cfg => ({ ...cfg, selected })));
  };

  const handleGuideModeChange = (guideId: string, mode: 'TOTAL' | 'PARCIAL') => {
    setExtractGuideConfigs(prev => prev.map(cfg => {
      if (cfg.guideId !== guideId) return cfg;
      if (mode === 'TOTAL') {
        const items = cfg.items.map(it => ({
          ...it,
          paidQuantity: it.originalQuantity,
          subtotal: Math.round(it.originalQuantity * it.unitPrice * 100) / 100
        }));
        const totalVal = Math.round(items.reduce((s, it) => s + it.subtotal, 0) * 100) / 100 || Number(cfg.guide.total_value) || 0;
        return {
          ...cfg,
          mode: 'TOTAL',
          percent: 100,
          partialValue: totalVal,
          items
        };
      } else {
        // Default partial to 50% (Metade)
        const percent = 50;
        const items = cfg.items.map(it => {
          const paidQty = Math.round(it.originalQuantity * (percent / 100) * 1000) / 1000;
          return {
            ...it,
            paidQuantity: paidQty,
            subtotal: Math.round(paidQty * it.unitPrice * 100) / 100
          };
        });
        const partialVal = Math.round(items.reduce((s, it) => s + it.subtotal, 0) * 100) / 100;
        return {
          ...cfg,
          mode: 'PARCIAL',
          percent: 50,
          partialValue: partialVal,
          items
        };
      }
    }));
  };

  const handleGuidePercentChange = (guideId: string, percentInput: number) => {
    const clampedPercent = Math.max(0, Math.min(100, percentInput));
    setExtractGuideConfigs(prev => prev.map(cfg => {
      if (cfg.guideId !== guideId) return cfg;
      const items = cfg.items.map(it => {
        const paidQty = Math.round(it.originalQuantity * (clampedPercent / 100) * 1000) / 1000;
        return {
          ...it,
          paidQuantity: paidQty,
          subtotal: Math.round(paidQty * it.unitPrice * 100) / 100
        };
      });
      const partialVal = Math.round(items.reduce((s, it) => s + it.subtotal, 0) * 100) / 100;
      return {
        ...cfg,
        percent: clampedPercent,
        partialValue: partialVal,
        items
      };
    }));
  };

  const handleGuidePartialValueChange = (guideId: string, valueInput: number) => {
    setExtractGuideConfigs(prev => prev.map(cfg => {
      if (cfg.guideId !== guideId) return cfg;
      const originalTotal = cfg.items.reduce((s, it) => s + (it.originalQuantity * it.unitPrice), 0) || Number(cfg.guide.total_value) || 1;
      const clampedVal = Math.max(0, Math.min(originalTotal, valueInput));
      const factor = originalTotal > 0 ? (clampedVal / originalTotal) : 0;
      const percent = Math.round(factor * 100);

      const items = cfg.items.map(it => {
        const paidQty = Math.round(it.originalQuantity * factor * 1000) / 1000;
        return {
          ...it,
          paidQuantity: paidQty,
          subtotal: Math.round(paidQty * it.unitPrice * 100) / 100
        };
      });

      return {
        ...cfg,
        percent,
        partialValue: Math.round(clampedVal * 100) / 100,
        items
      };
    }));
  };

  const handleGuideItemQuantityChange = (guideId: string, itemId: string, qty: number) => {
    setExtractGuideConfigs(prev => prev.map(cfg => {
      if (cfg.guideId !== guideId) return cfg;
      const items = cfg.items.map(it => {
        if (it.id !== itemId) return it;
        const clampedQty = Math.max(0, Math.min(it.originalQuantity, qty));
        return {
          ...it,
          paidQuantity: clampedQty,
          subtotal: Math.round(clampedQty * it.unitPrice * 100) / 100
        };
      });
      const partialVal = Math.round(items.reduce((s, it) => s + it.subtotal, 0) * 100) / 100;
      const originalTotal = items.reduce((s, it) => s + (it.originalQuantity * it.unitPrice), 0) || 1;
      const percent = Math.round((partialVal / originalTotal) * 100);

      return {
        ...cfg,
        percent,
        partialValue: partialVal,
        items
      };
    }));
  };

  const toggleGuideExpanded = (guideId: string) => {
    setExtractGuideConfigs(prev => prev.map(cfg => 
      cfg.guideId === guideId ? { ...cfg, isExpanded: !cfg.isExpanded } : cfg
    ));
  };

  const handleGenerateExtract = () => {
    if (!selectedContract) return;

    if (!extractStartDate || !extractEndDate) {
      alert("Preencha as datas inicial e final para o extrato.");
      return;
    }
    if (extractStartDate > extractEndDate) {
      alert("A data inicial não pode ser superior à data final.");
      return;
    }

    const selectedConfigs = extractGuideConfigs.filter(cfg => cfg.selected && cfg.partialValue > 0);

    if (selectedConfigs.length === 0) {
      alert("Selecione ao menos uma guia de recebimento com valor maior que zero.");
      return;
    }

    // Consolidated item summary
    const itemSummaryMap: Record<string, any> = {};
    let totalExtractValue = 0;

    for (const cfg of selectedConfigs) {
      for (const it of cfg.items) {
        if (it.paidQuantity <= 0) continue;
        const itemId = it.contract_item_id;
        if (!itemSummaryMap[itemId]) {
          itemSummaryMap[itemId] = {
            id: it.contract_item_id,
            description: it.description,
            unit: it.unit,
            brand: it.brand,
            unitPrice: it.unitPrice,
            quantity: 0,
            total: 0
          };
        }
        itemSummaryMap[itemId].quantity += it.paidQuantity;
        itemSummaryMap[itemId].total += it.subtotal;
        totalExtractValue += it.subtotal;
      }
    }

    const guidesSummary = selectedConfigs.map(cfg => {
      const originalTotal = Math.round((cfg.items.reduce((s, it) => s + (it.originalQuantity * it.unitPrice), 0) || Number(cfg.guide.total_value) || 0) * 100) / 100;
      const remVal = Math.round(Math.max(0, originalTotal - cfg.partialValue) * 100) / 100;
      return {
        ...cfg.guide,
        originalValue: originalTotal,
        paidValue: cfg.partialValue,
        remainingValue: remVal,
        isPartial: cfg.mode === 'PARCIAL' && remVal > 0.01,
        percent: cfg.percent
      };
    });

    setShowExtractDateModal(false);
    setPreviewExtract({
      items: Object.values(itemSummaryMap).sort((a: any, b: any) => (a.description || '').localeCompare(b.description || '')),
      guides: guidesSummary,
      totalValue: Math.round(totalExtractValue * 100) / 100,
      selectedConfigs: selectedConfigs
    } as any);
  };

  const handleConfirmExtract = async () => {
    if (!selectedContract || !previewExtract) return;

    try {
      setIsLoadingStatements(true);
      const statementNumber = `EXT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const periodStart = extractStartDate;
      const periodEnd = extractEndDate;

      // 1. Create consumption statement
      const { data: newStatement, error: statementError } = await supabase
        .from('consumption_statements')
        .insert({
          contract_id: selectedContract.id,
          statement_number: statementNumber,
          period_start: periodStart,
          period_end: periodEnd,
          total_value: previewExtract.totalValue
        })
        .select()
        .single();

      if (statementError) throw statementError;

      // 2. Process each included guide
      const selectedConfigs = (previewExtract as any).selectedConfigs as ExtractGuideConfig[];

      for (const cfg of selectedConfigs) {
        const isPartial = cfg.mode === 'PARCIAL' && cfg.percent < 100;
        const originalTotal = Math.round((cfg.items.reduce((s, it) => s + (it.originalQuantity * it.unitPrice), 0) || Number(cfg.guide.total_value) || 0) * 100) / 100;
        const remVal = Math.round(Math.max(0, originalTotal - cfg.partialValue) * 100) / 100;

        if (!isPartial || remVal <= 0.01) {
          // Total payment for this guide
          const { error: updateError } = await supabase
            .from('payment_guides')
            .update({ statement_id: newStatement.id })
            .eq('id', cfg.guideId);

          if (updateError) throw updateError;
        } else {
          // Partial payment:
          // A) Update current guide with paid portion
          const baseGuideNum = cfg.guide.guide_number.replace(/\s*\(Parcial[^)]*\)/g, '').replace(/\s*\(Saldo[^)]*\)/g, '').trim();
          const paidGuideNumber = `${baseGuideNum} (Parcial ${cfg.percent}%)`;

          const { error: updateOrigError } = await supabase
            .from('payment_guides')
            .update({
              statement_id: newStatement.id,
              total_value: cfg.partialValue,
              guide_number: paidGuideNumber
            })
            .eq('id', cfg.guideId);

          if (updateOrigError) throw updateOrigError;

          // Update items of original guide to paid quantities
          for (const it of cfg.items) {
            if (it.paidQuantity > 0) {
              await supabase
                .from('payment_guide_items')
                .update({ quantity: it.paidQuantity })
                .eq('id', it.id);
            } else {
              await supabase
                .from('payment_guide_items')
                .delete()
                .eq('id', it.id);
            }
          }

          // B) Create new guide for the remaining balance
          const remGuideNumber = `${baseGuideNum} (Saldo)`;

          const { data: remGuide, error: remError } = await supabase
            .from('payment_guides')
            .insert({
              contract_id: selectedContract.id,
              guide_number: remGuideNumber,
              order_number: cfg.guide.order_number || null,
              total_value: remVal,
              status: 'GERADA',
              issue_date: cfg.guide.issue_date,
              statement_id: null // Available for next extracts!
            })
            .select()
            .single();

          if (remError) throw remError;

          // Insert remaining items into the new guide
          for (const it of cfg.items) {
            const remQty = Math.round((it.originalQuantity - it.paidQuantity) * 1000) / 1000;
            if (remQty > 0) {
              await supabase
                .from('payment_guide_items')
                .insert({
                  guide_id: remGuide.id,
                  contract_item_id: it.contract_item_id,
                  quantity: remQty,
                  unit_price: it.unitPrice
                });
            }
          }

          // Execution Event
          await addExecutionEvent(
            selectedContract.id,
            'DELIVERY',
            `Fechamento Parcial: Guia ${cfg.guide.guide_number} quitada em R$ ${cfg.partialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${cfg.percent}%). Saldo remanescente de R$ ${remVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} transferido para guia ${remGuideNumber}.`,
            0,
            cfg.guide.issue_date
          );
        }
      }

      alert("Extrato de Consumo gerado e salvo com sucesso!");

      const itemsToPrint = previewExtract.items;
      const guidesToPrint = (previewExtract.guides || []).map((g: any) => ({
        guide_number: g.isPartial ? `${g.guide_number} (Parcial ${g.percent}%)` : g.guide_number,
        order_number: g.order_number,
        issue_date: g.issue_date,
        total_value: g.paidValue || g.total_value,
        original_value: g.originalValue,
        is_partial: g.isPartial,
        remaining_value: g.remainingValue
      }));

      setPreviewExtract(null);
      await fetchStatements(selectedContract.id);
      await fetchPaymentGuides(selectedContract.id);

      setGeneratedStatementPdf({
        statement: newStatement,
        items: itemsToPrint,
        guides: guidesToPrint
      });

    } catch (error: any) {
      console.error("Erro ao salvar extrato:", error);
      alert("Erro ao salvar extrato: " + error.message);
    } finally {
      setIsLoadingStatements(false);
    }
  };

  const handleDeleteStatement = async (statement: any) => {
    if (!window.confirm(`ATENÇÃO: Você tem certeza que deseja excluir o Extrato ${statement.statement_number}?\nAs guias associadas a ele voltarão a ficar disponíveis para um novo extrato.`)) {
      return;
    }
    try {
      setIsLoadingStatements(true);

      // Find guides attached to this statement
      const { data: attachedGuides } = await supabase
        .from('payment_guides')
        .select('*')
        .eq('statement_id', statement.id);

      // If any guide was partial and has an unlinked (Saldo) guide, merge them back
      if (attachedGuides && attachedGuides.length > 0) {
        for (const ag of attachedGuides) {
          if (ag.guide_number && ag.guide_number.includes('(Parcial')) {
            const baseGuideNum = ag.guide_number.replace(/\s*\(Parcial[^)]*\)/g, '').trim();
            const { data: remGuides } = await supabase
              .from('payment_guides')
              .select('*')
              .eq('contract_id', ag.contract_id)
              .is('statement_id', null)
              .like('guide_number', `${baseGuideNum}%(Saldo)%`);

            if (remGuides && remGuides.length > 0) {
              const remGuide = remGuides[0];
              const { data: remItems } = await supabase
                .from('payment_guide_items')
                .select('*')
                .eq('guide_id', remGuide.id);

              if (remItems) {
                for (const ri of remItems) {
                  const { data: origItem } = await supabase
                    .from('payment_guide_items')
                    .select('*')
                    .eq('guide_id', ag.id)
                    .eq('contract_item_id', ri.contract_item_id)
                    .single();

                  if (origItem) {
                    await supabase
                      .from('payment_guide_items')
                      .update({ quantity: origItem.quantity + ri.quantity })
                      .eq('id', origItem.id);
                  } else {
                    await supabase
                      .from('payment_guide_items')
                      .insert({
                        guide_id: ag.id,
                        contract_item_id: ri.contract_item_id,
                        quantity: ri.quantity,
                        unit_price: ri.unit_price
                      });
                  }
                }
              }

              // Update original guide total_value and restore name
              await supabase
                .from('payment_guides')
                .update({
                  total_value: Number(ag.total_value) + Number(remGuide.total_value),
                  guide_number: baseGuideNum,
                  statement_id: null
                })
                .eq('id', ag.id);

              // Delete remaining guide
              await supabase
                .from('payment_guides')
                .delete()
                .eq('id', remGuide.id);

              continue;
            }
          }
        }
      }

      const { error: guidesUpdateError } = await supabase
        .from('payment_guides')
        .update({ statement_id: null })
        .eq('statement_id', statement.id);
      
      if (guidesUpdateError) throw guidesUpdateError;

      const { error: delError } = await supabase
        .from('consumption_statements')
        .delete()
        .eq('id', statement.id);
      
      if (delError) throw delError;

      alert("Extrato excluído com sucesso!");
      if (selectedContractId) {
        fetchStatements(selectedContractId);
        fetchPaymentGuides(selectedContractId);
      }
    } catch (error: any) {
      alert("Erro ao excluir extrato: " + error.message);
    } finally {
      setIsLoadingStatements(false);
    }
  };

  const handleViewPastStatement = async (statement: any) => {
    try {
      setIsLoadingStatements(true);
      const { data: guides, error: guidesError } = await supabase
        .from('payment_guides')
        .select('id, guide_number, issue_date, total_value, created_at, order_number')
        .eq('statement_id', statement.id)
        .order('issue_date', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: true });

      if (guidesError) throw guidesError;

      const guideIds = guides.map((g: any) => g.id);
      if (guideIds.length === 0) {
        setGeneratedStatementPdf({ statement, items: [] });
        return;
      }

      const { data: guideItems, error: itemsError } = await supabase
        .from('payment_guide_items')
        .select('*, item:contract_items(*)')
        .in('guide_id', guideIds);

      if (itemsError) throw itemsError;

      const itemSummaryMap: Record<string, any> = {};
      for (const gi of guideItems) {
        const itemId = gi.contract_item_id;
        if (!itemSummaryMap[itemId]) {
          itemSummaryMap[itemId] = {
            ...gi.item,
            quantity: 0,
            total: 0
          };
        }
        itemSummaryMap[itemId].quantity += gi.quantity;
        itemSummaryMap[itemId].total += (gi.quantity * gi.unit_price);
      }

      setGeneratedStatementPdf({ 
        statement, 
        items: Object.values(itemSummaryMap).sort((a,b) => (a.description || '').localeCompare(b.description || '')),
        guides: guides
      });

    } catch (e) {
      console.error(e);
      alert("Erro ao buscar detalhes do extrato.");
    } finally {
      setIsLoadingStatements(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    // We need to fetch the supplier to get the ID from the selected ID (which is currently the ID from the select box)
    // In our new flow, the select box should use the ID from the fetched suppliers. 
    // Wait, the select box currently uses INITIAL_SUPPLIERS (mapped in JSX). I need to change that to use fetched suppliers.
    // For now, I will assume the select value is the UUID if I change the select options.
    // But I haven't changed the select options yet. I will do that in the next step.

    if (!newContractForm.supplierId) return alert("Selecione um fornecedor.");

    try {
      const { data: newContract, error } = await supabase.from('contracts').insert({
        number: newContractForm.number.toUpperCase(),
        supplier_id: newContractForm.supplierId,
        start_date: newContractForm.startDate,
        end_date: newContractForm.endDate,
        type: newContractForm.type,
        status: 'ATIVO'
      }).select(`*, supplier:suppliers(name)`).single();

      if (error) throw error;

      const formattedContract: Contract = {
        id: newContract.id,
        number: newContract.number,
        supplierId: newContract.supplier_id,
        supplierName: newContract.supplier?.name || 'Desconhecido',
        startDate: newContract.start_date,
        endDate: newContract.end_date,
        status: newContract.status as ContractStatus,
        type: newContract.type,
        items: []
      };

      setContracts([formattedContract, ...contracts]);
      await addExecutionEvent(newContract.id, 'AMENDMENT', `Lançamento de Contrato: ${newContract.number}`);
      setIsNewContractModalOpen(false);
      setSelectedContractId(newContract.id);

    } catch (error: any) {
      alert("Erro ao criar contrato: " + error.message);
    }
  };

  const handleConfirmAditivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aditivoModal || aditivoQty === "" || Number(aditivoQty) <= 0) return;

    try {
      const contract = contracts.find(c => c.id === aditivoModal.contractId);
      const item = contract?.items.find(i => i.id === aditivoModal.itemId);
      if (!contract || !item) return;

      const numericAditivo = parseNumeric(aditivoQty);
      if (numericAditivo <= 0) return alert("Informe uma quantidade válida.");

      const newQty = item.contractedQuantity + numericAditivo;
      const impact = numericAditivo * item.unitPrice;

      const { error } = await supabase
        .from('contract_items')
        .update({ contracted_quantity: newQty })
        .eq('id', item.id);

      if (error) throw error;

      // Update local state
      setContracts(prev => prev.map(c => {
        if (c.id !== aditivoModal.contractId) return c;
        return {
          ...c,
          items: c.items.map(i => {
            if (i.id !== aditivoModal.itemId) return i;
            return { ...i, contractedQuantity: newQty };
          })
        };
      }));

      await addExecutionEvent(aditivoModal.contractId, 'ADITIVO', `Aditivo: +${aditivoQty} ${aditivoModal.description}`, impact);
      setAditivoModal(null);
      setAditivoQty("");
      alert("Termo aditivo registrado com sucesso!");

    } catch (error: any) {
      alert("Erro ao registrar aditivo: " + error.message);
    }
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryModal || deliveryQty === "" || Number(deliveryQty) <= 0) return;

    try {
      const contract = contracts.find(c => c.id === deliveryModal.contractId);
      const item = contract?.items.find(i => i.id === deliveryModal.itemId);
      if (!contract || !item) return;

      const numericDelivery = parseNumeric(deliveryQty);
      if (numericDelivery <= 0) return alert("Informe uma quantidade válida.");

      const impact = numericDelivery * item.unitPrice;

      await addExecutionEvent(deliveryModal.contractId, 'DELIVERY', `Recebimento Avulso: ${deliveryQty} un de ${deliveryModal.description} (Não altera o saldo do contrato)`, impact);
      setDeliveryModal(null);
      setDeliveryQty("");
      alert("Recebimento avulso registrado apenas no log (saldo do contrato inalterado).");

    } catch (error: any) {
      alert("Erro ao registrar entrega: " + error.message);
    }
  };

  const handleConfirmOutput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outputModal || outputQty === "" || Number(outputQty) <= 0) return;

    try {
      const contract = contracts.find(c => c.id === outputModal.contractId);
      const item = contract?.items.find(i => i.id === outputModal.itemId);
      if (!contract || !item) return;

      const numericOutput = parseNumeric(outputQty);
      if (numericOutput <= 0) return alert("Informe uma quantidade válida.");

      const impact = numericOutput * item.unitPrice;

      await addExecutionEvent(outputModal.contractId, 'DELIVERY', `Saída Manual: ${outputQty} ${item.unit} de ${outputModal.description} (Não altera o saldo do contrato)`, impact);
      setOutputModal(null);
      setOutputQty("");
      alert("Saída de estoque registrada apenas no log (saldo do contrato inalterado).");

    } catch (error: any) {
      alert("Erro ao registrar saída: " + error.message);
    }
  };

  const handleConfirmBatchDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(batchDeliveryData).length === 0) return;
    if (!selectedContractId) return;

    setIsSavingBatch(true);
    try {
      const contract = contracts.find(c => c.id === selectedContractId);
      if (!contract) throw new Error("Contrato não encontrado.");

      const guideNumber = `PAG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const totalValue = Math.round(Object.entries(batchDeliveryData).reduce((sum, [itemId, qty]) => {
        const item = contract.items.find(i => i.id === itemId);
        return sum + ((qty as number) * ((item?.unitPrice as number) || 0));
      }, 0) * 100) / 100;

      // 1. Create Payment Guide
      const { data: guide, error: guideError } = await supabase
        .from('payment_guides')
        .insert({
          contract_id: selectedContractId,
          guide_number: guideNumber,
          order_number: orderNumber || null,
          total_value: totalValue,
          status: 'GERADA',
          issue_date: toISODateString(receiptDate)
        })
        .select()
        .single();

      if (guideError) throw guideError;

      // 2. Prepare Items and Update Stock
      const guideItems = [];
      for (const [itemId, qty] of Object.entries(batchDeliveryData)) {
        if ((qty as number) <= 0) continue;
        const item = contract.items.find(i => i.id === itemId);
        if (!item) continue;

        const newAcquired = item.acquiredQuantity + qty;

        // Update DB
        const { error: itemUpdateError } = await supabase
          .from('contract_items')
          .update({ acquired_quantity: newAcquired })
          .eq('id', item.id);

        if (itemUpdateError) throw itemUpdateError;

        // Add to Guide Items
        const { error: guideItemError } = await supabase
          .from('payment_guide_items')
          .insert({
            guide_id: guide.id,
            contract_item_id: item.id,
            quantity: qty,
            unit_price: item.unitPrice
          });

        if (guideItemError) throw guideItemError;

        guideItems.push({
          ...item,
          quantity: qty,
          total: Math.round((qty as number) * (item.unitPrice as number) * 100) / 100
        });

        // Add to Execution Events
        await addExecutionEvent(selectedContractId, 'DELIVERY', `Recebimento: ${qty} ${item.unit} de ${item.description}`, (qty as number) * (item.unitPrice as number), receiptDate);
      }

      // 3. Update Local State
      setContracts(prev => prev.map(c => {
        if (c.id !== selectedContractId) return c;
        return {
          ...c,
          items: c.items.map(i => {
            const delivered = batchDeliveryData[i.id];
            if (!delivered) return i;
            return { ...i, acquiredQuantity: i.acquiredQuantity + delivered };
          })
        };
      }));

      // 4. Set for PDF Generation
      setGeneratedGuidePdf({ guide, items: guideItems });

      alert("Guia de Recebimento gerada com sucesso!");
      setShowBatchDeliveryModal(false);
      setBatchDeliveryData({});
      setOrderNumber('');
      setReceiptDate(getLocalDateString());

      // Refresh guides list
      if (selectedContractId) fetchPaymentGuides(selectedContractId);

    } catch (error: any) {
      alert("Erro ao gerar guia: " + error.message);
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleOpenEditGuide = async (guide: any) => {
    try {
      setIsLoadingGuides(true);
      const { data: items, error } = await supabase
        .from('payment_guide_items')
        .select('*')
        .eq('guide_id', guide.id);
      
      if (error) throw error;

      const itemsMap: Record<string, number> = {};
      items.forEach((i: any) => {
        itemsMap[i.contract_item_id] = i.quantity;
      });

      setOriginalBatchDeliveryData(itemsMap);
      setEditBatchDeliveryData({ ...itemsMap });
      setEditReceiptDate(guide.issue_date || getLocalDateString());
      setEditOrderNumber(guide.order_number || '');
      setEditGuideModal(guide);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao abrir edição da guia.");
    } finally {
      setIsLoadingGuides(false);
    }
  };

  const handleSaveEditGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGuideModal || !selectedContractId) return;

    setIsSavingEdit(true);
    try {
      const contract = contracts.find(c => c.id === selectedContractId);
      if (!contract) throw new Error("Contrato não encontrado.");

      let newTotalValue = 0;
      const guideItemsToUpsert = [];
      const guideItemsToDelete = [];
      let itemsUpdatedCount = 0;

      for (const item of contract.items) {
        const oldQty = originalBatchDeliveryData[item.id] || 0;
        const newQty = editBatchDeliveryData[item.id] || 0;
        const delta = newQty - oldQty;

        if (newQty > 0) {
          newTotalValue += newQty * item.unitPrice;
          guideItemsToUpsert.push({
            guide_id: editGuideModal.id,
            contract_item_id: item.id,
            quantity: newQty,
            unit_price: item.unitPrice
          });
        } else if (oldQty > 0 && newQty === 0) {
          guideItemsToDelete.push(item.id);
        }

        if (delta !== 0) {
          const newAcquired = Math.max(0, item.acquiredQuantity + delta);
          const { error: itemUpdateError } = await supabase
            .from('contract_items')
            .update({ acquired_quantity: newAcquired })
            .eq('id', item.id);
          if (itemUpdateError) throw itemUpdateError;
          itemsUpdatedCount++;
        }
      }

      if (guideItemsToDelete.length > 0) {
        const { error: delError } = await supabase
          .from('payment_guide_items')
          .delete()
          .eq('guide_id', editGuideModal.id)
          .in('contract_item_id', guideItemsToDelete);
        if (delError) throw delError;
      }

      for (const gi of guideItemsToUpsert) {
        await supabase
          .from('payment_guide_items')
          .delete()
          .eq('guide_id', gi.guide_id)
          .eq('contract_item_id', gi.contract_item_id);
          
        const { error: insError } = await supabase
          .from('payment_guide_items')
          .insert(gi);
        if (insError) throw insError;
      }

      const { error: guideUpdateError } = await supabase
        .from('payment_guides')
        .update({
          total_value: newTotalValue,
          issue_date: toISODateString(editReceiptDate),
          order_number: editOrderNumber || null
        })
        .eq('id', editGuideModal.id);

      if (guideUpdateError) throw guideUpdateError;

      if (itemsUpdatedCount > 0 || editReceiptDate !== editGuideModal.issue_date) {
        await addExecutionEvent(selectedContractId, 'ADITIVO', `Edição de Guia: ${editGuideModal.guide_number}`, newTotalValue - editGuideModal.total_value, editReceiptDate);
      }

      setContracts(prev => prev.map(c => {
        if (c.id !== selectedContractId) return c;
        return {
          ...c,
          items: c.items.map(i => {
            const oldQty = originalBatchDeliveryData[i.id] || 0;
            const newQty = editBatchDeliveryData[i.id] || 0;
            const delta = newQty - oldQty;
            if (delta === 0) return i;
            return { ...i, acquiredQuantity: Math.max(0, i.acquiredQuantity + delta) };
          })
        };
      }));

      fetchPaymentGuides(selectedContractId);
      setEditGuideModal(null);
      alert("Guia atualizada com sucesso!");

    } catch (error: any) {
      alert("Erro ao salvar edição: " + error.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDownloadGuidePdf = async () => {
    if (!generatedGuidePdf) return;
    const element = document.getElementById('payment-guide-printable');
    if (!element) return;

    try {
      await (window as any).html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `Guia_Recebimento_${generatedGuidePdf.guide.guide_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save();

      setGeneratedGuidePdf(null);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF.");
    }
  };

  const handlePrintGuide = () => {
    const element = document.getElementById('guide-printable');
    if (!element) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Guia</title>
          <style>${styles}</style>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              #guide-printable { scale: 1 !important; border: none !important; box-shadow: none !important; transform: none !important; margin: 0 auto !important; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
          <div id="guide-printable" style="width: 210mm; min-height: 297mm; padding: 12mm; background: white;">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadConsumptionPdf = async () => {
    const element = document.getElementById('consumption-statement-printable');
    if (!element) return;

    try {
      await (window as any).html2pdf().set({
        margin: [8, 8, 8, 8],
        filename: `Extrato_Consumo_${selectedContract?.number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'], 
          avoid: ['tr', '.avoid-break', 'tfoot', 'thead', '.guide-row'] 
        }
      }).from(element).save();

      setGeneratedStatementPdf(null);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF.");
    }
  };

  const stats = selectedContract ? calculateContractStats(selectedContract) : null;
  const { totalValue, totalSpent, remainingValue, daysRemaining } = stats || { totalValue: 0, totalSpent: 0, remainingValue: 0, daysRemaining: 0 };
  const timeProgress = stats ? Math.min(100, Math.max(0, (365 - stats.daysRemaining) / 3.65)) : 0;

  const statementItemsTotal = (generatedStatementPdf?.items || []).reduce((acc: number, item: any) => acc + (Number(item.total) || 0), 0);
  const statementDisplayTotal = statementItemsTotal > 0 ? statementItemsTotal : (generatedStatementPdf?.statement?.total_value || 0);

  const isContractFulfilled = useMemo(() => {
    if (!selectedContract || !selectedContract.items || selectedContract.items.length === 0) return false;
    const allItemsDelivered = selectedContract.items.every(i => i.acquiredQuantity >= i.contractedQuantity);
    const financialFullySpent = totalSpent >= totalValue && totalValue > 0;
    return allItemsDelivered || financialFullySpent || selectedContract.status === ContractStatus.COMPLETED;
  }, [selectedContract, totalSpent, totalValue]);

  return (
    <div className="min-h-screen bg-transparent">



      {selectedContract && stats ? (
        <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <button
            onClick={() => { setSelectedContractId(null); setItemFilter(''); setSelectedItems(new Set()); }}
            className="flex items-center gap-2 text-emerald-700 font-black uppercase text-xs tracking-widest hover:text-emerald-800 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar para lista
          </button>

          <button
            onClick={handleOpenExtractDateModal}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Printer size={16} /> Gerar Extrato de Consumo
          </button>
        </div>













        {isContractFulfilled && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-emerald-400/30 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
                <Award size={32} className="text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-400 text-emerald-950 text-[9px] font-black uppercase rounded-full tracking-wider">
                    100% Executado
                  </span>
                  <h3 className="text-lg font-black uppercase tracking-tight">Contrato Cumprido na Íntegra</h3>
                </div>
                <p className="text-xs font-medium text-emerald-100 mt-0.5">
                  Todas as metas deste contrato foram atendidas. A Declaração Oficial de Quitação de Débitos já pode ser emitida.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSettlementModalOpen(true)}
              className="w-full md:w-auto px-6 py-3.5 bg-white text-emerald-900 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-2.5 active:scale-95"
            >
              <FileCheck size={18} className="text-emerald-700" />
              Emitir Declaração de Quitação
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">Contrato {selectedContract.number}</h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${selectedContract.type.includes('Agric') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{selectedContract.type}</span>
                </div>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{selectedContract.supplierName}</p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black ${daysRemaining < 30 ? 'text-red-600' : 'text-gray-900'}`}>{daysRemaining} Dias</p>
                <p className="text-[10px] text-gray-400 font-black uppercase">Vigência Restante</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Global</p>
                <p className="text-xl font-black text-gray-900 leading-none">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Executado</p>
                <p className="text-xl font-black text-emerald-700 leading-none">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Saldo Disponível</p>
                <p className="text-xl font-black text-blue-700 leading-none">R$ {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> Cronologia Financeira</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase"><span>Tempo Decorrido</span><span>{timeProgress.toFixed(0)}%</span></div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${timeProgress}%` }} /></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase"><span>Gasto Financeiro</span><span>{((totalSpent / totalValue) * 100).toFixed(0)}%</span></div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: `${(totalSpent / totalValue) * 100}%` }} /></div>
              </div>
            </div>
            <div className="mt-6">
              <button onClick={() => window.print()} className="w-full py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-black transition-all">
                <Printer size={14} /> Imprimir Ficha de Fiscalização
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-200/50 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('ITEMS')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ITEMS' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Itens do Contrato
          </button>
          <button
            onClick={() => {
            setActiveTab('ORDERS');
            if (selectedContractId) fetchContractOrders(selectedContractId);
          }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ORDERS' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Pedidos de Compra ({contractOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('GUIDES')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'GUIDES' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Guia de Recebimento ({paymentGuides.length})
          </button>
          <button
            onClick={() => setActiveTab('LOG')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LOG' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Log de Execução
          </button>
          <button
            onClick={() => setActiveTab('EXTRACTS')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'EXTRACTS' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Extratos de Consumo ({consumptionStatements.length})
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className={`xl:col-span-2 space-y-6 ${activeTab !== 'ITEMS' ? 'hidden' : ''}`}>
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-6">
                  <h3 className="text-lg font-black text-gray-900 uppercase flex items-center gap-2 whitespace-nowrap"><ShoppingBag size={20} className="text-emerald-600" /> Planilha de Itens</h3>
                  <div className="relative w-64 md:w-80 no-print">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input type="text" placeholder="Pesquisar produto..." value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white transition-all" />
                  </div>
                </div>
                <div className="flex items-center gap-3 no-print">
                  <button onClick={() => setShowBatchDeliveryModal(true)} disabled={Object.keys(batchDeliveryData).length === 0} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale ring-4 ring-emerald-500/20">
                    <FileCheck size={18} /> Confirmar Lançamentos ({Object.keys(batchDeliveryData).length})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-gray-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                      <th className="px-6 py-4 w-32 text-center bg-emerald-50 text-emerald-700 shadow-inner">Qtd. Receber</th>
                      <th className="px-6 py-4">Item (Descrição / Marca)</th>
                      <th className="px-6 py-4 text-center">Valor Unitário</th>
                      <th className="px-6 py-4 text-center">Saldo Restante</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredItems.map(item => {
                      const remaining = item.contractedQuantity - item.acquiredQuantity;
                      const usage = (item.acquiredQuantity / item.contractedQuantity) * 100;
                      return (
                        <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${selectedItems.has(item.id) ? 'bg-emerald-50/30' : ''}`}>
                          <td className="px-6 py-5 text-center bg-emerald-50/10">
                            <input
                              key={`qty-${item.id}-${batchDeliveryData[item.id] || 0}`}
                              type="text"
                              defaultValue={batchDeliveryData[item.id] ? formatQuantity(batchDeliveryData[item.id]) : ''}
                               onBlur={(e) => {
                                  const val = parseNumeric(e.target.value);
                                  setBatchDeliveryData(prev => {
                                    const next = { ...prev };
                                    if (val > 0) {
                                      next[item.id] = val;
                                    } else {
                                      delete next[item.id];
                                    }
                                    return next;
                                  });
                                }}
                              placeholder="0,000"
                              className="w-full text-center border border-emerald-200 bg-white p-2.5 rounded-xl text-sm font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner placeholder-gray-300"
                            />
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-[11px] font-black text-gray-900 uppercase leading-tight">{item.description}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{item.brand ? `Marca: ${item.brand}` : 'Marca Original'}</p>
                          </td>
                          <td className="px-6 py-5 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-xl text-xs font-black shadow-xs">
                              R$ {(item.unitPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-bold text-emerald-600 ml-1">/ {item.unit}</span>
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col items-center">
                              <span className={`text-[10px] font-bold mb-1 ${remaining < 0 ? 'text-red-600 font-black' : 'text-gray-500'}`}>{formatQuantity(remaining)} / {formatQuantity(item.contractedQuantity)}</span>
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50"><div className={`h-full transition-all duration-1000 ${usage > 90 || remaining < 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(0, usage))}%` }} /></div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setAditivoModal({ contractId: selectedContract.id, itemId: item.id, description: item.description })} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Aditivo"><FilePlus size={14} /></button>
                              <button onClick={() => setDeliveryModal({ contractId: selectedContract.id, itemId: item.id, description: item.description })} className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 shadow-sm" title="Receber Gêneros"><Truck size={12} /> Receber</button>
                              <button onClick={() => setOutputModal({ contractId: selectedContract.id, itemId: item.id, description: item.description })} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 shadow-sm" title="Saída de Estoque"><TrendingUp size={12} className="rotate-180" /> Saída</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>


          {/* ABA: PEDIDOS DE COMPRA DO CONTRATO */}
          <div className={`xl:col-span-2 space-y-6 ${activeTab !== 'ORDERS' ? 'hidden' : ''}`}>
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Pedidos de Compra Emitidos</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Ordens de fornecimento vinculadas a este contrato ({contractOrders.length} pedidos)
                    </p>
                  </div>
                </div>

                <div className="relative w-full md:w-72 no-print">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input
                    type="text"
                    placeholder="Filtrar por nº ou produto..."
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* KPI RESUMO DOS PEDIDOS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total de Pedidos</p>
                  <p className="text-2xl font-black text-gray-900">{contractOrders.length}</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Valor Total dos Pedidos</p>
                  <p className="text-2xl font-black text-indigo-700">
                    R$ {contractOrders.reduce((acc, o) => acc + (Number(o.total_value) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Média por Pedido</p>
                  <p className="text-2xl font-black text-emerald-700">
                    R$ {contractOrders.length > 0
                      ? (contractOrders.reduce((acc, o) => acc + (Number(o.total_value) || 0), 0) / contractOrders.length).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '0,00'}
                  </p>
                </div>
              </div>

              {isLoadingOrders ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Carregando pedidos do contrato...</p>
                </div>
              ) : contractOrders.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                  <ShoppingBag size={48} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm font-black text-gray-400 uppercase">Nenhum pedido de compra gerado para este contrato</p>
                  <p className="text-xs text-gray-400 mt-1">Os pedidos gerados na Lista de Compras aparecerão listados aqui automaticamente.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        <th className="py-3 px-4">Nº do Pedido</th>
                        <th className="py-3 px-4">Data Emissão</th>
                        <th className="py-3 px-4">Previsão Entrega</th>
                        <th className="py-3 px-4 text-center">Itens</th>
                        <th className="py-3 px-4 text-right">Valor do Pedido</th>
                        <th className="py-3 px-4 text-center">Status / Recebimento</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {contractOrders
                        .filter(o => {
                          if (!orderFilter) return true;
                          const term = orderFilter.toLowerCase();
                          const matchNum = (o.order_number || '').toLowerCase().includes(term);
                          const matchItems = (o.order_items || []).some((i: any) => (i.description || '').toLowerCase().includes(term));
                          return matchNum || matchItems;
                        })
                        .map(order => {
                          const linkedGuide = paymentGuides.find(g => (g.order_number || '').trim() === (order.order_number || '').trim());

                          return (
                            <tr key={order.id} className="hover:bg-indigo-50/20 transition-all group">
                              <td className="py-4 px-4 font-black text-gray-900 uppercase">
                                <span className="px-2.5 py-1 bg-gray-100 group-hover:bg-indigo-100 text-gray-800 group-hover:text-indigo-800 rounded-lg text-xs font-black transition-all">
                                  #{order.order_number || 'S/N'}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-bold text-gray-600 text-xs">
                                {order.issue_date ? new Date(order.issue_date + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}
                              </td>
                              <td className="py-4 px-4 font-bold text-gray-500 text-xs">
                                {order.delivery_date ? new Date(order.delivery_date + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-black text-[10px] rounded-md uppercase">
                                  {(order.order_items || []).length} itens
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right font-black text-indigo-700 text-sm">
                                R$ {(Number(order.total_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-center">
                                {linkedGuide ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[9px] font-black uppercase shadow-sm">
                                    <CheckCircle2 size={11} className="text-emerald-600" /> Recebido ({linkedGuide.guide_number})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[9px] font-black uppercase">
                                    <Clock size={11} className="text-amber-500" /> Aguardando Entrega
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <button
                                  onClick={() => setViewingOrder(order)}
                                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-1.5 ml-auto active:scale-95"
                                  title="Ver Itens do Pedido"
                                >
                                  <FileSearch size={14} /> Ver Itens
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className={`xl:col-span-2 space-y-6 ${activeTab !== 'GUIDES' ? 'hidden' : ''}`}>
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <FileCheck size={20} className="text-emerald-600" /> Histórico de Lançamentos
                </h3>
              </div>

              {isLoadingGuides ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Carregando histórico...</p>
                </div>
              ) : paymentGuides.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                        <th className="px-6 py-4">Nº da Guia</th>
                        <th className="px-6 py-4">Nº do Pedido</th>
                        <th className="px-6 py-4">Data de Emissão</th>
                        <th className="px-6 py-4">Data do Recebimento</th>
                        <th className="px-6 py-4">Status / Extrato</th>
                        <th className="px-6 py-4 text-right">Valor Total</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentGuides.map((guide) => (
                        <tr key={guide.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-gray-900 text-xs uppercase">{guide.guide_number}</p>
                              {guide.guide_number && guide.guide_number.includes('(Parcial') && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-black uppercase rounded-md flex items-center gap-1">
                                  <Split size={9} /> Parcial
                                </span>
                              )}
                              {guide.guide_number && guide.guide_number.includes('(Saldo') && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded-md flex items-center gap-1">
                                  <Coins size={9} /> Saldo Remanescente
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-gray-600 text-xs uppercase">{guide.order_number || '-'}</p>
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-gray-500 text-xs">{new Date(guide.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-gray-500 text-xs">{guide.issue_date ? new Date(guide.issue_date + "T12:00:00").toLocaleDateString('pt-BR') : '-'}</p>
                          </td>
                          <td className="px-6 py-5">
                            {!guide.statement ? (
                              <span className="px-2 py-1 bg-gray-100 text-gray-400 text-[8px] font-black uppercase rounded-md">Disponível</span>
                            ) : guide.statement.payment_date ? (
                              <div className="flex flex-col gap-1">
                                <span className="w-fit px-2 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded-md">Pago</span>
                                <span className="text-[7px] font-black text-gray-400 uppercase leading-none">{guide.statement.statement_number}</span>
                                <span className="text-[7px] font-black text-emerald-600 uppercase leading-none">NF: {guide.statement.invoice_number}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="w-fit px-2 py-1 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded-md">Em Extrato</span>
                                <span className="text-[7px] font-black text-gray-400 uppercase leading-none">{guide.statement.statement_number}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right font-black text-emerald-700 text-xs">
                            R$ {guide.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-5 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleViewPastGuide(guide)}
                              className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all inline-flex items-center gap-2"
                              title="Visualizar Guia"
                            >
                              <FileSearch size={14} />
                            </button>
                            <button
                              onClick={() => handleOpenEditGuide(guide)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Editar Guia"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletePaymentGuide(guide)}
                              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Excluir Guia / Estornar Saldo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50">
                  <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <FileSearch size={32} className="text-emerald-300" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase mb-2">Nenhuma guia gerada ainda</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase max-w-xs mx-auto leading-relaxed">
                    Para realizar um lançamento e gerar uma guia de recebimento, selecione os produtos na aba <span className="text-emerald-600">"Itens do Contrato"</span> e clique no botão verde <span className="text-emerald-600">"Registrar Entrega em Lote"</span>.
                  </p>
                  <button
                    onClick={() => setActiveTab('ITEMS')}
                    className="mt-6 px-6 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    Ir para Planilha de Itens
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`xl:col-span-2 space-y-6 ${activeTab !== 'EXTRACTS' ? 'hidden' : ''}`}>
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-600" /> Histórico de Extratos
                </h3>
              </div>

              {isLoadingStatements ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Carregando histórico...</p>
                </div>
              ) : consumptionStatements.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                        <th className="px-6 py-4">Nº do Extrato</th>
                        <th className="px-6 py-4">Período</th>
                        <th className="px-6 py-4 text-center">Pagamento</th>
                        <th className="px-6 py-4 text-right">Valor Total</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {consumptionStatements.map((statement) => (
                        <tr key={statement.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <p className="font-black text-gray-900 text-xs uppercase">{statement.statement_number}</p>
                            <p className="font-bold text-gray-500 text-[9px] mt-1 uppercase">Emissão: {new Date(statement.created_at).toLocaleDateString('pt-BR')}</p>
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-gray-500 text-xs uppercase">{new Date(statement.period_start + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(statement.period_end + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                          </td>
                          <td className="px-6 py-5">
                            {statement.payment_date ? (
                              <div>
                                <p className="font-bold text-emerald-600 text-[10px] uppercase">Pago: {new Date(statement.payment_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                <p className="font-black text-gray-900 text-xs mt-0.5">NF: {statement.invoice_number}</p>
                              </div>
                            ) : (
                              <p className="font-bold text-red-500 text-[10px] uppercase bg-red-50 inline-block px-2 py-1 rounded-md">Pendente</p>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right font-black text-indigo-700 text-xs">
                            R$ {statement.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenPaymentModal(statement)}
                                className="px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-black uppercase hover:bg-amber-600 hover:text-white transition-all inline-flex items-center gap-2"
                                title="Registrar Nota / Pagamento"
                              >
                                <Wallet size={14} /> Registrar Pgto
                              </button>
                              <button
                                onClick={() => handleViewPastStatement(statement)}
                                className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center gap-2"
                                title="Visualizar Extrato"
                              >
                                <FileSearch size={14} /> Ver Extrato
                              </button>
                              <button
                                onClick={() => handleDeleteStatement(statement)}
                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                title="Excluir Extrato"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50">
                  <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <TrendingUp size={32} className="text-indigo-300" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase mb-2">Nenhum extrato gerado</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase max-w-xs mx-auto leading-relaxed">
                    Para fechar um período e gerar o extrato de consumo, clique no botão <span className="text-indigo-600">"Gerar Extrato de Consumo"</span> no topo da página.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className={`xl:col-span-2 space-y-6 ${activeTab !== 'LOG' ? 'hidden' : ''}`}>
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <History size={20} className="text-indigo-600" /> Log de Execução Completo
                </h3>
              </div>
              <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                {selectedEvents.length > 0 ? selectedEvents.map(evt => (
                  <div key={evt.id} className="relative pl-12">
                    <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center border-4 border-white shadow-sm z-10 ${evt.type === 'DELIVERY' ? 'bg-emerald-500 text-white' :
                      evt.type === 'ADITIVO' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-white'
                      }`}>
                      {evt.type === 'DELIVERY' ? <Truck size={14} /> :
                        evt.type === 'ADITIVO' ? <FilePlus size={14} /> : <Zap size={14} />}
                    </div>
                    <div>
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-gray-900 uppercase leading-none">{evt.description}</p>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">{new Date(evt.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {evt.value !== undefined && (
                        <p className="text-[10px] font-black text-indigo-600 mt-1">Impacto: R$ {evt.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      )}
                      <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">Resp: {evt.responsible}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center opacity-20">
                    <FileSearch size={48} className="mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase">Nenhum evento registrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    ) : (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Gestão de Contratos</h2>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Base Auditada 2026</span>
              </div>
            </div>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Controle fiscal, vigência e saldos por item</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-80 no-print">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input type="text" placeholder="Nº Contrato, Produto ou Fornecedor..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] font-black text-sm uppercase shadow-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <button onClick={() => setIsImportModalOpen(true)} className="p-4 bg-emerald-100 text-emerald-700 rounded-[1.5rem] hover:bg-emerald-200 transition-all shadow-lg flex items-center gap-3 group border border-emerald-200">
              <Zap size={24} className="group-hover:scale-110 transition-transform fill-emerald-500" />
              <span className="hidden md:block text-xs font-black uppercase tracking-widest">Importar PDF</span>
            </button>
            <button onClick={() => setIsNewContractModalOpen(true)} className="p-4 bg-gray-900 text-white rounded-[1.5rem] hover:bg-black transition-all shadow-xl flex items-center gap-3 group">
              <FilePlus size={24} className="group-hover:scale-110 transition-transform" />
              <span className="hidden md:block text-xs font-black uppercase tracking-widest">Novo Contrato</span>
            </button>
          </div>
        </div>

        {/* Toggle between Contracts view and Products Consolidate view */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-3xl border border-gray-100 shadow-sm no-print">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setMainViewMode('contracts')}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                mainViewMode === 'contracts'
                  ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText size={16} /> Visão por Contratos ({filteredContracts.length})
            </button>
            <button
              onClick={() => setMainViewMode('products')}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                mainViewMode === 'products'
                  ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <PackageSearch size={16} /> Busca por Produto / Consumo ({filteredProductsList.length})
            </button>
          </div>

          {mainViewMode === 'products' && (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:inline">Filtrar Saldo:</span>
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              >
                <option value="ALL">Todos os Produtos</option>
                <option value="AVAILABLE">Com Saldo Disponível</option>
                <option value="DEPLETED">Saldo Esgotado</option>
              </select>
            </div>
          )}
        </div>

        {mainViewMode === 'contracts' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContracts.map(contract => {
              const { totalValue, totalSpent, daysRemaining } = calculateContractStats(contract);
              const usagePercent = (totalSpent / totalValue) * 100;
              return (
                <div key={contract.id} onClick={() => setSelectedContractId(contract.id)} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-emerald-300 hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between h-80">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl ${contract.type.includes('Agric') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} transition-transform group-hover:scale-110`}>
                        {contract.type.includes('Agric') ? <Sprout size={28} /> : <FileText size={28} />}
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${(daysRemaining as number) < 60 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                          {daysRemaining < 0 ? 'Vencido' : `${daysRemaining} Dias`}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 uppercase leading-tight mb-1">Contrato {contract.number}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{contract.supplierName}</p>

                    <div className="mt-8 space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-gray-400">Execução Financeira</span>
                        <span className={usagePercent > 90 ? 'text-red-600' : 'text-emerald-600'}>{usagePercent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        <div className={`h-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${usagePercent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-gray-300 uppercase mb-0.5">Saldo Disponível</p>
                      <p className="text-sm font-black text-gray-900">R$ {(totalValue - totalSpent).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="p-2 bg-gray-50 text-gray-400 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Package size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Itens</p>
                  <p className="text-xl font-black text-gray-900">{allProductsList.length} Produtos</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Com Saldo Ativo</p>
                  <p className="text-xl font-black text-blue-900">{allProductsList.filter(p => p.remainingQuantity > 0).length} Itens</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Esgotado</p>
                  <p className="text-xl font-black text-red-900">{allProductsList.filter(p => p.remainingQuantity <= 0).length} Itens</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <DollarSign size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Já Gasto</p>
                  <p className="text-xl font-black text-purple-900">
                    R$ {allProductsList.reduce((acc, p) => acc + p.spentValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Consolidated Products Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Consumo & Saldo Consolidado por Produto</h3>
                  <p className="text-xs text-gray-500 font-bold tracking-tight">Quantidades contratadas vs. adquiridas/utilizadas em todos os contratos ativos</p>
                </div>
                {globalSearch && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 uppercase">
                    Filtro: "{globalSearch}" ({filteredProductsList.length})
                  </span>
                )}
              </div>

              {filteredProductsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="py-4 px-6">Produto & Marca</th>
                        <th className="py-4 px-6">Contrato & Fornecedor</th>
                        <th className="py-4 px-6 text-right">Qtd Contratada</th>
                        <th className="py-4 px-6 text-right">Qtd Utilizada / Adquirida</th>
                        <th className="py-4 px-6 text-right">Saldo Restante</th>
                        <th className="py-4 px-6 text-center">% Consumido</th>
                        <th className="py-4 px-6 text-right">Preço Unit. / Total Gasto</th>
                        <th className="py-4 px-6 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                      {filteredProductsList.map((p) => {
                        const isDepleted = p.remainingQuantity <= 0;
                        const isHighUsage = p.usagePercent >= 80;

                        return (
                          <tr key={`${p.contractId}-${p.id}`} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-black text-gray-900 uppercase text-sm">{p.description}</div>
                              {p.brand && (
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Marca: {p.brand}</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-black text-emerald-800 uppercase">CT {p.contractNumber}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[180px]">{p.supplierName}</div>
                            </td>
                            <td className="py-4 px-6 text-right font-black text-gray-700">
                              {formatQuantity(p.contractedQuantity)} <span className="text-[10px] text-gray-400">{p.unit}</span>
                            </td>
                            <td className="py-4 px-6 text-right font-black text-emerald-600 bg-emerald-50/50 rounded-xl">
                              {formatQuantity(p.acquiredQuantity)} <span className="text-[10px] text-emerald-700">{p.unit}</span>
                            </td>
                            <td className="py-4 px-6 text-right font-black">
                              <span className={isDepleted ? 'text-red-600 font-black' : 'text-gray-900'}>
                                {formatQuantity(p.remainingQuantity)} <span className="text-[10px] text-gray-400">{p.unit}</span>
                              </span>
                              {isDepleted && (
                                <div className="text-[9px] font-black text-red-600 uppercase tracking-tight">Esgotado</div>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-[11px] font-black ${isDepleted ? 'text-red-600' : isHighUsage ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {p.usagePercent.toFixed(1)}%
                                </span>
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                                  <div
                                    className={`h-full ${isDepleted ? 'bg-red-500' : isHighUsage ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(100, p.usagePercent)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="font-bold text-gray-500">R$ {p.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / {p.unit}</div>
                              <div className="font-black text-gray-900">Total: R$ {p.spentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => setSelectedContractId(p.contractId)}
                                className="px-3 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 mx-auto"
                              >
                                Ir p/ Contrato <ChevronRight size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center text-gray-400">
                  <PackageSearch size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="font-black text-sm uppercase">Nenhum produto encontrado</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">Tente pesquisar por outro nome de alimento ou alterar os filtros.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    )
  }

  {/* REGISTRAR PAGAMENTO MODAL */}
  {paymentModal && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 bg-indigo-600 border-b border-indigo-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-sm">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Registrar Pgto</h3>
              <p className="text-[9px] text-indigo-200 font-bold uppercase tracking-widest mt-0.5">Vincular Nota Fiscal</p>
            </div>
          </div>
          <button onClick={() => setPaymentModal(null)}><X size={20} className="text-white hover:text-indigo-200 transition-colors" /></button>
        </div>
        <form onSubmit={handleSavePayment} className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data do Pagamento</label>
            <input
              type="date"
              required
              value={paymentModal.paymentDate}
              onChange={(e) => setPaymentModal({ ...paymentModal, paymentDate: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número da Nota Fiscal</label>
            <input
              type="text"
              required
              placeholder="Ex: NF 12345"
              value={paymentModal.invoiceNumber}
              onChange={(e) => setPaymentModal({ ...paymentModal, invoiceNumber: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingPayment}
            className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isSavingPayment ? "Salvando..." : <><Save size={16} /> Salvar Pagamento</>}
          </button>
        </form>
      </div>
    </div>
  )}

  {/* NOVO CONTRATO MODAL */}
  {isNewContractModalOpen && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-lg"><FilePlus size={24} /></div>
            <h3 className="text-2xl font-black text-gray-900 uppercase">Novo Contrato Administrativo</h3>
          </div>
          <button onClick={() => setIsNewContractModalOpen(false)}><X size={24} className="text-gray-300" /></button>
        </div>
        <form onSubmit={handleCreateContract} className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase">Número do Contrato / Processo</label>
            <input required value={newContractForm.number} onChange={e => setNewContractForm({ ...newContractForm, number: e.target.value })} placeholder="Ex: 015/2026/SEDUC" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase">Fornecedor Ganhador (Licitante)</label>
            <select required value={newContractForm.supplierId} onChange={e => setNewContractForm({ ...newContractForm, supplierId: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase">
              <option value="">Selecione...</option>
              {availableSuppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase">Início Vigência</label><input type="date" value={newContractForm.startDate} onChange={e => setNewContractForm({ ...newContractForm, startDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase">Término Vigência</label><input type="date" value={newContractForm.endDate} onChange={e => setNewContractForm({ ...newContractForm, endDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" /></div>
          </div>
          <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl hover:bg-emerald-700 transition-all">Iniciar Monitoramento Contratual</button>
        </form>
      </div>
    </div>
  )}

  {/* IMPORTAR CONTRATO VIA IA MODAL */}
  {isImportModalOpen && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-lg relative overflow-hidden">
              <Zap size={24} className="relative z-10" />
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter">Importar Contrato via IA</h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Extração automática de PDF de Licitação ou Ata</p>
            </div>
          </div>
          <button onClick={() => { setIsImportModalOpen(false); setExtractedData(null); }}><X size={24} className="text-gray-300 hover:text-red-500 transition-colors" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {!extractedData ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center border-4 border-dashed border-emerald-100 rounded-[3rem] bg-emerald-50/30">
              {isProcessingPdf ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 border-8 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-black text-emerald-800 uppercase animate-pulse">A Inteligência Artificial está lendo o documento...</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Aguarde extração de itens e vigências</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-sm">
                  <div className="p-8 bg-white rounded-full shadow-lg mx-auto w-32 h-32 flex items-center justify-center">
                    <FileSearch size={48} className="text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-emerald-900 uppercase">Selecione o PDF do Contrato</h4>
                    <p className="text-xs text-emerald-600 font-medium mt-2 leading-relaxed">Nossa IA irá identificar o número, fornecedor, datas e todos os itens registrados.</p>
                  </div>
                  <label className="block">
                    <span className="sr-only">Choose file</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      className="block w-full text-sm text-emerald-500 file:mr-4 file:py-3 file:px-8 file:rounded-2xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 transition-all cursor-pointer"
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {/* Contenido de extractedData omitido por brevedad en el resumen, pero incluido en el archivo real */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contrato Extraído</label>
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase text-gray-900">{extractedData.contractNumber}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fornecedor Identificado</label>
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase text-emerald-700">{extractedData.supplierName}</div>
                </div>
              </div>
              <button
                onClick={handleConfirmImport}
                className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
              >
                <Save size={24} /> Confirmar Importação
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )}
  {/* RELOCATED INNER MODALS */}
  {generatedGuidePdf && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative z-[9999] shadow-2xl">
        <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl"><FileCheck size={28} /></div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Guia de Recebimento Gerada</h3>
              <p className="text-[10px] font-bold uppercase opacity-80">Documento oficial de entrada de mercadorias</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrintGuide} className="px-6 py-3 bg-white text-emerald-700 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-emerald-50 transition-all">
              <Printer size={16} /> Imprimir Guia
            </button>
            <button onClick={() => setGeneratedGuidePdf(null)} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-gray-50 text-gray-900">
          <div id="guide-printable" className="bg-white p-12 shadow-sm border border-gray-100 mx-auto max-w-[210mm] min-h-[297mm] text-gray-900 font-sans flex flex-col scale-90 origin-top">
            <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
              <div className="flex items-center gap-6">
                <img src="/logo-escola.png" alt="Logo Escola" className="w-24 h-auto" />
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI</h2>
                  <p className="text-[9px] font-black text-gray-600 uppercase">CDCE DA ESC. EST. DE ENS. FUN. ANDRÉ A. MAGGI</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">CNPJ: 11.906.357/0001-50</p>
                  <p className="text-[8px] font-medium text-gray-400 uppercase mt-0.5">Avenida Borba Gato, nº 80, Colíder-MT - CEP 78500-000</p>
                  <p className="text-[8px] font-medium text-indigo-600 uppercase mt-0.5">escola.153830@edu.mt.gov.br | 66 996648410 (whatsApp)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Guia de Recebimento</p>
                <h1 className="text-3xl font-black text-gray-900">{generatedGuidePdf.guide.guide_number}</h1>
                {generatedGuidePdf.guide.order_number && (
                  <p className="text-[11px] font-black text-gray-900 uppercase mt-1">Pedido: {generatedGuidePdf.guide.order_number}</p>
                )}
                <p className="text-[10px] font-black text-indigo-600 uppercase mt-1">Emissão: {new Date(generatedGuidePdf.guide.created_at).toLocaleDateString('pt-BR')}</p>
                <p className="text-[10px] font-black text-indigo-600 uppercase mt-1">Recebimento: {new Date(generatedGuidePdf.guide.issue_date + "T12:00:00").toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Fornecedor / Contratada</p>
                <p className="text-sm font-black text-gray-900 uppercase truncate leading-tight">{selectedContract.supplierName}</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Contrato: {selectedContract.number}</p>
              </div>
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Valor Total do Recebimento</p>
                <p className="text-2xl font-black text-emerald-700">R$ {(generatedGuidePdf.guide.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 text-[9px] font-black uppercase text-gray-500 text-left">
                  <th className="py-3 pr-4">Produto</th>
                  <th className="py-3 px-4 text-center">Un.</th>
                  <th className="py-3 px-4 text-center">Marca</th>
                  <th className="py-3 px-4 text-center">Quant.</th>
                  <th className="py-3 px-4 text-right">Preço Un.</th>
                  <th className="py-3 pl-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {generatedGuidePdf.items.map((item, idx) => (
                  <tr key={idx} className="text-[9px]">
                    <td className="py-4 pr-4 font-bold uppercase leading-tight">{item.description}</td>
                    <td className="py-4 px-4 text-center text-gray-500 font-bold uppercase">{item.unit}</td>
                    <td className="py-4 px-4 text-center font-bold text-gray-400">{item.brand || '-'}</td>
                    <td className="py-4 px-4 text-center font-black text-emerald-700">{formatQuantity(item.quantity || 0)}</td>
                    <td className="py-4 px-4 text-right font-bold text-gray-600">{(item.unitPrice || item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-4 pl-4 text-right font-black text-emerald-700">{(item.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={5} className="py-4 pr-4 text-right font-black uppercase text-gray-900 text-xs">Valor Total (R$)</td>
                  <td className="py-4 pl-4 text-right font-black text-emerald-700 text-xs">{(generatedGuidePdf.guide.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-auto pt-20 border-t-2 border-gray-100">
              <p className="text-[8px] font-bold text-gray-400 uppercase text-center mb-10">Este documento comprova o recebimento físico das mercadorias citadas acima, conforme condições contratuais.</p>
              <div className="grid grid-cols-2 gap-20">
                <div className="text-center pt-8 border-t border-gray-400">
                  <p className="text-[10px] font-black uppercase leading-tight">{selectedContract.supplierName}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Entregue por (Fornecedor)</p>
                </div>
                <div className="text-center pt-8 border-t border-gray-400">
                  <p className="text-[10px] font-black uppercase">ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Recebido por (Fiel Almocharife)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  {showExtractDateModal && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-gray-950/50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[92vh] flex flex-col relative z-[9999] shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 md:p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <TrendingUp size={28} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Gerar Extrato de Consumo</h3>
              <p className="text-[10px] md:text-xs font-bold uppercase opacity-80">
                Selecione as guias/notas e escolha quitação integral (100%) ou parcial (ex: metade)
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowExtractDateModal(false)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-gray-50/60 custom-scrollbar">
          
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Calendar size={12} className="text-indigo-500" /> Período Inicial
                </label>
                <input 
                  type="date" 
                  value={extractStartDate} 
                  onChange={(e) => setExtractStartDate(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-black text-xs uppercase text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Calendar size={12} className="text-indigo-500" /> Período Final
                </label>
                <input 
                  type="date" 
                  value={extractEndDate} 
                  onChange={(e) => setExtractEndDate(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-black text-xs uppercase text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Search size={12} className="text-indigo-500" /> Buscar Guia / Nota
                </label>
                <input 
                  type="text"
                  placeholder="Ex: PAG-2026, NF 123"
                  value={extractSearchFilter}
                  onChange={(e) => setExtractSearchFilter(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs uppercase text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <div className="text-[11px] font-bold text-gray-500">
                {extractGuideConfigs.length} guia(s) pendente(s) identificada(s) no contrato.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllGuides(true)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[10px] font-black uppercase transition-all"
                >
                  Marcar Todas
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllGuides(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-[10px] font-black uppercase transition-all"
                >
                  Desmarcar Todas
                </button>
              </div>
            </div>
          </div>

          {/* Pending Guides List */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Layers size={14} className="text-indigo-600" /> Guias de Recebimento / Notas Disponíveis
            </h4>

            {isLoadingExtractConfig ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-gray-100">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Carregando itens das guias pendentes...</p>
              </div>
            ) : extractGuideConfigs.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-3xl border border-gray-100">
                <AlertCircle size={32} className="mx-auto text-amber-500 mb-2" />
                <p className="text-xs font-black text-gray-900 uppercase">Nenhuma guia pendente encontrada</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">Todas as guias de recebimento já foram incluídas em extratos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {extractGuideConfigs
                  .filter(cfg => {
                    if (!extractSearchFilter) return true;
                    const q = extractSearchFilter.toLowerCase();
                    return (
                      cfg.guide.guide_number.toLowerCase().includes(q) ||
                      (cfg.guide.order_number && cfg.guide.order_number.toLowerCase().includes(q))
                    );
                  })
                  .map((cfg) => {
                    const originalTotal = cfg.items.reduce((s, it) => s + (it.originalQuantity * it.unitPrice), 0) || Number(cfg.guide.total_value) || 0;
                    const remValue = Math.round(Math.max(0, originalTotal - cfg.partialValue) * 100) / 100;

                    return (
                      <div 
                        key={cfg.guideId} 
                        className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                          cfg.selected 
                            ? 'border-indigo-200 shadow-sm ring-1 ring-indigo-500/10' 
                            : 'border-gray-100 opacity-60 bg-gray-50/40'
                        }`}
                      >
                        <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          
                          {/* Guide Info Left */}
                          <div className="flex items-start gap-3.5 min-w-0">
                            <input 
                              type="checkbox"
                              checked={cfg.selected}
                              onChange={() => toggleGuideSelected(cfg.guideId)}
                              className="mt-1 w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-gray-900 text-sm uppercase tracking-tight">
                                  {cfg.guide.guide_number}
                                </span>
                                {cfg.guide.guide_number.includes('(Saldo') && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded-md">
                                    Saldo Remanescente
                                  </span>
                                )}
                                {cfg.guide.order_number && (
                                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[9px] font-black uppercase">
                                    NF / Pedido: {cfg.guide.order_number}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase mt-1">
                                <span>Entrega: {cfg.guide.issue_date ? new Date(cfg.guide.issue_date + "T12:00:00").toLocaleDateString('pt-BR') : '-'}</span>
                                <span>•</span>
                                <span>{cfg.items.length} produto(s)</span>
                                <span>•</span>
                                <span className="text-gray-900 font-black">
                                  Valor da Guia: R$ {originalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Payment Mode Selector Right */}
                          {cfg.selected && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                              
                              {/* Total vs Parcial Buttons */}
                              <div className="flex items-center bg-gray-200/60 p-1 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => handleGuideModeChange(cfg.guideId, 'TOTAL')}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                                    cfg.mode === 'TOTAL'
                                      ? 'bg-white text-indigo-700 shadow-sm'
                                      : 'text-gray-500 hover:text-gray-900'
                                  }`}
                                >
                                  Integral (100%)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGuideModeChange(cfg.guideId, 'PARCIAL')}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                                    cfg.mode === 'PARCIAL'
                                      ? 'bg-purple-600 text-white shadow-sm'
                                      : 'text-gray-500 hover:text-gray-900'
                                  }`}
                                >
                                  <Split size={12} /> Parcial
                                </button>
                              </div>

                              {/* Parcial Custom Controls */}
                              {cfg.mode === 'PARCIAL' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Quick Preset Buttons */}
                                  <button
                                    type="button"
                                    onClick={() => handleGuidePercentChange(cfg.guideId, 50)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all border ${
                                      cfg.percent === 50 
                                        ? 'bg-purple-100 border-purple-300 text-purple-700' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                    title="Pagar a metade (50%)"
                                  >
                                    50% (Metade)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleGuidePercentChange(cfg.guideId, 25)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all border ${
                                      cfg.percent === 25 
                                        ? 'bg-purple-100 border-purple-300 text-purple-700' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    25%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleGuidePercentChange(cfg.guideId, 75)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all border ${
                                      cfg.percent === 75 
                                        ? 'bg-purple-100 border-purple-300 text-purple-700' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    75%
                                  </button>

                                  {/* Custom Percentage Input */}
                                  <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1">
                                    <input 
                                      type="number"
                                      min={1}
                                      max={100}
                                      value={cfg.percent}
                                      onChange={(e) => handleGuidePercentChange(cfg.guideId, parseFloat(e.target.value) || 0)}
                                      className="w-10 text-xs font-black text-center outline-none"
                                    />
                                    <span className="text-[10px] font-bold text-gray-400">%</span>
                                  </div>

                                  {/* Custom Value Input in R$ */}
                                  <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1">
                                    <span className="text-[10px] font-black text-gray-400 mr-1">R$</span>
                                    <input 
                                      type="number"
                                      step="0.01"
                                      min={0}
                                      max={originalTotal}
                                      value={cfg.partialValue}
                                      onChange={(e) => handleGuidePartialValueChange(cfg.guideId, parseFloat(e.target.value) || 0)}
                                      className="w-20 text-xs font-black text-right outline-none text-purple-700"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Paid / Pending Value Pill */}
                              <div className="text-right pl-2 sm:border-l sm:border-gray-200 shrink-0">
                                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Neste Extrato</p>
                                <p className="text-xs font-black text-emerald-700 leading-tight mt-0.5">
                                  R$ {cfg.partialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                {cfg.mode === 'PARCIAL' && (
                                  <p className="text-[8px] font-bold text-amber-600 leading-none mt-0.5">
                                    Saldo: R$ {remValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                )}
                              </div>

                              {/* Accordion Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleGuideExpanded(cfg.guideId)}
                                className="p-1.5 hover:bg-gray-200/60 rounded-lg text-gray-400 hover:text-gray-700 transition-all ml-1"
                                title="Ver / Ajustar quantidades por item"
                              >
                                {cfg.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Collapsible Accordion Table for Items */}
                        {cfg.selected && cfg.isExpanded && (
                          <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                Detalhamento dos Produtos da Guia (Ajuste individual de quantidades opcional)
                              </p>
                              <span className="text-[9px] font-bold text-indigo-600 uppercase">
                                Quantidade a faturar agora vs original entregue
                              </span>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-inner">
                              <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100/60 text-[9px] font-black text-gray-400 uppercase border-b border-gray-100">
                                  <tr>
                                    <th className="px-4 py-2.5">Produto</th>
                                    <th className="px-3 py-2.5 text-center">Un.</th>
                                    <th className="px-3 py-2.5 text-right">Preço Unit.</th>
                                    <th className="px-3 py-2.5 text-center">Qtd. Entregue</th>
                                    <th className="px-3 py-2.5 text-center">Qtd. a Pagar</th>
                                    <th className="px-4 py-2.5 text-right">Subtotal Extrato</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {cfg.items.map((it) => (
                                    <tr key={it.id} className="hover:bg-gray-50/50 text-[10px]">
                                      <td className="px-4 py-2.5 font-black uppercase text-gray-900">{it.description}</td>
                                      <td className="px-3 py-2.5 text-center font-bold text-gray-500 uppercase">{it.unit}</td>
                                      <td className="px-3 py-2.5 text-right font-bold text-gray-600">
                                        R$ {it.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-3 py-2.5 text-center font-bold text-gray-400">
                                        {formatQuantity(it.originalQuantity)}
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        <input 
                                          type="number"
                                          step="0.001"
                                          min={0}
                                          max={it.originalQuantity}
                                          value={it.paidQuantity}
                                          onChange={(e) => handleGuideItemQuantityChange(cfg.guideId, it.id, parseFloat(e.target.value) || 0)}
                                          className="w-20 p-1 text-center font-black text-xs bg-indigo-50/50 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-indigo-700"
                                        />
                                      </td>
                                      <td className="px-4 py-2.5 text-right font-black text-indigo-700">
                                        R$ {it.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Summary */}
        <div className="p-6 md:p-8 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-lg">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Guias Selecionadas</p>
              <p className="text-xl font-black text-gray-900 mt-1">
                {extractGuideConfigs.filter(c => c.selected).length} de {extractGuideConfigs.length}
              </p>
            </div>
            <div className="h-8 w-px bg-gray-100 hidden sm:block"></div>
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Total deste Extrato</p>
              <p className="text-2xl font-black text-indigo-700 mt-1">
                R$ {extractGuideConfigs
                  .filter(c => c.selected)
                  .reduce((sum, c) => sum + c.partialValue, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            {extractGuideConfigs.some(c => c.selected && c.mode === 'PARCIAL') && (
              <>
                <div className="h-8 w-px bg-gray-100 hidden md:block"></div>
                <div className="hidden md:block">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Saldo Restante (Pendente)</p>
                  <p className="text-lg font-black text-amber-700 mt-1">
                    R$ {extractGuideConfigs
                      .filter(c => c.selected)
                      .reduce((sum, c) => {
                        const orig = c.items.reduce((s, it) => s + (it.originalQuantity * it.unitPrice), 0) || Number(c.guide.total_value) || 0;
                        return sum + Math.max(0, orig - c.partialValue);
                      }, 0)
                      .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowExtractDateModal(false)}
              className="flex-1 sm:flex-none px-6 py-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleGenerateExtract} 
              disabled={extractGuideConfigs.filter(c => c.selected && c.partialValue > 0).length === 0}
              className="flex-1 sm:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex justify-center items-center gap-2.5 disabled:opacity-50 disabled:grayscale"
            >
              <TrendingUp size={16} /> Gerar Prévia do Extrato
            </button>
          </div>
        </div>

      </div>
    </div>
  )}

  {previewExtract && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-[9999] shadow-2xl">
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl"><TrendingUp size={28} /></div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Novo Extrato de Consumo</h3>
              <p className="text-[10px] font-bold uppercase opacity-80">Prévia do fechamento. O período será encerrado após a confirmação.</p>
            </div>
          </div>
          <button onClick={() => setPreviewExtract(null)} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-gray-50 text-gray-900 space-y-8 custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
             <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Guias Incluídas</p>
               <p className="text-2xl font-black text-gray-900">{previewExtract.guides.length} Recebimento(s)</p>
               <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">
                 {previewExtract.guides.filter((g: any) => g.isPartial).length > 0
                   ? `${previewExtract.guides.filter((g: any) => g.isPartial).length} guia(s) com quitação parcial`
                   : 'Todas as guias 100% integrais'}
               </p>
             </div>
             <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Período de Consumo</p>
               <p className="text-sm font-black text-gray-900 mt-1">
                 {new Date(extractStartDate + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(extractEndDate + 'T12:00:00').toLocaleDateString('pt-BR')}
               </p>
             </div>
             <div className="text-right">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Valor Total a Fechar</p>
               <p className="text-3xl font-black text-indigo-700">
                 R$ {(previewExtract?.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </p>
             </div>
          </div>

          {/* Guides Breakdown Card */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Composição das Guias no Extrato</h4>
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Guia / Pedido</th>
                    <th className="px-4 py-4 text-center">Tipo de Quitação</th>
                    <th className="px-4 py-4 text-right">Valor Original</th>
                    <th className="px-4 py-4 text-right">Valor no Extrato</th>
                    <th className="px-6 py-4 text-right">Saldo Remanescente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewExtract.guides.map((g: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50 text-xs">
                      <td className="px-6 py-4">
                        <p className="font-black text-gray-900 uppercase">{g.guide_number}</p>
                        {g.order_number && (
                          <p className="text-[9px] font-bold text-gray-400 uppercase">NF / Pedido: {g.order_number}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {g.isPartial ? (
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-[9px] font-black uppercase inline-flex items-center gap-1">
                            <Split size={10} /> Parcial ({g.percent}%)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase">
                            Integral (100%)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-gray-400">
                        R$ {(g.originalValue || g.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-black text-indigo-700">
                        R$ {(g.paidValue || g.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {g.isPartial && g.remainingValue > 0 ? (
                          <span className="font-black text-amber-600">
                            R$ {g.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="font-bold text-gray-300">R$ 0,00 (Quitado)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewExtract.guides.some((g: any) => g.isPartial) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                <AlertCircle size={20} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-900 font-bold">
                  <strong>Atenção:</strong> As guias marcadas como parciais terão o saldo remanescente gerado automaticamente como uma nova guia pendente com sufixo <code>(Saldo)</code>, pronta para ser faturada no próximo extrato.
                </p>
              </div>
            )}
          </div>

          {/* Consolidated Products Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Consolidação de Produtos Consumidos no Período</h4>
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4 text-center">Un.</th>
                    <th className="px-6 py-4 text-center">Qtd. no Período</th>
                    <th className="px-6 py-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewExtract.items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                       <td className="px-6 py-4 font-black text-xs uppercase text-gray-900">{item.description}</td>
                       <td className="px-6 py-4 text-center font-bold text-gray-500 uppercase text-xs">{item.unit}</td>
                       <td className="px-6 py-4 text-center font-black text-indigo-600">{formatQuantity(item.quantity || 0)}</td>
                       <td className="px-6 py-4 text-right font-black text-indigo-700">R$ {(item.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8">
            <button 
              onClick={handleConfirmExtract} 
              disabled={isLoadingStatements}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex justify-center items-center gap-3 disabled:opacity-50"
            >
               <Check size={20} /> {isLoadingStatements ? "Processando e Gravando Extrato..." : "Confirmar e Fechar Período"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {generatedStatementPdf && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative z-[9999] shadow-2xl">
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl"><TrendingUp size={28} /></div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Extrato de Consumo - {generatedStatementPdf.statement.statement_number}</h3>
              <p className="text-[10px] font-bold uppercase opacity-80">Comprovante de fechamento de período</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleDownloadConsumptionPdf} className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-indigo-50 transition-all">
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button onClick={() => setGeneratedStatementPdf(null)} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-12 bg-gray-50 text-gray-900">
          <div id="consumption-statement-printable" className="bg-white p-10 shadow-sm border border-gray-100 mx-auto max-w-[210mm] min-h-[297mm] text-gray-900 font-sans flex flex-col">
            <style>{`
              #consumption-statement-printable table {
                page-break-inside: auto;
              }
              #consumption-statement-printable tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              #consumption-statement-printable thead {
                display: table-header-group;
              }
              #consumption-statement-printable tfoot {
                display: table-footer-group;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              #consumption-statement-printable .avoid-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            `}</style>
            <div className="flex justify-between items-start border-b-2 border-gray-900 pb-5 mb-5">
              <div className="flex items-center gap-6">
                <img src="/logo-escola.png" alt="Logo Escola" className="w-24 h-auto" />
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI</h2>
                  <p className="text-[9px] font-black text-gray-600 uppercase">CDCE DA ESC. EST. DE ENS. FUN. ANDRÉ A. MAGGI</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">CNPJ: 11.906.357/0001-50</p>
                  <p className="text-[8px] font-medium text-gray-400 uppercase mt-0.5">Avenida Borba Gato, nº 80, Colíder-MT - CEP 78500-000</p>
                  <p className="text-[8px] font-medium text-indigo-600 uppercase mt-0.5">escola.153830@edu.mt.gov.br | 66 996648410 (whatsApp)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Extrato de Consumo</p>
                <h1 className="text-xl font-black text-gray-900 truncate max-w-[200px]">{generatedStatementPdf.statement.statement_number}</h1>
                <p className="text-[10px] font-black text-indigo-600 uppercase mt-1">Período Apurado: {new Date(generatedStatementPdf.statement.period_start + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(generatedStatementPdf.statement.period_end + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Emissão: {new Date(generatedStatementPdf.statement.created_at || new Date().toISOString()).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className={`grid ${generatedStatementPdf.statement.payment_date ? 'grid-cols-3' : 'grid-cols-2'} gap-6 mb-5 avoid-break`}>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Contratada</p>
                <p className="text-xs font-black text-gray-900 uppercase truncate leading-tight">{selectedContract.supplierName}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Valor Total</p>
                <p className="text-lg font-black text-emerald-700">R$ {statementDisplayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              {generatedStatementPdf.statement.payment_date && (
                <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                  <p className="text-[8px] font-black text-indigo-600 uppercase mb-1">Pagamento / NF</p>
                  <p className="text-xs font-black text-indigo-900 uppercase">NF {generatedStatementPdf.statement.invoice_number}</p>
                  <p className="text-[8px] font-bold text-indigo-400 mt-0.5 uppercase">{new Date(generatedStatementPdf.statement.payment_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>
            <table className="w-full mb-6 border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 text-[9px] font-black uppercase text-gray-500 text-left">
                  <th className="py-2.5 pr-4">Produto</th>
                  <th className="py-2.5 px-4 text-center">Un.</th>
                  <th className="py-2.5 px-4 text-center">Marca</th>
                  <th className="py-2.5 px-4 text-center">Quant.</th>
                  <th className="py-2.5 px-4 text-right">Preço Un.</th>
                  <th className="py-2.5 pl-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {generatedStatementPdf.items.map((item, idx) => (
                  <tr key={idx} className="text-[9px] avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <td className="py-2.5 pr-4 font-bold uppercase leading-tight">{item.description}</td>
                    <td className="py-2.5 px-4 text-center text-gray-500 font-bold uppercase">{item.unit}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-gray-400">{item.brand || '-'}</td>
                    <td className="py-2.5 px-4 text-center font-black text-indigo-700">{formatQuantity(item.quantity || 0)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-600">{(item.unitPrice || item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-2.5 pl-4 text-right font-black text-indigo-700">{(item.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <td colSpan={5} className="py-3 pr-4 text-right font-black uppercase text-gray-900 text-xs">Total do Período (R$)</td>
                  <td className="py-3 pl-4 text-right font-black text-indigo-700 text-xs">{(statementDisplayTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>

            {generatedStatementPdf.guides && generatedStatementPdf.guides.length > 0 && (
              <div className="mb-8 mt-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Relatório de Guias Consolidadas</h4>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[8px] font-black text-gray-400 uppercase border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-[8px]">Nº da Guia</th>
                        <th className="px-4 py-2 text-[8px]">Nº do Pedido</th>
                        <th className="px-4 py-2 text-center text-[8px]">Recebimento</th>
                        <th className="px-4 py-2 text-right text-[8px]">Valor da Guia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {generatedStatementPdf.guides.map((g: any, gIdx: number) => (
                        <tr key={gIdx} className="text-[9px] text-gray-600">
                          <td className="px-4 py-2 font-black uppercase text-gray-900 text-[9px]">{g.guide_number}</td>
                          <td className="px-4 py-2 font-bold uppercase text-[9px]">{g.order_number || '-'}</td>
                          <td className="px-4 py-2 text-center font-bold text-[9px]">{new Date(g.issue_date + "T12:00:00").toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-2 text-right font-black text-emerald-700 text-[9px]">R$ {g.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-auto pt-8 border-t-2 border-gray-100 avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <p className="text-[8px] font-bold text-gray-400 uppercase text-center mb-6">Este documento certifica o fechamento de guias de recebimento e consumo do contrato administrativo nº {selectedContract.number} no período discriminado acima.</p>
              <div className="grid grid-cols-2 gap-12">
                <div className="text-center pt-6 border-t border-gray-400">
                  <p className="text-[10px] font-black uppercase leading-tight">{selectedContract.supplierName}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Representante Legal (Fornecedor)</p>
                </div>
                <div className="text-center pt-6 border-t border-gray-400">
                  <p className="text-[10px] font-black uppercase">ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Gestor Escolar / CDCE</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* MODAL DETALHES DO PEDIDO DO CONTRATO */}
  {viewingOrder && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-[9999] shadow-2xl">
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl"><ShoppingBag size={28} /></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-indigo-950 text-[9px] font-black uppercase rounded-full tracking-wider">
                  Pedido #{viewingOrder.order_number}
                </span>
                <span className="text-[10px] font-bold uppercase opacity-80">Contrato {selectedContract?.number}</span>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mt-0.5">{selectedContract?.supplierName}</h3>
            </div>
          </div>
          <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-gray-50 text-gray-900">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Data de Emissão</p>
              <p className="text-sm font-black text-gray-900">
                {viewingOrder.issue_date ? new Date(viewingOrder.issue_date + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}
              </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Previsão de Entrega</p>
              <p className="text-sm font-black text-gray-900">
                {viewingOrder.delivery_date ? new Date(viewingOrder.delivery_date + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Valor Total</p>
              <p className="text-xl font-black text-emerald-700">
                R$ {(Number(viewingOrder.total_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Itens e Gêneros do Pedido</h4>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-6">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4 text-center">Quantidade</th>
                  <th className="py-3 px-4 text-right">Preço Un.</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-bold">
                {(viewingOrder.order_items || []).map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-black uppercase text-gray-900">{item.description}</td>
                    <td className="py-3 px-4 text-center font-black text-indigo-700">{formatQuantity(item.quantity || 0)} {item.unit || ''}</td>
                    <td className="py-3 px-4 text-right text-gray-600">R$ {(Number(item.unit_price) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">R$ {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-100 font-black text-xs">
                  <td colSpan={3} className="py-3.5 px-4 text-right uppercase text-gray-500">Total do Pedido</td>
                  <td className="py-3.5 px-4 text-right text-emerald-700 font-black text-sm">
                    R$ {(Number(viewingOrder.total_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {viewingOrder.observations && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-900 font-medium mb-6">
              <span className="font-black uppercase text-[10px] text-amber-700 block mb-0.5">Observações:</span>
              {viewingOrder.observations}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setViewingOrder(null)}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black uppercase text-xs tracking-wider transition-all"
            >
              Fechar
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 shadow-lg"
            >
              <Printer size={16} /> Imprimir Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {showBatchDeliveryModal && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-[9999] shadow-2xl">
        <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl"><FileCheck size={28} /></div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Confirmar Recebimento em Lote</h3>
              <p className="text-[10px] font-bold uppercase opacity-80">Verifique os itens antes de gerar a guia</p>
            </div>
          </div>
          <button onClick={() => setShowBatchDeliveryModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-12 bg-gray-50 text-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Data do Recebimento</h4>
                <p className="text-xs font-black text-gray-900 uppercase mt-0.5">Informe a data real da entrega</p>
              </div>
              <input type="date" required value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} className="p-3 bg-gray-50 border border-emerald-100 rounded-xl font-black text-sm text-gray-900 outline-none focus:border-emerald-500 transition-all shadow-inner" />
            </div>
            <div className="p-6 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Número do Pedido</h4>
                <p className="text-xs font-black text-gray-900 uppercase mt-0.5">Vincule a ordem de compra</p>
              </div>
              <input type="text" placeholder="Ex: 123/2026" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} className="p-3 bg-gray-50 border border-emerald-100 rounded-xl font-black text-sm text-gray-900 outline-none focus:border-emerald-500 transition-all shadow-inner w-40 text-center" />
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4 text-center">Un.</th>
                  <th className="px-6 py-4 text-center">Valor Unit.</th>
                  <th className="px-6 py-4 text-center">Qtd. Selecionada</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.entries(batchDeliveryData).map(([itemId, qty]) => {
                  const item = selectedContract.items.find(i => i.id === itemId);
                  return (
                    <tr key={itemId}>
                       <td className="px-6 py-4 font-black text-xs uppercase text-gray-900">{item?.description}</td>
                       <td className="px-6 py-4 text-center font-bold text-gray-500 uppercase text-xs">{item?.unit}</td>
                       <td className="px-6 py-4 text-center font-bold text-emerald-700 text-xs">R$ {((item?.unitPrice as number) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                       <td className="px-6 py-4 text-center font-black text-emerald-600">{formatQuantity(qty as number)}</td>
                       <td className="px-6 py-4 text-right font-black text-emerald-700">R$ {((qty as number) * ((item?.unitPrice as number) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-8 bg-gray-900 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Total da Guia</p>
              <p className="text-4xl font-black text-white">R$ {Object.entries(batchDeliveryData).reduce((sum, [itemId, qty]) => {
                const item = selectedContract.items.find(i => i.id === itemId);
                return sum + ((qty as number) * ((item?.unitPrice as number) || 0));
              }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <button onClick={handleConfirmBatchDelivery} disabled={isSavingBatch} className="w-full md:w-auto px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
               {isSavingBatch ? <><div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> Processando...</> : <><Save size={20} /> Finalizar Recebimento</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {editGuideModal && selectedContract && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-[9999] shadow-2xl border border-gray-100">
        <div className="p-8 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-lg"><Edit3 size={24} /></div>
            <div>
              <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Editar Guia {editGuideModal.guide_number}</h3>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">Ajuste os itens e a data do recebimento</p>
            </div>
          </div>
          <button onClick={() => setEditGuideModal(null)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={28} /></button>
        </div>
        <form onSubmit={handleSaveEditGuide} className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <div className="px-6 py-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Data do Recebimento</h4>
                <p className="text-xs font-black text-gray-900 uppercase mt-0.5">Corrija a data se necessário</p>
              </div>
              <input type="date" required value={editReceiptDate} onChange={(e) => setEditReceiptDate(e.target.value)} className="p-3 bg-gray-50 border border-blue-200 rounded-xl font-black text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner" />
            </div>
            <div className="px-6 py-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Número do Pedido</h4>
                <p className="text-xs font-black text-gray-900 uppercase mt-0.5">Ajuste o vínculo do pedido</p>
              </div>
              <input type="text" placeholder="Ex: 123/2026" value={editOrderNumber} onChange={(e) => setEditOrderNumber(e.target.value.toUpperCase())} className="p-3 bg-gray-50 border border-blue-200 rounded-xl font-black text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner w-40 text-center" />
            </div>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm mt-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4 text-center">Unidade</th>
                  <th className="px-6 py-4 text-center">Saldo Restante Atual</th>
                  <th className="px-6 py-4 text-center">Quantidade na Guia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedContract.items.map(item => {
                  const originalQty = originalBatchDeliveryData[item.id] || 0;
                  const currentQty = Number(editBatchDeliveryData[item.id]) || 0;
                  const remaining = item.contractedQuantity - item.acquiredQuantity + originalQty;
                  const isException = true;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5"><p className="font-black text-gray-900 text-xs uppercase">{item.description}</p></td>
                      <td className="px-6 py-5 text-center"><p className="font-bold text-gray-500 text-xs uppercase">{item.unit}</p></td>
                      <td className="px-6 py-5 text-center"><p className="font-black text-gray-600 text-xs">{isException ? 'Sem Limite' : formatQuantity(remaining)}</p></td>
                      <td className="px-6 py-5 flex justify-center">
                        <input type="number" min="0" max={isException ? undefined : remaining} step="any" value={currentQty || ""} onChange={(e) => setEditBatchDeliveryData(prev => ({ ...prev, [item.id]: Number(e.target.value) }))} className="w-24 p-2 bg-white border border-gray-200 rounded-lg text-center font-black text-blue-700 outline-none focus:border-blue-500" placeholder="0" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-blue-900 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl mt-6">
            <div>
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Novo Valor Total</p>
              <p className="text-4xl font-black text-white">R$ {Object.entries(editBatchDeliveryData).reduce((sum, [itemId, qty]) => {
                const item = selectedContract.items.find(i => i.id === itemId);
                return sum + ((qty as number) * ((item?.unitPrice as number) || 0));
              }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <button type="submit" disabled={isSavingEdit} className="w-full md:w-auto px-12 py-5 bg-white text-blue-900 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {isSavingEdit ? <>Processando...</> : <><Save size={20} /> Salvar Alterações</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {aditivoModal && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative z-[9999] shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-100 text-blue-600"><FilePlus size={24} /></div>
            <h3 className="text-lg font-black text-gray-900 uppercase">Termo Aditivo</h3>
          </div>
          <button onClick={() => setAditivoModal(null)}><X size={24} className="text-gray-300" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-6">Aumentar a quantidade contratada para <b>{aditivoModal.description}</b>.</p>
        <form onSubmit={handleConfirmAditivo} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Quantidade Adicional</label>
            <input autoFocus type="text" required defaultValue={formatQuantity(0)} onBlur={e => setAditivoQty(parseNumeric(e.target.value))} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-center text-xl" placeholder="0,000" />
          </div>
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Confirmar Aditivo</button>
        </form>
      </div>
    </div>
  )}

  {outputModal && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative z-[9999] shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-100 text-red-600"><TrendingUp size={24} className="rotate-180" /></div>
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Saída de Estoque</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Baixa Manual de Saldo</p>
            </div>
          </div>
          <button onClick={() => setOutputModal(null)} className="text-gray-300 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>
        <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Produto</p>
          <p className="font-black text-gray-900 text-sm uppercase">{outputModal.description}</p>
        </div>
        <form onSubmit={handleConfirmOutput} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantidade a Retirar</label>
            <input autoFocus required type="text" defaultValue={formatQuantity(0)} onBlur={(e) => setOutputQty(parseNumeric(e.target.value))} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-black text-lg focus:border-red-500 transition-all text-center" placeholder="0,000" />
          </div>
          <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-red-700 transition-all">Confirmar Saída</button>
        </form>
      </div>
    </div>
  )}

  {deliveryModal && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative z-[9999] shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600"><Truck size={24} /></div>
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Registrar Entrega</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Atualizar Saldo do Contrato</p>
            </div>
          </div>
          <button onClick={() => setDeliveryModal(null)} className="text-gray-300 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>
        <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Produto</p>
          <p className="font-black text-gray-900 text-sm uppercase">{deliveryModal.description}</p>
        </div>
        <form onSubmit={handleConfirmDelivery} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantidade Recebida</label>
            <input autoFocus required type="text" defaultValue={formatQuantity(0)} onBlur={(e) => setDeliveryQty(parseNumeric(e.target.value))} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-lg focus:border-emerald-500 transition-all text-center" placeholder="0,000" />
          </div>
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all">Confirmar Recebimento</button>
        </form>
      </div>
    </div>
  )}

</div>

);
};

export default Contracts;
