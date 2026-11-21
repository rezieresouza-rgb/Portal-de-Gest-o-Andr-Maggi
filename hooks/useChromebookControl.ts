import { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { AssetCondition } from '../types';

export type ChromebookItemCondition =
  | 'ÓTIMO'
  | 'BOM'
  | 'REGULAR'
  | 'COM AVARIA'
  | 'INOPERANTE'
  | 'PÉSSIMO';

export type HeadphoneItemCondition =
  | 'ÓTIMO'
  | 'BOM'
  | 'REGULAR'
  | 'COM AVARIA'
  | 'AUSENTE'
  | 'PÉSSIMO';

export type OperationalStatus = 'DISPONIVEL' | 'EM_USO' | 'EM_MANUTENCAO' | 'INSERVIVEL';

export interface StationMeta {
  id: string;
  label: string;
  defaultLocation: string;
  defaultSlots: number;
}

export const CHROMEBOOK_STATIONS: StationMeta[] = [
  { id: 'Estação 01', label: 'Estação 01', defaultLocation: 'Biblioteca', defaultSlots: 20 },
  { id: 'Estação 02', label: 'Estação 02', defaultLocation: 'Sala 22', defaultSlots: 20 },
  { id: 'Estação 03', label: 'Estação 03', defaultLocation: 'Sala 22', defaultSlots: 20 },
  { id: 'Estação 04', label: 'Estação 04', defaultLocation: 'Biblioteca', defaultSlots: 20 },
  { id: 'Estação 05', label: 'Estação 05', defaultLocation: 'Biblioteca / Armário', defaultSlots: 20 }
];

export const CHROMEBOOK_CONDITIONS: ChromebookItemCondition[] = [
  'ÓTIMO',
  'BOM',
  'REGULAR',
  'COM AVARIA',
  'INOPERANTE',
  'PÉSSIMO'
];

export const HEADPHONE_CONDITIONS: HeadphoneItemCondition[] = [
  'ÓTIMO',
  'BOM',
  'REGULAR',
  'COM AVARIA',
  'AUSENTE',
  'PÉSSIMO'
];

export const OCCURRENCE_TYPES = [
  'Dano físico / Tela',
  'Teclado / Touchpad',
  'Bateria / Carregamento',
  'Carregador ausente ou danificado',
  'Fone faltante / extraviado',
  'Fone com defeito / cabo partido',
  'Equipamento ausente na estação',
  'Problema de guarda / fechadura',
  'Sistema / Login / Rede',
  'Outro'
];

export const ORIENTACOES_OFICIAIS = [
  {
    code: '01',
    title: 'Cadastro',
    text: 'Preencha o número real de cada Chromebook e o número do fone correspondente, preferencialmente em pares de identificação iguais.'
  },
  {
    code: '02',
    title: 'Cinco estações',
    text: 'O sistema reserva 20 posições por estação para preenchimento opcional. Isso não significa que existam 20 equipamentos em cada estação — apenas equipamentos efetivamente cadastrados entram no cômputo.'
  },
  {
    code: '03',
    title: 'Utilizações',
    text: 'Uma linha por estudante e por aula. O professor registra turma, estudante, Chromebook, fone, retirada e devolução.'
  },
  {
    code: '04',
    title: 'Liderança estudantil',
    text: 'Líder e vice-líder auxiliam na distribuição e organização, sem responsabilidade automática por perdas ou danos de terceiros.'
  },
  {
    code: '05',
    title: 'Conferência do vigia',
    text: 'O vigia registra as condições de guarda e comunica anormalidades. A conferência final da utilização é responsabilidade do professor.'
  },
  {
    code: '06',
    title: 'Ocorrências',
    text: 'Danos, faltas de equipamentos e problemas de guarda devem constar na aba Ocorrências, com responsável, prazo e providência.'
  },
  {
    code: '07',
    title: 'Identificação',
    text: 'Use etiqueta legível. Por exemplo: Chromebook 01 e Fone 01 são um par; mantenha também patrimônio/série no Cadastro.'
  },
  {
    code: '08',
    title: 'Proteção de dados',
    text: 'O acesso à aba Utilizações deve ser restrito à equipe autorizada, pois contém nomes de estudantes (LGPD).'
  },
  {
    code: '09',
    title: 'Rotina diária',
    text: 'No fim de cada dia, conferir registros de uso em aberto e checklist das estações. Atualizar pendências conforme providências.'
  },
  {
    code: '10',
    title: 'Integração Patrimonial (Inventário SEDUC)',
    text: 'Cada par cadastrado pode ser espelhado automaticamente na tabela oficial de Inventário Patrimonial (assets), gerando tombamento, histórico de movimentação e QR Code para auditoria anual da DRE/SEDUC.'
  }
];

export interface ChromebookPairItem {
  id: string;
  stationId: string; // 'Estação 01' .. 'Estação 05'
  stationLocation: string;
  positionNumber: number;
  chromebookNumber: string; // vazio se não cadastrado
  headphoneNumber: string; // vazio se não cadastrado
  heritageNumber: string; // Nº patrimônio / tombamento
  serialNumber: string; // Nº de série
  brand: string;
  model: string;
  hasCharger: boolean;
  chromebookCondition: ChromebookItemCondition;
  headphoneCondition: HeadphoneItemCondition;
  operationalStatus: OperationalStatus;
  acquisitionYear: string;
  acquisitionDocument: string;
  notes: string;
  linkedAssetId?: string | null;
  updatedAt?: string;
}

export interface ChromebookUsageRecord {
  id: string;
  date: string; // YYYY-MM-DD
  stationId: string;
  classroomName: string;
  shift: 'MATUTINO' | 'VESPERTINO' | 'NOTURNO';
  teacherName: string;
  studentName: string;
  chromebookNumber: string;
  headphoneNumber: string;
  checkoutTime: string;
  returnTime: string;
  situation: 'EM USO' | 'DEVOLVIDO';
  hasIrregularity: boolean;
  observations: string;
  studentLeaderSupport: string;
  checkedByTeacher: boolean;
  createdBy?: string;
}

export interface ChromebookGuardInspection {
  id: string;
  date: string;
  stationId: string;
  guardName: string;
  registeredChromebooks: number;
  registeredHeadphones: number;
  checkedChromebooks: number;
  checkedHeadphones: number;
  compartmentsClosed: boolean;
  visibleDamage: boolean;
  observations: string;
  result: 'REGULAR' | 'COM PENDÊNCIA' | 'IRREGULAR';
}

export interface ChromebookOccurrenceRecord {
  id: string;
  date: string;
  stationId: string;
  chromebookNumber: string;
  headphoneNumber: string;
  occurrenceType: string;
  description: string;
  reportedTo: string;
  responsiblePerson: string;
  deadline: string;
  status: 'PENDENTE' | 'EM ANDAMENTO' | 'CONCLUÍDA';
  resolution: string;
  linkedPairId?: string | null;
  createdBy?: string;
}

export interface SchoolStudentOption {
  code: string;
  name: string;
  className: string;
  shift: string;
}

const STORAGE_KEYS = {
  pairs: 'eecm_cb_fones_pairs_v2027',
  usages: 'eecm_cb_fones_usages_v2027',
  inspections: 'eecm_cb_fones_inspections_v2027',
  occurrences: 'eecm_cb_fones_occurrences_v2027'
};

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const readLocal = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocal = <T,>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
};

export const normalizeStationId = (raw?: string | null): string => {
  const s = String(raw || '').trim();
  const m = s.match(/0?([1-5])/);
  if (m) return `Estação 0${m[1]}`;
  return CHROMEBOOK_STATIONS[0].id;
};

export const getStationDefaultLocation = (stationId: string): string => {
  return CHROMEBOOK_STATIONS.find(s => s.id === stationId)?.defaultLocation || 'Biblioteca';
};

export const mapToAssetCondition = (cond: ChromebookItemCondition): AssetCondition => {
  switch (cond) {
    case 'ÓTIMO':
      return 'EXCELENTE';
    case 'BOM':
      return 'BOM';
    case 'INOPERANTE':
    case 'PÉSSIMO':
      return 'PÉSSIMO';
    case 'REGULAR':
    case 'COM AVARIA':
    default:
      return 'REGULAR';
  }
};

const mapFromAssetCondition = (cond?: string | null): ChromebookItemCondition => {
  const c = String(cond || '').toUpperCase();
  if (c === 'EXCELENTE') return 'ÓTIMO';
  if (c === 'BOM') return 'BOM';
  if (c === 'PÉSSIMO' || c === 'PESSIMO') return 'PÉSSIMO';
  return 'REGULAR';
};

export const buildAssetDescriptionForPair = (pair: ChromebookPairItem): string => {
  const parts: string[] = [];
  if (pair.chromebookNumber) {
    parts.push(`CHROMEBOOK Nº ${pair.chromebookNumber.toUpperCase()}`);
    if (pair.headphoneNumber) parts.push(`(PAR FONE Nº ${pair.headphoneNumber.toUpperCase()})`);
  } else if (pair.headphoneNumber) {
    parts.push(`FONE DE OUVIDO Nº ${pair.headphoneNumber.toUpperCase()}`);
  } else {
    parts.push(`EQUIPAMENTO ${pair.stationId.toUpperCase()} POS. ${String(pair.positionNumber).padStart(2, '0')}`);
  }

  const brandModel = [pair.brand, pair.model].filter(Boolean).join(' ').trim();
  if (brandModel) parts.push(`- ${brandModel.toUpperCase()}`);
  if (pair.serialNumber) parts.push(`| N/S: ${pair.serialNumber.toUpperCase()}`);
  parts.push(`| POSIÇÃO ${String(pair.positionNumber).padStart(2, '0')}`);
  if (!pair.hasCharger && pair.chromebookNumber) parts.push('| SEM CARREGADOR');
  return parts.join(' ');
};

export const buildAssetLocationForPair = (pair: ChromebookPairItem): string => {
  const loc = pair.stationLocation || getStationDefaultLocation(pair.stationId);
  return `${pair.stationId} - ${loc}`.toUpperCase();
};

// Reconstrói um ChromebookPairItem a partir de um bem já existente na tabela oficial `assets`
const parsePairFromOfficialAsset = (a: any): ChromebookPairItem | null => {
  const desc = String(a.description || '');
  const loc = String(a.location || '');
  const upper = `${desc} ${loc}`.toUpperCase();
  if (!upper.includes('CHROMEBOOK') && !upper.includes('FONE DE OUVIDO') && !upper.includes('PAR FONE')) {
    return null;
  }

  const stationId = normalizeStationId(loc || desc);
  const posMatch = desc.match(/POSI[ÇC][ÃA]O\s*0?(\d+)/i);
  const cbMatch = desc.match(/CHROMEBOOK\s*N[º°]?\s*([A-Z0-9-]+)/i);
  const foneMatch = desc.match(/(?:PAR\s+FONE|FONE(?:\s+DE\s+OUVIDO)?)\s*N[º°]?\s*([A-Z0-9-]+)/i);
  const serialMatch = desc.match(/N\/S:\s*([^\s|]+)/i);
  const locParts = loc.split('-');
  const stationLocation = locParts.length > 1 ? locParts.slice(1).join('-').trim() : getStationDefaultLocation(stationId);
  const cleanHeritage = String(a.heritage_number || '').split('#')[0];

  return {
    id: a.id,
    stationId,
    stationLocation,
    positionNumber: posMatch ? Number(posMatch[1]) : 1,
    chromebookNumber: cbMatch ? cbMatch[1] : '',
    headphoneNumber: foneMatch ? foneMatch[1] : '',
    heritageNumber: cleanHeritage === 'SRP' ? '' : cleanHeritage,
    serialNumber: serialMatch ? serialMatch[1] : '',
    brand: 'Positivo',
    model: 'Chromebook',
    hasCharger: !upper.includes('SEM CARREGADOR'),
    chromebookCondition: mapFromAssetCondition(a.condition),
    headphoneCondition: foneMatch ? mapFromAssetCondition(a.condition) : 'AUSENTE',
    operationalStatus: a.is_unserviceable ? 'INSERVIVEL' : 'DISPONIVEL',
    acquisitionYear: a.acquisition_year || '',
    acquisitionDocument: a.acquisition_document || '',
    notes: 'Importado automaticamente do Inventário Patrimonial Oficial.',
    linkedAssetId: a.id,
    updatedAt: a.created_at
  };
};

interface UseChromebookControlOptions {
  user?: any;
  onInventoryChanged?: () => void | Promise<void>;
}

export const useChromebookControl = ({ user, onInventoryChanged }: UseChromebookControlOptions) => {
  const [pairs, setPairs] = useState<ChromebookPairItem[]>([]);
  const [usages, setUsages] = useState<ChromebookUsageRecord[]>([]);
  const [inspections, setInspections] = useState<ChromebookGuardInspection[]>([]);
  const [occurrences, setOccurrences] = useState<ChromebookOccurrenceRecord[]>([]);
  const [classrooms, setClassrooms] = useState<{ name: string; shift: string }[]>([]);
  const [students, setStudents] = useState<SchoolStudentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dedicatedTablesReady, setDedicatedTablesReady] = useState(false);

  const responsibleLabel = user?.name ? String(user.name).toUpperCase() : 'GESTÃO PATRIMONIAL';

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Carregar turmas e alunos ativos do Supabase para Utilizações e Ficha de Controle
      const [classRes, studRes] = await Promise.all([
        supabase.from('classrooms').select('name, shift').order('name'),
        supabase.from('students').select('id, name, registration_number, enrollments(status, classrooms(name, shift))')
      ]);

      if (classRes.data) {
        setClassrooms(
          classRes.data
            .map((c: any) => ({ name: String(c.name || '').trim(), shift: String(c.shift || 'MATUTINO').toUpperCase() }))
            .filter(c => c.name)
        );
      }

      if (studRes.data) {
        const activeStuds: SchoolStudentOption[] = [];
        studRes.data.forEach((s: any) => {
          const enrs = Array.isArray(s.enrollments) ? s.enrollments : [];
          const active =
            enrs.find((e: any) => ['ATIVO', 'MATRICULADO', 'CURSANDO'].includes(String(e.status || '').toUpperCase())) ||
            enrs.find((e: any) => String(e.status || '').toUpperCase() === 'RECLASSIFICADO');
          if (active && active.classrooms?.name) {
            activeStuds.push({
              code: String(s.registration_number || s.id),
              name: String(s.name || '').trim(),
              className: String(active.classrooms.name).trim(),
              shift: String(active.classrooms.shift || 'MATUTINO').toUpperCase()
            });
          }
        });
        activeStuds.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        setStudents(activeStuds);
      }

      // 2. Tentar carregar as 4 tabelas dedicadas do Supabase
      const [pairsRes, usagesRes, inspRes, occRes] = await Promise.all([
        supabase.from('chromebook_pairs').select('*').order('station_id').order('position_number'),
        supabase.from('chromebook_usages').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('chromebook_inspections').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('chromebook_occurrences').select('*').order('date', { ascending: false }).order('created_at', { ascending: false })
      ]);

      const tablesOk = !pairsRes.error && !usagesRes.error && !inspRes.error && !occRes.error;
      setDedicatedTablesReady(tablesOk);

      let loadedPairs: ChromebookPairItem[] = [];
      if (tablesOk && pairsRes.data) {
        loadedPairs = pairsRes.data.map((r: any) => ({
          id: r.id,
          stationId: normalizeStationId(r.station_id),
          stationLocation: r.station_location || getStationDefaultLocation(normalizeStationId(r.station_id)),
          positionNumber: Number(r.position_number) || 1,
          chromebookNumber: r.chromebook_number || '',
          headphoneNumber: r.headphone_number || '',
          heritageNumber: r.heritage_number || '',
          serialNumber: r.serial_number || '',
          brand: r.brand || 'Positivo',
          model: r.model || 'Chromebook',
          hasCharger: r.has_charger !== false,
          chromebookCondition: (r.chromebook_condition || 'ÓTIMO') as ChromebookItemCondition,
          headphoneCondition: (r.headphone_condition || 'ÓTIMO') as HeadphoneItemCondition,
          operationalStatus: (r.operational_status || 'DISPONIVEL') as OperationalStatus,
          acquisitionYear: r.acquisition_year || '',
          acquisitionDocument: r.acquisition_document || '',
          notes: r.notes || '',
          linkedAssetId: r.linked_asset_id || null,
          updatedAt: r.updated_at
        }));
      } else {
        loadedPairs = readLocal<ChromebookPairItem>(STORAGE_KEYS.pairs);
      }

      // 3. Mesclar quaisquer Chromebooks/Fones já cadastrados diretamente na tabela oficial `assets`
      const { data: officialAssets } = await supabase
        .from('assets')
        .select('id, description, location, heritage_number, condition, is_unserviceable, acquisition_document, acquisition_year, created_at')
        .or('description.ilike.%CHROMEBOOK%,description.ilike.%FONE DE OUVIDO%,description.ilike.%PAR FONE%');

      if (officialAssets && officialAssets.length > 0) {
        const linkedSet = new Set(loadedPairs.map(p => p.linkedAssetId).filter(Boolean));
        const extraFromAssets: ChromebookPairItem[] = [];
        officialAssets.forEach((a: any) => {
          if (linkedSet.has(a.id)) return;
          const parsed = parsePairFromOfficialAsset(a);
          if (parsed) extraFromAssets.push(parsed);
        });
        if (extraFromAssets.length > 0) {
          loadedPairs = [...loadedPairs, ...extraFromAssets];
        }
      }

      loadedPairs.sort((a, b) => a.stationId.localeCompare(b.stationId) || a.positionNumber - b.positionNumber);
      setPairs(loadedPairs);

      if (tablesOk && usagesRes.data) {
        setUsages(
          usagesRes.data.map((u: any) => ({
            id: u.id,
            date: String(u.date || '').slice(0, 10),
            stationId: normalizeStationId(u.station_id),
            classroomName: u.classroom_name || '',
            shift: (u.shift || 'MATUTINO') as any,
            teacherName: u.teacher_name || '',
            studentName: u.student_name || '',
            chromebookNumber: u.chromebook_number || '',
            headphoneNumber: u.headphone_number || '',
            checkoutTime: u.checkout_time || '',
            returnTime: u.return_time || '',
            situation: (u.situation || 'EM USO') as any,
            hasIrregularity: Boolean(u.has_irregularity),
            observations: u.observations || '',
            studentLeaderSupport: u.student_leader_support || '',
            checkedByTeacher: Boolean(u.checked_by_teacher),
            createdBy: u.created_by || ''
          }))
        );
      } else {
        setUsages(readLocal<ChromebookUsageRecord>(STORAGE_KEYS.usages));
      }

      if (tablesOk && inspRes.data) {
        setInspections(
          inspRes.data.map((i: any) => ({
            id: i.id,
            date: String(i.date || '').slice(0, 10),
            stationId: normalizeStationId(i.station_id),
            guardName: i.guard_name || '',
            registeredChromebooks: Number(i.registered_chromebooks) || 0,
            registeredHeadphones: Number(i.registered_headphones) || 0,
            checkedChromebooks: Number(i.checked_chromebooks) || 0,
            checkedHeadphones: Number(i.checked_headphones) || 0,
            compartmentsClosed: i.compartments_closed !== false,
            visibleDamage: Boolean(i.visible_damage),
            observations: i.observations || '',
            result: (i.result || 'REGULAR') as any
          }))
        );
      } else {
        setInspections(readLocal<ChromebookGuardInspection>(STORAGE_KEYS.inspections));
      }

      if (tablesOk && occRes.data) {
        setOccurrences(
          occRes.data.map((o: any) => ({
            id: o.id,
            date: String(o.date || '').slice(0, 10),
            stationId: normalizeStationId(o.station_id),
            chromebookNumber: o.chromebook_number || '',
            headphoneNumber: o.headphone_number || '',
            occurrenceType: o.occurrence_type || 'Outro',
            description: o.description || '',
            reportedTo: o.reported_to || '',
            responsiblePerson: o.responsible_person || '',
            deadline: o.deadline ? String(o.deadline).slice(0, 10) : '',
            status: (o.status || 'PENDENTE') as any,
            resolution: o.resolution || '',
            linkedPairId: o.linked_pair_id || null,
            createdBy: o.created_by || ''
          }))
        );
      } else {
        setOccurrences(readLocal<ChromebookOccurrenceRecord>(STORAGE_KEYS.occurrences));
      }
    } catch (err) {
      console.error('Erro ao carregar módulo de Chromebooks & Fones:', err);
      setPairs(readLocal<ChromebookPairItem>(STORAGE_KEYS.pairs));
      setUsages(readLocal<ChromebookUsageRecord>(STORAGE_KEYS.usages));
      setInspections(readLocal<ChromebookGuardInspection>(STORAGE_KEYS.inspections));
      setOccurrences(readLocal<ChromebookOccurrenceRecord>(STORAGE_KEYS.occurrences));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ===========================================================================
  // SINCRONIZAÇÃO PATRIMONIAL OFICIAL (`public.assets` + `public.asset_history`)
  // ===========================================================================
  const syncPairToOfficialInventory = useCallback(
    async (pair: ChromebookPairItem): Promise<string | null> => {
      const assetCond = mapToAssetCondition(pair.chromebookCondition);
      const isUnserviceable = assetCond === 'PÉSSIMO' || pair.operationalStatus === 'INSERVIVEL';
      const cleanHeritage = (pair.heritageNumber || '').trim().toUpperCase() || 'SRP';
      const payload = {
        description: buildAssetDescriptionForPair(pair),
        location: buildAssetLocationForPair(pair),
        heritage_number: cleanHeritage,
        condition: assetCond,
        is_unserviceable: isUnserviceable,
        unserviceable_data: isUnserviceable
          ? {
              date: new Date().toISOString().slice(0, 10),
              reason: pair.notes || `Condição: ${pair.chromebookCondition}`,
              responsible: responsibleLabel
            }
          : null,
        acquisition_document: pair.acquisitionDocument?.trim().toUpperCase() || null,
        acquisition_year: pair.acquisitionYear?.trim() || null
      };

      const today = new Date().toISOString().slice(0, 10);

      try {
        if (pair.linkedAssetId) {
          let { error } = await supabase.from('assets').update(payload).eq('id', pair.linkedAssetId);
          if (error && (error.code === '23505' || error.message?.includes('unique'))) {
            const retry = await supabase
              .from('assets')
              .update({ ...payload, heritage_number: `${cleanHeritage}#${Date.now()}` })
              .eq('id', pair.linkedAssetId);
            error = retry.error;
          }
          if (!error) {
            await supabase.from('asset_history').insert([
              {
                asset_id: pair.linkedAssetId,
                date: today,
                action: 'ATUALIZAÇÃO VIA GESTÃO DE CHROMEBOOKS',
                responsible: responsibleLabel,
                notes: `${pair.stationId} (Pos. ${pair.positionNumber}) • CB: ${pair.chromebookNumber || '-'} • Fone: ${pair.headphoneNumber || '-'} • Estado: ${assetCond}`
              }
            ]);
            if (onInventoryChanged) await onInventoryChanged();
            return pair.linkedAssetId;
          }
        }

        // Insert new asset row in official inventory
        let { data: inserted, error: insErr } = await supabase
          .from('assets')
          .insert([{ ...payload, photo: '' }])
          .select('id')
          .single();

        if (insErr && (insErr.code === '23505' || insErr.message?.includes('unique'))) {
          const retry = await supabase
            .from('assets')
            .insert([{ ...payload, photo: '', heritage_number: `${cleanHeritage}#${Date.now()}_${Math.floor(Math.random() * 1000)}` }])
            .select('id')
            .single();
          inserted = retry.data;
          insErr = retry.error;
        }

        if (!insErr && inserted?.id) {
          await supabase.from('asset_history').insert([
            {
              asset_id: inserted.id,
              date: today,
              action: 'CADASTRO PATRIMONIAL (CHROMEBOOKS & FONES)',
              responsible: responsibleLabel,
              notes: `Incorporado ao inventário oficial via Gestão de Chromebooks (${pair.stationId}, Pos. ${pair.positionNumber}).`
            }
          ]);
          if (onInventoryChanged) await onInventoryChanged();
          return inserted.id;
        }
      } catch (err) {
        console.error('Erro ao espelhar equipamento no Inventário Patrimonial:', err);
      }
      return pair.linkedAssetId || null;
    },
    [responsibleLabel, onInventoryChanged]
  );

  // ===========================================================================
  // CRUD: PARES (CHROMEBOOK + FONE)
  // ===========================================================================
  const savePair = useCallback(
    async (input: Omit<ChromebookPairItem, 'id'>, existingId?: string, mirrorToInventory = true) => {
      const id = existingId || generateUUID();
      let record: ChromebookPairItem = {
        ...input,
        id,
        stationId: normalizeStationId(input.stationId),
        updatedAt: new Date().toISOString()
      };

      if (mirrorToInventory && (record.chromebookNumber.trim() || record.headphoneNumber.trim())) {
        const assetId = await syncPairToOfficialInventory(record);
        if (assetId) record = { ...record, linkedAssetId: assetId };
      }

      if (dedicatedTablesReady) {
        const dbRow = {
          id: record.id,
          station_id: record.stationId,
          station_location: record.stationLocation,
          position_number: record.positionNumber,
          chromebook_number: record.chromebookNumber || null,
          headphone_number: record.headphoneNumber || null,
          heritage_number: record.heritageNumber || null,
          serial_number: record.serialNumber || null,
          brand: record.brand,
          model: record.model,
          has_charger: record.hasCharger,
          chromebook_condition: record.chromebookCondition,
          headphone_condition: record.headphoneCondition,
          operational_status: record.operationalStatus,
          acquisition_year: record.acquisitionYear || null,
          acquisition_document: record.acquisitionDocument || null,
          notes: record.notes || null,
          linked_asset_id: record.linkedAssetId || null,
          updated_at: record.updatedAt
        };
        await supabase.from('chromebook_pairs').upsert(dbRow, { onConflict: 'id' });
      }

      setPairs(prev => {
        const exists = prev.some(p => p.id === record.id);
        const next = exists ? prev.map(p => (p.id === record.id ? record : p)) : [...prev, record];
        next.sort((a, b) => a.stationId.localeCompare(b.stationId) || a.positionNumber - b.positionNumber);
        writeLocal(STORAGE_KEYS.pairs, next);
        return next;
      });

      return record;
    },
    [dedicatedTablesReady, syncPairToOfficialInventory]
  );

  const saveBatchPairs = useCallback(
    async (items: Omit<ChromebookPairItem, 'id'>[], mirrorToInventory = true) => {
      const saved: ChromebookPairItem[] = [];
      for (const item of items) {
        const rec = await savePair(item, undefined, mirrorToInventory);
        saved.push(rec);
      }
      return saved;
    },
    [savePair]
  );

  const deletePair = useCallback(
    async (pair: ChromebookPairItem, alsoDeleteFromInventory = false) => {
      if (dedicatedTablesReady) {
        await supabase.from('chromebook_pairs').delete().eq('id', pair.id);
      }
      if (alsoDeleteFromInventory && pair.linkedAssetId) {
        await supabase.from('assets').delete().eq('id', pair.linkedAssetId);
        if (onInventoryChanged) await onInventoryChanged();
      }
      setPairs(prev => {
        const next = prev.filter(p => p.id !== pair.id);
        writeLocal(STORAGE_KEYS.pairs, next);
        return next;
      });
    },
    [dedicatedTablesReady, onInventoryChanged]
  );

  const syncAllUnsyncedToInventory = useCallback(async () => {
    const unsynced = pairs.filter(p => !p.linkedAssetId && (p.chromebookNumber.trim() || p.headphoneNumber.trim()));
    let syncedCount = 0;
    for (const p of unsynced) {
      const assetId = await syncPairToOfficialInventory(p);
      if (assetId) {
        syncedCount++;
        const updated = { ...p, linkedAssetId: assetId };
        if (dedicatedTablesReady) {
          await supabase.from('chromebook_pairs').update({ linked_asset_id: assetId }).eq('id', p.id);
        }
        setPairs(prev => {
          const next = prev.map(x => (x.id === p.id ? updated : x));
          writeLocal(STORAGE_KEYS.pairs, next);
          return next;
        });
      }
    }
    return syncedCount;
  }, [pairs, syncPairToOfficialInventory, dedicatedTablesReady]);

  // ===========================================================================
  // CRUD: UTILIZAÇÕES (RETIRADA E DEVOLUÇÃO)
  // ===========================================================================
  const saveUsage = useCallback(
    async (input: Omit<ChromebookUsageRecord, 'id'>, existingId?: string) => {
      const record: ChromebookUsageRecord = {
        ...input,
        id: existingId || generateUUID(),
        stationId: normalizeStationId(input.stationId),
        createdBy: input.createdBy || responsibleLabel
      };

      if (dedicatedTablesReady) {
        await supabase.from('chromebook_usages').upsert(
          {
            id: record.id,
            date: record.date,
            station_id: record.stationId,
            classroom_name: record.classroomName,
            shift: record.shift,
            teacher_name: record.teacherName,
            student_name: record.studentName,
            chromebook_number: record.chromebookNumber || null,
            headphone_number: record.headphoneNumber || null,
            checkout_time: record.checkoutTime || null,
            return_time: record.returnTime || null,
            situation: record.situation,
            has_irregularity: record.hasIrregularity,
            observations: record.observations || null,
            student_leader_support: record.studentLeaderSupport || null,
            checked_by_teacher: record.checkedByTeacher,
            created_by: record.createdBy || null
          },
          { onConflict: 'id' }
        );
      }

      setUsages(prev => {
        const exists = prev.some(u => u.id === record.id);
        const next = exists ? prev.map(u => (u.id === record.id ? record : u)) : [record, ...prev];
        writeLocal(STORAGE_KEYS.usages, next);
        return next;
      });

      // Atualizar status operacional do Chromebook no Cadastro
      if (record.chromebookNumber.trim()) {
        const matchPair = pairs.find(
          p =>
            p.stationId === record.stationId &&
            p.chromebookNumber.trim().toUpperCase() === record.chromebookNumber.trim().toUpperCase()
        );
        if (matchPair) {
          const nextStatus: OperationalStatus =
            record.situation === 'EM USO'
              ? 'EM_USO'
              : record.hasIrregularity
                ? 'EM_MANUTENCAO'
                : 'DISPONIVEL';
          if (matchPair.operationalStatus !== nextStatus) {
            await savePair({ ...matchPair, operationalStatus: nextStatus }, matchPair.id, false);
          }
        }
      }

      return record;
    },
    [dedicatedTablesReady, responsibleLabel, pairs, savePair]
  );

  const deleteUsage = useCallback(
    async (id: string) => {
      if (dedicatedTablesReady) {
        await supabase.from('chromebook_usages').delete().eq('id', id);
      }
      setUsages(prev => {
        const next = prev.filter(u => u.id !== id);
        writeLocal(STORAGE_KEYS.usages, next);
        return next;
      });
    },
    [dedicatedTablesReady]
  );

  // ===========================================================================
  // CRUD: CONFERÊNCIA DOS VIGIAS (CHECKLIST DE GUARDA)
  // ===========================================================================
  const saveInspection = useCallback(
    async (input: Omit<ChromebookGuardInspection, 'id'>) => {
      const record: ChromebookGuardInspection = {
        ...input,
        id: generateUUID(),
        stationId: normalizeStationId(input.stationId)
      };

      if (dedicatedTablesReady) {
        await supabase.from('chromebook_inspections').insert({
          id: record.id,
          date: record.date,
          station_id: record.stationId,
          guard_name: record.guardName,
          registered_chromebooks: record.registeredChromebooks,
          registered_headphones: record.registeredHeadphones,
          checked_chromebooks: record.checkedChromebooks,
          checked_headphones: record.checkedHeadphones,
          compartments_closed: record.compartmentsClosed,
          visible_damage: record.visibleDamage,
          observations: record.observations || null,
          result: record.result
        });
      }

      setInspections(prev => {
        const next = [record, ...prev];
        writeLocal(STORAGE_KEYS.inspections, next);
        return next;
      });

      return record;
    },
    [dedicatedTablesReady]
  );

  const deleteInspection = useCallback(
    async (id: string) => {
      if (dedicatedTablesReady) {
        await supabase.from('chromebook_inspections').delete().eq('id', id);
      }
      setInspections(prev => {
        const next = prev.filter(i => i.id !== id);
        writeLocal(STORAGE_KEYS.inspections, next);
        return next;
      });
    },
    [dedicatedTablesReady]
  );

  // ===========================================================================
  // CRUD: OCORRÊNCIAS / IRREGULARIDADES (+ SINCRONIZAÇÃO COM CADASTRO/PATRIMÔNIO)
  // ===========================================================================
  const saveOccurrence = useCallback(
    async (input: Omit<ChromebookOccurrenceRecord, 'id'>, existingId?: string, syncConditionToAsset = true) => {
      const record: ChromebookOccurrenceRecord = {
        ...input,
        id: existingId || generateUUID(),
        stationId: normalizeStationId(input.stationId),
        createdBy: input.createdBy || responsibleLabel
      };

      if (dedicatedTablesReady) {
        await supabase.from('chromebook_occurrences').upsert(
          {
            id: record.id,
            date: record.date,
            station_id: record.stationId,
            chromebook_number: record.chromebookNumber || null,
            headphone_number: record.headphoneNumber || null,
            occurrence_type: record.occurrenceType,
            description: record.description,
            reported_to: record.reportedTo || null,
            responsible_person: record.responsiblePerson || null,
            deadline: record.deadline || null,
            status: record.status,
            resolution: record.resolution || null,
            linked_pair_id: record.linkedPairId || null,
            created_by: record.createdBy || null,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );
      }

      setOccurrences(prev => {
        const exists = prev.some(o => o.id === record.id);
        const next = exists ? prev.map(o => (o.id === record.id ? record : o)) : [record, ...prev];
        writeLocal(STORAGE_KEYS.occurrences, next);
        return next;
      });

      // Atualizar estado do equipamento no Cadastro e no Inventário Patrimonial
      if (syncConditionToAsset && (record.chromebookNumber.trim() || record.headphoneNumber.trim())) {
        const targetPair = pairs.find(
          p =>
            p.stationId === record.stationId &&
            ((record.chromebookNumber && p.chromebookNumber.trim().toUpperCase() === record.chromebookNumber.trim().toUpperCase()) ||
              (record.headphoneNumber && p.headphoneNumber.trim().toUpperCase() === record.headphoneNumber.trim().toUpperCase()))
        );
        if (targetPair) {
          const isHeadphoneIssue = record.occurrenceType.toLowerCase().includes('fone');
          if (record.status === 'CONCLUÍDA') {
            await savePair(
              {
                ...targetPair,
                operationalStatus: 'DISPONIVEL',
                chromebookCondition: !isHeadphoneIssue && targetPair.chromebookCondition === 'COM AVARIA' ? 'BOM' : targetPair.chromebookCondition,
                headphoneCondition: isHeadphoneIssue ? 'BOM' : targetPair.headphoneCondition
              },
              targetPair.id,
              Boolean(targetPair.linkedAssetId)
            );
          } else {
            await savePair(
              {
                ...targetPair,
                operationalStatus: isHeadphoneIssue ? targetPair.operationalStatus : 'EM_MANUTENCAO',
                chromebookCondition: !isHeadphoneIssue ? 'COM AVARIA' : targetPair.chromebookCondition,
                headphoneCondition: isHeadphoneIssue
                  ? record.occurrenceType.toLowerCase().includes('faltante')
                    ? 'AUSENTE'
                    : 'COM AVARIA'
                  : targetPair.headphoneCondition,
                notes: `${record.occurrenceType}: ${record.description}`
              },
              targetPair.id,
              Boolean(targetPair.linkedAssetId)
            );
          }
        }
      }

      return record;
    },
    [dedicatedTablesReady, responsibleLabel, pairs, savePair]
  );

  const deleteOccurrence = useCallback(
    async (id: string) => {
      if (dedicatedTablesReady) {
        await supabase.from('chromebook_occurrences').delete().eq('id', id);
      }
      setOccurrences(prev => {
        const next = prev.filter(o => o.id !== id);
        writeLocal(STORAGE_KEYS.occurrences, next);
        return next;
      });
    },
    [dedicatedTablesReady]
  );

  // ===========================================================================
  // IMPORTAÇÃO & EXPORTAÇÃO EXCEL (FORMATOS EXATOS DA PLANILHA EECM 2027)
  // ===========================================================================
  const importFromExcel = useCallback(
    async (file: File, mirrorToInventory = true) => {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      let importedPairs = 0;
      let importedUsages = 0;
      let importedInspections = 0;
      let importedOccurrences = 0;

      // 1. Aba Cadastro
      const cadWs = wb.Sheets['Cadastro'];
      if (cadWs) {
        const rows: any[][] = XLSX.utils.sheet_to_json(cadWs, { header: 1, defval: '' });
        for (let i = 5; i < rows.length; i++) {
          const r = rows[i];
          const cbNum = String(r[2] || '').trim();
          const foneNum = String(r[3] || '').trim();
          const heritageRaw = String(r[4] || '').trim();
          if (!cbNum && !foneNum && !heritageRaw) continue;

          const stId = normalizeStationId(r[0]);
          const pos = Number(r[1]) || i - 4;
          const cbCondRaw = String(r[5] || '').trim().toUpperCase();
          const foneCondRaw = String(r[6] || '').trim().toUpperCase();

          const cbCond: ChromebookItemCondition = CHROMEBOOK_CONDITIONS.includes(cbCondRaw as any)
            ? (cbCondRaw as ChromebookItemCondition)
            : 'ÓTIMO';
          const foneCond: HeadphoneItemCondition = HEADPHONE_CONDITIONS.includes(foneCondRaw as any)
            ? (foneCondRaw as HeadphoneItemCondition)
            : foneNum
              ? 'ÓTIMO'
              : 'AUSENTE';

          const existing = pairs.find(p => p.stationId === stId && p.positionNumber === pos);
          await savePair(
            {
              stationId: stId,
              stationLocation: existing?.stationLocation || getStationDefaultLocation(stId),
              positionNumber: pos,
              chromebookNumber: cbNum,
              headphoneNumber: foneNum,
              heritageNumber: heritageRaw,
              serialNumber: existing?.serialNumber || '',
              brand: existing?.brand || 'Positivo',
              model: existing?.model || 'Chromebook',
              hasCharger: existing?.hasCharger ?? true,
              chromebookCondition: cbCond,
              headphoneCondition: foneCond,
              operationalStatus: cbCond === 'INOPERANTE' || cbCond === 'PÉSSIMO' ? 'INSERVIVEL' : cbCond === 'COM AVARIA' ? 'EM_MANUTENCAO' : 'DISPONIVEL',
              acquisitionYear: existing?.acquisitionYear || '2027',
              acquisitionDocument: existing?.acquisitionDocument || 'PLANILHA EECM 2027',
              notes: String(r[7] || '').trim(),
              linkedAssetId: existing?.linkedAssetId || null
            },
            existing?.id,
            mirrorToInventory
          );
          importedPairs++;
        }
      }

      // 2. Aba Utilizacoes
      const useWs = wb.Sheets['Utilizacoes'];
      if (useWs) {
        const rows: any[][] = XLSX.utils.sheet_to_json(useWs, { header: 1, defval: '' });
        for (let i = 5; i < rows.length; i++) {
          const r = rows[i];
          const studentName = String(r[5] || '').trim();
          const teacherName = String(r[4] || '').trim();
          if (!studentName && !teacherName) continue;
          const rawDate = String(r[0] || '').trim();
          const isoDate = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
          await saveUsage({
            date: isoDate,
            stationId: normalizeStationId(r[1]),
            classroomName: String(r[2] || '').trim(),
            shift: (String(r[3] || 'MATUTINO').toUpperCase().includes('VESP') ? 'VESPERTINO' : 'MATUTINO'),
            teacherName,
            studentName,
            chromebookNumber: String(r[6] || '').trim(),
            headphoneNumber: String(r[7] || '').trim(),
            checkoutTime: String(r[8] || '').trim(),
            returnTime: String(r[9] || '').trim(),
            situation: String(r[10] || '').toUpperCase().includes('DEVOLV') || String(r[9] || '').trim() ? 'DEVOLVIDO' : 'EM USO',
            hasIrregularity: String(r[11] || '').toUpperCase().startsWith('S'),
            observations: String(r[12] || '').trim(),
            studentLeaderSupport: String(r[13] || '').trim(),
            checkedByTeacher: String(r[14] || '').toUpperCase().startsWith('S')
          });
          importedUsages++;
        }
      }

      // 3. Aba Conferencia
      const confWs = wb.Sheets['Conferencia'];
      if (confWs) {
        const rows: any[][] = XLSX.utils.sheet_to_json(confWs, { header: 1, defval: '' });
        for (let i = 5; i < rows.length; i++) {
          const r = rows[i];
          const guardName = String(r[2] || '').trim();
          if (!guardName) continue;
          const rawDate = String(r[0] || '').trim();
          const isoDate = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
          await saveInspection({
            date: isoDate,
            stationId: normalizeStationId(r[1]),
            guardName,
            registeredChromebooks: Number(r[3]) || 0,
            registeredHeadphones: Number(r[4]) || 0,
            checkedChromebooks: Number(r[5]) || 0,
            checkedHeadphones: Number(r[6]) || 0,
            compartmentsClosed: !String(r[7] || '').toUpperCase().startsWith('N'),
            visibleDamage: String(r[8] || '').toUpperCase().startsWith('S'),
            observations: String(r[9] || '').trim(),
            result: String(r[10] || '').toUpperCase().includes('IRREG')
              ? 'IRREGULAR'
              : String(r[10] || '').toUpperCase().includes('PEND')
                ? 'COM PENDÊNCIA'
                : 'REGULAR'
          });
          importedInspections++;
        }
      }

      // 4. Aba Ocorrencias
      const occWs = wb.Sheets['Ocorrencias'];
      if (occWs) {
        const rows: any[][] = XLSX.utils.sheet_to_json(occWs, { header: 1, defval: '' });
        for (let i = 5; i < rows.length; i++) {
          const r = rows[i];
          const desc = String(r[5] || '').trim();
          if (!desc) continue;
          const rawDate = String(r[0] || '').trim();
          const isoDate = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
          const statusRaw = String(r[9] || '').toUpperCase();
          await saveOccurrence(
            {
              date: isoDate,
              stationId: normalizeStationId(r[1]),
              chromebookNumber: String(r[2] || '').trim(),
              headphoneNumber: String(r[3] || '').trim(),
              occurrenceType: String(r[4] || 'Outro').trim(),
              description: desc,
              reportedTo: String(r[6] || '').trim(),
              responsiblePerson: String(r[7] || '').trim(),
              deadline: String(r[8] || '').slice(0, 10),
              status: statusRaw.includes('CONCL') ? 'CONCLUÍDA' : statusRaw.includes('ANDAM') ? 'EM ANDAMENTO' : 'PENDENTE',
              resolution: String(r[10] || '').trim()
            },
            undefined,
            false
          );
          importedOccurrences++;
        }
      }

      return { importedPairs, importedUsages, importedInspections, importedOccurrences };
    },
    [pairs, savePair, saveUsage, saveInspection, saveOccurrence]
  );

  // ===========================================================================
  // INDICADORES CONSOLIDADOS (PAINEL DA PLANILHA + PATRIMÔNIO)
  // ===========================================================================
  const dashboardStats = useMemo(() => {
    const chromebooksRegistered = pairs.filter(p => p.chromebookNumber.trim() !== '').length;
    const headphonesRegistered = pairs.filter(p => p.headphoneNumber.trim() !== '').length;
    const mirroredInInventory = pairs.filter(p => Boolean(p.linkedAssetId)).length;
    const defectiveCount = pairs.filter(
      p =>
        p.chromebookCondition === 'COM AVARIA' ||
        p.chromebookCondition === 'INOPERANTE' ||
        p.chromebookCondition === 'PÉSSIMO' ||
        p.headphoneCondition === 'COM AVARIA' ||
        p.headphoneCondition === 'PÉSSIMO'
    ).length;
    const missingChargers = pairs.filter(p => p.chromebookNumber.trim() !== '' && !p.hasCharger).length;
    const openUsages = usages.filter(u => u.situation === 'EM USO').length;
    const occTotal = occurrences.length;
    const occPending = occurrences.filter(o => o.status === 'PENDENTE').length;
    const occInProgress = occurrences.filter(o => o.status === 'EM ANDAMENTO').length;
    const occDone = occurrences.filter(o => o.status === 'CONCLUÍDA').length;

    const byStation = CHROMEBOOK_STATIONS.map(st => {
      const list = pairs.filter(p => p.stationId === st.id);
      const cbCount = list.filter(p => p.chromebookNumber.trim() !== '').length;
      const fnCount = list.filter(p => p.headphoneNumber.trim() !== '').length;
      const defects = list.filter(
        p =>
          p.chromebookCondition === 'COM AVARIA' ||
          p.chromebookCondition === 'INOPERANTE' ||
          p.chromebookCondition === 'PÉSSIMO' ||
          p.headphoneCondition === 'COM AVARIA'
      ).length;
      const synced = list.filter(p => Boolean(p.linkedAssetId)).length;
      const openUses = usages.filter(u => u.stationId === st.id && u.situation === 'EM USO').length;
      return {
        ...st,
        items: list,
        chromebooksCount: cbCount,
        headphonesCount: fnCount,
        pairDiff: Math.abs(cbCount - fnCount),
        defects,
        synced,
        openUses
      };
    });

    return {
      stationsCount: CHROMEBOOK_STATIONS.length,
      chromebooksRegistered,
      headphonesRegistered,
      mirroredInInventory,
      defectiveCount,
      missingChargers,
      totalUsages: usages.length,
      openUsages,
      occTotal,
      occPending,
      occInProgress,
      occDone,
      byStation
    };
  }, [pairs, usages, occurrences]);

  const exportToExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // 1. Painel
    const painelRows: any[][] = [
      ['PAINEL DE CONTROLE | ESTAÇÕES DE CHROMEBOOKS E FONES'],
      ['EECM ANDRÉ ANTÔNIO MAGGI • COLÍDER-MT • CONTROLE OPERACIONAL E PATRIMONIAL'],
      [],
      ['INDICADOR', 'TOTAL', '', 'OCORRÊNCIAS', 'TOTAL'],
      ['Estações de guarda', dashboardStats.stationsCount, '', 'Registradas', dashboardStats.occTotal],
      ['Chromebooks cadastrados', dashboardStats.chromebooksRegistered, '', 'Pendentes', dashboardStats.occPending],
      ['Fones cadastrados', dashboardStats.headphonesRegistered, '', 'Em andamento', dashboardStats.occInProgress],
      ['Espelhados no Inventário Patrimonial', dashboardStats.mirroredInInventory, '', 'Concluídas', dashboardStats.occDone],
      ['Registros de uso', dashboardStats.totalUsages, '', '', ''],
      ['Utilizações em aberto', dashboardStats.openUsages, '', '', ''],
      [],
      ['SITUAÇÃO POR ESTAÇÃO'],
      ['Estação', 'Chromebooks cadastrados', 'Fones cadastrados', 'Diferença entre pares', 'No Inventário Patrimonial'],
      ...dashboardStats.byStation.map(s => [s.id, s.chromebooksCount, s.headphonesCount, s.pairDiff, s.synced]),
      [],
      ['Atenção: a diferença entre pares não comprova extravio; representa apenas cadastros ainda incompletos.'],
      ['Utilização: professor confere devolução; líder e vice-líder auxiliam; vigia verifica segurança da guarda.']
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(painelRows), 'Painel');

    // 2. Cadastro (5 estações x 20 posições + extras)
    const cadRows: any[][] = [
      ['CADASTRO DOS PARES | CHROMEBOOK + FONE (COM PATRIMÔNIO)'],
      [],
      ['Preencha os identificadores reais. As posições são espaços disponíveis, não equipamentos fictícios.'],
      [],
      ['Estação', 'Posição', 'Nº Chromebook', 'Nº Fone', 'Nº patrimônio / série', 'Condição Chromebook', 'Condição Fone', 'Observações', 'Marca/Modelo', 'Carregador', 'Status', 'No Inventário?']
    ];
    CHROMEBOOK_STATIONS.forEach(st => {
      const stationPairs = pairs.filter(p => p.stationId === st.id);
      const maxPos = Math.max(st.defaultSlots, ...stationPairs.map(p => p.positionNumber));
      for (let pos = 1; pos <= maxPos; pos++) {
        const found = stationPairs.find(p => p.positionNumber === pos);
        if (found) {
          const patSer = [found.heritageNumber, found.serialNumber ? `N/S ${found.serialNumber}` : ''].filter(Boolean).join(' / ');
          cadRows.push([
            st.id,
            pos,
            found.chromebookNumber,
            found.headphoneNumber,
            patSer,
            found.chromebookCondition,
            found.headphoneCondition,
            found.notes,
            `${found.brand} ${found.model}`.trim(),
            found.hasCharger ? 'Sim' : 'Não',
            found.operationalStatus,
            found.linkedAssetId ? 'Sim' : 'Não'
          ]);
        } else {
          cadRows.push([st.id, pos, '', '', '', '', '', '', '', '', '', '']);
        }
      }
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cadRows), 'Cadastro');

    // 3. Utilizacoes
    const useRows: any[][] = [
      ['CONTROLE DE RETIRADA E DEVOLUÇÃO'],
      [],
      ['Uma linha por estudante e par utilizado. Preencha a devolução somente após a conferência do professor.'],
      [],
      ['Data', 'Estação', 'Turma', 'Turno', 'Professor', 'Estudante', 'Nº Chromebook', 'Nº Fone', 'Hora retirada', 'Hora devolução', 'Situação', 'Irregularidade?', 'Observações', 'Líder / vice-líder (apoio)', 'Conferido pelo professor?'],
      ...usages.map(u => [
        u.date,
        u.stationId,
        u.classroomName,
        u.shift,
        u.teacherName,
        u.studentName,
        u.chromebookNumber,
        u.headphoneNumber,
        u.checkoutTime,
        u.returnTime,
        u.situation,
        u.hasIrregularity ? 'Sim' : 'Não',
        u.observations,
        u.studentLeaderSupport,
        u.checkedByTeacher ? 'Sim' : 'Não'
      ])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(useRows), 'Utilizacoes');

    // 4. Conferencia
    const confRows: any[][] = [
      ['CHECKLIST DE GUARDA | CINCO ESTAÇÕES'],
      [],
      ['Conferência dos vigias: guarda e segurança física. O professor confere a devolução dos pares utilizados.'],
      [],
      ['Data', 'Estação', 'Vigia', 'Qtd Chrome. cadastrados', 'Qtd fones cadastrados', 'Qtd Chrome. conferidos', 'Qtd fones conferidos', 'Compartimentos fechados?', 'Danos aparentes?', 'Observações / Comunicação', 'Resultado'],
      ...inspections.map(i => [
        i.date,
        i.stationId,
        i.guardName,
        i.registeredChromebooks,
        i.registeredHeadphones,
        i.checkedChromebooks,
        i.checkedHeadphones,
        i.compartmentsClosed ? 'Sim' : 'Não',
        i.visibleDamage ? 'Sim' : 'Não',
        i.observations,
        i.result
      ])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(confRows), 'Conferencia');

    // 5. Ocorrencias
    const occRows: any[][] = [
      ['REGISTRO E TRATAMENTO DE IRREGULARIDADES'],
      [],
      ['Registre danos, fones faltantes, equipamentos ausentes e situações que exigem providências da direção.'],
      [],
      ['Data', 'Estação', 'Chromebook', 'Fone', 'Tipo de ocorrência', 'Descrição objetiva', 'Comunicado a', 'Responsável pela providência', 'Prazo', 'Status', 'Conclusão / providências'],
      ...occurrences.map(o => [
        o.date,
        o.stationId,
        o.chromebookNumber,
        o.headphoneNumber,
        o.occurrenceType,
        o.description,
        o.reportedTo,
        o.responsiblePerson,
        o.deadline,
        o.status,
        o.resolution
      ])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(occRows), 'Ocorrencias');

    // 6. Orientacoes
    const oriRows: any[][] = [
      ['COMO UTILIZAR O CONTROLE DE CHROMEBOOKS E FONES'],
      [],
      ...ORIENTACOES_OFICIAIS.flatMap(o => [[`${o.code} | ${o.title}`], [o.text], []])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(oriRows), 'Orientacoes');

    // 7. Ficha de Controle (modelo limpo)
    const fichaRows: any[][] = [
      ['EECM ANDRÉ ANTÔNIO MAGGI'],
      ['FICHA DE CONTROLE DE CHROMEBOOKS E FONES DE OUVIDO'],
      [],
      ['Turma:', '', 'Turno:', '', 'Data:', '', 'Estação (01 a 05):', ''],
      ['Professor:', '', '', '', '', '', '', ''],
      ['Líder de turma:', '', '', '', 'Vice-líder:', '', '', ''],
      [],
      ['REGISTRO INDIVIDUAL DE RETIRADA E DEVOLUÇÃO'],
      ['Nº', 'Nome do estudante', 'Nº Chromebook', 'Nº Fone', 'Retirada', 'Devolução', 'Condição/observação', 'Conferido'],
      ...Array.from({ length: 35 }, (_, i) => [i + 1, '', '', '', '', '', '', '']),
      [],
      ['Chromebooks retirados:', '', 'Chromebooks devolvidos:', '', 'Fones retirados:', '', 'Fones devolvidos:', ''],
      ['Conferência final:', '', 'Sim / Não', 'Irregularidade:', '', 'Sim / Não', '', ''],
      [],
      ['DESCRIÇÃO DA IRREGULARIDADE / PROVIDÊNCIA'],
      [],
      ['Conferência do professor: ______________________________', '', '', '', 'Vigia (guarda): ______________________________']
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fichaRows), 'Ficha de Controle');

    XLSX.writeFile(wb, `Controle_Chromebooks_Fones_EECM_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [dashboardStats, pairs, usages, inspections, occurrences]);

  return {
    pairs,
    usages,
    inspections,
    occurrences,
    classrooms,
    students,
    dashboardStats,
    isLoading,
    dedicatedTablesReady,
    refresh: loadAll,
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
  };
};
