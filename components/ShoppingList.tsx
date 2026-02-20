
import React, { useState, useMemo, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import { OFFICIAL_MENUS } from '../constants/menus';
import { TECHNICAL_SHEETS, PERISHABLES } from '../constants/technicalSheets';
import { ShoppingListItem, Contract } from '../types';
import { INITIAL_STUDENTS } from '../constants/initialData';

const ShoppingList: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [generatedList, setGeneratedList] = useState<ShoppingListItem[]>([]);
  const [studentCount, setStudentCount] = useState(500); // Fallback para 500 caso base esteja vazia

  // Carrega alunos da Secretaria para cálculo preciso
  useEffect(() => {
    const saved = localStorage.getItem('secretariat_detailed_students_v1');
    const students = saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    if (students && students.length > 0) {
      setStudentCount(students.length);
    }
  }, []);

  // Carrega contratos para vincular fornecedores
  const contracts: Contract[] = useMemo(() => {
    const saved = localStorage.getItem('merenda_contracts');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const generateList = () => {
    const weekData = OFFICIAL_MENUS.find(m => m.week === selectedWeek);
    if (!weekData) return;

    const consolidation: Record<string, { quantity: number; unit: string; unitPrice: number; supplier: string; contract: string }> = {};

    weekData.days.forEach(day => {
      // Busca a ficha técnica pelo nome do prato ou palavras-chave
      const sheet = TECHNICAL_SHEETS.find(s => 
        day.dish.toUpperCase().includes(s.preparationName) || 
        s.preparationName.includes(day.dish.toUpperCase())
      );

      if (sheet) {
        sheet.ingredients.forEach(ing => {
          // Cálculo usando a quantidade real de alunos (studentCount)
          const totalQty = (ing.perCapitaLiquido * studentCount) / 1000; // Converte g para kg
          
          // Tenta encontrar o item em algum contrato
          let supplier = "NÃO VINCULADO";
          let contractNum = "---";
          let unit = "KG";
          let price = 0;

          for (const c of contracts) {
            const contractItem = c.items.find(i => 
              i.description.toUpperCase().includes(ing.description.toUpperCase()) ||
              ing.description.toUpperCase().includes(i.description.toUpperCase())
            );
            if (contractItem) {
              supplier = c.supplierName;
              contractNum = c.number;
              unit = contractItem.unit;
              price = contractItem.unitPrice;
              break;
            }
          }

          if (consolidation[ing.description]) {
            consolidation[ing.description].quantity += totalQty;
          } else {
            consolidation[ing.description] = { 
              quantity: totalQty, 
              unit, 
              unitPrice: price, 
              supplier, 
              contract: contractNum 
            };
          }
        });
      }
    });

    const newList: ShoppingListItem[] = Object.entries(consolidation).map(([desc, data]) => ({
      description: desc,
      quantity: data.quantity,
      unit: data.unit,
      week: selectedWeek,
      supplierName: data.supplier,
      contractNumber: data.contract,
      isPerishable: PERISHABLES.includes(desc.toUpperCase()),
      unit_price: data.unitPrice
    }));

    setGeneratedList(newList);
  };

  const removeItem = (index: number) => {
    setGeneratedList(prev => prev.filter((_, i) => i !== index));
  };

  const handleExportPDF = () => {
    window.print();
  };

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
            <select 
              value={selectedWeek} 
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="p-3 bg-gray-100 border-none rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              {[1,2,3,4,5].map(w => <option key={w} value={w}>{w}ª Semana</option>)}
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
                    <th className="px-8 py-4">Ingrediente</th>
                    <th className="px-6 py-4 text-center">Quantidade Estimada</th>
                    <th className="px-6 py-4">Fornecedor Vinculado</th>
                    <th className="px-6 py-4">Contrato</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {generatedList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="font-black text-gray-900 uppercase text-xs">{item.description}</p>
                        {item.isPerishable && (
                          <span className="text-[7px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Perecível</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <p className="font-black text-orange-600 text-sm">{item.quantity.toFixed(2)} {item.unit}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[10px] font-bold text-gray-900 uppercase">{item.supplierName}</p>
                        {item.supplierName === "NÃO VINCULADO" && (
                          <p className="text-[8px] text-red-500 font-black uppercase mt-1 flex items-center gap-1"><AlertTriangle size={8}/> Sem contrato ativo</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[9px] text-gray-400 font-black uppercase">CT {item.contractNumber}</p>
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
                 Remova os itens que você já possui em estoque físico <br/>antes de gerar as ordens de pedido.
               </p>
            </div>
            <button className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
              <Truck size={18} /> Processar Pedidos aos Fornecedores
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
