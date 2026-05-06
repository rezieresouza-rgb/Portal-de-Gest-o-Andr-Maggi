
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  FileSearch,
  Calculator,
  Truck,
  Download,
  AlertTriangle,
  CheckCircle2,
  Filter,
  FileDown,
  ArrowRight,
  Trash2,
  RefreshCw,
  X,
  Info,
  Search,
  Plus,
  Loader2,
  History,
  Calendar,
  ChevronRight,
  Save,
  Printer,
  Edit2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { OFFICIAL_MENUS } from '../constants/menus';
import { TECHNICAL_SHEETS, PERISHABLES } from '../constants/technicalSheets';
import { ShoppingListItem, Contract } from '../types';

const parseNumeric = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Sanitização robusta: Remove pontos (milhar) e troca vírgula por ponto (decimal)
  // Também remove caracteres não numéricos como 'kg', 'un', etc.
  const cleaned = String(val).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const formatQuantity = (val: number, unit?: string) => {
  if (unit?.toUpperCase() === 'KG') {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const normalize = (str: string) => {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const ShoppingList: React.FC = () => {
  const [activeView, setActiveView] = useState<'new' | 'history'>('new');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [generatedList, setGeneratedList] = useState<ShoppingListItem[]>([]);
  const [studentCount, setStudentCount] = useState(500);
  const [globalProductSearch, setGlobalProductSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // History State
   const [historyLists, setHistoryLists] = useState<any[]>([]);
   const [selectedHistoryList, setSelectedHistoryList] = useState<any | null>(null);
   const [isEditingHistory, setIsEditingHistory] = useState(false);

  // Carrega contratos, alunos e histórico do Supabase
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const { data: activeE } = await supabase
        .from('enrollments')
        .select('student_id')
        .in('status', ['ATIVO', 'RECLASSIFICADO']);
      
      if (activeE && activeE.length > 0) {
        const uniqueStudents = new Set(activeE.map((e: any) => e.student_id));
        setStudentCount(uniqueStudents.size);
      }

      const { data: contractsData } = await supabase
        .from('contracts')
        .select('*, items:contract_items(*), supplier:suppliers(name)')
        .eq('status', 'ATIVO');

      if (contractsData) {
        const formatted: Contract[] = contractsData.map((c: any) => ({
          id: c.id,
          number: c.number,
          supplierId: c.supplier_id,
          supplierName: c.supplier?.name || "Desconhecido",
          startDate: c.start_date,
          endDate: c.end_date,
          status: c.status,
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
         setContracts(formatted);
       }
      setIsLoadingStock(false);
      fetchHistory();
 
    } catch (error) {
      console.error("Erro ao carregar dados do Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('merenda_shopping_lists')
      .select('*, items:merenda_shopping_list_items(*)')
      .order('created_at', { ascending: false });

    if (data) {
      setHistoryLists(data);
    }
  };

  const generateList = () => {
    const weekData = OFFICIAL_MENUS.find(m => m.week === selectedWeek);
    if (!weekData) return;

    const consolidation: Record<string, { quantity: number; unit: string; unitPrice: number; supplier: string; contract: string; contractId: string; contractItemId: string }> = {};

    weekData.days.forEach(day => {
      // Split the dish by '+' to handle multiple preparations (lanche + meal)
      const preparations = day.dish.split('+').map(p => p.trim().toUpperCase());

      preparations.forEach(prepName => {
        const sheet = TECHNICAL_SHEETS.find(s =>
          prepName.includes(s.preparationName) ||
          s.preparationName.includes(prepName)
        );

        if (sheet) {
          sheet.ingredients.forEach(ing => {
            const totalQty = (ing.perCapitaLiquido * studentCount) / 1000;
            processIngredient(ing.description, totalQty);
          });
        } else {
          // Fallback to day.ingredients if no sheet found for this part
          // Only if it's the first part or we don't have sheets at all
          // Actually, better to check if any sheets were found for the day
          day.ingredients.forEach(ingDesc => {
            // Check if this ingredient description is actually in this preparation part
            // This is a bit fuzzy but helps when sheets are missing
            if (prepName.includes(ingDesc.toUpperCase()) || ingDesc.toUpperCase().includes(prepName)) {
              processIngredient(ingDesc, (100 * studentCount) / 1000);
            }
          });
        }
      });
    });

    function processIngredient(description: string, totalQty: number) {
      let supplier = "NÃO VINCULADO";
      let contractNum = "---";
      let contractId = "";
      let contractItemId = "";
      let unit = "KG";
      let price = 0;

      const normSearch = normalize(description);

      let bestMatch = {
        supplier: "NÃO VINCULADO",
        contractNum: "---",
        contractId: "",
        contractItemId: "",
        contractDescription: description, // Default to the technical sheet name
        unit: "KG",
        price: 0,
        score: -1
      };

      // Pass 1: Localizar a melhor correspondência em todos os contratos ativos
      for (const c of contracts) {
        for (const contractItem of c.items) {
          const normItem = normalize(contractItem.description);
          let score = -1;

          // Sistema de Pontuação (Scoring)
          if (normItem === normSearch) {
            score = 100; // Correspondência EXATA
          } else if (normItem.startsWith(normSearch + ' ')) {
            score = 90; // Começa com (ex: "TOMATE" em "TOMATE SALADA")
          } else if (normItem.startsWith(normSearch)) {
            score = 80; // Prefixo forte
          } else {
            const searchWords = normSearch.split(' ');
            const itemWords = normItem.split(' ');

            // Verifica se todas as palavras da busca estão contidas no item (independente da ordem)
            const allWordsMatch = searchWords.every(sw => itemWords.includes(sw));

            if (allWordsMatch) {
              score = 70; // Todas as palavras batem
            } else if (normItem.includes(normSearch)) {
              score = 40; // Inclusão simples (ex: "TOMATE" em "EXTRATO DE TOMATE")
            } else if (normSearch.includes(normItem)) {
              score = 20; // Inclusão reversa
            }
          }

          // Lógica de Prioridade Especial para Carnes e Polpas (Fuzzy Matcher)
          if (score < 60) {
            if (normSearch.includes('ISCA') && normItem.includes('ISCA')) score = 65;
            if (normSearch.includes('POLPA') && normItem.includes('POLPA')) score = 65;
            if (normSearch.includes('FERMENTO') && normItem.includes('FERMENTO')) score = 65;
            if ((normSearch.includes('SUINA') || normSearch.includes('SUINO')) &&
              (normItem.includes('SUINA') || normItem.includes('SUINO'))) score = 65;
          }

          // Atualiza se for a melhor pontuação encontrada até agora
          if (score > bestMatch.score) {
            bestMatch = {
              supplier: c.supplierName,
              contractNum: c.number,
              contractId: c.id,
              contractItemId: contractItem.id,
              contractDescription: contractItem.description,
              unit: contractItem.unit,
              price: contractItem.unitPrice,
              score: score
            };
          }
        }
      }

      if (bestMatch.score >= 0) {
        supplier = bestMatch.supplier;
        contractNum = bestMatch.contractNum;
        contractId = bestMatch.contractId;
        contractItemId = bestMatch.contractItemId;
        description = bestMatch.contractDescription; // Use the contract's name!
        unit = bestMatch.unit;
        price = bestMatch.price;
      }

      // Fallback manual para Fermento (J. ASSIS) se não houver vínculo em nenhum contrato
      if (contractId === "" && normSearch.includes('FERMENTO')) {
        const jAssis = contracts.find(c => c.supplierName.toUpperCase().includes('J. ASSIS'));
        if (jAssis) {
          supplier = jAssis.supplierName;
          contractNum = jAssis.number;
          contractId = jAssis.id;
        }
      }

      if (consolidation[description]) {
        consolidation[description].quantity += totalQty;
      } else {
        consolidation[description] = {
          quantity: totalQty,
          unit,
          unitPrice: price,
          supplier,
          contract: contractNum,
          contractId,
          contractItemId
        };
      }
    }

    const newList: ShoppingListItem[] = Object.entries(consolidation).map(([desc, data]) => ({
      description: desc,
      quantity: Number(data.quantity.toFixed(3)),
      unit: data.unit,
      week: selectedWeek,
      supplierName: data.supplier,
      contractNumber: data.contract,
      contractId: (data as any).contractId,
      contractItemId: (data as any).contractItemId,
      isPerishable: PERISHABLES.includes(desc.toUpperCase()),
      unit_price: data.unitPrice,
      selected: (data as any).contractItemId !== ""
    }));

    // ORDEM ALFABÉTICA
    newList.sort((a, b) => a.description.localeCompare(b.description));

    setGeneratedList(newList);
  };

  const handleSaveToHistory = async () => {
    const selectedItems = generatedList.filter(item => item.selected);
    if (selectedItems.length === 0) {
      alert("Adicione itens à lista para salvar.");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Criar a Lista Mestra
      const { data: listData, error: listError } = await supabase
        .from('merenda_shopping_lists')
        .insert([{
          week: selectedWeek,
          student_count: studentCount,
          total_items: selectedItems.length,
          status: 'GERADA'
        }])
        .select()
        .single();

      if (listError) throw listError;

      // 2. Criar os Itens
      const itemsToInsert = selectedItems.map(item => ({
        list_id: listData.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        supplier_name: item.supplierName,
        contract_number: item.contractNumber,
        unit_price: item.unit_price,
        is_perishable: item.isPerishable,
        observations: item.observations,
        contract_id: item.contractId,
        contract_item_id: item.contractItemId
      }));

      const { error: itemsError } = await supabase
        .from('merenda_shopping_list_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      alert("Lista de compras salva no histórico com sucesso!");
      setGeneratedList([]);
      fetchHistory();
      setActiveView('history');
    } catch (error) {
      console.error("Erro ao salvar histórico:", error);
      alert("Erro ao salvar a lista no histórico.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateHistoryItem = async (itemId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('merenda_shopping_list_items')
        .update({ [field]: value })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setSelectedHistoryList(prev => ({
        ...prev,
        items: prev.items.map((i: any) => i.id === itemId ? { ...i, [field]: value } : i)
      }));
    } catch (error) {
      console.error("Erro ao atualizar item do histórico:", error);
      alert("Erro ao atualizar o item.");
    }
  };

  const handleDeleteHistoryItem = async (itemId: string) => {
    if (!window.confirm("Deseja remover este item da lista salva?")) return;
    try {
      const { error } = await supabase
        .from('merenda_shopping_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setSelectedHistoryList(prev => ({
        ...prev,
        items: prev.items.filter((i: any) => i.id !== itemId)
      }));
    } catch (error) {
      console.error("Erro ao excluir item do histórico:", error);
      alert("Erro ao excluir item.");
    }
  };

  const handleDeleteHistoryList = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta lista permanentemente?")) return;
    try {
      const { error } = await supabase.from('merenda_shopping_lists').delete().eq('id', id);
      if (error) throw error;
      setHistoryLists(prev => prev.filter(l => l.id !== id));
      if (selectedHistoryList?.id === id) setSelectedHistoryList(null);
      alert("Lista excluída!");
    } catch (error) {
      alert("Erro ao excluir.");
    }
  };

  const handleGenerateOrders = async (items: ShoppingListItem[]) => {
    const selectedItems = items.filter(i => i.selected && i.contractId && i.contractItemId);
    if (selectedItems.length === 0) {
      alert("Selecione itens vinculados a contratos para gerar pedidos.");
      return;
    }

    if (!window.confirm(`Deseja gerar pedidos para os ${selectedItems.length} itens selecionados? (Isso criará registros no módulo de Pedidos)`)) return;

    setIsProcessing(true);
    try {
      // Agrupar por contrato
      const groups: Record<string, ShoppingListItem[]> = {};
      selectedItems.forEach(item => {
        const key = item.contractId!;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      for (const [contractId, groupItems] of Object.entries(groups)) {
        const orderNumber = `${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
        const totalValue = groupItems.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0);

        // 1. Criar Pedido
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            contract_id: contractId,
            order_number: orderNumber,
            issue_date: new Date().toLocaleDateString('sv-SE'),
            delivery_date: new Date().toLocaleDateString('sv-SE'),
            total_value: totalValue,
            observations: `Pedido gerado automaticamente da Lista de Compras (Semana ${groupItems[0].week})`,
            status: 'GERADO_DA_LISTA'
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        // 2. Criar Itens do Pedido
        const orderItemsToInsert = groupItems.map(item => ({
          order_id: orderData.id,
          contract_item_id: item.contractItemId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);

        if (itemsError) throw itemsError;
      }

      alert("Pedidos gerados com sucesso! Você pode visualizá-los no módulo de Pedidos.");
    } catch (error) {
      console.error("Erro ao gerar pedidos:", error);
      alert("Erro ao gerar pedidos.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeItem = (index: number) => {
    setGeneratedList(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ShoppingListItem, value: any) => {
    setGeneratedList(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: field === 'quantity' ? parseNumeric(value) : value } : item
    ));
  };

  const toggleAll = (selected: boolean) => {
    setGeneratedList(prev => prev.map(item => ({ ...item, selected })));
  };

  const allAvailableProducts = useMemo(() => {
    if (!globalProductSearch || globalProductSearch.length < 2) return [];

    const results: any[] = [];
    contracts.forEach(contract => {
      contract.items.forEach(item => {
        if (item.description.toLowerCase().includes(globalProductSearch.toLowerCase())) {
          results.push({
            ...item,
            contractId: contract.id,
            contractNumber: contract.number,
            supplierName: contract.supplierName
          });
        }
      });
    });
    // SORT RESULTS TOO
    results.sort((a, b) => a.description.localeCompare(b.description));
    return results.slice(0, 8);
  }, [contracts, globalProductSearch]);

  const parseMealQuantity = (qtyStr: string): number => {
    if (!qtyStr) return 0;
    // Extrai apenas os números e pontos/vírgulas
    const cleaned = qtyStr.replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const getStockForProduct = (productName: string) => {
    if (isLoadingStock) return 'loading';
    const normalizedTarget = normalize(productName);

    // BUSCAR SALDO NOS CONTRATOS ATIVOS
    let totalBalance = 0;
    let found = false;

    contracts.forEach(contract => {
      contract.items.forEach(ci => {
        const normalizedCi = normalize(ci.description);
        // Busca exata ou parcial para maior robustez
        if (normalizedCi === normalizedTarget || normalizedCi.includes(normalizedTarget) || normalizedTarget.includes(normalizedCi)) {
          totalBalance += ((ci.contractedQuantity || 0) - (ci.acquiredQuantity || 0));
          found = true;
        }
      });
    });

    return found ? totalBalance : null;
  };

  const addManualItem = async (product: any) => {
    const newItemBase = {
      description: product.description,
      quantity: 1,
      unit: product.unit,
      week: selectedHistoryList ? selectedHistoryList.week : selectedWeek,
      supplierName: product.supplierName,
      contractNumber: product.contractNumber,
      contractId: product.contractId,
      contractItemId: product.id,
      isPerishable: PERISHABLES.includes(product.description.toUpperCase()),
      unit_price: product.unitPrice,
      observations: "",
      selected: true
    };

    if (selectedHistoryList && isEditingHistory) {
      try {
        const { data, error } = await supabase
          .from('merenda_shopping_list_items')
          .insert([{
            list_id: selectedHistoryList.id,
            description: newItemBase.description,
            quantity: newItemBase.quantity,
            unit: newItemBase.unit,
            supplier_name: newItemBase.supplierName,
            contract_number: newItemBase.contractNumber,
            unit_price: newItemBase.unit_price,
            is_perishable: newItemBase.isPerishable,
            observations: newItemBase.observations,
            contract_id: newItemBase.contractId,
            contract_item_id: newItemBase.contractItemId
          }])
          .select()
          .single();

        if (error) throw error;

        setSelectedHistoryList(prev => ({
          ...prev,
          items: [...prev.items, data].sort((a, b) => a.description.localeCompare(b.description))
        }));
      } catch (error) {
        console.error("Erro ao adicionar item ao histórico:", error);
        alert("Erro ao adicionar item.");
      }
    } else {
      setGeneratedList(prev => {
        const updated = [...prev, newItemBase];
        return updated.sort((a, b) => a.description.localeCompare(b.description));
      });
    }
    setGlobalProductSearch("");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-32 space-y-4">
        <Loader2 size={48} className="text-emerald-600 animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Carregando Merenda Escolar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* Vistas / Tabs */}
      <div className="flex gap-4 mb-2 no-print">
        <button
          onClick={() => { setActiveView('new'); setSelectedHistoryList(null); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'new' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-white text-gray-400 border border-gray-100'}`}
        >
          <Plus size={16} /> Nova Lista
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'history' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-white text-gray-400 border border-gray-100'}`}
        >
          <History size={16} /> Histórico de Listas
        </button>
      </div>

      {activeView === 'new' && (
        <>
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm no-print">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg">
                  <ShoppingCart size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Lista de Compras Semanal</h2>
                  <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                    Cardápio Semanal x <span className="text-orange-600">{studentCount} Alunos</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input
                    type="text"
                    placeholder="Adicionar item do contrato..."
                    value={globalProductSearch}
                    onChange={(e) => setGlobalProductSearch(e.target.value)}
                    className="pl-12 pr-6 py-3 bg-gray-100 border-none rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-orange-500/20 w-64"
                  />
                  {allAvailableProducts.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[300px]">
                      {allAvailableProducts.map(p => (
                        <button key={p.id} onClick={() => addManualItem(p)} className="w-full text-left p-4 hover:bg-orange-50 flex items-center justify-between group">
                          <div>
                            <p className="text-[10px] font-black uppercase text-gray-900">{p.description}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">{p.supplierName}</p>
                          </div>
                          <Plus size={14} className="text-orange-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <select value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))} className="p-3 bg-gray-100 border-none rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-orange-500/20">
                  {[1, 2, 3, 4, 5].map(w => <option key={w} value={w}>{w}ª Semana</option>)}
                </select>
                <button onClick={generateList} className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                  <Calculator size={16} /> Gerar Lista
                </button>
              </div>
            </div>
          </div>

          {generatedList.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <FileSearch size={18} className="text-orange-600" /> Itens Gerados - {selectedWeek}ª Semana
                  </h3>
                  <button onClick={() => window.print()} className="no-print p-2.5 bg-white text-gray-400 hover:text-orange-600 rounded-xl border border-gray-200 transition-all" title="Imprimir">
                    <Printer size={18} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="px-8 py-4 w-10 no-print">
                          <input type="checkbox" checked={generatedList.length > 0 && generatedList.every(i => i.selected)} onChange={(e) => toggleAll(e.target.checked)} className="rounded border-gray-300 text-orange-600" />
                        </th>
                        <th className="px-4 py-4">Ingrediente (A-Z)</th>
                        <th className="px-6 py-4 text-center">Saldo Contrato</th>
                        <th className="px-6 py-4 text-center">Qtd. Necessária</th>
                        <th className="px-6 py-4">Observação</th>
                        <th className="px-6 py-4">Fornecedor / Contrato</th>
                        <th className="px-6 py-4 text-right no-print">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {generatedList.map((item, idx) => (
                        <tr key={idx} className={`hover:bg-orange-50/30 transition-colors group ${!item.selected ? 'opacity-50' : ''}`}>
                          <td className="px-8 py-5 no-print">
                            <input type="checkbox" checked={item.selected} onChange={(e) => updateItem(idx, 'selected', e.target.checked)} className="rounded border-gray-300 text-orange-600" />
                          </td>
                          <td className="px-4 py-5 font-black text-gray-900 uppercase text-xs">
                            {item.description}
                            {item.isPerishable && <span className="block text-[7px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase mt-1 w-fit">Perecível</span>}
                          </td>
                          <td className="px-6 py-5 text-center">
                             {(() => {
                                const stock = getStockForProduct(item.description);
                                
                                if (stock === 'loading') return <Loader2 size={12} className="animate-spin text-orange-400 mx-auto" />;
                                
                                if (stock === null) return (
                                  <div className="group relative cursor-help">
                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter italic">Não mapeado</span>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[8px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none text-center font-bold uppercase">
                                      Nenhum contrato ativo encontrado com este item. Confira o nome no contrato.
                                    </div>
                                  </div>
                                );
                                
                                return (
                                  <div className="group relative cursor-help flex flex-col items-center">
                                    <span className={`text-[11px] font-black ${(stock as number) <= (item.quantity * 2) ? 'text-red-500' : 'text-emerald-700'}`}>
                                      {formatQuantity(stock as number, item.unit)}
                                    </span>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-gray-900 text-white text-[8px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none text-center font-bold uppercase leading-relaxed">
                                      Saldo Disponível no Contrato <br/>
                                      (Qtd Contratada - Qtd Já Pedida)
                                    </div>
                                  </div>
                                );
                             })()}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="text"
                                defaultValue={formatQuantity(item.quantity, item.unit)}
                                onBlur={(e) => updateItem(idx, 'quantity', e.target.value)}
                                className="w-24 p-2 bg-white border border-gray-200 rounded-2xl text-center font-black text-orange-600 text-sm outline-none no-print"
                              />
                              <span className="hidden print:block print:text-xs">{formatQuantity(item.quantity, item.unit)}</span>
                              <span className="text-[10px] font-black text-gray-400 uppercase">{item.unit}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <input
                              type="text"
                              placeholder="Add observação..."
                              value={item.observations || ""}
                              onChange={(e) => updateItem(idx, 'observations', e.target.value)}
                              className="w-full p-2 bg-gray-50 border-none rounded-xl text-[10px] font-bold text-gray-600 outline-none focus:ring-1 focus:ring-orange-500/20 no-print"
                            />
                            <span className="hidden print:block text-[9px] text-gray-500 italic">{item.observations}</span>
                          </td>
                          <td className="px-6 py-5 uppercase text-[10px]">
                            <p className="font-bold text-gray-900">{item.supplierName}</p>
                            <p className="text-[8px] text-gray-400">{item.contractNumber !== "---" ? `CT ${item.contractNumber}` : "Sem Contrato"}</p>
                          </td>
                          <td className="px-6 py-5 text-right no-print">
                            <button onClick={() => removeItem(idx)} className="p-2.5 text-gray-400 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-4 no-print">
                <button
                  onClick={handleSaveToHistory}
                  disabled={isProcessing || generatedList.filter(i => i.selected).length === 0}
                  className="px-10 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar no Histórico
                </button>
                <button
                  onClick={() => handleGenerateOrders(generatedList)}
                  disabled={isProcessing || generatedList.filter(i => i.selected).length === 0}
                  className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                  Gerar Pedidos de Compra
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
              <Calculator size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Inicie selecionando uma semana.</p>
            </div>
          )}
        </>
      )}

      {activeView === 'history' && !selectedHistoryList && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {historyLists.length > 0 ? historyLists.map((list) => (
            <div key={list.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><History size={20} /></div>
                  <button onClick={() => handleDeleteHistoryList(list.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                </div>
                <h4 className="font-black text-gray-900 uppercase text-sm mb-1">Lista Semana {list.week}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(list.created_at).toLocaleDateString('pt-BR')} às {new Date(list.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[9px] font-black uppercase">{list.total_items} Itens</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">{list.student_count} Alunos</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedHistoryList(list)}
                className="mt-6 w-full py-3 bg-gray-50 group-hover:bg-orange-600 group-hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                Ver Detalhes <ArrowRight size={14} />
              </button>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center"><History size={48} className="mx-auto mb-4 text-gray-200" /><p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma lista salva no histórico.</p></div>
          )}
        </div>
      )}

      {selectedHistoryList && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedHistoryList(null)} className="p-3 bg-gray-50 text-gray-400 hover:text-orange-600 rounded-2xl transition-all"><X size={20} /></button>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase">Detalhes do Histórico</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gerada em {new Date(selectedHistoryList.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isEditingHistory && (
                <div className="relative group no-print mr-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input
                    type="text"
                    placeholder="Adicionar ao histórico..."
                    value={globalProductSearch}
                    onChange={(e) => setGlobalProductSearch(e.target.value)}
                    className="pl-12 pr-6 py-3 bg-gray-100 border-none rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-orange-500/20 w-64"
                  />
                  {allAvailableProducts.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[300px]">
                      {allAvailableProducts.map(p => (
                        <button key={p.id} onClick={() => addManualItem(p)} className="w-full text-left p-4 hover:bg-orange-50 flex items-center justify-between group">
                          <div>
                            <p className="text-[10px] font-black uppercase text-gray-900">{p.description}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">{p.supplierName}</p>
                          </div>
                          <Plus size={14} className="text-orange-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => setIsEditingHistory(!isEditingHistory)} className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${isEditingHistory ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {isEditingHistory ? <CheckCircle2 size={16} /> : <Edit2 size={16} />}
                {isEditingHistory ? "Finalizar Edição" : "Editar Lista"}
              </button>
              <button
                onClick={() => handleGenerateOrders(selectedHistoryList.items.map((i: any) => ({
                  ...i,
                  supplierName: i.supplier_name,
                  contractNumber: i.contract_number,
                  unit_price: i.unit_price,
                  isPerishable: i.is_perishable,
                  selected: true, // In history view, we assume items in the list are "selected" for order unless filtered
                  contractId: i.contract_id || selectedHistoryList.contract_id, // Map database fields
                  contractItemId: i.contract_item_id
                })))}
                disabled={isProcessing}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                Gerar Pedidos
              </button>
              <button onClick={() => window.print()} className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Printer size={16} /> Imprimir
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lista Oficial de Compra</span>
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Semana {selectedHistoryList.week}</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                   <th className="px-8 py-4">Ingrediente</th>
                   <th className="px-6 py-4 text-center">Estoque Atual</th>
                   <th className="px-6 py-4 text-center">Quantidade</th>
                  <th className="px-6 py-4">Observação</th>
                  <th className="px-6 py-4">Fornecedor / Contrato</th>
                  <th className="px-6 py-4 text-right no-print">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {selectedHistoryList.items.sort((a: any, b: any) => a.description.localeCompare(b.description)).map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5">
                     <p className="font-black text-gray-900 uppercase text-xs">{item.description}</p>
                     {item.is_perishable && <span className="text-[7px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Perecível</span>}
                   </td>
                   <td className="px-6 py-5 text-center">
                      {(() => {
                         const stock = getStockForProduct(item.description);
                         if (stock === 'loading') return <Loader2 size={10} className="animate-spin text-gray-400 mx-auto" />;
                         if (stock === null) return <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter italic">---</span>;
                         
                         return (
                            <div className="group relative cursor-help flex flex-col items-center">
                               <span className={`text-[11px] font-black ${(stock as number) <= (item.quantity * 2) ? 'text-red-500' : 'text-emerald-700'}`}>
                                  {formatQuantity(stock as number, item.unit)}
                               </span>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[7px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none text-center font-bold uppercase leading-relaxed">
                                  Saldo Contratual na data
                               </div>
                            </div>
                         );
                      })()}
                   </td>
                   <td className="px-6 py-5 text-center">
                      {isEditingHistory ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="text"
                            defaultValue={formatQuantity(item.quantity, item.unit)}
                            onBlur={(e) => handleUpdateHistoryItem(item.id, 'quantity', parseNumeric(e.target.value))}
                            className="w-24 p-2 bg-orange-50 border border-orange-100 rounded-xl text-center font-black text-orange-600 text-xs"
                          />
                          <span className="text-[9px] font-bold text-gray-400">{item.unit}</span>
                        </div>
                      ) : (
                        <p className="font-black text-gray-900 text-sm">{formatQuantity(item.quantity, item.unit)} <span className="text-[10px] text-gray-400 uppercase">{item.unit}</span></p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {isEditingHistory ? (
                        <input
                          type="text"
                          defaultValue={item.observations || ""}
                          onBlur={(e) => handleUpdateHistoryItem(item.id, 'observations', e.target.value)}
                          className="w-full p-2 bg-orange-50 border border-orange-100 rounded-xl text-[10px] font-bold text-gray-600 outline-none"
                        />
                      ) : (
                        <p className="text-[10px] text-gray-500 italic">{item.observations || "---"}</p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-bold text-gray-900 uppercase">{item.supplier_name}</p>
                      <p className="text-[8px] text-gray-400 font-black uppercase">CT {item.contract_number}</p>
                    </td>
                    <td className="px-6 py-5 text-right no-print">
                      {isEditingHistory && (
                        <button onClick={() => handleDeleteHistoryItem(item.id)} className="p-2 text-gray-400 hover:text-red-600 transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          /* Hide non-printing elements */
          .no-print { display: none !important; }
          
          /* Reset outer layout for full content flow */
          html, body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Reset parent containers (Tailwind classes) */
          .h-screen, 
          .overflow-hidden, 
          .overflow-y-auto, 
          .flex-1,
          main,
          aside {
            height: auto !important;
            overflow: visible !important;
            max-height: none !important;
            position: static !important;
            display: block !important;
          }

          /* Specific structure within MerendaModule and App */
          #root, .min-h-screen {
            height: auto !important;
            overflow: visible !important;
          }

          /* Table styling for print */
          .overflow-x-auto {
            overflow: visible !important;
          }
          
          table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            table-layout: auto !important;
          }

          th, td { 
            border-bottom: 1px solid #eee !important; 
            padding: 10px 6px !important; 
            word-break: break-word !important;
          }

          /* Avoid breaking rows across pages */
          tr {
            page-break-inside: avoid !important;
          }

          /* Aesthetic adjustments for print */
          .bg-white { border: none !important; box-shadow: none !important; }
          .shadow-sm, .shadow-xl, .shadow-lg { box-shadow: none !important; }
          .font-black { font-weight: 800 !important; }
          .text-orange-600 { color: #ea580c !important; }
          
          /* Ensure colors and backgrounds print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ShoppingList;
