import React, { useState, useEffect, useMemo } from 'react';
import {
  Monitor,
  ArrowLeft,
  Plus,
  Search,
  History,
  FileDown,
  Camera,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  X,
  Image as ImageIcon,
  MapPin,
  ClipboardList,
  QrCode,
  Download,
  Maximize,
  Edit2,
  Calendar,
  Users,
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Check,
  Table2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Asset, AssetCondition } from '../types';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Phase {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO';
  weight: number;
  tasks: Task[];
}

interface CommissionMembers {
  president: { name: string; role: string; register: string };
  secretary: { name: string; role: string; register: string };
  member: { name: string; role: string; register: string };
}

interface InventorySchedule {
  id?: string;
  year: number;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  commissionMembers: CommissionMembers;
  phases: Phase[];
}

const defaultPhases = (year: number): Phase[] => [
  {
    id: 1,
    name: 'Fase I: Planejamento e Portaria da Comissão',
    startDate: `${year}-10-01`,
    endDate: `${year}-10-15`,
    status: 'EM_ANDAMENTO',
    weight: 15,
    tasks: [
      { id: '1_1', title: 'Designação da comissão inventariante por portaria', completed: false },
      { id: '1_2', title: 'Definição do calendário e cronograma detalhado de varredura', completed: false },
      { id: '1_3', title: 'Publicação da Portaria no mural ou Diário Oficial', completed: false }
    ]
  },
  {
    id: 2,
    name: 'Fase II: Levantamento Físico e Varredura',
    startDate: `${year}-10-16`,
    endDate: `${year}-11-15`,
    status: 'PENDENTE',
    weight: 30,
    tasks: [
      { id: '2_1', title: 'Vistoria in loco e contagem física dos bens permanentes', completed: false },
      { id: '2_2', title: 'Colagem de etiquetas de identificação e novos QR Codes', completed: false },
      { id: '2_3', title: 'Identificação e catalogação do estado de conservação dos bens', completed: false }
    ]
  },
  {
    id: 3,
    name: 'Fase III: Conciliação Patrimonial e Cargas',
    startDate: `${year}-11-16`,
    endDate: `${year}-11-30`,
    status: 'PENDENTE',
    weight: 20,
    tasks: [
      { id: '3_1', title: 'Confronto entre inventário físico e os dados do sistema', completed: false },
      { id: '3_2', title: 'Elaboração de lista de bens não localizados ou sobressalentes', completed: false },
      { id: '3_3', title: 'Emissão e assinatura de Termos de Responsabilidade atualizados', completed: false }
    ]
  },
  {
    id: 4,
    name: 'Fase IV: Saneamento e Regularização',
    startDate: `${year}-12-01`,
    endDate: `${year}-12-10`,
    status: 'PENDENTE',
    weight: 20,
    tasks: [
      { id: '4_1', title: 'Processamento de termos de transferência interna de bens', completed: false },
      { id: '4_2', title: 'Abertura de laudo de inservibilidade para itens em estado péssimo', completed: false },
      { id: '4_3', title: 'Regularização e acerto das divergências patrimoniais', completed: false }
    ]
  },
  {
    id: 5,
    name: 'Fase V: Encerramento e Homologação',
    startDate: `${year}-12-11`,
    endDate: `${year}-12-20`,
    status: 'PENDENTE',
    weight: 15,
    tasks: [
      { id: '5_1', title: 'Elaboração da minuta do Relatório Final Circunstanciado', completed: false },
      { id: '5_2', title: 'Assinatura do relatório pela comissão inventariante', completed: false },
      { id: '5_3', title: 'Envio formal à DRE e arquivamento do processo de inventário', completed: false }
    ]
  }
];

const defaultSchedule = (year: number): InventorySchedule => ({
  year,
  title: `Inventário de Bens Móveis e Imóveis - Exercício ${year}`,
  startDate: `${year}-10-01`,
  endDate: `${year}-12-20`,
  status: 'PLANEJAMENTO',
  commissionMembers: {
    president: { name: '', role: '', register: '' },
    secretary: { name: '', role: '', register: '' },
    member: { name: '', role: '', register: '' }
  },
  phases: defaultPhases(year)
});

interface AssetInventoryModuleProps {
  user?: any;
  onExit: () => void;
}

import { supabase } from '../supabaseClient';

const AssetInventoryModule: React.FC<AssetInventoryModuleProps> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'ambientes' | 'relatorios' | 'cronograma'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<Asset | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  // Estados do Cronograma de Inventário Anual
  const [schedule, setSchedule] = useState<InventorySchedule>(defaultSchedule(new Date().getFullYear()));
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [expandedPhaseId, setExpandedPhaseId] = useState<number | null>(1);
  const [selectedDocument, setSelectedDocument] = useState<'portaria' | 'abertura' | 'relatorio' | 'encerramento' | 'cronograma_seduc' | null>(null);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [seducActions, setSeducActions] = useState<Array<{ id: number; date: string; action: string; situation: string }>>([]);
  const [commissionForm, setCommissionForm] = useState<CommissionMembers>({
    president: { name: '', role: '', register: '' },
    secretary: { name: '', role: '', register: '' },
    member: { name: '', role: '', register: '' }
  });

  const fetchSchedule = async () => {
    setIsLoadingSchedule(true);
    const currentYear = new Date().getFullYear();
    try {
      const { data, error } = await supabase
        .from('asset_inventory_schedules')
        .select('*')
        .eq('year', currentYear)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const loadedSchedule: InventorySchedule = {
          id: data.id,
          year: data.year,
          title: data.title,
          startDate: data.start_date,
          endDate: data.end_date,
          status: data.status,
          commissionMembers: data.commission_members,
          phases: data.phases
        };
        setSchedule(loadedSchedule);
        setCommissionForm(loadedSchedule.commissionMembers);
      } else {
        const local = localStorage.getItem(`inventory_schedule_${currentYear}`);
        if (local) {
          const parsed = JSON.parse(local);
          setSchedule(parsed);
          setCommissionForm(parsed.commissionMembers);
        } else {
          const initial = defaultSchedule(currentYear);
          setSchedule(initial);
          setCommissionForm(initial.commissionMembers);
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar cronograma no Supabase (usando localStorage como fallback):", e);
      const local = localStorage.getItem(`inventory_schedule_${currentYear}`);
      if (local) {
        const parsed = JSON.parse(local);
        setSchedule(parsed);
        setCommissionForm(parsed.commissionMembers);
      } else {
        const initial = defaultSchedule(currentYear);
        setSchedule(initial);
        setCommissionForm(initial.commissionMembers);
      }
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const saveSchedule = async (updatedSchedule: InventorySchedule) => {
    const currentYear = updatedSchedule.year;
    try {
      localStorage.setItem(`inventory_schedule_${currentYear}`, JSON.stringify(updatedSchedule));
      
      const payload = {
        year: updatedSchedule.year,
        title: updatedSchedule.title,
        start_date: updatedSchedule.startDate,
        end_date: updatedSchedule.endDate,
        status: updatedSchedule.status,
        commission_members: updatedSchedule.commissionMembers,
        phases: updatedSchedule.phases,
        updated_at: new Date().toISOString()
      };

      if (updatedSchedule.id) {
        const { error } = await supabase
          .from('asset_inventory_schedules')
          .update(payload)
          .eq('id', updatedSchedule.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('asset_inventory_schedules')
          .insert([payload])
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setSchedule(prev => ({ ...prev, id: data.id }));
        }
      }
    } catch (e) {
      console.warn("Erro ao salvar cronograma no Supabase (salvo localmente no navegador):", e);
    }
  };

  const getSeducActionSituation = (id: number, currentSchedule: InventorySchedule) => {
    const getPhaseProgress = (phaseId: number) => {
      const phase = currentSchedule.phases.find(p => p.id === phaseId);
      if (!phase) return 0;
      const done = phase.tasks.filter(t => t.completed).length;
      return phase.tasks.length > 0 ? (done / phase.tasks.length) * 100 : 0;
    };

    const isTaskDone = (phaseId: number, taskId: string) => {
      const phase = currentSchedule.phases.find(p => p.id === phaseId);
      const task = phase?.tasks.find(t => t.id === taskId);
      return task ? task.completed : false;
    };

    switch (id) {
      case 1:
        return isTaskDone(1, '1_1') || isTaskDone(1, '1_3') ? 'CONCLUÍDO' : 'PENDENTE';
      case 2:
        return currentSchedule.commissionMembers.president.name ? 'CONCLUÍDO' : 'PENDENTE';
      case 3:
        return isTaskDone(3, '3_1') ? 'CONCLUÍDO' : 'PENDENTE';
      case 4: {
        const prog = getPhaseProgress(2);
        return prog === 100 ? 'CONCLUÍDO' : prog > 0 ? 'EM ANDAMENTO' : 'PENDENTE';
      }
      case 5: {
        const prog = getPhaseProgress(3);
        return prog === 100 ? 'CONCLUÍDO' : prog > 0 ? 'EM ANDAMENTO' : 'PENDENTE';
      }
      case 6:
        return isTaskDone(5, '5_1') || isTaskDone(5, '5_2') ? 'CONCLUÍDO' : 'PENDENTE';
      case 7:
        return isTaskDone(5, '5_3') ? 'CONCLUÍDO' : 'PENDENTE';
      case 8:
        return isTaskDone(4, '4_2') ? 'CONCLUÍDO' : 'PENDENTE';
      case 9:
        return isTaskDone(4, '4_3') ? 'CONCLUÍDO' : 'PENDENTE';
      default:
        return 'PENDENTE';
    }
  };

  useEffect(() => {
    if (selectedDocument === 'cronograma_seduc') {
      const year = schedule.year;
      setSeducActions([
        { id: 1, date: `01/10/${year}`, action: 'Ata de Abertura de Inventário Anual de Bens Móveis e Imóveis', situation: getSeducActionSituation(1, schedule) },
        { id: 2, date: `05/10/${year}`, action: 'Formação/ substituição de membros da Subcomissão local (se necessário)', situation: getSeducActionSituation(2, schedule) },
        { id: 3, date: `15/10/${year}`, action: 'Verificação se todas Notas Fiscais foram enviadas para tombamento (Bens móveis)', situation: getSeducActionSituation(3, schedule) },
        { id: 4, date: `16/10/${year} a 15/11/${year}`, action: 'Levantamento físico dos bens móveis e Preenchimento da ficha de levantamento cadastral de imóveis', situation: getSeducActionSituation(4, schedule) },
        { id: 5, date: `16/11/${year} a 30/11/${year}`, action: 'Período de ajuste patrimonial pela subcomissão Local', situation: getSeducActionSituation(5, schedule) },
        { id: 6, date: `11/12/${year}`, action: 'Elaboração de relatório final e ata de encerramento', situation: getSeducActionSituation(6, schedule) },
        { id: 7, date: `20/12/${year}`, action: 'Tramitar o processo de Inventário a DRE', situation: getSeducActionSituation(7, schedule) },
        { id: 8, date: `01/12/${year} a 10/12/${year}`, action: 'Elaboração da lista de classificação bens móveis inservíveis', situation: getSeducActionSituation(8, schedule) },
        { id: 9, date: `10/12/${year}`, action: 'Tramitar o processo de desfazimento a DRE', situation: getSeducActionSituation(9, schedule) }
      ]);
    }
  }, [selectedDocument, schedule]);

  // Filtros do Submódulo de Relatório
  const [reportLocation, setReportLocation] = useState('');
  const [reportCondition, setReportCondition] = useState('');
  const [reportYear, setReportYear] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [reportType, setReportType] = useState<'padrao' | 'levantamento'>('padrao');

  const isSemRp = (heritageNumber: string) => {
    const clean = (heritageNumber || '').toUpperCase().trim();
    return !clean || clean === 'S/N' || clean === 'SEM NÚMERO' || clean === 'SEM NUMERO' || clean === 'SEM PATRIMONIO' || clean === 'SEM PATRIMÔNIO';
  };

  const getSitFisica = (cond: string, isUnserviceable: boolean) => {
    if (isUnserviceable) return 'PE';
    switch (cond) {
      case 'EXCELENTE': return 'OT';
      case 'BOM': return 'BO';
      case 'REGULAR': return 'RU';
      case 'PÉSSIMO': return 'PE';
      default: return 'BO';
    }
  };

  const [headerUG, setHeaderUG] = useState('SEDUC/MT');
  const [headerCodUG, setHeaderCodUG] = useState('14101');
  const [headerUA, setHeaderUA] = useState('E.E. ANDRÉ ANTONIO MAGGI');
  const [headerCodUA, setHeaderCodUA] = useState('');
  const [headerMunicipio, setHeaderMunicipio] = useState('LUCAS DO RIO VERDE');
  const [headerCodUL, setHeaderCodUL] = useState('');
  const [headerResponsavel, setHeaderResponsavel] = useState(user?.name ? user.name.toUpperCase() : 'GESTOR DO SISTEMA');
  const [headerMatricula, setHeaderMatricula] = useState('');
  const [headerCPF, setHeaderCPF] = useState('');
  const [includeCover, setIncludeCover] = useState(true);
  const [coverTitle, setCoverTitle] = useState('INVENTÁRIO ANUAL DE BENS MÓVEIS');
  const [coverSubtitle, setCoverSubtitle] = useState('Secretaria de Estado de Educação - SEDUC/MT');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includePresentation, setIncludePresentation] = useState(true);
  const [headerDataInicio, setHeaderDataInicio] = useState('16/10/' + new Date().getFullYear());
  const [headerPortaria, setHeaderPortaria] = useState('657/GS/SEDUC/MT');
  const [includeResponsibility, setIncludeResponsibility] = useState(true);
  const [headerResponsibilityOriginalPortaria, setHeaderResponsibilityOriginalPortaria] = useState('569/2022');
  const [headerResponsibilityAlterationPortaria, setHeaderResponsibilityAlterationPortaria] = useState('657/2024');
  const [headerResponsibilityNormativeInstruction, setHeaderResponsibilityNormativeInstruction] = useState('05/2017');
  const [headerDirectorName, setHeaderDirectorName] = useState('');
  const [headerDirectorRegister, setHeaderDirectorRegister] = useState('');

  const [includeAbertura, setIncludeAbertura] = useState(true);
  const [includeMetodologia, setIncludeMetodologia] = useState(true);
  const [includeRelatorio, setIncludeRelatorio] = useState(true);
  const [includeFoto, setIncludeFoto] = useState(true);
  const [includeEncerramento, setIncludeEncerramento] = useState(true);

  const [headerAberturaAtaDataTexto, setHeaderAberturaAtaDataTexto] = useState('14 (quatorze) dias do mês de dezembro');
  const [headerAberturaAtaAno, setHeaderAberturaAtaAno] = useState(new Date().getFullYear().toString());
  const [headerAberturaColegiadoData, setHeaderAberturaColegiadoData] = useState('14/12/' + new Date().getFullYear());

  const [headerRelatorioPeriodo, setHeaderRelatorioPeriodo] = useState('16/10/' + new Date().getFullYear() + ' a 15/11/' + new Date().getFullYear());
  const [headerSchoolEmail, setHeaderSchoolEmail] = useState('ESCOLA@edu.mt.gov.br');
  const [headerSchoolPhone, setHeaderSchoolPhone] = useState('(XX) 0000-0000');
  const [headerRelatorioData, setHeaderRelatorioData] = useState('LUCAS DO RIO VERDE - MT, 15 de novembro de ' + new Date().getFullYear());
  const [headerComissaoNumero, setHeaderComissaoNumero] = useState('01/' + new Date().getFullYear());

  const [headerEncerramentoAtaDataTexto, setHeaderEncerramentoAtaDataTexto] = useState('dois dias do mês de Julho do ano dois mil e vinte cinco');
  const [headerEncerramentoAtaAno, setHeaderEncerramentoAtaAno] = useState(new Date().getFullYear().toString());
  const [headerEncerramentoData, setHeaderEncerramentoData] = useState('LUCAS DO RIO VERDE - MT, 02 de julho de ' + new Date().getFullYear());

  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState<Omit<Asset, 'id' | 'timestamp' | 'history' | 'isUnserviceable'>>({
    description: '',
    location: '',
    heritageNumber: '',
    condition: 'BOM',
    photo: '',
    acquisitionDocument: '',
    acquisitionYear: '',
  });

  const [unserviceableForm, setUnserviceableForm] = useState({
    reason: '',
    responsible: user?.name ? `GESTOR ${user.name.toUpperCase()}` : 'GESTOR'
  });

  useEffect(() => {
    if (user?.name) {
      setUnserviceableForm(prev => ({
        ...prev,
        responsible: `GESTOR ${user.name.toUpperCase()}`
      }));
      setHeaderResponsavel(user.name.toUpperCase());
    }
  }, [user]);

  useEffect(() => {
    if (schedule.year) {
      setHeaderDataInicio('16/10/' + schedule.year);
      setHeaderAberturaAtaAno(schedule.year.toString());
      setHeaderAberturaColegiadoData(`14/12/${schedule.year}`);
      setHeaderRelatorioPeriodo(`16/10/${schedule.year} a 15/11/${schedule.year}`);
      setHeaderRelatorioData(`LUCAS DO RIO VERDE - MT, 15 de novembro de ${schedule.year}`);
      setHeaderComissaoNumero(`01/${schedule.year}`);
      setHeaderEncerramentoAtaAno(schedule.year.toString());
      setHeaderEncerramentoData(`LUCAS DO RIO VERDE - MT, 02 de julho de ${schedule.year}`);
    }
  }, [schedule.year]);

  const fetchAssets = async () => {
    try {
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      // Fetch histories for all assets (optimization: could happen on demand or with join if not too many)
      const { data: historyData, error: historyError } = await supabase
        .from('asset_history')
        .select('*');

      if (historyError) throw historyError;

      if (assetsData) {
        setAssets(assetsData.map(a => ({
          id: a.id,
          description: a.description,
          location: a.location,
          heritageNumber: a.heritage_number,
          condition: a.condition as any,
          isUnserviceable: a.is_unserviceable,
          photo: a.photo,
          unserviceableData: a.unserviceable_data,
          acquisitionDocument: a.acquisition_document,
          acquisitionYear: a.acquisition_year,
          history: historyData?.filter(h => h.asset_id === a.id).map(h => ({
            id: h.id,
            date: h.date,
            action: h.action,
            responsible: h.responsible,
            notes: h.notes
          })) || [],
          timestamp: new Date(a.created_at).getTime()
        })));
      }
    } catch (error) {
      console.error("Erro ao buscar patrimônio:", error);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchSchedule();
    const sub = supabase.channel('assets_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, fetchAssets).subscribe();

    // Ler filtros de QR Code passados pela URL/App
    try {
      const qrLoc = localStorage.getItem('qr_location_filter');
      const qrPat = localStorage.getItem('qr_patrimonio_filter');
      if (qrLoc) {
        setLocationFilter(qrLoc);
        setActiveTab('inventory');
        localStorage.removeItem('qr_location_filter');
      }
      if (qrPat) {
        setSearchTerm(qrPat);
        setActiveTab('inventory');
        localStorage.removeItem('qr_patrimonio_filter');
      }
    } catch (e) {
      console.error("Erro ao carregar filtros do QR Code:", e);
    }

    return () => { sub.unsubscribe(); };
  }, []);

  const uniqueLocations = useMemo(() => {
    const locs = assets.map(a => a.location);
    return Array.from(new Set(locs)).sort();
  }, [assets]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setForm(prev => ({ ...prev, photo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartEdit = (asset: Asset) => {
    setEditingAssetId(asset.id);
    setForm({
      description: asset.description,
      location: asset.location,
      heritageNumber: asset.heritageNumber,
      condition: asset.condition,
      photo: asset.photo || '',
      acquisitionDocument: asset.acquisitionDocument || '',
      acquisitionYear: asset.acquisitionYear || '',
    });
    setImagePreview(asset.photo || null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAssetId && assets.some(a => a.heritageNumber === form.heritageNumber)) {
      return alert("Erro: Número de patrimônio já cadastrado.");
    }
    if (editingAssetId && assets.some(a => a.heritageNumber === form.heritageNumber && a.id !== editingAssetId)) {
      return alert("Erro: Número de patrimônio já cadastrado em outro bem.");
    }

    const isPessimo = form.condition === 'PÉSSIMO';

    try {
      if (editingAssetId) {
        // 1. Update Asset
        const { error: assetError } = await supabase
          .from('assets')
          .update({
            description: form.description.toUpperCase(),
            location: form.location.toUpperCase(),
            heritage_number: form.heritageNumber,
            condition: form.condition,
            is_unserviceable: isPessimo,
            photo: form.photo,
            unserviceable_data: isPessimo ? {
              date: new Date().toISOString().split('T')[0],
              ...unserviceableForm
            } : null,
            acquisition_document: form.acquisitionDocument?.toUpperCase() || null,
            acquisition_year: form.acquisitionYear || null
          })
          .eq('id', editingAssetId);

        if (assetError) throw assetError;

        // 2. Insert History for Update
        const { error: historyError } = await supabase
          .from('asset_history')
          .insert([{
            asset_id: editingAssetId,
            date: new Date().toISOString().split('T')[0],
            action: 'ATUALIZAÇÃO DE CADASTRO',
            responsible: user?.name ? `GESTOR ${user.name.toUpperCase()}` : 'GESTOR',
            notes: `Cadastro atualizado no inventário. Estado: ${form.condition}`
          }]);

        if (historyError) throw historyError;

      } else {
        // 1. Insert Asset
        const { data: newAsset, error: assetError } = await supabase
          .from('assets')
          .insert([{
            description: form.description.toUpperCase(),
            location: form.location.toUpperCase(),
            heritage_number: form.heritageNumber,
            condition: form.condition,
            is_unserviceable: isPessimo,
            photo: form.photo,
            unserviceable_data: isPessimo ? {
              date: new Date().toISOString().split('T')[0],
              ...unserviceableForm
            } : null,
            acquisition_document: form.acquisitionDocument?.toUpperCase() || null,
            acquisition_year: form.acquisitionYear || null
          }])
          .select()
          .single();

        if (assetError) throw assetError;

        // 2. Insert History for Creation
        const { error: historyError } = await supabase
          .from('asset_history')
          .insert([{
            asset_id: newAsset.id,
            date: new Date().toISOString().split('T')[0],
            action: isPessimo ? 'CADASTRO COMO INSERVÍVEL' : 'CADASTRO INICIAL',
            responsible: user?.name ? `GESTOR ${user.name.toUpperCase()}` : 'GESTOR',
            notes: isPessimo ? `Motivo: ${unserviceableForm.reason}` : 'Inclusão manual no inventário'
          }]);

        if (historyError) throw historyError;
      }

      await fetchAssets();
      setIsModalOpen(false);
      resetForm();
      alert(editingAssetId ? "Bem patrimonial atualizado com sucesso!" : "Bem patrimonial salvo com sucesso!");

    } catch (error) {
      console.error("Erro ao salvar bem:", error);
      alert("Erro ao salvar bem patrimonial.");
    }
  };

  const resetForm = () => {
    setForm({ description: '', location: '', heritageNumber: '', condition: 'BOM', photo: '', acquisitionDocument: '', acquisitionYear: '' });
    setEditingAssetId(null);
    setUnserviceableForm({ reason: '', responsible: user?.name ? `GESTOR ${user.name.toUpperCase()}` : 'GESTOR' });
    setImagePreview(null);
  };

  const deleteAsset = async (id: string) => {
    if (window.confirm("Deseja remover este bem do inventário?")) {
      try {
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) throw error;
        await fetchAssets();
        alert("Bem removido com sucesso!");
      } catch (error) {
        console.error("Erro ao remover bem:", error);
        alert("Erro ao remover bem.");
      }
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.heritageNumber.includes(searchTerm) ||
        a.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLocation = locationFilter ? a.location === locationFilter : true;
      return matchSearch && matchLocation;
    });
  }, [assets, searchTerm, locationFilter]);

  const reportAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = reportSearch ? (
        a.description.toLowerCase().includes(reportSearch.toLowerCase()) ||
        a.heritageNumber.includes(reportSearch)
      ) : true;
      const matchLocation = reportLocation ? a.location === reportLocation : true;
      const matchCondition = reportCondition ? (
        reportCondition === 'PÉSSIMO' ? a.isUnserviceable : (a.condition === reportCondition && !a.isUnserviceable)
      ) : true;
      const matchYear = reportYear ? a.acquisitionYear === reportYear : true;
      return matchSearch && matchLocation && matchCondition && matchYear;
    });
  }, [assets, reportSearch, reportLocation, reportCondition, reportYear]);

  const getConditionColor = (cond: AssetCondition) => {
    switch (cond) {
      case 'EXCELENTE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'BOM': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'REGULAR': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PÉSSIMO': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const handleExportPDF = async (elementId: string = 'inventory-list', filename: string = 'Inventario') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // @ts-ignore
    await window.html2pdf().set({
      margin: 10,
      filename: `${filename}_${new Date().getFullYear()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(element).save();
  };

  const handleExportPortraitPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // @ts-ignore
    await window.html2pdf().set({
      margin: 15,
      filename: `${filename}_${new Date().getFullYear()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save();
  };

  const downloadQRCode = (location: string) => {
    const svg = document.getElementById(`qr-${location}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `Etiqueta_QR_${location}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const getPortariaText = () => {
    const p = schedule.commissionMembers.president;
    const s = schedule.commissionMembers.secretary;
    const m = schedule.commissionMembers.member;
    return (
      <div className="space-y-6 text-sm text-justify leading-relaxed text-black font-serif">
        <div className="text-center font-bold">
          <p className="text-base uppercase">Portaria de Designação nº 0{schedule.year % 100}/{schedule.year} - EEAM</p>
          <p className="text-[10px] text-gray-500 font-sans normal-case font-medium mt-1">Institui a Comissão Especial de Inventário Patrimonial para o Exercício de {schedule.year}.</p>
        </div>

        <p className="mt-6">
          O Gestor Escolar da <strong>Escola Estadual André Antonio Maggi</strong>, no uso de suas atribuições legais e em conformidade com o Decreto Estadual nº 194/2015 e a Instrução Normativa nº 03/2015/SEGES-MT, que disciplinam os procedimentos relativos à gestão e inventário de bens móveis e imóveis das unidades do Poder Executivo de Mato Grosso,
        </p>

        <p className="font-bold">RESOLVE:</p>

        <p>
          <strong>Art. 1º</strong> - Constituir a Comissão Especial de Inventário Patrimonial de Bens Móveis e Imóveis pertencentes à carga física desta unidade de ensino, para o encerramento do exercício financeiro de {schedule.year}.
        </p>

        <p>
          <strong>Art. 2º</strong> - Designar para integrar a referida Comissão os seguintes servidores sob a presidência do primeiro:
        </p>

        <ul className="list-disc pl-8 space-y-2">
          <li><strong>Presidente:</strong> {p.name || '___________'} - Cargo: {p.role || '___________'} - Matrícula: {p.register || '___________'}</li>
          <li><strong>Secretário:</strong> {s.name || '___________'} - Cargo: {s.role || '___________'} - Matrícula: {s.register || '___________'}</li>
          <li><strong>Membro:</strong> {m.name || '___________'} - Cargo: {m.role || '___________'} - Matrícula: {m.register || '___________'}</li>
        </ul>

        <p>
          <strong>Art. 3º</strong> - A comissão terá o prazo estipulado no cronograma homologado para a conclusão dos trabalhos e apresentação do Relatório Final Circunstanciado.
        </p>

        <p>
          <strong>Art. 4º</strong> - Esta Portaria entra em vigor na data de sua assinatura, revogadas as disposições em contrário.
        </p>

        <p className="text-right mt-10">
          André Maggi/MT, {new Date(schedule.startDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
        </p>
      </div>
    );
  };

  const getAberturaText = () => {
    const p = schedule.commissionMembers.president;
    const s = schedule.commissionMembers.secretary;
    return (
      <div className="space-y-6 text-sm text-justify leading-relaxed text-black font-serif">
        <div className="text-center font-bold">
          <p className="text-base uppercase">Termo de Abertura do Inventário Patrimonial</p>
          <p className="text-[10px] text-gray-500 font-sans normal-case font-medium mt-1">Exercício de {schedule.year}</p>
        </div>

        <p className="mt-6">
          Aos {new Date(schedule.startDate + 'T00:00:00').getDate()} dias do mês de {new Date(schedule.startDate + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long' })} de {schedule.year}, na Escola Estadual André Antonio Maggi, em consonância com a Portaria de Designação nº 0{schedule.year % 100}/{schedule.year} - EEAM, reuniram-se os membros da comissão nomeada sob a presidência de {p.name || '___________'} para dar início formal aos trabalhos de levantamento físico patrimonial de bens permanentes móveis e imóveis desta escola.
        </p>

        <p>
          Os trabalhos constarão de vistoria física em todos os ambientes e salas da escola, verificação e fixação de plaquetas patrimoniais, atualização do estado de conservação física dos bens móveis e eletrônicos, e identificação de bens ociosos ou inservíveis para futura baixa patrimonial.
        </p>

        <p>
          Após a varredura física in loco, os dados levantados serão confrontados com a base de dados oficial no sistema a fim de identificar eventuais inconsistências ou bens sobressalentes.
        </p>

        <p>
          Para constar, eu, {s.name || '___________'}, na qualidade de secretário(a) da comissão, lavrei o presente termo que segue assinado por todos os integrantes presentes.
        </p>

        <p className="text-right mt-10">
          André Maggi/MT, {new Date(schedule.startDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
        </p>
      </div>
    );
  };

  const getRelatorioText = () => {
    const totalAssets = assets.length;
    const inserviveis = assets.filter(a => a.isUnserviceable).length;
    const excelentes = assets.filter(a => a.condition === 'EXCELENTE' && !a.isUnserviceable).length;
    const bons = assets.filter(a => a.condition === 'BOM' && !a.isUnserviceable).length;
    const regulares = assets.filter(a => a.condition === 'REGULAR' && !a.isUnserviceable).length;

    return (
      <div className="space-y-5 text-xs text-justify leading-relaxed text-black font-serif">
        <div className="text-center font-bold">
          <p className="text-sm uppercase">Relatório Final Circunstanciado do Inventário Patrimonial</p>
          <p className="text-[10px] text-gray-500 font-sans normal-case font-medium mt-0.5">Encerramento do Exercício de {schedule.year}</p>
        </div>

        <p>
          A <strong>Comissão Especial de Inventário Patrimonial</strong>, instituída pela Portaria nº 0{schedule.year % 100}/{schedule.year} - EEAM, apresenta a esta Diretoria e à Secretaria de Estado de Educação de Mato Grosso (SEDUC-MT) o relatório conclusivo das atividades de levantamento físico dos bens patrimoniais permanentes desta unidade escolar realizadas no presente exercício.
        </p>

        <p className="font-bold uppercase tracking-wider text-[10px] text-gray-900 border-b border-gray-200 pb-1 mt-4">1. Do Procedimento Executado</p>
        <p>
          Os membros da comissão efetuaram vistoria física e varredura minuciosa em todos os ambientes pedagógicos, administrativos e de apoio da escola, verificando a presença física e o estado de conservação de cada bem permanente catalogado. Foram verificadas as etiquetas patrimoniais e efetuada a colagem de códigos de identificação digital (QR Codes) para facilitar o acompanhamento em tempo real via sistema.
        </p>

        <p className="font-bold uppercase tracking-wider text-[10px] text-gray-900 border-b border-gray-200 pb-1 mt-4">2. Dos Resultados Obtidos</p>
        <p>
          O levantamento físico registrou o seguinte balanço de bens permanentes e móveis desta unidade de ensino:
        </p>

        <table className="w-full text-[10px] border-collapse border border-gray-300 font-sans my-4 text-black text-black">
          <thead>
            <tr className="bg-gray-100 border border-gray-300 font-bold">
              <th className="p-2 border border-gray-300 text-left">Indicador Patrimonial</th>
              <th className="p-2 border border-gray-300 text-right">Quantidade de Itens</th>
              <th className="p-2 border border-gray-300 text-right">Representação %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-gray-300">Bens Ativos em Estado Excelente</td>
              <td className="p-2 border border-gray-300 text-right font-bold">{excelentes}</td>
              <td className="p-2 border border-gray-300 text-right">{(totalAssets > 0 ? (excelentes / totalAssets) * 100 : 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">Bens Ativos em Estado Bom</td>
              <td className="p-2 border border-gray-300 text-right font-bold">{bons}</td>
              <td className="p-2 border border-gray-300 text-right">{(totalAssets > 0 ? (bons / totalAssets) * 100 : 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">Bens Ativos em Estado Regular</td>
              <td className="p-2 border border-gray-300 text-right font-bold">{regulares}</td>
              <td className="p-2 border border-gray-300 text-right">{(totalAssets > 0 ? (regulares / totalAssets) * 100 : 0).toFixed(1)}%</td>
            </tr>
            <tr className="text-red-600 font-bold">
              <td className="p-2 border border-gray-300">Bens Inservíveis / Propostos para Baixa (Péssimo)</td>
              <td className="p-2 border border-gray-300 text-right font-bold">{inserviveis}</td>
              <td className="p-2 border border-gray-300 text-right">{(totalAssets > 0 ? (inserviveis / totalAssets) * 100 : 0).toFixed(1)}%</td>
            </tr>
            <tr className="bg-gray-50 font-bold border-t-2 border-gray-400">
              <td className="p-2 border border-gray-300">Total Geral de Bens Auditados</td>
              <td className="p-2 border border-gray-300 text-right">{totalAssets}</td>
              <td className="p-2 border border-gray-300 text-right">100.0%</td>
            </tr>
          </tbody>
        </table>

        <p className="font-bold uppercase tracking-wider text-[10px] text-gray-900 border-b border-gray-200 pb-1 mt-4">3. Das Recomendações e Medidas de Saneamento</p>
        <p>
          A comissão recomenda a abertura imediata de processo administrativo de baixa e descarte ecologicamente correto dos {inserviveis} bens identificados em estado inservível (PÉSSIMO), conforme previsto na legislação estadual. Para os bens classificados como Regulares, recomenda-se manutenção preventiva para prolongamento de sua vida útil.
        </p>

        <p>
          Diante do exposto, os membros da comissão assinam o presente relatório, submetendo-o à homologação do Gestor Escolar.
        </p>

        <p className="text-right mt-6">
          André Maggi/MT, {new Date(schedule.endDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
        </p>
      </div>
    );
  };

  const getEncerramentoText = () => {
    const s = schedule.commissionMembers.secretary;
    return (
      <div className="space-y-6 text-sm text-justify leading-relaxed text-black font-serif">
        <div className="text-center font-bold">
          <p className="text-base uppercase">Termo de Encerramento do Inventário Patrimonial</p>
          <p className="text-[10px] text-gray-500 font-sans normal-case font-medium mt-1">Exercício de {schedule.year}</p>
        </div>

        <p className="mt-6">
          Aos {new Date(schedule.endDate + 'T00:00:00').getDate()} dias do mês de {new Date(schedule.endDate + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long' })} de {schedule.year}, declaram-se formalmente encerrados os trabalhos da Comissão Especial de Inventário Patrimonial referente ao exercício vigente, tendo sido cumpridas todas as etapas de varredura física, conciliação contábil, lavratura de termos de responsabilidade e regularização das baixas necessárias.
        </p>

        <p>
          O Relatório Final Circunstanciado foi devidamente aprovado por unanimidade pelos membros da comissão e segue anexo a este termo para encaminhamento aos órgãos competentes da Secretaria de Estado de Educação de Mato Grosso.
        </p>

        <p>
          Para constar, eu, {s.name || '___________'}, lavrei o presente termo que segue datado e assinado por todos os envolvidos.
        </p>

        <p className="text-right mt-10">
          André Maggi/MT, {new Date(schedule.endDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
        </p>
      </div>
    );
  };

  const getCronogramaSeducText = () => {
    const p = schedule.commissionMembers.president;
    const s = schedule.commissionMembers.secretary;
    const m = schedule.commissionMembers.member;
    const subcomissao = [p.name, s.name, m.name].filter(Boolean).join(', ');

    return (
      <div className="space-y-6 text-sm text-justify leading-relaxed text-black font-sans w-full">
        {/* Title */}
        <div className="border-b-2 border-blue-800 pb-2 mb-4 text-left">
          <h1 className="text-xl font-bold text-blue-900 leading-tight">Cronograma de Inventário Anual de Bens Móveis e Imóveis</h1>
        </div>

        {/* Sub-header */}
        <div className="text-left text-xs font-semibold text-gray-700 space-y-1">
          <p>Rede Estadual de Ensino – Mato Grosso</p>
          <p>Setor de Patrimônio</p>
          <p>Unidade Escolar: <span className="font-bold text-gray-900 border-b border-gray-300 pb-0.5 px-2">Escola Estadual André Antonio Maggi</span></p>
          <p>Subcomissão: <span className="font-bold text-gray-900 border-b border-gray-300 pb-0.5 px-2">{subcomissao || 'Não definida'}</span></p>
        </div>

        {/* I. Objetivo */}
        <div className="space-y-1 mt-4">
          <h2 className="text-sm font-bold text-blue-900 uppercase">I. Objetivo</h2>
          <p className="text-xs text-gray-700 leading-relaxed text-justify">
            Este documento tem como finalidade estabelecer um cronograma padronizado das atividades de Inventário anual de bens móveis, imóveis e desfazimento de bens móveis inservíveis, garantindo o planejamento da execução. O cronograma é uma ferramenta de planejamento que organiza e estabelece o tempo necessário para cada ação assegurando a eficácia e a organização do tempo de cada etapa.
          </p>
        </div>

        {/* II. Avaliador */}
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-blue-900 uppercase">II. Avaliador</h2>
          <p className="text-xs text-gray-700 leading-relaxed text-justify">
            Analisar o preenchimento correto do cronograma elaborado e a situação do correto preenchido.
          </p>
        </div>

        {/* III. Observações Gerais */}
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-blue-900 uppercase">III. Observações Gerais</h2>
          <p className="text-xs text-gray-700 leading-relaxed text-justify">
            "A elaboração deste documento deve ocorrer dentro do prazo estipulado pela comissão central, conforme as Portarias 657/2024 e 804/2024, ou quando houver a necessidade de um inventário tempestivo."
          </p>
        </div>

        {/* IV. Cronograma de execução */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-blue-900 uppercase">IV. Cronograma de execução</h2>
          
          <table className="w-full text-xs border-collapse border border-black font-sans text-black">
            <thead>
              <tr className="bg-gray-50 font-bold border border-black">
                <th className="p-2 border border-black text-center w-[25%] uppercase tracking-wider">Data</th>
                <th className="p-2 border border-black text-left w-[55%] uppercase tracking-wider">Ação</th>
                <th className="p-2 border border-black text-center w-[20%] uppercase tracking-wider">Situação</th>
              </tr>
            </thead>
            <tbody>
              {seducActions.map((action, idx) => (
                <tr key={action.id} className="border border-black">
                  <td className="p-1 border border-black text-center">
                    <input
                      type="text"
                      value={action.date}
                      onChange={e => {
                        const updated = [...seducActions];
                        updated[idx].date = e.target.value;
                        setSeducActions(updated);
                      }}
                      className="w-full bg-transparent border-none text-center outline-none text-xs text-gray-800 font-medium"
                    />
                  </td>
                  <td className="p-2 border border-black text-left leading-snug">
                    {action.action}
                  </td>
                  <td className="p-1 border border-black text-center">
                    <input
                      type="text"
                      value={action.situation}
                      onChange={e => {
                        const updated = [...seducActions];
                        updated[idx].situation = e.target.value.toUpperCase();
                        setSeducActions(updated);
                      }}
                      className="w-full bg-transparent border-none text-center outline-none text-xs text-gray-800 font-bold uppercase"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans w-full min-w-0">
      <aside className="w-64 shrink-0 bg-blue-950 text-white flex flex-col no-print">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-blue-600 p-1.5 rounded-lg shadow-lg">📋</span>
            Bens Móveis
          </h1>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto">
          <button onClick={() => { setActiveTab('inventory'); setLocationFilter(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}>
            <Monitor size={18} /> Inventário Ativo
          </button>
          <button onClick={() => setActiveTab('ambientes')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'ambientes' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}>
            <MapPin size={18} /> Ambientes (QR Code)
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}>
            <History size={18} /> Baixas e Inservíveis
          </button>
          <button onClick={() => setActiveTab('relatorios')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'relatorios' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}>
            <ClipboardList size={18} /> Emissão de Relatório
          </button>
          <button onClick={() => setActiveTab('cronograma')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'cronograma' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}>
            <Calendar size={18} /> Cronograma do Processo
          </button>
        </nav>
        <div className="p-6 border-t border-blue-800">
          <button onClick={onExit} className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft size={16} /> Voltar ao Hub
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 min-w-0 w-full gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><ShieldCheck size={20} /></div>
            <div className="min-w-0">
              <h2 className="text-xs md:text-sm font-black text-gray-900 uppercase truncate">Inventário de Bens Móveis</h2>
              {locationFilter && (
                <div className="flex items-center gap-2 mt-1 truncate">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 uppercase truncate">Local: {locationFilter}</span>
                  <button onClick={() => setLocationFilter(null)} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase underline shrink-0">Remover Filtro</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 w-32 md:w-48 lg:w-64"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 md:px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all flex items-center gap-1 md:gap-2 shrink-0"
            >
              <Plus size={16} /> <span className="hidden md:inline">Cadastrar Bem</span><span className="md:hidden">Novo</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar min-w-0 w-full">
          <div className="space-y-6">

            {activeTab === 'ambientes' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Gestão de Ambientes</h3>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">QR Codes vinculados à unidade física</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {uniqueLocations.map(loc => {
                    const itemsInLoc = assets.filter(a => a.location === loc);
                    const unserviceableInLoc = itemsInLoc.filter(a => a.condition === 'PÉSSIMO').length;

                    return (
                      <div key={loc} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-2xl transition-all group flex flex-col items-center">
                        <div className="p-4 bg-gray-50 rounded-[2.5rem] border border-gray-100 mb-6 group-hover:scale-105 transition-transform duration-300">
                          <QRCodeSVG
                            id={`qr-${loc}`}
                            value={`${window.location.origin}/?location=${encodeURIComponent(loc)}`}
                            size={160}
                            level="H"
                            includeMargin={true}
                          />
                        </div>

                        <h4 className="text-xl font-black text-gray-900 uppercase mb-2 text-center leading-tight">{loc}</h4>
                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                          <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-full uppercase border border-blue-100">
                            {itemsInLoc.length} Itens
                          </span>
                          {unserviceableInLoc > 0 && (
                            <span className="text-[10px] font-black bg-red-50 text-red-600 px-3 py-1 rounded-full uppercase border border-red-100 flex items-center gap-1">
                              <AlertTriangle size={10} /> {unserviceableInLoc} Inservíveis
                            </span>
                          )}
                        </div>

                        <div className="w-full grid grid-cols-1 gap-3">
                          <button
                            onClick={() => downloadQRCode(loc)}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"
                          >
                            <Download size={14} /> Baixar Etiqueta QR
                          </button>
                          <button
                            onClick={() => { setLocationFilter(loc); setActiveTab('inventory'); }}
                            className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black uppercase border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                          >
                            <Search size={14} /> Abrir Inventário
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === 'relatorios' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Emissão de Relatório Patrimonial</h3>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gere relatórios customizados com filtros avançados</p>
                  </div>
                  <button
                    onClick={() => reportType === 'levantamento'
                      ? handleExportPortraitPDF('levantamento-print-container', 'Planilha_Levantamento_Fisico')
                      : handleExportPDF('report-print-container', 'Relatorio_Patrimonial')
                    }
                    className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all shrink-0"
                  >
                    <FileDown size={16} /> {reportType === 'levantamento' ? 'Emitir Planilha (PDF)' : 'Emitir Relatório (PDF)'}
                  </button>
                </div>

                {/* Report Type Selector */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setReportType('padrao')}
                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                      reportType === 'padrao'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                        : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:text-blue-600'
                    }`}
                  >
                    <ClipboardList size={18} /> Relatório Padrão
                  </button>
                  <button
                    onClick={() => setReportType('levantamento')}
                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                      reportType === 'levantamento'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                        : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    <Table2 size={18} /> Planilha de Levantamento Físico
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100/80 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Itens</span>
                    <span className="text-3xl font-black text-gray-900 mt-2">{reportAssets.length}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Excelente</span>
                    <span className="text-3xl font-black text-emerald-700 mt-2">
                      {reportAssets.filter(a => a.condition === 'EXCELENTE' && !a.isUnserviceable).length}
                    </span>
                  </div>
                  <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Bom</span>
                    <span className="text-3xl font-black text-blue-700 mt-2">
                      {reportAssets.filter(a => a.condition === 'BOM' && !a.isUnserviceable).length}
                    </span>
                  </div>
                  <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100/50 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Regular</span>
                    <span className="text-3xl font-black text-amber-700 mt-2">
                      {reportAssets.filter(a => a.condition === 'REGULAR' && !a.isUnserviceable).length}
                    </span>
                  </div>
                  <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100/50 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Inservíveis</span>
                    <span className="text-3xl font-black text-red-700 mt-2">
                      {reportAssets.filter(a => a.isUnserviceable).length}
                    </span>
                  </div>
                </div>

                {/* Filters Panel */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100/80 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                    <h4 className="text-xs font-black uppercase text-gray-800 tracking-widest">Painel de Filtros</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Buscar por Patrimônio / Descrição</label>
                      <input
                        type="text"
                        value={reportSearch}
                        onChange={e => setReportSearch(e.target.value)}
                        placeholder="Ex: CADEIRA ou 12345"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Ambiente / Local</label>
                      <select
                        value={reportLocation}
                        onChange={e => setReportLocation(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                      >
                        <option value="">TODOS OS AMBIENTES</option>
                        {uniqueLocations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Estado de Conservação</label>
                      <select
                        value={reportCondition}
                        onChange={e => setReportCondition(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                      >
                        <option value="">TODOS OS ESTADOS</option>
                        <option value="EXCELENTE">EXCELENTE</option>
                        <option value="BOM">BOM</option>
                        <option value="REGULAR">REGULAR</option>
                        <option value="PÉSSIMO">INSERVÍVEL (PÉSSIMO)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Ano de Aquisição</label>
                      <select
                        value={reportYear}
                        onChange={e => setReportYear(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                      >
                        <option value="">TODOS OS ANOS</option>
                        {Array.from(new Set(assets.map(a => a.acquisitionYear).filter(Boolean))).sort().map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setReportSearch('');
                        setReportLocation('');
                        setReportCondition('');
                        setReportYear('');
                      }}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>

                {/* Form de preenchimento do cabeçalho (Apenas para Planilha de Levantamento Físico) */}
                {reportType === 'levantamento' && (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100/80 shadow-sm space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                      <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
                      <h4 className="text-xs font-black uppercase text-gray-800 tracking-widest">Dados do Cabeçalho da Planilha</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Unidade Gestora</label>
                        <input
                          type="text"
                          value={headerUG}
                          onChange={e => setHeaderUG(e.target.value.toUpperCase())}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Código UG</label>
                        <input
                          type="text"
                          value={headerCodUG}
                          onChange={e => setHeaderCodUG(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Unidade ADM</label>
                        <input
                          type="text"
                          value={headerUA}
                          onChange={e => setHeaderUA(e.target.value.toUpperCase())}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Código UA</label>
                        <input
                          type="text"
                          value={headerCodUA}
                          onChange={e => setHeaderCodUA(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                          placeholder="Ex: 14101"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Município</label>
                        <input
                          type="text"
                          value={headerMunicipio}
                          onChange={e => setHeaderMunicipio(e.target.value.toUpperCase())}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Código UL</label>
                        <input
                          type="text"
                          value={headerCodUL}
                          onChange={e => setHeaderCodUL(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Responsável</label>
                        <input
                          type="text"
                          value={headerResponsavel}
                          onChange={e => setHeaderResponsavel(e.target.value.toUpperCase())}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Matrícula</label>
                        <input
                          type="text"
                          value={headerMatricula}
                          onChange={e => setHeaderMatricula(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                          placeholder="Digite a matrícula"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">CPF</label>
                        <input
                          type="text"
                          value={headerCPF}
                          onChange={e => setHeaderCPF(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                          placeholder="Digite o CPF"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Título da Capa</label>
                        <input
                          type="text"
                          value={coverTitle}
                          onChange={e => setCoverTitle(e.target.value.toUpperCase())}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Subtítulo da Capa</label>
                        <input
                          type="text"
                          value={coverSubtitle}
                          onChange={e => setCoverSubtitle(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Portaria da Apresentação</label>
                        <input
                          type="text"
                          value={headerPortaria}
                          onChange={e => setHeaderPortaria(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Data Início dos Trabalhos</label>
                        <input
                          type="text"
                          value={headerDataInicio}
                          onChange={e => setHeaderDataInicio(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Original Portaria (Termo)</label>
                        <input
                          type="text"
                          value={headerResponsibilityOriginalPortaria}
                          onChange={e => setHeaderResponsibilityOriginalPortaria(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Portaria Alteração (Termo)</label>
                        <input
                          type="text"
                          value={headerResponsibilityAlterationPortaria}
                          onChange={e => setHeaderResponsibilityAlterationPortaria(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Instrução Normativa</label>
                        <input
                          type="text"
                          value={headerResponsibilityNormativeInstruction}
                          onChange={e => setHeaderResponsibilityNormativeInstruction(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Nome do Diretor</label>
                        <input
                          type="text"
                          value={headerDirectorName}
                          onChange={e => setHeaderDirectorName(e.target.value.toUpperCase())}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                          placeholder="Ex: JOÃO DA SILVA"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Matrícula do Diretor</label>
                        <input
                          type="text"
                          value={headerDirectorRegister}
                          onChange={e => setHeaderDirectorRegister(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                          placeholder="Ex: 123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Nº Comissão Anual</label>
                        <input
                          type="text"
                          value={headerComissaoNumero}
                          onChange={e => setHeaderComissaoNumero(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Data Ata de Abertura</label>
                        <input
                          type="text"
                          value={headerAberturaAtaDataTexto}
                          onChange={e => setHeaderAberturaAtaDataTexto(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Período de Inventário</label>
                        <input
                          type="text"
                          value={headerRelatorioPeriodo}
                          onChange={e => setHeaderRelatorioPeriodo(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">E-mail da Escola</label>
                        <input
                          type="text"
                          value={headerSchoolEmail}
                          onChange={e => setHeaderSchoolEmail(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Telefone da Escola</label>
                        <input
                          type="text"
                          value={headerSchoolPhone}
                          onChange={e => setHeaderSchoolPhone(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Data/Local Relatório</label>
                        <input
                          type="text"
                          value={headerRelatorioData}
                          onChange={e => setHeaderRelatorioData(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Ata Encerramento (Texto)</label>
                        <input
                          type="text"
                          value={headerEncerramentoAtaDataTexto}
                          onChange={e => setHeaderEncerramentoAtaDataTexto(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Data/Local Encerramento</label>
                        <input
                          type="text"
                          value={headerEncerramentoData}
                          onChange={e => setHeaderEncerramentoData(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-6 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="includeCover"
                            checked={includeCover}
                            onChange={e => setIncludeCover(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="includeCover" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer select-none">
                            Incluir Capa
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="includeSummary"
                            checked={includeSummary}
                            onChange={e => setIncludeSummary(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="includeSummary" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer select-none">
                            Incluir Sumário
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="includePresentation"
                            checked={includePresentation}
                            onChange={e => setIncludePresentation(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="includePresentation" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer select-none">
                            Incluir Apresentação
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="includeResponsibility"
                            checked={includeResponsibility}
                            onChange={e => setIncludeResponsibility(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="includeResponsibility" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer select-none">
                            Incluir Termo Responsabilidade
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="includeAbertura"
                            checked={includeAbertura}
                            onChange={e => setIncludeAbertura(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="includeAbertura" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer select-none">
                            Incluir Ata Abertura
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="includeMetodologia"
                            checked={includeMetodologia}
                            onChange={e => setIncludeMetodologia(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="includeMetodologia" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer select-none">
                            Incluir Metodologia
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="includeRelatorio"
                            checked={includeRelatorio}
                            onChange={e => setIncludeRelatorio(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="includeRelatorio" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer select-none">
                            Incluir Relatório Final
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="includeFoto"
                            checked={includeFoto}
                            onChange={e => setIncludeFoto(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="includeFoto" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer select-none">
                            Incluir Ficha Foto
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="includeEncerramento"
                            checked={includeEncerramento}
                            onChange={e => setIncludeEncerramento(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="includeEncerramento" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer select-none">
                            Incluir Ata Encerramento
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Report Preview Table — Conditional Rendering */}
                {reportType === 'padrao' ? (
                  /* === RELATÓRIO PADRÃO (existente) === */
                  <>
                    <div className="bg-white rounded-[2.5rem] border border-gray-100/80 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                          <h4 className="text-xs font-black uppercase text-gray-800 tracking-widest">Prévia do Relatório</h4>
                        </div>
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
                          {reportAssets.length} registros correspondentes
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nº Patrimônio</th>
                              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ambiente</th>
                              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Doc. Aquisição</th>
                              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ano</th>
                              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Cadastro</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 font-bold text-xs text-gray-700">
                            {reportAssets.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-10 text-center text-gray-400 uppercase font-black tracking-widest">
                                  Nenhum bem móvel encontrado com os filtros aplicados.
                                </td>
                              </tr>
                            ) : (
                              reportAssets.map(asset => (
                                <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-6 font-black text-gray-900">PAT: {asset.heritageNumber}</td>
                                  <td className="p-6 uppercase">{asset.description}</td>
                                  <td className="p-6 uppercase">{asset.location}</td>
                                  <td className="p-6">
                                    <span className={`px-2 py-1 rounded text-[8px] font-black border ${getConditionColor(asset.condition)}`}>
                                      {asset.isUnserviceable ? 'INSERVÍVEL' : asset.condition}
                                    </span>
                                  </td>
                                  <td className="p-6 uppercase">{asset.acquisitionDocument || '-'}</td>
                                  <td className="p-6">{asset.acquisitionYear || '-'}</td>
                                  <td className="p-6 text-gray-400">{new Date(asset.timestamp).toLocaleDateString('pt-BR')}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Printable container hidden visually but read by html2pdf */}
                    <div className="hidden">
                      <div id="report-print-container" className="p-10 bg-white text-black font-sans space-y-8" style={{ width: '275mm' }}>
                        {/* Header */}
                        <div className="border-b-4 border-blue-900 pb-6 flex items-center justify-between">
                          <div className="space-y-1">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Escola Estadual André Antonio Maggi</h1>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Secretaria de Estado de Educação de Mato Grosso</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Relatório Oficial de Inventário de Bens Móveis</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right space-y-1 text-xs font-bold text-gray-600">
                              <p>Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                              <p>Responsável: {user?.name ? user.name.toUpperCase() : 'GESTOR DO SISTEMA'}</p>
                            </div>
                            <div className="flex flex-col items-center gap-1 bg-gray-50 p-2 rounded-xl border border-gray-200 shrink-0">
                              <QRCodeSVG
                                value={`${window.location.origin}/?location=${encodeURIComponent(reportLocation || 'TODOS')}`}
                                size={64}
                                level="H"
                                includeMargin={true}
                              />
                              <span className="text-[7px] font-black text-gray-500 uppercase tracking-tighter">Inventário Digital</span>
                            </div>
                          </div>
                        </div>

                        {/* Filter Summary */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-4 gap-4 text-[10px] font-black text-gray-500 uppercase">
                          <div>
                            <span>Local:</span>
                            <p className="text-xs text-gray-900 font-bold mt-0.5">{reportLocation || 'TODOS OS AMBIENTES'}</p>
                          </div>
                          <div>
                            <span>Estado:</span>
                            <p className="text-xs text-gray-900 font-bold mt-0.5">{reportCondition || 'TODOS OS ESTADOS'}</p>
                          </div>
                          <div>
                            <span>Ano Aquisição:</span>
                            <p className="text-xs text-gray-900 font-bold mt-0.5">{reportYear || 'TODOS OS ANOS'}</p>
                          </div>
                          <div>
                            <span>Registros:</span>
                            <p className="text-xs text-gray-900 font-bold mt-0.5">{reportAssets.length} itens encontrados</p>
                          </div>
                        </div>

                        {/* Table */}
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="bg-blue-900 text-white font-bold border border-blue-900">
                              <th className="p-3 border-r border-blue-800">Nº PATRIMÔNIO</th>
                              <th className="p-3 border-r border-blue-800">DESCRIÇÃO DO BEM</th>
                              <th className="p-3 border-r border-blue-800">AMBIENTE</th>
                              <th className="p-3 border-r border-blue-800">ESTADO</th>
                              <th className="p-3 border-r border-blue-800">DOCUMENTO</th>
                              <th className="p-3 border-r border-blue-800">ANO</th>
                              <th className="p-3">DATA CADASTRO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 border border-gray-200 font-bold text-gray-800 uppercase">
                            {reportAssets.map(asset => (
                              <tr key={asset.id} className="hover:bg-gray-50">
                                <td className="p-3 border-r border-gray-200 font-black">PAT: {asset.heritageNumber}</td>
                                <td className="p-3 border-r border-gray-200">{asset.description}</td>
                                <td className="p-3 border-r border-gray-200">{asset.location}</td>
                                <td className="p-3 border-r border-gray-200">{asset.isUnserviceable ? 'INSERVÍVEL' : asset.condition}</td>
                                <td className="p-3 border-r border-gray-200">{asset.acquisitionDocument || '-'}</td>
                                <td className="p-3 border-r border-gray-200">{asset.acquisitionYear || '-'}</td>
                                <td className="p-3">{new Date(asset.timestamp).toLocaleDateString('pt-BR')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Signatures */}
                        <div className="pt-16 grid grid-cols-2 gap-16 text-center text-xs font-black uppercase text-gray-700 tracking-wider">
                          <div className="space-y-1">
                            <div className="border-t border-gray-400 w-64 mx-auto pt-2"></div>
                            <p>{user?.name ? user.name.toUpperCase() : 'GESTOR DE PATRIMÔNIO'}</p>
                            <p className="text-[10px] text-gray-400">Responsável pelo Inventário</p>
                          </div>
                          <div className="space-y-1">
                            <div className="border-t border-gray-400 w-64 mx-auto pt-2"></div>
                            <p>DIRETORIA ESCOLAR</p>
                            <p className="text-[10px] text-gray-400">Assinatura e Carimbo</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* === PLANILHA DE LEVANTAMENTO FÍSICO DE BENS MÓVEIS (NOVO) === */
                  <>
                    {/* Preview Table */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100/80 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                          <h4 className="text-xs font-black uppercase text-gray-800 tracking-widest">Prévia — Planilha de Levantamento Físico</h4>
                        </div>
                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                          {reportAssets.length} bens levantados
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-28">Nº Patrimônio</th>
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-24">Sem Nº R.P</th>
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-12">UN.</th>
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição / Especificação do Bem</th>
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-28">Situação Física</th>
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-36">Ambiente</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 font-bold text-xs text-gray-700">
                            {reportAssets.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-10 text-center text-gray-400 uppercase font-black tracking-widest">
                                  Nenhum bem móvel encontrado com os filtros aplicados.
                                </td>
                              </tr>
                            ) : (
                              reportAssets.map((asset) => (
                                <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-4 text-center font-black text-gray-900">{isSemRp(asset.heritageNumber) ? '-' : asset.heritageNumber}</td>
                                  <td className="p-4 text-center font-black text-indigo-600">{isSemRp(asset.heritageNumber) ? 'X' : ''}</td>
                                  <td className="p-4 text-center text-gray-400">UN</td>
                                  <td className="p-4 uppercase">{asset.description}</td>
                                  <td className="p-4 text-center">
                                    <span className="px-2.5 py-1 rounded text-[10px] font-black bg-gray-100 text-gray-700 border border-gray-200">
                                      {getSitFisica(asset.condition, asset.isUnserviceable)}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center uppercase">{asset.location}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Hidden Printable Container — Planilha de Levantamento Físico */}
                    <div className="hidden">
                      <div id="levantamento-print-container" className="p-8 bg-white text-black font-sans" style={{ width: '275mm' }}>
                        
                        {/* === CAPA OFICIAL (PÁGINA 1) === */}
                        {includeCover && (
                          <div className="w-full bg-white flex flex-col justify-center relative border border-gray-300 mb-12" style={{ height: '260mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
                            {/* Bloco azul vertical na esquerda */}
                            <div className="absolute left-0 top-0 bottom-0 w-[120mm] bg-[#1b365d] flex flex-col justify-center px-12">
                              <div className="bg-white border-2 border-white p-8 shadow-lg w-[96mm]">
                                <h1 className="text-base font-black uppercase text-gray-900 tracking-wide leading-tight">
                                  {coverTitle} <span className="text-red-600">{schedule.year}</span>
                                </h1>
                                <div className="mt-8 text-xs font-bold text-gray-900 uppercase">
                                  <p>Escola Estadual <span className="text-red-600">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span></p>
                                </div>
                              </div>
                            </div>
                            {/* Informações na direita */}
                            <div className="absolute right-0 top-0 bottom-0 left-[120mm] bg-white flex flex-col justify-between p-16 text-right font-black uppercase text-gray-400 text-[9px] tracking-widest">
                              <div>
                                <p className="text-gray-600 font-black text-[10px]">{coverSubtitle}</p>
                                <p className="text-[8px] text-gray-400 font-bold mt-1">Secretaria Adjunta de Patrimônio e Serviços</p>
                              </div>
                              <div>
                                <p className="text-gray-600">{headerMunicipio || 'LUCAS DO RIO VERDE'} - MT</p>
                                <p className="text-gray-400 font-bold mt-1">{schedule.year}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* === SUMÁRIO OFICIAL (PÁGINA 2) === */}
                        {includeSummary && (
                          <div className="w-full bg-white p-16 flex flex-col justify-center border border-gray-300 mb-12 relative" style={{ height: '260mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
                            <div className="max-w-xl mx-auto w-full font-sans text-black">
                              {/* Título do Sumário */}
                              <h2 className="text-center text-sm font-black uppercase tracking-[0.2em] mb-12 border-b border-black pb-4 text-gray-900">
                                SUMÁRIO
                              </h2>
                              {/* Lista de Itens do Sumário */}
                              <div className="space-y-4 text-xs font-bold text-gray-800 tracking-wider">
                                <div className="flex justify-between items-end">
                                  <span>1. APRESENTAÇÃO</span>
                                  <span className="border-b border-dotted border-gray-400 flex-1 mx-2 mb-1"></span>
                                  <span className="font-black">03</span>
                                </div>
                                <div className="flex justify-between items-end">
                                  <span>2. TERMO DE RESPONSABILIDADE</span>
                                  <span className="border-b border-dotted border-gray-400 flex-1 mx-2 mb-1"></span>
                                  <span className="font-black">03</span>
                                </div>
                                <div className="flex justify-between items-end">
                                  <span>3. ATA DE ABERTURA DO INVENTÁRIO</span>
                                  <span className="border-b border-dotted border-gray-400 flex-1 mx-2 mb-1"></span>
                                  <span className="font-black">04</span>
                                </div>
                                <div className="flex justify-between items-end">
                                  <span>4. DOS TRABALHOS  METODOLOGIA</span>
                                  <span className="border-b border-dotted border-gray-400 flex-1 mx-2 mb-1"></span>
                                  <span className="font-black">06</span>
                                </div>
                                <div className="flex justify-between items-end text-blue-900 font-black">
                                  <span>5. PLANILHA DE LEVANTAMENTO FÍSICO</span>
                                  <span className="border-b border-dotted border-blue-900 flex-1 mx-2 mb-1"></span>
                                  <span>07</span>
                                </div>
                                <div className="flex justify-between items-end">
                                  <span>6. RELATÓRIO FINAL DE INVENTÁRIO</span>
                                  <span className="border-b border-dotted border-gray-400 flex-1 mx-2 mb-1"></span>
                                  <span className="font-black">13</span>
                                </div>
                                <div className="flex justify-between items-end">
                                  <span>7. REGISTRO FOTOGRÁFICO DE BENS</span>
                                  <span className="border-b border-dotted border-gray-400 flex-1 mx-2 mb-1"></span>
                                  <span className="font-black">16</span>
                                </div>
                                <div className="flex justify-between items-end">
                                  <span>8. ATA DE ENCERRAMENTO DE INVENTÁRIO</span>
                                  <span className="border-b border-dotted border-gray-400 flex-1 mx-2 mb-1"></span>
                                  <span className="font-black">17</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* === APRESENTAÇÃO OFICIAL (PÁGINA 3) === */}
                        {includePresentation && (
                          <div className="w-full bg-white p-16 flex flex-col justify-center border border-gray-300 mb-12 relative" style={{ height: '260mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
                            <div className="max-w-xl mx-auto w-full font-sans text-black text-left">
                              {/* Título */}
                              <h2 className="text-left text-sm font-black uppercase tracking-[0.2em] mb-8 border-b border-black pb-4 text-gray-900">
                                1. APRESENTAÇÃO
                              </h2>
                              {/* Parágrafos da Apresentação */}
                              <div className="space-y-6 text-xs font-medium text-gray-700 leading-relaxed text-justify tracking-wide">
                                <p>
                                  A Escola Estadual <span className="text-red-600 uppercase font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span> em <span className="text-red-600 uppercase font-black">{headerMunicipio || 'LUCAS DO RIO VERDE'}</span>, em cumprimento ao disposto na Portaria nº <span className="text-red-600 uppercase font-black">{headerPortaria}</span>, instituiu Subcomissão com o objetivo de realizar o Inventário de bens móveis permanentes da unidade escolar. A referida Subcomissão foi instituída com a finalidade de realizar o levantamento físico dos bens patrimoniais da unidade, no intuito de atualizar as informações patrimonial da Unidade Escolar, assim como de regularizar as informações daqueles bens adquiridos por meio do Programa Dinheiro Direto nas Escolas – PDDE, que ainda não se encontram registradas no Sistema SIGPAT e/ou emplaquetadas, e ao final dos trabalhos elaborar o Relatório Final de Inventário da Unidade.
                                </p>
                                <p>
                                  Após reunião com a direção da unidade Escolar, membros do CDCE e subcomissão devidamente instituída, planejou-se as ações e, em <span className="text-red-600 uppercase font-black">{headerDataInicio}</span>, a comissão iniciou os trabalhos.
                                </p>
                                <p>
                                  A Comissão Central de Inventário da SEDUC encaminha a unidade Escolar, o Modelo do Processo de Inventário, juntamente com o Guia de Levantamento Patrimonial, contendo as orientações necessárias à realização do inventário.
                                </p>
                                <p>
                                  O resultado do trabalho, as orientações e as recomendações serão destacadas de forma simples e legível, com a finalidade de apontar as deficiências e apontar as melhorias nos controles e manutenção do patrimônio da Escola Estadual <span className="text-red-600 uppercase font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span>, além de apontar os bens considerados inservíveis, bens que não estão mais em condição de uso.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* === TERMO DE RESPONSABILIDADE OFICIAL - PARTE 1 (PÁGINA 4) === */}
                        {includeResponsibility && (
                          <div className="w-full bg-white p-16 flex flex-col justify-between border border-gray-300 mb-12 relative" style={{ height: '260mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
                            <div className="max-w-xl mx-auto w-full font-sans text-black text-left">
                              {/* Título */}
                              <h2 className="text-left text-sm font-black uppercase tracking-[0.2em] mb-4 border-b border-black pb-2 text-gray-900">
                                2. TERMO DE RESPONSABILIDADE
                              </h2>
                              {/* Conteúdo */}
                              <div className="space-y-3 text-[9px] font-medium text-gray-700 leading-relaxed text-justify tracking-wide">
                                <p>
                                  O Diretor da Escola Estadual <span className="text-red-600 uppercase font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span>, <span className="text-red-600 uppercase font-black">{headerMunicipio || 'LUCAS DO RIO VERDE'}</span> do Estado de Mato Grosso, no uso das atribuições que lhe confere a Instrução Normativa nº <span className="text-red-600 uppercase font-black">{headerResponsibilityNormativeInstruction}</span> e,
                                </p>
                                <p>
                                  CONSIDERANDO a Lei Federal nº 4.320 de 17 de março de 1964, Art. 94 que determina que haverá registros analíticos de todos os bens de caráter permanente, com indicação dos elementos necessários para a perfeita caracterização de cada um deles e dos agentes responsáveis pela sua guarda e administração, isto é, obrigatoriedade da realização do Inventário;
                                </p>
                                <p>
                                  CONSIDERANDO a necessidade de atualizar as informações patrimonial da Unidade Escolar, assim como de regularizar as informações daqueles adquiridos por meio do Programa Dinheiro Direto nas Escolas - PDDE, que ainda não se encontram registradas no Sistema SIGPAT e/ou emplaquetadas,
                                </p>
                                <p>
                                  CONSIDERANDO a necessidade relacionar os bens móveis considerados inservíveis para que sejam dadas as destinações adequadas, conforme determina a legislação;
                                </p>
                                <p>
                                  CONSIDERANDO a necessidade de manter atualizado a carga patrimonial da Unidade Escolar para fins de controle e planejamento de novas aquisições de bens móveis permanentes.
                                </p>
                                <p>
                                  CONSIDERANDO ainda, o disposto na portaria nº <span className="text-red-600 uppercase font-black">{headerResponsibilityOriginalPortaria}</span> com alteração nos membro pela portaria nº <span className="text-red-600 uppercase font-black">{headerResponsibilityAlterationPortaria}</span> que instituiu a subcomissão para realização do Inventário Físico Financeiro dos Bens móveis da Escola Estadual <span className="text-red-600 uppercase font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span>.
                                </p>
                                <p className="font-black pt-2 text-gray-950">
                                  Estabelece:
                                </p>
                                <p>
                                  Art. 1º A referida Subcomissão será composta pelos servidores abaixo descritos:
                                </p>
                                <div className="pl-4 space-y-1.5 pt-1">
                                  <p>
                                    <span className="font-black text-gray-950">Presidente:</span> <span className="text-red-600 uppercase font-black">{schedule.commissionMembers.president.name || 'NOME COMPLETO'}</span>, <span className="text-red-600 uppercase font-black">{schedule.commissionMembers.president.role || 'CARGO DO SERVIDOR'}</span>, matrícula nº <span className="text-red-600 uppercase font-black">{schedule.commissionMembers.president.register || '00000'}</span>.
                                  </p>
                                  <p>
                                    <span className="font-black text-gray-950">Diretor da unidade escolar:</span> <span className="text-red-600 uppercase font-black">{headerDirectorName || 'NOME COMPLETO'}</span>, <span className="text-red-600 uppercase font-black">DIRETOR ESCOLAR</span>, matrícula nº <span className="text-red-600 uppercase font-black">{headerDirectorRegister || '00000'}</span>.
                                  </p>
                                  <p>
                                    <span className="font-black text-gray-950">Membro:</span> <span className="text-red-600 uppercase font-black">{schedule.commissionMembers.secretary.name || 'NOME COMPLETO'}</span>, <span className="text-red-600 uppercase font-black">{schedule.commissionMembers.secretary.role || 'CARGO DO SERVIDOR'}</span>, matrícula nº <span className="text-red-600 uppercase font-black">{schedule.commissionMembers.secretary.register || '00000'}</span>.
                                  </p>
                                  <p>
                                    <span className="font-black text-gray-950">Membro:</span> <span className="text-red-600 uppercase font-black">{schedule.commissionMembers.member.name || 'NOME COMPLETO'}</span>, <span className="text-red-600 uppercase font-black">{schedule.commissionMembers.member.role || 'CARGO DO SERVIDOR'}</span>, matrícula nº <span className="text-red-600 uppercase font-black">{schedule.commissionMembers.member.register || '00000'}</span>.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* === TERMO DE RESPONSABILIDADE OFICIAL - PARTE 2 (PÁGINA 5) === */}
                        {includeResponsibility && (
                          <div className="w-full bg-white pt-8 pb-4 px-16 flex flex-col justify-between border border-gray-300 mb-12 relative" style={{ height: '260mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
                            <div className="max-w-xl mx-auto w-full font-sans text-black text-left">
                              <div className="space-y-1.5 text-[8px] font-medium text-gray-700 leading-normal text-justify tracking-wide">
                                <p className="font-black text-gray-950">
                                  Art. 3º Compete à Subcomissão de Inventário da Escola Estadual <span className="text-red-600 uppercase font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span>:
                                </p>
                                <div className="pl-4 space-y-0.5">
                                  <p>I - Solicitar ao responsável pela unidade, livre acesso a qualquer espaço físico para efetuar o levantamento dos bens;</p>
                                  <p>II - Requisitar os recursos necessários para a realização do levantamento;</p>
                                  <p>III - Realizar "in loco" o levantamento dos bens patrimoniais móveis da unidade, com apoio e orientação da Comissão Central de Inventário;</p>
                                  <p>IV - Solicitar ao responsável pela unidade levantada, quando necessário, auxílio, informações e documentos para identificação e quantificação dos bens;</p>
                                  <p>V - Verificar a integridade e a fixação do registro patrimonial de cada bem e em caso de avaria ou descolamento da plaqueta do modelo atualmente adotado, identificá-los com numeração provisória para posterior regularização;</p>
                                  <p>VI - Identificar na Planilha de Levantamento Físico o estado de conservação dos bens levantados, descrevendo suas características e informando os suscetíveis de desfazimento para ciência do Setor de Patrimônio;</p>
                                  <p>VII - Assinar as Planilhas de Levantamento Físico de Bens Móveis, juntamente com o responsável pela unidade.</p>
                                  <p>VIII - Elaborar Relatório Final de Levantamento da unidade, apresentando-o ao responsável para validação;</p>
                                  <p>IX - Solicitar à direção da Unidade Escolar, informações sobre os bens móveis adquiridos com recursos do PDDE, para que possam ser incorporados no SIGPAT e emplaquetados;</p>
                                  <p>XV - Registrar todas as ocorrências na realização dos trabalhos;</p>
                                </div>
                                <p>
                                  Art. 4º Quando convocados os membros da comissão ficarão à disposição para o desenvolvimento dos trabalhos instituídos nesta Portaria.
                                </p>
                                <p>
                                  Art. 5º O inventário deverá ser entregue a direção da unidade escolar para homologação e coleta de assinaturas o documento deverá ser encaminhado via em PDF no e-mail (inventario.mobiliario@educacao.mt.gov.br).
                                </p>
                                <p>
                                  Art. 6º Deverão ser inventariados TODOS OS BENS MÓVEIS PERMANENTES existentes nas unidades escolares e unidades vinculadas à SEDUC (Ex: Geladeira, ar condicionado, fogão, mesa, cadeira, projetor de imagens, televisão, aparelho de som, armário, liquidificar, CPU, notebook, etc), com a indicação dos elements necessários à sua perfeita caracterização (número do registro patrimonial, descrição detalhada do bem, cor, marca, potência, estado de conservação.</p>
                                <p>
                                  Parágrafo único. Fazer registro fotográfico dos bens que não possuem a plaqueta com número de patrimônio, plaquetas antigas (verdes), helpdesk. Os bens sem patrimônios serão incorporados ou tombados caso tenham nota fiscal, fazendo-se necessário as imagens para instrução processual de incorporação quando necessário.
                                </p>
                                <p>
                                  Declaro, para os devidos fins, que fica sob a RESPONSABILIDADE desta subcomissão, devidamente instituída, a realização do inventário de bens móveis conforme descrito nesse documento, comprometo-me a realizar os trabalhos conforme orientação da Comissão Central de Inventário, da Direção da Unidade Escolar, assim como no disposto no Guia de Levantamento Patrimonial.
                                </p>
                              </div>

                              {/* Assinaturas do Termo */}
                              <div className="mt-4 font-sans">
                                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-center text-[7px] font-bold uppercase text-gray-700 tracking-wider">
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1.5"></div>
                                    <p>{headerDirectorName || 'NOME COMPLETO'}</p>
                                    <p className="text-[7px] text-gray-400">Diretor da Escola Estadual</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1.5"></div>
                                    <p>{schedule.commissionMembers.president.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[7px] text-gray-400">Presidente da Subcomissão Inventariante</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1.5"></div>
                                    <p>{schedule.commissionMembers.secretary.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[7px] text-gray-400">Membro da Subcomissão Inventariante</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1.5"></div>
                                    <p>{schedule.commissionMembers.member.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[7px] text-gray-400">Membro da Subcomissão Inventariante</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* === 3. ATA DE ABERTURA DO INVENTÁRIO (PÁGINA 6) === */}
                        {includeAbertura && (
                          <div className="w-full bg-white p-16 flex flex-col justify-between border border-gray-300 mb-12 relative" style={{ height: '260mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
                            <div className="max-w-xl mx-auto w-full font-sans text-black text-left">
                              {/* Título */}
                              <h2 className="text-left text-sm font-black uppercase tracking-[0.2em] mb-6 border-b border-black pb-4 text-gray-900">
                                3. ATA DE ABERTURA DO INVENTÁRIO
                              </h2>
                              {/* Conteúdo */}
                              <div className="space-y-4 text-[9px] font-medium text-gray-700 leading-relaxed text-justify tracking-wide">
                                <p className="font-black text-gray-900 uppercase">
                                  Ata de abertura da realização da etapa preliminar do inventário anual de bens móveis permanentes de {headerAberturaAtaAno} da Escola Estadual <span className="text-red-600 font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span>.
                                </p>
                                <p>
                                  Aos {headerAberturaAtaDataTexto} de {headerAberturaAtaAno} ({headerAberturaAtaAno === '2025' ? 'dois mil e vinte e cinco' : 'dois mil e vinte e seis'}), reuniu-se nas dependências da Escola Estadual <span className="text-red-600 font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span> a Subcomissão Inventariante, composta conforme descrito na ata da reunião do Colegiado Escolar de {headerAberturaColegiadoData}, pelos servidores <span className="text-red-600 font-black">{schedule.commissionMembers.president.name || 'PRESIDENTE'}</span>, <span className="text-red-600 font-black">{schedule.commissionMembers.secretary.name || 'SECRETÁRIO(A)'}</span> e <span className="text-red-600 font-black">{schedule.commissionMembers.member.name || 'MEMBRO'}</span>, para, sob a presidência da primeira, iniciar a realização do Inventário Anual de Bens Móveis - Exercício - Ano-Base {headerAberturaAtaAno}, referente aos bens patrimoniais móveis permanentes, no âmbito da Escola Estadual <span className="text-red-600 font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span>, de acordo com a Portaria nº <span className="text-red-600 font-black">{headerPortaria}</span>, publicada em 15 de julho de 2024 da Secretaria de Estado de Educação de Mato Grosso, e demais informações repassadas pelo Setor da Coordenadoria de Mobiliário e Comissão Central de Inventário da Secretaria de Estado de Educação - MT. Os trabalhos de levantamento dos bens patrimoniais móveis serão realizados conforme as orientações encaminhadas pela Coordenadoria de Mobiliário. Não havendo nada mais a tratar, eu, <span className="text-red-600 font-black">{schedule.commissionMembers.president.name || 'NOME PRESIDENTE'}</span>, lavrei a presente ata, assinada por todos os presentes.
                                </p>
                              </div>

                              {/* Assinaturas */}
                              <div className="mt-12 font-sans pt-6">
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-center text-[8px] font-bold uppercase text-gray-700 tracking-wider">
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1.5"></div>
                                    <p>{headerDirectorName || 'NOME COMPLETO'}</p>
                                    <p className="text-[7px] text-gray-400">Diretor da Escola Estadual {headerUA || 'ANDRÉ ANTONIO MAGGI'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1.5"></div>
                                    <p>{schedule.commissionMembers.president.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[7px] text-gray-400">Presidente da Subcomissão Inventariante</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1.5"></div>
                                    <p>{schedule.commissionMembers.secretary.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[7px] text-gray-400">Membro da Subcomissão Inventariante</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1.5"></div>
                                    <p>{schedule.commissionMembers.member.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[7px] text-gray-400">Membro da Subcomissão Inventariante</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* === 4. DOS TRABALHOS - METODOLOGIA (PÁGINA 7) === */}
                        {includeMetodologia && (
                          <div className="w-full bg-white p-16 flex flex-col justify-center border border-gray-300 mb-12 relative" style={{ height: '260mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
                            <div className="max-w-xl mx-auto w-full font-sans text-black text-left">
                              {/* Título */}
                              <h2 className="text-left text-sm font-black uppercase tracking-[0.2em] mb-6 border-b border-black pb-4 text-gray-900">
                                4. DOS TRABALHOS - METODOLOGIA
                              </h2>
                              {/* Conteúdo */}
                              <div className="space-y-3 text-[10px] font-medium text-gray-700 leading-relaxed text-justify tracking-wide">
                                <p>
                                  Os trabalhos foram realizados tendo por base os relatórios extraídos no sistema de gestão patrimonial, contendo a relação de bens registrados na carga patrimonial da Escola Estadual <span className="text-red-600 font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span>. De posse desses relatórios, passou-se a conferência dos bens móveis, item a item.
                                </p>
                                <p>
                                  Foram inventariados TODOS OS BENS MÓVEIS PERMANENTES existentes na escola (Ex: Geladeira, ar condicionado, fogão, mesa, cadeira, projetor de imagens, televisão, aparelho de som, armário, liquidificar, CPU, notebook, etc), com a indicação dos elementos necessários à sua perfeita caracterização (número do registro patrimonial, descrição detalhada do bem, cor, estado de conservação e indicação se possui ou não plaqueta).
                                </p>
                                <p>
                                  As carteiras e conjuntos escolares (mesa e cadeira) de sala de aula também foram lançadas no Inventário, contendo sua descrição, estado de conservação e quantidade (por orientação da Comissão Central de Inventário, não foi necessário informar o número do registro patrimonial, apenas a quantidade).
                                </p>
                                <p>
                                  Os dados foram relacionados em formulário de inventário padronizado, de acordo com as orientações da Comissão Central de Inventário.
                                </p>
                                <p>
                                  Conforme orientado, foram identificados algumas pendências e divergências existentes em relação à carga patrimonial, sendo sugeridos as providências a serem adotadas para solução das mesmas.
                                </p>
                                <p>
                                  Foram relacionados em uma planilha à parte os bens móveis permanentes que encontram-se sem número de registro patrimonial. Em outra planilha foram relacionados os bens inservíveis, sucateados, obsoletos, para as providências necessárias à sua baixa.
                                </p>
                                <p>
                                  Além disso, foram catalogados os bens móveis permanentes adquiridos com recursos do Programa Dinheiro Direto na Escola - PDDE.
                                </p>
                                <p>
                                  Durante o levantamento observou-se a existência de bens patrimoniais sem plaquetas e/ou bens identificados com mais de uma plaqueta.
                                </p>
                                <p>
                                  Para a correta descrição dos bens foram realizadas consultas no Guia de Levantamento Patrimonial disponibilizado pela Comissão Central de Inventário.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* === CABEÇALHO OFICIAL (De Acordo Com O Modelo) === */}
                        <div className="flex border border-gray-800 text-[10px] items-stretch">
                          {/* Logo Esquerda */}
                          <div className="w-1/4 border-r border-gray-800 p-2 flex items-center justify-center gap-2 bg-white">
                            <img src="/brasao_mt.png" alt="Brasão MT" className="h-10 w-auto object-contain" onError={(e)=>{e.currentTarget.style.display='none'}} />
                            <div className="text-left font-black leading-none text-gray-800 text-[8px] flex flex-col gap-0.5">
                              <span>SEDUC</span>
                              <span className="text-[6px] text-gray-400 font-bold uppercase">SECRETARIA DE ESTADO<br/>DE EDUCAÇÃO</span>
                            </div>
                          </div>
                          {/* Texto Central */}
                          <div className="w-3/4 p-3 flex flex-col items-center justify-center text-center font-black uppercase tracking-wide leading-normal text-gray-900">
                            <p className="text-xs">GOVERNO DO ESTADO DE MATO GROSSO</p>
                            <p className="text-xs">SECRETARIA DE ESTADO DE EDUCAÇÃO</p>
                            <p className="text-[10px] text-gray-500 font-bold">SECRETARIA ADJUNTA DE PATRIMÔNIO E SERVIÇOS</p>
                          </div>
                        </div>
                        
                        {/* Faixa de Título */}
                        <div className="bg-[#1b365d] text-white text-center font-black uppercase py-2 text-xs border-x border-b border-gray-800">
                          PLANILHA DE LEVANTAMENTO FÍSICO DE BENS MÓVEIS
                        </div>

                        {/* Tabela de Informações / Campos de Subcabeçalho */}
                        <table className="w-full text-[9px] border-collapse border-x border-b border-gray-800 font-bold text-gray-800">
                          <tbody>
                            <tr className="border-b border-gray-800">
                              <td className="p-2 border-r border-gray-800 uppercase w-1/2">
                                UNIDADE GESTORA: <span className="font-black">{headerUG}</span>
                              </td>
                              <td className="p-2 uppercase w-1/2">
                                CÓDIGO UG: <span className="font-black">{headerCodUG}</span>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800">
                              <td className="p-2 border-r border-gray-800 uppercase">
                                UNIDADE ADM: <span className="font-black">{headerUA}</span>
                              </td>
                              <td className="p-2 uppercase">
                                CÓDIGO UA: <span className="font-black">{headerCodUA}</span>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800">
                              <td className="p-2 border-r border-gray-800 uppercase">
                                MUNICÍPIO: <span className="font-black">{headerMunicipio}</span>
                              </td>
                              <td className="p-2 uppercase">
                                CÓDIGO UL: <span className="font-black">{headerCodUL}</span>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800">
                              <td className="p-2 border-r border-gray-800 uppercase">
                                RESPONSÁVEL: <span className="font-black">{headerResponsavel}</span>
                              </td>
                              <td className="p-2 uppercase">
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-gray-800 uppercase">
                                MATRICULA: <span className="font-black">{headerMatricula}</span>
                              </td>
                              <td className="p-2 uppercase">
                                CPF: <span className="font-black">{headerCPF}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Faixa de Legenda */}
                        <div className="bg-[#1b365d] text-white font-black text-[9px] uppercase px-4 py-2 border-x border-b border-gray-800 flex justify-between">
                          <span>Legenda : SITUAÇÃO FÍSICA</span>
                          <span>Ótimo - OT</span>
                          <span>Bom - BO</span>
                          <span>Ruim - RU</span>
                          <span>Péssimo - PE</span>
                        </div>

                        {/* Tabela de Itens principal */}
                        <table className="w-full border-collapse text-[9px] border border-gray-800 mt-4 text-gray-800">
                          <thead>
                            <tr className="bg-gray-100 font-bold border-b border-gray-800 text-center">
                              <th className="p-2 border-r border-gray-800 w-24">Nº PATRIMÔNIO</th>
                              <th className="p-2 border-r border-gray-800 w-20">SEM Nº R.P</th>
                              <th className="p-2 border-r border-gray-800 w-12">UN.</th>
                              <th className="p-2 border-r border-gray-800 text-left">DESCRIÇÃO / ESPECIFICAÇÃO DO BEM (EX: Características físicas, medidas, modelo, tipo, número de série, cor, material)</th>
                              <th className="p-2 border-r border-gray-800 w-24">SITUAÇÃO FÍSICA</th>
                              <th className="p-2 w-32">AMBIENTE</th>
                            </tr>
                          </thead>
                          <tbody className="font-bold uppercase text-center">
                            {reportAssets.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-400">Nenhum bem móvel encontrado.</td>
                              </tr>
                            ) : (
                              reportAssets.map((asset) => (
                                <tr key={asset.id} className="border-b border-gray-800">
                                  <td className="p-2 border-r border-gray-800 font-black">{isSemRp(asset.heritageNumber) ? '' : asset.heritageNumber}</td>
                                  <td className="p-2 border-r border-gray-800 font-black">{isSemRp(asset.heritageNumber) ? 'X' : ''}</td>
                                  <td className="p-2 border-r border-gray-800">UN</td>
                                  <td className="p-2 border-r border-gray-800 text-left">{asset.description}</td>
                                  <td className="p-2 border-r border-gray-800">{getSitFisica(asset.condition, asset.isUnserviceable)}</td>
                                  <td className="p-2 text-center">{asset.location}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>

                        {/* === 6. RELATÓRIO FINAL DE INVENTÁRIO (PÁGINA APÓS TABELA) === */}
                        {includeRelatorio && (
                          <div className="w-full bg-white p-16 flex flex-col justify-between border border-gray-300 mb-12 mt-12 relative animate-in fade-in" style={{ height: '260mm', breakBefore: 'page', pageBreakBefore: 'always' }}>
                            <div className="max-w-xl mx-auto w-full font-sans text-black text-left">
                              {/* Título */}
                              <h2 className="text-left text-sm font-black uppercase tracking-[0.2em] mb-4 border-b border-black pb-2 text-gray-900">
                                6. RELATÓRIO FINAL DE INVENTÁRIO
                              </h2>
                              <div className="space-y-3 text-[8px] font-medium text-gray-700 leading-normal text-justify tracking-wide">
                                <div className="text-center font-black uppercase text-gray-900 pb-2">
                                  Modelo de Relatório Final de Inventário de Bens móveis do exercício {headerAberturaAtaAno}
                                  <p className="text-red-600 text-[10px] mt-0.5">Escola Estadual {headerUA}</p>
                                </div>
                                <p>
                                  A "Comissão de Inventário de Bens móveis" nomeada pela Portaria nº <span className="text-red-600 font-black">{headerPortaria}</span>, designada para a realização do Inventário de Bens móveis no período de <span className="text-red-600 font-black">{headerRelatorioPeriodo}</span>, apresenta o relatório de conclusão dos trabalhos.
                                </p>
                                <p className="font-black text-gray-900">6.1 - OBJETIVO</p>
                                <p className="pl-4">
                                  Realizar o inventário Anual dos bens móveis da Escola Estadual <span className="text-red-600 font-black">{headerUA}</span>, unidade vinculada à SEDUC/MT para o exercício {headerAberturaAtaAno}, apresentando a ata de abertura, cópia da portaria que instituiu a comissão, planilhas de levantamento patrimonial, e demais documentos que seguem assinados pelo diretor da unidade escolar, bem como, pelos membros da subcomissão.
                                </p>
                                <p className="font-black text-gray-900">6.2 - DESENVOLVIMENTO/ METODOLOGIA DO TRABALHO</p>
                                <p className="pl-4">
                                  Os trabalhos foram realizados tendo por base os relatórios extraídos no sistema de gestão patrimonial, contendo a relação de bens registrados na carga patrimonial da Escola Estadual <span className="text-red-600 font-black">{headerUA}</span>. De posse desses relatórios, passou-se a conferência dos bens móveis, item a item. Foram inventariados todos os bens móveis permanentes existentes na escola (Ex: Geladeira, ar condicionado, fogão, mesa, cadeira, etc).
                                </p>
                                
                                <p className="font-black text-gray-900">6.3 - DADOS DA SUBCOMISSÃO</p>
                                <div className="pl-4 space-y-1 text-[7.5px]">
                                  <p><span className="font-black">Nº da Comissão:</span> {headerComissaoNumero}</p>
                                  <p>
                                    <span className="font-black">Presidente:</span> {schedule.commissionMembers.president.name || 'NOME COMPLETO'}, Matrícula: {schedule.commissionMembers.president.register || '000000'} | E-mail: {headerSchoolEmail} | Fone: {headerSchoolPhone}
                                  </p>
                                  <p>
                                    <span className="font-black">Membro 1:</span> {schedule.commissionMembers.secretary.name || 'NOME COMPLETO'}, Matrícula: {schedule.commissionMembers.secretary.register || '000000'} | E-mail: {headerSchoolEmail} | Fone: {headerSchoolPhone}
                                  </p>
                                  <p>
                                    <span className="font-black">Membro 2:</span> {schedule.commissionMembers.member.name || 'NOME COMPLETO'}, Matrícula: {schedule.commissionMembers.member.register || '000000'} | E-mail: {headerSchoolEmail} | Fone: {headerSchoolPhone}
                                  </p>
                                </div>

                                <p className="font-black text-gray-900">6.4 - RESPONSÁVEL PELA UNIDADE ESCOLAR</p>
                                <p className="pl-4 text-[7.5px]">
                                  <span className="font-black">DIRETOR:</span> {headerDirectorName} | Matrícula: {headerDirectorRegister} | E-mail: {headerSchoolEmail} | Fone: {headerSchoolPhone}
                                </p>

                                <p className="text-right font-black pt-2 text-[8px] text-gray-900">
                                  {headerRelatorioData}
                                </p>
                              </div>

                              {/* Assinaturas */}
                              <div className="mt-4 font-sans">
                                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-center text-[7px] font-bold uppercase text-gray-700 tracking-wider">
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1"></div>
                                    <p>{headerDirectorName || 'NOME COMPLETO'}</p>
                                    <p className="text-[6px] text-gray-400">Diretor da Unidade Escolar</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1"></div>
                                    <p>{schedule.commissionMembers.president.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[6px] text-gray-400">Presidente da Subcomissão de Inventário</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1"></div>
                                    <p>{schedule.commissionMembers.secretary.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[6px] text-gray-400">Demais membros da Subcomissão</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1"></div>
                                    <p>{schedule.commissionMembers.member.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[6px] text-gray-400">Demais membros da Subcomissão</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* === 7. REGISTRO FOTOGRÁFICO DE BENS (PÁGINA APÓS RELATÓRIO) === */}
                        {includeFoto && (
                          <div className="w-full bg-white p-16 flex flex-col justify-center border border-gray-300 mb-12 relative" style={{ height: '260mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
                            <div className="max-w-xl mx-auto w-full font-sans text-black text-left">
                              {/* Título */}
                              <h2 className="text-left text-sm font-black uppercase tracking-[0.2em] mb-6 border-b border-black pb-4 text-gray-900">
                                7. REGISTRO FOTOGRÁFICO DE BENS
                              </h2>
                              {/* Conteúdo */}
                              <div className="space-y-6 text-[10px] font-medium text-gray-700 leading-relaxed text-justify tracking-wide">
                                <p className="bg-gray-50 border border-gray-200 p-4 rounded-xl font-black text-gray-800">
                                  Preencher planilha auxiliar na aba "Registro Fotográfico". Inserindo na descrição a ser utilizada na imagem, a mesma descrição que foi colocada no processo de levantamento físico.
                                </p>
                                <div className="space-y-2 border-l-4 border-blue-600 pl-4">
                                  <p className="font-bold text-gray-900">Exemplo prático de padronização:</p>
                                  <p><span className="font-black text-gray-950">Levantamento Físico:</span> Ar condicionado Samsung 24.000 btus</p>
                                  <p><span className="font-black text-gray-950">Registro fotográfico:</span> Ar condicionado Samsung 24.000 btus.</p>
                                </div>
                                <p className="text-amber-700 font-bold bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl">
                                  <span className="font-black">OBSERVAÇÃO IMPORTANTE:</span> Somente é necessário fazer o registro fotográfico de bens que não possuem a plaqueta com número de patrimônio, plaquetas antigas (verdes) ou etiquetas de Helpdesk (azuis).
                                </p>
                                
                                {/* Placeholder de fotos */}
                                <div className="grid grid-cols-2 gap-6 pt-4">
                                  <div className="border-2 border-dashed border-gray-300 rounded-2xl h-36 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                    <span className="text-[8px] font-black uppercase tracking-wider">Espaço para Foto 01</span>
                                    <span className="text-[6px] text-gray-400/80 mt-1 font-bold">Colar imagem do bem sem plaqueta</span>
                                  </div>
                                  <div className="border-2 border-dashed border-gray-300 rounded-2xl h-36 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                    <span className="text-[8px] font-black uppercase tracking-wider">Espaço para Foto 02</span>
                                    <span className="text-[6px] text-gray-400/80 mt-1 font-bold">Colar imagem do bem com plaqueta antiga</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* === 8. ATA DE ENCERRAMENTO (PÁGINA APÓS FOTO) === */}
                        {includeEncerramento && (
                          <div className="w-full bg-white p-16 flex flex-col justify-between border border-gray-300 mb-12 relative" style={{ height: '260mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
                            <div className="max-w-xl mx-auto w-full font-sans text-black text-left">
                              {/* Título */}
                              <h2 className="text-left text-sm font-black uppercase tracking-[0.2em] mb-4 border-b border-black pb-2 text-gray-900">
                                8. ATA DE ENCERRAMENTO DE INVENTÁRIO
                              </h2>
                              {/* Conteúdo */}
                              <div className="space-y-4 text-[9px] font-medium text-gray-700 leading-relaxed text-justify tracking-wide">
                                <div className="text-center font-black uppercase text-gray-900 pb-1">
                                  Ata de Encerramento do Inventário dos Bens Patrimoniais da Escola Estadual {headerUA || 'ANDRÉ ANTONIO MAGGI'} em {headerMunicipio || 'LUCAS DO RIO VERDE'}.
                                  <p className="text-red-600 font-bold mt-0.5">ATA Nº {headerComissaoNumero}</p>
                                </div>
                                <p>
                                  Aos {headerEncerramentoAtaDataTexto}, na sede da Escola Estadual <span className="text-red-600 font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span>, encerrou-se o levantamento e o processo de inventário físico de bens móveis. Os serviços foram realizados pela Subcomissão de Inventário, legalmente instituída pela Portaria nº <span className="text-red-600 font-black">{headerPortaria}</span>, com o intuito de realizar a conferência, levantamento e preenchimento da ficha de levantamento patrimonial. No andamento dos trabalhos constatou-se a existência de bens que encontram-se sem o número de Registro Patrimonial - RP, bens com dois números de RP, e ainda bens considerados inservíveis, que foram relacionados, para as devidas providências. Foram identificados e relacionados bens móveis permanentes adquiridos com recursos do PDDE/PDE, e que não estavam registrados no sistema de gestão patrimonial, nem emplaquetados. Assim sendo, segue anexo o relatório geral dos bens inventariados da Escola Estadual <span className="text-red-600 font-black">{headerUA || 'ANDRÉ ANTONIO MAGGI'}</span>, para o ano de {headerEncerramentoAtaAno}. Assim encerra-se o inventário de {headerEncerramentoAtaAno}, que vai assinado por mim, presidente da Subcomissão de Inventário, pelo Diretor da Unidade Escolar e demais membros da Subcomissão.
                                </p>
                                <p className="text-right font-black pt-2 text-[8px] text-gray-900">
                                  {headerEncerramentoData}
                                </p>
                              </div>

                              {/* Assinaturas */}
                              <div className="mt-8 font-sans">
                                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-center text-[7px] font-bold uppercase text-gray-700 tracking-wider">
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1"></div>
                                    <p>{headerDirectorName || 'NOME COMPLETO'}</p>
                                    <p className="text-[6px] text-gray-400">Diretor da Escola Estadual</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1"></div>
                                    <p>{schedule.commissionMembers.president.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[6px] text-gray-400">Presidente da Subcomissão Inventariante</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1"></div>
                                    <p>{schedule.commissionMembers.secretary.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[6px] text-gray-400">Membro da Subcomissão Inventariante</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="border-t border-gray-400 w-full pt-1"></div>
                                    <p>{schedule.commissionMembers.member.name || 'NOME COMPLETO'}</p>
                                    <p className="text-[6px] text-gray-400">Membro da Subcomissão Inventariante</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : activeTab === 'cronograma' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* 1. DASHBOARD DE CONTROLE */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Cronograma de Inventário Anual</h3>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                      Acompanhamento de prazos, comissão e geração de laudos oficiais SEDUC-MT
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={fetchSchedule}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                      Atualizar Dados
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Deseja reiniciar o cronograma para o padrão deste ano? Isso apagará o progresso atual.")) {
                          const initial = defaultSchedule(new Date().getFullYear());
                          setSchedule(initial);
                          setCommissionForm(initial.commissionMembers);
                          saveSchedule(initial);
                        }
                      }}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                      Reiniciar Ciclo
                    </button>
                  </div>
                </div>

                {/* KPI CARDS & PROGRESS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Card Progresso */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-600">
                      <TrendingUp size={120} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progresso do Inventário</span>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-5xl font-black text-blue-600">
                          {Math.round(
                            schedule.phases.reduce((acc, phase) => {
                              const completed = phase.tasks.filter(t => t.completed).length;
                              const pProgress = phase.tasks.length > 0 ? (completed / phase.tasks.length) * 100 : 0;
                              return acc + (pProgress * (phase.weight / 100));
                            }, 0)
                          )}%
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase">Concluído</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden mt-6">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round(
                            schedule.phases.reduce((acc, phase) => {
                              const completed = phase.tasks.filter(t => t.completed).length;
                              const pProgress = phase.tasks.length > 0 ? (completed / phase.tasks.length) * 100 : 0;
                              return acc + (pProgress * (phase.weight / 100));
                            }, 0)
                          )}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Card Exercício */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Período Vigente</span>
                      <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mt-3">
                        Exercício {schedule.year}
                      </h4>
                      <p className="text-xs font-bold text-gray-400 mt-1">
                        Início: {new Date(schedule.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} <br />
                        Término: {new Date(schedule.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black uppercase w-max">
                      <Calendar size={12} /> Status: {schedule.status}
                    </span>
                  </div>

                  {/* Card Estatísticas Rápidas */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informações de Apoio</span>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <span className="text-[9px] font-black text-gray-400 uppercase">Ambientes Cadastrados</span>
                          <p className="text-xl font-black text-gray-800">{uniqueLocations.length}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-gray-400 uppercase">Total de Itens</span>
                          <p className="text-xl font-black text-gray-800">{assets.length}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-gray-400 uppercase">Bens Inservíveis</span>
                          <p className="text-xl font-black text-red-600">
                            {assets.filter(a => a.isUnserviceable).length}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-gray-400 uppercase">Carga Patrimonial OK</span>
                          <p className="text-xl font-black text-emerald-600">
                            {assets.filter(a => !a.isUnserviceable).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GESTÃO DE COMISSÃO & CHECKLIST DAS FASES */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Checklist das Fases (Coluna da Esquerda / Meio) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100/80 shadow-sm">
                      <div className="flex items-center gap-2 pb-4 border-b border-gray-50 mb-6">
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                        <h4 className="text-xs font-black uppercase text-gray-800 tracking-widest">Fases do Inventário (Checklist)</h4>
                      </div>

                      <div className="space-y-4">
                        {schedule.phases.map(phase => {
                          const completedTasks = phase.tasks.filter(t => t.completed).length;
                          const totalTasks = phase.tasks.length;
                          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                          const isExpanded = expandedPhaseId === phase.id;

                          return (
                            <div
                              key={phase.id}
                              className={`border rounded-3xl transition-all overflow-hidden ${
                                isExpanded ? 'border-blue-200 bg-blue-50/10 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
                              }`}
                            >
                              {/* Header da Fase */}
                              <div
                                onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                                className="p-5 flex items-center justify-between cursor-pointer select-none"
                              >
                                <div className="flex-1 min-w-0 pr-4">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                      {phase.weight}% Peso
                                    </span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                                      progress === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      progress > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                                    }`}>
                                      {progress === 100 ? 'CONCLUÍDA' : progress > 0 ? 'EM ANDAMENTO' : 'PENDENTE'}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold">
                                      Período: {new Date(phase.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(phase.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  <h5 className="text-sm font-black text-gray-800 uppercase tracking-tight mt-2 truncate">
                                    {phase.name}
                                  </h5>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                  <div className="text-right">
                                    <span className="text-xs font-black text-gray-700">{completedTasks}/{totalTasks} Tarefas</span>
                                    <p className="text-[9px] font-bold text-gray-400">{progress}% concluído</p>
                                  </div>
                                  {isExpanded ? <ChevronUp className="text-gray-400" size={18} /> : <ChevronDown className="text-gray-400" size={18} />}
                                </div>
                              </div>

                              {/* Lista de Tarefas da Fase */}
                              {isExpanded && (
                                <div className="border-t border-gray-100 p-6 bg-white space-y-4">
                                  {phase.tasks.map(task => (
                                    <label
                                      key={task.id}
                                      className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => {
                                          const updatedPhases = schedule.phases.map(p => {
                                            if (p.id === phase.id) {
                                              const updatedTasks = p.tasks.map(t => {
                                                if (t.id === task.id) {
                                                  return { ...t, completed: !t.completed };
                                                }
                                                return t;
                                              });
                                              // Atualiza status da fase com base nas tarefas
                                              const doneCount = updatedTasks.filter(t => t.completed).length;
                                              const pStatus = doneCount === updatedTasks.length ? 'CONCLUIDO' : doneCount > 0 ? 'EM_ANDAMENTO' : 'PENDENTE';
                                              return { ...p, tasks: updatedTasks, status: pStatus as any };
                                            }
                                            return p;
                                          });

                                          // Atualiza status global do cronograma com base nas fases concluídas
                                          const allDone = updatedPhases.every(p => p.status === 'CONCLUIDO');
                                          const anyStarted = updatedPhases.some(p => p.status !== 'PENDENTE');
                                          const newGlobalStatus = allDone ? 'HOMOLOGADO' : anyStarted ? 'EM_EXECUCAO' : 'PLANEJAMENTO';

                                          const updated = {
                                            ...schedule,
                                            status: newGlobalStatus,
                                            phases: updatedPhases
                                          };
                                          setSchedule(updated);
                                          saveSchedule(updated);
                                        }}
                                        className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className={`text-xs font-bold text-gray-700 leading-normal ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                          {task.title}
                                        </p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Coluna da Direita (Comissão e Documentos) */}
                  <div className="space-y-6">
                    {/* Comissão Card */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100/80 shadow-sm space-y-6">
                      <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                        <Users className="text-blue-600" size={16} />
                        <h4 className="text-xs font-black uppercase text-gray-800 tracking-widest">Comissão Inventariante</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Presidente da Comissão</label>
                          <input
                            type="text"
                            placeholder="Nome Completo"
                            value={commissionForm.president.name}
                            onChange={e => setCommissionForm({
                              ...commissionForm,
                              president: { ...commissionForm.president, name: e.target.value.toUpperCase() }
                            })}
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <input
                              type="text"
                              placeholder="Cargo/Função"
                              value={commissionForm.president.role}
                              onChange={e => setCommissionForm({
                                ...commissionForm,
                                president: { ...commissionForm.president, role: e.target.value.toUpperCase() }
                              })}
                              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Matrícula"
                              value={commissionForm.president.register}
                              onChange={e => setCommissionForm({
                                ...commissionForm,
                                president: { ...commissionForm.president, register: e.target.value.toUpperCase() }
                              })}
                              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Secretário da Comissão</label>
                          <input
                            type="text"
                            placeholder="Nome Completo"
                            value={commissionForm.secretary.name}
                            onChange={e => setCommissionForm({
                              ...commissionForm,
                              secretary: { ...commissionForm.secretary, name: e.target.value.toUpperCase() }
                            })}
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <input
                              type="text"
                              placeholder="Cargo/Função"
                              value={commissionForm.secretary.role}
                              onChange={e => setCommissionForm({
                                ...commissionForm,
                                secretary: { ...commissionForm.secretary, role: e.target.value.toUpperCase() }
                              })}
                              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Matrícula"
                              value={commissionForm.secretary.register}
                              onChange={e => setCommissionForm({
                                ...commissionForm,
                                secretary: { ...commissionForm.secretary, register: e.target.value.toUpperCase() }
                              })}
                              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Membro da Comissão</label>
                          <input
                            type="text"
                            placeholder="Nome Completo"
                            value={commissionForm.member.name}
                            onChange={e => setCommissionForm({
                              ...commissionForm,
                              member: { ...commissionForm.member, name: e.target.value.toUpperCase() }
                            })}
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <input
                              type="text"
                              placeholder="Cargo/Função"
                              value={commissionForm.member.role}
                              onChange={e => setCommissionForm({
                                ...commissionForm,
                                member: { ...commissionForm.member, role: e.target.value.toUpperCase() }
                              })}
                              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Matrícula"
                              value={commissionForm.member.register}
                              onChange={e => setCommissionForm({
                                ...commissionForm,
                                member: { ...commissionForm.member, register: e.target.value.toUpperCase() }
                              })}
                              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const updated = {
                            ...schedule,
                            commissionMembers: commissionForm
                          };
                          setSchedule(updated);
                          saveSchedule(updated);
                          alert("Membros da comissão salvos com sucesso!");
                        }}
                        className="w-full py-4 bg-gray-900 text-white hover:bg-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Check size={14} /> Salvar Comissão
                      </button>
                    </div>

                    {/* Documentos Oficiais Card */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100/80 shadow-sm space-y-6">
                      <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                        <FileText className="text-blue-600" size={16} />
                        <h4 className="text-xs font-black uppercase text-gray-800 tracking-widest">Documentação Oficial</h4>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => setSelectedDocument('portaria')}
                          disabled={!commissionForm.president.name}
                          className={`w-full text-left p-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                            commissionForm.president.name
                              ? 'bg-blue-50/30 border-blue-100 text-blue-700 hover:bg-blue-50'
                              : 'bg-gray-50 border-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span>Portaria de Designação</span>
                          <ChevronRight size={16} />
                        </button>

                        <button
                          onClick={() => setSelectedDocument('abertura')}
                          disabled={!commissionForm.president.name}
                          className={`w-full text-left p-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                            commissionForm.president.name
                              ? 'bg-blue-50/30 border-blue-100 text-blue-700 hover:bg-blue-50'
                              : 'bg-gray-50 border-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span>Termo de Abertura</span>
                          <ChevronRight size={16} />
                        </button>

                        <button
                          onClick={() => setSelectedDocument('relatorio')}
                          disabled={!commissionForm.president.name}
                          className={`w-full text-left p-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                            commissionForm.president.name
                              ? 'bg-blue-50/30 border-blue-100 text-blue-700 hover:bg-blue-50'
                              : 'bg-gray-50 border-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span>Relatório Final Circunstanciado</span>
                          <ChevronRight size={16} />
                        </button>

                        <button
                          onClick={() => setSelectedDocument('encerramento')}
                          disabled={!commissionForm.president.name}
                          className={`w-full text-left p-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                            commissionForm.president.name
                              ? 'bg-blue-50/30 border-blue-100 text-blue-700 hover:bg-blue-50'
                              : 'bg-gray-50 border-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span>Termo de Encerramento</span>
                          <ChevronRight size={16} />
                        </button>

                        <button
                          onClick={() => setSelectedDocument('cronograma_seduc')}
                          disabled={!commissionForm.president.name}
                          className={`w-full text-left p-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                            commissionForm.president.name
                              ? 'bg-blue-50/30 border-blue-100 text-blue-700 hover:bg-blue-50'
                              : 'bg-gray-50 border-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span>Ficha de Cronograma (SEDUC-MT)</span>
                          <ChevronRight size={16} />
                        </button>

                        {!commissionForm.president.name && (
                          <p className="text-[9px] text-red-500 font-bold uppercase mt-1 leading-normal text-center">
                            ⚠️ Preencha os dados da comissão e salve para liberar a geração de documentos.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 min-w-0 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0 w-full">
                  <h3 className="text-base sm:text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 min-w-0 flex-1 truncate">
                    <span className="truncate">{activeTab === 'inventory' ? 'Inventário de Bens Móveis Ativos' : 'Relatório de Itens Móveis Inservíveis'}</span>
                    <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-lg shrink-0">{filteredAssets.length} Registros</span>
                  </h3>
                  <button onClick={() => handleExportPDF('inventory-list', activeTab === 'inventory' ? 'Inventario_Ativo' : 'Relatorio_Inserviveis')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-gray-50 transition-all shrink-0">
                    <FileDown size={14} /> Exportar para PDF
                  </button>
                </div>

                <div id="inventory-list" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 min-w-0 w-full">
                  {filteredAssets.filter(a => activeTab === 'inventory' ? !a.isUnserviceable : a.isUnserviceable).map(asset => {
                    const isPessimo = asset.condition === 'PÉSSIMO';
                    return (
                      <div key={asset.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-xl transition-all group flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                              {asset.photo ? (
                                <img src={asset.photo} className="w-full h-full object-cover" alt="Bem" />
                              ) : (
                                <ImageIcon size={24} className="text-gray-300" />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleStartEdit(asset)} className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all" title="Editar"><Edit2 size={16} /></button>
                              <button onClick={() => setShowHistoryModal(asset)} className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all" title="Histórico"><History size={16} /></button>
                              <button onClick={() => deleteAsset(asset.id)} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-lg transition-all" title="Excluir"><Trash2 size={16} /></button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">PAT: {asset.heritageNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getConditionColor(asset.condition)}`}>
                              {isPessimo ? 'INSERVÍVEL' : asset.condition}
                            </span>
                          </div>

                          <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm leading-tight line-clamp-2">{asset.description}</h4>

                          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            <MapPin size={12} className="text-blue-500" /> {asset.location}
                          </div>

                          {asset.acquisitionDocument && (
                            <div className="mt-2 text-[9px] font-black text-gray-500 uppercase tracking-tight bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-1.5">
                              <span>📄 Doc: {asset.acquisitionDocument}</span>
                              {asset.acquisitionYear && (
                                <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[8px] font-black shrink-0">{asset.acquisitionYear}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(asset.timestamp).toLocaleDateString('pt-BR')}</span>
                          <button className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline">Ficha Técnica <ChevronRight size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL NOVO BEM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 bg-blue-50 border-b border-blue-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Monitor size={24} /></div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{editingAssetId ? 'Editar Bem Móvel' : 'Novo Bem Móvel'}</h3>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">{editingAssetId ? 'Atualização de Patrimônio' : 'Cadastro de Patrimônio'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidência Fotográfica</label>
                    <div
                      onClick={() => document.getElementById('photo-input')?.click()}
                      className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-blue-300 transition-all group relative overflow-hidden"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <>
                          <div className="p-4 bg-white rounded-2xl text-gray-300 shadow-sm group-hover:text-blue-500 transition-colors"><Camera size={32} /></div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Carregar Foto</p>
                        </>
                      )}
                      <input id="photo-input" type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                      <textarea
                        required
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value.toUpperCase() })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all h-24 resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ambiente</label>
                      <input
                        required
                        type="text"
                        list="locations-list"
                        value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value.toUpperCase() })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                      />
                      <datalist id="locations-list">
                        {uniqueLocations.map(l => <option key={l} value={l} />)}
                      </datalist>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nº Patrimônio</label>
                      <input
                        required
                        type="number"
                        value={form.heritageNumber}
                        onChange={e => setForm({ ...form, heritageNumber: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-lg outline-none focus:bg-white transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nº Termo / Nota Fiscal</label>
                        <input
                          type="text"
                          placeholder="Ex: TERMO 12/2026 ou NF 345"
                          value={form.acquisitionDocument}
                          onChange={e => setForm({ ...form, acquisitionDocument: e.target.value })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs outline-none focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano</label>
                        <input
                          type="number"
                          placeholder="Ex: 2026"
                          value={form.acquisitionYear}
                          onChange={e => setForm({ ...form, acquisitionYear: e.target.value })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs outline-none focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado de Conservação</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['EXCELENTE', 'BOM', 'REGULAR', 'PÉSSIMO'].map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => setForm({ ...form, condition: cond as AssetCondition })}
                          className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${form.condition === cond
                            ? (cond === 'PÉSSIMO' ? 'bg-red-600 border-red-700 text-white' : 'bg-blue-600 border-blue-700 text-white')
                            : 'bg-gray-50 border-gray-100 text-gray-400'
                            }`}
                        >
                          {cond === 'PÉSSIMO' ? 'INSERVÍVEL' : cond}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.location && (
                    <div className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <QrCode className="text-gray-400" />
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase">QR Code Gerado</p>
                          <p className="text-xs font-bold uppercase">{form.location}</p>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                        <QRCodeSVG value={`patrimonio://local/${form.location}`} size={48} />
                      </div>
                    </div>
                  )}

                  {form.condition === 'PÉSSIMO' && (
                    <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center gap-3 text-red-600">
                        <AlertTriangle size={20} />
                        <h4 className="text-xs font-black uppercase tracking-widest">Laudo Automático de Inservibilidade</h4>
                      </div>
                      <div className="space-y-4">
                        <input
                          required
                          type="text"
                          placeholder="MOTIVO DA BAIXA"
                          value={unserviceableForm.reason}
                          onChange={e => setUnserviceableForm({ ...unserviceableForm, reason: e.target.value.toUpperCase() })}
                          className="w-full p-4 bg-white border border-red-100 rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all">{editingAssetId ? 'Salvar Alterações' : 'Salvar no Inventário'}</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 bg-gray-100 text-gray-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE DOCUMENTOS OFICIAIS */}
      {selectedDocument && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Toolbar */}
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-600" size={20} />
                <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Visualização de Documento Oficial</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditingDoc(!isEditingDoc)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md border ${
                    isEditingDoc
                      ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  {isEditingDoc ? 'Concluir Edição' : 'Editar Texto'}
                </button>
                <button
                  onClick={() => handleExportPortraitPDF('document-print-container', `Inventario_${selectedDocument.toUpperCase()}`)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
                >
                  <FileDown size={14} /> Exportar PDF (A4 Retrato)
                </button>
                <button
                  onClick={() => {
                    setSelectedDocument(null);
                    setIsEditingDoc(false);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Document body preview */}
            <div className="flex-1 overflow-y-auto p-10 bg-gray-100 flex justify-center custom-scrollbar">
              <div
                id="document-print-container"
                className="bg-white shadow-lg p-16 font-serif border border-gray-200 text-black w-[210mm] min-h-[297mm] relative flex flex-col justify-between"
                style={{ contentVisibility: 'auto' }}
              >
                {/* Header timbrado */}
                <div>
                  <div className="text-center border-b-2 border-double border-gray-400 pb-4 mb-6 font-sans">
                    <h1 className="text-base font-bold uppercase tracking-tight text-gray-900">Estado de Mato Grosso</h1>
                    <h2 className="text-sm font-bold uppercase text-gray-700">Secretaria de Estado de Educação</h2>
                    <h3 className="text-xs font-bold uppercase text-gray-500">Escola Estadual André Antonio Maggi</h3>
                    <p className="text-[8px] text-gray-400 font-bold mt-1">Cód. U.O. 22201 - André Maggi / MT - CEP: 78530-000</p>
                  </div>

                  {/* Document dynamic body */}
                  <div
                    className={`text-left font-serif outline-none p-4 rounded-xl transition-all ${
                      isEditingDoc ? 'bg-amber-50/20 border border-dashed border-amber-300' : ''
                    }`}
                    contentEditable={isEditingDoc}
                    suppressContentEditableWarning={true}
                  >
                    {selectedDocument === 'portaria' && getPortariaText()}
                    {selectedDocument === 'abertura' && getAberturaText()}
                    {selectedDocument === 'relatorio' && getRelatorioText()}
                    {selectedDocument === 'encerramento' && getEncerramentoText()}
                    {selectedDocument === 'cronograma_seduc' && getCronogramaSeducText()}
                  </div>
                </div>

                {/* Signatures & Footer */}
                <div>
                  <div className="mt-8 font-sans">
                    {selectedDocument === 'portaria' ? (
                      <div className="text-center text-xs font-bold uppercase text-gray-700 tracking-wider">
                        <div className="space-y-1">
                          <div className="border-t border-gray-400 w-64 mx-auto pt-2"></div>
                          <p>DIRETORIA ESCOLAR</p>
                          <p className="text-[10px] text-gray-400">Autoridade Designante</p>
                        </div>
                      </div>
                    ) : selectedDocument === 'cronograma_seduc' ? (
                      <div className="grid grid-cols-3 gap-6 text-center text-[9px] font-bold uppercase text-gray-700 tracking-wider">
                        <div className="space-y-1">
                          <div className="border-t border-gray-400 w-full pt-1.5"></div>
                          <p>{schedule.commissionMembers.president.name || 'PRESIDENTE DA COMISSÃO'}</p>
                          <p className="text-[8px] text-gray-400">Presidente</p>
                        </div>
                        <div className="space-y-1">
                          <div className="border-t border-gray-400 w-full pt-1.5"></div>
                          <p>{schedule.commissionMembers.secretary.name || 'SECRETÁRIO(A)'}</p>
                          <p className="text-[8px] text-gray-400">Secretário(a)</p>
                        </div>
                        <div className="space-y-1">
                          <div className="border-t border-gray-400 w-full pt-1.5"></div>
                          <p>{schedule.commissionMembers.member.name || 'MEMBRO DA COMISSÃO'}</p>
                          <p className="text-[8px] text-gray-400">Membro</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-10">
                        <div className="grid grid-cols-3 gap-6 text-center text-[9px] font-bold uppercase text-gray-700 tracking-wider">
                          <div className="space-y-1">
                            <div className="border-t border-gray-400 w-full pt-1.5"></div>
                            <p>{schedule.commissionMembers.president.name || 'PRESIDENTE DA COMISSÃO'}</p>
                            <p className="text-[8px] text-gray-400">Presidente</p>
                          </div>
                          <div className="space-y-1">
                            <div className="border-t border-gray-400 w-full pt-1.5"></div>
                            <p>{schedule.commissionMembers.secretary.name || 'SECRETÁRIO(A)'}</p>
                            <p className="text-[8px] text-gray-400">Secretário(a)</p>
                          </div>
                          <div className="space-y-1">
                            <div className="border-t border-gray-400 w-full pt-1.5"></div>
                            <p>{schedule.commissionMembers.member.name || 'MEMBRO DA COMISSÃO'}</p>
                            <p className="text-[8px] text-gray-400">Membro</p>
                          </div>
                        </div>
                        
                        <div className="text-center text-xs font-bold uppercase text-gray-700 tracking-wider pt-4">
                          <div className="space-y-1">
                            <div className="border-t border-gray-400 w-64 mx-auto pt-2"></div>
                            <p>DIRETORIA ESCOLAR</p>
                            <p className="text-[10px] text-gray-400">Homologador</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SEDUC-MT Official Logo Footer */}
                  {selectedDocument === 'cronograma_seduc' && (
                    <div className="flex items-center justify-between border-t-2 border-gray-300 pt-4 mt-8 font-sans select-none">
                      {/* Left Badge */}
                      <div className="flex items-center justify-center bg-blue-900 text-white rounded-lg p-2 w-28 h-10 text-center text-[6px] font-black uppercase leading-tight shrink-0 border border-blue-955">
                        <div>
                          <p className="text-[4px] text-blue-300">3ª Convenção</p>
                          <p>Gestão Escolar</p>
                          <p className="tracking-[0.15em]">Conectada</p>
                        </div>
                      </div>
                      {/* Center Logo */}
                      <div className="flex items-center justify-center">
                        <img src="/SEDUC 2.jpg" alt="SEDUC" className="h-8 object-contain max-w-[120px]" />
                      </div>
                      {/* Right Logo */}
                      <div className="flex items-center justify-center gap-1">
                        <img src="/brasao_mt.png" alt="Brasão MT" className="h-8 object-contain" />
                        <div className="text-[6px] font-black text-gray-900 leading-none text-left uppercase">
                          <p>Governo de</p>
                          <p className="text-[8px]">Mato Grosso</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AssetInventoryModule;
