
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Package,
  ClipboardCheck,
  User,
  Clock,
  Calendar,
  RotateCcw,
  ArrowRightLeft,
  Download,
  Loader2,
  CheckCircle2,
  Info,
  History,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  X,
  Save,
  ChevronDown
} from 'lucide-react';
import { OFFICIAL_MENUS } from '../constants/menus';
import { supabase } from '../supabaseClient';
import { StaffMember } from '../types';

const ENTRADA_KEYWORDS = [
  'ABACAXI', 'BANANA', 'MAMÃO', 'MELÃO', 'MELANCIA', 'LARANJA', 'PONCÃ', 'MAÇÃ',
  'PÃO', 'BOLO', 'LEITE', 'BEBIDA LÁCTEA', 'QUEIJO', 'REQUEIJÃO', 'CAFÉ',
  'BOLACHA', 'BISCOITO', 'IOGURTE', 'MANTEIGA', 'FRUTA', 'SUCO', 'MARACUJÁ', 'ACEROLA'
];

interface SeducInventoryItem {
  id: string;
  name: string;
  unit: string;
  previousBalance: number;
  entries: number;
  outputs: number;
  min: number;
}

interface InventorySnapshot {
  id: string;
  date: string;
  turno: string;
  responsavel: string;
  items: SeducInventoryItem[];
  timestamp: number;
}

const Inventory: React.FC = () => {
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [items, setItems] = useState<SeducInventoryItem[]>(() => {
    const saved = localStorage.getItem('seduc_inventory_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<InventorySnapshot[]>(() => {
    const saved = localStorage.getItem('merenda_inventory_history_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', unit: 'Kg', min: 0 });

  const [turno, setTurno] = useState('Matutino');
  const [responsavel, setResponsavel] = useState('Gestor André');
  const [data, setData] = useState(new Date().toLocaleDateString('sv-SE'));
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<string>('Segunda');
  const [nutricaoStaff, setNutricaoStaff] = useState<StaffMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .or('role.eq.AEE_NUTRICAO,job_function.ilike.%NUTRIÇÃO%')
        .eq('status', 'EM_ATIVIDADE');
      if (staffData) setNutricaoStaff(staffData);
    };
    fetchStaff();
  }, []);

  // Sync week/day based on date
  useEffect(() => {
    const d = new Date(data);
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayName = days[d.getUTCDay()];
    if (dayName !== 'Domingo' && dayName !== 'Sábado') {
      setSelectedDay(dayName);
    }
  }, [data]);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('seduc_inventory_v3', JSON.stringify(items));
  }, [items]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item: SeducInventoryItem = {
      id: `item-${Date.now()}`,
      ...newItem,
      previousBalance: 0,
      entries: 0,
      outputs: 0
    };
    setItems([...items, item]);
    setIsAddItemModalOpen(false);
    setNewItem({ name: '', unit: 'Kg', min: 0 });
  };

  const deleteItem = (id: string) => {
    if (window.confirm("Deseja remover este item do controle de estoque?")) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleUpdateItem = (id: string, field: 'entries' | 'outputs', value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: numValue } : item
    ));
  };

  const syncWithMenu = () => {
    const allIngredients = new Set<string>();
    OFFICIAL_MENUS.forEach(week => {
      week.days.forEach(day => {
        day.ingredients.forEach(ing => allIngredients.add(ing.toUpperCase()));
      });
    });

    const newItemsFound: SeducInventoryItem[] = [];
    allIngredients.forEach(upperName => {
      const exists = items.some(i => i.name === upperName);
      if (!exists) {
        newItemsFound.push({
          id: `item-${Date.now()}-${Math.random()}`,
          name: upperName,
          unit: ENTRADA_KEYWORDS.some(key => upperName.includes(key)) ? 'Un' : 'Kg',
          previousBalance: 0,
          entries: 0,
          outputs: 0,
          min: 1
        });
      }
    });

    if (newItemsFound.length > 0) {
      setItems(prev => [...prev, ...newItemsFound]);
      alert(`${newItemsFound.length} novos ingredientes carregados de todo o cardápio (5 semanas)!`);
    } else {
      alert("Todos os ingredientes do cardápio completo já estão na lista.");
    }
  };

  const handleResetDaily = () => {
    if (items.length === 0) return alert("Cadastre itens antes de fechar o turno.");
    if (window.confirm(`Deseja fechar o turno ${turno}? Os saldos serão consolidados no histórico.`)) {
      const snapshot: InventorySnapshot = {
        id: `inv-${Date.now()}`,
        date: data,
        turno: turno,
        responsavel: responsavel,
        items: items.map(i => ({ ...i })),
        timestamp: Date.now()
      };

      const updatedHistory = [snapshot, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('merenda_inventory_history_v1', JSON.stringify(updatedHistory));

      // Update balances for the NEXT shift
      setItems(prev => prev.map(item => ({
        ...item,
        previousBalance: item.previousBalance + item.entries - item.outputs,
        entries: 0,
        outputs: 0
      })));

      // Auto-advance Shift
      const shifts = ['Matutino', 'Vespertino', 'Noturno', 'Integral'];
      const currentIndex = shifts.indexOf(turno);
      if (currentIndex < shifts.length - 1) {
        setTurno(shifts[currentIndex + 1]);
      } else {
        // End of day, advance date and reset shift to first
        setTurno(shifts[0]);
        const nextDate = new Date(data);
        nextDate.setDate(nextDate.getDate() + 1);
        setData(nextDate.toLocaleDateString('sv-SE'));
      }

      alert("Fechamento de turno realizado! Avançando para o próximo período.");
    }
  };

  const handleDownloadPDF = async () => {
    setIsSaving(true);
    const element = printRef.current;
    if (!element) return;
    try {
      // @ts-ignore
      await window.html2pdf().set({
        margin: 10,
        filename: `Estoque_Real_${data}.pdf`,
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }).from(element).save();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm no-print">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-900 text-white rounded-3xl"><ClipboardCheck size={32} /></div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Estoque Real da Unidade</h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest leading-none mt-1">Gestão de Alimentação Escolar</p>
            </div>
          </div>
          <div className="flex gap-3">
            {viewMode === 'active' && (
              <button onClick={() => setIsAddItemModalOpen(true)} className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"><Plus size={14} /> Novo Produto</button>
            )}
            <button onClick={() => setViewMode(viewMode === 'active' ? 'history' : 'active')} className="px-5 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-[10px] tracking-widest"><History size={14} /></button>
            {viewMode === 'active' && <button onClick={handleResetDaily} className="px-5 py-3 bg-emerald-100 text-emerald-700 rounded-2xl font-black uppercase text-[10px] tracking-widest">Fechar Turno</button>}
            <button onClick={handleDownloadPDF} disabled={isSaving} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}</button>
          </div>
        </div>

        {viewMode === 'active' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turno</label><select value={turno} onChange={(e) => setTurno(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-emerald-500/20">{['Matutino', 'Vespertino', 'Noturno', 'Integral'].map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável (AAE Nutrição)</label>
                <div className="relative">
                  <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none appearance-none focus:ring-2 focus:ring-emerald-500/20">
                    <option value="Gestor André">Gestor André</option>
                    {nutricaoStaff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data do Lançamento</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações Rápidas</label>
                <button onClick={syncWithMenu} className="w-full p-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                  <RotateCcw size={14} /> Carregar Ingredientes do Mês
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 no-print">
              <Info size={16} className="text-emerald-600" />
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight">O sistema carregará automaticamente todos os ingredientes únicos das 5 semanas do cardápio oficial.</p>
            </div>
          </div>
        )}
      </div>

      <div ref={printRef} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest w-[35%]">Produto</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center w-[15%]">Saldo Inicial</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center bg-emerald-800/50 w-[15%]">Entradas</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center bg-red-800/50 w-[15%]">Saídas</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center w-[15%]">Saldo Final</th>
              {viewMode === 'active' && <th className="px-4 py-5 w-[5%] no-print"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedItems.map((item) => {
              const currentBalance = item.previousBalance + item.entries - item.outputs;
              const isCritical = currentBalance < item.min;
              return (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${isCritical ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}><Package size={20} /></div>
                      <div><p className="font-black text-gray-900 uppercase text-xs">{item.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">UN: {item.unit}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center text-sm font-bold text-gray-400">{item.previousBalance.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-4 text-center bg-emerald-50/10"><input type="number" step="0.01" value={item.entries || ""} onChange={(e) => handleUpdateItem(item.id, 'entries', e.target.value)} className="w-full bg-transparent text-center font-black text-emerald-600 outline-none no-print" /><span className="hidden pdf-show">{item.entries || '0'}</span></td>
                  <td className="px-4 py-4 text-center bg-red-50/10"><input type="number" step="0.01" value={item.outputs || ""} onChange={(e) => handleUpdateItem(item.id, 'outputs', e.target.value)} className="w-full bg-transparent text-center font-black text-red-600 outline-none no-print" /><span className="hidden pdf-show">{item.outputs || '0'}</span></td>
                  <td className={`px-6 py-6 text-center text-sm font-black ${isCritical ? 'text-red-700 bg-red-50/40' : 'text-gray-900'}`}>{currentBalance.toLocaleString('pt-BR')}</td>
                  {viewMode === 'active' && <td className="px-4 py-6 no-print text-right"><button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button></td>}
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={6} className="py-24 text-center text-gray-300 font-black uppercase text-xs tracking-widest">Sem itens cadastrados no inventário.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Adicionar Item */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-8 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 uppercase">Novo Item de Estoque</h3>
              <button onClick={() => setIsAddItemModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddItem} className="p-10 space-y-6">
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição do Alimento</label><input required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value.toUpperCase() })} placeholder="EX: ARROZ AGULHINHA" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:bg-white transition-all" /></div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidade</label><select value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs uppercase outline-none"><option>Kg</option><option>Un</option><option>Litro</option><option>Pct</option><option>Dz</option></select></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estoque Mínimo</label><input required type="number" step="0.01" value={newItem.min} onChange={e => setNewItem({ ...newItem, min: parseFloat(e.target.value) || 0 })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:bg-white transition-all" /></div>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"><Save size={20} /> Cadastrar Alimento</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
