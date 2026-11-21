import React, { useState, useMemo, useRef } from 'react';
import {
  Laptop,
  Headphones,
  Search,
  Plus,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Printer,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Edit2,
  Trash2,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
  FileSpreadsheet,
  Upload,
  Download,
  UserCheck,
  Clock,
  Lock,
  LayoutGrid,
  List,
  Database,
  Info
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  useChromebookControl,
  CHROMEBOOK_STATIONS,
  CHROMEBOOK_CONDITIONS,
  HEADPHONE_CONDITIONS,
  OCCURRENCE_TYPES,
  ChromebookPairItem,
  ChromebookItemCondition,
  HeadphoneItemCondition,
  OperationalStatus,
  getStationDefaultLocation
} from '../hooks/useChromebookControl';
import { ChromebookControlSheetTab, ChromebookOrientationsTab } from './ChromebookControlSheet';

interface ChromebookManagementProps {
  user?: any;
  onInventoryChanged?: () => void | Promise<void>;
}

type ActiveSubTab =
  | 'painel'
  | 'cadastro'
  | 'utilizacoes'
  | 'conferencia'
  | 'ocorrencias'
  | 'ficha'
  | 'orientacoes';

const conditionBadgeClass = (cond: string) => {
  switch (cond) {
    case 'ÓTIMO':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'BOM':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'REGULAR':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'COM AVARIA':
    case 'INOPERANTE':
    case 'PÉSSIMO':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'AUSENTE':
      return 'bg-slate-100 text-slate-500 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const formatBrDate = (iso?: string) => {
  if (!iso) return '---';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};

export const ChromebookManagement: React.FC<ChromebookManagementProps> = ({
  user,
  onInventoryChanged
}) => {
  const {
    pairs,
    usages,
    inspections,
    occurrences,
    classrooms,
    students,
    dashboardStats,
    isLoading,
    dedicatedTablesReady,
    refresh,
    savePair,
    saveBatchPairs,
    deletePair,
    syncPairToOfficialInventory,
    syncAllUnsyncedToInventory,
    saveUsage,
    deleteUsage,
    saveInspection,
    deleteInspection,
    saveOccurrence,
    deleteOccurrence,
    importFromExcel,
    exportToExcel
  } = useChromebookControl({ user, onInventoryChanged });

  const [activeTab, setActiveTab] = useState<ActiveSubTab>('painel');
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [cadastroViewMode, setCadastroViewMode] = useState<'grid' | 'table'>('grid');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [inventorySyncFilter, setInventorySyncFilter] = useState<'ALL' | 'SYNCED' | 'UNSYNCED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modais de Cadastro / Lote / QR
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<ChromebookPairItem | null>(null);
  const [mirrorToInventory, setMirrorToInventory] = useState(true);
  const [pairForm, setPairForm] = useState({
    stationId: CHROMEBOOK_STATIONS[0].id,
    stationLocation: CHROMEBOOK_STATIONS[0].defaultLocation,
    positionNumber: 1,
    chromebookNumber: '',
    headphoneNumber: '',
    heritageNumber: '',
    serialNumber: '',
    brand: 'Positivo',
    model: 'Chromebook',
    hasCharger: true,
    chromebookCondition: 'ÓTIMO' as ChromebookItemCondition,
    headphoneCondition: 'ÓTIMO' as HeadphoneItemCondition,
    operationalStatus: 'DISPONIVEL' as OperationalStatus,
    acquisitionYear: String(new Date().getFullYear()),
    acquisitionDocument: '',
    notes: ''
  });

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    stationId: CHROMEBOOK_STATIONS[0].id,
    stationLocation: CHROMEBOOK_STATIONS[0].defaultLocation,
    startPosition: 1,
    quantity: 20,
    cbPrefix: '',
    fonePrefix: '',
    includeHeadphones: true,
    brand: 'Positivo',
    model: 'Chromebook',
    acquisitionYear: String(new Date().getFullYear()),
    acquisitionDocument: '',
    mirrorToInventory: true
  });

  const [qrPair, setQrPair] = useState<ChromebookPairItem | null>(null);

  // Estado da aba Utilizações
  const [usageFilter, setUsageFilter] = useState<'ALL' | 'EM USO' | 'DEVOLVIDO' | 'IRREGULAR'>('ALL');
  const [usageForm, setUsageForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    stationId: CHROMEBOOK_STATIONS[0].id,
    classroomName: '',
    shift: 'MATUTINO' as 'MATUTINO' | 'VESPERTINO' | 'NOTURNO',
    teacherName: user?.name || '',
    studentName: '',
    chromebookNumber: '',
    headphoneNumber: '',
    checkoutTime: new Date().toTimeString().slice(0, 5),
    returnTime: '',
    situation: 'EM USO' as 'EM USO' | 'DEVOLVIDO',
    hasIrregularity: false,
    observations: '',
    studentLeaderSupport: '',
    checkedByTeacher: false
  });

  // Estado da aba Conferência (Vigias)
  const [inspectionForm, setInspectionForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    stationId: CHROMEBOOK_STATIONS[0].id,
    guardName: user?.name || '',
    checkedChromebooks: 0,
    checkedHeadphones: 0,
    compartmentsClosed: true,
    visibleDamage: false,
    observations: ''
  });

  // Estado da aba Ocorrências
  const [occStatusFilter, setOccStatusFilter] = useState<'ALL' | 'PENDENTE' | 'EM ANDAMENTO' | 'CONCLUÍDA'>('ALL');
  const [occForm, setOccForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    stationId: CHROMEBOOK_STATIONS[0].id,
    chromebookNumber: '',
    headphoneNumber: '',
    occurrenceType: OCCURRENCE_TYPES[0],
    description: '',
    reportedTo: 'Direção / Gestão Patrimonial',
    responsiblePerson: '',
    deadline: '',
    status: 'PENDENTE' as 'PENDENTE' | 'EM ANDAMENTO' | 'CONCLUÍDA',
    resolution: '',
    syncAssetCondition: true
  });

  const showNotice = (msg: string) => {
    setFeedbackBanner(msg);
    window.setTimeout(() => setFeedbackBanner(prev => (prev === msg ? null : prev)), 6000);
  };

  // Abrir modal para posição específica ou edição
  const openPairModal = (opts?: { pair?: ChromebookPairItem; stationId?: string; positionNumber?: number }) => {
    if (opts?.pair) {
      const p = opts.pair;
      setEditingPair(p);
      setPairForm({
        stationId: p.stationId,
        stationLocation: p.stationLocation || getStationDefaultLocation(p.stationId),
        positionNumber: p.positionNumber,
        chromebookNumber: p.chromebookNumber,
        headphoneNumber: p.headphoneNumber,
        heritageNumber: p.heritageNumber,
        serialNumber: p.serialNumber,
        brand: p.brand,
        model: p.model,
        hasCharger: p.hasCharger,
        chromebookCondition: p.chromebookCondition,
        headphoneCondition: p.headphoneCondition,
        operationalStatus: p.operationalStatus,
        acquisitionYear: p.acquisitionYear,
        acquisitionDocument: p.acquisitionDocument,
        notes: p.notes
      });
      setMirrorToInventory(true);
    } else {
      const stId = opts?.stationId || (selectedStation !== 'ALL' ? selectedStation : CHROMEBOOK_STATIONS[0].id);
      const stationExisting = pairs.filter(p => p.stationId === stId);
      const nextPos =
        opts?.positionNumber ??
        (() => {
          for (let i = 1; i <= 40; i++) {
            if (!stationExisting.some(p => p.positionNumber === i)) return i;
          }
          return stationExisting.length + 1;
        })();
      const padPos = String(nextPos).padStart(2, '0');
      setEditingPair(null);
      setPairForm({
        stationId: stId,
        stationLocation: getStationDefaultLocation(stId),
        positionNumber: nextPos,
        chromebookNumber: padPos,
        headphoneNumber: padPos,
        heritageNumber: '',
        serialNumber: '',
        brand: 'Positivo',
        model: 'Chromebook',
        hasCharger: true,
        chromebookCondition: 'ÓTIMO',
        headphoneCondition: 'ÓTIMO',
        operationalStatus: 'DISPONIVEL',
        acquisitionYear: String(new Date().getFullYear()),
        acquisitionDocument: '',
        notes: ''
      });
      setMirrorToInventory(true);
    }
    setIsPairModalOpen(true);
  };

  const handleSavePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairForm.chromebookNumber.trim() && !pairForm.headphoneNumber.trim() && !pairForm.heritageNumber.trim()) {
      return alert('Informe ao menos o Nº do Chromebook, o Nº do Fone ou o Nº de Patrimônio/Série.');
    }
    setIsBusy(true);
    try {
      await savePair(
        {
          ...pairForm,
          linkedAssetId: editingPair?.linkedAssetId || null
        },
        editingPair?.id,
        mirrorToInventory
      );
      setIsPairModalOpen(false);
      setEditingPair(null);
      showNotice(
        mirrorToInventory
          ? 'Equipamento salvo no Cadastro de Chromebooks & Fones e espelhado no Inventário Patrimonial!'
          : 'Equipamento salvo no Cadastro de Chromebooks & Fones.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Math.min(60, Math.max(1, Number(batchForm.quantity) || 0));
    const startPos = Math.max(1, Number(batchForm.startPosition) || 1);
    setIsBusy(true);
    try {
      const items: Omit<ChromebookPairItem, 'id'>[] = [];
      for (let i = 0; i < qty; i++) {
        const pos = startPos + i;
        const pad = String(pos).padStart(2, '0');
        // Evita sobrescrever posição já ocupada nessa estação
        const exists = pairs.some(p => p.stationId === batchForm.stationId && p.positionNumber === pos);
        if (exists) continue;
        items.push({
          stationId: batchForm.stationId,
          stationLocation: batchForm.stationLocation || getStationDefaultLocation(batchForm.stationId),
          positionNumber: pos,
          chromebookNumber: `${batchForm.cbPrefix}${pad}`,
          headphoneNumber: batchForm.includeHeadphones ? `${batchForm.fonePrefix}${pad}` : '',
          heritageNumber: '',
          serialNumber: '',
          brand: batchForm.brand,
          model: batchForm.model,
          hasCharger: true,
          chromebookCondition: 'ÓTIMO',
          headphoneCondition: batchForm.includeHeadphones ? 'ÓTIMO' : 'AUSENTE',
          operationalStatus: 'DISPONIVEL',
          acquisitionYear: batchForm.acquisitionYear,
          acquisitionDocument: batchForm.acquisitionDocument,
          notes: `Cadastrado em lote na ${batchForm.stationId}`
        });
      }
      if (items.length === 0) {
        alert('Todas as posições informadas já possuem cadastro nesta estação.');
      } else {
        await saveBatchPairs(items, batchForm.mirrorToInventory);
        showNotice(`${items.length} par(es) cadastrado(s) na ${batchForm.stationId}${batchForm.mirrorToInventory ? ' e espelhados no Inventário Patrimonial!' : '.'}`);
      }
      setIsBatchModalOpen(false);
    } finally {
      setIsBusy(false);
    }
  };

  const handleImportExcelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBusy(true);
    try {
      const res = await importFromExcel(file, true);
      showNotice(
        `Planilha importada: ${res.importedPairs} par(es) no Cadastro (espelhados no Inventário), ${res.importedUsages} utilização(ões), ${res.importedInspections} conferência(s) e ${res.importedOccurrences} ocorrência(s).`
      );
    } catch (err) {
      console.error(err);
      alert('Não foi possível ler a planilha selecionada. Verifique se é um arquivo .xlsx válido.');
    } finally {
      setIsBusy(false);
      e.target.value = '';
    }
  };

  const handleSyncAllInventory = async () => {
    setIsBusy(true);
    try {
      const count = await syncAllUnsyncedToInventory();
      if (count > 0) {
        showNotice(`${count} equipamento(s) sincronizado(s) com o Inventário Patrimonial Oficial!`);
      } else {
        showNotice('Todos os equipamentos cadastrados já estão espelhados no Inventário Patrimonial Oficial.');
      }
    } finally {
      setIsBusy(false);
    }
  };

  // Listas filtradas
  const filteredPairs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return pairs.filter(p => {
      if (selectedStation !== 'ALL' && p.stationId !== selectedStation) return false;
      if (conditionFilter !== 'ALL' && p.chromebookCondition !== conditionFilter && p.headphoneCondition !== conditionFilter) {
        return false;
      }
      if (inventorySyncFilter === 'SYNCED' && !p.linkedAssetId) return false;
      if (inventorySyncFilter === 'UNSYNCED' && p.linkedAssetId) return false;
      if (q) {
        const hay = `${p.stationId} ${p.stationLocation} ${p.chromebookNumber} ${p.headphoneNumber} ${p.heritageNumber} ${p.serialNumber} ${p.brand} ${p.model} ${p.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pairs, selectedStation, conditionFilter, inventorySyncFilter, searchTerm]);

  const studentsOfUsageClass = useMemo(() => {
    if (!usageForm.classroomName) return [];
    return students.filter(s => s.className === usageForm.classroomName);
  }, [students, usageForm.classroomName]);

  const filteredUsages = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return usages.filter(u => {
      if (selectedStation !== 'ALL' && u.stationId !== selectedStation) return false;
      if (usageFilter === 'EM USO' && u.situation !== 'EM USO') return false;
      if (usageFilter === 'DEVOLVIDO' && u.situation !== 'DEVOLVIDO') return false;
      if (usageFilter === 'IRREGULAR' && !u.hasIrregularity) return false;
      if (q) {
        const hay = `${u.studentName} ${u.teacherName} ${u.classroomName} ${u.chromebookNumber} ${u.headphoneNumber} ${u.observations}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [usages, selectedStation, usageFilter, searchTerm]);

  const filteredOccurrences = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return occurrences.filter(o => {
      if (selectedStation !== 'ALL' && o.stationId !== selectedStation) return false;
      if (occStatusFilter !== 'ALL' && o.status !== occStatusFilter) return false;
      if (q) {
        const hay = `${o.stationId} ${o.chromebookNumber} ${o.headphoneNumber} ${o.occurrenceType} ${o.description} ${o.responsiblePerson}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [occurrences, selectedStation, occStatusFilter, searchTerm]);

  // Submissão Utilizações
  const handleSaveUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageForm.classroomName || !usageForm.teacherName.trim() || !usageForm.studentName.trim()) {
      return alert('Preencha Turma, Professor(a) e Estudante.');
    }
    setIsBusy(true);
    try {
      await saveUsage(usageForm);
      setUsageForm(prev => ({
        ...prev,
        studentName: '',
        chromebookNumber: '',
        headphoneNumber: '',
        observations: '',
        hasIrregularity: false
      }));
      showNotice('Registro de utilização salvo com sucesso!');
    } finally {
      setIsBusy(false);
    }
  };

  // Submissão Conferência (Vigia)
  const selectedInspectionStationStats = useMemo(() => {
    return dashboardStats.byStation.find(s => s.id === inspectionForm.stationId) || dashboardStats.byStation[0];
  }, [dashboardStats.byStation, inspectionForm.stationId]);

  const computedInspectionResult = useMemo<'REGULAR' | 'COM PENDÊNCIA' | 'IRREGULAR'>(() => {
    const regCb = selectedInspectionStationStats?.chromebooksCount || 0;
    const regFn = selectedInspectionStationStats?.headphonesCount || 0;
    if (inspectionForm.visibleDamage || !inspectionForm.compartmentsClosed) return 'IRREGULAR';
    if (inspectionForm.checkedChromebooks < regCb || inspectionForm.checkedHeadphones < regFn) return 'COM PENDÊNCIA';
    return 'REGULAR';
  }, [inspectionForm, selectedInspectionStationStats]);

  const handleSaveInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionForm.guardName.trim()) return alert('Informe o nome do vigia/responsável pela conferência.');
    setIsBusy(true);
    try {
      await saveInspection({
        ...inspectionForm,
        registeredChromebooks: selectedInspectionStationStats?.chromebooksCount || 0,
        registeredHeadphones: selectedInspectionStationStats?.headphonesCount || 0,
        result: computedInspectionResult
      });
      setInspectionForm(prev => ({ ...prev, visibleDamage: false, observations: '' }));
      showNotice(`Conferência de guarda da ${inspectionForm.stationId} registrada (${computedInspectionResult})!`);
    } finally {
      setIsBusy(false);
    }
  };

  // Submissão Ocorrências
  const handleSaveOccurrenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occForm.description.trim()) return alert('Descreva objetivamente a irregularidade.');
    setIsBusy(true);
    try {
      await saveOccurrence(
        {
          date: occForm.date,
          stationId: occForm.stationId,
          chromebookNumber: occForm.chromebookNumber,
          headphoneNumber: occForm.headphoneNumber,
          occurrenceType: occForm.occurrenceType,
          description: occForm.description.trim(),
          reportedTo: occForm.reportedTo,
          responsiblePerson: occForm.responsiblePerson,
          deadline: occForm.deadline,
          status: occForm.status,
          resolution: occForm.resolution
        },
        undefined,
        occForm.syncAssetCondition
      );
      setOccForm(prev => ({
        ...prev,
        chromebookNumber: '',
        headphoneNumber: '',
        description: '',
        resolution: ''
      }));
      showNotice('Ocorrência registrada e vinculada ao controle patrimonial da estação!');
    } finally {
      setIsBusy(false);
    }
  };

  const unsyncedCount = useMemo(
    () => pairs.filter(p => !p.linkedAssetId && (p.chromebookNumber.trim() || p.headphoneNumber.trim())).length,
    [pairs]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 w-full min-w-0 font-sans text-slate-800">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImportExcelChange}
        className="hidden"
      />

      {/* BANNER EXECUTIVO COMPACTO */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 p-4 sm:p-5 rounded-3xl text-white shadow-xl relative overflow-hidden border border-blue-900/40 no-print">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-300 uppercase tracking-widest bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-400/25">
                  <Sparkles size={10} /> Operacional + Inventário Patrimonial
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    dedicatedTablesReady
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                      : 'bg-blue-500/15 text-blue-200 border-blue-400/30'
                  }`}
                >
                  <Database size={10} />
                  {dedicatedTablesReady ? 'Supabase Sincronizado (4 Tabelas + Inventário)' : 'Espelhamento Ativo em assets'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
                <Laptop size={22} className="text-blue-400 shrink-0" /> Gestão de Chromebooks & Fones — EECM
              </h2>
              <p className="text-[11px] text-slate-300 font-medium leading-snug">
                Modelo oficial da planilha <strong>Controle_Chromebooks_Fones_EECM_2027_Atualizada</strong> (5 estações, pares Chromebook + Fone, retiradas, vigias, ocorrências, ficha A4 e <strong>Inventário Patrimonial</strong>).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => openPairModal()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-all"
              >
                <Plus size={14} /> Cadastrar Par
              </button>

              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-[11px] font-black uppercase tracking-wider border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Layers size={13} /> Lote
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="px-3 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                title="Importar planilha Controle_Chromebooks_Fones_EECM_2027_Atualizada.xlsx"
              >
                <Upload size={13} /> Importar .xlsx
              </button>

              <button
                type="button"
                onClick={exportToExcel}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                title="Exportar todas as 7 abas em Excel"
              >
                <Download size={13} /> Excel (7 Abas)
              </button>

              {unsyncedCount > 0 && (
                <button
                  type="button"
                  onClick={handleSyncAllInventory}
                  disabled={isBusy}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <ShieldCheck size={13} /> Espelhar ({unsyncedCount})
                </button>
              )}

              <button
                type="button"
                onClick={refresh}
                disabled={isLoading}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                title="Recarregar dados"
              >
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* KPIs CONSOLIDADOS COMPACTOS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-700/60">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Estações</p>
              <p className="text-lg font-black text-white leading-tight">{dashboardStats.stationsCount}</p>
            </div>
            <div className="bg-blue-950/50 px-3 py-2 rounded-xl border border-blue-500/30">
              <p className="text-[9px] font-black text-blue-300 uppercase tracking-wider">Chromebooks</p>
              <p className="text-lg font-black text-blue-300 leading-tight">{dashboardStats.chromebooksRegistered}</p>
            </div>
            <div className="bg-indigo-950/50 px-3 py-2 rounded-xl border border-indigo-500/30">
              <p className="text-[9px] font-black text-indigo-300 uppercase tracking-wider">Fones</p>
              <p className="text-lg font-black text-indigo-300 leading-tight">{dashboardStats.headphonesRegistered}</p>
            </div>
            <div className="bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-500/30">
              <p className="text-[9px] font-black text-emerald-300 uppercase tracking-wider">No Inventário</p>
              <p className="text-lg font-black text-emerald-300 leading-tight">{dashboardStats.mirroredInInventory}</p>
            </div>
            <div className="bg-cyan-950/40 px-3 py-2 rounded-xl border border-cyan-500/30">
              <p className="text-[9px] font-black text-cyan-300 uppercase tracking-wider">Em Uso Aberto</p>
              <p className="text-lg font-black text-cyan-300 leading-tight">{dashboardStats.openUsages}</p>
            </div>
            <div className="bg-amber-950/40 px-3 py-2 rounded-xl border border-amber-500/30">
              <p className="text-[9px] font-black text-amber-300 uppercase tracking-wider">Ocorr. Abertas</p>
              <p className="text-lg font-black text-amber-300 leading-tight">{dashboardStats.occPending + dashboardStats.occInProgress}</p>
            </div>
            <div className="bg-rose-950/40 px-3 py-2 rounded-xl border border-rose-500/30">
              <p className="text-[9px] font-black text-rose-300 uppercase tracking-wider">Com Avaria</p>
              <p className="text-lg font-black text-rose-300 leading-tight">{dashboardStats.defectiveCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BANNER DE FEEDBACK / AVISO DE TABELAS SQL */}
      {feedbackBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between gap-3 no-print">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} /> {feedbackBanner}
          </span>
          <button type="button" onClick={() => setFeedbackBanner(null)} className="text-emerald-600 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {!dedicatedTablesReady && !isLoading && (
        <div className="px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] font-semibold text-amber-900 flex items-center gap-2 no-print">
          <Info size={14} className="text-amber-600 shrink-0" />
          <span>
            Espelhamento na tabela oficial <code>assets</code> ativo na nuvem. Para sincronizar também <em>Utilizações, Vigias e Ocorrências</em> entre computadores, execute <code className="font-mono font-bold">create_chromebooks_fones_tables.sql</code> no Supabase.
          </span>
        </div>
      )}

      {/* NAVEGAÇÃO DAS 7 ABAS (IDÊNTICAS À PLANILHA) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 border-b border-slate-200 pb-3 no-print">
        <div className="flex flex-wrap gap-1">
          {([
            ['painel', 'Painel', Sparkles],
            ['cadastro', `Cadastro (${pairs.length})`, Laptop],
            ['utilizacoes', `Utilizações (${usages.length})`, UserCheck],
            ['conferencia', `Conferência (${inspections.length})`, ClipboardCheck],
            ['ocorrencias', `Ocorrências (${dashboardStats.occPending + dashboardStats.occInProgress})`, Wrench],
            ['ficha', 'Ficha de Controle', FileSpreadsheet],
            ['orientacoes', 'Orientações', BookOpen]
          ] as [ActiveSubTab, string, any][]).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {(activeTab === 'cadastro' || activeTab === 'utilizacoes' || activeTab === 'ocorrencias') && (
          <div className="relative w-full lg:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar nº, patrimônio, estudante..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* ABA 1: PAINEL (DASHBOARD + SITUAÇÃO POR ESTAÇÃO)                      */}
      {/* ===================================================================== */}
      {activeTab === 'painel' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Tabela Situação por Estação (idêntica à aba Painel da planilha) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Situação por Estação de Guarda (01 a 05)
                </h3>
                <p className="text-[11px] font-medium text-slate-500">
                  Comparativo entre Chromebooks cadastrados, Fones cadastrados, diferença entre pares e status no Inventário Patrimonial
                </p>
              </div>
              <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                20 posições opcionais / estação
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Estação</th>
                    <th className="px-4 py-3">Localização</th>
                    <th className="px-4 py-3 text-center text-blue-700">Chromebooks</th>
                    <th className="px-4 py-3 text-center text-indigo-700">Fones</th>
                    <th className="px-4 py-3 text-center text-amber-700">Dif. Pares</th>
                    <th className="px-4 py-3 text-center text-emerald-700">No Inventário</th>
                    <th className="px-4 py-3 text-center text-rose-700">Avarias</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardStats.byStation.map(st => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-black text-slate-900 uppercase">{st.id}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-500">{st.defaultLocation}</td>
                      <td className="px-4 py-3.5 text-center font-black text-blue-700 text-sm">{st.chromebooksCount}</td>
                      <td className="px-4 py-3.5 text-center font-black text-indigo-700 text-sm">{st.headphonesCount}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                            st.pairDiff === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {st.pairDiff}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-700">{st.synced}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`font-black ${st.defects > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {st.defects}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openPairModal({ stationId: st.id })}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                          >
                            + Par
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStation(st.id);
                              setActiveTab('cadastro');
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 transition-all"
                          >
                            Abrir <ArrowRight size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3.5 bg-amber-50/70 border-t border-amber-200/70 text-[11px] font-semibold text-amber-900 space-y-0.5">
              <p>• <strong>Atenção:</strong> a diferença entre pares não comprova extravio; representa apenas cadastros ainda incompletos.</p>
              <p>• <strong>Utilização:</strong> professor confere devolução; líder e vice-líder auxiliam; vigia verifica segurança física da guarda.</p>
            </div>
          </div>

          {/* Resumo de Ocorrências + Utilizações Recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Wrench size={15} className="text-amber-600" /> Resumo de Ocorrências
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('ocorrencias')}
                  className="text-[10px] font-black uppercase text-blue-600 hover:underline"
                >
                  Gerenciar Todas
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="block text-[9px] font-black uppercase text-slate-500">Registradas</span>
                  <span className="text-xl font-black text-slate-900">{dashboardStats.occTotal}</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="block text-[9px] font-black uppercase text-rose-700">Pendentes</span>
                  <span className="text-xl font-black text-rose-700">{dashboardStats.occPending}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="block text-[9px] font-black uppercase text-amber-700">Em Andamento</span>
                  <span className="text-xl font-black text-amber-700">{dashboardStats.occInProgress}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="block text-[9px] font-black uppercase text-emerald-700">Concluídas</span>
                  <span className="text-xl font-black text-emerald-700">{dashboardStats.occDone}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Clock size={15} className="text-blue-600" /> Utilizações em Aberto ({dashboardStats.openUsages})
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('utilizacoes')}
                  className="text-[10px] font-black uppercase text-blue-600 hover:underline"
                >
                  Ir para Utilizações
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {usages
                  .filter(u => u.situation === 'EM USO')
                  .slice(0, 5)
                  .map(u => (
                    <div key={u.id} className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 uppercase truncate">{u.studentName}</p>
                        <p className="text-[10px] text-slate-500 font-bold">
                          {u.stationId} • {u.classroomName} • CB {u.chromebookNumber || '-'} / Fone {u.headphoneNumber || '-'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          saveUsage(
                            {
                              ...u,
                              returnTime: new Date().toTimeString().slice(0, 5),
                              situation: 'DEVOLVIDO',
                              checkedByTeacher: true
                            },
                            u.id
                          )
                        }
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase shrink-0"
                      >
                        Devolver
                      </button>
                    </div>
                  ))}
                {dashboardStats.openUsages === 0 && (
                  <div className="py-6 text-center text-xs font-bold text-slate-400 uppercase">
                    Nenhuma utilização em aberto no momento.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: CADASTRO DOS PARES (CHROMEBOOK + FONE + INVENTÁRIO)            */}
      {/* ===================================================================== */}
      {activeTab === 'cadastro' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Filtros e Alternância Grade vs Tabela */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStation}
                onChange={e => setSelectedStation(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-800 outline-none"
              >
                <option value="ALL">Todas as Estações (01 a 05)</option>
                {CHROMEBOOK_STATIONS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id} ({s.defaultLocation})
                  </option>
                ))}
              </select>

              <select
                value={conditionFilter}
                onChange={e => setConditionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="ALL">Todas as Condições</option>
                {CHROMEBOOK_CONDITIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={inventorySyncFilter}
                onChange={e => setInventorySyncFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="ALL">Patrimônio: Todos</option>
                <option value="SYNCED">Espelhados no Inventário</option>
                <option value="UNSYNCED">Pendentes de Espelhar</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCadastroViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5 transition-all ${
                  cadastroViewMode === 'grid' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                <LayoutGrid size={13} /> Mapa de Posições (1–20)
              </button>
              <button
                type="button"
                onClick={() => setCadastroViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5 transition-all ${
                  cadastroViewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                <List size={13} /> Tabela Patrimonial ({filteredPairs.length})
              </button>
            </div>
          </div>

          {cadastroViewMode === 'grid' ? (
            <div className="space-y-5">
              {dashboardStats.byStation
                .filter(st => selectedStation === 'ALL' || st.id === selectedStation)
                .map(st => {
                  const maxPos = Math.max(st.defaultSlots, ...st.items.map(i => i.positionNumber));
                  const slots = Array.from({ length: maxPos }, (_, i) => i + 1);
                  return (
                    <div key={st.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-sm font-black uppercase text-slate-900">
                            {st.id} <span className="text-slate-400 font-bold">• {st.defaultLocation}</span>
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {st.chromebooksCount} Chromebook(s) • {st.headphonesCount} Fone(s) • {st.synced} no Inventário Patrimonial
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openPairModal({ stationId: st.id })}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1"
                        >
                          <Plus size={12} /> Preencher Posição
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
                        {slots.map(pos => {
                          const item = st.items.find(i => i.positionNumber === pos);
                          if (!item) {
                            return (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => openPairModal({ stationId: st.id, positionNumber: pos })}
                                className="p-2.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-300 text-center transition-all group"
                                title={`Posição ${pos} disponível — clique para cadastrar par real`}
                              >
                                <span className="block text-[9px] font-black text-slate-400 group-hover:text-blue-600 uppercase">
                                  Pos. {String(pos).padStart(2, '0')}
                                </span>
                                <span className="block text-[10px] font-bold text-slate-300 group-hover:text-blue-500 mt-1">
                                  + Vaga
                                </span>
                              </button>
                            );
                          }

                          const hasIssue =
                            item.chromebookCondition === 'COM AVARIA' ||
                            item.chromebookCondition === 'INOPERANTE' ||
                            item.chromebookCondition === 'PÉSSIMO' ||
                            item.headphoneCondition === 'COM AVARIA';

                          return (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => openPairModal({ pair: item })}
                              className={`p-2.5 rounded-2xl border text-left transition-all relative ${
                                hasIssue
                                  ? 'bg-rose-50 border-rose-300 hover:bg-rose-100/80'
                                  : item.operationalStatus === 'EM_USO'
                                    ? 'bg-cyan-50 border-cyan-300 hover:bg-cyan-100/80'
                                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70'
                              }`}
                              title={`Pos. ${pos} | CB: ${item.chromebookNumber || '-'} | Fone: ${item.headphoneNumber || '-'} | Pat: ${item.heritageNumber || 'SRP'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-500 uppercase">
                                  P{String(pos).padStart(2, '0')}
                                </span>
                                {item.linkedAssetId && (
                                  <ShieldCheck size={11} className="text-emerald-600" />
                                )}
                              </div>
                              <div className="mt-1 space-y-0.5">
                                <div className="text-[10px] font-black text-slate-900 flex items-center gap-1 truncate">
                                  <Laptop size={10} className="text-blue-600 shrink-0" />
                                  {item.chromebookNumber || '—'}
                                </div>
                                <div className="text-[10px] font-bold text-indigo-700 flex items-center gap-1 truncate">
                                  <Headphones size={10} className="shrink-0" />
                                  {item.headphoneNumber || '—'}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Estação / Pos.</th>
                      <th className="px-3 py-3 text-center">Nº Chromebook</th>
                      <th className="px-3 py-3 text-center">Nº Fone</th>
                      <th className="px-4 py-3">Patrimônio / Série</th>
                      <th className="px-3 py-3 text-center">Cond. Chromebook</th>
                      <th className="px-3 py-3 text-center">Cond. Fone</th>
                      <th className="px-3 py-3 text-center">Inventário</th>
                      <th className="px-4 py-3">Observações</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPairs.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <span className="font-black text-slate-900 block uppercase">{p.stationId}</span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Posição {String(p.positionNumber).padStart(2, '0')} • {p.stationLocation}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 font-black">
                            {p.chromebookNumber || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 font-black">
                            {p.headphoneNumber || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          <span className="font-black text-slate-900 block">{p.heritageNumber || 'SRP'}</span>
                          {p.serialNumber && <span className="text-[10px] text-slate-500">N/S: {p.serialNumber}</span>}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${conditionBadgeClass(p.chromebookCondition)}`}>
                            {p.chromebookCondition}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${conditionBadgeClass(p.headphoneCondition)}`}>
                            {p.headphoneCondition}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {p.linkedAssetId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                              <ShieldCheck size={11} /> No Inventário
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                const assetId = await syncPairToOfficialInventory(p);
                                if (assetId) {
                                  await savePair({ ...p, linkedAssetId: assetId }, p.id, false);
                                  showNotice('Equipamento espelhado no Inventário Patrimonial!');
                                }
                              }}
                              className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 hover:bg-amber-200 text-amber-800"
                            >
                              Espelhar
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-500 max-w-[180px] truncate" title={p.notes}>
                          {p.notes || '—'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setQrPair(p)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              title="Etiqueta QR Patrimonial"
                            >
                              <QrCode size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openPairModal({ pair: p })}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Editar Par / Patrimônio"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const alsoInv = Boolean(p.linkedAssetId) && window.confirm('Remover também o registro espelhado no Inventário Patrimonial Oficial (tabela assets)?\n\nOK = remover dos dois | Cancelar = remover apenas da gestão de Chromebooks');
                                if (window.confirm(`Confirmar exclusão do par ${p.stationId} Pos. ${p.positionNumber}?`)) {
                                  deletePair(p, alsoInv);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPairs.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-xs">
                          Nenhum Chromebook ou Fone cadastrado para os filtros atuais. Clique em "+ Cadastrar Par" ou "Importar .xlsx".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 3: UTILIZAÇÕES (RETIRADA E DEVOLUÇÃO POR ESTUDANTE)               */}
      {/* ===================================================================== */}
      {activeTab === 'utilizacoes' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-[11px] font-semibold text-indigo-900 flex items-center gap-2">
            <Lock size={14} className="text-indigo-600 shrink-0" />
            <span>
              <strong>Proteção de Dados (LGPD):</strong> acesso restrito à equipe autorizada. Uma linha por estudante e par utilizado — registre a devolução somente após conferência do professor.
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Formulário de Registro de Retirada */}
            <form
              onSubmit={handleSaveUsageSubmit}
              className="xl:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3"
            >
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
                <UserCheck size={15} className="text-blue-600" /> Registrar Retirada / Uso
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={usageForm.date}
                    onChange={e => setUsageForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Estação *</label>
                  <select
                    value={usageForm.stationId}
                    onChange={e => setUsageForm(p => ({ ...p, stationId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    {CHROMEBOOK_STATIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Turma *</label>
                  <select
                    required
                    value={usageForm.classroomName}
                    onChange={e => {
                      const val = e.target.value;
                      const found = classrooms.find(c => c.name === val);
                      setUsageForm(p => ({
                        ...p,
                        classroomName: val,
                        shift: (found?.shift as any) || p.shift,
                        studentName: ''
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="">Selecione...</option>
                    {classrooms.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Turno</label>
                  <select
                    value={usageForm.shift}
                    onChange={e => setUsageForm(p => ({ ...p, shift: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="MATUTINO">MATUTINO</option>
                    <option value="VESPERTINO">VESPERTINO</option>
                    <option value="NOTURNO">NOTURNO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Professor(a) *</label>
                <input
                  type="text"
                  required
                  value={usageForm.teacherName}
                  onChange={e => setUsageForm(p => ({ ...p, teacherName: e.target.value }))}
                  placeholder="Nome do(a) professor(a)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Estudante *</label>
                {studentsOfUsageClass.length > 0 ? (
                  <select
                    required
                    value={usageForm.studentName}
                    onChange={e => setUsageForm(p => ({ ...p, studentName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="">Selecione o estudante...</option>
                    {studentsOfUsageClass.map(s => (
                      <option key={s.code} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={usageForm.studentName}
                    onChange={e => setUsageForm(p => ({ ...p, studentName: e.target.value }))}
                    placeholder="Nome do estudante..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nº Chrome.</label>
                  <input
                    type="text"
                    value={usageForm.chromebookNumber}
                    onChange={e => setUsageForm(p => ({ ...p, chromebookNumber: e.target.value }))}
                    placeholder="Ex: 01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nº Fone</label>
                  <input
                    type="text"
                    value={usageForm.headphoneNumber}
                    onChange={e => setUsageForm(p => ({ ...p, headphoneNumber: e.target.value }))}
                    placeholder="Ex: 01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Retirada</label>
                  <input
                    type="time"
                    value={usageForm.checkoutTime}
                    onChange={e => setUsageForm(p => ({ ...p, checkoutTime: e.target.value }))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Líder / Vice-líder (apoio)</label>
                <input
                  type="text"
                  value={usageForm.studentLeaderSupport}
                  onChange={e => setUsageForm(p => ({ ...p, studentLeaderSupport: e.target.value }))}
                  placeholder="Opcional..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Observações</label>
                <input
                  type="text"
                  value={usageForm.observations}
                  onChange={e => setUsageForm(p => ({ ...p, observations: e.target.value }))}
                  placeholder="Opcional..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
              >
                Registrar Retirada
              </button>
            </form>

            {/* Tabela de Utilizações */}
            <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase text-slate-800">
                  Histórico de Utilizações ({filteredUsages.length})
                </span>
                <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  {(['ALL', 'EM USO', 'DEVOLVIDO', 'IRREGULAR'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setUsageFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                        usageFilter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {f === 'ALL' ? 'Todos' : f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Data / Estação</th>
                      <th className="px-3 py-2.5">Estudante / Turma</th>
                      <th className="px-3 py-2.5 text-center">Par (CB / Fone)</th>
                      <th className="px-3 py-2.5 text-center">Horário</th>
                      <th className="px-3 py-2.5 text-center">Situação</th>
                      <th className="px-3 py-2.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsages.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-700 block">{formatBrDate(u.date)}</span>
                          <span className="text-[10px] font-black text-blue-700">{u.stationId}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-black text-slate-900 uppercase block">{u.studentName}</span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {u.classroomName} ({u.shift}) • Prof. {u.teacherName}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-black">
                          <span className="text-blue-700">CB {u.chromebookNumber || '-'}</span> /{' '}
                          <span className="text-indigo-700">FN {u.headphoneNumber || '-'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-[11px]">
                          {u.checkoutTime || '--:--'} → {u.returnTime || 'em uso'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              u.situation === 'DEVOLVIDO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-cyan-100 text-cyan-800'
                            }`}
                          >
                            {u.situation}
                          </span>
                          {u.hasIrregularity && (
                            <span className="block text-[9px] font-black text-rose-600 mt-0.5">IRREGULAR</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {u.situation === 'EM USO' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const hasIrreg = window.confirm('Houve alguma IRREGULARIDADE na devolução?\n\nOK = SIM (marcar irregularidade) | Cancelar = NÃO (devolução regular)');
                                  saveUsage(
                                    {
                                      ...u,
                                      returnTime: new Date().toTimeString().slice(0, 5),
                                      situation: 'DEVOLVIDO',
                                      hasIrregularity: hasIrreg,
                                      checkedByTeacher: true
                                    },
                                    u.id
                                  );
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase"
                              >
                                Devolver
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Excluir registro de utilização?')) deleteUsage(u.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsages.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-xs font-bold text-slate-400 uppercase">
                          Nenhum registro de utilização encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 4: CONFERÊNCIA DOS VIGIAS (CHECKLIST DE GUARDA — 5 ESTAÇÕES)      */}
      {/* ===================================================================== */}
      {activeTab === 'conferencia' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 animate-in fade-in duration-300">
          <form
            onSubmit={handleSaveInspectionSubmit}
            className="xl:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5"
          >
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
              <ClipboardCheck size={15} className="text-emerald-600" /> Checklist de Guarda (Vigia)
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={inspectionForm.date}
                  onChange={e => setInspectionForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Estação *</label>
                <select
                  value={inspectionForm.stationId}
                  onChange={e => {
                    const stId = e.target.value;
                    const stStats = dashboardStats.byStation.find(s => s.id === stId);
                    setInspectionForm(p => ({
                      ...p,
                      stationId: stId,
                      checkedChromebooks: stStats?.chromebooksCount || 0,
                      checkedHeadphones: stStats?.headphonesCount || 0
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {CHROMEBOOK_STATIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Vigia / Responsável *</label>
              <input
                type="text"
                required
                value={inspectionForm.guardName}
                onChange={e => setInspectionForm(p => ({ ...p, guardName: e.target.value }))}
                placeholder="Nome do vigia..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] flex items-center justify-between">
              <span className="font-bold text-slate-600">Cadastrados na {inspectionForm.stationId}:</span>
              <span className="font-black text-slate-900">
                {selectedInspectionStationStats?.chromebooksCount || 0} CB • {selectedInspectionStationStats?.headphonesCount || 0} Fones
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Chrome. Conferidos</label>
                <input
                  type="number"
                  min={0}
                  value={inspectionForm.checkedChromebooks}
                  onChange={e => setInspectionForm(p => ({ ...p, checkedChromebooks: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Fones Conferidos</label>
                <input
                  type="number"
                  min={0}
                  value={inspectionForm.checkedHeadphones}
                  onChange={e => setInspectionForm(p => ({ ...p, checkedHeadphones: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspectionForm.compartmentsClosed}
                  onChange={e => setInspectionForm(p => ({ ...p, compartmentsClosed: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
                Compartimentos / armário devidamente fechados
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-rose-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspectionForm.visibleDamage}
                  onChange={e => setInspectionForm(p => ({ ...p, visibleDamage: e.target.checked }))}
                  className="rounded text-rose-600"
                />
                Há danos aparentes ou sinais de violação
              </label>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Observações / Comunicação</label>
              <textarea
                rows={2}
                value={inspectionForm.observations}
                onChange={e => setInspectionForm(p => ({ ...p, observations: e.target.value }))}
                placeholder="Descreva qualquer anormalidade observada..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 text-xs font-black">
              <span className="uppercase text-slate-500 text-[10px]">Resultado Automático:</span>
              <span
                className={
                  computedInspectionResult === 'REGULAR'
                    ? 'text-emerald-700'
                    : computedInspectionResult === 'COM PENDÊNCIA'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                }
              >
                {computedInspectionResult}
              </span>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
            >
              Registrar Conferência de Guarda
            </button>
          </form>

          <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-black uppercase text-slate-800">
                Histórico de Conferências de Guarda ({inspections.length})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Data / Estação</th>
                    <th className="px-3 py-2.5">Vigia</th>
                    <th className="px-3 py-2.5 text-center">Chrome (Conf/Cad)</th>
                    <th className="px-3 py-2.5 text-center">Fones (Conf/Cad)</th>
                    <th className="px-3 py-2.5 text-center">Guarda</th>
                    <th className="px-3 py-2.5 text-center">Resultado</th>
                    <th className="px-3 py-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspections.map(ins => (
                    <tr key={ins.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold block">{formatBrDate(ins.date)}</span>
                        <span className="text-[10px] font-black text-blue-700">{ins.stationId}</span>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-800">
                        {ins.guardName}
                        {ins.observations && <span className="block text-[10px] font-normal text-slate-500">{ins.observations}</span>}
                      </td>
                      <td className="px-3 py-3 text-center font-black">
                        {ins.checkedChromebooks} / {ins.registeredChromebooks}
                      </td>
                      <td className="px-3 py-3 text-center font-black">
                        {ins.checkedHeadphones} / {ins.registeredHeadphones}
                      </td>
                      <td className="px-3 py-3 text-center text-[10px] font-bold">
                        {ins.compartmentsClosed ? 'Fechado' : 'Aberto!'} • {ins.visibleDamage ? 'Com dano!' : 'Sem dano'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            ins.result === 'REGULAR'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ins.result === 'COM PENDÊNCIA'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ins.result}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Excluir esta conferência?')) deleteInspection(ins.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {inspections.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-xs font-bold text-slate-400 uppercase">
                        Nenhuma conferência registrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 5: OCORRÊNCIAS / IRREGULARIDADES & MANUTENÇÃO                     */}
      {/* ===================================================================== */}
      {activeTab === 'ocorrencias' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 animate-in fade-in duration-300">
          <form
            onSubmit={handleSaveOccurrenceSubmit}
            className="xl:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3"
          >
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-amber-600" /> Registrar Ocorrência / Avaria
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={occForm.date}
                  onChange={e => setOccForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Estação *</label>
                <select
                  value={occForm.stationId}
                  onChange={e => setOccForm(p => ({ ...p, stationId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {CHROMEBOOK_STATIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nº Chromebook</label>
                <input
                  type="text"
                  value={occForm.chromebookNumber}
                  onChange={e => setOccForm(p => ({ ...p, chromebookNumber: e.target.value }))}
                  placeholder="Ex: 01"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nº Fone</label>
                <input
                  type="text"
                  value={occForm.headphoneNumber}
                  onChange={e => setOccForm(p => ({ ...p, headphoneNumber: e.target.value }))}
                  placeholder="Ex: 01"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Tipo de Ocorrência *</label>
              <select
                value={occForm.occurrenceType}
                onChange={e => setOccForm(p => ({ ...p, occurrenceType: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                {OCCURRENCE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Descrição Objetiva *</label>
              <textarea
                required
                rows={3}
                value={occForm.description}
                onChange={e => setOccForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Descreva o dano, falta ou problema de guarda..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Comunicado a</label>
                <input
                  type="text"
                  value={occForm.reportedTo}
                  onChange={e => setOccForm(p => ({ ...p, reportedTo: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Responsável</label>
                <input
                  type="text"
                  value={occForm.responsiblePerson}
                  onChange={e => setOccForm(p => ({ ...p, responsiblePerson: e.target.value }))}
                  placeholder="Providência..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Prazo</label>
                <input
                  type="date"
                  value={occForm.deadline}
                  onChange={e => setOccForm(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Status</label>
                <select
                  value={occForm.status}
                  onChange={e => setOccForm(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="PENDENTE">PENDENTE</option>
                  <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                  <option value="CONCLUÍDA">CONCLUÍDA</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={occForm.syncAssetCondition}
                onChange={e => setOccForm(p => ({ ...p, syncAssetCondition: e.target.checked }))}
                className="rounded text-amber-600"
              />
              Atualizar condição do equipamento no Cadastro e no Inventário Patrimonial
            </label>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
            >
              Registrar Ocorrência
            </button>
          </form>

          <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase text-slate-800">
                Tratamento de Irregularidades ({filteredOccurrences.length})
              </h4>
              <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
                {(['ALL', 'PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDA'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOccStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                      occStatusFilter === st ? 'bg-amber-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    {st === 'ALL' ? 'Todas' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredOccurrences.map(o => (
                <div key={o.id} className="p-4 hover:bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-500">{formatBrDate(o.date)}</span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-blue-50 text-blue-800">
                        {o.stationId}
                      </span>
                      {o.chromebookNumber && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                          CB {o.chromebookNumber}
                        </span>
                      )}
                      {o.headphoneNumber && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-indigo-50 text-indigo-700">
                          Fone {o.headphoneNumber}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-50 text-rose-700">
                        {o.occurrenceType}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{o.description}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Comunicado: {o.reportedTo || '—'} • Resp.: {o.responsiblePerson || '—'}
                      {o.deadline ? ` • Prazo: ${formatBrDate(o.deadline)}` : ''}
                    </p>
                    {o.resolution && (
                      <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
                        Providência: {o.resolution}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {o.status !== 'CONCLUÍDA' ? (
                      <>
                        {o.status === 'PENDENTE' && (
                          <button
                            type="button"
                            onClick={() => saveOccurrence({ ...o, status: 'EM ANDAMENTO' }, o.id, false)}
                            className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-black uppercase"
                          >
                            Em Andamento
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const resText = window.prompt('Informe a conclusão / providência adotada:', o.resolution || 'Equipamento reparado / regularizado.');
                            if (resText !== null) {
                              saveOccurrence({ ...o, status: 'CONCLUÍDA', resolution: resText }, o.id, true);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> Concluir
                        </button>
                      </>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        Concluída
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Excluir esta ocorrência?')) deleteOccurrence(o.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredOccurrences.length === 0 && (
                <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase">
                  Nenhuma ocorrência registrada para os filtros atuais.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 6: FICHA DE CONTROLE (IMPRIMÍVEL A4)                              */}
      {/* ===================================================================== */}
      {activeTab === 'ficha' && (
        <ChromebookControlSheetTab
          classrooms={classrooms}
          students={students}
          defaultTeacher={user?.name || ''}
        />
      )}

      {/* ===================================================================== */}
      {/* ABA 7: ORIENTAÇÕES OFICIAIS                                           */}
      {/* ===================================================================== */}
      {activeTab === 'orientacoes' && <ChromebookOrientationsTab />}

      {/* ===================================================================== */}
      {/* MODAL: CADASTRAR / EDITAR PAR (CHROMEBOOK + FONE + PATRIMÔNIO)        */}
      {/* ===================================================================== */}
      {isPairModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-xl"><Laptop size={18} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase">
                    {editingPair ? 'Editar Par (Chromebook + Fone)' : 'Cadastrar Par (Chromebook + Fone)'}
                  </h3>
                  <p className="text-[10px] text-slate-300 font-semibold">
                    Campos da planilha EECM 2027 + Controle Patrimonial SEDUC
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setIsPairModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePairSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Estação *</label>
                  <select
                    value={pairForm.stationId}
                    onChange={e =>
                      setPairForm(p => ({
                        ...p,
                        stationId: e.target.value,
                        stationLocation: getStationDefaultLocation(e.target.value)
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase"
                  >
                    {CHROMEBOOK_STATIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Local da Estação</label>
                  <input
                    type="text"
                    value={pairForm.stationLocation}
                    onChange={e => setPairForm(p => ({ ...p, stationLocation: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Posição no Armário *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={pairForm.positionNumber}
                    onChange={e => setPairForm(p => ({ ...p, positionNumber: Number(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-blue-700 block mb-1">Nº Chromebook (etiqueta)</label>
                  <input
                    type="text"
                    value={pairForm.chromebookNumber}
                    onChange={e => setPairForm(p => ({ ...p, chromebookNumber: e.target.value }))}
                    placeholder="Ex: 01 ou CB-01"
                    className="w-full px-3 py-2 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-black uppercase text-blue-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-700 block mb-1">Nº Fone (etiqueta)</label>
                  <input
                    type="text"
                    value={pairForm.headphoneNumber}
                    onChange={e => setPairForm(p => ({ ...p, headphoneNumber: e.target.value }))}
                    placeholder="Ex: 01 ou FN-01 (deixe vazio se não houver)"
                    className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-black uppercase text-indigo-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nº Patrimônio / Tombamento SEDUC</label>
                  <input
                    type="text"
                    value={pairForm.heritageNumber}
                    onChange={e => setPairForm(p => ({ ...p, heritageNumber: e.target.value }))}
                    placeholder="Ex: 123456 ou SRP"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Número de Série (N/S)</label>
                  <input
                    type="text"
                    value={pairForm.serialNumber}
                    onChange={e => setPairForm(p => ({ ...p, serialNumber: e.target.value }))}
                    placeholder="Ex: 4A1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Condição Chromebook</label>
                  <select
                    value={pairForm.chromebookCondition}
                    onChange={e => setPairForm(p => ({ ...p, chromebookCondition: e.target.value as ChromebookItemCondition }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    {CHROMEBOOK_CONDITIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Condição Fone</label>
                  <select
                    value={pairForm.headphoneCondition}
                    onChange={e => setPairForm(p => ({ ...p, headphoneCondition: e.target.value as HeadphoneItemCondition }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    {HEADPHONE_CONDITIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Marca</label>
                  <input
                    type="text"
                    value={pairForm.brand}
                    onChange={e => setPairForm(p => ({ ...p, brand: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Modelo</label>
                  <input
                    type="text"
                    value={pairForm.model}
                    onChange={e => setPairForm(p => ({ ...p, model: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Ano Aquisição</label>
                  <input
                    type="text"
                    value={pairForm.acquisitionYear}
                    onChange={e => setPairForm(p => ({ ...p, acquisitionYear: e.target.value }))}
                    placeholder="2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Doc. / NF / Termo</label>
                  <input
                    type="text"
                    value={pairForm.acquisitionDocument}
                    onChange={e => setPairForm(p => ({ ...p, acquisitionDocument: e.target.value }))}
                    placeholder="SEDUC / NF"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pairForm.hasCharger}
                    onChange={e => setPairForm(p => ({ ...p, hasCharger: e.target.checked }))}
                    className="rounded text-blue-600"
                  />
                  Possui Carregador Original
                </label>

                <label className="flex items-center gap-2 text-xs font-black text-emerald-700 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={mirrorToInventory}
                    onChange={e => setMirrorToInventory(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  Espelhar no Inventário Patrimonial Oficial (assets)
                </label>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={pairForm.notes}
                  onChange={e => setPairForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Observações sobre o Chromebook, fone ou tombamento..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPairModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase shadow-md"
                >
                  {isBusy ? 'Salvando...' : editingPair ? 'Salvar Alterações' : 'Cadastrar Par'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CADASTRAR EM LOTE                                              */}
      {/* ===================================================================== */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 no-print">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-black uppercase flex items-center gap-2">
                <Layers size={16} className="text-blue-400" /> Cadastrar Lote de Pares na Estação
              </h3>
              <button type="button" onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveBatchSubmit} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Estação</label>
                  <select
                    value={batchForm.stationId}
                    onChange={e =>
                      setBatchForm(p => ({
                        ...p,
                        stationId: e.target.value,
                        stationLocation: getStationDefaultLocation(e.target.value)
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black"
                  >
                    {CHROMEBOOK_STATIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Quantidade Real</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={batchForm.quantity}
                    onChange={e => setBatchForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Pos. Inicial</label>
                  <input
                    type="number"
                    min={1}
                    value={batchForm.startPosition}
                    onChange={e => setBatchForm(p => ({ ...p, startPosition: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Prefixo CB</label>
                  <input
                    type="text"
                    value={batchForm.cbPrefix}
                    onChange={e => setBatchForm(p => ({ ...p, cbPrefix: e.target.value }))}
                    placeholder="Ex: CB-"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Prefixo Fone</label>
                  <input
                    type="text"
                    value={batchForm.fonePrefix}
                    onChange={e => setBatchForm(p => ({ ...p, fonePrefix: e.target.value }))}
                    placeholder="Ex: FN-"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchForm.includeHeadphones}
                    onChange={e => setBatchForm(p => ({ ...p, includeHeadphones: e.target.checked }))}
                    className="rounded text-indigo-600"
                  />
                  Incluir Fone de Ouvido em par com cada Chromebook
                </label>
                <label className="flex items-center gap-2 text-xs font-black text-emerald-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchForm.mirrorToInventory}
                    onChange={e => setBatchForm(p => ({ ...p, mirrorToInventory: e.target.checked }))}
                    className="rounded text-emerald-600"
                  />
                  Espelhar lote no Inventário Patrimonial Oficial (assets)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-black uppercase text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase"
                >
                  {isBusy ? 'Gerando...' : 'Gerar Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ETIQUETA PATRIMONIAL / QR CODE                                 */}
      {/* ===================================================================== */}
      {qrPair && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between no-print">
              <span className="text-[10px] font-black uppercase text-slate-400">Etiqueta Patrimonial EECM</span>
              <button type="button" onClick={() => setQrPair(null)} className="text-slate-400 hover:text-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-2 border-slate-900 rounded-2xl space-y-2.5 bg-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                EECM ANDRÉ ANTÔNIO MAGGI
              </p>
              <div className="flex justify-center py-1">
                <QRCodeSVG
                  value={`EECM-PATRIMONIO|${qrPair.stationId}|POS:${qrPair.positionNumber}|CB:${qrPair.chromebookNumber}|FONE:${qrPair.headphoneNumber}|PAT:${qrPair.heritageNumber || 'SRP'}|NS:${qrPair.serialNumber || '-'}`}
                  size={152}
                />
              </div>
              <div className="text-xs font-black text-slate-900 uppercase">
                {qrPair.stationId} • Posição {String(qrPair.positionNumber).padStart(2, '0')}
              </div>
              <div className="flex justify-center gap-2 text-[11px] font-black">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">CB {qrPair.chromebookNumber || '—'}</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">Fone {qrPair.headphoneNumber || '—'}</span>
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-600">
                Patrimônio: {qrPair.heritageNumber || 'SRP'} {qrPair.serialNumber ? `• N/S: ${qrPair.serialNumber}` : ''}
              </div>
            </div>

            <div className="flex gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5"
              >
                <Printer size={14} /> Imprimir Etiqueta
              </button>
              <button
                type="button"
                onClick={() => setQrPair(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChromebookManagement;
