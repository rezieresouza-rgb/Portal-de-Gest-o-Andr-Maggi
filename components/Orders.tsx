
import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Loader2,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  Zap,
  AlertTriangle,
  TrendingDown,
  History,
  ArrowLeft,
  Trash2,
  FileText,
  Calendar,
  ChevronRight,
  FileDown,
  DollarSign,
  PackageCheck,
  Building2,
  UserCheck,
  Clock,
  PackageSearch,
  Check,
  X,
  Save
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Contract, Order, ContractStatus } from '../types';
import { ContractItem } from '../types'; // Ensure imported if needed 
// Removed INITIAL data imports as we fetch from DB

// Dados da escola removidos a pedido do usuário

interface LocalOrderItem {
  contractItemId: string;
  description: string;
  unit: string;
  unitPrice: number;
  requestedQuantity: number;
  brand: string;
  selected: boolean;
}

const Orders: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [globalProductSearch, setGlobalProductSearch] = useState("");
  const [localItems, setLocalItems] = useState<LocalOrderItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [originalItemsSnapshot, setOriginalItemsSnapshot] = useState<any[]>([]); // To revert stock on update

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]); // Using any for now to avoid strict typing issues with Supplier interface if it changed

  const [contractId, setContractId] = useState<string>(""); // Helper for pdf generation if needed, but we use pdfData
  const [pdfData, setPdfData] = useState<{ order: Order, contract: Contract, items: any[] } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // ... (fetchData and other functions)

  const handleDownloadPdf = async (order: Order) => {
    setIsProcessing(true);
    try {
      // 1. Find Data
      const contract = contracts.find(c => c.number === order.contractNumber && c.supplierName === order.supplierName)
        || contracts.find(c => c.id === (order as any).contractId);

      if (!contract) {
        alert("Contrato vinculado não encontrado. Não é possível gerar o PDF.");
        setIsProcessing(false);
        return;
      }

      const supplier = suppliers.find(s => s.id === contract.supplierId) || contract.supplier; // Fallback if structure differs

      // 2. Prepare Items for PDF
      const pdfItems = order.items.map((item: any) => {
        const contractItem = contract.items.find(ci => ci.description === item.description);
        return {
          ...item,
          unit: contractItem?.unit || 'UN',
          brand: contractItem?.brand || '',
          // Calculate remaining at the time? No, show current remaining or just skip?
          // The receipt usually shows "Saldo Ativo". 
          // We should show CURRENT balance or balance at time of order? 
          // Usually current balance is most useful for control, or snapshot. 
          // Let's show current balance from contractItem.
          currentBalance: contractItem ? (contractItem.contractedQuantity - contractItem.acquiredQuantity) : 0
        };
      });

      setPdfData({
        order,
        contract: { ...contract, supplier: supplier }, // Ensure supplier info is attached
        items: pdfItems
      });

      // 3. Wait for Render and Print
      setTimeout(async () => {
        const element = document.getElementById('hidden-printable-area');
        if (element) {
          // Temporarily make it visible for html2pdf if needed, or just standard hidden rendering
          // html2pdf usually works on hidden elements if display is not none, but visibility hidden or off-screen.
          // But 'pdf-hidden' class usually handles this.

          await (window as any).html2pdf().set({
            margin: [5, 5, 5, 5],
            filename: `Guia_Pedido_Merenda_${order.orderNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          }).from(element).save();

          setPdfData(null); // Clear after download
        }
        setIsProcessing(false);
      }, 500);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erro ao gerar PDF.");
      setIsProcessing(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch Contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          supplier:suppliers (id, name, cnpj, phone),
          items:contract_items (*)
        `);

      if (contractsError) throw contractsError;

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
      setContracts(formattedContracts);

      // Collect Suppliers from Contracts (or fetch all if needed, but here we need details for the selected contract supplier)
      // The contract fetch already includes supplier details. We can extract them if needed for a list, 
      // but the UI mainly uses `selectedSupplier` derived from `selectedContract`.
      // Let's also fetch all suppliers just in case, or rely on contract.supplier.
      // But `selectedSupplier` calculation below (lines 119-121) relies on `suppliers` array or `selectedContract`.
      // The logic at 119 finds supplier in `suppliers` array.
      // Let's populate `suppliers` from the fetched contracts' suppliers to avoid separate fetch if possible, 
      // or just fetch all suppliers.

      const uniqueSuppliers = Array.from(new Map(contractsData.map((c: any) => [c.supplier.id, c.supplier])).values());
      setSuppliers(uniqueSuppliers);

      // Fetch Orders History
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          supplier:contracts (supplier:suppliers (name)), 
          items:order_items (*)
        `)
        .order('issue_date', { ascending: false });

      if (ordersError) throw ordersError;

      const formattedOrders: Order[] = ordersData.map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        contractId: o.contract_id, // Added
        contractNumber: o.contract?.number || '---',
        supplierName: o.supplier?.supplier?.name || 'Desconhecido',
        issueDate: o.issue_date,
        deliveryDate: o.delivery_date,
        totalValue: o.total_value,
        observations: o.observations || '',
        items: o.items.map((i: any) => ({
          id: i.id, // Order Item ID
          contractItemId: i.contract_item_id, // Added
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          unit: 'UN',
          brand: ''
        }))
      }));
      setOrderHistory(formattedOrders);

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Helper to format date
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "---";
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };



  const allAvailableProducts = useMemo(() => {
    if (!globalProductSearch || globalProductSearch.length < 2) return [];

    const results: any[] = [];
    contracts.forEach(contract => {
      contract.items.forEach(item => {
        if (item.description.toLowerCase().includes(globalProductSearch.toLowerCase())) {
          const remaining = item.contractedQuantity - item.acquiredQuantity;
          results.push({
            ...item,
            contractId: contract.id,
            contractNumber: contract.number,
            supplierName: contract.supplierName,
            contractType: contract.type,
            remaining
          });
        }
      });
    });
    return results.slice(0, 8);
  }, [contracts, globalProductSearch]);

  const selectedContract = useMemo(() =>
    contracts.find(c => c.id === selectedContractId),
    [selectedContractId, contracts]);

  const selectedSupplier = useMemo(() =>
    selectedContract ? suppliers.find(s => s.id === selectedContract.supplierId) : null
    , [selectedContract, suppliers]);

  const filteredHistory = useMemo(() => {
    return orderHistory.filter(order =>
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.includes(searchTerm)
    );
  }, [orderHistory, searchTerm]);

  const handleContractChange = (id: string, highlightItemId?: string) => {
    setSelectedContractId(id);
    const contract = contracts.find(c => c.id === id);
    if (contract) {
      setLocalItems(contract.items.map(item => ({
        contractItemId: item.id,
        description: item.description,
        unit: item.unit,
        unitPrice: item.unitPrice,
        requestedQuantity: 0,
        brand: item.brand || "",
        selected: item.id === highlightItemId
      })));
      setGlobalProductSearch("");
      if (highlightItemId) setItemSearchTerm("");
    } else {
      setLocalItems([]);
    }
  };

  const handleEditOrder = (order: Order) => {
    try {
      // 1. Set Basic State
      setEditingOrder(order);
      setViewMode('form');
      setOrderDate(order.issueDate);
      setDeliveryDate(order.deliveryDate || '');
      setObservations(order.observations || '');

      // 2. Find Contract

      const linkedContract = contracts.find(c => c.number === order.contractNumber && c.supplierName === order.supplierName);

      const contractId = (order as any).contractId;

      if (contractId) {
        setSelectedContractId(contractId);
        const contract = contracts.find(c => c.id === contractId);

        if (contract) {
          // 3. Rebuild Items with Adjusted Balance
          const mergedItems = contract.items.map(cItem => {
            const orderItem = order.items.find((oi: any) => oi.description === cItem.description);

            const qty = orderItem ? orderItem.quantity : 0;

            return {
              contractItemId: cItem.id,
              description: cItem.description,
              unit: cItem.unit,
              unitPrice: cItem.unitPrice,
              requestedQuantity: qty,
              brand: cItem.brand || "",
              selected: qty > 0
            };
          });

          setLocalItems(mergedItems);

          // 4. Snapshot for Revert
          setOriginalItemsSnapshot(order.items.map((i: any) => ({
            contractItemId: i.contract_item_id || i.contractItemId, // handling potential naming
            quantity: i.quantity
          })));
        }
      }
    } catch (error: any) {
      console.error("Error editing order:", error);
      alert("Erro ao abrir edição do pedido: " + error.message);
    }
  };

  const updateLocalItem = (id: string, field: keyof LocalOrderItem, value: any) => {
    setLocalItems(prev => prev.map(item => {
      if (item.contractItemId === id) {
        if (field === 'requestedQuantity') {
          const contractItem = selectedContract?.items.find(i => i.id === id);
          if (contractItem) {
            // ADJUSTED BALANCE LOGIC
            // Available = (ContractLimit - Acquired) + (OriginalOrderQty if any)
            const originalItem = originalItemsSnapshot.find(oi => oi.contractItemId === id);
            const originalQty = originalItem ? originalItem.quantity : 0;
            const available = (contractItem.contractedQuantity - contractItem.acquiredQuantity) + originalQty;

            if (Number(value) > available) {
              return { ...item, [field]: available, selected: true };
            }
          }
        }
        return { ...item, [field]: value, selected: field === 'requestedQuantity' ? Number(value) > 0 : item.selected };
      }
      return item;
    }));
  };

  const toggleItemSelection = (id: string) => {
    setLocalItems(prev => prev.map(item =>
      item.contractItemId === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const removeItemFromOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita conflitos de clique com a linha da tabela
    setLocalItems(prev => prev.filter(item => item.contractItemId !== id));
  };

  const filteredLocalItems = useMemo(() => {
    return localItems.filter(item =>
      item.description.toLowerCase().includes(itemSearchTerm.toLowerCase())
    );
  }, [localItems, itemSearchTerm]);

  const totalValue = useMemo(() =>
    localItems.reduce((acc, item) => item.selected ? acc + (item.requestedQuantity * item.unitPrice) : acc, 0),
    [localItems]);

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    const selected = localItems.filter(item => item.selected && item.requestedQuantity > 0);
    if (selected.length === 0) return alert("Selecione os produtos e informe as quantidades.");

    // Validate if New Quantity exceeds (Balance + Original Qty)
    // This is already indirectly handled by updateLocalItem logic but good to double check?
    // We trust updateLocalItem logic for now to keep UI responsive.

    setIsProcessing(true);
    try {
      // 1. REVERT ORIGINAL STOCK
      // We iterate through original snapshot and add quantities back to contract items
      for (const oldItem of originalItemsSnapshot) {
        // Fetch current to be safe? Or just increment.
        // Increment is safer against race conditions but we need current value.
        // Let's Fetch current item to get acquired_quantity
        const { data: currentDbItem } = await supabase.from('contract_items').select('acquired_quantity').eq('id', oldItem.contractItemId).single();

        if (currentDbItem) {
          const revertedAcquired = Math.max(0, currentDbItem.acquired_quantity - oldItem.quantity);
          await supabase.from('contract_items').update({ acquired_quantity: revertedAcquired }).eq('id', oldItem.contractItemId);
        }
      }

      // 2. UPDATE ORDER RECORD
      const { error: headerError } = await supabase.from('orders').update({
        issue_date: orderDate,
        delivery_date: deliveryDate,
        total_value: totalValue,
        observations: observations.trim()
      }).eq('id', editingOrder.id);

      if (headerError) throw headerError;

      // 3. REPLACE ORDER ITEMS (Delete all for this order, then re-insert)
      // This is cleaner than trying to diff updates/inserts/deletes
      await supabase.from('order_items').delete().eq('order_id', editingOrder.id);

      for (const item of selected) {
        // Insert new order item
        const { error: itemError } = await supabase.from('order_items').insert([{
          order_id: editingOrder.id,
          contract_item_id: item.contractItemId,
          description: item.description,
          quantity: item.requestedQuantity,
          unit_price: item.unitPrice
        }]);
        if (itemError) throw itemError;

        // 4. CONSUME NEW STOCK
        const { data: currentDbItem } = await supabase.from('contract_items').select('acquired_quantity').eq('id', item.contractItemId).single();
        if (currentDbItem) {
          const newAcquired = currentDbItem.acquired_quantity + item.requestedQuantity;
          await supabase.from('contract_items').update({ acquired_quantity: newAcquired }).eq('id', item.contractItemId);
        }
      }

      alert("Pedido atualizado com sucesso!");
      await fetchData();

      // Reset
      setEditingOrder(null);
      setViewMode('history');
      setLocalItems([]);
      setObservations("");
      setOriginalItemsSnapshot([]);

    } catch (error: any) {
      console.error("Erro ao atualizar pedido:", error);
      alert("Erro ao atualizar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalizeAndDownload = async () => {
    const selected = localItems.filter(item => item.selected && item.requestedQuantity > 0);
    if (selected.length === 0) return alert("Selecione os produtos e informe as quantidades.");

    const overLimitItems = localItems.filter(li => {
      if (!li.selected) return false;
      const ci = selectedContract?.items.find(i => i.id === li.contractItemId);
      return ci && li.requestedQuantity > (ci.contractedQuantity - ci.acquiredQuantity);
    });

    if (overLimitItems.length > 0) {
      return alert("Erro: Alguns itens selecionados excedem o saldo disponível no contrato.");
    }

    setIsProcessing(true);
    try {
      const orderNumber = `${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Create Order
      const { data: orderData, error: orderError } = await supabase.from('orders').insert([{
        contract_id: selectedContractId,
        order_number: orderNumber,
        issue_date: orderDate,
        delivery_date: deliveryDate,
        total_value: totalValue,
        observations: observations.trim(),
        status: 'EM_PROCESSAMENTO'
      }]).select().single();

      if (orderError) throw orderError;

      // 2. Create Order Items and Update Contract Items
      for (const item of selected) {
        // Insert order item
        const { error: itemError } = await supabase.from('order_items').insert([{
          order_id: orderData.id,
          contract_item_id: item.contractItemId,
          description: item.description,
          quantity: item.requestedQuantity,
          unit_price: item.unitPrice
        }]);
        if (itemError) throw itemError;

        // Update contract item balance
        const currentItem = selectedContract?.items.find(i => i.id === item.contractItemId);
        if (currentItem) {
          const newAcquired = currentItem.acquiredQuantity + item.requestedQuantity;
          const { error: updateError } = await supabase.from('contract_items')
            .update({ acquired_quantity: newAcquired })
            .eq('id', item.contractItemId);
          if (updateError) throw updateError;
        }
      }

      // 3. Create Event
      await supabase.from('contract_events').insert([{
        contract_id: selectedContractId,
        type: 'PEDIDO',
        description: `Emissão da Guia #${orderNumber}`,
        value: totalValue,
        date: new Date().toISOString()
      }]);

      // 4. Generate PDF
      const element = document.getElementById('printable-area');
      if (element) {
        // @ts-ignore
        await window.html2pdf().set({
          margin: [5, 5, 5, 5],
          filename: `Guia_Pedido_Merenda_${orderNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save();
      }

      alert("Pedido finalizado com sucesso! O saldo do contrato foi atualizado.");

      // Refresh data
      await fetchData();
      setViewMode('history');
      setLocalItems([]);
      setObservations("");

    } catch (error: any) {
      console.error(error);
      alert("Erro ao processar o pedido: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 no-print">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-3xl shadow-lg ${viewMode === 'form' ? 'bg-emerald-600' : 'bg-gray-900'} text-white transition-colors`}>
              {viewMode === 'form' ? <ShoppingCart size={32} /> : <History size={32} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                {viewMode === 'form' ? "Gestão de Pedidos" : "Histórico de Guias"}
              </h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                {viewMode === 'form' ? "Vínculo direto com saldo de contratos ativos" : "Registros Oficiais de Compras"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setViewMode(viewMode === 'form' ? 'history' : 'form'); setSelectedOrderId(null); }}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'history' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <History size={16} /> Ver Arquivo de Guias
            </button>

            {viewMode === 'form' && (
              <div className="flex gap-2">
                {editingOrder && (
                  <button
                    onClick={() => {
                      setEditingOrder(null);
                      setViewMode('history');
                      setLocalItems([]);
                      alert("Edição cancelada.");
                    }}
                    className="px-6 py-2.5 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-100 transition-all"
                  >
                    <X size={16} /> Cancelar
                  </button> // Added cancel button
                )}

                <button
                  onClick={editingOrder ? handleUpdateOrder : handleFinalizeAndDownload}
                  disabled={isProcessing || totalValue === 0}
                  className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${totalValue === 0 ? 'bg-gray-100 text-gray-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'}`}
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : editingOrder ? <Save size={16} /> : <CheckCircle2 size={16} />}
                  {editingOrder ? "Salvar Alterações" : "Gerar Guia & Baixar Saldo"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'form' ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm no-print space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <PackageSearch size={14} /> Busca Inteligente em Contratos
                </label>
                {/* Disable search locally when editing to keep focus on current contract items */}
                {editingOrder ? (
                  <div className="p-4 bg-gray-100 rounded-2xl text-gray-400 text-xs font-bold uppercase text-center border-2 border-dashed border-gray-200">
                    Busca de produtos bloqueada durante a edição
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="text"
                      placeholder="Busque um alimento no acervo de contratos..."
                      value={globalProductSearch}
                      onChange={(e) => setGlobalProductSearch(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white transition-all"
                    />
                  </div>
                )}

                {allAvailableProducts.length > 0 && !editingOrder && (
                  <div className="absolute z-[110] left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                      {allAvailableProducts.map((p) => (
                        <button
                          key={`${p.contractId}-${p.id}`}
                          onClick={() => handleContractChange(p.contractId, p.id)}
                          className="w-full text-left p-4 hover:bg-emerald-50 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-sm font-black text-gray-900 uppercase">{p.description}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                              {p.supplierName} • CT {p.contractNumber}
                            </p>
                            <p className="text-[9px] text-emerald-600 font-black mt-1">DISPONÍVEL: {p.remaining.toFixed(1)} {p.unit}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seleção de Contrato Manual</label>
                <select
                  value={selectedContractId}
                  onChange={(e) => handleContractChange(e.target.value)}
                  disabled={!!editingOrder} // Disable changing contract while editing
                  className={`w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white transition-all h-[54px] ${editingOrder ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <option value="">Selecione o contrato...</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>CT {c.number} - {c.supplierName}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Emissão</label>
                <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none h-[54px]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Previsão de Entrega</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black text-sm outline-none h-[54px]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações Gerais</label>
                <input
                  type="text"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ex: Entregar produtos hortifruti às 07:00..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none h-[54px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6 gap-4">
            <div className="flex items-center justify-start flex-1">
              <img src="/logo-escola.png" alt="Escola Logo" className="h-24 w-auto object-contain" />
            </div>
            <div className="flex-[2] flex justify-center px-4">
              <img src="/dados escola.jpeg" alt="Dados da Escola" className="h-28 w-full object-contain" />
            </div>
            <div className="flex items-center justify-end flex-1">
              <img src="/SEDUC 2.jpg" alt="SEDUC MT" className="h-16 w-auto object-contain" />
            </div>
          </div>

          <div className="bg-black text-white p-3 rounded-lg text-center mb-8">
            <h2 className="text-sm font-black uppercase tracking-[0.2em]">Guia de Pedido de Gêneros Alimentícios</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="border-2 border-black p-4 rounded-xl space-y-2 relative">
              <div className="absolute -top-3 left-4 bg-white px-2 text-[9px] font-black uppercase tracking-widest">Fornecedor Contratado</div>
              <p className="text-sm font-black uppercase">{selectedContract?.supplierName || "---"}</p>
              <div className="grid grid-cols-1 gap-1 text-[10px] font-bold uppercase text-gray-600">
                <p>CNPJ: {selectedSupplier?.cnpj || "---"}</p>
                <p>Contato: {selectedSupplier?.phone || "---"}</p>
              </div>
            </div>

            <div className="border-2 border-black p-4 rounded-xl space-y-2 relative bg-gray-50/50">
              <div className="absolute -top-3 left-4 bg-white px-2 text-[9px] font-black uppercase tracking-widest">Dados do Pedido</div>
              <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase">
                <div>
                  <p className="text-gray-400 font-black">Nº Controle:</p>
                  <p className="text-sm font-black">#{new Date().getFullYear()}0001</p>
                </div>
                <div>
                  <p className="text-gray-400 font-black">Nº Contrato:</p>
                  <p className="text-sm font-black">{selectedContract?.number || "---"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-black">Emissão:</p>
                  <p className="text-sm font-black">{formatDateDisplay(orderDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-black text-emerald-700">Prev. Entrega:</p>
                  <p className="text-sm font-black text-emerald-800 underline decoration-2">{formatDateDisplay(deliveryDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {selectedContractId ? (
            <table className="w-full text-left text-[11px] border-collapse mb-8">
              <thead>
                <tr className="bg-gray-100 border-2 border-black text-black">
                  <th className="p-3 uppercase no-print w-16 text-center">Sel./Rem.</th>
                  <th className="p-3 uppercase">Descrição do Gênero / Detalhes</th>
                  <th className="p-3 text-center uppercase w-20">Saldo Ativo</th>
                  <th className="p-3 text-center uppercase w-28 bg-emerald-50">Qtd. Pedido</th>
                  <th className="p-3 text-right uppercase w-32">Total Item</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black border-2 border-black">
                {filteredLocalItems.length > 0 ? filteredLocalItems.map(item => {
                  const contractItem = selectedContract?.items.find(ci => ci.id === item.contractItemId);
                  const remaining = contractItem ? (contractItem.contractedQuantity - contractItem.acquiredQuantity) : 0;

                  return (
                    <tr key={item.contractItemId} className={`group transition-colors ${item.selected ? 'bg-emerald-50/20' : 'hover:bg-gray-50'}`}>
                      <td className="p-3 text-center no-print">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleItemSelection(item.contractItemId)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600"
                          />
                          <button
                            onClick={(e) => removeItemFromOrder(item.contractItemId, e)}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                            title="Remover produto da lista"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-black uppercase text-gray-900">{item.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[8px] font-black bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 uppercase border border-gray-200">UNID: {item.unit}</span>
                          {item.brand && <span className="text-[8px] font-black bg-blue-50 px-1.5 py-0.5 rounded text-blue-600 uppercase border border-blue-100">MARCA: {item.brand}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-center font-black uppercase text-blue-600">{remaining.toFixed(1)}</td>
                      <td className="p-3 text-center bg-emerald-50/30">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            value={item.requestedQuantity || ""}
                            onChange={(e) => updateLocalItem(item.contractItemId, 'requestedQuantity', e.target.value)}
                            className="w-20 border border-gray-300 p-2 text-center font-black rounded-lg no-print outline-none focus:border-emerald-500"
                            placeholder="0"
                          />
                          <span className="hidden pdf-show font-black text-sm">{item.requestedQuantity || '0'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-black text-gray-900">
                        R$ {(item.requestedQuantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-bold uppercase text-xs">Aguardando seleção de contrato...</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-black text-white border-2 border-black">
                  <td colSpan={4} className="p-4 text-right font-black uppercase text-xs tracking-widest">Valor Total do Pedido:</td>
                  <td className="p-4 text-right font-black text-lg">
                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl">
              <p className="text-gray-400 font-black uppercase text-sm tracking-widest">Inicie a seleção do contrato no painel superior</p>
            </div>
          )}

          <div className="border-2 border-black p-4 rounded-xl mb-12 relative bg-gray-50/50">
            <div className="absolute -top-3 left-4 bg-white px-2 text-[9px] font-black uppercase tracking-widest">Notas de Entrega</div>
            <p className="text-[10px] font-bold uppercase leading-relaxed italic">{observations || "Sem observações declaradas."}</p>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-20 text-center">
            <div className="border-t-2 border-black pt-2">
              <p className="font-black uppercase text-[10px] leading-tight">Gestão da Merenda / CDCE</p>
            </div>
            <div className="border-t-2 border-black pt-2">
              <p className="font-black uppercase text-[10px] leading-tight">Entregue em ____/____/____</p>
              <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">Visto do Fornecedor</p>
            </div>
          </div>
        </div>
      ) : (
        /* ABA DE HISTÓRICO */
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                <History className="text-emerald-600" /> Guias de Pedido Arquivadas
              </h3>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input type="text" placeholder="Filtrar histórico..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredHistory.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="group bg-gray-50 p-6 rounded-3xl border border-transparent hover:border-emerald-200 hover:bg-white hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row items-center gap-8"
                >
                  <div className="w-16 h-16 bg-white text-gray-300 rounded-2xl flex items-center justify-center group-hover:text-emerald-600 transition-colors shrink-0 shadow-sm">
                    <FileText size={28} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-gray-900 uppercase tracking-tight">Guia #{order.orderNumber}</h4>
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg uppercase tracking-widest">Auditado</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-tight line-clamp-1">{order.supplierName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xl font-black text-gray-900">R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.items.length} itens</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditOrder(order);
                      }}
                      className="mt-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1"
                    >
                      <FileText size={12} /> Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPdf(order);
                      }}
                      disabled={isProcessing}
                      className="mt-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1"
                    >
                      {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
                      Imprimir
                    </button>
                  </div>
                  <ChevronRight size={24} className="text-gray-300 group-hover:text-emerald-500 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )
      }

      <style>{`
        .pdf-show { display: none; }
        @media print, .pdf-mode {
          .no-print { display: none !important; }
          .pdf-show { display: block !important; }
          .printable-guide { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* HIDDEN PRINTABLE AREA FOR HISTORY PDFS */}
      {
        pdfData && (
          <div style={{ position: 'absolute', top: -9999, left: -9999, width: '1000px' }}>
            <div id="hidden-printable-area" className="bg-white p-12 rounded-[2.5rem] border border-gray-200 shadow-2xl max-w-5xl mx-auto printable-guide relative">
              <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6 gap-4">
                <div className="flex items-center justify-start flex-1">
                  <img src="/logo-escola.png" alt="Escola Logo" className="h-24 w-auto object-contain" />
                </div>
                <div className="flex-[2] flex justify-center px-4">
                  <img src="/dados escola.jpeg" alt="Dados da Escola" className="h-28 w-full object-contain" />
                </div>
                <div className="flex items-center justify-end flex-1">
                  <img src="/SEDUC 2.jpg" alt="SEDUC MT" className="h-16 w-auto object-contain" />
                </div>
              </div>

              <div className="bg-black text-white p-3 rounded-lg text-center mb-8">
                <h2 className="text-sm font-black uppercase tracking-[0.2em]">Guia de Pedido de Gêneros Alimentícios (2ª Via)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="border-2 border-black p-4 rounded-xl space-y-2 relative">
                  <div className="absolute -top-3 left-4 bg-white px-2 text-[9px] font-black uppercase tracking-widest">Fornecedor Contratado</div>
                  <p className="text-sm font-black uppercase">{pdfData.contract.supplierName || "---"}</p>
                  <div className="grid grid-cols-1 gap-1 text-[10px] font-bold uppercase text-gray-600">
                    <p>CNPJ: {(pdfData.contract as any).supplier?.cnpj || "---"}</p>
                    <p>Contato: {(pdfData.contract as any).supplier?.phone || "---"}</p>
                  </div>
                </div>

                <div className="border-2 border-black p-4 rounded-xl space-y-2 relative bg-gray-50/50">
                  <div className="absolute -top-3 left-4 bg-white px-2 text-[9px] font-black uppercase tracking-widest">Dados do Pedido</div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase">
                    <div>
                      <p className="text-gray-400 font-black">Nº Controle:</p>
                      <p className="text-sm font-black">#{pdfData.order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-black">Nº Contrato:</p>
                      <p className="text-sm font-black">{pdfData.contract.number || "---"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-black">Emissão:</p>
                      <p className="text-sm font-black">{formatDateDisplay(pdfData.order.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-black text-emerald-700">Prev. Entrega:</p>
                      <p className="text-sm font-black text-emerald-800 underline decoration-2">{formatDateDisplay(pdfData.order.deliveryDate || '')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-[11px] border-collapse mb-8">
                <thead>
                  <tr className="bg-gray-100 border-2 border-black text-black">
                    <th className="p-3 uppercase">Descrição do Gênero / Detalhes</th>
                    <th className="p-3 text-center uppercase w-20">Saldo Atual</th>
                    <th className="p-3 text-center uppercase w-28 bg-emerald-50">Qtd. Pedido</th>
                    <th className="p-3 text-right uppercase w-32">Total Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black border-2 border-black">
                  {pdfData.items.map((item: any) => (
                    <tr key={item.id || item.description}>
                      <td className="p-3">
                        <p className="font-black uppercase text-gray-900">{item.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[8px] font-black bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 uppercase border border-gray-200">UNID: {item.unit}</span>
                          {item.brand && <span className="text-[8px] font-black bg-blue-50 px-1.5 py-0.5 rounded text-blue-600 uppercase border border-blue-100">MARCA: {item.brand}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-center font-black uppercase text-blue-600">{item.currentBalance?.toFixed(1) || '---'}</td>
                      <td className="p-3 text-center bg-emerald-50/30 font-black">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right font-black text-gray-900">
                        R$ {(item.quantity * item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-black text-white border-2 border-black">
                    <td colSpan={3} className="p-4 text-right font-black uppercase text-xs tracking-widest">Valor Total do Pedido:</td>
                    <td className="p-4 text-right font-black text-lg">
                      R$ {pdfData.order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="border-2 border-black p-4 rounded-xl mb-12 relative bg-gray-50/50">
                <div className="absolute -top-3 left-4 bg-white px-2 text-[9px] font-black uppercase tracking-widest">Notas de Entrega</div>
                <p className="text-[10px] font-bold uppercase leading-relaxed italic">{pdfData.order.observations || "Sem observações declaradas."}</p>
              </div>

              <div className="mt-20 grid grid-cols-2 gap-20 text-center">
                <div className="border-t-2 border-black pt-2">
                  <p className="font-black uppercase text-[10px] leading-tight">Gestão da Merenda / CDCE</p>
                </div>
                <div className="border-t-2 border-black pt-2">
                  <p className="font-black uppercase text-[10px] leading-tight">Entregue em ____/____/____</p>
                  <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">Visto do Fornecedor</p>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
};

export default Orders;
