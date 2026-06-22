import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  History,
  FileText,
  Printer,
  X,
  User,
  Package,
  Clock
} from 'lucide-react';
import { PPEItem, PPEDelivery, PPECategory, CleaningEmployee, PPEDeliveryItem } from '../types';

const INITIAL_PPE_ITEMS: PPEItem[] = [
  // COZINHA (UANE)
  { id: 'ppe-k1', name: 'TOUCA DESCARTÁVEL OU DE ALGODÃO', category: 'COZINHA', currentStock: 0, minStock: 20, unit: 'UNID/PCT' },
  { id: 'ppe-k2', name: 'UNIFORME BRANCO (ALGODÃO)', category: 'COZINHA', currentStock: 0, minStock: 10, unit: 'UNID' },
  { id: 'ppe-k3', name: 'AVENTAL DE ALGODÃO', category: 'COZINHA', currentStock: 0, minStock: 10, unit: 'UNID' },
  { id: 'ppe-k4', name: 'AVENTAL TÉRMICO', category: 'COZINHA', currentStock: 0, minStock: 4, unit: 'UNID' },
  { id: 'ppe-k5', name: 'LUVAS DE MALHA DE AÇO', category: 'COZINHA', currentStock: 0, minStock: 2, unit: 'PAR' },
  { id: 'ppe-k6', name: 'LUVAS (VINIL, LÁTEX OU POLIETILENO)', category: 'COZINHA', currentStock: 0, minStock: 15, unit: 'CX' },
  { id: 'ppe-k7', name: 'LUVAS TÉRMICAS', category: 'COZINHA', currentStock: 0, minStock: 4, unit: 'PAR' },
  { id: 'ppe-k8', name: 'SAPATO FECHADO ANTIDERRAPANTE', category: 'COZINHA', currentStock: 0, minStock: 6, unit: 'PAR' },
  { id: 'ppe-k9', name: 'CALÇA COMPRIDA E CAMISETA MANGA CURTA', category: 'COZINHA', currentStock: 0, minStock: 10, unit: 'CONJ' },

  // LIMPEZA / GERAL
  { id: 'ppe-c1', name: 'AVENTAL DE PVC (IMPERMEÁVEL)', category: 'LIMPEZA', currentStock: 0, minStock: 10, unit: 'UNID' },
  { id: 'ppe-c2', name: 'LUVAS DE PVC (CURTAS E LONGAS)', category: 'LIMPEZA', currentStock: 0, minStock: 12, unit: 'PAR' },
  { id: 'ppe-c3', name: 'LUVAS NITRÍLICAS (BORRACHA)', category: 'LIMPEZA', currentStock: 0, minStock: 10, unit: 'PAR' },
  { id: 'ppe-c4', name: 'ÓCULOS DE PROTEÇÃO', category: 'LIMPEZA', currentStock: 0, minStock: 6, unit: 'UNID' },
  { id: 'ppe-c5', name: 'BOTAS DE BORRACHA', category: 'LIMPEZA', currentStock: 0, minStock: 8, unit: 'PAR' },

  // MANUTENÇÃO / EXTERNO
  { id: 'ppe-m1', name: 'PROTETOR AURICULAR (ABAFADOR)', category: 'MANUTENÇÃO', currentStock: 0, minStock: 5, unit: 'UNID' },
  { id: 'ppe-m2', name: 'PROTETOR FACIAL (VISEIRA POLICARBONATO)', category: 'MANUTENÇÃO', currentStock: 0, minStock: 4, unit: 'UNID' },
  { id: 'ppe-m3', name: 'PERNEIRA DE PROTEÇÃO (PAR)', category: 'MANUTENÇÃO', currentStock: 0, minStock: 6, unit: 'PAR' },
  { id: 'ppe-m4', name: 'LUVA DE VAQUETA (COURO)', category: 'MANUTENÇÃO', currentStock: 0, minStock: 10, unit: 'PAR' },
  { id: 'ppe-m5', name: 'COLETE REFLETIVO', category: 'MANUTENÇÃO', currentStock: 0, minStock: 5, unit: 'UNID' },

  // MÁSCARAS / RESPIRATÓRIA
  { id: 'ppe-g1', name: 'MÁSCARA DESCARTÁVEL (CX C/ 50)', category: 'COZINHA', currentStock: 0, minStock: 10, unit: 'CX' },
  { id: 'ppe-g2', name: 'MÁSCARA PFF2 (N95) PROTEÇÃO RESPIRATÓRIA', category: 'LIMPEZA', currentStock: 0, minStock: 20, unit: 'UNID' },
  { id: 'ppe-g3', name: 'MÁSCARA PFF2 COM VÁLVULA (QUÍMICOS)', category: 'MANUTENÇÃO', currentStock: 0, minStock: 10, unit: 'UNID' },
];

interface PPEControlProps {
  employees: CleaningEmployee[];
}

const PPEControl: React.FC<PPEControlProps> = ({ employees: staff }) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'deliveries'>('inventory');
  const [activeCategory, setActiveCategory] = useState<PPECategory | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [items, setItems] = useState<PPEItem[]>(() => {
    const saved = localStorage.getItem('school_ppe_items_v6');
    return saved ? JSON.parse(saved) : INITIAL_PPE_ITEMS;
  });

  const [deliveries, setDeliveries] = useState<PPEDelivery[]>(() => {
    const saved = localStorage.getItem('school_ppe_deliveries_v6');
    return saved ? JSON.parse(saved) : [];
  });

  // Main form state
  const [employeeName, setEmployeeName] = useState('');
  const [employeeRole, setEmployeeRole] = useState('LIMPEZA');
  
  // Current item being added
  const [currentPpeId, setCurrentPpeId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  
  // List of items in the current term
  const [deliveryItems, setDeliveryItems] = useState<PPEDeliveryItem[]>([]);

  useEffect(() => {
    localStorage.setItem('school_ppe_items_v6', JSON.stringify(items));
    localStorage.setItem('school_ppe_deliveries_v6', JSON.stringify(deliveries));
  }, [items, deliveries]);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchCat = activeCategory === 'TODOS' || i.category === activeCategory;
      const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, activeCategory, searchTerm]);

  const stats = useMemo(() => {
    const critical = items.filter(i => i.currentStock < i.minStock).length;
    const low = items.filter(i => i.currentStock >= i.minStock && i.currentStock < i.minStock * 1.5).length;
    return { critical, low, ok: items.length - critical - low };
  }, [items]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPpeId) return alert("Selecione um EPI válido.");
    
    const ppe = items.find(i => i.id === currentPpeId);
    if (!ppe) return;

    if (ppe.currentStock < currentQty) {
      return alert(`Estoque insuficiente. Você só tem ${ppe.currentStock} ${ppe.unit} de ${ppe.name}.`);
    }

    // Check if already in list, if so add quantity instead of duplicating
    const existingIdx = deliveryItems.findIndex(i => i.ppeId === currentPpeId);
    if (existingIdx >= 0) {
      const totalQty = deliveryItems[existingIdx].quantity + currentQty;
      if (ppe.currentStock < totalQty) {
        return alert(`Estoque insuficiente para acumular. Você só tem ${ppe.currentStock} disponíveis.`);
      }
      const newArr = [...deliveryItems];
      newArr[existingIdx].quantity = totalQty;
      setDeliveryItems(newArr);
    } else {
      setDeliveryItems([...deliveryItems, { ppeId: currentPpeId, ppeName: ppe.name, quantity: currentQty }]);
    }

    setCurrentPpeId('');
    setCurrentQty(1);
  };

  const handleRemoveItem = (idx: number) => {
    setDeliveryItems(deliveryItems.filter((_, i) => i !== idx));
  };

  const loadPresetKit = (type: 'cleaning' | 'kitchen') => {
    const kitPpes = type === 'cleaning' ? [
      { ppeId: 'ppe-c1', ppeName: 'AVENTAL DE PVC (IMPERMEÁVEL)', quantity: 1 },
      { ppeId: 'ppe-c2', ppeName: 'LUVAS DE PVC (CURTAS E LONGAS)', quantity: 1 },
      { ppeId: 'ppe-c3', ppeName: 'LUVAS NITRÍLICAS (BORRACHA)', quantity: 1 },
      { ppeId: 'ppe-c4', ppeName: 'ÓCULOS DE PROTEÇÃO', quantity: 1 },
      { ppeId: 'ppe-c5', ppeName: 'BOTAS DE BORRACHA', quantity: 1 },
      { ppeId: 'ppe-g2', ppeName: 'MÁSCARA PFF2 (N95) PROTEÇÃO RESPIRATÓRIA', quantity: 10 }
    ] : [
      { ppeId: 'ppe-k1', ppeName: 'TOUCA DESCARTÁVEL OU DE ALGODÃO', quantity: 1 },
      { ppeId: 'ppe-k2', ppeName: 'UNIFORME BRANCO (ALGODÃO)', quantity: 2 },
      { ppeId: 'ppe-k3', ppeName: 'AVENTAL DE ALGODÃO', quantity: 2 },
      { ppeId: 'ppe-k6', ppeName: 'LUVAS (VINIL, LÁTEX OU POLIETILENO)', quantity: 1 },
      { ppeId: 'ppe-k8', ppeName: 'SAPATO FECHADO ANTIDERRAPANTE', quantity: 1 },
      { ppeId: 'ppe-k9', ppeName: 'CALÇA COMPRIDA E CAMISETA MANGA CURTA', quantity: 2 },
      { ppeId: 'ppe-g1', ppeName: 'MÁSCARA DESCARTÁVEL (CX C/ 50)', quantity: 1 }
    ];

    const finalItems: PPEDeliveryItem[] = [];
    const lowStockItems: string[] = [];

    kitPpes.forEach(kp => {
      const ppe = items.find(i => i.id === kp.ppeId);
      if (ppe) {
        if (ppe.currentStock === 0) {
          lowStockItems.push(`- ${ppe.name} (Estoque zerado)`);
        } else if (ppe.currentStock < kp.quantity) {
          finalItems.push({ ppeId: kp.ppeId, ppeName: ppe.name, quantity: ppe.currentStock });
          lowStockItems.push(`- ${ppe.name} (Adicionado apenas ${ppe.currentStock} de ${kp.quantity} disponíveis)`);
        } else {
          finalItems.push({ ppeId: kp.ppeId, ppeName: ppe.name, quantity: kp.quantity });
        }
      }
    });

    if (lowStockItems.length > 0) {
      alert(`Atenção: Alguns itens do kit estão com estoque limitado ou zerado no inventário:\n\n` + 
            lowStockItems.join('\n') + 
            `\n\nPor favor, atualize o estoque no painel do Inventário antes de finalizar, se necessário.`);
    }

    setDeliveryItems(finalItems);
  };

  const handleConfirmDelivery = () => {
    if (!employeeName) return alert("Selecione um funcionário.");
    if (deliveryItems.length === 0) return alert("Adicione ao menos um EPI no termo.");

    const newDelivery: PPEDelivery = {
      id: `del-${Date.now()}`,
      employeeName,
      employeeRole,
      items: deliveryItems,
      date: new Date().toLocaleDateString('sv-SE'),
      timestamp: Date.now()
    };

    // Deduct stock for all items
    setItems(prev => {
      let newStock = [...prev];
      deliveryItems.forEach(di => {
        const idx = newStock.findIndex(s => s.id === di.ppeId);
        if (idx >= 0) {
          newStock[idx] = { ...newStock[idx], currentStock: newStock[idx].currentStock - di.quantity };
        }
      });
      return newStock;
    });

    setDeliveries([newDelivery, ...deliveries]);
    setIsDeliveryModalOpen(false);
    
    // Reset
    setEmployeeName('');
    setEmployeeRole('LIMPEZA');
    setDeliveryItems([]);
  };

  const printTermo = async (delivery: PPEDelivery) => {
    setIsPrinting(true);
    setTimeout(async () => {
      const element = document.getElementById(`termo-${delivery.id}`);
      if (!element) return setIsPrinting(false);
      
      // Temporarily show the element so html2canvas can render it
      element.classList.remove('hidden');
      element.classList.add('block');
      
      try {
        // @ts-ignore
        await window.html2pdf().set({
          margin: 10,
          filename: `Termo_EPI_${delivery.employeeName}_${delivery.date}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save();
      } catch (err) {
        console.error(err);
      } finally {
        element.classList.remove('block');
        element.classList.add('hidden');
        setIsPrinting(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Estoque Saudável</p>
          <div className="flex items-end justify-between"><p className="text-3xl font-black text-emerald-600">{stats.ok}</p><CheckCircle2 size={24} className="text-emerald-500" /></div>
        </div>
        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col justify-between h-32">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">Estoque Baixo</p>
          <div className="flex items-end justify-between"><p className="text-3xl font-black text-orange-700">{stats.low}</p><Clock size={24} className="text-orange-500" /></div>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between h-32">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Crítico / Reposição</p>
          <div className="flex items-end justify-between"><p className="text-3xl font-black text-red-900">{stats.critical}</p><AlertTriangle size={24} className="text-red-500" /></div>
        </div>
        <div className="bg-blue-900 p-6 rounded-3xl shadow-xl flex flex-col justify-between h-32 text-white">
          <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest leading-none">Termos no Mês</p>
          <div className="flex items-end justify-between"><p className="text-3xl font-black">{deliveries.length}</p><History size={24} className="text-blue-400" /></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl no-print">
          <button onClick={() => setActiveSubTab('inventory')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'inventory' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Inventário</button>
          <button onClick={() => setActiveSubTab('deliveries')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'deliveries' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Termos de Entrega</button>
        </div>
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-orange-500/5 transition-all" />
        </div>
        <button onClick={() => setIsDeliveryModalOpen(true)} className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-orange-700 transition-all flex items-center gap-3 shrink-0"><FileText size={18} /> Novo Termo</button>
      </div>

      {activeSubTab === 'inventory' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
          {filteredItems.map(item => (
            <div key={item.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group ${item.currentStock < item.minStock ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4"><span className="text-[8px] font-black uppercase px-2 py-1 bg-gray-900 text-white rounded-lg">{item.category}</span><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min: {item.minStock}</span></div>
                <h4 className="text-sm font-black text-gray-900 uppercase leading-snug mb-6 h-10 line-clamp-2">{item.name}</h4>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <button onClick={() => {
                        const newItems = [...items];
                        const idx = newItems.findIndex(i => i.id === item.id);
                        if (newItems[idx].currentStock > 0) {
                          newItems[idx] = { ...newItems[idx], currentStock: newItems[idx].currentStock - 1 };
                          setItems(newItems);
                        }
                      }} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-gray-500 transition-colors">-</button>
                      <p className={`text-4xl font-black ${item.currentStock < item.minStock ? 'text-red-700' : 'text-gray-900'}`}>{item.currentStock}</p>
                      <button onClick={() => {
                        const newItems = [...items];
                        const idx = newItems.findIndex(i => i.id === item.id);
                        newItems[idx] = { ...newItems[idx], currentStock: newItems[idx].currentStock + 1 };
                        setItems(newItems);
                      }} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-gray-500 transition-colors">+</button>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{item.unit} em estoque</p>
                  </div>
                  <div className="p-3 bg-gray-100 text-gray-400 rounded-xl">
                    <Package size={24} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100"><th className="px-8 py-5">Funcionário / Cargo</th><th className="px-8 py-5">Qtd Itens</th><th className="px-8 py-5 text-center">Data</th><th className="px-8 py-5 text-right">Ação</th></tr></thead>
              <tbody className="divide-y divide-gray-50">{deliveries.map(del => (
                <tr key={del.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5"><div className="flex items-center gap-4"><div className="p-3 bg-gray-100 text-gray-400 rounded-xl"><User size={20} /></div><div><p className="text-sm font-black text-gray-900 uppercase">{del.employeeName}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{del.employeeRole}</p></div></div></td>
                  <td className="px-8 py-5"><p className="text-xs font-black text-gray-700 uppercase">{del.items?.length || 0} ITENS ENTREGUES</p><p className="text-[9px] text-orange-600 font-bold uppercase truncate max-w-[200px]">{del.items?.map(i => i.ppeName).join(', ')}</p></td>
                  <td className="px-8 py-5 text-center"><p className="text-xs font-bold text-gray-400">{new Date(del.date).toLocaleDateString('pt-BR')}</p></td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2"><button onClick={() => printTermo(del)} className="p-3 bg-white text-gray-300 hover:text-blue-600 rounded-xl border border-gray-100 transition-all"><Printer size={18} /></button></div>
                    <div id={`termo-${del.id}`} className="hidden">
                      <div className="p-12 space-y-6 text-gray-900 font-sans text-sm leading-relaxed max-w-4xl mx-auto">
                        <div className="text-center border-b-2 border-black pb-6 mb-8">
                          <h1 className="text-2xl font-black uppercase mb-2">Termo de Responsabilidade e Recibo de EPI</h1>
                          <p className="text-base font-bold uppercase">Escola Estadual André Antônio Maggi</p>
                          <p className="text-xs uppercase text-gray-600">Ministério do Trabalho e Emprego - NR-06</p>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-justify">
                            Declaramos para os devidos fins que o(a) servidor(a) <strong>{del.employeeName}</strong>, ocupante do cargo/função de <strong>{del.employeeRole}</strong>, recebeu da ESCOLA ESTADUAL ANDRÉ ANTÔNIO MAGGI os Equipamentos de Proteção Individual (EPIs) abaixo especificados, de forma gratuita, adequados ao risco e em perfeito estado de conservação e funcionamento.
                          </p>
                          
                          <div className="my-6">
                            <p className="font-bold uppercase text-xs text-gray-500 mb-2">Especificações dos Equipamentos Recebidos ({new Date(del.date).toLocaleDateString('pt-BR')})</p>
                            <table className="w-full text-left border-collapse border border-gray-300 text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="p-3 border border-gray-300 font-bold">Item</th>
                                  <th className="p-3 border border-gray-300 font-bold text-center w-32">Quantidade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {del.items?.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="p-3 border border-gray-300 uppercase">{item.ppeName}</td>
                                    <td className="p-3 border border-gray-300 font-black text-center">{item.quantity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <p className="text-justify">
                            O(a) servidor(a) declara ter recebido orientação e treinamento sobre o uso adequado, guarda e conservação dos referidos equipamentos, comprometendo-se a:
                          </p>
                          
                          <ul className="list-disc pl-8 space-y-2 text-justify">
                            <li>Utilizá-los única e exclusivamente para a finalidade a que se destinam, durante toda a jornada de trabalho;</li>
                            <li>Responsabilizar-se por sua guarda, limpeza e conservação;</li>
                            <li>Comunicar imediatamente à chefia imediata ou direção qualquer alteração, dano ou extravio que os tornem impróprios para uso, para fins de substituição;</li>
                            <li>Devolver os equipamentos de imediato quando do seu desligamento da instituição ou término do contrato.</li>
                          </ul>

                          <p className="text-justify mt-4">
                            Declara ainda estar plenamente ciente de que o uso inadequado, extravio por dolo ou culpa, ou a recusa injustificada em utilizar os EPIs fornecidos, constitui ato faltoso passível de sanções disciplinares, conforme disposições da Norma Regulamentadora NR-06.
                          </p>
                        </div>
                        
                        <div className="pt-24 mt-12 grid grid-cols-2 gap-16 text-center">
                          <div>
                            <div className="border-t border-black pt-2 uppercase text-xs font-black">Assinatura do(a) Servidor(a)</div>
                            <p className="text-[10px] text-gray-500 mt-1">{del.employeeName}</p>
                          </div>
                          <div>
                            <div className="border-t border-black pt-2 uppercase text-xs font-black">Responsável pela Entrega</div>
                            <p className="text-[10px] text-gray-500 mt-1">Almoxarifado / Zeladoria</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 bg-orange-50 flex justify-between items-center border-b border-orange-100">
              <div className="flex items-center gap-5"><div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg"><Plus size={28} /></div><div><h3 className="text-2xl font-black text-gray-900 uppercase">Novo Termo de Entrega</h3><p className="text-[10px] text-orange-600 font-bold uppercase mt-1">Adicione vários EPIs ao mesmo termo</p></div></div>
              <button onClick={() => setIsDeliveryModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="space-y-8">
                
                {/* Cabeçalho do Funcionário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Funcionário (Assinante)</label>
                    <select required value={employeeName} onChange={e => {
                      const emp = staff.find(s => s.name === e.target.value);
                      setEmployeeName(e.target.value);
                      setEmployeeRole(emp?.scope || 'LIMPEZA');
                    }} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm uppercase outline-none focus:bg-white transition-all">
                      <option value="">Selecione...</option>
                      {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo</label>
                    <input disabled value={employeeRole} className="w-full p-4 bg-gray-100 border border-gray-100 rounded-2xl font-black text-xs text-gray-500 uppercase" />
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Atalho para Preenchimento de Kits de EPI */}
                <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100/50 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Preenchimento Automático</h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Insira os itens padrão do kit com um clique:</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadPresetKit('cleaning')}
                      className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
                    >
                      🧹 Carregar Kit Limpeza Padrão
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPresetKit('kitchen')}
                      className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
                    >
                      🍳 Carregar Kit Cozinha Padrão
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Adicionar Itens */}
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-900 mb-4">Itens do Termo</h4>
                  
                  {deliveryItems.length > 0 && (
                    <div className="mb-6 space-y-2">
                      {deliveryItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-orange-50 border border-orange-100 rounded-xl">
                          <div>
                            <p className="text-xs font-black uppercase text-gray-900">{item.ppeName}</p>
                            <p className="text-[10px] font-bold text-orange-600 uppercase">Qtd: {item.quantity}</p>
                          </div>
                          <button onClick={() => handleRemoveItem(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddItem} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 border-dashed flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecione o EPI</label>
                      <select value={currentPpeId} onChange={e => setCurrentPpeId(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-xs outline-none">
                        <option value="">Selecione para adicionar...</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div className="w-full md:w-24 space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qtd</label>
                      <input type="number" min="1" value={currentQty} onChange={e => setCurrentQty(parseInt(e.target.value) || 1)} className="w-full p-3 bg-white border border-gray-200 rounded-xl font-black text-sm text-center outline-none" />
                    </div>
                    <button type="submit" disabled={!currentPpeId} className="w-full md:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl font-black uppercase text-xs hover:bg-gray-800 disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                      <Plus size={16} /> Adicionar
                    </button>
                  </form>
                </div>

                <div className="pt-4">
                  <button onClick={handleConfirmDelivery} className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-orange-700 hover:shadow-2xl hover:-translate-y-0.5 transition-all">
                    Finalizar e Gerar Termo ({deliveryItems.length} itens)
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PPEControl;