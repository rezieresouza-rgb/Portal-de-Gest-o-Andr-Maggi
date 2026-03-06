
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
  Zap
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ContractStatus, Contract, ContractItem } from '../types';
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
          supplier:suppliers (name),
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
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [generatedGuidePdf, setGeneratedGuidePdf] = useState<{ guide: any, items: any[] } | null>(null);

  // Fix timezone issue by formatting the local date properly YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };
  const [receiptDate, setReceiptDate] = useState<string>(getLocalDateString());

  // Guide History State
  const [paymentGuides, setPaymentGuides] = useState<any[]>([]);
  const [isLoadingGuides, setIsLoadingGuides] = useState(false);
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'LOG' | 'GUIDES'>('ITEMS');
  const [showConsumptionStatement, setShowConsumptionStatement] = useState(false);

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
      // Use custom date or current local time
      let eventDateISO = new Date().toISOString();
      if (customDateStr) {
        // Create date at noon local time to avoid timezone shifts
        const [year, month, day] = customDateStr.split('-');
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
        eventDateISO = dateObj.toISOString();
      }

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

  const fetchPaymentGuides = async (contractId: string) => {
    try {
      setIsLoadingGuides(true);
      const { data, error } = await supabase
        .from('payment_guides')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentGuides(data || []);
    } catch (err) {
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

  useEffect(() => {
    if (selectedContractId) {
      fetchPaymentGuides(selectedContractId);
      setActiveTab('ITEMS');
    }
  }, [selectedContractId]);

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

      const newAcquired = item.acquiredQuantity + numericDelivery;
      if (newAcquired > item.contractedQuantity) {
        alert("Quantidade excede o saldo do contrato!");
        return;
      }

      const impact = numericDelivery * item.unitPrice;

      const { error } = await supabase
        .from('contract_items')
        .update({ acquired_quantity: newAcquired })
        .eq('id', item.id);

      if (error) throw error;

      setContracts(prev => prev.map(c => {
        if (c.id !== deliveryModal.contractId) return c;
        return {
          ...c,
          items: c.items.map(i => {
            if (i.id !== deliveryModal.itemId) return i;
            return {
              ...i,
              acquiredQuantity: newAcquired
            };
          })
        };
      }));

      await addExecutionEvent(deliveryModal.contractId, 'DELIVERY', `Recebimento: ${deliveryQty} un de ${deliveryModal.description}`, impact);
      setDeliveryModal(null);
      setDeliveryQty("");

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

      const newAcquired = item.acquiredQuantity + numericOutput;
      if (newAcquired > item.contractedQuantity) {
        alert("Quantidade excede o saldo disponível no contrato!");
        return;
      }

      const impact = numericOutput * item.unitPrice;

      const { error } = await supabase
        .from('contract_items')
        .update({ acquired_quantity: newAcquired })
        .eq('id', item.id);

      if (error) throw error;

      setContracts(prev => prev.map(c => {
        if (c.id !== outputModal.contractId) return c;
        return {
          ...c,
          items: c.items.map(i => {
            if (i.id !== outputModal.itemId) return i;
            return {
              ...i,
              acquiredQuantity: newAcquired
            };
          })
        };
      }));

      await addExecutionEvent(outputModal.contractId, 'DELIVERY', `Saída Manual: ${outputQty} ${item.unit} de ${outputModal.description}`, impact);
      setOutputModal(null);
      setOutputQty("");
      alert("Saída de estoque registrada com sucesso!");

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
          total_value: totalValue,
          status: 'GERADA',
          issue_date: receiptDate
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
      setSelectedItems(new Set());
      setBatchDeliveryData({});
      setReceiptDate(getLocalDateString());

      // Refresh guides list
      if (selectedContractId) fetchPaymentGuides(selectedContractId);

    } catch (error: any) {
      alert("Erro ao gerar guia: " + error.message);
    } finally {
      setIsSavingBatch(false);
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

  const handleDownloadConsumptionPdf = async () => {
    const element = document.getElementById('consumption-statement-printable');
    if (!element) return;

    try {
      await (window as any).html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `Extrato_Consumo_${selectedContract?.number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save();

      setShowConsumptionStatement(false);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF.");
    }
  };

  if (selectedContract) {
    const { totalValue, totalSpent, remainingValue, daysRemaining } = calculateContractStats(selectedContract);
    const timeProgress = Math.min(100, Math.max(0, (365 - daysRemaining) / 3.65));

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <button
            onClick={() => { setSelectedContractId(null); setItemFilter(''); setSelectedItems(new Set()); }}
            className="flex items-center gap-2 text-emerald-700 font-black uppercase text-xs tracking-widest hover:text-emerald-800 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar para lista
          </button>

          <button
            onClick={() => setShowConsumptionStatement(true)}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Printer size={16} /> Gerar Extrato de Consumo
          </button>
        </div>

        {generatedGuidePdf && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => setGeneratedGuidePdf(null)}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 shadow-2xl">
              <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl"><FileCheck size={28} /></div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Guia de Recebimento Gerada</h3>
                    <p className="text-[10px] font-bold uppercase opacity-80">Documento pronto para conferência e assinatura</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleDownloadGuidePdf} className="px-6 py-3 bg-white text-emerald-700 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-emerald-50 transition-all">
                    <Printer size={16} /> Imprimir / PDF
                  </button>
                  <button onClick={() => setGeneratedGuidePdf(null)} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-gray-50">
                <div id="payment-guide-printable" className="bg-white p-12 shadow-sm border border-gray-100 mx-auto max-w-[210mm] min-h-[297mm] text-gray-900 font-sans">
                  {/* Header PDF */}
                  <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
                    <div className="flex items-center gap-6">
                      <img src="/logo-escola.png" alt="Logo Escola" className="w-20 h-auto" />
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">ESCOLA ESTADUAL ANDRÉ ANTÔNIO MAGGI</h2>
                        <p className="text-[9px] font-black text-gray-600 uppercase">CDCE DA ESC. EST. DE ENS. FUN. ANDRÉ A. MAGGI</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">CNPJ: 11.906.357/0001-50</p>
                        <p className="text-[8px] font-medium text-gray-400 uppercase mt-0.5">Avenida Borba Gato, nº 80, Colíder-MT - CEP 78500-000</p>
                        <p className="text-[8px] font-medium text-emerald-600 uppercase mt-0.5">escola.153830@edu.mt.gov.br | 66 996648410 (whatsApp)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Guia de Recebimento</p>
                      <h1 className="text-2xl font-black text-gray-900">{generatedGuidePdf.guide.guide_number}</h1>
                      <p className="text-[10px] font-bold text-gray-600 uppercase mt-1">Data de Recebimento: {
                        new Date(generatedGuidePdf.guide.issue_date + 'T12:00:00')
                          .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                      }</p>
                    </div>
                  </div>

                  {/* Info PDF */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Fornecedor</p>
                      <p className="text-xs font-black uppercase">{selectedContract.supplierName}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Contrato Administrativo</p>
                      <p className="text-xs font-black uppercase">{selectedContract.number}</p>
                    </div>
                  </div>

                  {/* Items Table PDF */}
                  <table className="w-full mb-8 border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-[9px] font-black uppercase text-gray-500 text-left">
                        <th className="py-3 pr-4">Descrição do Produto</th>
                        <th className="py-3 px-4 text-center">Unid.</th>
                        <th className="py-3 px-4 text-center">Quant.</th>
                        <th className="py-3 px-4 text-right">Preço Un.</th>
                        <th className="py-3 pl-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {generatedGuidePdf.items.map((item, idx) => (
                        <tr key={idx} className="text-[10px]">
                          <td className="py-4 pr-4 font-bold uppercase">{item.description}</td>
                          <td className="py-4 px-4 text-center text-gray-500 font-bold uppercase">{item.unit}</td>
                          <td className="py-4 px-4 text-center font-black">{formatQuantity(item.quantity)}</td>
                          <td className="py-4 px-4 text-right font-bold">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-4 pl-4 text-right font-black">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-900">
                        <td colSpan={4} className="py-6 text-right text-xs font-black uppercase">Valor Total da Guia:</td>
                        <td className="py-6 pl-4 text-right text-lg font-black text-emerald-700">R$ {generatedGuidePdf.guide.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Signatures PDF */}
                  <div className="grid grid-cols-2 gap-20 mt-20">
                    <div className="text-center pt-8 border-t border-gray-400">
                      <p className="text-[10px] font-black uppercase">{selectedContract.supplierName}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Representante Legal</p>
                    </div>
                    <div className="text-center pt-8 border-t border-gray-400">
                      <p className="text-[10px] font-black uppercase">ESCOLA ESTADUAL ANDRÉ ANTÔNIO MAGGI</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Gestor do Contrato</p>
                    </div>
                  </div>

                  <div className="mt-20 p-6 border-2 border-dashed border-gray-200 rounded-2xl">
                    <p className="text-[8px] font-bold text-gray-400 uppercase text-center">Esta guia certifica o recebimento físico dos produtos acima relacionados e serve como base para o processamento do pagamento correspondente.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConsumptionStatement && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => setShowConsumptionStatement(false)}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 shadow-2xl">
              <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl"><TrendingUp size={28} /></div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Extrato de Consumo Acumulado</h3>
                    <p className="text-[10px] font-bold uppercase opacity-80">Saldo total executado vs contratado até {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleDownloadConsumptionPdf} className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-indigo-50 transition-all">
                    <Printer size={16} /> Imprimir / PDF
                  </button>
                  <button onClick={() => setShowConsumptionStatement(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-gray-50">
                <div id="consumption-statement-printable" className="bg-white p-12 shadow-sm border border-gray-100 mx-auto max-w-[210mm] min-h-[297mm] text-gray-900 font-sans">
                  {/* Header PDF */}
                  <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
                    <div className="flex items-center gap-6">
                      <img src="/logo-escola.png" alt="Logo Escola" className="w-24 h-auto" />
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">ESCOLA ESTADUAL ANDRÉ ANTÔNIO MAGGI</h2>
                        <p className="text-[9px] font-black text-gray-600 uppercase">CDCE DA ESC. EST. DE ENS. FUN. ANDRÉ A. MAGGI</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">CNPJ: 11.906.357/0001-50</p>
                        <p className="text-[8px] font-medium text-gray-400 uppercase mt-0.5">Avenida Borba Gato, nº 80, Colíder-MT - CEP 78500-000</p>
                        <p className="text-[8px] font-medium text-emerald-600 uppercase mt-0.5">escola.153830@edu.mt.gov.br | 66 996648410 (whatsApp)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Extrato de Consumo</p>
                      <h1 className="text-xl font-black text-gray-900 truncate max-w-[200px]">{selectedContract.number}</h1>
                      <p className="text-[10px] font-bold text-gray-600 uppercase mt-1">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Summary PDF */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Contratada</p>
                      <p className="text-sm font-black text-gray-900 uppercase">{selectedContract.supplierName}</p>
                    </div>
                    <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                      <div>
                        <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Execução Financeira</p>
                        <p className="text-lg font-black text-indigo-700">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Vigência até</p>
                        <p className="text-xs font-black text-indigo-700 uppercase">{new Date(selectedContract.endDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items Table PDF */}
                  <table className="w-full mb-8 border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-[8px] font-black uppercase text-gray-500 text-left">
                        <th className="py-3 pr-4">Descrição do Item</th>
                        <th className="py-3 px-4 text-center">Unid.</th>
                        <th className="py-3 px-4 text-center">Contratada</th>
                        <th className="py-3 px-4 text-center">Adquirida</th>
                        <th className="py-3 px-4 text-center">Saldo</th>
                        <th className="py-3 pl-4 text-right">Preço Un.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedContract.items.map((item, idx) => {
                        const remaining = item.contractedQuantity - item.acquiredQuantity;
                        return (
                          <tr key={idx} className="text-[9px]">
                            <td className="py-4 pr-4 font-bold uppercase leading-tight">{item.description}</td>
                            <td className="py-4 px-4 text-center text-gray-500 font-bold uppercase">{item.unit}</td>
                            <td className="py-4 px-4 text-center font-bold text-gray-400">{formatQuantity(item.contractedQuantity)}</td>
                            <td className="py-4 px-4 text-center font-black text-indigo-700">{formatQuantity(item.acquiredQuantity)}</td>
                            <td className={`py-4 px-4 text-center font-black ${remaining <= 0 ? 'text-red-500' : 'text-gray-900'}`}>{formatQuantity(remaining)}</td>
                            <td className="py-4 pl-4 text-right font-bold text-gray-600">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="mt-auto pt-20 border-t-2 border-gray-100">
                    <p className="text-[8px] font-bold text-gray-400 uppercase text-center mb-10">Este documento detalha o consumo acumulado do contrato administrativo nº {selectedContract.number} até a presente data.</p>
                    <div className="grid grid-cols-2 gap-20">
                      <div className="text-center pt-8 border-t border-gray-400">
                        <p className="text-[10px] font-black uppercase leading-tight">{selectedContract.supplierName}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Representante Legal (Fornecedor)</p>
                      </div>
                      <div className="text-center pt-8 border-t border-gray-400">
                        <p className="text-[10px] font-black uppercase">ESCOLA ESTADUAL ANDRÉ ANTÔNIO MAGGI</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Gestor Escolar / CDCE</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showBatchDeliveryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowBatchDeliveryModal(false)}></div>
            <div className="bg-white rounded-[3.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 shadow-2xl border border-gray-100">
              <div className="p-8 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-lg"><Truck size={24} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter">Recebimento em Lote</h3>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Gerar Guia de Pagamento para {selectedItems.size} produtos</p>
                  </div>
                </div>
                <button onClick={() => setShowBatchDeliveryModal(false)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={28} /></button>
              </div>

              <form onSubmit={handleConfirmBatchDelivery} className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                <div className="mb-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Data do Recebimento</h4>
                    <p className="text-xs font-black text-gray-900 uppercase mt-0.5">Preencha a data da guia</p>
                  </div>
                  <input
                    type="date"
                    required
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="p-3 bg-gray-50 border border-emerald-200 rounded-xl font-black text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner"
                  />
                </div>

                <div className="bg-white border text-left border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase">
                      <tr>
                        <th className="px-6 py-4">Produto</th>
                        <th className="px-6 py-4 text-center">Preço Un.</th>
                        <th className="px-6 py-4 text-center w-40">Quant. Recebida</th>
                        <th className="px-6 py-4 text-right">Total Item</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Array.from(selectedItems).map(itemId => {
                        const item = selectedContract.items.find(i => i.id === itemId);
                        if (!item) return null;
                        const remaining = item.contractedQuantity - item.acquiredQuantity;
                        const quantity = batchDeliveryData[itemId] || 0;
                        const total = Math.round((quantity as number) * (item.unitPrice as number) * 100) / 100;

                        return (
                          <tr key={itemId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-[11px] font-black text-gray-900 uppercase leading-tight">{item.description}</p>
                              <p className="text-[8px] font-black text-emerald-500 uppercase mt-1">Marca: {item.brand || 'Não informada'} • Un: {item.unit}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-[10px] font-black text-gray-900">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                defaultValue={formatQuantity(quantity)}
                                onBlur={(e) => setBatchDeliveryData(prev => ({ ...prev, [itemId as string]: parseNumeric(e.target.value) }))}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-center font-black text-sm focus:border-emerald-500 outline-none transition-all"
                                placeholder="0,000"
                              />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-[11px] font-black text-emerald-700">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-emerald-900 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">Valor Total da Entrega</p>
                    <p className="text-4xl font-black text-white">R$ {Object.entries(batchDeliveryData).reduce((sum, [itemId, qty]) => {
                      const item = selectedContract.items.find(i => i.id === itemId);
                      return sum + ((qty as number) * ((item?.unitPrice as number) || 0));
                    }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingBatch || Object.values(batchDeliveryData).every(v => (v as number) <= 0)}
                    className="w-full md:w-auto px-12 py-5 bg-white text-emerald-900 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSavingBatch ? (
                      <><div className="w-5 h-5 border-4 border-emerald-200 border-t-emerald-900 rounded-full animate-spin"></div> Processando...</>
                    ) : (
                      <><FilePlus size={20} /> Confirmar e Gerar Guia</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {aditivoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setAditivoModal(null)}></div>
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative z-10 shadow-2xl border border-gray-100">
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
                  <input
                    autoFocus
                    type="text"
                    required
                    defaultValue={formatQuantity(0)}
                    onBlur={e => setAditivoQty(parseNumeric(e.target.value))}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-center text-xl"
                    placeholder="0,000"
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Confirmar Aditivo</button>
              </form>
            </div>
          </div>
        )}

        {outputModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setOutputModal(null)}></div>
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative z-10 shadow-2xl border border-gray-100">
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
                  <input
                    autoFocus
                    required
                    type="text"
                    defaultValue={formatQuantity(0)}
                    onBlur={(e) => setOutputQty(parseNumeric(e.target.value))}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-black text-lg focus:border-red-500 transition-all text-center"
                    placeholder="0,000"
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-red-700 transition-all">Confirmar Saída</button>
              </form>
            </div>
          </div>
        )}

        {deliveryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeliveryModal(null)}></div>
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative z-10 shadow-2xl border border-gray-100">
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
                  <input
                    autoFocus
                    required
                    type="text"
                    defaultValue={formatQuantity(0)}
                    onBlur={(e) => setDeliveryQty(parseNumeric(e.target.value))}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-black text-lg focus:border-emerald-500 transition-all text-center"
                    placeholder="0,000"
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all">Confirmar Recebimento</button>
              </form>
            </div>
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
                  <button onClick={() => setShowBatchDeliveryModal(true)} disabled={selectedItems.size === 0} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale ring-4 ring-emerald-500/20">
                    <FileCheck size={18} /> Registrar Entrega em Lote ({selectedItems.size})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-gray-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                      <th className="px-6 py-4 w-12 text-center">
                        <input type="checkbox" onChange={(e) => {
                          if (e.target.checked) setSelectedItems(new Set(filteredItems.map(i => i.id)));
                          else setSelectedItems(new Set());
                        }} checked={selectedItems.size === filteredItems.length && filteredItems.length > 0} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      </th>
                      <th className="px-6 py-4">Item (Descrição / Marca)</th>
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
                          <td className="px-6 py-5 text-center">
                            <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => {
                              const next = new Set(selectedItems);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              setSelectedItems(next);
                            }} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-[11px] font-black text-gray-900 uppercase leading-tight">{item.description}</p>
                            <p className="text-[8px] font-black text-emerald-500 uppercase mt-1">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {item.unit} • {item.brand || 'Original'}</p>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-bold text-gray-500 mb-1">{formatQuantity(remaining)} / {formatQuantity(item.contractedQuantity)}</span>
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50"><div className={`h-full transition-all duration-1000 ${usage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${usage}%` }} /></div>
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
                        <th className="px-6 py-4">Data de Emissão</th>
                        <th className="px-6 py-4 text-right">Valor Total</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentGuides.map((guide) => (
                        <tr key={guide.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <p className="font-black text-gray-900 text-xs uppercase">{guide.guide_number}</p>
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-gray-500 text-xs">{new Date(guide.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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
    );
  }

  return (

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
            <input type="text" placeholder="Nº Contrato ou Fornecedor..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] font-black text-sm uppercase shadow-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
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

      {
        isNewContractModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
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
                    {INITIAL_SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
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
        )
      }

      {/* MODAL IMPORTAÇÃO IA */}
      {
        isImportModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
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

                    <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600"><Calendar size={20} /></div>
                        <div>
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Vigência Encontrada</p>
                          <p className="text-sm font-black text-emerald-600 mt-1 uppercase">
                            {new Date(extractedData.startDate).toLocaleDateString()} ATÉ {new Date(extractedData.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Total de Itens</p>
                        <p className="text-2xl font-black text-emerald-900 leading-none mt-1">{extractedData.items?.length || 0}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ShoppingBag size={14} /> Prévia da Planilha de Itens</h4>
                      <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 text-[8px] font-black text-gray-400 uppercase">
                            <tr>
                              <th className="px-5 py-3">Item / Marca</th>
                              <th className="px-5 py-3 text-center">Quant.</th>
                              <th className="px-5 py-3 text-right">Preço Un.</th>
                              <th className="px-5 py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {extractedData.items?.slice(0, 10).map((item: any, idx: number) => (
                              <tr key={idx} className="bg-white">
                                <td className="px-5 py-3">
                                  <p className="text-[10px] font-black text-gray-900 uppercase leading-tight">{item.description}</p>
                                  <p className="text-[8px] font-black text-emerald-500 uppercase">{item.brand || 'Marca não ident.'}</p>
                                </td>
                                <td className="px-5 py-3 text-center text-xs font-bold text-gray-900">{item.quantity} {item.unit}</td>
                                <td className="px-5 py-3 text-right text-xs font-bold text-gray-900">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-5 py-3 text-right text-xs font-black text-emerald-700">R$ {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {extractedData.items?.length > 10 && (
                          <div className="p-3 bg-gray-50 text-center text-[8px] font-black text-gray-400 uppercase tracking-widest border-t border-gray-100">
                            + {extractedData.items.length - 10} itens ocultos na prévia
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmImport}
                      className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                    >
                      <Save size={24} /> Confirmar Importação de {(extractedData.items?.length || 0)} Itens
                    </button>
                    <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest px-10">Ao confirmar, o sistema irá cadastrar o fornecedor (se necessário), o contrato e todos os itens vinculados automaticamente.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default Contracts;
