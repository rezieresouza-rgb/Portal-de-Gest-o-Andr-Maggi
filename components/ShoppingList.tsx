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
  Loader2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { OFFICIAL_MENUS } from '../constants/menus';
import { TECHNICAL_SHEETS, PERISHABLES } from '../constants/technicalSheets';
import { ShoppingListItem, Contract, Order } from '../types';
import { INITIAL_STUDENTS } from '../constants/initialData';

const ShoppingList: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [generatedList, setGeneratedList] = useState<ShoppingListItem[]>([]);
  const [studentCount, setStudentCount] = useState(500);
  const [globalProductSearch, setGlobalProductSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Carrega contratos e alunos do Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: studentsData } = await supabase.from('students').select('id').eq('status', 'ATIVO');
        if (studentsData && studentsData.length > 0) {
          setStudentCount(studentsData.length);
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
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateList = () => {
    const weekData = OFFICIAL_MENUS.find(m => m.week === selectedWeek);
    if (!weekData) return;

    const consolidation: Record<string, { quantity: number; unit: string; unitPrice: number; supplier: string; contract: string; contractId: string; contractItemId: string }> = {};

    weekData.days.forEach(day => {
      const sheet = TECHNICAL_SHEETS.find(s =>
        day.dish.toUpperCase().includes(s.preparationName) ||
        s.preparationName.includes(day.dish.toUpperCase())
      );

      if (sheet) {
        sheet.ingredients.forEach(ing => {
          const totalQty = (ing.perCapitaLiquido * studentCount) / 1000;
          processIngredient(ing.description, totalQty);
        });
      } else {
        // Fallback: usar ingredientes do cardápio se não houver ficha técnica
        day.ingredients.forEach(ingDesc => {
          // Estimativa genérica de 100g per capita quando não há ficha técnica
          processIngredient(ingDesc, (100 * studentCount) / 1000);
        });
      }
    });

    function processIngredient(description: string, totalQty: number) {
      let supplier = "NÃO VINCULADO";
      let contractNum = "---";
      let contractId = "";
      let contractItemId = "";
      let unit = "KG";
      let price = 0;

      for (const c of contracts) {
        const contractItem = c.items.find(i =>
          i.description.toUpperCase().includes(description.toUpperCase()) ||
          description.toUpperCase().includes(i.description.toUpperCase())
        );
        if (contractItem) {
          supplier = c.supplierName;
          contractNum = c.number;
          contractId = c.id;
          contractItemId = contractItem.id;
          unit = contractItem.unit;
          price = contractItem.unitPrice;
          break;
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
      quantity: Number(data.quantity.toFixed(2)),
      unit: data.unit,
      week: selectedWeek,
      supplierName: data.supplier,
      contractNumber: data.contract,
      contractId: (data as any).contractId,
      contractItemId: (data as any).contractItemId,
      isPerishable: PERISHABLES.includes(desc.toUpperCase()),
      unit_price: data.unitPrice,
      selected: (data as any).contractItemId !== "" // Seleciona automaticamente se tiver contrato
    }));

    setGeneratedList(newList);
  };

  const removeItem = (index: number) => {
    setGeneratedList(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ShoppingListItem, value: any) => {
    setGeneratedList(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
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
    return results.slice(0, 8);
  }, [contracts, globalProductSearch]);

  const addManualItem = (product: any) => {
    const newItem: ShoppingListItem = {
      description: product.description,
      quantity: 1,
      unit: product.unit,
      week: selectedWeek,
      supplierName: product.supplierName,
      contractNumber: product.contractNumber,
      contractId: product.contractId,
      contractItemId: product.id,
      isPerishable: PERISHABLES.includes(product.description.toUpperCase()),
      unit_price: product.unitPrice,
      selected: true
    };
    setGeneratedList(prev => [...prev, newItem]);
    setGlobalProductSearch("");
  };

  const handleProcessOrders = async () => {
    const selectedItems = generatedList.filter(item => item.selected && item.contractItemId);
    if (selectedItems.length === 0) {
      alert("Selecione os produtos vinculados a contratos para processar os pedidos.");
      return;
    }

    setIsProcessing(true);
    try {
      // Agrupar itens por contrato
      const groupedByContract = selectedItems.reduce((acc, item) => {
        const id = item.contractId!;
        if (!acc[id]) acc[id] = [];
        acc[id].push(item);
        return acc;
      }, {} as Record<string, ShoppingListItem[]>);

      for (const [contractId, itemsList] of Object.entries(groupedByContract)) {
        const items = itemsList as ShoppingListItem[];
        const orderNumber = `SL-${Date.now().toString().slice(-6)}`;
        const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // 1. Criar Ordem
        const { data: orderData, error: orderError } = await supabase.from('orders').insert([{
          contract_id: contractId,
          order_number: orderNumber,
          issue_date: new Date().toISOString().split('T')[0],
          total_value: totalValue,
          status: 'EM_PROCESSAMENTO',
          observations: `Gerado via Lista de Compras - Semana ${selectedWeek}`
        }]).select().single();

        if (orderError) throw orderError;

        // 2. Criar Itens e Atualizar Saldo
        for (const item of items) {
          await supabase.from('order_items').insert([{
            order_id: orderData.id,
            contract_item_id: item.contractItemId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price
          }]);

          const contract = contracts.find(c => c.id === contractId);
          const cItem = contract?.items.find(i => i.id === item.contractItemId);
          if (cItem) {
            await supabase.from('contract_items')
              .update({ acquired_quantity: (cItem.acquiredQuantity || 0) + item.quantity })
              .eq('id', item.contractItemId);
          }
        }
      }

      alert("Pedidos gerados com sucesso e vinculados ao histórico!");
      setGeneratedList([]);
    } catch (error) {
      console.error("Erro ao processar pedidos:", error);
      alert("Erro ao processar pedidos.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-32 space-y-4">
        <Loader2 size={48} className="text-emerald-600 animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Carregando dados da Merenda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg">
              <ShoppingCart size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Lista de Compras Semanal</h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                Cálculo Dinâmico: Ficha Técnica x <span className="text-orange-600">{studentCount} Alunos Matriculados</span>
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
                    <button
                      key={p.id}
                      onClick={() => addManualItem(p)}
                      className="w-full text-left p-4 hover:bg-orange-50 flex items-center justify-between group"
                    >
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

            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="p-3 bg-gray-100 border-none rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              {[1, 2, 3, 4, 5].map(w => <option key={w} value={w}>{w}ª Semana</option>)}
            </select>
            <button
              onClick={generateList}
              className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              {generatedList.length > 0 ? <RefreshCw size={16} /> : <Calculator size={16} />}
              {generatedList.length > 0 ? "Regerar Lista" : "Gerar Lista"}
            </button>
          </div>
        </div>
      </div>

      {generatedList.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <FileSearch size={18} className="text-orange-600" /> Itens Gerados - {selectedWeek}ª Semana
              </h3>
              <div className="flex items-center gap-4 no-print">
                <span className="text-[10px] font-black text-gray-400 uppercase">{generatedList.length} Produtos na lista</span>
                <button onClick={handleExportPDF} className="p-2.5 bg-white text-gray-400 hover:text-orange-600 rounded-xl border border-gray-200 transition-all" title="Imprimir Lista">
                  <FileDown size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-8 py-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-orange-600"
                        checked={generatedList.length > 0 && generatedList.every(i => i.selected)}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-4 py-4">Ingrediente</th>
                    <th className="px-6 py-4 text-center">Quantidade Compra</th>
                    <th className="px-6 py-4">Fornecedor Vinculado</th>
                    <th className="px-6 py-4">Contrato</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {generatedList.map((item, idx) => (
                    <tr key={idx} className={`hover:bg-orange-50/30 transition-colors group ${!item.selected ? 'opacity-50' : ''}`}>
                      <td className="px-8 py-5">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => updateItem(idx, 'selected', e.target.checked)}
                          className="rounded border-gray-300 text-orange-600"
                        />
                      </td>
                      <td className="px-4 py-5">
                        <p className="font-black text-gray-900 uppercase text-xs">{item.description}</p>
                        {item.isPerishable && (
                          <span className="text-[7px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Perecível</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                            className="w-20 p-2 bg-white border border-gray-200 rounded-xl text-center font-black text-orange-600 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                          <span className="text-[10px] font-black text-gray-400 uppercase">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[10px] font-bold text-gray-900 uppercase">{item.supplierName}</p>
                        {item.supplierName === "NÃO VINCULADO" && (
                          <p className="text-[8px] text-red-500 font-black uppercase mt-1 flex items-center gap-1"><AlertTriangle size={8} /> Sem contrato ativo</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[9px] text-gray-400 font-black uppercase">{item.contractNumber !== "---" ? `CT ${item.contractNumber}` : "---"}</p>
                      </td>
                      <td className="px-6 py-5 text-right no-print">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-2.5 bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all shadow-sm flex items-center gap-2 ml-auto"
                          title="Remover da lista"
                        >
                          <span className="text-[8px] font-black uppercase hidden group-hover:block">Excluir</span>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-4 no-print">
            <div className="bg-amber-50 px-6 py-4 rounded-2xl border border-amber-100 flex items-center gap-4 mr-auto">
              <Info size={20} className="text-amber-600" />
              <p className="text-[10px] font-bold text-amber-800 uppercase leading-tight">
                Confirme as quantidades e selecione os itens para gerar os pedidos.<br />
                Itens sem contrato vinculado serão ignorados no processamento.
              </p>
            </div>
            <button
              onClick={handleProcessOrders}
              disabled={isProcessing || generatedList.filter(i => i.selected).length === 0}
              className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
              Processar Pedidos aos Fornecedores
            </button>
          </div>
        </div>
      )}

      {generatedList.length === 0 && (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center animate-in fade-in zoom-in-95">
          <Calculator size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400 font-black uppercase text-xs tracking-widest">
            {selectedWeek > 0
              ? "Nenhum item na lista. Selecione a semana e clique em 'Gerar Lista'."
              : "Inicie selecionando uma semana do cardápio."}
          </p>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .bg-white { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ShoppingList;
