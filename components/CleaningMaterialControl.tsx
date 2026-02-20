import React, { useState, useEffect, useMemo } from 'react';
import {
  Droplets,
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
  ShieldCheck,
  SprayCan,
  Archive,
  BarChart3
} from 'lucide-react';
import { CleaningMaterial, MaterialDelivery, CleaningMaterialCategory, CleaningEmployee } from '../types';

const INITIAL_MATERIALS: CleaningMaterial[] = [
  // COZINHA
  { id: 'mat-k1', name: 'DETERGENTE NEUTRO 500ML', category: 'COZINHA', stock: 45, minStock: 24, unit: 'FRASCO' },
  { id: 'mat-k2', name: 'ÁGUA SANITÁRIA 2L (CLORO)', category: 'COZINHA', stock: 12, minStock: 10, unit: 'FRASCO' },
  { id: 'mat-k3', name: 'DESENGORDURANTE INDUSTRIAL 5L', category: 'COZINHA', stock: 4, minStock: 5, unit: 'GALÃO' },
  { id: 'mat-k4', name: 'SAPÃO EM PÓ 1KG', category: 'COZINHA', stock: 8, minStock: 10, unit: 'PCT' },
  { id: 'mat-k5', name: 'ÁLCOOL 70% 1L', category: 'COZINHA', stock: 15, minStock: 12, unit: 'FRASCO' },
  { id: 'mat-k6', name: 'ESPONJA DUPLA FACE (UNID)', category: 'COZINHA', stock: 30, minStock: 20, unit: 'UNID' },
  { id: 'mat-k7', name: 'PANO DE PRATO ALGODÃO', category: 'COZINHA', stock: 20, minStock: 15, unit: 'UNID' },

  // ESCOLA
  { id: 'mat-s1', name: 'DESINFETANTE PERFUMADO 5L', category: 'ESCOLA', stock: 6, minStock: 8, unit: 'GALÃO' },
  { id: 'mat-s2', name: 'SABONETE LÍQUIDO INODORO 5L', category: 'ESCOLA', stock: 10, minStock: 10, unit: 'GALÃO' },
  { id: 'mat-s3', name: 'PAPEL TOALHA INTERFOLHADO (PCT)', category: 'ESCOLA', stock: 50, minStock: 80, unit: 'PCT' },
  { id: 'mat-s4', name: 'PAPEL HIGIÊNICO ROLÃO (PCT)', category: 'ESCOLA', stock: 25, minStock: 40, unit: 'PCT' },
  { id: 'mat-s5', name: 'VASSOURA DE NYLON', category: 'ESCOLA', stock: 5, minStock: 4, unit: 'UNID' },
  { id: 'mat-s6', name: 'RODO PLÁSTICO 40CM', category: 'ESCOLA', stock: 3, minStock: 5, unit: 'UNID' },
  { id: 'mat-s7', name: 'BALDE PLÁSTICO 15L', category: 'ESCOLA', stock: 8, minStock: 6, unit: 'UNID' },
];

import { supabase } from '../supabaseClient';

const CleaningMaterialControl: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'deliveries' | 'entries'>('inventory');
  const [activeCategory, setActiveCategory] = useState<CleaningMaterialCategory | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [staff, setStaff] = useState<CleaningEmployee[]>([]);
  const [materials, setMaterials] = useState<CleaningMaterial[]>([]);
  const [deliveries, setDeliveries] = useState<MaterialDelivery[]>([]);
  const [entries, setEntries] = useState<any[]>([]);

  const [deliveryForm, setDeliveryForm] = useState<Omit<MaterialDelivery, 'id' | 'timestamp'>>({
    employeeName: '',
    employeeRole: 'LIMPEZA',
    materialId: '',
    materialName: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
  });

  const [entryForm, setEntryForm] = useState({
    materialId: '',
    supplier: '',
    receiverName: '',
    quantity: 1,
    invoice: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      // 1. Fetch Materials
      const { data: matData, error: matError } = await supabase
        .from('cleaning_materials')
        .select('*')
        .order('name');

      if (matError) throw matError;

      if (matData && matData.length > 0) {
        setMaterials(matData.map(m => ({
          id: m.id,
          name: m.name,
          category: m.category as CleaningMaterialCategory,
          stock: m.stock,
          minStock: m.min_stock,
          unit: m.unit
        })));
      } else if (matData && matData.length === 0) {
        // Auto-seed
        const { data: inserted, error: insertError } = await supabase
          .from('cleaning_materials')
          .insert(INITIAL_MATERIALS.map(m => ({
            name: m.name,
            category: m.category,
            stock: m.stock,
            min_stock: m.minStock,
            unit: m.unit
          })))
          .select();

        if (inserted) {
          setMaterials(inserted.map(m => ({
            id: m.id,
            name: m.name,
            category: m.category as CleaningMaterialCategory,
            stock: m.stock,
            minStock: m.min_stock,
            unit: m.unit
          })));
        }
      }

      // 2. Fetch Deliveries
      const { data: delData, error: delError } = await supabase
        .from('cleaning_material_deliveries')
        .select('*')
        .order('timestamp', { ascending: false });

      if (delError) throw delError;

      if (delData) {
        setDeliveries(delData.map(d => ({
          id: d.id,
          employeeName: d.employee_name,
          employeeRole: d.employee_role,
          materialId: d.material_id,
          materialName: '', // Will be mapped in UI or join
          quantity: d.quantity,
          date: d.date,
          timestamp: new Date(d.timestamp).getTime()
        })).map(d => {
          // Join material name manually if simple
          const mat = matData?.find(m => m.id === d.materialId);
          return { ...d, materialName: mat?.name || 'Item desconhecido' };
        }));
      }

    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
    }

    try {
      const { data: entData, error: entError } = await supabase
        .from('cleaning_material_entries')
        .select('*')
        .order('timestamp', { ascending: false });

      if (entError) throw entError;
      if (entData) {
        setEntries(entData.map(e => {
          const mat = materials.find(m => m.id === e.material_id);
          return {
            ...e,
            materialName: mat?.name || 'Item desconhecido'
          };
        }));
      }
    } catch (e) { }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('materials_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_materials' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_material_deliveries' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_material_entries' }, fetchData)
      .subscribe();

    const loadStaff = () => {
      // Trying to reuse the same logic as parent or just simple load
      const saved = localStorage.getItem('secretariat_staff_v4');
      // Note: original code used 'cleaning_team_v1' but we want to arguably use the unified staff if possible?
      // The previous file used 'secretariat_staff_v4'. Let's stick to what the original file did ('cleaning_team_v1') OR try to unify.
      // The original file used 'cleaning_team_v1' at line 80.
      // However, cleaning module uses secretariat_staff_v4.
      // Let's use 'secretariat_staff_v4' to be consistent with the module changes we just made, or fallback.
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Simple map to CleaningEmployee
          setStaff(parsed.map((s: any) => ({
            id: s.id,
            name: s.name,
            scope: s.jobFunction
          })));
        } catch (e) { }
      } else {
        // Fallback to old key if new one empty, just in case
        const oldSaved = localStorage.getItem('cleaning_team_v1');
        if (oldSaved) setStaff(JSON.parse(oldSaved));
      }
    };
    loadStaff();
    window.addEventListener('storage', loadStaff);
    return () => {
      channel.unsubscribe();
      window.removeEventListener('storage', loadStaff);
    };
  }, []);

  // Removed localStorage useEffects

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchCat = activeCategory === 'TODOS' || m.category === activeCategory;
      const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [materials, activeCategory, searchTerm]);

  const stats = useMemo(() => {
    const totalItems = materials.length;
    const critical = materials.filter(m => m.stock < m.minStock).length;
    const low = materials.filter(m => m.stock >= m.minStock && m.stock < m.minStock * 1.5).length;
    return {
      critical, low, ok: totalItems - critical - low,
      deliveredCount: deliveries.length,
      entriesCount: entries.length
    };
  }, [materials, deliveries, entries]);

  const handleDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    const material = materials.find(m => m.id === deliveryForm.materialId);
    if (!material) return alert("Selecione um material.");
    if (material.stock < deliveryForm.quantity) return alert("Estoque insuficiente.");

    try {
      // 1. Update Stock
      const { error: updateError } = await supabase
        .from('cleaning_materials')
        .update({ stock: material.stock - deliveryForm.quantity })
        .eq('id', material.id);

      if (updateError) throw updateError;

      // 2. Register Delivery
      const { error: insertError } = await supabase
        .from('cleaning_material_deliveries')
        .insert([{
          material_id: material.id,
          employee_name: deliveryForm.employeeName,
          employee_role: deliveryForm.employeeRole,
          quantity: deliveryForm.quantity,
          date: deliveryForm.date
        }]);

      if (insertError) throw insertError;

      setIsDeliveryModalOpen(false);
      resetDeliveryForm();
      alert("Saída registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar saída:", error);
      alert("Erro ao registrar saída.");
    }
  };

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const material = materials.find(m => m.id === entryForm.materialId);
    if (!material) return alert("Selecione um material.");

    try {
      // 1. Update Stock
      const { error: updateError } = await supabase
        .from('cleaning_materials')
        .update({ stock: material.stock + entryForm.quantity })
        .eq('id', material.id);

      if (updateError) throw updateError;

      // 2. Register Entry
      const { error: insertError } = await supabase
        .from('cleaning_material_entries')
        .insert([{
          material_id: material.id,
          supplier: entryForm.supplier,
          receiver_name: entryForm.receiverName,
          quantity: entryForm.quantity,
          invoice: entryForm.invoice,
          date: entryForm.date
        }]);

      if (insertError) throw insertError;

      setIsEntryModalOpen(false);
      resetEntryForm();
      alert("Entrada registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar entrada:", error);
      alert("Erro ao registrar entrada.");
    }
  };

  const resetEntryForm = () => {
    setEntryForm({
      materialId: '',
      supplier: '',
      receiverName: '',
      quantity: 1,
      invoice: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const resetDeliveryForm = () => {
    setDeliveryForm({
      employeeName: '',
      employeeRole: 'LIMPEZA',
      materialId: '',
      materialName: '',
      quantity: 1,
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Insumos em Dia</p>
          <div className="flex items-end justify-between"><p className="text-3xl font-black text-emerald-600">{stats.ok}</p><CheckCircle2 size={24} className="text-emerald-500" /></div>
        </div>
        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col justify-between h-32">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">Estoque Baixo</p>
          <div className="flex items-end justify-between"><p className="text-3xl font-black text-orange-700">{stats.low}</p><Clock size={24} className="text-orange-500" /></div>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between h-32">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Críticos</p>
          <div className="flex items-end justify-between"><p className="text-3xl font-black text-red-900">{stats.critical}</p><AlertTriangle size={24} className="text-red-500" /></div>
        </div>
        <div className="bg-orange-950 p-6 rounded-3xl shadow-xl flex flex-col justify-between h-32 text-white">
          <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest leading-none">Reposição de Estoque</p>
          <div className="flex items-end justify-between"><p className="text-3xl font-black">{stats.entriesCount}</p><BarChart3 size={24} className="text-orange-400" /></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl no-print">
          <button onClick={() => setActiveSubTab('inventory')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'inventory' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Insumos</button>
          <button onClick={() => setActiveSubTab('entries')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'entries' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Entradas</button>
          <button onClick={() => setActiveSubTab('deliveries')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'deliveries' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Saídas</button>
        </div>
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input type="text" placeholder="Pesquisar material..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-orange-500/5 transition-all" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsEntryModalOpen(true)} className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 shrink-0"><Plus size={16} /> Entrada</button>
          <button onClick={() => setIsDeliveryModalOpen(true)} className="px-6 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-2 shrink-0"><Archive size={16} /> Saída</button>
        </div>
      </div>

      {activeSubTab === 'inventory' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
          {filteredMaterials.map(mat => (
            <div key={mat.id} className={`p-6 rounded-[2.5rem] border-2 transition-all shadow-sm relative overflow-hidden group ${mat.stock < mat.minStock ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-start mb-4"><span className="text-[8px] font-black uppercase px-2 py-1 bg-gray-900 text-white rounded-lg">{mat.category}</span><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mínimo: {mat.minStock}</span></div>
              <h4 className="text-sm font-black text-gray-900 uppercase leading-snug mb-6 h-10 line-clamp-2">{mat.name}</h4>
              <div className="flex items-end justify-between"><div><p className={`text-4xl font-black ${mat.stock < mat.minStock ? 'text-red-700' : 'text-gray-900'}`}>{mat.stock}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{mat.unit} em estoque</p></div><div className="p-4 bg-gray-100 text-gray-400 rounded-2xl"><Droplets size={28} /></div></div>
            </div>
          ))}
        </div>
      ) : activeSubTab === 'deliveries' ? (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100"><th className="px-8 py-5">Colaborador</th><th className="px-8 py-5">Material</th><th className="px-8 py-5 text-center">Data</th><th className="px-8 py-5 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-gray-50">{deliveries.map(del => (
              <tr key={del.id} className="hover:bg-gray-50/50">
                <td className="px-8 py-5"><div className="flex items-center gap-4"><div className="p-3 bg-gray-100 text-gray-400 rounded-xl"><User size={20} /></div><div><p className="text-sm font-black text-gray-900 uppercase">{del.employeeName}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{del.employeeRole}</p></div></div></td>
                <td className="px-8 py-5"><p className="text-xs font-black text-gray-700 uppercase">{del.materialName}</p><p className="text-[9px] text-orange-600 font-bold uppercase">Quantidade: {del.quantity}</p></td>
                <td className="px-8 py-5 text-center"><p className="text-xs font-bold text-gray-400">{new Date(del.date).toLocaleDateString('pt-BR')}</p></td>
                <td className="px-8 py-5 text-right"><button className="p-3 bg-white text-gray-300 hover:text-red-500 rounded-xl border border-gray-100 transition-all"><Trash2 size={18} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-8 py-5">Fornecedor / Origem</th>
                <th className="px-8 py-5">Recebedor (Servidor)</th>
                <th className="px-8 py-5">Material</th>
                <th className="px-8 py-5 text-center">Data</th>
                <th className="px-8 py-5 text-right">Doc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map(ent => (
                <tr key={ent.id} className="hover:bg-gray-50/50">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Briefcase size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase">{ent.supplier}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Entrada de Estoque</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-black text-gray-700 uppercase">{ent.receiver_name || '---'}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-black text-gray-700 uppercase">{ent.materialName}</p>
                    <p className="text-[9px] text-emerald-600 font-bold uppercase">Quantidade: +{ent.quantity}</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <p className="text-xs font-bold text-gray-400">{new Date(ent.date).toLocaleDateString('pt-BR')}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase border border-gray-100 px-2 py-1 rounded">{ent.invoice || '---'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEntryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 bg-emerald-50 flex justify-between items-center border-b border-emerald-100">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-lg"><Plus size={28} /></div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase">Registrar Entrada</h3>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Reposição de Estoque André Maggi</p>
                </div>
              </div>
              <button onClick={() => setIsEntryModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <form onSubmit={handleEntry} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fornecedor / Origem</label>
                    <input required placeholder="Ex: Secretaria de Educação, Fornecedor X..." value={entryForm.supplier} onChange={e => setEntryForm({ ...entryForm, supplier: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm uppercase outline-none focus:bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Servidor que Recebeu</label>
                    <select required value={entryForm.receiverName} onChange={e => setEntryForm({ ...entryForm, receiverName: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm uppercase outline-none focus:bg-white transition-all">
                      <option value="">Selecione...</option>
                      {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nota Fiscal / Doc (Opcional)</label>
                    <input placeholder="Ex: NF 123456" value={entryForm.invoice} onChange={e => setEntryForm({ ...entryForm, invoice: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm uppercase outline-none focus:bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Entrada</label>
                    <input type="date" value={entryForm.date} onChange={e => setEntryForm({ ...entryForm, date: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Material</label>
                    <select required value={entryForm.materialId} onChange={e => setEntryForm({ ...entryForm, materialId: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none">
                      <option value="">Selecione...</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name} (Atual: {m.stock} {m.unit})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qtd</label>
                    <input required type="number" min="1" value={entryForm.quantity} onChange={e => setEntryForm({ ...entryForm, quantity: parseInt(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-lg text-center outline-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-emerald-700 transition-all">Confirmar e Repor Estoque</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY MODAL (Original modified for consistency) */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 bg-orange-50 flex justify-between items-center border-b border-orange-100">
              <div className="flex items-center gap-5"><div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg"><Archive size={28} /></div><div><h3 className="text-2xl font-black text-gray-900 uppercase">Registrar Saída</h3><p className="text-[10px] text-orange-600 font-bold uppercase mt-1">Controle de Insumos André Maggi</p></div></div>
              <button onClick={() => setIsDeliveryModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <form onSubmit={handleDelivery} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recebedor</label>
                    <select required value={deliveryForm.employeeName} onChange={e => {
                      const emp = staff.find(s => s.name === e.target.value);
                      setDeliveryForm({ ...deliveryForm, employeeName: e.target.value, employeeRole: emp?.scope || 'LIMPEZA' });
                    }} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm uppercase outline-none focus:bg-white">
                      <option value="">Selecione...</option>
                      {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Setor</label><input disabled value={deliveryForm.employeeRole} className="w-full p-4 bg-gray-100 border border-gray-100 rounded-2xl font-black text-xs text-gray-500 uppercase" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Material</label><select required value={deliveryForm.materialId} onChange={e => setDeliveryForm({ ...deliveryForm, materialId: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none"><option value="">Selecione...</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.stock} {m.unit})</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qtd</label><input required type="number" min="1" value={deliveryForm.quantity} onChange={e => setDeliveryForm({ ...deliveryForm, quantity: parseInt(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-lg text-center outline-none" /></div>
                </div>
                <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-orange-700 transition-all">Confirmar e Dar Baixa</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningMaterialControl;