import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  History,
  ChevronRight,
  FileText,
  Download,
  Printer,
  X,
  User,
  Briefcase,
  Calendar,
  Package,
  Loader2,
  Filter,
  CheckSquare,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { PPEItem, PPEDelivery, PPECategory, CleaningEmployee } from '../types';

const INITIAL_PPE_ITEMS: PPEItem[] = [
  // COZINHA (UANE)
  { id: 'ppe-k1', name: 'TOUCA DESCARTÁVEL OU DE ALGODÃO', category: 'COZINHA', currentStock: 15, minStock: 20, unit: 'UNID/PCT' },
  { id: 'ppe-k2', name: 'UNIFORME BRANCO (ALGODÃO)', category: 'COZINHA', currentStock: 10, minStock: 10, unit: 'UNID' },
  { id: 'ppe-k3', name: 'AVENTAL DE ALGODÃO', category: 'COZINHA', currentStock: 12, minStock: 10, unit: 'UNID' },
  { id: 'ppe-k4', name: 'AVENTAL TÉRMICO', category: 'COZINHA', currentStock: 4, minStock: 4, unit: 'UNID' },
  { id: 'ppe-k5', name: 'LUVAS DE MALHA DE AÇO', category: 'COZINHA', currentStock: 2, minStock: 2, unit: 'PAR' },
  { id: 'ppe-k6', name: 'LUVAS (VINIL, LÁTEX OU POLIETILENO)', category: 'COZINHA', currentStock: 8, minStock: 15, unit: 'CX' },
  { id: 'ppe-k7', name: 'LUVAS TÉRMICAS', category: 'COZINHA', currentStock: 4, minStock: 4, unit: 'PAR' },
  { id: 'ppe-k8', name: 'SAPATO FECHADO ANTIDERRAPANTE', category: 'COZINHA', currentStock: 6, minStock: 6, unit: 'PAR' },
  { id: 'ppe-k9', name: 'CALÇA COMPRIDA E CAMISETA MANGA CURTA', category: 'COZINHA', currentStock: 10, minStock: 10, unit: 'CONJ' },

  // LIMPEZA / GERAL
  { id: 'ppe-c1', name: 'AVENTAL DE PVC (IMPERMEÁVEL)', category: 'LIMPEZA', currentStock: 15, minStock: 10, unit: 'UNID' },
  { id: 'ppe-c2', name: 'LUVAS DE PVC (CURTAS E LONGAS)', category: 'LIMPEZA', currentStock: 10, minStock: 12, unit: 'PAR' },
  { id: 'ppe-c3', name: 'LUVAS NITRÍLICAS (BORRACHA)', category: 'LIMPEZA', currentStock: 5, minStock: 10, unit: 'PAR' },
  { id: 'ppe-c4', name: 'ÓCULOS DE PROTEÇÃO', category: 'LIMPEZA', currentStock: 4, minStock: 6, unit: 'UNID' },
  { id: 'ppe-c5', name: 'BOTAS DE BORRACHA', category: 'LIMPEZA', currentStock: 8, minStock: 8, unit: 'PAR' },

  // MANUTENÇÃO / EXTERNO
  { id: 'ppe-m1', name: 'PROTETOR AURICULAR (ABAFADOR)', category: 'MANUTENÇÃO', currentStock: 5, minStock: 5, unit: 'UNID' },
  { id: 'ppe-m2', name: 'PROTETOR FACIAL (VISEIRA POLICARBONATO)', category: 'MANUTENÇÃO', currentStock: 4, minStock: 4, unit: 'UNID' },
  { id: 'ppe-m3', name: 'PERNEIRA DE PROTEÇÃO (PAR)', category: 'MANUTENÇÃO', currentStock: 6, minStock: 6, unit: 'PAR' },
  { id: 'ppe-m4', name: 'LUVA DE VAQUETA (COURO)', category: 'MANUTENÇÃO', currentStock: 10, minStock: 10, unit: 'PAR' },
  { id: 'ppe-m5', name: 'COLETE REFLETIVO', category: 'MANUTENÇÃO', currentStock: 5, minStock: 5, unit: 'UNID' },

  // MÁSCARAS / RESPIRATÓRIA
  { id: 'ppe-g1', name: 'MÁSCARA DESCARTÁVEL (CX C/ 50)', category: 'COZINHA', currentStock: 10, minStock: 10, unit: 'CX' },
  { id: 'ppe-g2', name: 'MÁSCARA PFF2 (N95) PROTEÇÃO RESPIRATÓRIA', category: 'LIMPEZA', currentStock: 20, minStock: 20, unit: 'UNID' },
  { id: 'ppe-g3', name: 'MÁSCARA PFF2 COM VÁLVULA (QUÍMICOS)', category: 'MANUTENÇÃO', currentStock: 10, minStock: 10, unit: 'UNID' },
];

const PPEControl: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'deliveries'>('inventory');
  const [activeCategory, setActiveCategory] = useState<PPECategory | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [staff, setStaff] = useState<CleaningEmployee[]>([]);

  const [items, setItems] = useState<PPEItem[]>(() => {
    const saved = localStorage.getItem('school_ppe_items_v4');
    return saved ? JSON.parse(saved) : INITIAL_PPE_ITEMS;
  });

  const [deliveries, setDeliveries] = useState<PPEDelivery[]>(() => {
    const saved = localStorage.getItem('school_ppe_deliveries_v4');
    return saved ? JSON.parse(saved) : [];
  });

  const [deliveryForm, setDeliveryForm] = useState<Omit<PPEDelivery, 'id' | 'timestamp'>>({
    employeeName: '',
    employeeRole: 'LIMPEZA',
    ppeId: '',
    ppeName: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const loadStaff = () => {
      const saved = localStorage.getItem('cleaning_team_v1');
      if (saved) setStaff(JSON.parse(saved));
    };
    loadStaff();
    window.addEventListener('storage', loadStaff);
    return () => window.removeEventListener('storage', loadStaff);
  }, []);

  useEffect(() => {
    localStorage.setItem('school_ppe_items_v4', JSON.stringify(items));
    localStorage.setItem('school_ppe_deliveries_v4', JSON.stringify(deliveries));
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

  const handleDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    const ppe = items.find(i => i.id === deliveryForm.ppeId);
    if (!ppe) return alert("Selecione um EPI válido.");
    if (ppe.currentStock < deliveryForm.quantity) return alert("Estoque insuficiente.");

    const newDelivery: PPEDelivery = {
      id: `del-${Date.now()}`,
      ...deliveryForm,
      ppeName: ppe.name,
      timestamp: Date.now()
    };

    setItems(prev => prev.map(i => i.id === ppe.id ? { ...i, currentStock: i.currentStock - deliveryForm.quantity } : i));
    setDeliveries([newDelivery, ...deliveries]);
    setIsDeliveryModalOpen(false);
    resetDeliveryForm();
  };

  const resetDeliveryForm = () => {
    setDeliveryForm({
      employeeName: '',
      employeeRole: 'LIMPEZA',
      ppeId: '',
      ppeName: '',
      quantity: 1,
      date: new Date().toISOString().split('T')[0],
    });
  };

  const printTermo = async (delivery: PPEDelivery) => {
    setIsPrinting(true);
    setTimeout(async () => {
      const element = document.getElementById(`termo-${delivery.id}`);
      if (!element) return setIsPrinting(false);
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
          <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest leading-none">Entregas no Mês</p>
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
                <div className="flex items-end justify-between"><div><p className={`text-4xl font-black ${item.currentStock < item.minStock ? 'text-red-700' : 'text-gray-900'}`}>{item.currentStock}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{item.unit} em estoque</p></div><div className="p-3 bg-gray-100 text-gray-400 rounded-xl"><Package size={24} /></div></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100"><th className="px-8 py-5">Funcionário / Cargo</th><th className="px-8 py-5">EPI Entregue</th><th className="px-8 py-5 text-center">Data</th><th className="px-8 py-5 text-right">Ação</th></tr></thead>
              <tbody className="divide-y divide-gray-50">{deliveries.map(del => (
                <tr key={del.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5"><div className="flex items-center gap-4"><div className="p-3 bg-gray-100 text-gray-400 rounded-xl"><User size={20} /></div><div><p className="text-sm font-black text-gray-900 uppercase">{del.employeeName}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{del.employeeRole}</p></div></div></td>
                  <td className="px-8 py-5"><p className="text-xs font-black text-gray-700 uppercase">{del.ppeName}</p><p className="text-[9px] text-orange-600 font-bold uppercase">Quantidade: {del.quantity}</p></td>
                  <td className="px-8 py-5 text-center"><p className="text-xs font-bold text-gray-400">{new Date(del.date).toLocaleDateString('pt-BR')}</p></td>
                  <td className="px-8 py-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => printTermo(del)} className="p-3 bg-white text-gray-300 hover:text-blue-600 rounded-xl border border-gray-100 transition-all"><Printer size={18} /></button></div><div id={`termo-${del.id}`} className="hidden"><div className="p-12 space-y-10 text-gray-900 font-sans"><div className="text-center border-b-2 border-black pb-8"><h1 className="text-xl font-black uppercase">Termo de Recebimento de EPI</h1><p className="text-sm font-bold uppercase">Escola André Maggi</p></div><p>Eu, <strong>{del.employeeName}</strong> ({del.employeeRole}), recebi em {new Date(del.date).toLocaleDateString('pt-BR')} o item <strong>{del.ppeName}</strong> (Qtd: {del.quantity}).</p><div className="pt-24 grid grid-cols-2 gap-20 text-center"><div className="border-t border-black pt-2 uppercase text-[10px] font-black">Servidor</div><div className="border-t border-black pt-2 uppercase text-[10px] font-black">Almoxarifado</div></div></div></div></td>
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
              <div className="flex items-center gap-5"><div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg"><Plus size={28} /></div><div><h3 className="text-2xl font-black text-gray-900 uppercase">Entrega de EPI</h3><p className="text-[10px] text-orange-600 font-bold uppercase mt-1">Sincronizado com Zeladoria</p></div></div>
              <button onClick={() => setIsDeliveryModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <form onSubmit={handleDelivery} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Funcionário</label>
                    <select required value={deliveryForm.employeeName} onChange={e => {
                      const emp = staff.find(s => s.name === e.target.value);
                      setDeliveryForm({ ...deliveryForm, employeeName: e.target.value, employeeRole: emp?.scope || 'LIMPEZA' });
                    }} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm uppercase outline-none focus:bg-white transition-all">
                      <option value="">Selecione...</option>
                      {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo</label><input disabled value={deliveryForm.employeeRole} className="w-full p-4 bg-gray-100 border border-gray-100 rounded-2xl font-black text-xs text-gray-500 uppercase" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">EPI</label><select required value={deliveryForm.ppeId} onChange={e => setDeliveryForm({ ...deliveryForm, ppeId: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none">{items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.currentStock} {i.unit})</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qtd</label><input required type="number" min="1" value={deliveryForm.quantity} onChange={e => setDeliveryForm({ ...deliveryForm, quantity: parseInt(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-lg text-center outline-none" /></div>
                </div>
                <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-orange-700 transition-all">Confirmar e Gerar Termo</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PPEControl;