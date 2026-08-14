import React, { useState, useEffect, useMemo } from 'react';
import {
  Laptop,
  Search,
  Plus,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  FileDown,
  Printer,
  X,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Edit2,
  Trash2,
  Battery,
  HardDrive,
  UserCheck,
  Calendar,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { ChromebookAssetItem, ChromebookMaintenanceLog, ChromebookStatus, ChromebookPhysicalCondition, Shift } from '../types';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';

const STATIONS = [
  "Estação 01 (biblioteca)",
  "Estação 02 (sala 22)",
  "Estação 03 (sala 22)",
  "Estação 04 (biblioteca)",
  "Estação 05 biblioteca/armário"
];

// Initial mock data if database is empty
const generateInitialChromebooks = (): ChromebookAssetItem[] => {
  const list: ChromebookAssetItem[] = [];
  STATIONS.forEach((station, sIdx) => {
    for (let i = 1; i <= 40; i++) {
      const numStr = String(i).padStart(2, '0');
      const statNum = String(sIdx + 1).padStart(2, '0');
      const isDefective = (sIdx === 0 && i === 12) || (sIdx === 2 && i === 5) || (sIdx === 3 && i === 34);
      const isMaintenance = (sIdx === 1 && i === 8) || (sIdx === 4 && i === 19);

      list.push({
        id: `cb-${sIdx + 1}-${i}`,
        assetTag: `PAT-CB-${statNum}${numStr}`,
        internalNumber: numStr,
        serialNumber: `NS-POS-2026-${statNum}${numStr}`,
        brand: 'Positivo',
        model: 'Chromebook C434',
        stationId: station,
        status: isMaintenance ? 'EM_MANUTENCAO' : 'DISPONIVEL',
        condition: isDefective ? 'COM_AVARIA' : 'OTIMO',
        hasCharger: !(sIdx === 0 && i === 12),
        notes: isDefective ? 'Tela com leve arranhão no canto superior direito.' : 'Equipamento em perfeito estado.'
      });
    }
  });
  return list;
};

export const ChromebookManagement: React.FC = () => {
  const [chromebooks, setChromebooks] = useState<ChromebookAssetItem[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<ChromebookMaintenanceLog[]>([]);
  const [activeTab, setActiveTab] = useState<'stations' | 'inventory' | 'maintenance'>('stations');
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState<boolean>(false);
  const [selectedChromebookForQr, setSelectedChromebookForQr] = useState<ChromebookAssetItem | null>(null);

  // Form State
  const [editingCb, setEditingCb] = useState<ChromebookAssetItem | null>(null);
  const [cbForm, setCbForm] = useState({
    assetTag: '',
    internalNumber: '',
    serialNumber: '',
    brand: 'Positivo',
    model: 'Chromebook C434',
    stationId: STATIONS[0],
    status: 'DISPONIVEL' as ChromebookStatus,
    condition: 'OTIMO' as ChromebookPhysicalCondition,
    hasCharger: true,
    notes: ''
  });

  // Batch Form State
  const [batchForm, setBatchForm] = useState({
    stationId: STATIONS[0],
    brand: 'Positivo',
    model: 'Chromebook C434',
    quantity: 40,
    serialPrefix: 'NS-POS-2026-',
    assetPrefix: 'PAT-CB-'
  });

  // Maintenance Form State
  const [maintenanceForm, setMaintenanceForm] = useState({
    chromebookId: '',
    defectType: 'TELA' as any,
    description: '',
    reportedBy: 'Fiel Almocharife'
  });

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load Chromebooks
      const { data: cbData, error: cbErr } = await supabase
        .from('chromebook_assets')
        .select('*')
        .order('asset_tag', { ascending: true });

      if (!cbErr && cbData && cbData.length > 0) {
        setChromebooks(cbData.map(c => ({
          id: c.id,
          assetTag: c.asset_tag,
          internalNumber: c.internal_number || c.asset_tag?.slice(-2) || '',
          serialNumber: c.serial_number,
          brand: c.brand,
          model: c.model,
          stationId: c.station_id,
          status: c.status as ChromebookStatus,
          condition: c.condition as ChromebookPhysicalCondition,
          hasCharger: c.has_charger,
          notes: c.notes || ''
        })));
      } else {
        const saved = localStorage.getItem('chromebook_assets_v3');
        if (saved) {
          setChromebooks(JSON.parse(saved));
        } else {
          const initial = generateInitialChromebooks();
          setChromebooks(initial);
          localStorage.setItem('chromebook_assets_v3', JSON.stringify(initial));
        }
      }

      // 2. Load Maintenance Logs
      const { data: mainData, error: mainErr } = await supabase
        .from('chromebook_maintenance')
        .select('*')
        .order('created_at', { ascending: false });

      if (!mainErr && mainData) {
        setMaintenanceLogs(mainData.map(m => ({
          id: m.id,
          chromebookId: m.chromebook_id,
          assetTag: m.asset_tag,
          serialNumber: m.serial_number,
          defectType: m.defect_type,
          description: m.description,
          reportedBy: m.reported_by,
          reportDate: m.report_date,
          status: m.status,
          resolutionNotes: m.resolution_notes,
          cost: m.cost
        })));
      } else {
        const savedM = localStorage.getItem('chromebook_maintenance_v1');
        if (savedM) setMaintenanceLogs(JSON.parse(savedM));
      }
    } catch (err) {
      console.error("Erro ao carregar Chromebooks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save State to Storage
  const persistChromebooks = async (newList: ChromebookAssetItem[]) => {
    setChromebooks(newList);
    localStorage.setItem('chromebook_assets_v3', JSON.stringify(newList));
  };

  const persistMaintenance = async (newLogs: ChromebookMaintenanceLog[]) => {
    setMaintenanceLogs(newLogs);
    localStorage.setItem('chromebook_maintenance_v1', JSON.stringify(newLogs));
  };

  // Handlers
  const handleSaveChromebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbForm.assetTag || !cbForm.serialNumber) return alert('Preencha Tombamento e N/S.');

    try {
      if (editingCb) {
        const updated = chromebooks.map(c => c.id === editingCb.id ? { ...c, ...cbForm } : c);
        await persistChromebooks(updated);

        await supabase.from('chromebook_assets').update({
          asset_tag: cbForm.assetTag,
          internal_number: cbForm.internalNumber,
          serial_number: cbForm.serialNumber,
          brand: cbForm.brand,
          model: cbForm.model,
          station_id: cbForm.stationId,
          status: cbForm.status,
          condition: cbForm.condition,
          has_charger: cbForm.hasCharger,
          notes: cbForm.notes
        }).eq('id', editingCb.id);

        alert('Chromebook atualizado com sucesso!');
      } else {
        const newCb: ChromebookAssetItem = {
          id: `cb-${Date.now()}`,
          ...cbForm
        };
        const updated = [newCb, ...chromebooks];
        await persistChromebooks(updated);

        await supabase.from('chromebook_assets').insert([{
          asset_tag: cbForm.assetTag,
          internal_number: cbForm.internalNumber,
          serial_number: cbForm.serialNumber,
          brand: cbForm.brand,
          model: cbForm.model,
          station_id: cbForm.stationId,
          status: cbForm.status,
          condition: cbForm.condition,
          has_charger: cbForm.hasCharger,
          notes: cbForm.notes
        }]);

        alert('Chromebook cadastrado com sucesso!');
      }

      setIsAddModalOpen(false);
      setEditingCb(null);
    } catch (err: any) {
      console.error(err);
      alert('Operação realizada no armazenamento local.');
    }
  };

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(batchForm.quantity);
    if (count <= 0) return;

    const newItems: ChromebookAssetItem[] = [];
    const statIdx = STATIONS.indexOf(batchForm.stationId) + 1;

    for (let i = 1; i <= count; i++) {
      const numStr = String(i).padStart(2, '0');
      const statNum = String(statIdx).padStart(2, '0');
      newItems.push({
        id: `cb-batch-${Date.now()}-${i}`,
        assetTag: `${batchForm.assetPrefix}${statNum}${numStr}`,
        internalNumber: numStr,
        serialNumber: `${batchForm.serialPrefix}${statNum}${numStr}`,
        brand: batchForm.brand,
        model: batchForm.model,
        stationId: batchForm.stationId,
        status: 'DISPONIVEL',
        condition: 'OTIMO',
        hasCharger: true,
        notes: `Cadastrado em lote no armário ${batchForm.stationId}`
      });
    }

    const merged = [...newItems, ...chromebooks];
    await persistChromebooks(merged);

    // Try Supabase insert
    try {
      const payload = newItems.map(n => ({
        asset_tag: n.assetTag,
        serial_number: n.serialNumber,
        brand: n.brand,
        model: n.model,
        station_id: n.stationId,
        status: n.status,
        condition: n.condition,
        has_charger: n.hasCharger,
        notes: n.notes
      }));
      await supabase.from('chromebook_assets').insert(payload);
    } catch (e) {
      console.log('Lote salvo localmente.');
    }

    alert(`${count} Chromebooks gerados com sucesso para ${batchForm.stationId}!`);
    setIsBatchModalOpen(false);
  };

  const handleReportMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = chromebooks.find(c => c.id === maintenanceForm.chromebookId || c.assetTag === maintenanceForm.chromebookId || c.serialNumber === maintenanceForm.chromebookId);
    if (!target) return alert('Chromebook não encontrado. Selecione ou digite o tombamento/N/S.');

    const newLog: ChromebookMaintenanceLog = {
      id: `maint-${Date.now()}`,
      chromebookId: target.id,
      assetTag: target.assetTag,
      serialNumber: target.serialNumber,
      defectType: maintenanceForm.defectType,
      description: maintenanceForm.description,
      reportedBy: maintenanceForm.reportedBy,
      reportDate: new Date().toISOString().split('T')[0],
      status: 'ABERTO'
    };

    const updatedLogs = [newLog, ...maintenanceLogs];
    await persistMaintenance(updatedLogs);

    // Update Chromebook status to EM_MANUTENCAO
    const updatedCbs = chromebooks.map(c => c.id === target.id ? { ...c, status: 'EM_MANUTENCAO' as ChromebookStatus, condition: 'COM_AVARIA' as ChromebookPhysicalCondition } : c);
    await persistChromebooks(updatedCbs);

    alert(`Avaria registrada para o Chromebook ${target.assetTag}. Status atualizado para Manutenção!`);
    setIsMaintenanceModalOpen(false);
    setMaintenanceForm({ chromebookId: '', defectType: 'TELA', description: '', reportedBy: 'Fiel Almocharife' });
  };

  const handleResolveMaintenance = async (logId: string) => {
    if (!window.confirm('Marcar este chamado de manutenção como CONCLUÍDO e retornar o Chromebook para status DISPONÍVEL?')) return;

    const log = maintenanceLogs.find(m => m.id === logId);
    if (!log) return;

    const updatedLogs = maintenanceLogs.map(m => m.id === logId ? { ...m, status: 'CONCLUIDO' as const, completedDate: new Date().toISOString().split('T')[0] } : m);
    await persistMaintenance(updatedLogs);

    if (log.chromebookId) {
      const updatedCbs = chromebooks.map(c => c.id === log.chromebookId ? { ...c, status: 'DISPONIVEL' as ChromebookStatus, condition: 'BOM' as ChromebookPhysicalCondition } : c);
      await persistChromebooks(updatedCbs);
    }

    alert('Manutenção concluída! Equipamento liberado para uso.');
  };

  const handleDeleteChromebook = async (id: string) => {
    if (!window.confirm('Deseja excluir este Chromebook do acervo patrimonial?')) return;
    const updated = chromebooks.filter(c => c.id !== id);
    await persistChromebooks(updated);
    try {
      await supabase.from('chromebook_assets').delete().eq('id', id);
    } catch {}
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const total = chromebooks.length;
    const available = chromebooks.filter(c => c.status === 'DISPONIVEL').length;
    const inUse = chromebooks.filter(c => c.status === 'EMPRESTADO').length;
    const inMaintenance = chromebooks.filter(c => c.status === 'EM_MANUTENCAO').length;
    const defective = chromebooks.filter(c => c.condition === 'COM_AVARIA' || c.condition === 'INOPERANTE').length;
    const missingChargers = chromebooks.filter(c => !c.hasCharger).length;

    return { total, available, inUse, inMaintenance, defective, missingChargers };
  }, [chromebooks]);

  // Filtered List
  const filteredChromebooks = useMemo(() => {
    return chromebooks.filter(c => {
      const matchStation = selectedStation === 'ALL' || c.stationId === selectedStation;
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter || (statusFilter === 'AVARIA' && (c.condition === 'COM_AVARIA' || c.condition === 'INOPERANTE'));
      const matchSearch = !searchTerm || 
        c.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.stationId.toLowerCase().includes(searchTerm.toLowerCase());

      return matchStation && matchStatus && matchSearch;
    });
  }, [chromebooks, selectedStation, statusFilter, searchTerm]);

  // Station Grouping
  const stationGrouped = useMemo(() => {
    const map: Record<string, ChromebookAssetItem[]> = {};
    STATIONS.forEach(s => { map[s] = []; });
    chromebooks.forEach(c => {
      if (!map[c.stationId]) map[c.stationId] = [];
      map[c.stationId].push(c);
    });
    return map;
  }, [chromebooks]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 w-full min-w-0 font-sans text-slate-800">
      
      {/* BANNER PRINCIPAL DO SUBMÓDULO CHROMEBOOKS */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 p-6 sm:p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-blue-900/40 no-print">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 w-fit">
              <Sparkles size={12} /> Gestão Patrimonial de Tecnologias
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
              <Laptop size={32} className="text-blue-400" /> Controle Avançado de Chromebooks
            </h2>
            <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
              Monitoramento individual por Número de Série (N/S), Tombamento, Estações de Recarga, Controle de Avarias e Gestão de Manutenção de Recursos Tecnológicos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setEditingCb(null);
                setCbForm({ assetTag: `PAT-CB-${Date.now().toString().slice(-4)}`, serialNumber: '', brand: 'Positivo', model: 'Chromebook C434', stationId: STATIONS[0], status: 'DISPONIVEL', condition: 'OTIMO', hasCharger: true, notes: '' });
                setIsAddModalOpen(true);
              }}
              className="px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={16} /> Cadastrar Chromebook
            </button>

            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-2xl text-xs font-black uppercase tracking-wider border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Layers size={16} /> Gerar Lote
            </button>

            <button
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="px-5 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all"
            >
              <Wrench size={16} /> Abrir Avaria
            </button>

            <button
              onClick={handlePrintReport}
              className="p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
              title="Imprimir Relatório de Controle em PDF"
            >
              <Printer size={18} />
            </button>
          </div>
        </div>

        {/* CARDS DE RESUMO RÁPIDO */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-8 pt-6 border-t border-slate-800/80 relative z-10">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total no Acervo</p>
            <p className="text-xl font-black text-white mt-1">{stats.total} <span className="text-xs text-slate-400 font-bold">UN</span></p>
          </div>

          <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Disponíveis</p>
            <p className="text-xl font-black text-emerald-400 mt-1">{stats.available} <span className="text-xs text-emerald-500 font-bold">Prontos</span></p>
          </div>

          <div className="bg-blue-950/40 p-4 rounded-2xl border border-blue-500/30">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Em Uso / Sala</p>
            <p className="text-xl font-black text-blue-400 mt-1">{stats.inUse} <span className="text-xs text-blue-500 font-bold">Alocados</span></p>
          </div>

          <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-500/30">
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Em Manutenção</p>
            <p className="text-xl font-black text-amber-400 mt-1">{stats.inMaintenance} <span className="text-xs text-amber-500 font-bold">Reparo</span></p>
          </div>

          <div className="bg-red-950/40 p-4 rounded-2xl border border-red-500/30">
            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Com Avaria</p>
            <p className="text-xl font-black text-red-400 mt-1">{stats.defective} <span className="text-xs text-red-500 font-bold">Defeitos</span></p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sem Carregador</p>
            <p className="text-xl font-black text-amber-300 mt-1">{stats.missingChargers} <span className="text-xs text-slate-400 font-bold">Faltam</span></p>
          </div>
        </div>
      </div>

      {/* ABAS DO SUBMÓDULO */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 no-print">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('stations')}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'stations' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers size={16} /> Estações & Armários ({STATIONS.length})
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Laptop size={16} /> Acervo Individual ({filteredChromebooks.length})
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'maintenance' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Wrench size={16} /> Fila de Manutenção ({maintenanceLogs.filter(m => m.status !== 'CONCLUIDO').length})
          </button>
        </div>

        {/* BUSCA RÁPIDA */}
        <div className="relative w-64 sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar N/S, Tombamento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* CONTEÚDO TAB 1: ESTAÇÕES E ARMÁRIOS */}
      {activeTab === 'stations' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {STATIONS.map((station, idx) => {
              const stationCbs = stationGrouped[station] || [];
              const avail = stationCbs.filter(c => c.status === 'DISPONIVEL').length;
              const maint = stationCbs.filter(c => c.status === 'EM_MANUTENCAO').length;
              const def = stationCbs.filter(c => c.condition === 'COM_AVARIA' || c.condition === 'INOPERANTE').length;

              return (
                <div key={station} className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all space-y-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm">
                          #{String(idx + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-sm uppercase leading-tight">{station}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Armário de Recarga Inteligente</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase">
                        {stationCbs.length} Cbs
                      </span>
                    </div>

                    {/* BARRA DE CAPACIDADE */}
                    <div className="space-y-1.5 mb-6">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                        <span>Diponibilidade da Estação</span>
                        <span>{avail} / {stationCbs.length} Operacionais</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${stationCbs.length > 0 ? (avail / stationCbs.length) * 100 : 0}%` }} title="Disponíveis" />
                        <div className="bg-amber-500 h-full transition-all" style={{ width: `${stationCbs.length > 0 ? (maint / stationCbs.length) * 100 : 0}%` }} title="Manutenção" />
                      </div>
                    </div>

                    {/* GRID DE CHROMEBOOKS DO ARMÁRIO */}
                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-64 overflow-y-auto custom-scrollbar">
                      {stationCbs.map(c => {
                        const isOk = c.status === 'DISPONIVEL' && c.condition !== 'COM_AVARIA';
                        const isMain = c.status === 'EM_MANUTENCAO';
                        const isDefect = c.condition === 'COM_AVARIA';

                        return (
                          <button
                            key={c.id}
                            onClick={() => setSelectedChromebookForQr(c)}
                            className={`p-2 rounded-xl text-[9px] font-black uppercase text-center transition-all flex flex-col items-center justify-center gap-0.5 border ${
                              isMain ? 'bg-amber-100 text-amber-800 border-amber-300' :
                              isDefect ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' :
                              'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={`Tombamento: ${c.assetTag}\nN/S: ${c.serialNumber}\nCondição: ${c.condition}`}
                          >
                            <Laptop size={12} />
                            <span>{c.assetTag.slice(-2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                    <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" /> {def} com avaria</span>
                    <button
                      onClick={() => { setSelectedStation(station); setActiveTab('inventory'); }}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Ver Todos <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTEÚDO TAB 2: ACERVO INDIVIDUAL */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Laptop size={22} /></div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Listagem Individual de Chromebooks</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Conferência detalhada por N/S e Código Patrimonial</p>
              </div>
            </div>

            {/* FILTROS DA TABELA */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStation}
                onChange={e => setSelectedStation(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-800 outline-none"
              >
                <option value="ALL">Todas as Estações</option>
                {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-800 outline-none"
              >
                <option value="ALL">Todos os Status</option>
                <option value="DISPONIVEL">Disponíveis</option>
                <option value="EMPRESTADO">Emprestados</option>
                <option value="EM_MANUTENCAO">Em Manutenção</option>
                <option value="AVARIA">Com Avaria / Defeito</option>
              </select>
            </div>
          </div>

          {/* TABELA DE ACERVO */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                  <th className="px-5 py-4">Nº Interno</th>
                  <th className="px-5 py-4">Tombamento / QR</th>
                  <th className="px-5 py-4">Número de Série (N/S)</th>
                  <th className="px-5 py-4">Estação / Armário</th>
                  <th className="px-5 py-4">Modelo / Marca</th>
                  <th className="px-5 py-4 text-center">Carregador</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Condição</th>
                  <th className="px-5 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredChromebooks.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-black">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-black border border-blue-100">
                        {c.internalNumber || c.assetTag.slice(-2)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedChromebookForQr(c)}
                          className="p-1 bg-slate-100 text-slate-600 rounded-md hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="Exibir QR Code"
                        >
                          <QrCode size={16} />
                        </button>
                        <span className="font-black text-slate-900 uppercase">{c.assetTag}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-700">{c.serialNumber}</td>
                    <td className="px-5 py-4 font-bold text-slate-600 uppercase text-[11px]">{c.stationId}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 uppercase">{c.model}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{c.brand}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {c.hasCharger ? (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md uppercase">OK</span>
                      ) : (
                        <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-md uppercase">Ausente</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {c.status === 'DISPONIVEL' && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded-full">Disponível</span>}
                      {c.status === 'EMPRESTADO' && <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[9px] font-black uppercase rounded-full">Em Alocação</span>}
                      {c.status === 'EM_MANUTENCAO' && <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded-full">Manutenção</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {c.condition === 'OTIMO' && <span className="text-[10px] font-bold text-emerald-600">Ótimo</span>}
                      {c.condition === 'BOM' && <span className="text-[10px] font-bold text-blue-600">Bom</span>}
                      {c.condition === 'COM_AVARIA' && <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">Com Avaria</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingCb(c);
                            setCbForm({
                              assetTag: c.assetTag,
                              internalNumber: c.internalNumber || '',
                              serialNumber: c.serialNumber,
                              brand: c.brand,
                              model: c.model,
                              stationId: c.stationId,
                              status: c.status,
                              condition: c.condition,
                              hasCharger: c.hasCharger,
                              notes: c.notes || ''
                            });
                            setIsAddModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Editar Equipamento"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteChromebook(c.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Excluir"
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
        </div>
      )}

      {/* CONTEÚDO TAB 3: MANUTENÇÃO & AVARIAS */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Wrench size={22} /></div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Fila de Manutenção e Reparos</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Chamados abertos para reparo de telas, teclados e baterias</p>
              </div>
            </div>

            <button
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <Plus size={14} /> Novo Chamado
            </button>
          </div>

          <div className="space-y-4">
            {maintenanceLogs.map(m => (
              <div key={m.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 text-xs uppercase">{m.assetTag}</span>
                    <span className="text-[10px] font-mono text-slate-500">N/S: {m.serialNumber}</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black uppercase rounded-md">{m.defectType}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{m.description}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Relatado por {m.reportedBy} em {m.reportDate}</p>
                </div>

                <div className="flex items-center gap-3">
                  {m.status === 'CONCLUIDO' ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                      Concluído em {m.completedDate}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolveMaintenance(m.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} /> Concluir Reparo
                    </button>
                  )}
                </div>
              </div>
            ))}

            {maintenanceLogs.length === 0 && (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500 opacity-60" />
                <p className="font-black uppercase text-xs">Nenhum chamado de manutenção em aberto</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR / EDITAR CHROMEBOOK */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-slate-100">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-2xl"><Laptop size={20} /></div>
                <h3 className="text-lg font-black uppercase">{editingCb ? 'Editar Chromebook' : 'Cadastrar Chromebook'}</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-slate-400 hover:text-white" /></button>
            </div>

            <form onSubmit={handleSaveChromebook} className="p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Código Tombamento</label>
                  <input
                    type="text"
                    required
                    value={cbForm.assetTag}
                    onChange={e => setCbForm({ ...cbForm, assetTag: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Número Interno</label>
                  <input
                    type="text"
                    placeholder="ex: 01, CB-01"
                    value={cbForm.internalNumber}
                    onChange={e => setCbForm({ ...cbForm, internalNumber: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase text-blue-700 bg-blue-50/50 border-blue-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Número de Série (N/S)</label>
                  <input
                    type="text"
                    required
                    value={cbForm.serialNumber}
                    onChange={e => setCbForm({ ...cbForm, serialNumber: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Estação / Armário de Origem</label>
                <select
                  value={cbForm.stationId}
                  onChange={e => setCbForm({ ...cbForm, stationId: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase"
                >
                  {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Marca</label>
                  <input
                    type="text"
                    value={cbForm.brand}
                    onChange={e => setCbForm({ ...cbForm, brand: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Modelo</label>
                  <input
                    type="text"
                    value={cbForm.model}
                    onChange={e => setCbForm({ ...cbForm, model: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Status Operacional</label>
                  <select
                    value={cbForm.status}
                    onChange={e => setCbForm({ ...cbForm, status: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase"
                  >
                    <option value="DISPONIVEL">Disponível</option>
                    <option value="EMPRESTADO">Emprestado</option>
                    <option value="EM_MANUTENCAO">Em Manutenção</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Condição Física</label>
                  <select
                    value={cbForm.condition}
                    onChange={e => setCbForm({ ...cbForm, condition: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase"
                  >
                    <option value="OTIMO">Ótimo</option>
                    <option value="BOM">Bom</option>
                    <option value="COM_AVARIA">Com Avaria</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chargerChk"
                  checked={cbForm.hasCharger}
                  onChange={e => setCbForm({ ...cbForm, hasCharger: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="chargerChk" className="text-xs font-bold uppercase text-slate-700">Acompanha Carregador Original</label>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl shadow-lg mt-4 transition-all"
              >
                Salvar Equipamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GERAR LOTE */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-slate-100">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-2xl"><Layers size={20} /></div>
                <h3 className="text-lg font-black uppercase">Gerador de Lote de Chromebooks</h3>
              </div>
              <button onClick={() => setIsBatchModalOpen(false)}><X size={20} className="text-slate-400 hover:text-white" /></button>
            </div>

            <form onSubmit={handleGenerateBatch} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Estação / Armário de Destino</label>
                <select
                  value={batchForm.stationId}
                  onChange={e => setBatchForm({ ...batchForm, stationId: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase"
                >
                  {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Quantidade de Chromebooks</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={batchForm.quantity}
                  onChange={e => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Prefixo N/S</label>
                <input
                  type="text"
                  value={batchForm.serialPrefix}
                  onChange={e => setBatchForm({ ...batchForm, serialPrefix: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl shadow-lg mt-4 transition-all"
              >
                Gerar {batchForm.quantity} Equipamentos
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE CARD */}
      {selectedChromebookForQr && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full text-center space-y-6 border border-slate-100 shadow-2xl relative">
            <button onClick={() => setSelectedChromebookForQr(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X size={20} /></button>
            
            <div className="space-y-1">
              <h3 className="font-black text-lg text-slate-900 uppercase">Etiqueta de Patrimônio</h3>
              <p className="text-[10px] text-blue-600 font-black uppercase">E.E. Cívico-Militar André Maggi</p>
            </div>

            <div className="p-6 bg-white border-2 border-slate-900 rounded-3xl inline-block shadow-md">
              <QRCodeSVG value={`CHROMEBOOK:${selectedChromebookForQr.assetTag}:${selectedChromebookForQr.serialNumber}`} size={160} />
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-black text-slate-900 uppercase">{selectedChromebookForQr.assetTag}</p>
              <p className="font-mono text-slate-600 font-bold">N/S: {selectedChromebookForQr.serialNumber}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{selectedChromebookForQr.stationId}</p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Imprimir Etiqueta
            </button>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR AVARIA */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-slate-100">
            <div className="p-6 bg-amber-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl"><Wrench size={20} /></div>
                <h3 className="text-lg font-black uppercase">Abrir Chamado de Avaria</h3>
              </div>
              <button onClick={() => setIsMaintenanceModalOpen(false)}><X size={20} className="text-white/80 hover:text-white" /></button>
            </div>

            <form onSubmit={handleReportMaintenance} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Selecione o Chromebook / Tombamento</label>
                <select
                  value={maintenanceForm.chromebookId}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, chromebookId: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase"
                  required
                >
                  <option value="">Selecione...</option>
                  {chromebooks.map(c => (
                    <option key={c.id} value={c.id}>{c.assetTag} - N/S: {c.serialNumber} ({c.stationId})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Tipo de Defeito / Avaria</label>
                <select
                  value={maintenanceForm.defectType}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, defectType: e.target.value as any })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase"
                >
                  <option value="TELA">Tela Trincada / Sem Imagem</option>
                  <option value="TECLADO">Teclas Faltando / Sem Resposta</option>
                  <option value="BATERIA">Bateria Viciada / Não Carrega</option>
                  <option value="CARREGADOR">Carregador Danificado / Ausente</option>
                  <option value="SISTEMA">Erro no Sistema / ChromeOS</option>
                  <option value="ESTRUTURA">Carcaça Quebrada / Avaria Física</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Descrição da Ocorrência</label>
                <textarea
                  required
                  rows={3}
                  value={maintenanceForm.description}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  placeholder="Relate detalhadamente o defeito encontrado..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl shadow-lg mt-4 transition-all"
              >
                Registrar Avaria e Enviar para Fila
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default ChromebookManagement;
